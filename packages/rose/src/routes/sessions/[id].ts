import { NextRequest, NextResponse } from "next/server";
import {
  deleteSession,
  getSession,
  listMessages,
  renameSession,
} from "../../lib/sessionStore";
import { gatewayUnauthorized, requireUserId } from "../../lib/gateway-identity";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = requireUserId(req);
  if (!userId) {
    return gatewayUnauthorized();
  }

  const { id } = await params;
  const session = await getSession(userId, id);
  if (!session) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Session not found." } },
      { status: 404 }
    );
  }

  const messages = await listMessages(id);
  return NextResponse.json({ session, messages });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = requireUserId(req);
  if (!userId) {
    return gatewayUnauthorized();
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const rawTitle =
    body && typeof body.title === "string" ? body.title.trim() : "";

  if (!rawTitle) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "A non-empty 'title' is required." } },
      { status: 400 }
    );
  }

  const session = await renameSession(userId, id, rawTitle.slice(0, 120));
  if (!session) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Session not found." } },
      { status: 404 }
    );
  }

  return NextResponse.json({ session });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = requireUserId(req);
  if (!userId) {
    return gatewayUnauthorized();
  }

  const { id } = await params;
  const deleted = await deleteSession(userId, id);
  if (!deleted) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Session not found." } },
      { status: 404 }
    );
  }

  return NextResponse.json({ deleted: true });
}