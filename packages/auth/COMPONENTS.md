# `@machi-asia/auth` — Component Documentation

Authentication: client providers/session management, token store, and server route handlers (`/api/auth/*`).

| Component / Export | Requires Auth | Requires Provider | Requires Env | API calls |
|---|---|---|---|---|
| `AuthProvider` | No | – | `NEXT_PUBLIC_AUTH_API_URL` (optional, default same-origin) | `POST /api/auth/login\|signup\|guest\|logout\|token` |
| `AuthGate` | No | `AuthProvider` | `NEXT_PUBLIC_AUTH_API_URL` (optional) | `POST /api/auth/guest\|token` |
| `useAuth()` | No | `AuthProvider` | – | – |
| `saveTokens` / `loadTokens` / `clearTokens` | No | – | – | – |

## Requirements to ship

1. Mount one `AuthProvider` at the app root (optionally passing `authApiUrl`).
2. Mount the auth route handlers in the host app at `/api/auth/*` (see `apps/rose` / `apps/test` wrappers) and protect them with the gateway middleware.
3. Use `session.accessToken` as the bearer token for all protected machi-asia APIs.

Machine-readable manifest: `component-docs.json`.