import { getSupabase } from "./supabase";
import { roseApiBase } from "./roseEnv";

export interface MemoryClientOptions {
  /**
   * Base URL (origin + prefix) of the Rose API. Defaults to the shared
   * resolution in roseApiBase() — NEXT_PUBLIC_GATEWAY_URL + "/api/rose" when
   * set, else same-origin "/api/rose".
   */
  apiBasePath?: string;
  /**
   * @deprecated Prefer `apiBasePath`. Kept for backward compatibility: if both
   * are provided, `apiBasePath` wins.
   */
  gatewayUrl?: string;
  token?: string;
}

export interface RoseMemory {
  id: string;
  user_id: string;
  category: "preference" | "fact" | "project" | "instruction" | "profile" | "general" | string;
  content: string;
  importance: number;
  created_at: string;
  updated_at: string;
}

export interface NewRoseMemory {
  category?: string;
  content: string;
  importance?: number;
}

export interface UpdateRoseMemory {
  category?: string;
  content?: string;
  importance?: number;
}

/**
 * Lists permanent long-term memories for a given user from Supabase.
 */
export async function listMemories(
  userId: string,
  limit = 100
): Promise<RoseMemory[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("rose_memories")
    .select("id, user_id, category, content, importance, created_at, updated_at")
    .eq("user_id", userId)
    .order("importance", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[rose] listMemories error:", error);
    return [];
  }

  return (data as RoseMemory[]) ?? [];
}

/**
 * Adds a new permanent memory for a given user into Supabase.
 */
export async function addMemory(
  userId: string,
  memory: NewRoseMemory
): Promise<RoseMemory | null> {
  const supabase = getSupabase();
  const category = memory.category || "general";
  const importance = typeof memory.importance === "number" ? memory.importance : 3;

  const { data, error } = await supabase
    .from("rose_memories")
    .insert({
      user_id: userId,
      category,
      content: memory.content.trim(),
      importance,
    })
    .select("id, user_id, category, content, importance, created_at, updated_at")
    .single();

  if (error) {
    console.error("[rose] addMemory error:", error);
    return null;
  }

  return data as RoseMemory;
}

/**
 * Updates an existing memory by ID for a given user.
 */
export async function updateMemory(
  userId: string,
  memoryId: string,
  updates: UpdateRoseMemory
): Promise<RoseMemory | null> {
  const supabase = getSupabase();
  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof updates.content === "string") payload.content = updates.content.trim();
  if (typeof updates.category === "string") payload.category = updates.category.trim();
  if (typeof updates.importance === "number") payload.importance = updates.importance;

  const { data, error } = await supabase
    .from("rose_memories")
    .update(payload)
    .eq("id", memoryId)
    .eq("user_id", userId)
    .select("id, user_id, category, content, importance, created_at, updated_at")
    .single();

  if (error) {
    console.error("[rose] updateMemory error:", error);
    return null;
  }

  return data as RoseMemory;
}

/**
 * Deletes a memory by ID for a given user.
 */
export async function deleteMemory(
  userId: string,
  memoryId: string
): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("rose_memories")
    .delete()
    .eq("id", memoryId)
    .eq("user_id", userId);

  if (error) {
    console.error("[rose] deleteMemory error:", error);
    return false;
  }

  return true;
}

/**
 * Formats user memories into a concise, structured prompt section to inject into the system instruction.
 */
export function formatMemoriesForPrompt(memories: RoseMemory[]): string {
  if (!memories || memories.length === 0) {
    return "";
  }

  const memoryBullets = memories.map((m) => {
    const cat = (m.category || "GENERAL").toUpperCase();
    return `- [${cat}] ${m.content}`;
  });

  return [
    "",
    "### Long-Term Memory (Persistent User Context Across All Conversations)",
    "The following notes and facts were remembered about this user from previous conversations. Respect and integrate this context naturally in your responses:",
    ...memoryBullets,
    "",
  ].join("\n");
}

/**
 * Client-side HTTP helper: fetches user memories from the API gateway / host app.
 */
export async function fetchMemoriesClient(options?: MemoryClientOptions): Promise<RoseMemory[]> {
  const baseUrl = roseApiBase(options?.apiBasePath ?? options?.gatewayUrl);
  const headers: Record<string, string> = {};
  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetch(`${baseUrl}/memories`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch memories (${res.status})`);
  }

  const data = await res.json();
  return Array.isArray(data.memories) ? data.memories : [];
}

/**
 * Client-side HTTP helper: creates a new memory.
 */
export async function createMemoryClient(
  memory: NewRoseMemory,
  options?: MemoryClientOptions
): Promise<RoseMemory> {
  const baseUrl = roseApiBase(options?.apiBasePath ?? options?.gatewayUrl);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetch(`${baseUrl}/memories`, {
    method: "POST",
    headers,
    body: JSON.stringify(memory),
  });

  if (!res.ok) {
    throw new Error(`Failed to create memory (${res.status})`);
  }

  const data = await res.json();
  return data.memory;
}

/**
 * Client-side HTTP helper: updates a memory.
 */
export async function updateMemoryClient(
  memoryId: string,
  updates: UpdateRoseMemory,
  options?: MemoryClientOptions
): Promise<RoseMemory> {
  const baseUrl = roseApiBase(options?.apiBasePath ?? options?.gatewayUrl);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetch(`${baseUrl}/memories/${encodeURIComponent(memoryId)}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    throw new Error(`Failed to update memory (${res.status})`);
  }

  const data = await res.json();
  return data.memory;
}

/**
 * Client-side HTTP helper: deletes a memory.
 */
export async function deleteMemoryClient(
  memoryId: string,
  options?: MemoryClientOptions
): Promise<boolean> {
  const baseUrl = roseApiBase(options?.apiBasePath ?? options?.gatewayUrl);
  const headers: Record<string, string> = {};
  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetch(`${baseUrl}/memories/${encodeURIComponent(memoryId)}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    throw new Error(`Failed to delete memory (${res.status})`);
  }

  return true;
}
