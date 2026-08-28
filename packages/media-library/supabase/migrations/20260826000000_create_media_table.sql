create table media (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  file_name text not null,
  file_url text not null,
  file_size bigint not null,
  mime_type text not null,
  created_at timestamptz default now() not null,
  deleted_at timestamptz
);

alter table media enable row level security;
