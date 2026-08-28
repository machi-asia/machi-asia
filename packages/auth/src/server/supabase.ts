import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
} as const;

export function createPublicClient(): SupabaseClient {
  return createClient(env.supabaseUrl, env.supabasePublishableKey, clientOptions);
}

export function createAdminClient(): SupabaseClient {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleSecret, clientOptions);
}
