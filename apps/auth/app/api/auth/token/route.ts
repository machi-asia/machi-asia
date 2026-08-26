import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, handleRouteError } from "@/lib/http";
import { refreshTokens } from "@/lib/gotrue";
import { toTokenEnvelope } from "@/lib/tokens";

const bodySchema = z.object({
  refresh_token: z.string().min(1),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return handleRouteError(parsed.error);
    }

    const session = await refreshTokens(parsed.data.refresh_token);

    return NextResponse.json(toTokenEnvelope(session), { status: 200 });
  } catch (err) {
    const maybe = err as { status?: unknown; message?: string };
    if (maybe && typeof maybe.status === "number") {
      return authErrorResponse({ status: maybe.status, message: maybe.message });
    }
    return handleRouteError(err);
  }
}
