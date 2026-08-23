"""
Access Control — mock authentication and structural data scoping.

Two mock users: Rohit (support agent) and Maya (ops manager).
Both are authorised internal staff with access to all accounts.
Data scoping is enforced structurally in the data/tool layer
(SQL WHERE clause injection, ChromaDB metadata filtering) —
NOT via system prompt instructions alone.
"""

from typing import Optional

from app.models.schemas import UserInfo


# --- Mock user database ---
MOCK_USERS: dict[str, UserInfo] = {
    "Rohit": UserInfo(
        username="Rohit",
        role="support_agent",
        display_name="Rohit Sharma",
        # Internal staff — access to all accounts
        accessible_accounts=["ACCT-001", "ACCT-002", "ACCT-003", "ACCT-004"],
        can_approve_credits=False,
    ),
    "Maya": UserInfo(
        username="Maya",
        role="ops_manager",
        display_name="Maya Patel",
        # Internal staff — access to all accounts
        accessible_accounts=["ACCT-001", "ACCT-002", "ACCT-003", "ACCT-004"],
        can_approve_credits=True,
    ),
}


def get_user(username: str) -> Optional[UserInfo]:
    """
    Look up a mock user by username.
    Returns None if user not found (unauthorized).
    """
    return MOCK_USERS.get(username)


def validate_user(username: str) -> UserInfo:
    """
    Validate and return user info. Raises ValueError if not found.
    """
    user = get_user(username)
    if user is None:
        raise ValueError(f"Unauthorized user: {username}")
    return user


def get_accessible_accounts(username: str) -> list[str]:
    """
    Get the list of account IDs a user can access.
    This is the structural enforcement mechanism —
    tools use this to inject WHERE clauses.
    """
    user = get_user(username)
    if user is None:
        return []
    return user.accessible_accounts


def apply_data_scope(user: UserInfo) -> dict:
    """
    Returns scoping parameters to be injected into tool calls.
    This dict is passed to tool implementations to enforce
    access control at the data layer.

    Returns a dict with:
        - accessible_accounts: list of account IDs
        - can_approve_credits: whether user can approve credits
        - role: user's role string
    """
    return {
        "accessible_accounts": user.accessible_accounts,
        "can_approve_credits": user.can_approve_credits,
        "role": user.role,
    }


def check_credit_approval(user: UserInfo, amount: float) -> dict:
    """
    Check whether a user can approve a service credit of the given amount.
    Per SOP: credits > ₹1,000 need manager approval.
    """
    needs_manager = amount > 1000
    can_approve = user.can_approve_credits

    return {
        "amount": amount,
        "needs_manager_approval": needs_manager,
        "user_can_approve": can_approve,
        "approved": can_approve or not needs_manager,
        "message": (
            f"Credit of ₹{amount:.0f} "
            + ("approved." if (can_approve or not needs_manager) else
               "requires manager approval. Please escalate to an ops manager.")
        ),
    }
