import { NextRequest, NextResponse } from "next/server";

/**
 * Reads the gateway-injected user id from a request. Host apps run the
 * gateway middleware (or an equivalent verifier) so upstream route handlers
 * can trust this header instead of verifying the JWT themselves.
 */
export function requireUserId(req: NextRequest): string | null {
  return req.headers.get("x-gateway-sub");
}

/** Parses the gateway-injected roles JSON header into a string array. */
export function parseRoles(req: NextRequest): string[] {
  const raw = req.headers.get("x-gateway-roles");
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((role): role is string => typeof role === "string")
      : [];
  } catch {
    return [];
  }
}

export function gatewayUnauthorized(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "unauthorized",
        message: "Requests must go through the API gateway.",
      },
    },
    { status: 401 }
  );
}