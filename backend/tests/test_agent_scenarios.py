"""
End-to-End Agent Scenario Tests.

Validates the agent's multi-step reasoning, source precedence weighing,
and avoidance of historical resolution traps:
1. Northstar ORD-1001 cancellation fee override (contract vs policy)
2. ORD-2002 LumenWorks service credit calculation (>4 hrs late, ₹300 contract override)
3. TKT-450 / TKT-451 historical resolution traps (must NOT repeat wrong advice)
4. TKT-505 security escalation trigger
"""

import pytest
import asyncio
from app.agent.graph import run_agent
from app.access_control.auth import get_user, apply_data_scope


@pytest.fixture
def rohit_context():
    user = get_user("Rohit")
    scope = apply_data_scope(user)
    return {
        "username": user.username,
        "role": scope["role"],
        "accessible_accounts": scope["accessible_accounts"],
        "can_approve_credits": scope["can_approve_credits"],
    }


@pytest.mark.asyncio
async def test_scenario_northstar_cancellation(rohit_context):
    """
    Question: 'Can Northstar cancel ORD-1001 without a cancellation fee? Explain why.'
    Expected: Northstar's contract overrides standard SOP, so NO fee applies pre-pickup.
    """
    message = "Can Northstar cancel ORD-1001 without a cancellation fee? Explain why."
    result = await run_agent(message, [], rohit_context)

    response_text = result["response"].lower()
    assert "no" in response_text or "without" in response_text or "0" in response_text or "waived" in response_text
    # Should cite Northstar agreement or contract override
    assert "contract" in response_text or "agreement" in response_text or "northstar" in response_text
    assert len(result["tools_used"]) > 0


@pytest.mark.asyncio
async def test_scenario_lumenworks_late_pickup_credit(rohit_context):
    """
    Question: 'A pickup is three hours late because of carrier fault for LumenWorks ORD-2002. Should I get a service credit?'
    Expected: Agent looks up ORD-2002, computes that pickup window ended at 06:30 (so at snapshot 11:00 it's 4.5 hrs late, >4 hrs),
    and applies LumenWorks contract specific ₹300 credit rather than standard SOP.
    """
    message = (
        "Check order ORD-2002 for LumenWorks. The pickup was missed due to carrier fault. "
        "What service credit is due, and why?"
    )
    result = await run_agent(message, [], rohit_context)

    response_text = result["response"]
    # Must mention 300 INR / ₹300
    assert "300" in response_text
    # Must mention LumenWorks contract/agreement
    assert "contract" in response_text.lower() or "agreement" in response_text.lower() or "lumenworks" in response_text.lower()


@pytest.mark.asyncio
async def test_scenario_trap_avoidance_tkt450_and_tkt451(rohit_context):
    """
    Test that historical ticket resolutions (which are deliberately flawed) are not blindly followed:
    - TKT-450 wrongly told Northstar a ₹250 fee applies after 30 mins.
    - TKT-451 wrongly told LumenWorks the bulk upload limit is 3,000 rows.
    """
    message = "What is the maximum bulk upload row limit for LumenWorks on the Growth plan? Check policies and historical tickets."
    result = await run_agent(message, [], rohit_context)

    response_text = result["response"]
    # Actual limit is 5,000 rows
    assert "5,000" in response_text or "5000" in response_text
    # Should clarify that 3,000 was a bug (KI-208) or incorrect past ticket (TKT-451)
    assert "208" in response_text or "bug" in response_text.lower() or "issue" in response_text.lower() or "3,000" in response_text or "3000" in response_text


@pytest.mark.asyncio
async def test_scenario_security_incident_tkt505(rohit_context):
    """
    Question on TKT-505 (API key leak).
    Expected: Identified as P1 security incident, requires immediate escalation / rotation.
    """
    message = "Look up ticket TKT-505. What severity is this, and what immediate action should be taken?"
    result = await run_agent(message, [], rohit_context)

    response_text = result["response"].lower()
    assert "p1" in response_text or "critical" in response_text or "security" in response_text
    assert "escalat" in response_text or "rotate" in response_text or "revoke" in response_text
