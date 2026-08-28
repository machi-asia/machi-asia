"use client";

import React, { useEffect, useRef } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ChatbotOptionsPicker, type OptionsPayload } from "./ChatbotOptionsPicker";
import { ChatbotTraces } from "./ChatbotTraces";
import { ChatbotWelcome, type StarterItem, type ReferenceBadge, type QuickCommand } from "./ChatbotWelcome";
import { ROSE_EMOTIONS } from "../lib/roseEmotions";

export type { OptionsPayload as RoseOptionPayload };

export interface RoseMessage {
  id: string;
  role: "user" | "model";
  text: string;
  emotion?: string;
  variant?: "default" | "error" | "warning";
  traces?: string[];
  optionsPayload?: OptionsPayload;
}

export interface RoseChatProps {
  messages: RoseMessage[];
  onOptionSelect?: (option: string) => void;
  onSelectStarter?: (query: string) => void;
  onSelectBadge?: (badge: ReferenceBadge) => void;
  isLoading?: boolean;
  currentEmotion?: string;
  traces?: string[];
  avatarUrl?: string;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  welcomeStarters?: StarterItem[];
  welcomeBadges?: ReferenceBadge[];
  welcomeQuickCommands?: QuickCommand[];
  emptyState?: { title: string; description: string };
  className?: string;
}

const DEFAULT_AVATAR = "/rose/happy.png";

function resolveMessageVariant(msg: RoseMessage): "default" | "error" | "warning" {
  if (msg.variant === "error" || msg.variant === "warning") return msg.variant;
  if (msg.role === "model") {
    if (
      msg.text.includes("Usage Limit Reached") ||
      msg.text.includes("Daily Usage Limit Reached") ||
      msg.text.includes("Weekly Usage Limit Reached") ||
      msg.text.includes("usage_limit_exceeded")
    ) {
      return "warning";
    }
    if (
      msg.text.includes("Error Encountered") ||
      msg.text.includes("Gemini API Error") ||
      msg.text.includes("Network error") ||
      msg.text.includes("INTERNAL_ERROR") ||
      msg.text.includes("internal_error") ||
      msg.text.includes("REQUEST_ERROR") ||
      msg.text.includes("API_ERROR") ||
      msg.emotion === "sad"
    ) {
      return "error";
    }
  }
  return msg.variant || "default";
}

export function Chat({
  messages,
  onOptionSelect,
  onSelectStarter,
  onSelectBadge,
  isLoading = false,
  currentEmotion = "happy",
  traces = [],
  avatarUrl,
  welcomeTitle,
  welcomeSubtitle,
  welcomeStarters,
  welcomeBadges,
  welcomeQuickCommands,
  className = "chat-messages",
}: RoseChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, traces]);

  const activeAvatar = avatarUrl || ROSE_EMOTIONS[currentEmotion] || DEFAULT_AVATAR;

  return (
    <div className={className}>
      {messages.length === 0 && !isLoading && (
        <ChatbotWelcome
          avatarUrl={activeAvatar}
          title={welcomeTitle}
          subtitle={welcomeSubtitle}
          starters={welcomeStarters}
          badges={welcomeBadges}
          quickCommands={welcomeQuickCommands}
          onSelectStarter={(q) => {
            if (onSelectStarter) onSelectStarter(q);
            else onOptionSelect?.(q);
          }}
          onSelectBadge={(b) => {
            if (onSelectBadge) onSelectBadge(b);
          }}
        />
      )}

      {messages.map((msg) => {
        const variant = resolveMessageVariant(msg);
        const variantClass =
          variant === "error"
            ? "chatbot-msg--error"
            : variant === "warning"
            ? "chatbot-msg--warning"
            : "";

        return (
          <div
            key={msg.id}
            className={`chatbot-msg-container ${
              msg.role === "user" ? "user-container" : "model-container"
            } ${variant !== "default" ? `container--${variant}` : ""}`}
          >
            {msg.role === "model" && (
              <div
                className={`chatbot-msg-avatar ${
                  variant === "error"
                    ? "avatar--error"
                    : variant === "warning"
                    ? "avatar--warning"
                    : ""
                }`}
              >
                <img
                  src={ROSE_EMOTIONS[msg.emotion || currentEmotion] || DEFAULT_AVATAR}
                  alt="Rose"
                  className="chatbot-avatar-img"
                />
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", maxWidth: "100%" }}>
              <div
                className={`chatbot-msg ${
                  msg.role === "user" ? "chatbot-msg-user" : "chatbot-msg-model"
                } ${variantClass}`.trim()}
              >
                <MarkdownRenderer content={msg.text} variant="chatbot" />
              </div>

              {msg.role === "model" && msg.traces && msg.traces.length > 0 && (
                <ChatbotTraces traces={msg.traces} defaultExpanded={false} />
              )}

              {msg.role === "model" && msg.optionsPayload && (
                <ChatbotOptionsPicker
                  payload={msg.optionsPayload}
                  onSelectOption={(opt) => onOptionSelect?.(opt)}
                  disabled={isLoading}
                />
              )}
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="chatbot-msg-container model-container">
          <div className="chatbot-msg-avatar">
            <img
              src={ROSE_EMOTIONS["thinking"] || DEFAULT_AVATAR}
              alt="Rose"
              className="chatbot-avatar-img"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: "100%" }}>
            <div className="chatbot-msg chatbot-msg-model chatbot-msg-loading">
              <ChatbotTraces
                traces={traces.length > 0 ? traces : ["thinking"]}
                defaultExpanded={true}
                photoUrl={ROSE_EMOTIONS["thinking"] || DEFAULT_AVATAR}
              />
              <div className="typing-indicator" style={{ marginTop: "0.4rem" }}>
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

export default Chat;