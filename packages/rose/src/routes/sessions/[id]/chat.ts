import { NextRequest, NextResponse } from "next/server";
import { runAgentChat, ChatMessage } from "../../../lib/agentRunner";
import {
  appendMessages,
  getSession,
  listMessages,
  renameSession,
  touchSession,
} from "../../../lib/sessionStore";
import {
  gatewayUnauthorized,
  parseRoles,
  requireUserId,
} from "../../../lib/gateway-identity";
import { checkAndIncrementRoseUsage, RoseUsage } from "../../../lib/usage";
import { formatErrorMessage, formatUsageLimitMessage } from "../../../lib/errorFormatter";
import { extractEmotion } from "../../../lib/roseEmotions";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = requireUserId(req);
  if (!userId) {
    return gatewayUnauthorized();
  }

  const { id } = await params;
  const session = await getSession(userId, id);
  if (!session) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Session not found." } },
      { status: 404 }
    );
  }

  const body = await req.json().catch(() => null);
  const message =
    body && typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "A 'message' string is required." } },
      { status: 400 }
    );
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

  try {
    const stored = await listMessages(id);
    const history: ChatMessage[] = stored.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    const result = await runAgentChat(history, message);

    const created = await appendMessages(id, [
      { role: "user", content: message },
      {
        role: "model",
        content: result.text,
        emotion: result.emotion ?? null,
        traces: result.traces,
      },
    ]);

    if (session.title === "New chat") {
      await renameSession(userId, id, message.slice(0, 60));
    } else {
      await touchSession(userId, id);
    }

    return NextResponse.json({
      text: result.text,
      traces: result.traces,
      emotion: result.emotion,
      variant: result.variant || "default",
      optionsPayload: result.optionsPayload ?? null,
      usage,
      messages: created,
    });
  } catch (err: unknown) {
    console.error("[rose] session chat error:", err);
    const formattedErr = formatErrorMessage(err);
    const { cleanText, emotion } = extractEmotion(formattedErr);
    return NextResponse.json(
      {
        error: {
          code: "internal_error",
          message: err instanceof Error ? err.message : "An unexpected error occurred.",
        },
        text: cleanText,
        emotion: emotion || "sad",
        variant: "error",
      },
      { status: 500 }
    );
  }
}