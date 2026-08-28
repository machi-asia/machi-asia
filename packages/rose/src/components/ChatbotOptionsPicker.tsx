"use client";

import React, { useState } from "react";
import { Check, ChevronRight } from "lucide-react";

export interface OptionsPayload {
  question: string;
  options: string[];
  allowMultiple?: boolean;
}

interface ChatbotOptionsPickerProps {
  payload: OptionsPayload;
  onSelectOption: (selectedText: string) => void;
  disabled?: boolean;
}

export function ChatbotOptionsPicker({
  payload,
  onSelectOption,
  disabled = false,
}: ChatbotOptionsPickerProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const allowMultiple = Boolean(payload.allowMultiple);

  const handleOptionClick = (option: string) => {
    if (disabled) return;

    if (!allowMultiple) {
      onSelectOption(option);
      return;
    }

    setSelectedItems((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
    );
  };

  const handleMultipleSubmit = () => {
    if (disabled || selectedItems.length === 0) return;
    onSelectOption(selectedItems.join(", "));
  };

  return (
    <div className="chatbot-options-container">
      <div className="chatbot-options-list">
        {payload.options.map((option, idx) => {
          const isSelected = selectedItems.includes(option);
          return (
            <button
              key={idx}
              type="button"
              className={`chatbot-option-pill ${isSelected ? "selected" : ""}`}
              onClick={() => handleOptionClick(option)}
              disabled={disabled}
            >
              {allowMultiple && (
                <span className="chatbot-option-checkbox">
                  {isSelected && <Check size={11} />}
                </span>
              )}
              <span className="chatbot-option-text">{option}</span>
              {!allowMultiple && <ChevronRight size={13} className="chatbot-option-arrow" />}
            </button>
          );
        })}
      </div>

      {allowMultiple && selectedItems.length > 0 && (
        <button
          type="button"
          className="chatbot-options-submit-btn"
          onClick={handleMultipleSubmit}
          disabled={disabled}
        >
          Submit Selection ({selectedItems.length})
        </button>
      )}
    </div>
  );
}

export default ChatbotOptionsPicker;
