import { env } from "./env";
import type { GatewayRoute } from "./routes";
import { verifyAccessToken, VerifiedIdentity } from "./verify";

export const GATEWAY_HEADER_PREFIX = "x-gateway-";

export interface GateIdentityHeaders {
  "x-gateway-sub": string;
  "x-gateway-email"?: string;
  "x-gateway-roles"?: string;
  "x-gateway-session-id"?: string;
}

export type GateResult =
  | { ok: true; identity: VerifiedIdentity | null }
  | { ok: false; status: number; code: string; message: string };

export function extractBearerToken(authorizationHeader: string | null): string | null {
  return authorizationHeader?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
}

/**
 * Pure authentication/authorization gate for a matched route. Strips any
 * spoofed x-gateway-* headers from the caller and returns the verified
 * identity headers to inject upstream.
 */
export async function gate(
  headers: Headers,
  route: GatewayRoute,
): Promise<GateResult & { cleanHeaders?: Headers }> {
  for (const key of [...headers.keys()]) {
    if (key.toLowerCase().startsWith(GATEWAY_HEADER_PREFIX)) {
      headers.delete(key);
    }
  }

  if (route.isPublic) {
    return { ok: true, identity: null };
  }

  const token = extractBearerToken(headers.get("authorization"));
  if (!token) {
    return { ok: false, status: 401, code: "unauthorized", message: "Missing bearer token." };
  }

  let identity: VerifiedIdentity;
  try {
    identity = await verifyAccessToken(token);
  } catch {
    return { ok: false, status: 401, code: "unauthorized", message: "Invalid or expired token." };
  }

  const missingRoles = route.requiredRoles.filter((role) => !identity.roles.includes(role));
  if (missingRoles.length > 0) {
    return {
      ok: false,
      status: 403,
      code: "forbidden",
      message: `Missing required role(s): ${missingRoles.join(", ")}`,
    };
  }

  return { ok: true, identity };
}

export function identityHeaders(identity: VerifiedIdentity): GateIdentityHeaders {
  const out: GateIdentityHeaders = { "x-gateway-sub": identity.sub };
  if (identity.email) out["x-gateway-email"] = identity.email;
  if (identity.roles.length > 0) out["x-gateway-roles"] = identity.roles.join(",");
  if (identity.sessionId) out["x-gateway-session-id"] = identity.sessionId;
  return out;
}

export function gatewaySecret(): string {
  return env.internalGatewaySecret;
}
