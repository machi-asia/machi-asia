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

export interface RoseUsage {
  allowed: boolean;
  count: number;
  limit: number;
  week: string;
  dailyCount: number;
  dailyLimit: number;
  day: string;
  exceededType?: "daily" | "weekly";
  remaining: number;
  role?: "admin" | "guest" | "authenticated";
}

export function roseDailyLimitGuest(): number {
  const raw = process.env["ROSE_DAILY_LIMIT_GUEST"];
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
}

export function roseWeeklyLimitGuest(): number {
  const raw = process.env["ROSE_WEEKLY_LIMIT_GUEST"];
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 50;
}

export function roseDailyLimitUser(): number {
  const raw = process.env["ROSE_DAILY_LIMIT_USER"];
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
}

export function roseWeeklyLimitUser(): number {
  const raw = process.env["ROSE_WEEKLY_LIMIT_USER"];
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 200;
}

export function getRoleLimits(roles: string[] = []): {
  role: "admin" | "guest" | "authenticated";
  weeklyLimit: number;
  dailyLimit: number;
} {
  if (roles.includes("admin")) {
    return { role: "admin", weeklyLimit: Infinity, dailyLimit: Infinity };
  }
  if (roles.includes("guest") || roles.includes("anon")) {
    return {
      role: "guest",
      weeklyLimit: roseWeeklyLimitGuest(),
      dailyLimit: roseDailyLimitGuest(),
    };
  }
  return {
    role: "authenticated",
    weeklyLimit: roseWeeklyLimitUser(),
    dailyLimit: roseDailyLimitUser(),
  };
}

/**
 * Read-only Rose usage for a user in the current period (weekly and daily).
 */
export async function getRoseUsage(
  userId: string,
  roles: string[] = []
): Promise<RoseUsage> {
  const week = currentWeek();
  const day = currentDay();
  const { role, weeklyLimit, dailyLimit } = getRoleLimits(roles);

  if (role === "admin") {
    return {
      allowed: true,
      count: 0,
      limit: Infinity,
      week,
      dailyCount: 0,
      dailyLimit: Infinity,
      day,
      remaining: Infinity,
      role: "admin",
    };
  }

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

  const weeklyCount = weeklyRes.data?.count ?? 0;
  const effectiveWeeklyLimit = weeklyRes.data?.usage_limit ?? weeklyLimit;

  const dailyCount = dailyRes.data?.count ?? 0;
  const effectiveDailyLimit = dailyRes.data?.usage_limit ?? dailyLimit;

  const dailyAllowed = dailyCount < effectiveDailyLimit;
  const weeklyAllowed = weeklyCount < effectiveWeeklyLimit;
  const allowed = dailyAllowed && weeklyAllowed;

  const dailyRemaining = Math.max(0, effectiveDailyLimit - dailyCount);
  const weeklyRemaining = Math.max(0, effectiveWeeklyLimit - weeklyCount);

  return {
    allowed,
    count: weeklyCount,
    limit: effectiveWeeklyLimit,
    week,
    dailyCount,
    dailyLimit: effectiveDailyLimit,
    day,
    exceededType: !dailyAllowed ? "daily" : !weeklyAllowed ? "weekly" : undefined,
    remaining: Math.min(dailyRemaining, weeklyRemaining),
    role,
  };
}

/**
 * Atomically checks and increments both daily and weekly request counts for a user.
 * Admins are exempt (unlimited).
 * Returns allowed=false without incrementing if daily or weekly limit is reached.
 */
export async function checkAndIncrementRoseUsage(
  userId: string,
  roles: string[] = []
): Promise<RoseUsage> {
  const week = currentWeek();
  const day = currentDay();
  const { role, weeklyLimit, dailyLimit } = getRoleLimits(roles);

  if (role === "admin") {
    return {
      allowed: true,
      count: 0,
      limit: Infinity,
      week,
      dailyCount: 0,
      dailyLimit: Infinity,
      day,
      remaining: Infinity,
      role: "admin",
    };
  }

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

  if (currentDailyCount >= effectiveDailyLimit) {
    return {
      allowed: false,
      count: currentWeeklyCount,
      limit: effectiveWeeklyLimit,
      week,
      dailyCount: currentDailyCount,
      dailyLimit: effectiveDailyLimit,
      day,
      exceededType: "daily",
      remaining: 0,
      role,
    };
  }

  if (currentWeeklyCount >= effectiveWeeklyLimit) {
    return {
      allowed: false,
      count: currentWeeklyCount,
      limit: effectiveWeeklyLimit,
      week,
      dailyCount: currentDailyCount,
      dailyLimit: effectiveDailyLimit,
      day,
      exceededType: "weekly",
      remaining: 0,
      role,
    };
  }

  // Increment or insert daily usage
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

  // Increment or insert weekly usage
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

  const newDailyCount = currentDailyCount + 1;
  const newWeeklyCount = currentWeeklyCount + 1;
  const dailyRemaining = Math.max(0, effectiveDailyLimit - newDailyCount);
  const weeklyRemaining = Math.max(0, effectiveWeeklyLimit - newWeeklyCount);

  return {
    allowed: true,
    count: newWeeklyCount,
    limit: effectiveWeeklyLimit,
    week,
    dailyCount: newDailyCount,
    dailyLimit: effectiveDailyLimit,
    day,
    remaining: Math.min(dailyRemaining, weeklyRemaining),
    role,
  };
}