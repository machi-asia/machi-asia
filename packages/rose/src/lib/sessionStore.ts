import { getSupabase } from "./supabase";

export interface RoseSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface RoseSessionMessage {
  id: string;
  session_id: string;
  role: "user" | "model";
  content: string;
  emotion: string | null;
  traces: string[];
  created_at: string;
}

export interface NewSessionMessage {
  role: "user" | "model";
  content: string;
  emotion?: string | null;
  traces?: string[];
}

const SESSION_SELECT = "id, user_id, title, created_at, updated_at";
const MESSAGE_SELECT =
  "id, session_id, role, content, emotion, traces, created_at";

export async function listSessions(userId: string): Promise<RoseSession[]> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("rose_sessions")
    .select(SESSION_SELECT)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  return (data ?? []) as RoseSession[];
}

export async function createSession(
  userId: string,
  title = "New chat"
): Promise<RoseSession> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("rose_sessions")
    .insert({ user_id: userId, title })
    .select(SESSION_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Could not create session.");
  }
  return data as RoseSession;
}

export async function getSession(
  userId: string,
  sessionId: string
): Promise<RoseSession | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("rose_sessions")
    .select(SESSION_SELECT)
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();
  return (data as RoseSession) ?? null;
}

export async function renameSession(
  userId: string,
  sessionId: string,
  title: string
): Promise<RoseSession | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("rose_sessions")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select(SESSION_SELECT)
    .single();

  if (error || !data) return null;
  return data as RoseSession;
}

export async function deleteSession(
  userId: string,
  sessionId: string
): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("rose_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", userId);
  return !error;
}

export async function touchSession(userId: string, sessionId: string): Promise<void> {
  const supabase = getSupabase();
  await supabase
    .from("rose_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", userId);
}

export async function listMessages(
  sessionId: string
): Promise<RoseSessionMessage[]> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("rose_session_messages")
    .select(MESSAGE_SELECT)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  return (data ?? []) as RoseSessionMessage[];
}

export async function appendMessages(
  sessionId: string,
  messages: NewSessionMessage[]
): Promise<RoseSessionMessage[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("rose_session_messages")
    .insert(
      messages.map((msg) => ({
        session_id: sessionId,
        role: msg.role,
        content: msg.content,
        emotion: msg.emotion ?? null,
        traces: msg.traces ?? [],
      }))
    )
    .select(MESSAGE_SELECT);

  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as RoseSessionMessage[];
}