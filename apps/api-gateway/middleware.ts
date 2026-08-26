import { NextRequest, NextResponse } from "next/server";
import { resolveRoute } from "@/lib/routes";
import { GATEWAY_HEADER_PREFIX, gate, gatewaySecret, identityHeaders } from "@/lib/auth-gate";
import { checkAndIncrementUsage, checkAndIncrementRoseUsage } from "@/lib/usage";

export const config = {
  matcher: ["/((?!api/health|api/usage|_next/static|_next/image|favicon.ico).*)"],
};

function jsonError(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  if (req.nextUrl.pathname === "/") {
    return NextResponse.next();
  }

  const route = resolveRoute(req.nextUrl.pathname);
  if (!route) {
    return jsonError(404, "not_found", `No route configured for ${req.nextUrl.pathname}`);
  }

  // Work on a mutable copy so stripped/injected headers reach the proxy handler.
  const headers = new Headers(req.headers);
  const result = await gate(headers, route);

  if (!result.ok) {
    return jsonError(result.status, result.code, result.message);
  }

  // Enforce weekly usage limits for authenticated users on non-public routes.
  if (result.identity) {
    try {
      const isRoseRoute = route.serviceKey === "ROSE";
      const usage = isRoseRoute
        ? await checkAndIncrementRoseUsage(result.identity.sub, result.identity.roles)
        : await checkAndIncrementUsage(result.identity.sub);

      if (!usage.allowed) {
        const limitDesc = isRoseRoute
          ? `Rose weekly usage limit of ${usage.limit} requests exceeded (${usage.count}/${usage.limit}). Resets next week.`
          : `Weekly usage limit of ${usage.limit} requests exceeded (${usage.count}/${usage.limit}). Resets next week.`;
        return jsonError(429, "rate_limited", limitDesc);
      }
    } catch (err) {
      console.error("[gateway] usage check failed, allowing request:", err);
    }

    for (const [key, value] of Object.entries(identityHeaders(result.identity))) {
      if (value !== undefined) {
        headers.set(key, value);
      }
    }
  }
  headers.set(`${GATEWAY_HEADER_PREFIX}secret`, gatewaySecret());

  return NextResponse.next({ request: { headers } });
}
