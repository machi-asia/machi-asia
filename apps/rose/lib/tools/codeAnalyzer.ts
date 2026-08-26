import { Tool } from "./index";

export const codeAnalyzerTool: Tool = {
  declaration: {
    name: "codeAnalyzer",
    description:
      "Analyze, explain, review, or refactor a code snippet. Provide the code and an instruction (e.g. 'explain', 'review', 'find bugs', 'refactor', 'add types', 'write tests'). The tool returns a detailed analysis. Use this when the user pastes code and asks for help with it.",
    parameters: {
      type: "OBJECT",
      properties: {
        code: {
          type: "STRING",
          description: "The code snippet to analyze.",
        },
        language: {
          type: "STRING",
          description:
            "The programming language of the code (e.g. 'typescript', 'python', 'rust'). Helps with context.",
        },
        instruction: {
          type: "STRING",
          description:
            "What to do with the code: 'explain', 'review', 'find bugs', 'refactor', 'optimize', 'add types', 'write tests', 'document', or any other analysis request.",
        },
      },
      required: ["code", "instruction"],
    },
  },
  execute: async (args: Record<string, unknown>) => {
    try {
      const code = args.code as string;
      const instruction = args.instruction as string;
      const language = (args.language as string) || "unknown";

      if (!code || !instruction) {
        return JSON.stringify({ error: "code and instruction are required" });
      }

      const geminiKey =
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      if (!geminiKey) {
        return JSON.stringify({
          analysis: `Language: ${language}\n\nInstruction: ${instruction}\n\n(Gemini API not configured — returning raw analysis without LLM)\n\n${code}`,
          note: "Set GEMINI_API_KEY for AI-powered analysis.",
        });
      }

      const model = "gemini-2.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are a senior software engineer. Analyze the following ${language} code.\n\nTask: ${instruction}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide a thorough, well-structured analysis. Use Markdown formatting with code blocks where appropriate.`,
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
        }),
      });

      if (!res.ok) {
        return JSON.stringify({ error: `Gemini returned ${res.status}` });
      }

      const data: Record<string, unknown> = await res.json();
      const candidates = data.candidates as Array<{
        content?: { parts: Array<{ text?: string }> };
      }> | undefined;
      const text =
        candidates?.[0]?.content?.parts?.[0]?.text || "No analysis generated.";

      return JSON.stringify({ analysis: text, language, instruction });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Code analysis failed";
      return JSON.stringify({ error: message });
    }
  },
};
