/**
 * Shared environment + API base resolution for @machi-asia/media-library.
 *
 * `env` is the server-side configuration consumed by the route handlers
 * (require the env vars to be set or throw). The `media*` helpers are used by
 * client components and default to the same-origin "/api/media-library"
 * prefix used by self-hosting host apps, or the configured API gateway
 * (NEXT_PUBLIC_GATEWAY_URL) when the host routes media traffic through it.
 */

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
  get supabaseServiceRoleSecret() {
    return required("SUPABASE_SERVICE_ROLE_SECRET");
  },
  get supabaseAnonKey() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get mediaStorageBucket() {
    return process.env["MEDIA_STORAGE_BUCKET"] ?? "media";
  },
};

export function mediaGatewayUrl(): string {
  const raw = process.env.NEXT_PUBLIC_GATEWAY_URL;
  if (typeof raw === "string" && raw.trim()) {
    return raw.trim().replace(/\/+$/, "");
  }
  return "";
}

/**
 * Resolves the base URL (origin + "/api/media-library") used by MediaLibrary
 * components. An explicit `basePath` always wins; otherwise the gateway URL is
 * used when set, falling back to same-origin "/api/media-library".
 */
export function mediaApiBase(explicit?: string): string {
  if (typeof explicit === "string" && explicit.trim()) {
    return explicit.trim().replace(/\/+$/, "");
  }
  const gateway = mediaGatewayUrl();
  return gateway ? `${gateway}/api/media-library` : "/api/media-library";
}

export function mediaApiSubpath(path: string, explicit?: string): string {
  return `${mediaApiBase(explicit)}/${path.replace(/^\/+/, "")}`;
}

/**
 * True when the browser-side Supabase configuration is present, so client code
 * can safely create Realtime subscriptions.
 */
export function isMediaSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    typeof url === "string" && url.trim() &&
    typeof anonKey === "string" && anonKey.trim()
  );
}