"use client";

import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { Send } from "lucide-react";
import ChatbotSlashMenu, { type ChatbotSlashMenuHandle } from "./ChatbotSlashMenu";
import ChatbotInputBadge, { type SelectedBadge } from "./ChatbotInputBadge";
import { getAgentCommandCategories, type CommandCategory } from "../lib/commandRegistry";
import { shouldShowSlashMenu } from "../lib/markdownFormatter";

export type InputSegment =
  | { type: "text"; text: string }
  | { type: "badge"; id: string; category: string; title: string; token: string };

export interface ChatbotInputAreaHandle {
  addBadge: (badge: { category: string; title: string; token: string }) => void;
  focus: () => void;
}

interface ChatbotInputAreaProps {
  variant?: "main" | "compact";
  inputValue: string;
  setInputValue: (val: string | ((prev: string) => string)) => void;
  commandCategories?: CommandCategory[];
  showSlashMenu: boolean;
  setShowSlashMenu: (show: boolean) => void;
  isLoading: boolean;
  onSendMessage: (text: string) => void;
}

export const ChatbotInputArea = forwardRef<ChatbotInputAreaHandle, ChatbotInputAreaProps>(
  (
    {
      variant = "main",
      inputValue,
      setInputValue,
      commandCategories,
      showSlashMenu,
      setShowSlashMenu,
      isLoading,
      onSendMessage,
    },
    ref
  ) => {
    const [prefixSegments, setPrefixSegments] = useState<InputSegment[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const slashMenuRef = useRef<ChatbotSlashMenuHandle>(null);

    useImperativeHandle(ref, () => ({
      addBadge: (badgeData) => {
        setPrefixSegments((prev) => [
          ...prev,
          {
            type: "badge",
            id: `badge-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            category: badgeData.category,
            title: badgeData.title,
            token: badgeData.token,
          },
        ]);
        if (inputRef.current) inputRef.current.focus();
      },
      focus: () => {
        if (inputRef.current) inputRef.current.focus();
      },
    }));

    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const compiled = prefixSegments
        .map((s) => (s.type === "badge" ? `${s.token} ` : s.text))
        .join("");
      const fullText = `${compiled}${inputValue}`.trim();
      if (!fullText) return;
      setPrefixSegments([]);
      setInputValue("");
      setShowSlashMenu(false);
      onSendMessage(fullText);
    };

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (showSlashMenu) {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            slashMenuRef.current?.moveNext();
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            slashMenuRef.current?.movePrev();
            return;
          }
          if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
            e.preventDefault();
            slashMenuRef.current?.selectCurrent();
            return;
          }
          if (e.key === "Escape") {
            e.preventDefault();
            setShowSlashMenu(false);
            return;
          }
        }

        if (e.key === "Backspace" && !inputValue && prefixSegments.length > 0) {
          setPrefixSegments((prev) => {
            const updated = [...prev];
            const lastSeg = updated.pop();
            if (lastSeg?.type === "text") {
              setInputValue(lastSeg.text);
            }
            return updated;
          });
          return;
        }
      },
      [showSlashMenu, inputValue, prefixSegments.length, setShowSlashMenu, setInputValue]
    );

    const isSendDisabled =
      isLoading ||
      (!inputValue.trim() &&
        prefixSegments.every((s) => s.type === "text" && !s.text.trim()));

    return (
      <form className={`chatbot-input-area chatbot-input-area--${variant}`} onSubmit={handleFormSubmit}>
        <div className="chatbot-input-container">
          {showSlashMenu && (
            <ChatbotSlashMenu
              ref={slashMenuRef}
              categories={getAgentCommandCategories(commandCategories)}
              inputValue={inputValue}
              onSelectCategory={(cat) => {
                setInputValue((prev) => {
                  const lastSlash = prev.lastIndexOf("/");
                  const beforeSlash = lastSlash !== -1 ? prev.substring(0, lastSlash) : "";
                  return `${beforeSlash}${cat.command} `;
                });
                if (inputRef.current) inputRef.current.focus();
              }}
              onSelectItem={(item) => {
                setShowSlashMenu(false);
                const lastSlash = inputValue.lastIndexOf("/");
                const beforeSlash = lastSlash !== -1 ? inputValue.substring(0, lastSlash) : "";

                setPrefixSegments((prev) => {
                  const updated = [...prev];
                  if (beforeSlash) {
                    updated.push({ type: "text", text: beforeSlash });
                  }
                  updated.push({
                    type: "badge",
                    id: `${item.id}-${Date.now()}`,
                    category: item.category,
                    title: item.title,
                    token: item.termBadge || `@${item.category}:"${item.title}"`,
                  });
                  return updated;
                });

                setInputValue("");
                if (inputRef.current) inputRef.current.focus();
              }}
            />
          )}

          {prefixSegments.map((segment, index) => {
            if (segment.type === "text") {
              return (
                <span key={`text-${index}`} className="chatbot-input-text-segment">
                  {segment.text}
                </span>
              );
            }
            return (
              <ChatbotInputBadge
                key={segment.id}
                badge={segment}
                onRemove={(id) =>
                  setPrefixSegments((prev) => prev.filter((s) => s.type !== "badge" || s.id !== id))
                }
              />
            );
          })}

          <input
            ref={inputRef}
            type="text"
            className="chatbot-input"
            placeholder={
              prefixSegments.length > 0
                ? "Continue message..."
                : "Type a message or / for commands..."
            }
            value={inputValue}
            onChange={(e) => {
              const val = e.target.value;
              setInputValue(val);
              setShowSlashMenu(shouldShowSlashMenu(val));
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          className="chatbot-send-btn"
          disabled={isSendDisabled}
          aria-label="Send message"
        >
          <Send size={15} />
        </button>
      </form>
    );
  }
);

ChatbotInputArea.displayName = "ChatbotInputArea";

export default ChatbotInputArea;
