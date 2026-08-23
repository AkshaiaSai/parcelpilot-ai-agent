"""
Agent state definition for the LangGraph graph.
"""

from typing import Annotated, Optional, Sequence
from typing_extensions import TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    """State passed through the LangGraph agent graph."""

    # Conversation messages (accumulates via add_messages reducer)
    messages: Annotated[Sequence[BaseMessage], add_messages]

    # Current user context for access control
    user_context: dict  # {username, role, accessible_accounts, can_approve_credits}

    # Tools that were used in this interaction
    tools_used: list[dict]  # [{tool_name, tool_display_name, tool_icon}]

    # Pending actions proposed during this interaction
    pending_actions: list[dict]
