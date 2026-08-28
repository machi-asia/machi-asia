import { NextRequest, NextResponse } from "next/server";
import { buildResponseHeaders, buildUpstreamRequestHeaders, buildUpstreamUrl } from "../lib/proxy";

export const dynamic = "force-dynamic";

const BODYLESS_METHODS = new Set(["GET", "HEAD"]);

function jsonError(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

async function forward(req: NextRequest): Promise<NextResponse> {
  const upstreamUrl = buildUpstreamUrl(req.nextUrl.pathname, req.nextUrl.search);
  if (!upstreamUrl) {
    return jsonError(404, "not_found", `No route configured for ${req.nextUrl.pathname}`);
  }

  try {
    const init: RequestInit & { duplex?: string } = {
      method: req.method,
      headers: buildUpstreamRequestHeaders(req.headers),
      redirect: "manual",
    };
    if (!BODYLESS_METHODS.has(req.method)) {
      init.body = req.body;
      init.duplex = "half";
    }

    const upstreamRes = await fetch(upstreamUrl, init);

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers: buildResponseHeaders(upstreamRes.headers),
    });
  } catch (err) {
    console.error("[gateway] upstream fetch failed:", err);
    return jsonError(502, "upstream_error", "Upstream service is unreachable.");
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
export const HEAD = forward;
export const OPTIONS = forward;
