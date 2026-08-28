import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, handleRouteError } from "../../http";
import { createPublicClient } from "../../supabase";
import { toPublicUser, toTokenEnvelope } from "../../tokens";

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return handleRouteError(parsed.error);
    }

    const supabase = createPublicClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      return authErrorResponse(error);
    }

    if (!data.session) {
      return NextResponse.json(
        { requires_email_confirmation: true, user: toPublicUser(data.user!) },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { requires_email_confirmation: false, session: toTokenEnvelope(data.session) },
      { status: 201 },
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
