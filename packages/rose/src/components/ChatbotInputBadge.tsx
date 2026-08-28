"use client";

import React from "react";
import { FolderGit2, Code2, Briefcase, Award, Cpu, HelpCircle, GraduationCap, Bot, Wrench, X } from "lucide-react";

export interface SelectedBadge {
  id: string;
  category: string;
  title: string;
  token: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  project: <FolderGit2 size={13} />,
  skill: <Code2 size={13} />,
  experience: <Briefcase size={13} />,
  certificate: <Award size={13} />,
  architecture: <Cpu size={13} />,
  faq: <HelpCircle size={13} />,
  education: <GraduationCap size={13} />,
  specialist: <Bot size={13} />,
  tool: <Wrench size={13} />,
};

interface ChatbotInputBadgeProps {
  variant?: "main" | "compact";
  badge: SelectedBadge;
  onRemove: (id: string) => void;
}

export function ChatbotInputBadge({
  variant = "main",
  badge,
  onRemove,
}: ChatbotInputBadgeProps) {
  return (
    <div className={`chatbot-input-badge chatbot-input-badge--${variant}`}>
      <span className="chatbot-input-badge-icon">
        {ICON_MAP[badge.category.toLowerCase()] || <FolderGit2 size={13} />}
      </span>
      <span className="chatbot-input-badge-cat">{badge.category}</span>
      <span className="chatbot-input-badge-title">{badge.title}</span>
      <button
        type="button"
        className="chatbot-input-badge-remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(badge.id);
        }}
        aria-label={`Remove badge ${badge.title}`}
      >
        <X size={12} />
      </button>
    </div>
  );
}

export default ChatbotInputBadge;
