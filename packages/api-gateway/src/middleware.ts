import { NextRequest, NextResponse } from "next/server";
import { resolveRoute } from "./lib/routes";
import { GATEWAY_HEADER_PREFIX, gate, gatewaySecret, identityHeaders } from "./lib/auth-gate";
import { checkAndIncrementUsage, checkAndIncrementRoseUsage } from "./lib/usage";

/**
 * Route matcher for a Next.js `middleware.ts`. Hosts wire this into their own
 * middleware file's `config.matcher` (Next requires the value to be static in
 * the host file): `export const config = { matcher: GATEWAY_MATCHER }`.
 */
export const GATEWAY_MATCHER = ["/((?!api/health|api/usage|_next/static|_next/image|favicon.ico).*)"];

const CORS_ALLOW_HEADERS = "Content-Type, Authorization, x-gateway-secret";

export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = process.env.ALLOWED_ORIGINS;
  const isDev = process.env.NODE_ENV !== "production";

  let allowOrigin = "*";
  if (allowed && origin) {
    const origins = allowed.split(",").map((o) => o.trim());
    if (origins.includes(origin)) {
      allowOrigin = origin;
    } else if (isDev && origin.startsWith("http://localhost:")) {
      allowOrigin = origin;
    } else {
      allowOrigin = "";
    }
  } else if (isDev && origin) {
    allowOrigin = origin;
  }

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": CORS_ALLOW_HEADERS,
    "Access-Control-Max-Age": "86400",
  };

  if (allowOrigin) {
    headers["Access-Control-Allow-Origin"] = allowOrigin;
    headers.Vary = "Origin";
  }

  return headers;
}

function jsonError(status: number, code: string, message: string, corsHeaders?: Record<string, string>): NextResponse {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: corsHeaders },
  );
}

export async function gatewayMiddleware(req: NextRequest): Promise<NextResponse> {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  if (req.nextUrl.pathname === "/") {
    return NextResponse.next();
  }

  const route = resolveRoute(req.nextUrl.pathname);
  if (!route) {
    return jsonError(404, "not_found", `No route configured for ${req.nextUrl.pathname}`, corsHeaders);
  }

  // Work on a mutable copy so stripped/injected headers reach the proxy handler.
  const headers = new Headers(req.headers);
  const result = await gate(headers, route);

  if (!result.ok) {
    return jsonError(result.status, result.code, result.message, corsHeaders);
  }

  // Enforce weekly usage limits for authenticated users on mutating routes.
  if (result.identity && req.method === "POST") {
    try {
      const isRoseRoute = route.serviceKey === "ROSE";
      const usage = isRoseRoute
        ? await checkAndIncrementRoseUsage(result.identity.sub, result.identity.roles)
        : await checkAndIncrementUsage(result.identity.sub);

      if (!usage.allowed) {
        const limitDesc = isRoseRoute
          ? `Rose weekly usage limit of ${usage.limit} requests exceeded (${usage.count}/${usage.limit}). Resets next week.`
          : `Weekly usage limit of ${usage.limit} requests exceeded (${usage.count}/${usage.limit}). Resets next week.`;
        return jsonError(429, "rate_limited", limitDesc, corsHeaders);
      }
    } catch (err) {
      console.error("[gateway] usage check failed, allowing request:", err);
    }
  }

  if (result.identity) {
    for (const [key, value] of Object.entries(identityHeaders(result.identity))) {
      if (value !== undefined) {
        headers.set(key, value);
      }
    }
  }
  headers.set(`${GATEWAY_HEADER_PREFIX}secret`, gatewaySecret());

  const res = NextResponse.next({ request: { headers } });
  for (const [key, value] of Object.entries(corsHeaders)) {
    res.headers.set(key, value);
  }
  return res;
}

export default gatewayMiddleware;
