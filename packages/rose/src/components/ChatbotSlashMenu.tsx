"use client";

import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { FolderGit2, Code2, Briefcase, Award, Cpu, HelpCircle, GraduationCap, Bot, Wrench, ChevronRight } from "lucide-react";
import type { CommandCategory, CommandItem } from "../lib/commandRegistry";
import { extractSlashQuery } from "../lib/markdownFormatter";

export interface ChatbotSlashMenuHandle {
  moveNext: () => void;
  movePrev: () => void;
  selectCurrent: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  FolderGit2: <FolderGit2 size={15} />,
  Code2: <Code2 size={15} />,
  Briefcase: <Briefcase size={15} />,
  Award: <Award size={15} />,
  Cpu: <Cpu size={15} />,
  HelpCircle: <HelpCircle size={15} />,
  GraduationCap: <GraduationCap size={15} />,
  Bot: <Bot size={15} />,
  Wrench: <Wrench size={15} />,
};

interface ChatbotSlashMenuProps {
  variant?: "main" | "compact";
  categories: CommandCategory[];
  inputValue: string;
  onSelectCategory: (category: CommandCategory) => void;
  onSelectItem: (item: CommandItem) => void;
}

export const ChatbotSlashMenu = forwardRef<ChatbotSlashMenuHandle, ChatbotSlashMenuProps>(
  (
    {
      variant = "main",
      categories,
      inputValue,
      onSelectCategory,
      onSelectItem,
    },
    ref
  ) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const { matchedCategory, searchFilter } = useMemo(() => {
      const slashQuery = extractSlashQuery(inputValue) || inputValue;
      const trimmed = slashQuery.trim();
      const parts = trimmed.split(/\s+/);
      const firstWord = parts[0]?.toLowerCase() || "";

      const foundCategory = categories.find(
        (c) => c.command.toLowerCase() === firstWord
      );

      if (foundCategory) {
        const search = parts.slice(1).join(" ").toLowerCase();
        return { matchedCategory: foundCategory, searchFilter: search };
      }

      return { matchedCategory: null, searchFilter: trimmed.slice(1).toLowerCase() };
    }, [inputValue, categories]);

    const filteredCategories = useMemo(() => {
      if (matchedCategory) return [];
      if (!searchFilter) return categories;
      return categories.filter(
        (cat) =>
          cat.command.toLowerCase().includes(searchFilter) ||
          cat.label.toLowerCase().includes(searchFilter) ||
          cat.description.toLowerCase().includes(searchFilter)
      );
    }, [matchedCategory, categories, searchFilter]);

    const filteredItems = useMemo(() => {
      if (!matchedCategory) return [];
      if (!searchFilter) return matchedCategory.items;
      return matchedCategory.items.filter(
        (item) =>
          item.title.toLowerCase().includes(searchFilter) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(searchFilter))
      );
    }, [matchedCategory, searchFilter]);

    useEffect(() => {
      setSelectedIndex(0);
    }, [inputValue, matchedCategory]);

    useImperativeHandle(ref, () => ({
      moveNext: () => {
        const total = matchedCategory ? filteredItems.length : filteredCategories.length;
        if (total > 0) setSelectedIndex((prev) => (prev + 1) % total);
      },
      movePrev: () => {
        const total = matchedCategory ? filteredItems.length : filteredCategories.length;
        if (total > 0) setSelectedIndex((prev) => (prev - 1 + total) % total);
      },
      selectCurrent: () => {
        if (!matchedCategory) {
          const selectedCat = filteredCategories[selectedIndex];
          if (selectedCat) onSelectCategory(selectedCat);
        } else {
          const selectedItem = filteredItems[selectedIndex];
          if (selectedItem) onSelectItem(selectedItem);
        }
      },
    }));

    return (
      <div className={`chatbot-slash-menu chatbot-slash-menu--${variant}`}>
        <div className="chatbot-slash-header">
          <span className="chatbot-slash-badge">/ Slash Commands</span>
          {matchedCategory && (
            <span className="chatbot-slash-sub-badge">{matchedCategory.label}</span>
          )}
        </div>

        <div className="chatbot-slash-list">
          {!matchedCategory &&
            filteredCategories.map((cat, idx) => (
              <button
                key={cat.command}
                type="button"
                className={`chatbot-slash-item ${idx === selectedIndex ? "active" : ""}`}
                onClick={() => onSelectCategory(cat)}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="chatbot-slash-icon">
                  {ICON_MAP[cat.icon] || <Code2 size={15} />}
                </div>
                <div className="chatbot-slash-info">
                  <span className="chatbot-slash-cmd">{cat.command}</span>
                  <span className="chatbot-slash-desc">{cat.description}</span>
                </div>
                <ChevronRight size={13} className="chatbot-slash-arrow" />
              </button>
            ))}

          {matchedCategory &&
            filteredItems.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                className={`chatbot-slash-item ${idx === selectedIndex ? "active" : ""}`}
                onClick={() => onSelectItem(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="chatbot-slash-info">
                  <span className="chatbot-slash-title">{item.title}</span>
                  {item.subtitle && <span className="chatbot-slash-subtitle">{item.subtitle}</span>}
                </div>
              </button>
            ))}

          {!matchedCategory && filteredCategories.length === 0 && (
            <div className="chatbot-slash-empty">No matching commands found</div>
          )}

          {matchedCategory && filteredItems.length === 0 && (
            <div className="chatbot-slash-empty">No items found for {matchedCategory.command}</div>
          )}
        </div>
      </div>
    );
  }
);

ChatbotSlashMenu.displayName = "ChatbotSlashMenu";

export default ChatbotSlashMenu;
