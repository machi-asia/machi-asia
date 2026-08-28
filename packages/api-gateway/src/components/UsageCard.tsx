"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardBody } from "@machi-asia/ui";
import { getBrowserSupabase } from "../lib/supabase-browser";

interface UsageData {
  week: string;
  count: number;
  limit: number;
  allowed: boolean;
  remaining: number;
}

export function UsageCard() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof getBrowserSupabase>["channel"]> | null>(null);
  const week = usage?.week;

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/usage", {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token") ?? ""}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setUsage(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load usage");
      }
    }
    fetchUsage();
  }, []);

  useEffect(() => {
    if (!week) return;

    const supabase = getBrowserSupabase();
    const channel = supabase
      .channel("usage-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "usage_limits" },
        () => {
          fetch("/api/usage", {
            headers: { Authorization: `Bearer ${localStorage.getItem("access_token") ?? ""}` },
          })
            .then((r) => r.json())
            .then(setUsage)
            .catch(() => {});
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [week]);

  if (error) {
    return (
      <Card variant="outline">
        <CardBody>Error loading usage: {error}</CardBody>
      </Card>
    );
  }

  if (!usage) {
    return (
      <Card variant="elevated">
        <CardBody>Loading usage...</CardBody>
      </Card>
    );
  }

  const pct = usage.limit > 0 ? Math.min((usage.count / usage.limit) * 100, 100) : 0;
  const barColor = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#22c55e";

  return (
    <Card variant="elevated">
      <CardHeader title="API Usage" subtitle={`Week: ${usage.week}`} />
      <CardBody>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 24, fontWeight: 600 }}>
            {usage.count} / {usage.limit} calls
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 4,
              background: "#e5e7eb",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                background: barColor,
                borderRadius: 4,
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <div style={{ fontSize: 14, color: usage.allowed ? "#6b7280" : "#ef4444" }}>
            {usage.allowed
              ? `${usage.remaining} calls remaining this week`
              : "Weekly limit reached"}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
