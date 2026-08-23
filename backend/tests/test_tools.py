"""
Unit tests for the three agent tools:
1. document_search
2. structured_data
3. actions (two-phase create -> confirm / cancel)
"""

import json
import pytest
from app.tools.structured_data import (
    query_structured_data_impl,
    calculate_time_since,
)
from app.tools.actions import (
    propose_action,
    confirm_action,
    cancel_action,
    get_pending_actions,
)


def test_structured_data_query_accounts():
    """Verify querying accounts returns data properly."""
    rows = query_structured_data_impl("accounts", filters={"account_id": "ACCT-001"})
    assert len(rows) == 1
    assert rows[0]["account_name"] == "Northstar Logistics"
    assert rows[0]["plan"] == "Enterprise"


def test_structured_data_query_orders_and_time():
    """Verify querying orders and calculating time relative to snapshot."""
    rows = query_structured_data_impl("orders", filters={"order_id": "ORD-2002"})
    assert len(rows) == 1
    assert rows[0]["account_id"] == "ACCT-002"
    assert rows[0]["carrier_fault"] == 1

    # ORD-2002 pickup window end was 2026-08-16 06:30.
    # Snapshot is 2026-08-16 11:00. Difference is 4.5 hours (270 mins).
    time_calc = calculate_time_since(rows[0]["pickup_window_end"])
    assert time_calc["minutes_elapsed"] == 270.0
    assert time_calc["hours_elapsed"] == 4.5
    assert "4h 30m" in time_calc["human_readable"]


def test_actions_two_phase_lifecycle():
    """Verify actions proposal, pending state, and confirmation."""
    # 1. Propose action
    res = propose_action(
        action_type="create_escalation",
        details={"reason": "Security incident API key exposed", "priority": "critical"},
        created_by="Rohit",
        related_ticket_id="TKT-505",
        related_account_id="ACCT-004",
    )
    assert "action_id" in res
    action_id = res["action_id"]
    assert res["status"] == "pending"

    # 2. Check pending list
    pending = get_pending_actions()
    pending_ids = [p["action_id"] for p in pending]
    assert action_id in pending_ids

    # 3. Confirm action
    conf = confirm_action(action_id)
    assert conf["status"] == "confirmed"

    # 4. Check not pending anymore
    pending_after = get_pending_actions()
    pending_after_ids = [p["action_id"] for p in pending_after]
    assert action_id not in pending_after_ids
