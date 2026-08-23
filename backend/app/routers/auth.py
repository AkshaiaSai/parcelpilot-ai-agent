"""
Auth router — mock login endpoint.
"""

from fastapi import APIRouter, HTTPException

from app.access_control.auth import get_user
from app.models.schemas import LoginRequest, UserInfo

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=UserInfo)
async def login(request: LoginRequest):
    """Mock login — returns user info for Rohit or Maya."""
    user = get_user(request.username)
    if user is None:
        raise HTTPException(
            status_code=401,
            detail=f"Unknown user: {request.username}. Available users: Rohit, Maya",
        )
    return user
