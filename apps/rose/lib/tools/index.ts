export interface Tool {
  declaration: {
    name: string;
    description: string;
    parameters?: {
      type: "OBJECT" | "STRING" | "NUMBER" | "BOOLEAN" | "ARRAY";
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
  execute: (args: Record<string, unknown>) => Promise<string>;
}

import { askQuestionTool } from "./askQuestion";
import { webSearchTool } from "./webSearch";
import { calculatorTool } from "./calculator";
import { codeAnalyzerTool } from "./codeAnalyzer";

export const TOOLS: Tool[] = [
  askQuestionTool,
  webSearchTool,
  calculatorTool,
  codeAnalyzerTool,
];

export function getToolByName(name: string): Tool | undefined {
  return TOOLS.find((tool) => tool.declaration.name === name);
}
