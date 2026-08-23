"""
Actions router — confirm/cancel pending actions.
"""

from fastapi import APIRouter, HTTPException

from app.access_control.auth import validate_user
from app.models.schemas import ActionConfirmRequest, ActionResponse
from app.tools.actions import confirm_action, cancel_action, get_pending_actions

router = APIRouter(prefix="/actions", tags=["actions"])


@router.post("/confirm", response_model=ActionResponse)
async def confirm(request: ActionConfirmRequest):
    """Confirm and execute a pending action."""
    try:
        validate_user(request.user_id)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    result = confirm_action(request.action_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return ActionResponse(
        action_id=result["action_id"],
        status=result["status"],
        message=result["message"],
    )


@router.post("/cancel", response_model=ActionResponse)
async def cancel(request: ActionConfirmRequest):
    """Cancel a pending action."""
    try:
        validate_user(request.user_id)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    result = cancel_action(request.action_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return ActionResponse(
        action_id=result["action_id"],
        status=result["status"],
        message=result["message"],
    )


@router.get("/pending")
async def list_pending(user_id: str = ""):
    """List all pending actions."""
    if user_id:
        try:
            validate_user(user_id)
        except ValueError as e:
            raise HTTPException(status_code=401, detail=str(e))

    actions = get_pending_actions(user_id if user_id else None)
    return {"pending_actions": actions}
