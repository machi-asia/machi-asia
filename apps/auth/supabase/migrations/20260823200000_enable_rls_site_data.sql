-- site_data holds public portfolio content (profile, experience, works,
-- certificates) rendered on the public site by anon visitors.
-- Reads are intentionally public; writes are restricted to the service role
-- (which bypasses RLS), so no INSERT/UPDATE/DELETE policies exist here.

alter table public.site_data enable row level security;

create policy "site_data is publicly readable"
  on public.site_data
  for select
  to anon, authenticated
  using (true);
