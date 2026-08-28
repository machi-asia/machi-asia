create table public.usage_limits (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null,
  week     text not null,
  count    integer not null default 0,
  usage_limit    integer not null default 1000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week)
);

alter table public.usage_limits enable row level security;

-- Service role bypasses RLS, but explicit policies for future direct access:
create policy "usage_limits is manageable by service role"
  on public.usage_limits for all
  to service_role
  using (true)
  with check (true);

-- Index for fast lookups by user_id + week
create index idx_usage_limits_user_week
  on public.usage_limits (user_id, week);
