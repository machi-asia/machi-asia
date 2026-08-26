import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "./env";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks(): ReturnType<typeof createRemoteJWKSet> {
  jwks ??= createRemoteJWKSet(
    new URL(`${env.supabaseUrl}/auth/v1/.well-known/jwks.json`),
  );
  return jwks;
}

export interface VerifiedIdentity {
  sub: string;
  email?: string;
}

export async function verifyAccessToken(
  token: string,
): Promise<VerifiedIdentity> {
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: `${env.supabaseUrl}/auth/v1`,
    audience: "authenticated",
    algorithms: ["ES256", "RS256"],
  });

  return {
    sub: String(payload.sub),
    email:
      typeof payload.email === "string" ? payload.email : undefined,
  };
}
