create table public.rose_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  title      text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rose_sessions enable row level security;

create policy "rose_sessions is manageable by service role"
  on public.rose_sessions for all
  to service_role
  using (true)
  with check (true);

create index idx_rose_sessions_user_updated
  on public.rose_sessions (user_id, updated_at desc);

create table public.rose_session_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.rose_sessions (id) on delete cascade,
  role       text not null check (role in ('user', 'model')),
  content    text not null,
  emotion    text,
  traces     jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.rose_session_messages enable row level security;

create policy "rose_session_messages is manageable by service role"
  on public.rose_session_messages for all
  to service_role
  using (true)
  with check (true);

create index idx_rose_session_messages_session_created
  on public.rose_session_messages (session_id, created_at asc, id asc);