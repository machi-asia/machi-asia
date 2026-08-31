# `@machi-asia/rose` — Component Documentation

Rose AI Companion. API-backed components call `/api/rose/*` and require an authenticated session (`AuthProvider`). All URLs resolve through `roseApiBase()` — `NEXT_PUBLIC_GATEWAY_URL` + `/api/rose`, or same-origin `/api/rose` — and can be overridden with the `apiBasePath` prop.

| Component | Requires Auth | Requires Provider | Requires Env | API calls |
|---|---|---|---|---|
| `RoseChat` | Yes | `AuthProvider` (+`ToastProvider` recommended) | `NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY` (realtime), `NEXT_PUBLIC_GATEWAY_URL` (opt.) | `chat`, `usage`, `sessions`, `sessions/[id]`, `sessions/[id]/chat`, `memories`, `memories/[id]` |
| `Chat` | No | – | – | – |
| `UsageBar` | Yes | `AuthProvider` | `NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY` (real‑time, skips gracefully) | `GET /api/rose/usage` |
| `MemoriesSettingsModal` | Yes | `AuthProvider` (for token) | – | `memories`, `memories/[id]` |
| `RoseChatModal` | Yes | `AuthProvider` (+`ToastProvider` recommended) | `NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY` (realtime), `NEXT_PUBLIC_GATEWAY_URL` (opt.) | `chat`, `usage`, `sessions`, `sessions/[id]`, `sessions/[id]/chat`, `memories`, `memories/[id]` |
| `Providers` | No (gates children) | – | `NEXT_PUBLIC_AUTH_API_URL` (opt.) | auth routes |
| `MarkdownRenderer` | No | – | – | – |
| `ChatbotInputArea` | No | – | – | – |
| `ChatbotInputBadge` | No | – | – | – |
| `ChatbotSlashMenu` | No | – | – | – |
| `ChatbotTraces` | No | – | – | – |
| `ChatbotOptionsPicker` | No | – | – | – |
| `ChatbotWelcome` | No | – | – | – |

## Routes the host app must mount

`POST /api/rose/chat`, `GET /api/rose/usage`, `GET|POST /api/rose/sessions`, `GET|PATCH|DELETE /api/rose/sessions/[id]`, `POST /api/rose/sessions/[id]/chat`, `GET|POST /api/rose/memories`, `PATCH|DELETE /api/rose/memories/[id]` — all protected by the gateway middleware (they read `x-gateway-sub`).

## Assets

Presentational components default to `/rose/*.png` image paths. Copy the `rose` assets into the host app's `public/`, or pass explicit `avatarUrl`/`photoUrl` props.

## Env var summary

- **Server (route handlers):** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `ROSE_DAILY_LIMIT_*`, `ROSE_WEEKLY_LIMIT_*`.
- **Browser:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_GATEWAY_URL` (optional), `NEXT_PUBLIC_AUTH_API_URL` (optional).

## Utilities

`roseApiBase(explicit?)`, `roseApiUrl(path, explicit?)`, `roseGatewayUrl()`, `isBrowserSupabaseConfigured()` — keep all rose clients on a consistent base URL.

Machine-readable manifest: `component-docs.json`.