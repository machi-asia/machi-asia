import { NextRequest, NextResponse } from "next/server";
import { updateMemory, deleteMemory } from "../../lib/memoryStore";
import { gatewayUnauthorized, requireUserId } from "../../lib/gateway-identity";

export const dynamic = "force-dynamic";

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
  if (!body) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Request body required." } },
      { status: 400 }
    );
  }

  const updated = await updateMemory(userId, id, {
    content: body.content,
    category: body.category,
    importance: body.importance,
  });

  if (!updated) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Memory not found or update failed." } },
      { status: 404 }
    );
  }

  return NextResponse.json({ memory: updated });
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
  const success = await deleteMemory(userId, id);

  if (!success) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Memory not found or deletion failed." } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
