"use client";

import React, { useState } from "react";
import { UserInfo } from "@/types/chat";
import { LoginMock } from "@/components/LoginMock";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/ChatWindow";
import { SignalsPanel } from "@/components/SignalsPanel";
import { CommandPalette } from "@/components/CommandPalette";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [externalPrompt, setExternalPrompt] = useState<string | undefined>(undefined);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {!currentUser ? (
        <motion.div
          key="login-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="h-screen w-screen overflow-hidden"
        >
          <LoginMock onLoginSuccess={(user) => setCurrentUser(user)} />
        </motion.div>
      ) : (
        <motion.main
          key="app-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="h-screen w-screen flex overflow-hidden bg-background"
        >
          {/* Left Column: Command & Context Navigation (Sidebar) */}
          <div className="hidden md:block flex-shrink-0">
            <Sidebar
              user={currentUser}
              onLogout={() => setCurrentUser(null)}
              onSelectPrompt={(prompt) => setExternalPrompt(prompt)}
              onOpenCommandPalette={() => setIsCommandOpen(true)}
            />
          </div>

          {/* Center Column: Ground-Truth Dispatch Terminal (ChatWindow) */}
          <div className="flex-1 h-full min-w-0">
            <ChatWindow
              user={currentUser}
              onLogout={() => setCurrentUser(null)}
              externalPrompt={externalPrompt}
              onClearExternalPrompt={() => setExternalPrompt(undefined)}
            />
          </div>

          {/* Right Column: Proactive Intelligence Radar (SignalsPanel) */}
          <div className="hidden xl:block w-80 h-full flex-shrink-0">
            <SignalsPanel onSelectPrompt={(prompt) => setExternalPrompt(prompt)} />
          </div>

          {/* Global Command Palette (⌘K) */}
          <CommandPalette
            isOpen={isCommandOpen}
            onClose={() => setIsCommandOpen(false)}
            onSelectPrompt={(prompt) => setExternalPrompt(prompt)}
          />
        </motion.main>
      )}
    </AnimatePresence>
  );
}
