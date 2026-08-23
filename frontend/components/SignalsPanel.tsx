"use client";

import React, { useEffect, useState } from "react";
import { Signal } from "@/types/chat";
import { fetchSignals } from "@/lib/api";
import { motion } from "framer-motion";
import {
  RotateCw,
  Radar,
  ArrowUpRight,
  ShieldCheck,
  Radio,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface SignalsPanelProps {
  onSelectPrompt?: (prompt: string) => void;
}

export const SignalsPanel: React.FC<SignalsPanelProps> = ({ onSelectPrompt }) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSignals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSignals();
      setSignals(data);
    } catch (err: any) {
      setError(err.message || "Failed to poll proactive intelligence radar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSignals();
  }, []);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "P1":
        return (
          <Badge variant="crimson" className="text-[9.5px] gap-1 px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
            P1 CRITICAL
          </Badge>
        );
      case "P2":
        return (
          <Badge variant="saffron" className="text-[9.5px] gap-1 px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
            P2 HIGH
          </Badge>
        );
      case "P3":
        return (
          <Badge variant="slate" className="text-[9.5px] gap-1 px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-info" />
            P3 ROUTINE
          </Badge>
        );
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const p1Count = signals.filter((s) => s.severity === "P1").length;

  return (
    <aside
      aria-label="Proactive Intelligence Radar"
      className="h-full flex flex-col bg-card/70 border-l border-border"
    >
      {/* Radar Masthead */}
      <div className="p-4.5 border-b border-border bg-card flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shadow-sm">
            <Radar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-foreground tracking-tight">
                Proactive Radar
              </h2>
              {p1Count > 0 && (
                <Badge variant="crimson" className="text-[9px] px-1.5 py-0 animate-pulse">
                  {p1Count} P1 ALERT
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-sans">
              Continuous Telemetry &amp; Anomaly Detection
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="icon"
          onClick={loadSignals}
          disabled={loading}
          className="h-8 w-8 rounded-lg"
          title="Poll live telemetry signals"
          aria-label="Refresh telemetry signals"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
        </Button>
      </div>

      {/* Signals Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {loading && signals.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-xs font-mono space-y-2.5">
            <RotateCw className="w-5 h-5 animate-spin text-primary" />
            <span>Scanning active telemetry &amp; tickets...</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono">
            [RADAR_ERR]: {error}
          </div>
        )}

        {!loading && signals.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-xs space-y-2">
            <ShieldCheck className="w-8 h-8 mx-auto text-success" />
            <p className="font-mono text-xs">ALL SYSTEMS GREEN. ZERO BREACHES DETECTED.</p>
          </div>
        )}

        {signals.map((sig, index) => (
          <motion.article
            key={sig.signal_id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className={`p-4 rounded-xl border transition-all shadow-sm space-y-2 ${
              sig.severity === "P1"
                ? "bg-destructive/5 border-destructive/30 hover:border-destructive/60"
                : sig.severity === "P2"
                ? "bg-warning-bg border-warning-border hover:border-warning"
                : "bg-card border-border hover:border-border/80"
            }`}
          >
            <div className="flex items-center justify-between">
              {getSeverityBadge(sig.severity)}
              <span className="text-[10px] font-mono text-muted-foreground">
                {sig.signal_id}
              </span>
            </div>

            <h3 className="text-xs font-bold text-foreground leading-snug">
              {sig.title}
            </h3>

            <p className="text-xs text-muted-foreground leading-relaxed font-sans">
              {sig.description}
            </p>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[55%]">
                REF: {sig.related_tickets.join(", ") || "GLOBAL"}
              </span>
              {onSelectPrompt && (
                <Button
                  variant="quiet"
                  size="sm"
                  onClick={() =>
                    onSelectPrompt(
                      `Please analyze ${sig.title} (${sig.related_tickets.join(", ")}). What is the recommended resolution?`
                    )
                  }
                  className="h-7 text-[11px] font-mono font-bold text-primary hover:text-primary gap-1 px-2"
                >
                  <span>Triage</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Button>
              )}
            </div>
          </motion.article>
        ))}
      </div>

      {/* Snapshot Reference Clock */}
      <div className="p-3 bg-card border-t border-border text-[11px] font-mono text-muted-foreground flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-success" />
          <span>SNAPSHOT CLOCK:</span>
        </div>
        <span className="text-accent font-bold">16-AUG-2026 11:00 IST</span>
      </div>
    </aside>
  );
};
