alter table public.usage_limits
  add column service_key text;

-- Backfill existing rows so they behave as generic (non-service) usage
update public.usage_limits set service_key = null where service_key is null;

-- Update the unique constraint to include service_key
alter table public.usage_limits
  drop constraint if exists usage_limits_user_id_week_key;

alter table public.usage_limits
  add constraint usage_limits_user_week_service_key unique (user_id, week, service_key);

-- Rebuild the index to include service_key for fast per-service lookups
drop index if exists idx_usage_limits_user_week;

create index idx_usage_limits_user_week_service
  on public.usage_limits (user_id, week, service_key);
