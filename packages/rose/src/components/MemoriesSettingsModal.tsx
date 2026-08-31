"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  RoseMemory,
  fetchMemoriesClient,
  createMemoryClient,
  updateMemoryClient,
  deleteMemoryClient,
} from "../lib/memoryStore";

export interface MemoriesSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string;
  /**
   * @deprecated Prefer `apiBasePath`. Kept for backward compatibility: if both
   * are provided, `apiBasePath` wins.
   */
  gatewayUrl?: string;
  /**
   * Base URL (origin + prefix) of the Rose API. Defaults to the shared
   * resolution in roseApiBase() — NEXT_PUBLIC_GATEWAY_URL + "/api/rose" when
   * set, else same-origin "/api/rose".
   */
  apiBasePath?: string;
}

const CATEGORIES = [
  "all",
  "preference",
  "fact",
  "project",
  "instruction",
  "profile",
  "general",
] as const;

export function MemoriesSettingsModal({
  isOpen,
  onClose,
  token,
  gatewayUrl,
  apiBasePath,
}: MemoriesSettingsModalProps) {
  const [memories, setMemories] = useState<RoseMemory[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // New Memory Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<string>("preference");
  const [newImportance, setNewImportance] = useState<number>(3);
  const [submitting, setSubmitting] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("general");
  const [editImportance, setEditImportance] = useState(3);

  const loadMemories = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const data = await fetchMemoriesClient({ apiBasePath, gatewayUrl, token });
      setMemories(data);
    } catch (err) {
      console.error("Failed to load memories:", err);
    } finally {
      setLoading(false);
    }
  }, [isOpen, apiBasePath, gatewayUrl, token]);

  useEffect(() => {
    if (isOpen) {
      loadMemories();
    }
  }, [isOpen, loadMemories]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || submitting) return;
    setSubmitting(true);
    try {
      const created = await createMemoryClient(
        {
          content: newContent.trim(),
          category: newCategory,
          importance: newImportance,
        },
        { apiBasePath, gatewayUrl, token }
      );
      setMemories((prev) => [created, ...prev]);
      setNewContent("");
      setIsAdding(false);
    } catch (err) {
      console.error("Failed to add memory:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      const updated = await updateMemoryClient(
        id,
        {
          content: editContent.trim(),
          category: editCategory,
          importance: editImportance,
        },
        { apiBasePath, gatewayUrl, token }
      );
      setMemories((prev) => prev.map((m) => (m.id === id ? updated : m)));
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update memory:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMemoryClient(id, { apiBasePath, gatewayUrl, token });
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Failed to delete memory:", err);
    }
  };

  const filteredMemories = useMemo(() => {
    return memories.filter((m) => {
      const matchesSearch =
        m.content.toLowerCase().includes(search.toLowerCase()) ||
        m.category.toLowerCase().includes(search.toLowerCase());
      const matchesCat =
        selectedCategory === "all" ||
        m.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCat;
    });
  }, [memories, search, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="rose-modal-overlay" onClick={onClose}>
      <div
        className="rose-modal-content rose-memories-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rose-modal-header">
          <div className="rose-modal-title-group">
            <span className="rose-modal-icon">🧠</span>
            <div>
              <h2>Long-Term Memory & Notes</h2>
              <p className="rose-modal-subtitle">
                Context and facts Rose has remembered about you across all conversations.
              </p>
            </div>
          </div>
          <button className="rose-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="rose-memories-toolbar">
          <div className="rose-memories-search">
            <input
              type="text"
              placeholder="Search memories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rose-memories-input"
            />
          </div>

          <button
            className="rose-btn-primary rose-memories-add-btn"
            onClick={() => setIsAdding((v) => !v)}
          >
            {isAdding ? "Cancel" : "+ Add Note"}
          </button>
        </div>

        {isAdding && (
          <form className="rose-memories-add-form" onSubmit={handleAdd}>
            <textarea
              placeholder="E.g., Prefers TypeScript, uses Tailwind CSS, works on machi-asia..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={2}
              required
              className="rose-memories-textarea"
            />
            <div className="rose-memories-form-row">
              <div className="rose-form-group">
                <label>Category:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="rose-memories-select"
                >
                  <option value="preference">Preference</option>
                  <option value="fact">Fact</option>
                  <option value="project">Project</option>
                  <option value="instruction">Instruction</option>
                  <option value="profile">Profile</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div className="rose-form-group">
                <label>Importance (1-5):</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={newImportance}
                  onChange={(e) => setNewImportance(Number(e.target.value))}
                  className="rose-memories-num-input"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !newContent.trim()}
                className="rose-btn-primary rose-form-submit"
              >
                {submitting ? "Saving..." : "Save Memory"}
              </button>
            </div>
          </form>
        )}

        <div className="rose-memories-categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`rose-cat-pill ${
                selectedCategory === cat ? "active" : ""
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="rose-memories-list">
          {loading ? (
            <div className="rose-memories-empty">Loading memories...</div>
          ) : filteredMemories.length === 0 ? (
            <div className="rose-memories-empty">
              {memories.length === 0
                ? "No permanent memories stored yet. As you chat, Rose will automatically take notes on important facts, or you can add them manually above."
                : "No memories match your filter."}
            </div>
          ) : (
            filteredMemories.map((m) => {
              const isEditing = editingId === m.id;

              return (
                <div key={m.id} className="rose-memory-card">
                  {isEditing ? (
                    <div className="rose-memory-edit-box">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="rose-memories-textarea"
                        rows={2}
                      />
                      <div className="rose-memories-form-row">
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="rose-memories-select"
                        >
                          <option value="preference">Preference</option>
                          <option value="fact">Fact</option>
                          <option value="project">Project</option>
                          <option value="instruction">Instruction</option>
                          <option value="profile">Profile</option>
                          <option value="general">General</option>
                        </select>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={editImportance}
                          onChange={(e) => setEditImportance(Number(e.target.value))}
                          className="rose-memories-num-input"
                        />
                        <button
                          className="rose-btn-primary"
                          onClick={() => handleUpdate(m.id)}
                        >
                          Save
                        </button>
                        <button
                          className="rose-btn-secondary"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="rose-memory-main">
                        <div className="rose-memory-meta">
                          <span
                            className={`rose-memory-badge badge--${(
                              m.category || "general"
                            ).toLowerCase()}`}
                          >
                            {m.category || "general"}
                          </span>
                          <span className="rose-memory-stars">
                            {"★".repeat(Math.min(m.importance || 1, 5))}
                          </span>
                          <span className="rose-memory-date">
                            {new Date(m.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="rose-memory-content">{m.content}</p>
                      </div>

                      <div className="rose-memory-actions">
                        <button
                          className="rose-mem-action-btn"
                          title="Edit"
                          onClick={() => {
                            setEditingId(m.id);
                            setEditContent(m.content);
                            setEditCategory(m.category || "general");
                            setEditImportance(m.importance || 3);
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          className="rose-mem-action-btn btn--delete"
                          title="Delete"
                          onClick={() => handleDelete(m.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default MemoriesSettingsModal;
