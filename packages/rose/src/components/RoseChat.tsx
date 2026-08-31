"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@machi-asia/auth";
import { AuthModal, type LoginCredentials, type RegisterDetails } from "@machi-asia/ui";
import { Chat, type RoseMessage, type RoseOptionPayload } from "./Chat";
import { UsageBar } from "./UsageBar";
import { ChatbotInputArea, type ChatbotInputAreaHandle } from "./ChatbotInputArea";
import { getAgentCommandCategories } from "../lib/commandRegistry";
import { ROSE_EMOTIONS } from "../lib/roseEmotions";
import { formatErrorMessage, formatUsageLimitMessage } from "../lib/errorFormatter";
import { MemoriesSettingsModal } from "./MemoriesSettingsModal";
import type { ReferenceBadge } from "./ChatbotWelcome";
import { roseApiBase } from "../lib/roseEnv";

export interface SessionRow {
  id: string;
  title: string;
  updated_at: string;
}

export interface StoredMessage {
  id: string;
  session_id: string;
  role: "user" | "model";
  content: string;
  emotion: string | null;
  traces: string[] | null;
  created_at: string;
}

export interface SessionChatResponse {
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

export interface RoseChatProps {
  /**
   * Base URL (origin + prefix) of the Rose API. Defaults to the shared
   * resolution in roseApiBase() — NEXT_PUBLIC_GATEWAY_URL + "/api/rose" when
   * set, else same-origin "/api/rose". Pass an explicit value only when the
   * host app mounts the rose routes elsewhere.
   */
  apiBasePath?: string;
  /**
   * Title shown in the chat header. Defaults to "Rose — AI Companion".
   */
  title?: string;
  /**
   * Whether to require authentication before chatting. Defaults to true.
   */
  requireAuth?: boolean;
  /**
   * Whether to render the sidebar for session history and switching. Defaults to true.
   */
  showSidebar?: boolean;
  /**
   * Whether to render the top chat header with avatar, status, and memory trigger. Defaults to true.
   */
  showHeader?: boolean;
  /**
   * Whether to enable the Memories & Notes modal triggers. Defaults to true.
   */
  showMemories?: boolean;
  /**
   * Whether to show the usage limits bar. Defaults to true.
   */
  showUsage?: boolean;
  /**
   * Whether to show the logout button in sidebar footer. Defaults to true.
   */
  showLogout?: boolean;
  /**
   * Callback invoked when the user clicks logout. Defaults to calling useAuth().logout().
   */
  onLogout?: () => void;
  /**
   * Initial active session ID if specified.
   */
  initialSessionId?: string;
  /**
   * Additional custom CSS class name for outer container.
   */
  className?: string;
  /**
   * Callback fired when the active session changes.
   */
  onSessionChange?: (sessionId: string | null) => void;
  /**
   * Callback fired when a message is submitted by the user.
   */
  onMessageSent?: (message: string) => void;
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

export function RoseChat({
  apiBasePath,
  title = "Rose — AI Companion",
  requireAuth = true,
  showSidebar = true,
  showHeader = true,
  showMemories = true,
  showUsage = true,
  showLogout = true,
  onLogout,
  initialSessionId,
  className = "",
  onSessionChange,
  onMessageSent,
}: RoseChatProps) {
  const { session, logout, login, register, guestLogin, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialSessionId ?? null);
  const [messages, setMessages] = useState<RoseMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [traces, setTraces] = useState<string[]>([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showMemoriesModal, setShowMemoriesModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
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

  const cleanBase = useMemo(() => roseApiBase(apiBasePath), [apiBasePath]);

  const refreshSessions = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch(`${cleanBase}/sessions`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch {
      // non-critical
    }
  }, [session, authHeaders, cleanBase]);

  const loadSession = useCallback(
    async (id: string) => {
      if (!session) return;
      try {
        const res = await fetch(`${cleanBase}/sessions/${encodeURIComponent(id)}`, {
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
      } catch {
        // non-critical
      }
    },
    [session, authHeaders, cleanBase]
  );

  const createSession = useCallback(async (): Promise<SessionRow | null> => {
    if (!session) {
      setShowAuthModal(true);
      return null;
    }
    try {
      const res = await fetch(`${cleanBase}/sessions`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({}),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const created: SessionRow = data.session;
      setActiveId(created.id);
      onSessionChange?.(created.id);
      setMessages([]);
      setCurrentEmotion("happy");
      setSessions((prev) => [
        created,
        ...prev.filter((s) => s.id !== created.id),
      ]);
      return created;
    } catch {
      return null;
    }
  }, [session, authHeaders, cleanBase, onSessionChange]);

  const selectSession = useCallback(
    (id: string) => {
      if (id === activeId) return;
      setActiveId(id);
      onSessionChange?.(id);
      loadSession(id);
    },
    [activeId, loadSession, onSessionChange]
  );

  const deleteSession = useCallback(
    async (id: string) => {
      if (!session) return;
      try {
        const res = await fetch(`${cleanBase}/sessions/${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
        if (!res.ok) return;
        const next = sessions.filter((s) => s.id !== id);
        setSessions(next);
        if (activeId === id) {
          setActiveId(null);
          onSessionChange?.(null);
          setMessages([]);
        }
        if (next.length === 0) {
          await createSession();
        }
      } catch {
        // non-critical
      }
    },
    [session, authHeaders, cleanBase, sessions, activeId, onSessionChange, createSession]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      if (!session) {
        setShowAuthModal(true);
        return;
      }

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
      onMessageSent?.(trimmed);
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
          `${cleanBase}/sessions/${encodeURIComponent(targetId)}/chat`,
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
    [session, activeId, isLoading, createSession, onMessageSent, cleanBase, authHeaders, refreshSessions]
  );

  const handleSelectBadge = useCallback((badge: ReferenceBadge) => {
    inputAreaRef.current?.addBadge(badge);
  }, []);

  const handleLogout = useCallback(() => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
  }, [onLogout, logout]);

  useEffect(() => {
    if (initializedRef.current || !session) return;
    initializedRef.current = true;
    (async () => {
      try {
        const res = await fetch(`${cleanBase}/sessions`, {
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
          const pickId = initialSessionId && rows.some((r) => r.id === initialSessionId)
            ? initialSessionId
            : rows[0].id;
          setActiveId(pickId);
          onSessionChange?.(pickId);
          await loadSession(pickId);
        }
      } catch {
        // non-critical
      }
    })();
  }, [session, authHeaders, cleanBase, createSession, initialSessionId, loadSession, onSessionChange]);

  const headerAvatarUrl = ROSE_EMOTIONS[currentEmotion] || "/rose/happy.png";
  const isLocked = requireAuth && !session && !authLoading;

  return (
    <div className={`rose-app${className ? ` ${className}` : ""}`}>
      {showSidebar && (
        <aside className="rose-sidebar">
          <div className="rose-sidebar-header">
            <h2>Rose</h2>
            <button
              className="rose-new-chat-btn"
              onClick={() => {
                if (!session) setShowAuthModal(true);
                else createSession();
              }}
            >
              + New chat
            </button>
          </div>
          <ul className="rose-session-list">
            {session ? (
              sessions.map((s) => (
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
              ))
            ) : (
              <li style={{ padding: "16px 8px", textAlign: "center", color: "var(--rose-text-muted)", fontSize: "0.82rem" }}>
                Sign in to view and persist chat sessions.
              </li>
            )}
          </ul>
          <div className="rose-sidebar-footer">
            {showMemories && (
              <button
                className="rose-memories-nav-btn"
                onClick={() => {
                  if (!session) setShowAuthModal(true);
                  else setShowMemoriesModal(true);
                }}
                title="View and edit permanent memories"
              >
                🧠 Memories & Notes
              </button>
            )}
            {showLogout && session && (
              <button className="rose-logout-btn" onClick={handleLogout}>
                Log out
              </button>
            )}
            {showLogout && !session && (
              <button className="rose-new-chat-btn" onClick={() => setShowAuthModal(true)}>
                Sign in
              </button>
            )}
          </div>
        </aside>
      )}

      <main className="rose-main">
        <div className="chat-container">
          {showHeader && (
            <header className="chat-header">
              {/* eslint-disable-next-line @next/next/no-img-element -- static avatar asset */}
              <img
                src={headerAvatarUrl}
                alt="Rose"
                className="chat-header-avatar"
              />
              <div className="chat-header-info">
                <h1>{title}</h1>
                <p>{isLoading ? "thinking..." : session ? "online" : "auth required"}</p>
              </div>
              {showMemories && session && (
                <div className="chat-header-actions">
                  <button
                    className="chat-header-memory-btn"
                    onClick={() => setShowMemoriesModal(true)}
                    title="Memory Settings"
                  >
                    🧠 Memories
                  </button>
                </div>
              )}
            </header>
          )}

          {showUsage && session && <UsageBar onRefreshRef={refreshUsageRef} apiBasePath={cleanBase} />}
          
          {isLocked ? (
            <div className="rose-auth-locked-banner">
              <div className="rose-auth-locked-icon">🔒</div>
              <h3>Authentication Required</h3>
              <p>
                Rose AI enforces tiered usage quotas, persistent memory records, and dedicated agent tools. Please sign in or continue as a guest to unlock the chat.
              </p>
              <div className="rose-auth-locked-actions">
                <button
                  type="button"
                  className="rose-auth-signin-btn"
                  onClick={() => setShowAuthModal(true)}
                >
                  Sign In / Register
                </button>
                <button
                  type="button"
                  className="rose-auth-guest-btn"
                  onClick={async () => {
                    try {
                      await guestLogin();
                    } catch (err) {
                      setAuthError(err instanceof Error ? err.message : "Guest login failed");
                      setShowAuthModal(true);
                    }
                  }}
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          ) : (
            <>
              <Chat
                messages={messages}
                isLoading={isLoading}
                currentEmotion={currentEmotion}
                traces={traces}
                avatarUrl={headerAvatarUrl}
                userAvatarUrl={(session?.user as Record<string, any> | undefined)?.avatarUrl}
                userName={session?.user?.email ? session.user.email.split("@")[0] : "User"}
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
            </>
          )}
        </div>
      </main>

      {showMemories && session && (
        <MemoriesSettingsModal
          isOpen={showMemoriesModal}
          onClose={() => setShowMemoriesModal(false)}
          token={session.accessToken}
          apiBasePath={cleanBase}
        />
      )}

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        authError={authError}
        onLogin={async (creds: LoginCredentials) => {
          setAuthError(null);
          try {
            await login(creds.email, creds.password);
            setShowAuthModal(false);
          } catch (err) {
            setAuthError(err instanceof Error ? err.message : "Login failed");
            throw err;
          }
        }}
        onRegister={async (details: RegisterDetails) => {
          setAuthError(null);
          try {
            await register(details.email, details.password);
            setShowAuthModal(false);
          } catch (err) {
            setAuthError(err instanceof Error ? err.message : "Registration failed");
            throw err;
          }
        }}
        onGuest={async () => {
          setAuthError(null);
          try {
            await guestLogin();
            setShowAuthModal(false);
          } catch (err) {
            setAuthError(err instanceof Error ? err.message : "Guest login failed");
            throw err;
          }
        }}
      />
    </div>
  );
}

export default RoseChat;
