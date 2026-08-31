import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@machi-asia/auth/server";

/**
 * Same gateway-style authorization contract as apps/rose: verifies the bearer
 * JWT on every /api/* request (except the public endpoints below) and injects
 * the verified identity as x-gateway-* headers so the shared route handlers in
 * packages/* (which require those headers) can resolve the caller.
 */
const PUBLIC_PATHS = [
  // Explorer scan endpoints (no auth, server-internal)
  "/api/components",
  "/api/component",
  "/api/health",
  // Public auth endpoints
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/guest",
  "/api/auth/logout",
  "/api/auth/token",
];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (req.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    return res;
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isPublic) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Missing bearer token." } },
      { status: 401 }
    );
  }

  try {
    const identity = await verifyAccessToken(authHeader.slice("Bearer ".length));

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-gateway-sub", identity.sub);
    requestHeaders.set("x-gateway-email", identity.email ?? "");
    requestHeaders.set("x-gateway-roles", JSON.stringify(identity.roles));
    if (identity.sessionId) {
      requestHeaders.set("x-gateway-session-id", identity.sessionId);
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Invalid or expired token." } },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ["/api/:path*"],
  runtime: "nodejs",
};