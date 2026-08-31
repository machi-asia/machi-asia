import { Tool, ToolContext } from "./index";
import { addMemory } from "../memoryStore";

export interface TakeNotesArgs {
  content?: string;
  note?: string;
  notes?: string;
  text?: string;
  fact?: string;
  memory?: string;
  information?: string;
  details?: string;
  category?: "preference" | "fact" | "project" | "instruction" | "profile" | "general" | string;
  importance?: number;
  [key: string]: any;
}

export const takeNotesTool: Tool = {
  declaration: {
    name: "takeNotes",
    description:
      "Save an important fact, user preference, detail, constraint, project info, or instruction to your permanent long-term memory. Use this whenever the user shares information that should persist across different conversations (such as their name, key preferences, project details, personal background, habits, or explicit requests to remember something).",
    parameters: {
      type: "OBJECT",
      properties: {
        content: {
          type: "STRING",
          description:
            "The clear, concise, self-contained fact, preference, or note to remember about the user or project.",
        },
        category: {
          type: "STRING",
          description:
            "The category of the memory: 'preference', 'fact', 'project', 'instruction', 'profile', or 'general'. Default is 'general'.",
        },
        importance: {
          type: "NUMBER",
          description:
            "Importance level (1 = normal detail, 3 = important preference/habit, 5 = critical identity/instruction). Default is 3.",
        },
      },
      required: ["content"],
    },
  },
  execute: async (args: TakeNotesArgs, context?: ToolContext): Promise<string> => {
    try {
      const rawContent =
        args.content ||
        args.note ||
        args.notes ||
        args.text ||
        args.fact ||
        args.memory ||
        args.information ||
        args.details ||
        "";

      const content = String(rawContent).trim();
      if (!content) {
        return JSON.stringify({ error: "Missing content to remember." });
      }

      const rawCategory = args.category || "general";
      const category = String(rawCategory).toLowerCase();
      const rawImportance = Number(args.importance);
      const importance = Number.isFinite(rawImportance) && rawImportance >= 1 && rawImportance <= 5
        ? rawImportance
        : 3;

      const userId = context?.userId || args.userId;
      if (!userId) {
        return JSON.stringify({
          success: true,
          content,
          category,
          importance,
          note: "Memory noted in conversation context.",
        });
      }

      const saved = await addMemory(userId, {
        content,
        category,
        importance,
      });

      if (!saved) {
        return JSON.stringify({
          success: false,
          error: "Could not persist memory to database.",
        });
      }

      return JSON.stringify({
        success: true,
        message: `Successfully saved to long-term memory: "${content}"`,
        memoryId: saved.id,
        category: saved.category,
        importance: saved.importance,
      });
    } catch (err: unknown) {
      console.error("[rose] takeNotesTool execution error:", err);
      return JSON.stringify({
        error: err instanceof Error ? err.message : "Failed to record note.",
      });
    }
  },
};
