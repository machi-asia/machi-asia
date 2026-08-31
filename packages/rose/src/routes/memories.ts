import { NextRequest, NextResponse } from "next/server";
import { listMemories, addMemory } from "../lib/memoryStore";
import { gatewayUnauthorized, requireUserId } from "../lib/gateway-identity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = requireUserId(req);
  if (!userId) {
    return gatewayUnauthorized();
  }

  const memories = await listMemories(userId);
  return NextResponse.json({ memories });
}

export async function POST(req: NextRequest) {
  const userId = requireUserId(req);
  if (!userId) {
    return gatewayUnauthorized();
  }

  const body = await req.json().catch(() => null);
  const content =
    body && typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "A 'content' string is required." } },
      { status: 400 }
    );
  }

  const memory = await addMemory(userId, {
    content,
    category: body.category,
    importance: body.importance,
  });

  if (!memory) {
    return NextResponse.json(
      { error: { code: "internal_error", message: "Failed to store memory." } },
      { status: 500 }
    );
  }

  return NextResponse.json({ memory }, { status: 201 });
}
