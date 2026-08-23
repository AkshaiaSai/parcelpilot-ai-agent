"use client";

import React, { useState, useRef, useEffect } from "react";
import { Message, UserInfo, PendingAction } from "@/types/chat";
import { sendMessage, confirmAction, cancelAction } from "@/lib/api";
import { MessageBubble } from "./MessageBubble";
import { ConfirmActionModal } from "./ConfirmActionModal";
import { CommandPalette } from "./CommandPalette";
import { motion } from "framer-motion";
import {
  Send,
  RotateCw,
  Sparkles,
  ShieldCheck,
  Search,
  RefreshCw,
  Command,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface ChatWindowProps {
  user: UserInfo;
  onLogout: () => void;
  externalPrompt?: string;
  onClearExternalPrompt?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  user,
  onLogout,
  externalPrompt,
  onClearExternalPrompt,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "system-init-log",
      role: "assistant",
      content: `### 🟢 GROUND-TRUTH DISPATCH ENGINE ONLINE\n\nOperator **${user.display_name}** authenticated under **${user.role}** credentials.\n\nAll policy evaluations strictly enforce the source hierarchy:\n$$\\text{Signed Contract} \\succ \\text{Support Policy v3} \\succ \\text{Product SOPs} \\succ \\text{Historical Tickets (Context Only)}$$\n\nSubmit customer queries, inspect order numbers (\`ORD-XXXX\`), check tickets (\`TKT-XXX\`), or click one of the quick suggestions below.`,
      timestamp: "11:00:00 IST",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeModalAction, setActiveModalAction] = useState<PendingAction | null>(null);
  const [auditNotice, setAuditNotice] = useState<string | null>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (externalPrompt) {
      handleSend(externalPrompt);
      if (onClearExternalPrompt) onClearExternalPrompt();
    }
  }, [externalPrompt]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const data = await sendMessage(query, messages, user.username);
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        tools_used: data.tools_used,
        pending_actions: data.pending_actions,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `**[AGENT_FAULT]**: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (actionId: string) => {
    await confirmAction(actionId, user.username);
    setAuditNotice(`[AUDIT_LOG]: Action ${actionId} authorized & committed to ledger.`);
    setTimeout(() => setAuditNotice(null), 5000);
  };

  const handleCancelAction = async (actionId: string) => {
    await cancelAction(actionId, user.username);
    setAuditNotice(`[AUDIT_LOG]: Action ${actionId} cancelled.`);
    setTimeout(() => setAuditNotice(null), 5000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        role: "assistant",
        content: `### 🔄 SESSION REINITIALIZED\n\nOperator **${user.display_name}** ready. Ready for new investigations.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      {/* Top Console Bar */}
      <header className="h-14 px-5 border-b border-border bg-card/80 backdrop-blur flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="text-foreground font-semibold">CONSOLE</span>
            <span>/</span>
            <span>DISPATCH_LOG</span>
          </div>
          <Badge variant="pine" className="text-[9px] gap-1 px-1.5 py-0">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            LIVE CARRIER SYNC
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Command Palette Button */}
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-xs font-mono text-muted-foreground hover:text-foreground transition"
            title="Open Command Palette (⌘K)"
          >
            <Search className="w-3 h-3 text-primary" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="text-[10px] px-1 rounded bg-card border border-border/80">⌘K</kbd>
          </button>

          <Button
            variant="quiet"
            size="sm"
            onClick={handleResetChat}
            className="text-xs font-mono gap-1 text-muted-foreground hover:text-foreground h-7"
            title="Reset active chat stream"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">RESET</span>
          </Button>
        </div>
      </header>

      {/* Audit Banner */}
      {auditNotice && (
        <div className="bg-warning-bg border-b border-warning-border text-warning text-xs font-mono px-4 py-2 text-center shadow-sm">
          {auditNotice}
        </div>
      )}

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onOpenActionModal={(act) => setActiveModalAction(act)}
          />
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center gap-3"
          >
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <RotateCw className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                Investigating Ground-Truth Data &amp; Policies...
              </p>
              <p className="font-mono text-[10.5px] text-muted-foreground">
                Executing document retrieval, checking contract clauses, and evaluating rules.
              </p>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Suggestions (when message count is low) */}
      {messages.length <= 2 && (
        <div className="px-5 pb-2">
          <div className="flex items-center gap-1.5 mb-2 text-[10.5px] font-mono font-bold text-muted-foreground uppercase">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Suggested Investigations:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSend("Can Northstar cancel ORD-1001 without a cancellation fee? Explain why.")}
              className="px-3 py-1.5 rounded-xl bg-card hover:bg-secondary border border-border text-xs text-foreground transition shadow-sm font-medium"
            >
              Can Northstar cancel ORD-1001 fee-free?
            </button>
            <button
              type="button"
              onClick={() => handleSend("Check order ORD-2002 for LumenWorks. The pickup was missed due to carrier fault. What service credit is due, and why?")}
              className="px-3 py-1.5 rounded-xl bg-card hover:bg-secondary border border-border text-xs text-foreground transition shadow-sm font-medium"
            >
              LumenWorks ORD-2002 Late Pickup Credit
            </button>
            <button
              type="button"
              onClick={() => handleSend("What is the maximum bulk upload row limit for LumenWorks on the Growth plan? Check policies and historical tickets.")}
              className="px-3 py-1.5 rounded-xl bg-card hover:bg-secondary border border-border text-xs text-foreground transition shadow-sm font-medium"
            >
              Growth Bulk Upload Limits (Trap Check)
            </button>
            <button
              type="button"
              onClick={() => handleSend("Look up ticket TKT-505. What severity is this, and what immediate action should be taken?")}
              className="px-3 py-1.5 rounded-xl bg-card hover:bg-secondary border border-border text-xs text-foreground transition shadow-sm font-medium"
            >
              TKT-505 API Key Security Escalation
            </button>
          </div>
        </div>
      )}

      {/* Command Deck Input Bar */}
      <div className="p-4 border-t border-border bg-card/90 backdrop-blur">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-secondary/50 border border-border rounded-xl p-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition shadow-sm"
        >
          <div className="pl-3 text-primary font-mono text-sm font-bold select-none">
            &gt;
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a question, verify ORD-XXXX, check TKT-XXX, or analyze contract..."
            disabled={loading}
            className="flex-1 bg-transparent px-2 py-1.5 text-xs font-mono text-foreground placeholder-muted-foreground focus:outline-none disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={!input.trim() || loading}
            size="default"
            className="gap-2 rounded-xl"
          >
            <span>DISPATCH</span>
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>

        <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-muted-foreground px-1">
          <span>PRECEDENCE: Signed Contract &gt; Policy v3 &gt; SOP &gt; Historical Tickets</span>
          <span className="hidden sm:inline">[ENTER] TO EXECUTE</span>
        </div>
      </div>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onSelectPrompt={(prompt) => handleSend(prompt)}
      />

      {/* Confirmation Modal */}
      {activeModalAction && (
        <ConfirmActionModal
          action={activeModalAction}
          onConfirm={handleConfirmAction}
          onCancel={handleCancelAction}
          onClose={() => setActiveModalAction(null)}
        />
      )}
    </div>
  );
};
