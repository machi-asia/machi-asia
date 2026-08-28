export interface Tool {
  declaration: {
    name: string;
    description: string;
    parameters?: {
      type: "OBJECT" | "STRING" | "NUMBER" | "BOOLEAN" | "ARRAY";
      properties: { [key: string]: any };
      required?: string[];
    };
  };
  execute: (args: any) => Promise<string>;
}

import { askQuestionTool } from "./askQuestion";
import { calculatorTool } from "./calculator";
import { codeAnalyzerTool } from "./codeAnalyzer";
import { webSearchTool } from "./webSearch";
import { delegateToSpecialistTool } from "./specialist";

export { askQuestionTool, calculatorTool, codeAnalyzerTool, webSearchTool, delegateToSpecialistTool };

export const DEFAULT_TOOLS: Tool[] = [
  webSearchTool,
  calculatorTool,
  codeAnalyzerTool,
  askQuestionTool,
  delegateToSpecialistTool,
];

export const TOOLS: Tool[] = [...DEFAULT_TOOLS];

export function createTool(tool: Tool): Tool {
  registerTool(tool);
  return tool;
}

export function registerTool(tool: Tool): void {
  const existingIdx = TOOLS.findIndex((t) => t.declaration.name === tool.declaration.name);
  if (existingIdx >= 0) {
    TOOLS[existingIdx] = tool;
  } else {
    TOOLS.push(tool);
  }
}

export function getToolByName(name: string, customTools?: Tool[]): Tool | undefined {
  if (customTools) {
    const found = customTools.find((tool) => tool.declaration.name === name);
    if (found) return found;
  }
  return TOOLS.find((tool) => tool.declaration.name === name);
}
