import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, handleRouteError } from "@/lib/http";
import { createPublicClient } from "@/lib/supabase";
import { toTokenEnvelope } from "@/lib/tokens";

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(72),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return handleRouteError(parsed.error);
    }

    const supabase = createPublicClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.session) {
      return authErrorResponse(error ?? { status: 401, message: "Invalid email or password." });
    }

    return NextResponse.json(toTokenEnvelope(data.session), { status: 200 });
  } catch (err) {
    return handleRouteError(err);
  }
}
