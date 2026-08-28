import { env } from "./env";
import { getSupabase } from "./supabase";

export function currentWeek(): string {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - jan1.getTime()) / 86_400_000) + 1;
  const weekNum = Math.ceil(dayOfYear / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export function currentDay(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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
    .select("count, usage_limit")
    .eq("user_id", userId)
    .eq("week", week)
    .is("service_key", null)
    .single();

  if (existing) {
    if (existing.count >= (existing.usage_limit ?? limit)) {
      return { allowed: false, count: existing.count, limit: existing.usage_limit ?? limit, week };
    }

    const { data: updated } = await supabase
      .from("usage_limits")
      .update({ count: existing.count + 1, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("week", week)
      .is("service_key", null)
      .select("count")
      .single();

    return {
      allowed: true,
      count: updated?.count ?? existing.count + 1,
      limit: existing.usage_limit ?? limit,
      week,
    };
  }

  const { error } = await supabase.from("usage_limits").insert({
    user_id: userId,
    week,
    count: 1,
    usage_limit: limit,
    service_key: null,
  });

  if (error && error.code === "23505") {
    return checkAndIncrementUsage(userId);
  }

  return { allowed: true, count: 1, limit, week };
}

/**
 * Role-based usage check for the Rose AI service.
 * Admins: unlimited (returns allowed=true always).
 * Guests: 10/day, 50/week.
 * Authenticated Users: 20/day, 200/week.
 */
export async function checkAndIncrementRoseUsage(
  userId: string,
  roles: string[] = []
): Promise<UsageCheck> {
  const week = currentWeek();
  const day = currentDay();

  if (roles.includes("admin")) {
    return { allowed: true, count: 0, limit: Infinity, week };
  }

  const isGuest = roles.includes("guest") || roles.includes("anon");
  const weeklyLimit = isGuest ? env.roseWeeklyLimitGuest : env.roseWeeklyLimitUser;
  const dailyLimit = isGuest ? env.roseDailyLimitGuest : env.roseDailyLimitUser;

  const supabase = getSupabase();

  const [weeklyRes, dailyRes] = await Promise.all([
    supabase
      .from("usage_limits")
      .select("count, usage_limit")
      .eq("user_id", userId)
      .eq("week", week)
      .eq("service_key", "ROSE")
      .single(),
    supabase
      .from("usage_limits")
      .select("count, usage_limit")
      .eq("user_id", userId)
      .eq("week", day)
      .eq("service_key", "ROSE_DAILY")
      .single(),
  ]);

  const currentWeeklyCount = weeklyRes.data?.count ?? 0;
  const effectiveWeeklyLimit = weeklyRes.data?.usage_limit ?? weeklyLimit;

  const currentDailyCount = dailyRes.data?.count ?? 0;
  const effectiveDailyLimit = dailyRes.data?.usage_limit ?? dailyLimit;

  if (currentDailyCount >= effectiveDailyLimit || currentWeeklyCount >= effectiveWeeklyLimit) {
    return {
      allowed: false,
      count: currentWeeklyCount,
      limit: effectiveWeeklyLimit,
      week,
    };
  }

  // Increment daily
  if (dailyRes.data) {
    await supabase
      .from("usage_limits")
      .update({ count: currentDailyCount + 1, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("week", day)
      .eq("service_key", "ROSE_DAILY");
  } else {
    await supabase.from("usage_limits").insert({
      user_id: userId,
      week: day,
      count: 1,
      usage_limit: effectiveDailyLimit,
      service_key: "ROSE_DAILY",
    });
  }

  // Increment weekly
  if (weeklyRes.data) {
    await supabase
      .from("usage_limits")
      .update({ count: currentWeeklyCount + 1, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("week", week)
      .eq("service_key", "ROSE");
  } else {
    await supabase.from("usage_limits").insert({
      user_id: userId,
      week: week,
      count: 1,
      usage_limit: effectiveWeeklyLimit,
      service_key: "ROSE",
    });
  }

  return {
    allowed: true,
    count: currentWeeklyCount + 1,
    limit: effectiveWeeklyLimit,
    week,
  };
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
    .select("count, usage_limit")
    .eq("user_id", userId)
    .eq("week", week)
    .is("service_key", null)
    .single();

  if (!data) {
    return { allowed: true, count: 0, limit, week };
  }

  return {
    allowed: data.count < (data.usage_limit ?? limit),
    count: data.count,
    limit: data.usage_limit ?? limit,
    week,
  };
}
