import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "../lib/supabase";
import { env } from "../lib/env";

export const dynamic = "force-dynamic";

function apiError(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = req.headers.get("x-gateway-sub");
    if (!userId) {
      return apiError(401, "unauthorized", "Requests must go through the API gateway.");
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

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = req.headers.get("x-gateway-sub");
    if (!userId) {
      return apiError(401, "unauthorized", "Requests must go through the API gateway.");
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return apiError(400, "bad_request", "A file field is required.");
    }

    if (!file.type.startsWith("image/")) {
      return apiError(400, "bad_request", "Only image files are accepted.");
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
      return apiError(500, "server_error", "Failed to upload file.");
    }

    const { data: urlData } = db.storage.from(bucket).getPublicUrl(storagePath);

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
      return apiError(500, "server_error", "Failed to save media record.");
    }

    return NextResponse.json({ item: record }, { status: 201 });
  } catch (err) {
    console.error("[media] POST error:", err);
    return apiError(500, "server_error", "Internal server error.");
  }
}
