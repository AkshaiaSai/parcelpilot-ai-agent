"""
Actions Tool — two-phase action creation with pending/confirm/cancel flow.

Supports: create_escalation, update_ticket, create_follow_up_task.
Actions are stored in the action_log SQLite table.
The agent proposes actions (status=pending), and a separate API call
confirms or cancels them — the agent cannot execute in the same turn.
"""

import json
import sqlite3
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from langchain_core.tools import tool

from app.config import SQLITE_DB_PATH, SNAPSHOT_TIMESTAMP

IST = timezone(timedelta(hours=5, minutes=30))

ALLOWED_ACTION_TYPES = {"create_escalation", "update_ticket", "create_follow_up_task"}


def _get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(SQLITE_DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def propose_action(
    action_type: str,
    details: dict,
    created_by: str = "agent",
    related_ticket_id: Optional[str] = None,
    related_order_id: Optional[str] = None,
    related_account_id: Optional[str] = None,
) -> dict:
    """
    Create a pending action in the action log.
    Returns the pending action details for user confirmation.
    """
    if action_type not in ALLOWED_ACTION_TYPES:
        return {
            "error": f"Invalid action type: {action_type}. "
                     f"Allowed: {ALLOWED_ACTION_TYPES}"
        }

    action_id = f"ACT-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(IST).isoformat()

    conn = _get_connection()
    try:
        conn.execute(
            """INSERT INTO action_log
               (action_id, action_type, status, details, created_by,
                created_at, related_ticket_id, related_order_id, related_account_id)
               VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)""",
            (
                action_id,
                action_type,
                json.dumps(details),
                created_by,
                now,
                related_ticket_id,
                related_order_id,
                related_account_id,
            ),
        )
        conn.commit()
        return {
            "action_id": action_id,
            "action_type": action_type,
            "status": "pending",
            "details": details,
            "created_by": created_by,
            "related_ticket_id": related_ticket_id,
            "related_order_id": related_order_id,
            "related_account_id": related_account_id,
            "message": "Action proposed. Awaiting user confirmation.",
        }
    except Exception as e:
        return {"error": f"Failed to create action: {str(e)}"}
    finally:
        conn.close()


def confirm_action(action_id: str) -> dict:
    """Confirm and execute a pending action."""
    conn = _get_connection()
    try:
        cursor = conn.execute(
            "SELECT * FROM action_log WHERE action_id = ?",
            (action_id,),
        )
        row = cursor.fetchone()
        if not row:
            return {"error": f"Action not found: {action_id}"}

        row_dict = dict(row)
        if row_dict["status"] != "pending":
            return {"error": f"Action {action_id} is already {row_dict['status']}"}

        now = datetime.now(IST).isoformat()
        conn.execute(
            "UPDATE action_log SET status = 'confirmed', confirmed_at = ? WHERE action_id = ?",
            (now, action_id),
        )
        conn.commit()
        return {
            "action_id": action_id,
            "status": "confirmed",
            "message": f"Action {action_id} confirmed and executed.",
            "confirmed_at": now,
        }
    except Exception as e:
        return {"error": f"Failed to confirm action: {str(e)}"}
    finally:
        conn.close()


def cancel_action(action_id: str) -> dict:
    """Cancel a pending action."""
    conn = _get_connection()
    try:
        cursor = conn.execute(
            "SELECT * FROM action_log WHERE action_id = ?",
            (action_id,),
        )
        row = cursor.fetchone()
        if not row:
            return {"error": f"Action not found: {action_id}"}

        row_dict = dict(row)
        if row_dict["status"] != "pending":
            return {"error": f"Action {action_id} is already {row_dict['status']}"}

        conn.execute(
            "UPDATE action_log SET status = 'cancelled' WHERE action_id = ?",
            (action_id,),
        )
        conn.commit()
        return {
            "action_id": action_id,
            "status": "cancelled",
            "message": f"Action {action_id} cancelled.",
        }
    except Exception as e:
        return {"error": f"Failed to cancel action: {str(e)}"}
    finally:
        conn.close()


def get_pending_actions(user_id: Optional[str] = None) -> list[dict]:
    """Get all pending actions, optionally filtered by creator."""
    conn = _get_connection()
    try:
        if user_id:
            cursor = conn.execute(
                "SELECT * FROM action_log WHERE status = 'pending' AND created_by = ?",
                (user_id,),
            )
        else:
            cursor = conn.execute(
                "SELECT * FROM action_log WHERE status = 'pending'"
            )
        rows = []
        for row in cursor.fetchall():
            d = dict(row)
            # Parse details JSON
            if d.get("details"):
                try:
                    d["details"] = json.loads(d["details"])
                except (json.JSONDecodeError, TypeError):
                    pass
            rows.append(d)
        return rows
    finally:
        conn.close()


@tool
def create_action(
    action_type: str,
    reason: str,
    priority: str = "medium",
    related_ticket_id: Optional[str] = None,
    related_order_id: Optional[str] = None,
    related_account_id: Optional[str] = None,
    additional_details: Optional[str] = None,
) -> str:
    """Propose an action for user confirmation. The action will NOT be executed immediately —
    it will be shown to the user for review and requires explicit confirmation.

    Use this tool to:
    - Escalate a ticket to a manager or specialized team
    - Update a ticket with notes or status changes
    - Create a follow-up task for further investigation

    IMPORTANT: Never propose and confirm an action in the same turn.
    The user must review and confirm the action through the UI.

    Args:
        action_type: Type of action. One of: 'create_escalation', 'update_ticket', 'create_follow_up_task'
        reason: Clear explanation of why this action is needed
        priority: Priority level: 'critical', 'high', 'medium', 'low'
        related_ticket_id: Optional ticket ID this action relates to
        related_order_id: Optional order ID this action relates to
        related_account_id: Optional account ID this action relates to
        additional_details: Any additional context or instructions for the action
    """
    details = {
        "reason": reason,
        "priority": priority,
    }
    if additional_details:
        details["additional_details"] = additional_details

    result = propose_action(
        action_type=action_type,
        details=details,
        created_by="agent",  # Will be overridden with actual user
        related_ticket_id=related_ticket_id,
        related_order_id=related_order_id,
        related_account_id=related_account_id,
    )

    return json.dumps(result, indent=2)
