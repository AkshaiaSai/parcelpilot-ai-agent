"""
LangGraph agent graph for the ParcelPilot AI Support Agent.

Uses a tool-calling loop: agent node (LLM) -> tools node -> agent node,
repeating until the LLM responds without tool calls.

Access control is enforced structurally by injecting user context
into tool calls at the tool execution layer.
"""

import json
from typing import Optional

from langchain_core.messages import (
    AIMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph

from app.agent.prompts import SYSTEM_PROMPT
from app.agent.state import AgentState
from app.config import MAX_AGENT_ITERATIONS, OPENAI_API_KEY, OPENAI_CHAT_MODEL
from app.tools.actions import create_action, propose_action
from app.tools.document_search import search_documents, search_documents_impl
from app.tools.structured_data import (
    query_structured_data,
    query_structured_data_impl,
)

# Map of tool names to display info
TOOL_DISPLAY_INFO = {
    "search_documents": {
        "tool_name": "search_documents",
        "tool_display_name": "Document Search",
        "tool_icon": "\U0001F4C4",
    },
    "query_structured_data": {
        "tool_name": "query_structured_data",
        "tool_display_name": "Data Lookup",
        "tool_icon": "\U0001F5C4\uFE0F",
    },
    "create_action": {
        "tool_name": "create_action",
        "tool_display_name": "Action Proposed",
        "tool_icon": "\u26A1",
    },
}

# Tools available to the agent
TOOLS = [search_documents, query_structured_data, create_action]


def _create_llm():
    """Create the ChatOpenAI LLM with tool bindings."""
    llm = ChatOpenAI(
        model=OPENAI_CHAT_MODEL,
        openai_api_key=OPENAI_API_KEY,
        temperature=0,
    )
    return llm.bind_tools(TOOLS)


def agent_node(state: AgentState) -> dict:
    """LLM agent node - processes messages and decides on tool calls or final response."""
    llm = _create_llm()

    # Ensure system prompt is first message
    messages = list(state["messages"])
    if not messages or not isinstance(messages[0], SystemMessage):
        messages.insert(0, SystemMessage(content=SYSTEM_PROMPT))

    response = llm.invoke(messages)

    return {"messages": [response]}


def tool_node(state: AgentState) -> dict:
    """Execute tool calls from the last AI message, injecting access control."""
    messages = list(state["messages"])
    last_message = messages[-1]

    if not isinstance(last_message, AIMessage) or not last_message.tool_calls:
        return {"messages": [], "tools_used": [], "pending_actions": []}

    user_context = state.get("user_context", {})
    accessible_accounts = user_context.get("accessible_accounts")
    username = user_context.get("username", "agent")

    tool_messages = []
    new_tools_used = list(state.get("tools_used", []))
    new_pending_actions = list(state.get("pending_actions", []))

    for tool_call in last_message.tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]

        # Track tool usage
        if tool_name in TOOL_DISPLAY_INFO:
            info = TOOL_DISPLAY_INFO[tool_name]
            if info not in new_tools_used:
                new_tools_used.append(info)

        # Execute tool with access control injection
        try:
            if tool_name == "search_documents":
                # Inject accessible_accounts for structural scoping
                result = search_documents_impl(
                    query=tool_args.get("query", ""),
                    source_type=tool_args.get("source_type"),
                    status=tool_args.get("status"),
                    account_scope=tool_args.get("account_scope"),
                    accessible_accounts=accessible_accounts,
                )
                # Format for LLM
                if not result:
                    result_str = "No relevant documents found."
                elif isinstance(result[0], dict) and "error" in result[0]:
                    result_str = result[0]["error"]
                else:
                    parts = []
                    for i, r in enumerate(result, 1):
                        status_tag = (
                            " [\u26A0\uFE0F DEPRECATED]"
                            if r.get("status") == "deprecated"
                            else ""
                        )
                        scope_tag = (
                            f" [Account: {r['account_scope']}]"
                            if r.get("account_scope", "all") != "all"
                            else ""
                        )
                        parts.append(
                            f"--- Result {i} (relevance: {r['relevance_score']}) ---\n"
                            f"Source: {r['source_file']} (page {r['page_number']})"
                            f"{status_tag}{scope_tag}\n"
                            f"Type: {r['source_type']} | Effective: {r['effective_date']}\n"
                            f"Content:\n{r['content']}\n"
                        )
                    result_str = "\n".join(parts)

            elif tool_name == "query_structured_data":
                # Inject accessible_accounts for structural scoping
                rows = query_structured_data_impl(
                    table=tool_args.get("table", ""),
                    filters=tool_args.get("filters"),
                    columns=tool_args.get("columns"),
                    accessible_accounts=accessible_accounts,
                )
                parts = [
                    f"Query: {tool_args.get('table')} | "
                    f"Filters: {tool_args.get('filters', 'none')}"
                ]

                if rows and isinstance(rows[0], dict) and "error" in rows[0]:
                    parts.append(f"Error: {rows[0]['error']}")
                else:
                    parts.append(f"Found {len(rows)} row(s):\n")
                    for row in rows:
                        parts.append(json.dumps(row, indent=2, default=str))

                # Handle time calculations
                calc_time = tool_args.get("calculate_time_from")
                if calc_time:
                    from app.tools.structured_data import calculate_time_since
                    time_result = calculate_time_since(calc_time)
                    parts.append(f"\nTime calculation from {calc_time}:")
                    parts.append(json.dumps(time_result, indent=2))

                result_str = "\n".join(parts)

            elif tool_name == "create_action":
                # Inject actual username as creator
                result = propose_action(
                    action_type=tool_args.get("action_type", ""),
                    details={
                        "reason": tool_args.get("reason", ""),
                        "priority": tool_args.get("priority", "medium"),
                        "additional_details": tool_args.get("additional_details"),
                    },
                    created_by=username,
                    related_ticket_id=tool_args.get("related_ticket_id"),
                    related_order_id=tool_args.get("related_order_id"),
                    related_account_id=tool_args.get("related_account_id"),
                )
                if "error" not in result:
                    new_pending_actions.append(result)
                result_str = json.dumps(result, indent=2)

            else:
                result_str = f"Unknown tool: {tool_name}"

        except Exception as e:
            result_str = f"Tool execution error: {str(e)}"

        tool_messages.append(
            ToolMessage(
                content=result_str,
                tool_call_id=tool_call["id"],
            )
        )

    return {
        "messages": tool_messages,
        "tools_used": new_tools_used,
        "pending_actions": new_pending_actions,
    }


def _count_tool_calls_in_current_turn(messages: list) -> int:
    """
    Count AIMessage tool-call events that occurred AFTER the most recent
    HumanMessage. This scopes MAX_AGENT_ITERATIONS to the current user turn
    instead of the entire accumulated conversation history, which was the
    root cause of the graph terminating early (and silently dropping a
    pending create_action call) on later turns of a multi-turn conversation.
    """
    last_human_index = -1
    for i, m in enumerate(messages):
        if isinstance(m, HumanMessage):
            last_human_index = i

    current_turn_messages = messages[last_human_index + 1:] if last_human_index >= 0 else messages

    return sum(
        1 for m in current_turn_messages
        if isinstance(m, AIMessage) and m.tool_calls
    )


def should_continue(state: AgentState) -> str:
    """Determine whether to continue the tool-calling loop or end."""
    messages = state["messages"]
    last_message = messages[-1]

    # Count tool-calling iterations WITHIN THE CURRENT TURN ONLY.
    # (Previously this summed tool calls across the entire message history,
    # which meant the limit was silently hit earlier and earlier as a
    # conversation went on, cutting off tool execution -- including
    # create_action calls -- before they completed.)
    tool_call_count = _count_tool_calls_in_current_turn(messages)
    if tool_call_count >= MAX_AGENT_ITERATIONS:
        return "end"

    # If the last message has tool calls, continue to tool execution
    if isinstance(last_message, AIMessage) and last_message.tool_calls:
        return "continue"

    return "end"


def build_graph() -> StateGraph:
    """Build and compile the LangGraph agent graph."""
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)

    # Set entry point
    graph.set_entry_point("agent")

    # Add conditional edges
    graph.add_conditional_edges(
        "agent",
        should_continue,
        {
            "continue": "tools",
            "end": END,
        },
    )

    # Tools always go back to agent
    graph.add_edge("tools", "agent")

    return graph.compile()


# Compiled graph singleton
_graph = None


def get_graph():
    """Get or create the compiled graph singleton."""
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph


async def run_agent(
    message: str,
    conversation_history: list[dict],
    user_context: dict,
) -> dict:
    """
    Run the agent with a user message.

    Args:
        message: The user's message
        conversation_history: List of {role, content} dicts
        user_context: User info dict with accessible_accounts, role, etc.

    Returns:
        dict with: response, tools_used, pending_actions
    """
    graph = get_graph()

    # Build message list from conversation history
    messages = [SystemMessage(content=SYSTEM_PROMPT)]
    for msg in conversation_history:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            messages.append(AIMessage(content=msg["content"]))

    # Add the new user message
    messages.append(HumanMessage(content=message))

    # Run the graph
    initial_state: AgentState = {
        "messages": messages,
        "user_context": user_context,
        "tools_used": [],
        "pending_actions": [],
    }

    # Execute synchronously (LangGraph's invoke is synchronous)
    result = graph.invoke(initial_state)

    # Extract the final AI response
    final_messages = result["messages"]
    agent_response = ""
    for msg in reversed(final_messages):
        if isinstance(msg, AIMessage) and not msg.tool_calls:
            agent_response = msg.content
            break

    return {
        "response": agent_response,
        "tools_used": result.get("tools_used", []),
        "pending_actions": result.get("pending_actions", []),
    }