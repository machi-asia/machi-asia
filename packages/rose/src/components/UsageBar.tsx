"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@machi-asia/auth";
import { getBrowserSupabase } from "../lib/supabase-browser";
import { roseApiUrl } from "../lib/roseEnv";

interface UsageData {
  week: string;
  day?: string;
  count: number;
  limit: number | null;
  dailyCount?: number;
  dailyLimit?: number | null;
  allowed: boolean;
  exceededType?: "daily" | "weekly";
  remaining: number | null;
  role?: "admin" | "guest" | "authenticated";
}

const DEFAULT_USAGE: UsageData = {
  week: "",
  count: 0,
  limit: 200,
  dailyCount: 0,
  dailyLimit: 20,
  allowed: true,
  remaining: 20,
  role: "authenticated",
};

export interface UsageBarProps {
  usage?: UsageData;
  /**
   * Base URL (origin + prefix) of the Rose API. Defaults to the shared
   * resolution in roseApiBase() — NEXT_PUBLIC_GATEWAY_URL + "/api/rose" when
   * set, else same-origin "/api/rose". Pass an explicit value only when the
   * host app mounts the rose routes elsewhere.
   */
  apiBasePath?: string;
  onRefreshRef?: React.MutableRefObject<(() => void) | null>;
}

export function UsageBar({ usage: initialUsage, apiBasePath, onRefreshRef }: UsageBarProps = {}) {
  const { session } = useAuth();
  const [usage, setUsage] = useState<UsageData>(initialUsage ?? DEFAULT_USAGE);
  const [loaded, setLoaded] = useState(Boolean(initialUsage));
  const channelRef = useRef<{ unsubscribe: () => void } | null>(null);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (initialUsage) {
      setUsage(initialUsage);
      setLoaded(true);
    }
  }, [initialUsage]);

  const fetchUsage = useCallback(async () => {
    if (!userId || !session?.accessToken) return;
    try {
      const res = await fetch(roseApiUrl("usage", apiBasePath), {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!res.ok) return;
      const data: UsageData = await res.json();
      setUsage(data);
      setLoaded(true);
    } catch {
      // usage bar is non-critical; show default state
      setLoaded(true);
    }
  }, [userId, session?.accessToken, apiBasePath]);

  useEffect(() => {
    if (onRefreshRef) {
      onRefreshRef.current = fetchUsage;
    }
  }, [onRefreshRef, fetchUsage]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  useEffect(() => {
    if (!userId || !session?.accessToken) return;

    const supabase = getBrowserSupabase(session.accessToken);
    if (!supabase) return;
    const channel = supabase
      .channel(`rose-usage-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "usage_limits",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchUsage();
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [userId, session?.accessToken, fetchUsage]);

  const isAdmin = usage.role === "admin" || usage.limit === null || usage.limit === Infinity;

  const dailyPct =
    usage.dailyLimit && usage.dailyLimit > 0
      ? Math.min(((usage.dailyCount ?? 0) / usage.dailyLimit) * 100, 100)
      : 0;

  const weeklyPct =
    usage.limit && usage.limit > 0
      ? Math.min((usage.count / usage.limit) * 100, 100)
      : 0;

  const activePct = Math.max(dailyPct, weeklyPct);

  const barColor =
    activePct >= 90 ? "#ef4444" : activePct >= 70 ? "#f59e0b" : "var(--rose-accent)";

  const roleLabel =
    usage.role === "admin"
      ? "Admin"
      : usage.role === "guest"
      ? "Guest"
      : "User";

  return (
    <div className="usage-bar">
      <div className="usage-bar-label">
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {isAdmin ? (
            <>
              <span className="usage-bar-badge admin">Unlimited</span>
              <span>(Admin tier)</span>
            </>
          ) : loaded ? (
            <>
              <span className={`usage-bar-badge ${usage.role || "user"}`}>{roleLabel}</span>
              <span>
                Today: {usage.dailyCount ?? 0}/{usage.dailyLimit ?? 20} &bull; Week: {usage.count}/{usage.limit ?? 200}
              </span>
            </>
          ) : (
            "Loading usage..."
          )}
        </span>
        <span className="usage-bar-remaining">
          {isAdmin
            ? "No restrictions"
            : !loaded
            ? ""
            : usage.allowed
            ? `${usage.remaining ?? 0} remaining today`
            : usage.exceededType === "daily"
            ? "Daily limit reached"
            : "Weekly limit reached"}
        </span>
      </div>
      {!isAdmin && (
        <div className="usage-bar-track">
          <div
            className="usage-bar-fill"
            style={{
              width: `${activePct}%`,
              background: barColor,
            }}
          />
        </div>
      )}
    </div>
  );
}

export default UsageBar;
