"""
Pydantic models / schemas for the ParcelPilot API.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# --- Auth ---

class LoginRequest(BaseModel):
    username: str = Field(..., description="Mock username: 'Rohit' or 'Maya'")


class UserInfo(BaseModel):
    username: str
    role: str
    display_name: str
    accessible_accounts: list[str] = Field(
        default_factory=list,
        description="Account IDs this user can access"
    )
    can_approve_credits: bool = False


# --- Chat ---

class ToolUsage(BaseModel):
    tool_name: str
    tool_display_name: str
    tool_icon: str


class PendingAction(BaseModel):
    action_id: str
    action_type: str
    status: str = "pending"
    details: dict
    related_ticket_id: Optional[str] = None
    related_order_id: Optional[str] = None
    related_account_id: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    conversation_history: list[dict] = Field(default_factory=list)
    user_id: str = Field(..., description="Username of the logged-in user")


class ChatResponse(BaseModel):
    response: str
    tools_used: list[ToolUsage] = Field(default_factory=list)
    pending_actions: list[PendingAction] = Field(default_factory=list)
    sources_cited: list[str] = Field(default_factory=list)


# --- Actions ---

class ActionConfirmRequest(BaseModel):
    action_id: str
    user_id: str


class ActionResponse(BaseModel):
    action_id: str
    status: str
    message: str


# --- Signals ---

class Signal(BaseModel):
    signal_id: str
    severity: str = Field(..., description="P1, P2, P3, or INFO")
    signal_type: str = Field(..., description="security, pattern, sla_breach")
    title: str
    description: str
    related_tickets: list[str] = Field(default_factory=list)
    related_accounts: list[str] = Field(default_factory=list)
    recommended_action: str
    detected_at: str
