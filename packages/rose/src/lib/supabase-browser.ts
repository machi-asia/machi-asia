import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function getBrowserSupabase(accessToken?: string) {
  const options = accessToken
    ? {
        global: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      }
    : undefined;
  return createClient(supabaseUrl, supabaseAnonKey, options);
}
