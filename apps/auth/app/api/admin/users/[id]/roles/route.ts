import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, handleRouteError } from "@/lib/http";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase";

const bodySchema = z.object({
  roles: z
    .array(z.string().regex(/^[a-z][a-z0-9_-]*$/i))
    .min(1)
    .max(20),
});

function secretsMatch(presented: string, expected: string): boolean {
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // Burn equivalent time before returning to avoid length-based timing oracles.
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const presented = req.headers.get("x-admin-secret");
    if (!presented || !secretsMatch(presented, env.adminApiSecret)) {
      return apiError(401, "unauthorized", "Invalid admin secret.");
    }

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return handleRouteError(parsed.error);
    }

    const { id } = await ctx.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return apiError(400, "invalid_request", "`id` must be a UUID.");
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.updateUserById(id, {
      app_metadata: { roles: parsed.data.roles },
    });

    if (error) {
      return apiError(error.status ?? 500, error.status === 404 ? "not_found" : "server_error", error.message);
    }

    return NextResponse.json(
      { id: data.user.id, email: data.user.email ?? null, roles: parsed.data.roles },
      { status: 200 },
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
