import { callGemini } from "../geminiClient";

export interface Specialist {
  name: string;
  description: string;
  systemInstruction?: string;
  run?: (query: string) => Promise<string>;
}

export const SPECIALISTS: Record<string, Specialist> = {};

export function registerSpecialist(specialist: Specialist): void {
  SPECIALISTS[specialist.name] = specialist;
}

export function createSpecialist(config: {
  name: string;
  description: string;
  systemInstruction: string;
}): Specialist {
  const specialist: Specialist = {
    name: config.name,
    description: config.description,
    systemInstruction: config.systemInstruction,
    run: async (query: string): Promise<string> => {
      const contents = [
        {
          role: "user" as const,
          parts: [{ text: query }],
        },
      ];

      try {
        const responseJson = await callGemini(config.systemInstruction, contents);
        const textResult = responseJson?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResult) {
          return `Specialist ${config.name} did not produce a response.`;
        }
        return textResult;
      } catch (error: any) {
        return `Error invoking ${config.name}: ${error?.message || error}`;
      }
    },
  };

  registerSpecialist(specialist);
  return specialist;
}

export async function invokeSpecialist(
  name: string,
  query: string,
  customSpecialists?: Record<string, Specialist>
): Promise<string> {
  const registry = { ...SPECIALISTS, ...(customSpecialists || {}) };
  const specialist = registry[name];
  if (!specialist) {
    const available = Object.keys(registry);
    return available.length > 0
      ? `Specialist '${name}' not found. Available specialists: ${available.join(", ")}`
      : `No specialists are currently registered. You can register custom specialists using createSpecialist({ name, description, systemInstruction }).`;
  }

  if (specialist.run) {
    return await specialist.run(query);
  }

  if (specialist.systemInstruction) {
    try {
      const responseJson = await callGemini(specialist.systemInstruction, [
        { role: "user", parts: [{ text: query }] },
      ]);
      return responseJson?.candidates?.[0]?.content?.parts?.[0]?.text || "No response produced.";
    } catch (err: any) {
      return `Specialist execution error: ${err?.message || err}`;
    }
  }

  return `Specialist '${name}' has neither a run handler nor a systemInstruction defined.`;
}
