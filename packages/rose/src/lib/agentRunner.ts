import { callGemini } from "./geminiClient";
import { TOOLS, Tool, getToolByName } from "./tools";
import { ROSE_EMOTIONS, extractEmotion } from "./roseEmotions";
import { Specialist, invokeSpecialist } from "./specialists";
import { formatErrorMessage } from "./errorFormatter";

export { ROSE_EMOTIONS, extractEmotion };

export const DEFAULT_TOOL_LABEL_MAP: Record<string, string> = {
  webSearch: "searching the web",
  calculator: "calculating",
  codeAnalyzer: "analyzing code",
  askQuestion: "asking interactive question",
  delegateToSpecialist: "consulting specialist",
};

export const DEFAULT_AGENT_SYSTEM_INSTRUCTION = `You are "Rose", an intelligent, articulate, and friendly AI companion and assistant.
Your goals:
1. Help users answer questions, solve problems, analyze code, and search for up-to-date information.
2. Engage thoughtfully and deliver clear, well-structured, visually appealing responses.

Capabilities & Tools:
- 'webSearch': Search the web for up-to-date facts, documentation, or news.
- 'calculator': Evaluate mathematical and numerical formulas accurately.
- 'codeAnalyzer': Inspect, debug, refactor, and explain code snippets.
- 'askQuestion': MANDATORY — you MUST use this tool whenever you want to present a list of options, choices, or interactive follow-up questions to the user. This renders clickable option buttons in the chat interface so the user can answer with one click.
- 'delegateToSpecialist': Delegate domain-specific tasks to registered specialist sub-agents.

- When an entity reference badge is present in the user prompt (e.g. @tool:"...", @specialist:"...", @topic:"..."), reference that entity directly and respond accordingly.

Execution & Response Rules:
- You may call multiple tools in a single response whenever needed.
- Tool outputs are concise data payloads for processing; tools execute automatically in the background.
- After all tools finish, compile a final, polished response.

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
- Output raw Markdown directly (headings, lists, bold text, inline code).
- Use GFM markdown tables (\`| col | col |\`) for tabular data.
- Use GitHub-style callouts (\`> [!NOTE]\`, \`> [!TIP]\`, \`> [!IMPORTANT]\`, \`> [!WARNING]\`, \`> [!CAUTION]\`) for structured callouts.`;

export interface ChatMessage {
  role: "user" | "model" | "tool";
  parts: Array<{
    text?: string;
    functionCall?: {
      name: string;
      args: any;
    };
    functionResponse?: {
      name: string;
      response: any;
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
  variant?: "default" | "error" | "warning";
}

export interface AgentChatOptions {
  systemInstruction?: string;
  tools?: Tool[];
  specialists?: Record<string, Specialist>;
  toolLabelMap?: Record<string, string>;
  onTrace?: (trace: string) => void;
  maxLoops?: number;
}

export async function runAgentChat(
  history: ChatMessage[],
  newMessageText: string,
  options?: AgentChatOptions
): Promise<RunAgentResult> {
  const traces: string[] = [];

  const addTrace = (label: string) => {
    traces.push(label);
    options?.onTrace?.(label);
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

  const activeTools = options?.tools || TOOLS;
  const systemInstruction = options?.systemInstruction || DEFAULT_AGENT_SYSTEM_INSTRUCTION;
  const toolLabelMap = { ...DEFAULT_TOOL_LABEL_MAP, ...(options?.toolLabelMap || {}) };
  const customSpecialists = options?.specialists;

  const toolDeclarations = activeTools.map((t) => t.declaration);

  let loopCount = 0;
  const maxLoops = options?.maxLoops ?? 10;

  try {
    while (loopCount < maxLoops) {
      loopCount++;

      let responseJson: any;
      try {
        responseJson = await callGemini(
          systemInstruction,
          activeHistory,
          toolDeclarations
        );
      } catch (geminiErr: any) {
        addTrace("researching");
        const formattedErr = formatErrorMessage(geminiErr);
        const { cleanText, emotion } = extractEmotion(formattedErr);
        return {
          text: cleanText,
          history: activeHistory,
          traces,
          emotion: emotion || "sad",
          variant: "error",
        };
      }

      if (!responseJson) {
        addTrace("researching");
        const formattedErr = formatErrorMessage(
          "The AI assistant is not configured. Please verify your GEMINI_API_KEY environment variable.",
          "Check your .env.local configuration file and ensure a valid Gemini API key is provided."
        );
        const { cleanText, emotion } = extractEmotion(formattedErr);
        return {
          text: cleanText,
          history: activeHistory,
          traces,
          emotion: emotion || "sad",
          variant: "error",
        };
      }

      const candidate = responseJson.candidates?.[0];
      if (!candidate) {
        addTrace("researching");
        const blockReason = responseJson.promptFeedback?.blockReason;
        const fallbackText = blockReason
          ? formatErrorMessage(
              `Response blocked by content filter: ${blockReason}`,
              "Please try rephrasing your message to adhere to standard content guidelines."
            )
          : formatErrorMessage(
              "No response was returned from the AI model.",
              "Please check your network connection and try again in a few moments."
            );
        const { cleanText, emotion } = extractEmotion(fallbackText);
        return {
          text: cleanText,
          history: activeHistory,
          traces,
          emotion: emotion || "confused",
          variant: "error",
        };
      }

      const modelContent = candidate.content;
      if (!modelContent || !modelContent.parts || modelContent.parts.length === 0) {
        addTrace("researching");
        const finishReason = candidate.finishReason;
        let errMsg = "AI was unable to complete the generation.";
        let errSuggestion = "Please try again.";
        if (finishReason === "SAFETY") {
          errMsg = "Response was halted due to a safety constraint.";
          errSuggestion = "Consider rephrasing the question.";
        } else if (finishReason === "MAX_TOKENS") {
          errMsg = "Response exceeded maximum output token limits.";
          errSuggestion = "Try asking a more specific, concise question.";
        }
        const formattedErr = formatErrorMessage(errMsg, errSuggestion);
        const { cleanText, emotion } = extractEmotion(formattedErr);
        return {
          text: cleanText,
          history: activeHistory,
          traces,
          emotion: emotion || "confused",
          variant: "error",
        };
      }

      const modelMessage: ChatMessage = {
        role: "model",
        parts: modelContent.parts,
      };
      activeHistory.push(modelMessage);

      const toolCallParts = modelContent.parts.filter((p: any) => p.functionCall);

      if (toolCallParts.length > 0) {
        addTrace("coding");
        const functionResponseParts: any[] = [];

        for (const part of toolCallParts) {
          const fnName = part.functionCall.name;
          const fnArgs = part.functionCall.args || {};

          let traceLabel = toolLabelMap[fnName] || `calling ${fnName}`;
          if (fnName === "delegateToSpecialist" && fnArgs.specialist) {
            traceLabel = `consulting specialist (${fnArgs.specialist})`;
          }

          addTrace(traceLabel);

          let resultJsonString: string;

          if (fnName === "delegateToSpecialist" && customSpecialists) {
            try {
              const answer = await invokeSpecialist(fnArgs.specialist, fnArgs.query, customSpecialists);
              resultJsonString = JSON.stringify({ specialist: fnArgs.specialist, response: answer });
            } catch (err: any) {
              resultJsonString = JSON.stringify({ error: err?.message || "Specialist execution failed" });
            }
          } else {
            const toolObj = getToolByName(fnName, activeTools);
            if (toolObj) {
              try {
                resultJsonString = await toolObj.execute(fnArgs);
              } catch (err: any) {
                resultJsonString = JSON.stringify({ error: err?.message || "Tool execution failed" });
              }
            } else {
              resultJsonString = JSON.stringify({ error: `Tool '${fnName}' is not registered` });
            }
          }

          if (fnName === "askQuestion") {
            try {
              const parsed = JSON.parse(resultJsonString);
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
          role: "user",
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
            variant: "default",
          };
        }

        continue;
      }

      addTrace("researching");

      const finalPart = modelContent.parts.find((p: any) => p.text);
      const textOutput = finalPart?.text || "No text output generated.";
      const { cleanText, emotion } = extractEmotion(textOutput);

      return {
        text: cleanText,
        history: activeHistory,
        traces,
        optionsPayload,
        emotion,
        variant: "default",
      };
    }

    addTrace("researching");
    const lastModelMsg = activeHistory.filter((m) => m.role === "model").pop();
    const lastText =
      lastModelMsg?.parts?.find((p: any) => p.text)?.text ||
      "Reached maximum tool execution loops.";
    const { cleanText, emotion } = extractEmotion(lastText);

    return {
      text: cleanText,
      history: activeHistory,
      traces,
      optionsPayload,
      emotion,
      variant: "default",
    };
  } catch (err: any) {
    addTrace("researching");
    const formattedErr = formatErrorMessage(err);
    const { cleanText, emotion } = extractEmotion(formattedErr);
    return {
      text: cleanText,
      history: activeHistory,
      traces,
      emotion: emotion || "sad",
      variant: "error",
    };
  }
}

export function createAgentRunner(defaultOptions: AgentChatOptions) {
  return (
    history: ChatMessage[],
    newMessageText: string,
    overrideOptions?: AgentChatOptions
  ) => {
    const mergedOptions: AgentChatOptions = {
      systemInstruction: overrideOptions?.systemInstruction || defaultOptions.systemInstruction,
      tools: overrideOptions?.tools || defaultOptions.tools,
      specialists: { ...(defaultOptions.specialists || {}), ...(overrideOptions?.specialists || {}) },
      toolLabelMap: { ...(defaultOptions.toolLabelMap || {}), ...(overrideOptions?.toolLabelMap || {}) },
      onTrace: overrideOptions?.onTrace || defaultOptions.onTrace,
      maxLoops: overrideOptions?.maxLoops || defaultOptions.maxLoops,
    };
    return runAgentChat(history, newMessageText, mergedOptions);
  };
}
