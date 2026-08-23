"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  FileText,
  FileSpreadsheet,
  Layers,
  AlertOctagon,
  ShieldCheck,
  Zap,
  Terminal,
  Database,
  ArrowRight,
  X,
  Sparkles,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

const COMMAND_ITEMS = [
  {
    category: "Benchmark Scenarios",
    items: [
      {
        id: "cmd-1",
        title: "Northstar Pre-Pickup Cancellation",
        desc: "Verify signed contract clause overriding default cancellation fee",
        prompt: "Can Northstar cancel ORD-1001 without a cancellation fee? Explain why.",
        icon: <FileText className="w-4 h-4 text-info" />,
        badge: "ORD-1001",
      },
      {
        id: "cmd-2",
        title: "LumenWorks Late Pickup Credit",
        desc: "Calculate service credit for carrier-fault late pickup (>4h)",
        prompt: "Check order ORD-2002 for LumenWorks. The pickup was missed due to carrier fault. What service credit is due, and why?",
        icon: <FileSpreadsheet className="w-4 h-4 text-success" />,
        badge: "ORD-2002",
      },
      {
        id: "cmd-3",
        title: "Growth Plan Bulk Upload Limits",
        desc: "Verify 5,000 limit in Policy v3 vs known bug vs TKT-451 trap",
        prompt: "What is the maximum bulk upload row limit for LumenWorks on the Growth plan? Check policies and historical tickets.",
        icon: <Layers className="w-4 h-4 text-warning" />,
        badge: "KI-208",
      },
      {
        id: "cmd-4",
        title: "P1 Security API Key Exposure",
        desc: "Immediate P1 escalation and token rotation for TKT-505",
        prompt: "Look up ticket TKT-505. What severity is this, and what immediate action should be taken?",
        icon: <AlertOctagon className="w-4 h-4 text-destructive" />,
        badge: "TKT-505",
      },
    ],
  },
  {
    category: "Quick Account Audits",
    items: [
      {
        id: "cmd-5",
        title: "Northstar Logistics Contract Audit",
        desc: "Query active contract amendments and custom SLA terms",
        prompt: "What are the specific contract override clauses for Northstar Logistics (ACC-001)?",
        icon: <Database className="w-4 h-4 text-accent" />,
        badge: "ACC-001",
      },
      {
        id: "cmd-6",
        title: "Apex Retail SLA Breach Audit",
        desc: "Review open tickets and delivery SLA compliance",
        prompt: "Analyze open tickets and orders for Apex Retail (ACC-002). Are there any SLA breach risks?",
        icon: <ShieldCheck className="w-4 h-4 text-primary" />,
        badge: "ACC-002",
      },
    ],
  },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter items
  const filteredGroups = COMMAND_ITEMS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.desc.toLowerCase().includes(query.toLowerCase()) ||
        item.badge.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter((group) => group.items.length > 0);

  const flatItems = filteredGroups.flatMap((g) => g.items);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (flatItems.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % (flatItems.length || 1));
      } else if (e.key === "Enter" && flatItems[selectedIndex]) {
        e.preventDefault();
        onSelectPrompt(flatItems[selectedIndex].prompt);
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, onClose, onSelectPrompt]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-foreground/40 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-modal overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div className="p-4 border-b border-border flex items-center gap-3 bg-secondary/30">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search benchmark cases, order investigations, or account audits..."
            className="flex-1 bg-transparent text-sm font-sans text-foreground placeholder-muted-foreground focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary text-[10px] font-mono text-muted-foreground border border-border">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {filteredGroups.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs font-mono space-y-1">
              <Sparkles className="w-6 h-6 mx-auto text-primary animate-pulse mb-2" />
              <p>NO EXACT MATCHES FOUND FOR &quot;{query}&quot;</p>
              <p className="text-[11px] text-muted-foreground/70">
                Press Enter to run as a custom query in the dispatch terminal.
              </p>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.category} className="space-y-1.5">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground px-2">
                  {group.category}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isSelected = flatItems[selectedIndex]?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectPrompt(item.prompt);
                          onClose();
                        }}
                        className={`w-full p-3 rounded-xl text-left transition flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "hover:bg-secondary/60 text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-lg ${
                              isSelected ? "bg-white/20 text-white" : "bg-secondary text-foreground"
                            }`}
                          >
                            {item.icon}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{item.title}</p>
                            <p
                              className={`text-[11px] truncate ${
                                isSelected ? "text-white/80" : "text-muted-foreground"
                              }`}
                            >
                              {item.desc}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                              isSelected
                                ? "bg-white/15 border-white/30 text-white"
                                : "bg-secondary border-border text-muted-foreground"
                            }`}
                          >
                            {item.badge}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Command Footer */}
        <div className="p-3 border-t border-border bg-secondary/30 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-card border border-border">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-card border border-border">↓</kbd> to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-card border border-border">↵</kbd> to dispatch
            </span>
          </div>
          <span>PARCELPILOT GROUND-TRUTH V3</span>
        </div>
      </motion.div>
    </div>
  );
};
