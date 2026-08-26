import { Tool } from "./index";

export const calculatorTool: Tool = {
  declaration: {
    name: "calculator",
    description:
      "Evaluate a mathematical expression. Supports basic arithmetic (+, -, *, /), exponents (**), parentheses, and common math functions (sqrt, abs, sin, cos, tan, log, ln, ceil, floor, round, pow, pi, e). Use this for any math computation the user requests.",
    parameters: {
      type: "OBJECT",
      properties: {
        expression: {
          type: "STRING",
          description:
            "The mathematical expression to evaluate, e.g. '(2 + 3) * 4' or 'sqrt(144) + sin(pi/2)'",
        },
      },
      required: ["expression"],
    },
  },
  execute: async (args: Record<string, unknown>) => {
    try {
      const expr = args.expression as string;
      if (!expr) {
        return JSON.stringify({ error: "expression is required" });
      }

      const sanitized = expr.replace(/\s+/g, "");

      if (/[^0-9+\-*/().,%^a-z]/i.test(sanitized)) {
        return JSON.stringify({ error: "Expression contains invalid characters" });
      }

      let processed = sanitized;

      const fnMap: Record<string, (x: number) => number> = {
        sqrt: Math.sqrt,
        abs: Math.abs,
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        log: Math.log10,
        ln: Math.log,
        ceil: Math.ceil,
        floor: Math.floor,
        round: Math.round,
      };

      const constants: Record<string, number> = {
        pi: Math.PI,
        e: Math.E,
      };

      for (const [name, value] of Object.entries(constants)) {
        processed = processed.replace(new RegExp(`\\b${name}\\b`, "gi"), String(value));
      }

      for (const [name, fn] of Object.entries(fnMap)) {
        const regex = new RegExp(`${name}\\(([^)]+)\\)`, "gi");
        processed = processed.replace(regex, (_match: string, inner: string) => {
          try {
            const val = new Function(`"use strict"; return (${inner})`)() as number;
            return String(fn(Number(val)));
          } catch {
            return "NaN";
          }
        });
      }

      const result = new Function(`"use strict"; return (${processed})`)() as number;

      if (typeof result !== "number" || !Number.isFinite(result)) {
        return JSON.stringify({
          expression: expr,
          result: String(result),
          error: "Result is not a finite number",
        });
      }

      const rounded = Math.round(result * 1e12) / 1e12;

      return JSON.stringify({
        expression: expr,
        result: rounded,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to evaluate expression";
      return JSON.stringify({
        expression: args.expression,
        error: message,
      });
    }
  },
};
