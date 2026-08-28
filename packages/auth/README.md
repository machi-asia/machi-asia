# machi-asia Auth (`@machi-asia/auth/server`)

Token issuer service wrapping Supabase Auth for all machi-asia platforms. Exposed as a library
(`@machi-asia/auth/server`) shipping Next.js route handlers.

Authentication itself is hosted Supabase Auth; this side of the package is the server-side boundary
that issues, refreshes, revokes and inspects tokens for frontends, and manages the `roles`
claims consumed by `@machi-asia/api-gateway` and downstream services.

```
Frontend repos ──POST /api/auth/*──▶ auth service ──▶ Supabase Auth (GoTrue)
                                          │
                                          └─ Custom Access Token Hook injects
                                             top-level `roles` claim into every JWT
```

## Endpoints

| Method | Path                          | Auth                | Purpose                                        |
| ------ | ----------------------------- | ------------------- | ---------------------------------------------- |
| POST   | `/api/auth/signup`            | —                   | Create account. Returns tokens, or `requires_email_confirmation` when confirmation is on |
| POST   | `/api/auth/login`             | —                   | Email+password sign-in → token envelope        |
| POST   | `/api/auth/token`             | refresh_token       | Refresh-token exchange → new envelope          |
| POST   | `/api/auth/logout`            | refresh_token       | Revoke session (idempotent)                    |
| GET    | `/api/auth/user`              | Bearer access token | Locally verified identity (id, email, roles)   |
| PATCH  | `/api/admin/users/:id/roles`  | `x-admin-secret`    | Replace `app_metadata.roles`; lands in future JWTs |
| GET    | `/api/health`                 | —                   | Liveness probe (CI smoke test)                 |

Token envelope (OAuth-style):

```json
{
  "access_token": "eyJ...",
  "refresh_token": "...",
  "token_type": "bearer",
  "expires_in": 3600,
  "expires_at": 1755950000,
  "user": { "id": "...", "email": "...", "roles": ["member"] }
}
```

Errors: `{ "error": { "code": "...", "message": "..." } }`.

## Roles & claims

- Role assignments live in `raw_app_meta_data.roles` — admin-managed only (never user-editable).
- The Custom Access Token Hook (`public.custom_access_token_hook`, see
  `supabase/migrations/`) promotes them to a top-level `roles` claim on every issued token.
- Tokens are signed with asymmetric ES256 keys; consumers verify via JWKS without network calls.

### Enabling the hook (one-time, Dashboard)

The hook function is deployed by migration/SQL, but GoTrue must be pointed at it:

1. Dashboard → Authentication → Hooks.
2. Set **Custom Access Token Hook** to `sql://public.custom_access_token_hook`.
3. Save. New logins/refreshes carry the claim.

> The function lives in `public` (not `auth`) because management connections cannot create
> objects in the `auth` schema.

## Environment variables

| Variable                       | Scope         | Purpose                                              |
| ------------------------------ | ------------- | ---------------------------------------------------- |
| `SUPABASE_URL`                 | server        | Project URL                                          |
| `SUPABASE_PUBLISHABLE_KEY`     | server        | Publishable/anon key for signup/login/refresh        |
| `SUPABASE_SERVICE_ROLE_SECRET` | server        | Secret key for logout revoke + admin role updates    |
| `ADMIN_API_SECRET`             | server        | Shared secret for `/api/admin/*` callers             |

All secrets are server-side only. Never expose the service role secret or admin secret.

## Building & testing

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

Migrations are applied through the Supabase MCP/CLI against the shared project;
`supabase/migrations/20260823000000_custom_access_token_hook.sql` is the source of truth.

## Hosting

This is a library, not a standalone deployment. A host app (e.g. `apps/tween`) mounts the route
handlers under its own `/api/auth/*` paths and may apply `authMiddleware` for CORS. Client-side
consumption happens through the package root (`@machi-asia/auth`): `AuthProvider`, `useAuth`,
`AuthGate`.

## Related

- Gateway: `@machi-asia/api-gateway` verifies these tokens at the edge and forwards requests with
  trusted `x-gateway-*` headers.
