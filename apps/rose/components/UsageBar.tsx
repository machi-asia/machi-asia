"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@machi-asia/auth";
import { getBrowserSupabase } from "@/lib/supabase-browser";

interface UsageData {
  week: string;
  count: number;
  limit: number;
  allowed: boolean;
  remaining: number;
}

export function UsageBar() {
  const { session } = useAuth();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof getBrowserSupabase>["channel"]> | null>(null);

  const userId = session?.user.id ?? null;

  const fetchUsage = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/usage?user_id=${encodeURIComponent(userId)}`);
      if (!res.ok) return;
      const data: UsageData = await res.json();
      setUsage(data);
    } catch {
      // silent — usage bar is non-critical
    }
  }, [userId]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  useEffect(() => {
    if (!usage?.week) return;

    const supabase = getBrowserSupabase();
    const channel = supabase
      .channel("rose-usage-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "usage_limits" },
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
  }, [usage?.week, fetchUsage]);

  if (!usage) return null;

  const pct = usage.limit > 0 ? Math.min((usage.count / usage.limit) * 100, 100) : 0;
  const barColor =
    pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "var(--rose-accent)";

  return (
    <div className="usage-bar">
      <div className="usage-bar-label">
        <span>
          {usage.count}/{usage.limit} calls
        </span>
        <span className="usage-bar-remaining">
          {usage.allowed
            ? `${usage.remaining} remaining`
            : "Limit reached"}
        </span>
      </div>
      <div className="usage-bar-track">
        <div
          className="usage-bar-fill"
          style={{
            width: `${pct}%`,
            background: barColor,
          }}
        />
      </div>
    </div>
  );
}
