/**
 * Shared environment / API base resolution for @machi-asia/rose client code.
 *
 * Components in this package are design to "just work" when mounted into any
 * host app. All HTTP helpers and API-backed components (RoseChat, UsageBar,
 * MemoriesSettingsModal...) resolve their base URL through these functions so
 * they stay consistent with each other and with the host app's routing.
 */

/**
 * Returns the base URL of the API gateway if configured (NEXT_PUBLIC_GATEWAY_URL),
 * otherwise an empty string (same-origin).
 */
export function roseGatewayUrl(): string {
  const raw = process.env.NEXT_PUBLIC_GATEWAY_URL;
  if (typeof raw === "string" && raw.trim()) {
    return raw.trim().replace(/\/+$/, "");
  }
  return "";
}

/**
 * Resolves the base path used for all Rose HTTP endpoints.
 *
 * - If `explicit` is provided it always wins (component prop / caller override).
 * - Otherwise the gateway URL (NEXT_PUBLIC_GATEWAY_URL) is used when set, because
 *   that is how deployed apps route /api/rose/* traffic through the API gateway.
 * - Final fallback is the same-origin "/api/rose" used by self-hosting apps such
 *   as apps/rose.
 */
export function roseApiBase(explicit?: string): string {
  if (typeof explicit === "string" && explicit.trim()) {
    return explicit.trim().replace(/\/+$/, "");
  }
  const gateway = roseGatewayUrl();
  return gateway ? `${gateway}/api/rose` : "/api/rose";
}

/**
 * Relative path (host app widths) can differ — this resolves a path against the
 * rose API base, e.g. roseApiUrl("/sessions") => "/api/rose/sessions" (or
 * "<gateway>/api/rose/sessions").
 */
export function roseApiUrl(basePath: string, explicitBase?: string): string {
  return `${roseApiBase(explicitBase)}/${basePath.replace(/^\/+/, "")}`;
}

/**
 * True when the browser-side Supabase configuration (NEXT_PUBLIC_SUPABASE_URL +
 * NEXT_PUBLIC_SUPABASE_ANON_KEY) is present, so client code can safely create
 * Supabase clients and Realtime subscriptions.
 */
export function isBrowserSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    typeof url === "string" && url.trim() &&
    typeof anonKey === "string" && anonKey.trim()
  );
}