import { Tool } from "./index";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export const webSearchTool: Tool = {
  declaration: {
    name: "webSearch",
    description:
      "Search the web for current information on any topic. Returns a list of relevant results with titles, URLs, and snippets. Use this when the user asks about current events, facts you're unsure about, or anything that benefits from up-to-date information.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: {
          type: "STRING",
          description: "The search query to look up on the web.",
        },
        numResults: {
          type: "NUMBER",
          description: "Number of results to return (default 5, max 10).",
        },
      },
      required: ["query"],
    },
  },
  execute: async (args: Record<string, unknown>) => {
    try {
      const query = args.query as string;
      if (!query) {
        return JSON.stringify({ error: "query is required" });
      }

      const numResults = Math.min(Math.max(Number(args.numResults) || 5, 1), 10);

      const apiKey = process.env.SERPAPI_KEY || process.env.GOOGLE_SEARCH_API_KEY;

      if (apiKey) {
        const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&num=${numResults}&api_key=${apiKey}`;
        const res = await fetch(url);
        if (!res.ok) {
          return JSON.stringify({ error: `Search API returned ${res.status}` });
        }
        const data: Record<string, unknown> = await res.json();
        const rawResults = data.organic_results as Array<Record<string, string>> | undefined;
        const results: SearchResult[] = (rawResults || [])
          .slice(0, numResults)
          .map((r) => ({
            title: r.title || "",
            url: r.link || "",
            snippet: r.snippet || "",
          }));
        return JSON.stringify({ query, results });
      }

      const geminiKey =
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      if (geminiKey) {
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
                    text: `Search the web for: "${query}"\n\nReturn ${numResults} relevant results as a JSON array with "title", "url", and "snippet" fields. Return ONLY the JSON array, no other text.`,
                  },
                ],
              },
            ],
            generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
          }),
        });
        if (!res.ok) {
          return JSON.stringify({ error: `Gemini search returned ${res.status}` });
        }
        const data: Record<string, unknown> = await res.json();
        const candidates = data.candidates as Array<{
          content?: { parts: Array<{ text?: string }> };
        }> | undefined;
        const text = candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        const results: SearchResult[] = jsonMatch
          ? (JSON.parse(jsonMatch[0]) as SearchResult[]).slice(0, numResults)
          : [];
        return JSON.stringify({ query, results });
      }

      return JSON.stringify({
        query,
        results: [],
        note: "No search API configured. Set SERPAPI_KEY or GEMINI_API_KEY.",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Web search failed";
      return JSON.stringify({ error: message });
    }
  },
};
