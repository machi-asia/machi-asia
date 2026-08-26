import { callGemini } from "./geminiClient";
import { TOOLS, getToolByName } from "./tools";
import { ROSE_EMOTIONS, extractEmotion } from "./roseEmotions";

export { ROSE_EMOTIONS, extractEmotion };

const TOOL_LABEL_MAP: Record<string, string> = {
  askQuestion: "asking interactive question",
  webSearch: "searching the web",
  calculator: "calculating",
  codeAnalyzer: "analyzing code",
};

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
  functionResponse?: { name: string; response: { content: string } };
}

interface GeminiCandidate {
  content?: { parts: GeminiPart[] };
  finishReason?: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
}

const AGENT_SYSTEM_INSTRUCTION = `You are "Rose", a helpful, friendly, and knowledgeable general-purpose AI assistant.
You are articulate, warm, and genuinely eager to help with any question or task.

Core Principles:
1. Be helpful, accurate, and honest. If you don't know something, say so.
2. Be concise when possible, but thorough when the question demands depth.
3. Adapt your tone to the context — technical for code questions, conversational for casual chat.
4. Think step-by-step for complex problems before giving your answer.

Capabilities & Tools:
- 'webSearch': Search the web for current information. Use this when asked about current events, recent data, or anything you're uncertain about. Always prefer fresh data over your training knowledge for time-sensitive questions.
- 'calculator': Evaluate mathematical expressions. Supports arithmetic, exponents, parentheses, and common math functions (sqrt, sin, cos, log, etc.). Use for any computation the user requests.
- 'codeAnalyzer': Analyze, explain, review, refactor, or debug code snippets. Provide the code and an instruction. Use whenever the user pastes code and asks for help.
- 'askQuestion': Use this tool when you want to present a list of options or follow-up topics to the user. NEVER write a list of options in plain markdown — ALWAYS call askQuestion instead. This renders interactive clickable buttons in the chat UI.

Execution & Response Rules:
- You may call multiple tools in a single response — do so whenever the question benefits from it.
- Tool outputs are data payloads for processing; tools are executed automatically in the background.
- For code responses, use proper Markdown code fences with language identifiers.
- For math, show your work step-by-step when helpful.
- When you don't need a tool, respond directly with your knowledge.

Emotion Output Rule:
At the very end of your final text response, append an emotion tag matching your current tone in the format \`<emotion>EMOTION_NAME</emotion>\`.
You MUST choose EMOTION_NAME strictly from the following allowed set:
- happy (default warm, friendly, helpful tone)
- bright (enthusiastic, insightful, brilliant solution)
- coding (technical explanation, code snippets, technical setup)
- confused (clarifying question, ambiguous request)
- researching (data retrieval, deep search, analysis)
- sad (regretful, error, unable to fulfill request)
- sleeping (idle, offline, simple goodnight)
- surprised (impressive achievement, unexpected discovery)
- thinking (complex reasoning, problem solving)

Example final line of output:
<emotion>happy</emotion>

Formatting Rules:
- Output raw Markdown directly — do NOT wrap your response in code fences.
- Use Markdown tables, lists, bold, italic, and code spans as appropriate.
- For code examples, use fenced code blocks with language identifiers.
- Keep responses clean and well-structured.`;

export interface ChatMessage {
  role: "user" | "model" | "tool";
  parts: Array<{
    text?: string;
    functionCall?: {
      name: string;
      args: Record<string, unknown>;
    };
    functionResponse?: {
      name: string;
      response: Record<string, unknown>;
    };
  }>;
}

export interface RunAgentResult {
  text: string;
  history: ChatMessage[];
  traces: string[];
  optionsPayload?: {
    question: string;
    options: string[];
    allowMultiple?: boolean;
  };
  emotion?: string;
}

export async function runAgentChat(
  history: ChatMessage[],
  newMessageText: string,
  onTrace?: (trace: string) => void
): Promise<RunAgentResult> {
  const traces: string[] = [];

  const addTrace = (label: string) => {
    traces.push(label);
    onTrace?.(label);
  };

  addTrace("thinking");

  let optionsPayload: RunAgentResult["optionsPayload"] = undefined;

  const activeHistory: ChatMessage[] = [...history];

  if (newMessageText) {
    activeHistory.push({
      role: "user",
      parts: [{ text: newMessageText }],
    });
  }

  const toolDeclarations = TOOLS.map((t) => t.declaration);

  let loopCount = 0;
  const maxLoops = 10;

  while (loopCount < maxLoops) {
    loopCount++;
    console.log(`[AgentRunner] Running loop iteration ${loopCount}`);

    const responseJson: GeminiResponse | null = await callGemini(
      AGENT_SYSTEM_INSTRUCTION,
      activeHistory,
      toolDeclarations
    );

    if (!responseJson) {
      addTrace("researching");
      return {
        text: "The AI assistant is not configured. Please set the GEMINI_API_KEY environment variable.",
        history: activeHistory,
        traces,
        emotion: "sad",
      };
    }

    const candidate = responseJson.candidates?.[0];
    if (!candidate) {
      addTrace("researching");
      const blockReason = responseJson.promptFeedback?.blockReason;
      const fallbackText = blockReason
        ? `I wasn't able to respond to that — it may have been flagged by a content filter (${blockReason}). Could you try rephrasing? <emotion>confused</emotion>`
        : "I didn't receive a response from the AI. Please try again in a moment. <emotion>confused</emotion>";
      const { cleanText, emotion } = extractEmotion(fallbackText);
      return {
        text: cleanText,
        history: activeHistory,
        traces,
        emotion,
      };
    }

    const modelContent = candidate.content;
    if (!modelContent || !modelContent.parts || modelContent.parts.length === 0) {
      addTrace("researching");
      const finishReason = candidate.finishReason;
      let fallbackText =
        "I wasn't able to generate a complete response. Please try again. <emotion>confused</emotion>";
      if (finishReason === "SAFETY") {
        fallbackText =
          "My response was blocked by a safety filter. Could you try rephrasing your message? <emotion>confused</emotion>";
      } else if (finishReason === "MAX_TOKENS") {
        fallbackText =
          "My response exceeded the length limit. Could you ask a more specific question? <emotion>confused</emotion>";
      }
      const { cleanText, emotion } = extractEmotion(fallbackText);
      return {
        text: cleanText,
        history: activeHistory,
        traces,
        emotion,
      };
    }

    const modelMessage: ChatMessage = {
      role: "model",
      parts: modelContent.parts as ChatMessage["parts"],
    };
    activeHistory.push(modelMessage);

    const toolCallParts = modelContent.parts.filter(
      (p): p is GeminiPart & { functionCall: NonNullable<GeminiPart["functionCall"]> } =>
        p.functionCall !== undefined
    );

    if (toolCallParts.length > 0) {
      console.log(
        `[AgentRunner] Model requested ${toolCallParts.length} tool(s) in parallel`
      );
      addTrace("coding");
      const functionResponseParts: ChatMessage["parts"] = [];

      for (const part of toolCallParts) {
        const fnName = part.functionCall.name;
        const fnArgs = part.functionCall.args || {};

        const traceLabel = TOOL_LABEL_MAP[fnName] || `calling ${fnName}`;
        addTrace(traceLabel);

        console.log(
          `[AgentRunner] Executing tool: ${fnName} with args:`,
          fnArgs
        );
        const toolObj = getToolByName(fnName);

        let resultJsonString: string;
        if (toolObj) {
          try {
            resultJsonString = await toolObj.execute(fnArgs);
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Tool execution failed";
            console.error(`[AgentRunner] Tool error (${fnName}):`, err);
            resultJsonString = JSON.stringify({ error: message });
          }
        } else {
          resultJsonString = JSON.stringify({
            error: `Tool '${fnName}' is not registered`,
          });
        }

        if (fnName === "askQuestion") {
          try {
            const parsed: { question?: string; options?: string[]; allowMultiple?: boolean } =
              JSON.parse(resultJsonString);
            if (parsed.question && Array.isArray(parsed.options)) {
              optionsPayload = {
                question: parsed.question,
                options: parsed.options,
                allowMultiple: parsed.allowMultiple ?? false,
              };
            }
          } catch {
            // ignore
          }
        }

        functionResponseParts.push({
          functionResponse: {
            name: fnName,
            response: { content: resultJsonString },
          },
        });
      }

      activeHistory.push({
        role: "tool",
        parts: functionResponseParts,
      });

      if (optionsPayload) {
        addTrace("researching");
        return {
          text: optionsPayload.question,
          history: activeHistory,
          traces,
          optionsPayload,
          emotion: "happy",
        };
      }

      continue;
    }

    addTrace("researching");

    const finalPart = modelContent.parts.find((p) => p.text);
    const textOutput = finalPart?.text || "No text output generated.";
    const { cleanText, emotion } = extractEmotion(textOutput);

    return {
      text: cleanText,
      history: activeHistory,
      traces,
      optionsPayload,
      emotion,
    };
  }

  addTrace("researching");
  const lastModelMsg = activeHistory.filter((m) => m.role === "model").pop();
  const lastText =
    lastModelMsg?.parts?.find((p) => p.text)?.text ||
    "Reached maximum tool execution loops.";
  const { cleanText, emotion } = extractEmotion(lastText);

  return {
    text: cleanText,
    history: activeHistory,
    traces,
    optionsPayload,
    emotion,
  };
}
