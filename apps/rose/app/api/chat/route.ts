import { NextRequest, NextResponse } from "next/server";
import { runAgentChat, ChatMessage } from "@/lib/agentRunner";

export const dynamic = "force-dynamic";

interface ChatRequest {
  history: ChatMessage[];
  message: string;
}

function verifyGatewaySecret(req: NextRequest): boolean {
  const secret = process.env.INTERNAL_GATEWAY_SECRET;
  if (!secret) return true;
  const provided = req.headers.get("x-gateway-secret");
  if (!provided) {
    const hasGatewayHeaders = req.headers.get("x-gateway-sub") || req.headers.get("x-gateway-email");
    if (hasGatewayHeaders) {
      console.error("[rose] Request has gateway identity headers but no x-gateway-secret. Ensure the gateway's INTERNAL_GATEWAY_SECRET matches Rose's.");
      return false;
    }
    return true;
  }
  return provided === secret;
}

export async function POST(req: NextRequest) {
  if (!verifyGatewaySecret(req)) {
    return NextResponse.json(
      { error: { code: "forbidden", message: "Missing or invalid gateway secret." } },
      { status: 403 }
    );
  }

  try {
    const body: ChatRequest = await req.json();

    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { error: { code: "bad_request", message: "A 'message' string is required." } },
        { status: 400 }
      );
    }

    const history: ChatMessage[] = Array.isArray(body.history) ? body.history : [];

    const result = await runAgentChat(history, body.message);

    return NextResponse.json({
      text: result.text,
      history: result.history,
      traces: result.traces,
      emotion: result.emotion,
      optionsPayload: result.optionsPayload ?? null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("[rose] chat error:", err);
    return NextResponse.json(
      {
        error: {
          code: "internal_error",
          message,
        },
      },
      { status: 500 }
    );
  }
}
