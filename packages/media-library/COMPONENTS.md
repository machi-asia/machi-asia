# `@machi-asia/media-library` — Component Documentation

Media upload/list/delete UI backed by `/api/media-library/media*` route handlers.

| Component | Requires Auth | Requires Provider | Requires Env | API calls |
|---|---|---|---|---|
| `MediaLibraryModal` | Yes (session token via `loadTokens()`) | – | `NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY` (realtime), `NEXT_PUBLIC_GATEWAY_URL` (opt.) | `GET\|POST /api/media-library/media`, `DELETE /api/media-library/media/[id]` |
| `MediaPage` | Yes | – | – | – |
| `Providers` | No (gates children) | `AuthProvider` | `NEXT_PUBLIC_AUTH_API_URL` (opt.) | auth routes |

## Requirements to ship

1. Mount `AuthProvider` + `AuthGate` (or `<Providers>`), so `loadTokens()` returns a session.
2. Mount the route handlers at `/api/media-library/media` and `/api/media-library/media/[id]`, protected by the gateway middleware (`x-gateway-sub`).
3. Create the Supabase `media` table + a storage bucket (migration: `supabase/migrations/20260826000000_create_media_table.sql`).
4. API base resolves via `mediaApiBase()` — `NEXT_PUBLIC_GATEWAY_URL` + `/api/media-library` or same-origin `/api/media-library`; override with the `apiBasePath` prop.

Machine-readable manifest: `component-docs.json`.