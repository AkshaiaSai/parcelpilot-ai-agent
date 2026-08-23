"use client";

import React from "react";
import { UserInfo } from "@/types/chat";
import { ThemeToggle } from "./ThemeToggle";
import {
  Package,
  ShieldCheck,
  LogOut,
  FileText,
  FileSpreadsheet,
  Layers,
  AlertOctagon,
  Database,
  Radio,
  BookOpen,
  Command,
  Search,
  Sparkles,
  Zap,
  Activity,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface SidebarProps {
  user: UserInfo;
  onLogout: () => void;
  onSelectPrompt: (prompt: string) => void;
  onOpenCommandPalette?: () => void;
}

const QUICK_BENCHMARKS = [
  {
    code: "ORD-1001",
    title: "Northstar Cancellation",
    desc: "Pre-pickup fee waiver override",
    prompt: "Can Northstar cancel ORD-1001 without a cancellation fee? Explain why.",
    icon: <FileText className="w-3.5 h-3.5 text-info" />,
    badge: "Contract Override",
  },
  {
    code: "ORD-2002",
    title: "LumenWorks Credit",
    desc: "Carrier late pickup (>4h) credit",
    prompt: "Check order ORD-2002 for LumenWorks. The pickup was missed due to carrier fault. What service credit is due, and why?",
    icon: <FileSpreadsheet className="w-3.5 h-3.5 text-success" />,
    badge: "Time Delta",
  },
  {
    code: "KI-208",
    title: "Growth Upload Limits",
    desc: "Policy vs known bug vs TKT-451 trap",
    prompt: "What is the maximum bulk upload row limit for LumenWorks on the Growth plan? Check policies and historical tickets.",
    icon: <Layers className="w-3.5 h-3.5 text-warning" />,
    badge: "Trap Defense",
  },
  {
    code: "TKT-505",
    title: "Security Incident",
    desc: "API key exposure P1 escalation",
    prompt: "Look up ticket TKT-505. What severity is this, and what immediate action should be taken?",
    icon: <AlertOctagon className="w-3.5 h-3.5 text-destructive" />,
    badge: "P1 Incident",
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  onLogout,
  onSelectPrompt,
  onOpenCommandPalette,
}) => {
  return (
    <aside className="w-80 h-full bg-card border-r border-border flex flex-col flex-shrink-0 select-none overflow-hidden shadow-sm">
      {/* Brand Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-card/90">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-foreground tracking-tight">
                ParcelPilot
              </span>
              <Badge variant="pine" className="text-[9px] px-1.5 py-0">
                PRO
              </Badge>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground">
              GROUND-TRUTH DISPATCH
            </p>
          </div>
        </div>

        <ThemeToggle />
      </div>

      {/* Operator Profile Card */}
      <div className="p-3.5 m-3 rounded-2xl bg-secondary/50 border border-border space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold font-mono shadow-sm">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground leading-tight">
                {user.display_name}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground">
                {user.role}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition"
            title="Switch operator"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <span>CREDIT AUTH THRESHOLD:</span>
          <strong className="text-foreground">
            {user.role.toLowerCase().includes("manager") ? "UNLIMITED" : "≤ ₹1,000"}
          </strong>
        </div>
      </div>

      {/* Global Quick Action Search (⌘K) */}
      <div className="px-3">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full px-3 py-2 rounded-xl bg-secondary/60 hover:bg-secondary border border-border text-left transition flex items-center justify-between text-xs text-muted-foreground shadow-sm group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-foreground font-medium text-[11.5px]">Command Palette</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-card text-[10px] font-mono border border-border">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto px-3 space-y-4 py-3">
        {/* Quick Benchmark Cases */}
        <div className="space-y-1.5">
          <div className="px-2 flex items-center justify-between text-[10.5px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
            <span>BENCHMARK CASES</span>
            <span>CLICK TO RUN</span>
          </div>

          <div className="space-y-1">
            {QUICK_BENCHMARKS.map((b) => (
              <button
                key={b.code}
                type="button"
                onClick={() => onSelectPrompt(b.prompt)}
                className="w-full p-2.5 rounded-xl hover:bg-secondary/70 border border-transparent hover:border-border text-left transition group flex items-start gap-2.5"
              >
                <div className="p-1.5 rounded-lg bg-secondary text-foreground mt-0.5 group-hover:scale-105 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                  {b.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {b.title}
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0 font-normal">
                      {b.badge}
                    </Badge>
                  </div>
                  <p className="text-[10.5px] text-muted-foreground truncate mt-0.5">
                    {b.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Source Hierarchy Reference Card */}
        <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-2">
          <div className="flex items-center gap-1.5 text-[10.5px] font-mono font-bold text-foreground uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span>SOURCE PRECEDENCE ORDER</span>
          </div>
          <div className="space-y-1 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-primary font-bold">
              <span>1.</span>
              <span>Signed Contract (Overrides All)</span>
            </div>
            <div className="flex items-center gap-1.5 text-foreground">
              <span>2.</span>
              <span>Support Policy v3.0 (Active)</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>3.</span>
              <span>Product SOPs &amp; Guides</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground/60">
              <span>4.</span>
              <span>Historical Tickets (Context Only)</span>
            </div>
          </div>
        </div>

        {/* Database Telemetry Stats */}
        <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-2">
          <div className="flex items-center justify-between text-[10.5px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-accent" />
              <span>DATA PACK ASSETS</span>
            </div>
            <span className="text-success text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              HEALTHY
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-mono">
            <div className="p-2 rounded-xl bg-card border border-border/80 text-center">
              <span className="text-muted-foreground block text-[9.5px]">ACCOUNTS</span>
              <strong className="text-foreground text-xs">4 Active</strong>
            </div>
            <div className="p-2 rounded-xl bg-card border border-border/80 text-center">
              <span className="text-muted-foreground block text-[9.5px]">ORDERS</span>
              <strong className="text-foreground text-xs">6 Records</strong>
            </div>
            <div className="p-2 rounded-xl bg-card border border-border/80 text-center">
              <span className="text-muted-foreground block text-[9.5px]">TICKETS</span>
              <strong className="text-foreground text-xs">7 Total</strong>
            </div>
            <div className="p-2 rounded-xl bg-card border border-border/80 text-center">
              <span className="text-muted-foreground block text-[9.5px]">PDF VECTORS</span>
              <strong className="text-foreground text-xs">6 Docs</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Snapshot Reference Clock */}
      <div className="p-3.5 border-t border-border bg-secondary/30 text-[10.5px] font-mono text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3 h-3 text-success animate-pulse" />
          <span>SNAPSHOT CLOCK:</span>
        </div>
        <span className="text-foreground font-bold">16-AUG 11:00 IST</span>
      </div>
    </aside>
  );
};
