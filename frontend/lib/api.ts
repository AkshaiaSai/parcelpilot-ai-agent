import { Message, Signal, UserInfo, PendingAction } from "@/types/chat";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function loginUser(username: string): Promise<UserInfo> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(error.detail || "Authentication error");
  }
  return res.json();
}

export async function sendMessage(
  message: string,
  history: Message[],
  userId: string
): Promise<{
  response: string;
  tools_used: any[];
  pending_actions: PendingAction[];
}> {
  const formattedHistory = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      conversation_history: formattedHistory,
      user_id: userId,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Chat request failed" }));
    throw new Error(error.detail || "Agent service error");
  }

  return res.json();
}

export async function confirmAction(
  actionId: string,
  userId: string
): Promise<{ action_id: string; status: string; message: string }> {
  const res = await fetch(`${API_BASE}/actions/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action_id: actionId,
      user_id: userId,
    }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to confirm action" }));
    throw new Error(error.detail || "Action confirmation error");
  }
  return res.json();
}

export async function cancelAction(
  actionId: string,
  userId: string
): Promise<{ action_id: string; status: string; message: string }> {
  const res = await fetch(`${API_BASE}/actions/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action_id: actionId,
      user_id: userId,
    }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to cancel action" }));
    throw new Error(error.detail || "Action cancellation error");
  }
  return res.json();
}

export async function fetchSignals(): Promise<Signal[]> {
  const res = await fetch(`${API_BASE}/signals`);
  if (!res.ok) {
    throw new Error("Failed to fetch proactive detection signals");
  }
  return res.json();
}
