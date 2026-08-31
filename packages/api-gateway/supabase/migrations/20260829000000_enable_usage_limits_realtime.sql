-- Enables authenticated users to SELECT their own usage rows (needed by
-- browser-side Realtime subscriptions in api-gateway UsageCard) and publishes
-- usage_limits to the Realtime publication.

create policy "Users can view own usage"
  on public.usage_limits for select
  to authenticated
  using (auth.uid() = user_id);

grant select on table public.usage_limits to authenticated;

alter publication supabase_realtime add table public.usage_limits;

notify pgrst, 'reload schema';