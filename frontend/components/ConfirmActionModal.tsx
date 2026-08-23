"use client";

import React, { useState } from "react";
import { PendingAction } from "@/types/chat";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  X,
  CheckCircle2,
  XCircle,
  Loader2,
  Terminal,
  Lock,
  ArrowRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface ConfirmActionModalProps {
  action: PendingAction;
  onConfirm: (actionId: string) => Promise<void>;
  onCancel: (actionId: string) => Promise<void>;
  onClose: () => void;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  action,
  onConfirm,
  onCancel,
  onClose,
}) => {
  const [loading, setLoading] = useState<"confirm" | "cancel" | null>(null);

  const handleConfirm = async () => {
    try {
      setLoading("confirm");
      await onConfirm(action.action_id);
      onClose();
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    try {
      setLoading("cancel");
      await onCancel(action.action_id);
      onClose();
    } finally {
      setLoading(null);
    }
  };

  const isCritical = action.details.priority?.toLowerCase() === "critical";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="bg-card border border-border rounded-2xl max-w-xl w-full p-0 shadow-modal overflow-hidden"
      >
        {/* Header */}
        <div className="bg-secondary/60 border-b border-border p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="saffron" className="text-[9.5px]">
                  SAFETY GATE // LEVEL 2
                </Badge>
                <span className="font-mono text-xs text-muted-foreground">
                  {action.action_id}
                </span>
              </div>
              <h2
                id="action-modal-title"
                className="text-base font-bold text-foreground tracking-tight mt-0.5"
              >
                Authorize System State Mutation
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Specs Container */}
        <div className="p-6 space-y-4 bg-card">
          {/* Metadata Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-secondary/40 border border-border p-3 rounded-xl">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-0.5">
                Action Type
              </span>
              <span className="font-mono font-bold text-accent text-xs truncate block">
                {action.action_type}
              </span>
            </div>

            <div className="bg-secondary/40 border border-border p-3 rounded-xl">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-0.5">
                Priority
              </span>
              <Badge
                variant={isCritical ? "crimson" : "saffron"}
                className="text-[9.5px]"
              >
                {action.details.priority || "NORMAL"}
              </Badge>
            </div>

            <div className="bg-secondary/40 border border-border p-3 rounded-xl">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-0.5">
                Ticket Ref
              </span>
              <span className="font-mono font-bold text-foreground text-xs">
                {action.related_ticket_id || "N/A"}
              </span>
            </div>

            <div className="bg-secondary/40 border border-border p-3 rounded-xl">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-0.5">
                Account Scope
              </span>
              <span className="font-mono font-bold text-foreground text-xs">
                {action.related_account_id || "N/A"}
              </span>
            </div>
          </div>

          {/* Reasoning & Instructions */}
          <div className="bg-secondary/30 border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-foreground text-xs font-mono font-bold uppercase tracking-wider">
              <Terminal className="w-3.5 h-3.5 text-primary" />
              <span>Operator Execution Rationale</span>
            </div>
            <p className="text-xs text-foreground font-sans leading-relaxed bg-card p-3 rounded-xl border border-border">
              {action.details.reason || "No explicit rationale provided."}
            </p>
            {action.details.additional_details && (
              <div className="pt-2 border-t border-border/80 text-xs text-muted-foreground">
                <span className="font-mono text-[10.5px] uppercase mr-1.5 font-bold">
                  Parameters:
                </span>
                <span className="text-foreground">
                  {action.details.additional_details}
                </span>
              </div>
            )}
          </div>

          {/* Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-secondary/50 border border-border text-xs text-muted-foreground">
            <Lock className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11.5px]">
              This action will commit mutations to the live operational audit ledger and
              dispatch notification routing. Operator authorization is permanently logged.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="bg-secondary/60 border-t border-border p-5 flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={loading !== null}
            className="gap-1.5 rounded-xl h-10 px-4"
          >
            <XCircle className="w-4 h-4 text-destructive" />
            <span>Abort / Reject</span>
          </Button>

          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={loading !== null}
            className="gap-2 rounded-xl h-10 px-5"
          >
            {loading === "confirm" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Authorize &amp; Execute</span>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
