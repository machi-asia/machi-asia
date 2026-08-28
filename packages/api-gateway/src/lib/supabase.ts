import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  client ??= createClient(env.supabaseUrl, env.supabaseServiceRoleSecret, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  return client;
}
