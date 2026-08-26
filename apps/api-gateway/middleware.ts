import { NextRequest, NextResponse } from "next/server";
import { resolveRoute } from "@/lib/routes";
import { GATEWAY_HEADER_PREFIX, gate, gatewaySecret, identityHeaders } from "@/lib/auth-gate";

export const config = {
  matcher: ["/((?!api/health|_next/static|_next/image|favicon.ico).*)"],
};

function jsonError(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
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

  if (result.identity) {
    for (const [key, value] of Object.entries(identityHeaders(result.identity))) {
      if (value !== undefined) {
        headers.set(key, value);
      }
    }
  }
  headers.set(`${GATEWAY_HEADER_PREFIX}secret`, gatewaySecret());

  return NextResponse.next({ request: { headers } });
}
