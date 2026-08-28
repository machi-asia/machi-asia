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
): Promise<any> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const preferredModel = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const fallbackModels = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash"];
  const modelsToTry = Array.from(new Set([preferredModel, ...fallbackModels]));

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

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    let attempts = 0;
    const maxAttempts = 2;
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

          // If model is 404 (not found or deprecated), try next model in fallback list
          if (response.status === 404) {
            lastError = new Error(`Gemini API Error (404): ${errorText}`);
            break; // Break inner loop to try next model in modelsToTry
          }

          if ((response.status === 503 || response.status === 429) && attempts < maxAttempts) {
            console.warn(
              `Gemini API Warning (${response.status}): ${errorText.substring(0, 100)}. Retrying in ${delayMs}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          }

          throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
        }

        return await response.json();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        if (attempts < maxAttempts && !message.includes("Gemini API Error")) {
          console.warn(
            `Gemini network connection warning: ${message}. Retrying in ${delayMs}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        lastError = error instanceof Error ? error : new Error(String(error));
        break;
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  return null;
}
