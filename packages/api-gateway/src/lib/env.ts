const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const env = {
  get supabaseUrl() {
    return required("SUPABASE_URL").replace(/\/+$/, "");
  },
  get supabaseAnonKey() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get supabaseServiceRoleSecret() {
    return required("SUPABASE_SERVICE_ROLE_SECRET");
  },
  get internalGatewaySecret() {
    return required("INTERNAL_GATEWAY_SECRET");
  },
  get weeklyUsageLimit() {
    const raw = process.env["WEEKLY_USAGE_LIMIT"];
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1000;
  },
  get roseWeeklyLimitAdmin() {
    const raw = process.env["ROSE_WEEKLY_LIMIT_ADMIN"];
    if (raw === "unlimited" || raw === "0") return Infinity;
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : Infinity;
  },
  get roseWeeklyLimitUser() {
    const raw = process.env["ROSE_WEEKLY_LIMIT_USER"];
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 200;
  },
  get roseDailyLimitUser() {
    const raw = process.env["ROSE_DAILY_LIMIT_USER"];
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
  },
  get roseWeeklyLimitGuest() {
    const raw = process.env["ROSE_WEEKLY_LIMIT_GUEST"];
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 50;
  },
  get roseDailyLimitGuest() {
    const raw = process.env["ROSE_DAILY_LIMIT_GUEST"];
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
  },
};
