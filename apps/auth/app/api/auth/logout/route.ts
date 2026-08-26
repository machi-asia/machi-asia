import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, handleRouteError } from "@/lib/http";
import { createAdminClient } from "@/lib/supabase";

const bodySchema = z.object({
  refresh_token: z.string().min(1),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return handleRouteError(parsed.error);
    }

    const admin = createAdminClient();
    // Revoking an already-revoked/unknown token is treated as success so the
    // endpoint stays idempotent for clients.
    const { error } = await admin.auth.admin.signOut(parsed.data.refresh_token);
    if (error) {
      console.warn("[auth] logout revoke warning:", error.message);
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return apiError(400, "invalid_request", "Request body must be valid JSON.");
    }
    return handleRouteError(err);
  }
}
