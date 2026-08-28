export interface FormattedError {
  title: string;
  code?: string;
  message: string;
  details?: string;
  suggestion?: string;
  markdown: string;
}

export function parseErrorDetails(error: unknown): {
  code: string;
  message: string;
  details?: string;
} {
  if (typeof error === "string") {
    try {
      const parsed = JSON.parse(error);
      if (parsed.error) {
        return {
          code: String(parsed.error.code || parsed.error.status || "ERROR"),
          message: parsed.error.message || "An unknown error occurred.",
          details: parsed.error.status,
        };
      }
    } catch {
      // not JSON string
    }

    const geminiMatch = error.match(/Gemini API Error \((\d+)\):\s*(\{[\s\S]*\})/);
    if (geminiMatch) {
      try {
        const json = JSON.parse(geminiMatch[2]);
        if (json.error) {
          return {
            code: String(json.error.status || json.error.code || geminiMatch[1]),
            message: json.error.message || "Gemini API encountered an issue.",
            details: `HTTP status ${geminiMatch[1]}`,
          };
        }
      } catch {
        // ignore
      }
    }

    return {
      code: "REQUEST_ERROR",
      message: error,
    };
  }

  if (error && typeof error === "object") {
    const errObj = error as any;
    if (errObj.error && typeof errObj.error === "object") {
      return {
        code: String(errObj.error.code || errObj.error.status || "API_ERROR"),
        message: errObj.error.message || "An error occurred during API processing.",
        details: errObj.error.details || errObj.error.status,
      };
    }

    return {
      code: errObj.code ? String(errObj.code) : "INTERNAL_ERROR",
      message: errObj.message || "An unexpected error occurred.",
      details: errObj.stack ? String(errObj.stack).split("\n")[0] : undefined,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "An unexpected error occurred.",
  };
}

export function formatErrorMessage(error: unknown, customSuggestion?: string): string {
  const { code, message, details } = parseErrorDetails(error);

  const lines: string[] = [
    "### ⚠️ Error Encountered",
    "",
    "---",
    "",
    "**An issue occurred while processing your request:**",
    "",
    `- **Status / Code:** \`${code}\``,
    `- **Message:** ${message}`,
  ];

  if (details && details !== code) {
    lines.push(`- **Details:** ${details}`);
  }

  lines.push(
    `- **Suggestion:** ${customSuggestion || "Please check your input or try again in a moment."}`,
    "",
    "---",
    "",
    "*If this issue persists, please verify your API configuration or contact support.*",
    "",
    "<emotion>sad</emotion>"
  );

  return lines.join("\n");
}

export function formatUsageLimitMessage(usage?: {
  count?: number;
  limit?: number;
  week?: string;
  dailyCount?: number;
  dailyLimit?: number;
  day?: string;
  exceededType?: "daily" | "weekly";
  role?: string;
}): string {
  const isDaily = usage?.exceededType === "daily";
  const roleName = usage?.role ? usage.role.toUpperCase() : "STANDARD";

  if (isDaily) {
    const dailyCount = usage?.dailyCount ?? (usage?.role === "guest" ? 10 : 20);
    const dailyLimit = usage?.dailyLimit ?? (usage?.role === "guest" ? 10 : 20);
    const day = usage?.day ?? "today";

    return [
      "### ⏳ Daily Usage Limit Reached",
      "",
      "---",
      "",
      "**You have reached your daily request limit for today:**",
      "",
      `- **Daily Requests Used:** **${dailyCount} / ${dailyLimit}**`,
      `- **Active Day:** \`${day}\``,
      `- **Account Role:** \`${roleName}\``,
      "- **Reset Schedule:** Daily limits reset automatically at **midnight (00:00 UTC)**.",
      ...(usage?.count !== undefined && usage?.limit !== undefined
        ? [`- **Weekly Progress:** **${usage.count} / ${usage.limit}** requests used this week.`]
        : []),
      "",
      "---",
      "",
      "*Thank you for exploring! Please check back tomorrow or log in to a higher account tier.*",
      "",
      "<emotion>sleeping</emotion>",
    ].join("\n");
  }

  const count = usage?.count ?? (usage?.role === "guest" ? 50 : 200);
  const limit = usage?.limit ?? (usage?.role === "guest" ? 50 : 200);
  const week = usage?.week ?? "current week";

  return [
    "### ⏳ Weekly Usage Limit Reached",
    "",
    "---",
    "",
    "**You have reached your allocated request limit for this week:**",
    "",
    `- **Weekly Requests Used:** **${count} / ${limit}**`,
    `- **Active Week:** \`${week}\``,
    `- **Account Role:** \`${roleName}\``,
    "- **Reset Schedule:** Weekly limits reset automatically every **Monday at 00:00 UTC**.",
    "",
    "---",
    "",
    "*Thank you for exploring! Please check back next week or log in to a higher account tier.*",
    "",
    "<emotion>sleeping</emotion>",
  ].join("\n");
}
