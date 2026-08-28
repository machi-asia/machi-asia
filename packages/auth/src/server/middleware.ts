import { NextRequest, NextResponse } from "next/server";

export function getAllowedOrigin(req: NextRequest): string | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;

  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0) {
    // Dev fallback: allow any localhost origin
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return origin;
    return null;
  }

  if (allowedOrigins.includes(origin)) return origin;
  return null;
}

export function setCorsHeaders(res: NextResponse, origin: string | null): NextResponse {
  if (origin) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Max-Age", "86400");
  }
  return res;
}

export function authMiddleware(req: NextRequest): NextResponse {
  const origin = getAllowedOrigin(req);

  // Handle preflight
  if (req.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    return setCorsHeaders(res, origin);
  }

  const res = NextResponse.next();
  return setCorsHeaders(res, origin);
}

export default authMiddleware;