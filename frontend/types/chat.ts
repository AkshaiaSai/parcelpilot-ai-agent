export interface ToolUsage {
  tool_name: string;
  tool_display_name: string;
  tool_icon: string;
}

export interface PendingAction {
  action_id: string;
  action_type: string;
  status: string;
  details: {
    reason?: string;
    priority?: string;
    additional_details?: string;
    [key: string]: any;
  };
  related_ticket_id?: string;
  related_order_id?: string;
  related_account_id?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  tools_used?: ToolUsage[];
  pending_actions?: PendingAction[];
  isPendingExecution?: boolean;
}

export interface UserInfo {
  username: string;
  role: string;
  display_name: string;
  accessible_accounts: string[];
  can_approve_credits: boolean;
}

export interface Signal {
  signal_id: string;
  severity: "P1" | "P2" | "P3" | "INFO";
  signal_type: "security" | "pattern" | "sla_breach";
  title: string;
  description: string;
  related_tickets: string[];
  related_accounts: string[];
  recommended_action: string;
  detected_at: string;
}
