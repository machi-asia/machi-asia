import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@machi-asia/auth/server";

const PUBLIC_PATHS = [
  "/api/health",
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