"use client";

import React from "react";
import { ToolUsage } from "@/types/chat";
import { motion } from "framer-motion";
import { FileSearch, Database, ShieldAlert, Cpu } from "lucide-react";
import { Badge } from "./ui/badge";

interface ToolBadgeProps {
  tool: ToolUsage;
}

export const ToolBadge: React.FC<ToolBadgeProps> = ({ tool }) => {
  const getToolMeta = () => {
    switch (tool.tool_name) {
      case "search_documents":
        return {
          icon: <FileSearch className="w-3 h-3 text-info" />,
          code: "DOC_QUERY",
          label: "Policy & Contract Knowledge Base",
          variant: "slate" as const,
        };
      case "query_structured_data":
        return {
          icon: <Database className="w-3 h-3 text-success" />,
          code: "SQL_DATA",
          label: "Snapshot SQLite & Time Engine",
          variant: "forest" as const,
        };
      case "create_action":
        return {
          icon: <ShieldAlert className="w-3 h-3 text-warning" />,
          code: "ACTION_PROP",
          label: "State Mutation Proposal",
          variant: "saffron" as const,
        };
      default:
        return {
          icon: <Cpu className="w-3 h-3 text-muted-foreground" />,
          code: "SYS_CALL",
          label: tool.tool_display_name || "Telemetry Execution",
          variant: "secondary" as const,
        };
    }
  };

  const meta = getToolMeta();

  return (
    <motion.div
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="inline-flex items-center gap-1.5"
      title={`Telemetry Call: ${tool.tool_display_name}`}
    >
      <Badge variant={meta.variant} className="gap-1 px-1.5 py-0.5 font-mono text-[9.5px]">
        {meta.icon}
        <span>{meta.code}</span>
      </Badge>
      <span className="text-[10.5px] font-sans text-muted-foreground hidden sm:inline">
        {meta.label}
      </span>
    </motion.div>
  );
};
