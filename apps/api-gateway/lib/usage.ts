import { env } from "./env";
import { getSupabase } from "./supabase";

export function currentWeek(): string {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - jan1.getTime()) / 86_400_000) + 1;
  const weekNum = Math.ceil(dayOfYear / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export interface UsageCheck {
  allowed: boolean;
  count: number;
  limit: number;
  week: string;
}

/**
 * Atomically increments the request count for a user in the current week.
 * If no row exists yet, inserts one with count=1.
 * If the user already exceeded their limit, returns allowed=false without incrementing.
 */
export async function checkAndIncrementUsage(userId: string): Promise<UsageCheck> {
  const week = currentWeek();
  const limit = env.weeklyUsageLimit;
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("usage_limits")
    .select("count, limit")
    .eq("user_id", userId)
    .eq("week", week)
    .single();

  if (existing) {
    if (existing.count >= (existing.limit ?? limit)) {
      return { allowed: false, count: existing.count, limit: existing.limit ?? limit, week };
    }

    const { data: updated } = await supabase
      .from("usage_limits")
      .update({ count: existing.count + 1 })
      .eq("user_id", userId)
      .eq("week", week)
      .select("count")
      .single();

    return {
      allowed: true,
      count: updated?.count ?? existing.count + 1,
      limit: existing.limit ?? limit,
      week,
    };
  }

  const { error } = await supabase.from("usage_limits").insert({
    user_id: userId,
    week,
    count: 1,
    limit,
  });

  if (error && error.code === "23505") {
    return checkAndIncrementUsage(userId);
  }

  return { allowed: true, count: 1, limit, week };
}

/**
 * Read-only usage check — returns the current count and limit without incrementing.
 */
export async function getUsage(userId: string): Promise<UsageCheck> {
  const week = currentWeek();
  const limit = env.weeklyUsageLimit;
  const supabase = getSupabase();

  const { data } = await supabase
    .from("usage_limits")
    .select("count, limit")
    .eq("user_id", userId)
    .eq("week", week)
    .single();

  if (!data) {
    return { allowed: true, count: 0, limit, week };
  }

  return {
    allowed: data.count < (data.limit ?? limit),
    count: data.count,
    limit: data.limit ?? limit,
    week,
  };
}
