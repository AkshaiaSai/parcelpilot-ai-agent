"""
Chat router — main chat endpoint for the AI agent.
"""

from fastapi import APIRouter, HTTPException

from app.access_control.auth import validate_user, apply_data_scope
from app.agent.graph import run_agent
from app.models.schemas import ChatRequest, ChatResponse, ToolUsage, PendingAction

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Send a message to the AI agent and get a response."""
    # Validate user
    try:
        user = validate_user(request.user_id)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    # Build user context for structural access control
    scope = apply_data_scope(user)
    user_context = {
        "username": user.username,
        "role": scope["role"],
        "accessible_accounts": scope["accessible_accounts"],
        "can_approve_credits": scope["can_approve_credits"],
    }

    # Run the agent
    try:
        result = await run_agent(
            message=request.message,
            conversation_history=request.conversation_history,
            user_context=user_context,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

    # Build response
    tools_used = [ToolUsage(**t) for t in result.get("tools_used", [])]
    pending_actions = [
        PendingAction(
            action_id=a["action_id"],
            action_type=a["action_type"],
            status=a["status"],
            details=a["details"],
            related_ticket_id=a.get("related_ticket_id"),
            related_order_id=a.get("related_order_id"),
            related_account_id=a.get("related_account_id"),
        )
        for a in result.get("pending_actions", [])
    ]

    return ChatResponse(
        response=result["response"],
        tools_used=tools_used,
        pending_actions=pending_actions,
    )
