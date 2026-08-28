import { NextRequest, NextResponse } from "next/server";
import { createSession, listSessions } from "../lib/sessionStore";
import { gatewayUnauthorized, requireUserId } from "../lib/gateway-identity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = requireUserId(req);
  if (!userId) {
    return gatewayUnauthorized();
  }

  const sessions = await listSessions(userId);
  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const userId = requireUserId(req);
  if (!userId) {
    return gatewayUnauthorized();
  }

  const body = await req.json().catch(() => null);
  const rawTitle =
    body && typeof body.title === "string" ? body.title.trim() : "";
  const title = rawTitle ? rawTitle.slice(0, 120) : "New chat";

  const session = await createSession(userId, title);
  return NextResponse.json({ session }, { status: 201 });
}