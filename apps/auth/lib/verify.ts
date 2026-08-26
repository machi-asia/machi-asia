import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "./env";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks(): ReturnType<typeof createRemoteJWKSet> {
  jwks ??= createRemoteJWKSet(new URL(`${env.supabaseUrl}/auth/v1/.well-known/jwks.json`));
  return jwks;
}

export interface VerifiedIdentity {
  sub: string;
  email?: string;
  phone?: string;
  roles: string[];
  sessionId?: string;
  aal?: string;
  payload: Record<string, unknown>;
}

/**
 * Verifies a Supabase access token against the project's JWKS endpoint
 * (asymmetric signing keys). Throws when the token is invalid or expired.
 */
export async function verifyAccessToken(token: string): Promise<VerifiedIdentity> {
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: `${env.supabaseUrl}/auth/v1`,
    audience: "authenticated",
    algorithms: ["ES256", "RS256"],
  });

  const rawRoles = payload.roles;
  const roles = Array.isArray(rawRoles)
    ? rawRoles.filter((role): role is string => typeof role === "string")
    : [];

  return {
    sub: String(payload.sub),
    email: typeof payload.email === "string" ? payload.email : undefined,
    phone: typeof payload.phone === "string" ? payload.phone : undefined,
    roles,
    sessionId: typeof payload.session_id === "string" ? payload.session_id : undefined,
    aal: typeof payload.aal === "string" ? payload.aal : undefined,
    payload: payload as Record<string, unknown>,
  };
}
