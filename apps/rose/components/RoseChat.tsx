"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@machi-asia/auth";
import {
  Chat,
  UsageBar,
  ChatbotInputArea,
  getAgentCommandCategories,
  ROSE_EMOTIONS,
  formatErrorMessage,
  formatUsageLimitMessage,
} from "@machi-asia/rose";
import type {
  RoseMessage,
  RoseOptionPayload,
  ChatbotInputAreaHandle,
  ReferenceBadge,
} from "@machi-asia/rose";

interface SessionRow {
  id: string;
  title: string;
  updated_at: string;
}

interface StoredMessage {
  id: string;
  session_id: string;
  role: "user" | "model";
  content: string;
  emotion: string | null;
  traces: string[] | null;
  created_at: string;
}

interface SessionChatResponse {
  text: string;
  traces?: string[];
  emotion?: string;
  variant?: "default" | "error" | "warning";
  optionsPayload?: RoseOptionPayload | null;
  messages?: StoredMessage[];
  usage?: {
    allowed: boolean;
    count: number;
    limit: number;
    week: string;
  };
  error?: { code: string; message: string };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toViewMessage(msg: StoredMessage): RoseMessage {
  return {
    id: msg.id,
    role: msg.role,
    text: msg.content,
    emotion: msg.emotion ?? undefined,
    traces: msg.traces ?? undefined,
  };
}

export function RoseChat() {
  const { session, logout } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<RoseMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [traces, setTraces] = useState<string[]>([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState("happy");

  const inputAreaRef = useRef<ChatbotInputAreaHandle>(null);
  const initializedRef = useRef(false);
  const refreshUsageRef = useRef<(() => void) | null>(null);

  const commandCategories = useMemo(() => getAgentCommandCategories(), []);

  const authHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }
    return headers;
  }, [session?.accessToken]);

  const refreshSessions = useCallback(async () => {
    const res = await fetch("/api/rose/sessions", { headers: authHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    setSessions(Array.isArray(data.sessions) ? data.sessions : []);
  }, [authHeaders]);

  const loadSession = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/rose/sessions/${encodeURIComponent(id)}`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      const rows: StoredMessage[] = Array.isArray(data.messages)
        ? data.messages
        : [];
      setMessages(rows.map(toViewMessage));

      const lastModel = rows.filter((r) => r.role === "model").pop();
      if (lastModel?.emotion) {
        setCurrentEmotion(lastModel.emotion);
      } else {
        setCurrentEmotion("happy");
      }
    },
    [authHeaders]
  );

  const createSession = useCallback(async (): Promise<SessionRow | null> => {
    const res = await fetch("/api/rose/sessions", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({}),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const created: SessionRow = data.session;
    setActiveId(created.id);
    setMessages([]);
    setCurrentEmotion("happy");
    setSessions((prev) => [
      created,
      ...prev.filter((s) => s.id !== created.id),
    ]);
    return created;
  }, [authHeaders]);

  const selectSession = useCallback(
    (id: string) => {
      if (id === activeId) return;
      setActiveId(id);
      loadSession(id);
    },
    [activeId, loadSession]
  );

  const deleteSession = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/rose/sessions/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const next = sessions.filter((s) => s.id !== id);
      setSessions(next);
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
      if (next.length === 0) {
        await createSession();
      }
    },
    [authHeaders, sessions, activeId, createSession]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      let targetId = activeId;
      if (!targetId) {
        const created = await createSession();
        if (!created) {
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: "model",
              text: "Could not create a chat session. Please check your connection or try again.",
              emotion: "sad",
            },
          ]);
          setCurrentEmotion("sad");
          return;
        }
        targetId = created.id;
      }

      const trimmed = text.trim();
      setMessages((prev) => [
        ...prev,
        { id: generateId(), role: "user", text: trimmed },
      ]);
      setInput("");
      setShowSlashMenu(false);
      setIsLoading(true);
      setTraces(["thinking"]);
      setCurrentEmotion("thinking");

      try {
        const res = await fetch(
          `/api/rose/sessions/${encodeURIComponent(targetId)}/chat`,
          {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ message: trimmed }),
          }
        );
        const data: SessionChatResponse = (await res.json().catch(() => null)) ?? {};

        refreshUsageRef.current?.();

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
          const errorText = data.text || formatErrorMessage(data.error || `Request failed (${res.status})`);
          const finalEmotion = data.emotion || "sad";
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: "model",
              text: errorText,
              emotion: finalEmotion,
              variant: "error",
            },
          ]);
          setCurrentEmotion(finalEmotion);
          return;
        }

        const finalEmotion = data.emotion || "happy";
        setCurrentEmotion(finalEmotion);

        const stored = Array.isArray(data.messages) ? data.messages : [];
        const modelStored = stored.find((m) => m.role === "model");
        const resolvedVariant: "default" | "error" | "warning" =
          data.variant ||
          (finalEmotion === "sad" || data.text?.includes("Error Encountered")
            ? "error"
            : finalEmotion === "sleeping" || data.text?.includes("Usage Limit Reached")
            ? "warning"
            : "default");

        setMessages((prev) => [
          ...prev,
          {
            id: modelStored?.id ?? generateId(),
            role: "model",
            text: data.text,
            emotion: finalEmotion,
            variant: resolvedVariant,
            traces: data.traces,
            optionsPayload: data.optionsPayload ?? undefined,
          },
        ]);
        await refreshSessions();
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
    [activeId, isLoading, createSession, authHeaders, refreshSessions]
  );

  const handleSelectBadge = useCallback((badge: ReferenceBadge) => {
    inputAreaRef.current?.addBadge(badge);
  }, []);

  useEffect(() => {
    if (initializedRef.current || !session) return;
    initializedRef.current = true;
    (async () => {
      try {
        const res = await fetch("/api/rose/sessions", {
          headers: authHeaders(),
        });
        if (!res.ok) return;
        const data = await res.json();
        const rows: SessionRow[] = Array.isArray(data.sessions)
          ? data.sessions
          : [];
        if (rows.length === 0) {
          await createSession();
        } else {
          setSessions(rows);
          setActiveId(rows[0].id);
          await loadSession(rows[0].id);
        }
      } catch {
        // non-critical
      }
    })();
  }, [session, authHeaders, createSession, loadSession]);

  const headerAvatarUrl = ROSE_EMOTIONS[currentEmotion] || "/rose/happy.png";

  return (
    <div className="rose-app">
      <aside className="rose-sidebar">
        <div className="rose-sidebar-header">
          <h2>Rose</h2>
          <button className="rose-new-chat-btn" onClick={() => createSession()}>
            + New chat
          </button>
        </div>
        <ul className="rose-session-list">
          {sessions.map((s) => (
            <li key={s.id} className="rose-session-item">
              <button
                className={`rose-session-btn${s.id === activeId ? " active" : ""}`}
                onClick={() => selectSession(s.id)}
                title={s.title}
              >
                {s.title}
              </button>
              <button
                className="rose-session-delete"
                onClick={() => deleteSession(s.id)}
                aria-label={`Delete ${s.title}`}
              >
                &#10005;
              </button>
            </li>
          ))}
        </ul>
        <button className="rose-logout-btn" onClick={() => logout()}>
          Log out
        </button>
      </aside>
      <main className="rose-main">
        <div className="chat-container">
          <header className="chat-header">
            {/* eslint-disable-next-line @next/next/no-img-element -- static avatar asset */}
            <img
              src={headerAvatarUrl}
              alt="Rose"
              className="chat-header-avatar"
            />
            <div className="chat-header-info">
              <h1>Rose — AI Companion</h1>
              <p>{isLoading ? "thinking..." : "online"}</p>
            </div>
          </header>

          <UsageBar onRefreshRef={refreshUsageRef} />
          <Chat
            messages={messages}
            isLoading={isLoading}
            currentEmotion={currentEmotion}
            traces={traces}
            avatarUrl={headerAvatarUrl}
            onOptionSelect={sendMessage}
            onSelectStarter={sendMessage}
            onSelectBadge={handleSelectBadge}
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
      </main>
    </div>
  );
}

export default RoseChat;