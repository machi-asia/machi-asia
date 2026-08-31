import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isBrowserSupabaseConfigured } from "./roseEnv";

/**
 * Returns a Supabase browser client configured with the host app's
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY, or `null` when those
 * env vars are missing. Components that use Realtime must treat `null` as
 * "Realtime unavailable" and fall back to polling / static rendering instead of
 * crashing the host app during SSR.
 */
export function getBrowserSupabase(accessToken?: string): SupabaseClient | null {
  if (!isBrowserSupabaseConfigured()) return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const options = accessToken
    ? {
        global: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      }
    : undefined;
  return createClient(supabaseUrl, supabaseAnonKey, options);
}