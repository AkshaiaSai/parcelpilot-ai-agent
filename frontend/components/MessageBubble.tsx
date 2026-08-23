"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message, PendingAction } from "@/types/chat";
import { ToolBadge } from "./ToolBadge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  User,
  ShieldAlert,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Copy,
  Check,
  FileCheck,
  Send,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface MessageBubbleProps {
  message: Message;
  onOpenActionModal?: (action: PendingAction) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onOpenActionModal,
}) => {
  const isUser = message.role === "user";
  const [toolsExpanded, setToolsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      {isUser ? (
        /* User Query Entry: Full-Width Structured Operator Dispatch Card */
        <div className="w-full bg-secondary/60 border border-border rounded-2xl p-4.5 shadow-sm space-y-2.5 transition-all hover:border-borderStrong">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-sm">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-foreground uppercase tracking-wider">
                  OPERATOR DISPATCH INQUIRY
                </span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                  INPUT_PROMPT
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[10.5px] text-muted-foreground">
                {message.timestamp}
              </span>
            </div>
          </div>

          {/* User Prompt Text */}
          <p className="text-foreground font-sans text-sm leading-relaxed font-medium pl-0.5">
            {message.content}
          </p>
        </div>
      ) : (
        /* Assistant Intelligence Dossier: Full-Width Clean Research Card */
        <div className="w-full bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3.5 transition-all hover:border-border/90">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-accent text-accent-foreground flex items-center justify-center shadow-sm">
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-foreground tracking-tight">
                    Ground-Truth Reasoning Dossier
                  </h3>
                  <Badge variant="pine" className="text-[9px] px-1.5 py-0.2">
                    PRECEDENCE ENFORCED
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                title="Copy dossier markdown"
                aria-label="Copy markdown"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <span className="font-mono text-[10.5px] text-muted-foreground">
                {message.timestamp}
              </span>
            </div>
          </div>

          {/* Telemetry Trace Section */}
          {message.tools_used && message.tools_used.length > 0 && (
            <div className="bg-secondary/40 border border-border/70 rounded-xl p-2.5 space-y-2">
              <button
                type="button"
                onClick={() => setToolsExpanded(!toolsExpanded)}
                className="w-full flex items-center justify-between text-[11px] font-mono font-semibold text-muted-foreground hover:text-foreground transition"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span>
                    TELEMETRY EXECUTION ({message.tools_used.length} TOOL {message.tools_used.length === 1 ? "CALL" : "CALLS"})
                  </span>
                </div>
                {toolsExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              <AnimatePresence>
                {toolsExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap gap-2 pt-1 border-t border-border/40"
                  >
                    {message.tools_used.map((tool, idx) => (
                      <ToolBadge key={`${tool.tool_name}-${idx}`} tool={tool} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Markdown Dossier Body */}
          <div className="prose-editorial">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Safety Action Proposal Card */}
          {message.pending_actions && message.pending_actions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-4 pt-3 border-t border-dashed border-warning-border space-y-2"
            >
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-warning uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>HUMAN-IN-THE-LOOP SAFETY GATE</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-normal">
                  CONFIRMATION REQUIRED
                </span>
              </div>

              {message.pending_actions.map((act) => (
                <div
                  key={act.action_id}
                  className="bg-warning-bg border border-warning-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-warning text-xs">
                        {act.action_type}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground bg-card px-2 py-0.5 rounded border border-border">
                        {act.action_id}
                      </span>
                    </div>
                    <p className="text-xs text-foreground font-sans font-medium">
                      {act.details.reason || "Action proposed by AI Agent. Awaiting review."}
                    </p>
                  </div>

                  {onOpenActionModal && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onOpenActionModal(act)}
                      className="gap-2 shrink-0 shadow-sm rounded-xl"
                    >
                      <span>Review &amp; Authorize</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};
