-- Custom Access Token Hook (https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook)
-- Promotes raw_app_meta_data.roles into a top-level `roles` claim on every
-- issued access token so the API gateway and microservices can authorize
-- without hitting the database.
--
-- Role assignments live in raw_app_meta_data (admin-managed via the service
-- role key; never editable by users). Manage them with:
--   PATCH /api/admin/users/:id/roles   (this repository)
--
-- NOTE: The function lives in the `public` schema (not `auth`) because the
-- management connection used for migrations cannot create objects in `auth`.
-- Configure it in Dashboard > Authentication > Hooks with:
--   sql://public.custom_access_token_hook

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  claims jsonb;
  roles jsonb;
begin
  select case
    when jsonb_typeof(event -> 'raw_app_meta_data' -> 'roles') = 'array'
    then event -> 'raw_app_meta_data' -> 'roles'
    else '[]'::jsonb
  end
  into roles;

  claims := event -> 'claims';

  if jsonb_typeof(claims) <> 'object' then
    return event;
  end if;

  return jsonb_build_object(
    'token',
    jsonb_set(claims, '{roles}', coalesce(roles, '[]'::jsonb), true)
  );
end;
$$;

revoke execute on function public.custom_access_token_hook(jsonb)
  from anon, authenticated, public;

grant execute on function public.custom_access_token_hook(jsonb)
  to supabase_auth_admin;
