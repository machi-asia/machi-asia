import { TOOLS } from "./tools";
import { SPECIALISTS } from "./specialists";

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  termBadge: string;
  promptText: string;
}

export interface CommandCategory {
  command: string;
  label: string;
  description: string;
  icon: string;
  items: CommandItem[];
}

export function createCommandItem(config: {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  termBadge?: string;
  promptText?: string;
}): CommandItem {
  const badge = config.termBadge || `@${config.category}:"${config.title}"`;
  return {
    id: config.id,
    title: config.title,
    subtitle: config.subtitle,
    category: config.category,
    termBadge: badge,
    promptText: config.promptText || badge,
  };
}

export function createCommandCategory(config: {
  command: string;
  label: string;
  description: string;
  icon?: string;
  items?: CommandItem[];
}): CommandCategory {
  return {
    command: config.command.startsWith("/") ? config.command : `/${config.command}`,
    label: config.label,
    description: config.description,
    icon: config.icon || "Code2",
    items: config.items || [],
  };
}

export const DEFAULT_COMMAND_CATEGORIES: CommandCategory[] = [
  {
    command: "/web",
    label: "Web Search",
    description: "Search the web for up-to-date information",
    icon: "Globe",
    items: [
      {
        id: "web-search-general",
        title: "Search the Web",
        subtitle: "Query live web results via Gemini Google Search",
        category: "web",
        termBadge: `@tool:"webSearch"`,
        promptText: `@tool:"webSearch"`,
      },
    ],
  },
  {
    command: "/code",
    label: "Code Analyzer",
    description: "Analyze, refactor, or explain code snippets",
    icon: "Code2",
    items: [
      {
        id: "tool-code-analyzer",
        title: "Analyze Code",
        subtitle: "Inspect code quality, bugs, and performance",
        category: "tool",
        termBadge: `@tool:"codeAnalyzer"`,
        promptText: `@tool:"codeAnalyzer"`,
      },
    ],
  },
  {
    command: "/calc",
    label: "Calculator",
    description: "Evaluate math and numerical expressions",
    icon: "Calculator",
    items: [
      {
        id: "tool-calc",
        title: "Calculate Expression",
        subtitle: "Compute arithmetic and algebraic formulas",
        category: "tool",
        termBadge: `@tool:"calculator"`,
        promptText: `@tool:"calculator"`,
      },
    ],
  },
  {
    command: "/specialist",
    label: "Agent Specialists",
    description: "Consult registered sub-agents for domain-specific tasks",
    icon: "Bot",
    items: Object.keys(SPECIALISTS).map((key) => {
      const spec = SPECIALISTS[key];
      return {
        id: `spec-${key}`,
        title: spec.name,
        subtitle: spec.description,
        category: "specialist",
        termBadge: `@specialist:"${spec.name}"`,
        promptText: `@specialist:"${spec.name}"`,
      };
    }),
  },
  {
    command: "/tool",
    label: "Agent Tools",
    description: "Capabilities and tools available to Rose",
    icon: "Wrench",
    items: TOOLS.map((tool) => ({
      id: `tool-${tool.declaration.name}`,
      title: tool.declaration.name,
      subtitle: tool.declaration.description,
      category: "tool",
      termBadge: `@tool:"${tool.declaration.name}"`,
      promptText: `@tool:"${tool.declaration.name}"`,
    })),
  },
];

export function getAgentCommandCategories(customCategories?: CommandCategory[]): CommandCategory[] {
  if (!customCategories || customCategories.length === 0) {
    return DEFAULT_COMMAND_CATEGORIES;
  }

  const map = new Map<string, CommandCategory>();
  for (const cat of DEFAULT_COMMAND_CATEGORIES) {
    map.set(cat.command.toLowerCase(), cat);
  }
  for (const cat of customCategories) {
    map.set(cat.command.toLowerCase(), cat);
  }
  return Array.from(map.values());
}
