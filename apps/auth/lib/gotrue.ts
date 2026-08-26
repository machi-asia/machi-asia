import { env } from "@/lib/env";
import type { User } from "@supabase/supabase-js";

interface GoTrueSessionResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: number;
  user?: User;
}

/**
 * Exchanges a refresh token for a new session by calling the Supabase Auth
 * (GoTrue) token endpoint directly. Using raw HTTP here avoids supabase-js
 * session-state requirements, which are browser-oriented.
 */
export async function refreshTokens(refreshToken: string): Promise<GoTrueSessionResponse> {
  const response = await fetch(`${env.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: env.supabasePublishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | (GoTrueSessionResponse & { error_description?: string; error_code?: string; msg?: string })
    | null;

  if (!response.ok || !payload) {
    const description = payload?.error_description ?? payload?.msg ?? "Refresh failed";
    throw Object.assign(new Error(description), {
      status: response.status === 400 || response.status === 401 ? 401 : response.status,
      code: payload?.error_code,
    });
  }

  return payload;
}
