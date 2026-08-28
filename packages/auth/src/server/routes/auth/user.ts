import { NextRequest, NextResponse } from "next/server";
import { apiError, handleRouteError } from "../../http";
import { verifyAccessToken } from "../../verify";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const authorization = req.headers.get("authorization");
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (!token) {
      return apiError(401, "unauthorized", "Missing bearer token.");
    }

    const identity = await verifyAccessToken(token);

    return NextResponse.json(
      {
        id: identity.sub,
        email: identity.email ?? null,
        phone: identity.phone ?? null,
        roles: identity.roles,
        aal: identity.aal ?? null,
        session_id: identity.sessionId ?? null,
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof Error && err.name === "JWTExpired") {
      return apiError(401, "unauthorized", "Token has expired.");
    }
    if (err instanceof Error && /jose|JWS|JWT|signature|claim/i.test(err.name + err.message)) {
      return apiError(401, "unauthorized", "Invalid or expired token.");
    }
    return handleRouteError(err);
  }
}
