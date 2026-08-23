"use client";

import React, { useState } from "react";
import { UserInfo } from "@/types/chat";
import { loginUser } from "@/lib/api";
import { ThemeToggle } from "./ThemeToggle";
import { motion } from "framer-motion";
import {
  Lock,
  ArrowRight,
  Package,
  CheckCircle2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface LoginMockProps {
  onLoginSuccess: (user: UserInfo) => void;
}

export const LoginMock: React.FC<LoginMockProps> = ({ onLoginSuccess }) => {
  const [selectedUser, setSelectedUser] = useState<"Rohit" | "Maya">("Rohit");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await loginUser(selectedUser);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || "Session authorization failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Subtle Ambient Aura */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Theme Toggle in Corner */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full bg-card border border-border rounded-3xl p-8 shadow-modal space-y-6 relative z-10"
      >
        {/* Brand Masthead */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center mx-auto shadow-md">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-primary font-bold">
              <span>SYSTEM RELEASE 3.0</span>
              <span>•</span>
              <span>AI GROUND TRUTH</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
              ParcelPilot <span className="text-primary">OpsConsole</span>
            </h1>
            <p className="text-xs text-muted-foreground font-sans mt-1">
              Autonomous Logistics Operations &amp; Contract Verification Terminal
            </p>
          </div>
        </div>

        {/* Security Persona Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
              AUTHORIZE OPERATOR ROLE
            </span>
            <Badge variant="pine" className="text-[9.5px]">
              RBAC SCOPE READY
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Rohit */}
            <button
              type="button"
              onClick={() => setSelectedUser("Rohit")}
              className={`p-4 rounded-2xl border text-left transition-all relative ${
                selectedUser === "Rohit"
                  ? "bg-secondary/70 border-primary shadow-sm ring-1 ring-primary/20"
                  : "bg-card border-border hover:border-borderStrong"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    Rohit Sharma
                  </span>
                  <Badge variant="saffron" className="text-[9.5px]">
                    TIER 1 AGENT
                  </Badge>
                </div>
                {selectedUser === "Rohit" && (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Standard Support Agent. Credit limit:{" "}
                <strong className="text-foreground font-mono">≤ ₹1,000</strong>. Escalates high-value claims to Ops Manager.
              </p>
            </button>

            {/* Maya */}
            <button
              type="button"
              onClick={() => setSelectedUser("Maya")}
              className={`p-4 rounded-2xl border text-left transition-all relative ${
                selectedUser === "Maya"
                  ? "bg-secondary/70 border-accent shadow-sm ring-1 ring-accent/20"
                  : "bg-card border-border hover:border-borderStrong"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    Maya Patel
                  </span>
                  <Badge variant="pine" className="text-[9.5px]">
                    OPS MANAGER
                  </Badge>
                </div>
                {selectedUser === "Maya" && (
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                )}
              </div>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Operations Manager. Full authority for credit approvals{" "}
                <strong className="text-foreground font-mono">&gt; ₹1,000</strong>, carrier dispute resolution, and security escalation.
              </p>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono">
            [AUTH_FAULT]: {error}
          </div>
        )}

        {/* Enter CTA */}
        <div>
          <Button
            variant="default"
            size="lg"
            onClick={handleLogin}
            disabled={loading}
            className="w-full gap-2 text-xs font-mono rounded-xl h-11 shadow-sm"
          >
            {loading ? (
              <span className="animate-pulse">INITIALIZING OPERATOR SESSION...</span>
            ) : (
              <>
                <span>ESTABLISH SECURE SESSION</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>

        {/* Security Grounding Specs */}
        <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-accent" />
            <span>SQL WHERE-Clause Structural Enforcement</span>
          </div>
          <span>DATA_VER: 2026.08</span>
        </div>
      </motion.div>
    </div>
  );
};
