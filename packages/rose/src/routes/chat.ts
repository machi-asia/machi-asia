import { NextRequest, NextResponse } from "next/server";
import { runAgentChat, ChatMessage } from "../lib/agentRunner";
import {
  gatewayUnauthorized,
  parseRoles,
  requireUserId,
} from "../lib/gateway-identity";
import { checkAndIncrementRoseUsage, RoseUsage } from "../lib/usage";
import { formatErrorMessage, formatUsageLimitMessage } from "../lib/errorFormatter";
import { extractEmotion } from "../lib/roseEmotions";

export const dynamic = "force-dynamic";

interface ChatRequest {
  history: ChatMessage[];
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    const userId = requireUserId(req);
    if (!userId) {
      return gatewayUnauthorized();
    }

    const usage: RoseUsage = await checkAndIncrementRoseUsage(
      userId,
      parseRoles(req)
    );
    if (!usage.allowed) {
      const usageMsg = formatUsageLimitMessage(usage);
      const { cleanText, emotion } = extractEmotion(usageMsg);
      const limitReason =
        usage.exceededType === "daily"
          ? `Daily usage limit reached (${usage.dailyCount}/${usage.dailyLimit}). Try again tomorrow.`
          : `Weekly usage limit reached (${usage.count}/${usage.limit}). Try again next week.`;

      return NextResponse.json(
        {
          error: {
            code: "usage_limit_exceeded",
            message: limitReason,
          },
          text: cleanText,
          emotion: emotion || "sleeping",
          variant: "warning",
          usage,
        },
        { status: 429 }
      );
    }

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
      variant: result.variant || "default",
      optionsPayload: result.optionsPayload ?? null,
      usage,
    });
  } catch (err: unknown) {
    console.error("[rose] chat error:", err);
    const formattedErr = formatErrorMessage(err);
    const { cleanText, emotion } = extractEmotion(formattedErr);
    return NextResponse.json(
      {
        error: {
          code: "internal_error",
          message: err instanceof Error ? err.message : String(err),
        },
        text: cleanText,
        emotion: emotion || "sad",
        variant: "error",
      },
      { status: 500 }
    );
  }
}
