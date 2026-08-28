import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "../lib/verify";
import { getUsage } from "../lib/usage";

function apiError(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const authorization = req.headers.get("authorization");
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (!token) {
      return apiError(401, "unauthorized", "Missing bearer token.");
    }

    let sub: string;
    try {
      const identity = await verifyAccessToken(token);
      sub = identity.sub;
    } catch {
      return apiError(401, "unauthorized", "Invalid or expired token.");
    }

    const usage = await getUsage(sub);

    return NextResponse.json({
      user_id: sub,
      week: usage.week,
      count: usage.count,
      limit: usage.limit,
      allowed: usage.allowed,
      remaining: Math.max(0, usage.limit - usage.count),
    });
  } catch (err) {
    console.error("[gateway] usage endpoint error:", err);
    return apiError(500, "server_error", "Internal server error.");
  }
}
