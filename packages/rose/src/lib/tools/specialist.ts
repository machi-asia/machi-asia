import { type Tool } from "./index";
import { invokeSpecialist, SPECIALISTS } from "../specialists";

export interface DelegateToSpecialistArgs {
  specialist: string;
  query: string;
}

export const delegateToSpecialistTool: Tool = {
  declaration: {
    name: "delegateToSpecialist",
    description:
      "Consult a registered domain-specialist sub-agent for complex domain-specific tasks. Provide the specialist name and your query.",
    parameters: {
      type: "OBJECT",
      properties: {
        specialist: {
          type: "STRING",
          description: "The name of the specialist sub-agent to consult.",
        },
        query: {
          type: "STRING",
          description: "The specific query, task, or question for the specialist to address.",
        },
      },
      required: ["specialist", "query"],
    },
  },
  execute: async (args: DelegateToSpecialistArgs) => {
    try {
      const { specialist, query } = args;
      if (!specialist || !query) {
        return JSON.stringify({ error: "Both 'specialist' and 'query' arguments are required." });
      }
      const answer = await invokeSpecialist(specialist, query);
      return JSON.stringify({ specialist, response: answer });
    } catch (err: any) {
      return JSON.stringify({ error: `Specialist delegation failed: ${err?.message || err}` });
    }
  },
};
