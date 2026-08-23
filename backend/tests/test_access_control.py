"""
Unit tests for access control and structural data scoping.
"""

import pytest
from app.access_control.auth import (
    get_user,
    validate_user,
    apply_data_scope,
    check_credit_approval,
    MOCK_USERS,
)
from app.tools.structured_data import query_structured_data_impl


def test_mock_users_exist():
    """Verify Rohit and Maya mock users are defined."""
    assert "Rohit" in MOCK_USERS
    assert "Maya" in MOCK_USERS
    
    rohit = get_user("Rohit")
    assert rohit.role == "support_agent"
    assert not rohit.can_approve_credits
    assert len(rohit.accessible_accounts) == 4

    maya = get_user("Maya")
    assert maya.role == "ops_manager"
    assert maya.can_approve_credits
    assert len(maya.accessible_accounts) == 4


def test_validate_user_invalid():
    """Verify unauthorized users are rejected."""
    with pytest.raises(ValueError, match="Unauthorized user"):
        validate_user("UnknownHacker")


def test_credit_approval_limits():
    """Verify credit approval thresholds (₹1000 limit for agents)."""
    rohit = get_user("Rohit")
    maya = get_user("Maya")

    # ₹500 credit: Rohit can approve (<= 1000)
    res_500 = check_credit_approval(rohit, 500.0)
    assert not res_500["needs_manager_approval"]
    assert res_500["approved"]

    # ₹1500 credit: Rohit CANNOT approve (> 1000)
    res_1500_rohit = check_credit_approval(rohit, 1500.0)
    assert res_1500_rohit["needs_manager_approval"]
    assert not res_1500_rohit["user_can_approve"]
    assert not res_1500_rohit["approved"]

    # ₹1500 credit: Maya (Manager) CAN approve
    res_1500_maya = check_credit_approval(maya, 1500.0)
    assert res_1500_maya["needs_manager_approval"]
    assert res_1500_maya["user_can_approve"]
    assert res_1500_maya["approved"]


def test_structural_data_scoping_in_sqlite():
    """Verify that structured_data queries structurally filter by accessible_accounts."""
    # Scope restricted to only ACCT-001
    scoped_rows = query_structured_data_impl(
        table="orders",
        accessible_accounts=["ACCT-001"]
    )
    for row in scoped_rows:
        assert row["account_id"] == "ACCT-001"

    # Verify orders from other accounts are not present
    account_ids = {row["account_id"] for row in scoped_rows}
    assert "ACCT-002" not in account_ids
    assert "ACCT-003" not in account_ids
