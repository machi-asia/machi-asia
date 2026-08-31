-- Enables authenticated users to SELECT their own sessions/messages/memories
-- (needed by browser-side Realtime subscriptions and read-through clients) and
-- publishes the rose tables to the Realtime publication.

create policy "Users can view own sessions"
  on public.rose_sessions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can view messages from own sessions"
  on public.rose_session_messages for select
  to authenticated
  using (exists (
    select 1 from public.rose_sessions s
    where s.id = session_id and s.user_id = auth.uid()
  ));

grant select on table public.rose_sessions, public.rose_session_messages, public.rose_memories to authenticated;

alter publication supabase_realtime add table public.rose_sessions, public.rose_session_messages, public.rose_memories;

notify pgrst, 'reload schema';