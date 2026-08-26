import { NextResponse } from "next/server";
import { authErrorResponse, handleRouteError } from "@/lib/http";
import { createPublicClient } from "@/lib/supabase";
import { toTokenEnvelope } from "@/lib/tokens";

export async function POST(): Promise<NextResponse> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      return authErrorResponse(error);
    }

    if (!data.session) {
      return NextResponse.json(
        { error: { code: "server_error", message: "No session returned from anonymous sign-in." } },
        { status: 500 },
      );
    }

    return NextResponse.json(toTokenEnvelope(data.session), { status: 200 });
  } catch (err) {
    return handleRouteError(err);
  }
}
