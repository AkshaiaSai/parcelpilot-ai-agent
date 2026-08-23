"""
Structured Data Tool — safe, parameterized queries over SQLite.

Provides a constrained query interface (no raw SQL) over
accounts, orders, tickets, and action_log tables.
Supports lookups, filtering, and time calculations.
Access control is enforced structurally via SQL WHERE clauses.
"""

import json
import sqlite3
from datetime import datetime, timezone, timedelta
from typing import Optional

from langchain_core.tools import tool

from app.config import SQLITE_DB_PATH, SNAPSHOT_TIMESTAMP

# Allowed tables and their columns (whitelist — prevents SQL injection)
ALLOWED_TABLES = {
    "accounts": [
        "account_id", "account_name", "plan", "status", "csm",
        "contract_file", "premium_support", "notes",
    ],
    "orders": [
        "order_id", "account_id", "carrier", "status", "booked_at",
        "pickup_window_start", "pickup_window_end", "pickup_actual_at",
        "shipment_fee_inr", "carrier_fault", "customer_fault",
        "cancellation_requested_at", "notes",
    ],
    "tickets": [
        "ticket_id", "account_id", "created_at", "status", "subject",
        "description", "channel", "assigned_to", "last_customer_message_at",
        "historical_resolution",
    ],
    "action_log": [
        "action_id", "action_type", "status", "details", "created_by",
        "created_at", "confirmed_at", "related_ticket_id",
        "related_order_id", "related_account_id",
    ],
}

# Allowed filter operators
ALLOWED_OPERATORS = {"=", "!=", ">", "<", ">=", "<=", "LIKE", "IS NULL", "IS NOT NULL", "IN"}

# Snapshot time for time calculations
IST = timezone(timedelta(hours=5, minutes=30))
SNAPSHOT_DT = datetime.fromisoformat(SNAPSHOT_TIMESTAMP)


def _get_connection() -> sqlite3.Connection:
    """Get a SQLite connection with row factory."""
    conn = sqlite3.connect(str(SQLITE_DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def query_structured_data_impl(
    table: str,
    filters: Optional[dict] = None,
    columns: Optional[list[str]] = None,
    order_by: Optional[str] = None,
    limit: int = 50,
    accessible_accounts: Optional[list[str]] = None,
) -> list[dict]:
    """
    Core implementation of structured data query.

    Args:
        table: Table to query (accounts, orders, tickets, action_log)
        filters: Dict of {column: value} or {column: {"op": operator, "value": value}}
        columns: Columns to return (default: all)
        order_by: Column to sort by (optional)
        limit: Max rows to return
        accessible_accounts: Structural access control — filters to these accounts
    """
    # Validate table
    if table not in ALLOWED_TABLES:
        return [{"error": f"Invalid table: {table}. Allowed: {list(ALLOWED_TABLES.keys())}"}]

    allowed_cols = ALLOWED_TABLES[table]

    # Validate columns
    if columns:
        invalid = [c for c in columns if c not in allowed_cols]
        if invalid:
            return [{"error": f"Invalid columns for {table}: {invalid}"}]
        select_cols = ", ".join(columns)
    else:
        select_cols = "*"

    # Build query
    sql = f"SELECT {select_cols} FROM {table}"
    params = []
    where_parts = []

    # --- Structural access control ---
    # Inject account scoping regardless of what the LLM requested
    if accessible_accounts is not None and table in ("orders", "tickets", "action_log"):
        placeholders = ", ".join(["?"] * len(accessible_accounts))
        where_parts.append(f"account_id IN ({placeholders})")
        params.extend(accessible_accounts)
    elif accessible_accounts is not None and table == "accounts":
        placeholders = ", ".join(["?"] * len(accessible_accounts))
        where_parts.append(f"account_id IN ({placeholders})")
        params.extend(accessible_accounts)

    # Apply user-specified filters
    if filters:
        for col, condition in filters.items():
            if col not in allowed_cols:
                return [{"error": f"Invalid filter column: {col}"}]

            if isinstance(condition, dict):
                op = condition.get("op", "=").upper()
                val = condition.get("value")
                if op not in ALLOWED_OPERATORS:
                    return [{"error": f"Invalid operator: {op}"}]
                if op in ("IS NULL", "IS NOT NULL"):
                    where_parts.append(f"{col} {op}")
                elif op == "IN" and isinstance(val, list):
                    placeholders = ", ".join(["?"] * len(val))
                    where_parts.append(f"{col} IN ({placeholders})")
                    params.extend(val)
                else:
                    where_parts.append(f"{col} {op} ?")
                    params.append(val)
            else:
                where_parts.append(f"{col} = ?")
                params.append(condition)

    if where_parts:
        sql += " WHERE " + " AND ".join(where_parts)

    # Order by
    if order_by and order_by in allowed_cols:
        sql += f" ORDER BY {order_by}"

    sql += f" LIMIT ?"
    params.append(limit)

    # Execute
    conn = _get_connection()
    try:
        cursor = conn.execute(sql, params)
        rows = [dict(row) for row in cursor.fetchall()]
        return rows
    except Exception as e:
        return [{"error": f"Query failed: {str(e)}"}]
    finally:
        conn.close()


def calculate_time_since(timestamp_str: str) -> dict:
    """Calculate minutes since a given timestamp relative to the dataset snapshot time."""
    if not timestamp_str:
        return {"error": "No timestamp provided"}

    try:
        # Parse the timestamp (format: "2026-08-16 09:00")
        dt = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M")
        dt = dt.replace(tzinfo=IST)
        diff = SNAPSHOT_DT - dt
        total_minutes = diff.total_seconds() / 60
        hours = int(total_minutes // 60)
        minutes = int(total_minutes % 60)
        return {
            "timestamp": timestamp_str,
            "snapshot_time": SNAPSHOT_TIMESTAMP,
            "minutes_elapsed": round(total_minutes, 1),
            "hours_elapsed": round(total_minutes / 60, 2),
            "human_readable": f"{hours}h {minutes}m",
        }
    except Exception as e:
        return {"error": f"Failed to parse timestamp: {str(e)}"}


@tool
def query_structured_data(
    table: str,
    filters: Optional[dict] = None,
    columns: Optional[list[str]] = None,
    calculate_time_from: Optional[str] = None,
) -> str:
    """Query ParcelPilot's structured database for accounts, orders, tickets, and action log data.

    Use this tool to:
    - Look up specific accounts, orders, or tickets by ID
    - Find orders for a specific account
    - Check ticket status and history
    - Calculate elapsed time (e.g., how long since pickup window ended)

    Args:
        table: Which table to query. One of: 'accounts', 'orders', 'tickets', 'action_log'
        filters: Filter conditions as a dict. Simple: {"order_id": "ORD-1001"}.
                 With operators: {"status": {"op": "=", "value": "open"}}.
                 Supported operators: =, !=, >, <, >=, <=, LIKE, IS NULL, IS NOT NULL, IN
        columns: Optional list of specific columns to return. Default returns all columns.
        calculate_time_from: Optional timestamp string to calculate elapsed time from
                            (relative to dataset snapshot 2026-08-16 11:00 IST).
                            Format: "YYYY-MM-DD HH:MM". Use this to calculate how long
                            ago something happened (e.g., pickup window end time).
    """
    results_parts = []

    # Execute query
    rows = query_structured_data_impl(
        table=table,
        filters=filters,
        columns=columns,
    )

    if rows and "error" in rows[0]:
        return json.dumps(rows[0])

    results_parts.append(f"Query: {table} | Filters: {filters or 'none'}")
    results_parts.append(f"Found {len(rows)} row(s):\n")

    for row in rows:
        results_parts.append(json.dumps(row, indent=2, default=str))

    # Calculate time if requested
    if calculate_time_from:
        time_result = calculate_time_since(calculate_time_from)
        results_parts.append(f"\nTime calculation from {calculate_time_from}:")
        results_parts.append(json.dumps(time_result, indent=2))

    return "\n".join(results_parts)
