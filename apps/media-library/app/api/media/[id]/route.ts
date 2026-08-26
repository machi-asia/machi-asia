import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/verify";
import { getSupabase } from "@/lib/supabase";

function apiError(
  status: number,
  code: string,
  message: string,
): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

function extractToken(authorization: string | null): string | null {
  return authorization?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const token = extractToken(req.headers.get("authorization"));
    if (!token) {
      return apiError(401, "unauthorized", "Missing bearer token.");
    }

    let userId: string;
    try {
      const identity = await verifyAccessToken(token);
      userId = identity.sub;
    } catch {
      return apiError(
        401,
        "unauthorized",
        "Invalid or expired token.",
      );
    }

    const { id } = await params;

    const db = getSupabase();

    const { data: existing, error: fetchError } = await db
      .from("media")
      .select("id, user_id")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (fetchError || !existing) {
      return apiError(404, "not_found", "Media not found.");
    }

    if (existing.user_id !== userId) {
      return apiError(403, "forbidden", "Access denied.");
    }

    const { error: deleteError } = await db
      .from("media")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (deleteError) {
      console.error("[media] soft delete error:", deleteError);
      return apiError(
        500,
        "server_error",
        "Failed to delete media.",
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[media] DELETE error:", err);
    return apiError(500, "server_error", "Internal server error.");
  }
}
