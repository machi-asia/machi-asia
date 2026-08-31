create table public.media (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  file_name text not null,
  file_url text not null,
  file_size bigint not null,
  mime_type text not null,
  created_at timestamptz default now() not null,
  deleted_at timestamptz
);

alter table public.media enable row level security;

grant all on table public.media to service_role;
grant select, insert, update, delete on table public.media to authenticated;

create index if not exists idx_media_user_created
  on public.media (user_id, created_at desc);

create policy "media is manageable by service role"
  on public.media for all
  to service_role
  using (true)
  with check (true);

create policy "Users can select own media"
  on public.media for select
  to authenticated
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';