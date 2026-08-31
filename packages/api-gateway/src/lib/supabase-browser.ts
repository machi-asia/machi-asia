import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns a Supabase browser client, or `null` when the host app has not
 * configured NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Components that use Realtime treat `null` as "Realtime unavailable".
 */
export function getBrowserSupabase(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.trim() || !supabaseAnonKey.trim()) {
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}