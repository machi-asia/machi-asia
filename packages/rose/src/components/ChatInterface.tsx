"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import { useAuth } from "@machi-asia/auth";
import { UsageBar } from "./UsageBar";
import { Chat, type RoseMessage } from "./Chat";
import { ChatbotInputArea, type ChatbotInputAreaHandle } from "./ChatbotInputArea";
import { getAgentCommandCategories } from "../lib/commandRegistry";
import { ROSE_EMOTIONS } from "../lib/roseEmotions";
import { formatErrorMessage, formatUsageLimitMessage } from "../lib/errorFormatter";

interface ApiResponse {
  text?: string;
  history?: any[];
  traces?: string[];
  emotion?: string;
  variant?: "default" | "error" | "warning";
  optionsPayload?: {
    question: string;
    options: string[];
    allowMultiple?: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
  usage?: {
    allowed: boolean;
    count: number;
    limit: number;
    week: string;
  };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ChatInterface() {
  const { session } = useAuth();
  const [messages, setMessages] = useState<RoseMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState("happy");
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [traces, setTraces] = useState<string[]>([]);
  const inputAreaRef = useRef<ChatbotInputAreaHandle>(null);
  const serverHistoryRef = useRef<any[]>([]);

  const commandCategories = useMemo(() => getAgentCommandCategories(), []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: RoseMessage = {
        id: generateId(),
        role: "user",
        text: text.trim(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setShowSlashMenu(false);
      setIsLoading(true);
      setTraces(["thinking"]);
      setCurrentEmotion("thinking");

      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (session?.accessToken) {
          headers["Authorization"] = `Bearer ${session.accessToken}`;
        }

        const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "";
        const res = await fetch(`${gatewayUrl}/api/rose/chat`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            history: serverHistoryRef.current,
            message: text.trim(),
          }),
        });

        const data: ApiResponse = await res.json();

        if (res.status === 429 || data.error?.code === "usage_limit_exceeded") {
          const usageText = data.text || formatUsageLimitMessage(data.usage);
          const finalEmotion = data.emotion || "sleeping";
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: "model",
              text: usageText,
              emotion: finalEmotion,
              variant: "warning",
            },
          ]);
          setCurrentEmotion(finalEmotion);
          return;
        }

        if (!res.ok || data.error) {
          const errorMsg = data.text || formatErrorMessage(data.error || `Request failed with status ${res.status}`);
          const finalEmotion = data.emotion || "sad";
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: "model",
              text: errorMsg,
              emotion: finalEmotion,
              variant: "error",
            },
          ]);
          setCurrentEmotion(finalEmotion);
          return;
        }

        if (data.history) {
          serverHistoryRef.current = data.history;
        }

        const finalEmotion = data.emotion || "happy";
        setCurrentEmotion(finalEmotion);

        const resolvedVariant: "default" | "error" | "warning" =
          data.variant ||
          (finalEmotion === "sad" || data.text?.includes("Error Encountered")
            ? "error"
            : finalEmotion === "sleeping" || data.text?.includes("Usage Limit Reached")
            ? "warning"
            : "default");

        const modelMessage: RoseMessage = {
          id: generateId(),
          role: "model",
          text: data.text || "",
          emotion: finalEmotion,
          variant: resolvedVariant,
          traces: data.traces,
          optionsPayload: data.optionsPayload ?? undefined,
        };

        setMessages((prev) => [...prev, modelMessage]);
      } catch (err: unknown) {
        const errorText = formatErrorMessage(err, "Please check your network connection and retry.");
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "model",
            text: errorText,
            emotion: "sad",
            variant: "error",
          },
        ]);
        setCurrentEmotion("sad");
      } finally {
        setIsLoading(false);
        setTraces([]);
      }
    },
    [isLoading, session?.accessToken]
  );

  return (
    <div className="chat-container">
      <header className="chat-header">
        <img
          src={ROSE_EMOTIONS[currentEmotion] || "/rose/happy.png"}
          alt="Rose"
          className="chat-header-avatar"
        />
        <div className="chat-header-info">
          <h1>Rose</h1>
          <p>{isLoading ? "thinking..." : "online"}</p>
        </div>
      </header>

      <UsageBar />

      <Chat
        messages={messages}
        isLoading={isLoading}
        currentEmotion={currentEmotion}
        traces={traces}
        onOptionSelect={sendMessage}
        onSelectStarter={sendMessage}
        onSelectBadge={(b) => inputAreaRef.current?.addBadge(b)}
      />

      <ChatbotInputArea
        ref={inputAreaRef}
        inputValue={input}
        setInputValue={setInput}
        commandCategories={commandCategories}
        showSlashMenu={showSlashMenu}
        setShowSlashMenu={setShowSlashMenu}
        isLoading={isLoading}
        onSendMessage={sendMessage}
      />
    </div>
  );
}

export default ChatInterface;