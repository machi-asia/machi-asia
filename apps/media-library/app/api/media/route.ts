import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/verify";
import { getSupabase } from "@/lib/supabase";
import { env } from "@/lib/env";

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

export async function GET(
  req: NextRequest,
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

    const db = getSupabase();
    const { data, error } = await db
      .from("media")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[media] list error:", error);
      return apiError(500, "server_error", "Failed to list media.");
    }

    return NextResponse.json({ items: data });
  } catch (err) {
    console.error("[media] GET error:", err);
    return apiError(500, "server_error", "Internal server error.");
  }
}

export async function POST(
  req: NextRequest,
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

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return apiError(
        400,
        "bad_request",
        "A file field is required.",
      );
    }

    if (!file.type.startsWith("image/")) {
      return apiError(
        400,
        "bad_request",
        "Only image files are accepted.",
      );
    }

    const db = getSupabase();
    const bucket = env.mediaStorageBucket;
    const ext = file.name.split(".").pop() ?? "png";
    const storagePath = `${userId}/${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await db.storage
      .from(bucket)
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[media] storage upload error:", uploadError);
      return apiError(
        500,
        "server_error",
        "Failed to upload file.",
      );
    }

    const { data: urlData } = db.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    const { data: record, error: insertError } = await db
      .from("media")
      .insert({
        user_id: userId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[media] insert error:", insertError);
      return apiError(
        500,
        "server_error",
        "Failed to save media record.",
      );
    }

    return NextResponse.json({ item: record }, { status: 201 });
  } catch (err) {
    console.error("[media] POST error:", err);
    return apiError(500, "server_error", "Internal server error.");
  }
}
