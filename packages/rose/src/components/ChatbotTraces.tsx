"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ChatbotTracesProps {
  variant?: "main" | "compact";
  traces: string[];
  defaultExpanded?: boolean;
  photoUrl?: string;
}

export function ChatbotTraces({
  variant = "main",
  traces,
  defaultExpanded = true,
  photoUrl = "/rose/thinking.png",
}: ChatbotTracesProps) {
  const [showTraces, setShowTraces] = useState(defaultExpanded);

  if (traces.length === 0) return null;

  return (
    <div className={`chatbot-traces chatbot-traces--${variant}`}>
      <button
        type="button"
        className="chatbot-traces-toggle"
        onClick={() => setShowTraces((v) => !v)}
      >
        {showTraces ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        AI reasoning steps ({traces.length})
      </button>
      {showTraces && (
        <div className="chatbot-traces-list">
          {photoUrl && (
            <div className="chatbot-thinking-photo-wrapper">
              <img
                src={photoUrl}
                alt="Rose Thinking"
                className="chatbot-thinking-photo"
              />
            </div>
          )}
          {traces.map((trace, i) => (
            <div
              key={i}
              className={`chatbot-trace-item${
                i === traces.length - 1 ? " trace-done" : ""
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="chatbot-trace-dot" />
              {trace}...
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChatbotTraces;
