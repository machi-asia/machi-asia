"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { UsageBar } from "./UsageBar";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  emotion?: string;
  traces?: string[];
  optionsPayload?: {
    question: string;
    options: string[];
    allowMultiple?: boolean;
  };
}

interface ApiResponse {
  text: string;
  history: unknown[];
  traces: string[];
  emotion?: string;
  optionsPayload?: {
    question: string;
    options: string[];
    allowMultiple?: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

const EMOTION_AVATARS: Record<string, string> = {
  happy: "/rose/happy.png",
  bright: "/rose/bright.png",
  coding: "/rose/coding.png",
  confused: "/rose/confused.png",
  researching: "/rose/researching.png",
  sad: "/rose/sad.png",
  sleeping: "/rose/sleeping.png",
  surprised: "/rose/surprised.png",
  thinking: "/rose/thinking.png",
};

const DEFAULT_AVATAR = "/rose/happy.png";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState("happy");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const serverHistoryRef = useRef<unknown[]>([]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        text: text.trim(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            history: serverHistoryRef.current,
            message: text.trim(),
          }),
        });

        const data: ApiResponse = await res.json();

        if (!res.ok || data.error) {
          const errorText = data.error?.message || `Request failed (${res.status})`;
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: "model",
              text: errorText,
              emotion: "sad",
            },
          ]);
          return;
        }

        if (data.history) {
          serverHistoryRef.current = data.history;
        }

        if (data.emotion) {
          setCurrentEmotion(data.emotion);
        }

        const modelMessage: Message = {
          id: generateId(),
          role: "model",
          text: data.text,
          emotion: data.emotion,
          traces: data.traces,
          optionsPayload: data.optionsPayload ?? undefined,
        };

        setMessages((prev) => [...prev, modelMessage]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Could not reach the server.";
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "model",
            text: `Network error: ${message}`,
            emotion: "sad",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleOptionClick = (option: string) => {
    sendMessage(option);
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        {/* eslint-disable-next-line @next/next/no-img-element -- avatar images are local static assets */}
        <img
          className="chat-header-avatar"
          src={EMOTION_AVATARS[currentEmotion] || DEFAULT_AVATAR}
          alt="Rose"
        />
        <div className="chat-header-info">
          <h1>Rose</h1>
          <p>AI Companion {isLoading ? "· thinking..." : "· online"}</p>
        </div>
      </header>

      <UsageBar />
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <h2>Hi, I&apos;m Rose</h2>
            <p>
              A general-purpose AI assistant. Ask me anything — from code reviews
              to math problems to current events.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message message-${msg.role}`}>
            {msg.role === "model" ? (
              /* eslint-disable-next-line @next/next/no-img-element -- avatar images are local static assets */
              <img
                className="message-avatar"
                src={EMOTION_AVATARS[msg.emotion || "happy"] || DEFAULT_AVATAR}
                alt="Rose"
              />
            ) : (
              <div className="message-avatar message-avatar-user">You</div>
            )}
            <div>
              <div className="message-bubble">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>

              {msg.traces && msg.traces.length > 0 && (
                <div className="traces">
                  {msg.traces.map((trace, i) => (
                    <span key={i} className="trace-badge">
                      {trace}
                    </span>
                  ))}
                </div>
              )}

              {msg.optionsPayload && (
                <div className="options-container">
                  {msg.optionsPayload.options.map((opt, i) => (
                    <button
                      key={i}
                      className="option-btn"
                      onClick={() => handleOptionClick(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message message-model">
            {/* eslint-disable-next-line @next/next/no-img-element -- avatar images are local static assets */}
            <img
              className="message-avatar"
              src={EMOTION_AVATARS["thinking"] || DEFAULT_AVATAR}
              alt="Rose"
            />
            <div className="message-bubble">
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Rose anything..."
            rows={1}
            disabled={isLoading}
          />
          <button
            className="chat-send-btn"
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
          >
            &#9650;
          </button>
        </div>
      </div>
    </div>
  );
}
