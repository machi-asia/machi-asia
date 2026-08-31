create table if not exists public.rose_memories (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null,
  category   text not null default 'general',
  content    text not null,
  importance integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rose_memories enable row level security;

create policy "rose_memories is manageable by service role"
  on public.rose_memories for all
  to service_role
  using (true)
  with check (true);

create policy "Users can view own memories"
  on public.rose_memories for select
  to authenticated
  using ((select auth.uid())::text = user_id);

create policy "Users can insert own memories"
  on public.rose_memories for insert
  to authenticated
  with check ((select auth.uid())::text = user_id);

create policy "Users can update own memories"
  on public.rose_memories for update
  to authenticated
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);

create policy "Users can delete own memories"
  on public.rose_memories for delete
  to authenticated
  using ((select auth.uid())::text = user_id);

grant all on table public.rose_memories to anon, authenticated, service_role;

create index if not exists idx_rose_memories_user_created
  on public.rose_memories (user_id, created_at desc);

notify pgrst, 'reload schema';
