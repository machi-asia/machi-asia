"use client";

import React, { ReactNode } from "react";
import { Globe, Code2, Calculator, HelpCircle, Terminal, ChevronRight, MessageSquareQuote } from "lucide-react";

export interface StarterItem {
  title: string;
  query: string;
  description: string;
  badge: string;
  icon: ReactNode;
}

export interface ReferenceBadge {
  category: string;
  title: string;
  token: string;
}

export interface QuickCommand {
  cmd: string;
  desc: string;
  badge: ReferenceBadge;
}

export const DEFAULT_STARTERS: StarterItem[] = [
  {
    title: "Search the Web",
    query: "Search the web for the latest developments in AI and technology",
    description: "Query real-time facts and current documentation using web search.",
    badge: "WEB",
    icon: <Globe size={16} />,
  },
  {
    title: "Code & Refactoring",
    query: "Help me write and analyze a clean TypeScript function",
    description: "Inspect code patterns, debug issues, and discuss architecture.",
    badge: "CODE",
    icon: <Code2 size={16} />,
  },
  {
    title: "Calculations & Math",
    query: "Calculate compound interest for $10,000 at 7% over 10 years",
    description: "Evaluate complex mathematical and numerical expressions.",
    badge: "CALC",
    icon: <Calculator size={16} />,
  },
  {
    title: "Interactive Options",
    query: "Ask me a question with a choice of options to pick from",
    description: "Trigger interactive clickable buttons in the chat UI.",
    badge: "CHOICES",
    icon: <MessageSquareQuote size={16} />,
  },
  {
    title: "What Can You Do?",
    query: "What tools and capabilities do you have access to?",
    description: "Discover all available tools and sub-agent specialists.",
    badge: "HELP",
    icon: <HelpCircle size={16} />,
  },
];

export const DEFAULT_BADGES: ReferenceBadge[] = [
  { category: "tool", title: "Web Search", token: '@tool:"webSearch"' },
  { category: "tool", title: "Code Analyzer", token: '@tool:"codeAnalyzer"' },
  { category: "tool", title: "Calculator", token: '@tool:"calculator"' },
];

export const DEFAULT_QUICK_COMMANDS: QuickCommand[] = [
  {
    cmd: "/web",
    desc: "Search the web for live answers",
    badge: { category: "tool", title: "Web Search", token: '@tool:"webSearch"' },
  },
  {
    cmd: "/code",
    desc: "Analyze and explain code snippets",
    badge: { category: "tool", title: "Code Analyzer", token: '@tool:"codeAnalyzer"' },
  },
  {
    cmd: "/calc",
    desc: "Calculate formulas and numbers",
    badge: { category: "tool", title: "Calculator", token: '@tool:"calculator"' },
  },
];

interface ChatbotWelcomeProps {
  variant?: "main" | "compact";
  title?: string;
  subtitle?: string;
  starters?: StarterItem[];
  badges?: ReferenceBadge[];
  quickCommands?: QuickCommand[];
  avatarUrl?: string;
  onSelectStarter: (query: string) => void;
  onSelectBadge: (badge: ReferenceBadge) => void;
}

export function ChatbotWelcome({
  variant = "main",
  title = "Rose — AI Assistant & Companion",
  subtitle = "Ask anything, search the web, analyze code, evaluate calculations, or consult specialists.",
  starters = DEFAULT_STARTERS,
  badges = DEFAULT_BADGES,
  quickCommands = DEFAULT_QUICK_COMMANDS,
  avatarUrl = "/rose/happy.png",
  onSelectStarter,
  onSelectBadge,
}: ChatbotWelcomeProps) {
  return (
    <div className={`chatbot-welcome-wrapper chatbot-welcome-wrapper--${variant}`}>
      <div className="chatbot-welcome-header">
        <div className="chatbot-welcome-avatar-container">
          <img
            src={avatarUrl}
            alt="Rose"
            className="chatbot-welcome-avatar-img"
          />
        </div>
        <h3 className="chatbot-welcome-title">{title}</h3>
        <p className="chatbot-welcome-subtitle">{subtitle}</p>
        {badges.length > 0 && (
          <div className="chatbot-welcome-badges">
            {badges.map((b, idx) => (
              <span
                key={idx}
                className="chatbot-welcome-badge"
                onClick={() => onSelectBadge(b)}
              >
                {b.token.startsWith("@") ? b.token : `@${b.category}`}
              </span>
            ))}
          </div>
        )}
      </div>

      {starters.length > 0 && (
        <div className="chatbot-starters-grid">
          {starters.map((s) => (
            <button
              key={s.title}
              className="chatbot-starter-card"
              onClick={() => onSelectStarter(s.query)}
            >
              <div className="chatbot-starter-card-header">
                <span className="chatbot-starter-icon">{s.icon}</span>
                <span className="chatbot-starter-badge">{s.badge}</span>
              </div>
              <h5 className="chatbot-starter-title">{s.title}</h5>
              <p className="chatbot-starter-desc">{s.description}</p>
            </button>
          ))}
        </div>
      )}

      {quickCommands.length > 0 && (
        <div className="chatbot-welcome-footer">
          <div className="chatbot-footer-header">
            <Terminal size={14} className="chatbot-footer-icon" />
            <span className="chatbot-footer-title">QUICK COMMANDS</span>
          </div>
          <div className="chatbot-footer-list">
            {quickCommands.map((item) => (
              <div
                key={item.cmd}
                className="chatbot-footer-row"
                onClick={() => onSelectBadge(item.badge)}
              >
                <div className="chatbot-footer-row-left">
                  <code className="chatbot-footer-code">{item.cmd}</code>
                  <span className="chatbot-footer-desc">{item.desc}</span>
                </div>
                <ChevronRight size={13} className="chatbot-footer-arrow" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatbotWelcome;
