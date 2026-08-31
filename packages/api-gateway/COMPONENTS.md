# `@machi-asia/api-gateway` — Component Documentation

JWT-verifying usage endpoints + usage UI.

| Component | Requires Auth | Requires Provider | Requires Env | API calls |
|---|---|---|---|---|
| `UsageCard` | Yes (bearer token in localStorage) | – | `NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY` (realtime, skips gracefully) | `GET /api/usage` |
| `UsagePage` | Yes | – | – | – |

- Token source: reads `machi_access_token` (fallback `access_token`) from localStorage — the same key `@machi-asia/auth`'s `saveTokens()` writes.
- The `/api/usage` route must be mounted behind the gateway middleware; the route itself also re-verifies the JWT.
- Server-side env for the route: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_SECRET`, `WEEKLY_USAGE_LIMIT`.

Machine-readable manifest: `component-docs.json`.