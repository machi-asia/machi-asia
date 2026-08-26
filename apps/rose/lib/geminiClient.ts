interface GeminiRequestBody {
  contents: Array<{ role: string; parts: unknown[] }>;
  systemInstruction: { parts: Array<{ text: string }> };
  generationConfig: { temperature: number; maxOutputTokens: number };
  tools?: Array<{ functionDeclarations: unknown[] }>;
}

export async function callGemini(
  systemInstruction: string,
  contents: Array<{ role: string; parts: unknown[] }>,
  tools?: unknown[]
): Promise<Record<string, unknown> | null> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const model = "gemini-3.6-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body: GeminiRequestBody = {
    contents,
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  };

  if (tools && tools.length > 0) {
    body.tools = [{ functionDeclarations: tools }];
  }

  let attempts = 0;
  const maxAttempts = 3;
  const delayMs = 1000;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();

        if ((response.status === 503 || response.status === 429) && attempts < maxAttempts) {
          console.warn(
            `Gemini API Warning (${response.status}): ${errorText.substring(0, 100)}. Retrying in ${delayMs}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
      }

      return (await response.json()) as Record<string, unknown>;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempts < maxAttempts && !message.includes("Gemini API Error")) {
        console.warn(
          `Gemini network connection warning: ${message}. Retrying in ${delayMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw error;
    }
  }

  return null;
}
