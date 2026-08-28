"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AuthSession, PublicUser, TokenEnvelope } from "./types";
import { saveTokens, loadTokens, clearTokens } from "./token-store";

export interface AuthContextType {
  session: AuthSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function toSession(env: TokenEnvelope): AuthSession {
  return {
    user: env.user,
    accessToken: env.access_token,
    refreshToken: env.refresh_token,
    expiresAt: env.expires_at,
  };
}

export interface AuthProviderProps {
  authApiUrl: string;
  children: ReactNode;
}

export function AuthProvider({ authApiUrl, children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseUrl = authApiUrl.replace(/\/+$/, "");

  const scheduleRefresh = useCallback(
    (expiresAt: number) => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      const msUntilRefresh = Math.max((expiresAt - 60) * 1000 - Date.now(), 5000);
      refreshTimer.current = setTimeout(async () => {
        const tokens = loadTokens();
        if (!tokens) return;
        try {
          const res = await fetch(`${baseUrl}/api/auth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: tokens.refreshToken }),
          });
          if (!res.ok) throw new Error("Refresh failed");
          const env: TokenEnvelope = await res.json();
          saveTokens(env.access_token, env.refresh_token);
          setSession(toSession(env));
          scheduleRefresh(env.expires_at);
        } catch {
          clearTokens();
          setSession(null);
        }
      }, msUntilRefresh);
    },
    [baseUrl]
  );

  const validateToken = useCallback(
    async (accessToken: string): Promise<PublicUser | null> => {
      try {
        const res = await fetch(`${baseUrl}/api/auth/user`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    },
    [baseUrl]
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const tokens = loadTokens();
      if (!tokens) {
        setLoading(false);
        return;
      }

      const user = await validateToken(tokens.accessToken);
      if (cancelled) return;

      if (!user) {
        clearTokens();
        setLoading(false);
        return;
      }

      const storedExpiry = loadExpiry();
      const sess: AuthSession = {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: storedExpiry ?? Date.now() / 1000 + 3600,
      };
      setSession(sess);
      scheduleRefresh(sess.expiresAt);
      setLoading(false);
    }

    init();
    return () => {
      cancelled = true;
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [validateToken, scheduleRefresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message || `Login failed (${res.status})`);
      }
      const env: TokenEnvelope = await res.json();
      saveTokens(env.access_token, env.refresh_token);
      saveExpiry(env.expires_at);
      setSession(toSession(env));
      scheduleRefresh(env.expires_at);
    },
    [baseUrl, scheduleRefresh]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${baseUrl}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message || `Signup failed (${res.status})`);
      }
      const data = await res.json();
      if (data.requires_email_confirmation) {
        throw new Error("Check your email to confirm your account.");
      }
      const env: TokenEnvelope = data.session;
      saveTokens(env.access_token, env.refresh_token);
      saveExpiry(env.expires_at);
      setSession(toSession(env));
      scheduleRefresh(env.expires_at);
    },
    [baseUrl, scheduleRefresh]
  );

  const guestLogin = useCallback(async () => {
    const res = await fetch(`${baseUrl}/api/auth/guest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error?.message || `Guest login failed (${res.status})`);
    }
    const env: TokenEnvelope = await res.json();
    saveTokens(env.access_token, env.refresh_token);
    saveExpiry(env.expires_at);
    setSession(toSession(env));
    scheduleRefresh(env.expires_at);
  }, [baseUrl, scheduleRefresh]);

  const logout = useCallback(async () => {
    const tokens = loadTokens();
    if (tokens) {
      try {
        await fetch(`${baseUrl}/api/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: tokens.refreshToken }),
        });
      } catch {
        // best-effort
      }
    }
    clearTokens();
    clearExpiry();
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    setSession(null);
  }, [baseUrl]);

  return (
    <AuthContext.Provider value={{ session, loading, login, register, guestLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

const EXPIRY_KEY = "machi_token_expiry";

function saveExpiry(expiresAt: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EXPIRY_KEY, String(expiresAt));
}

function loadExpiry(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(EXPIRY_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function clearExpiry(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(EXPIRY_KEY);
}
