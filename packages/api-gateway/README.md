# machi-asia API Gateway (`@machi-asia/api-gateway`)

Token-verifying reverse proxy in front of all machi-asia service routes. Shipped as a library of
Next.js route handlers and middleware helpers (consumed by `apps/tween`).

Every request that passes through this gateway has its Supabase access token verified locally
against the project's asymmetric signing keys (JWKS). Services never see an unverified request and
never need to implement token verification themselves.

## How verification works

1. `src/middleware.ts` (copied/wrapped into the host's own `middleware.ts`) resolves the request
   path against the service registry (`src/lib/services.ts` + `src/lib/routes.ts`).
2. For protected routes, the `Authorization: Bearer <jwt>` header is verified with `jose`
   (`src/lib/verify.ts`): signature checked against the project JWKS at
   `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`, plus `iss`, `aud=authenticated` and expiry.
   Keys are fetched once and cached by jose (~10 min).
3. Any inbound `x-gateway-*` headers are stripped first, so callers cannot spoof identity.
4. Verified identity is re-injected as trusted headers:
   - `x-gateway-sub` — user id
   - `x-gateway-email` — email claim
   - `x-gateway-roles` — comma-separated roles from the JWT `roles` claim
   - `x-gateway-session-id` — Supabase session id
   - `x-gateway-secret` — shared internal secret; upstream services MUST reject requests without it
5. The forwarding handler (`src/routes/gateway.ts`) streams the request to the upstream service and
   relays the response. Hop-by-hop headers, `authorization`, and framing headers are stripped.

Error responses are JSON: `{ "error": { "code": "...", "message": "..." } }` with codes
`unauthorized` (401), `forbidden` (403), `not_found` (404), `upstream_error` (502).

## Service registry

Routes come from a code-side catalog (`src/lib/services.ts`) — one entry per service. Each entry
names its own upstream URL env var (e.g. `AUTH_SERVICE_URL`, `ROSE_SERVICE_URL`,
`MEDIA_SERVICE_URL`). See `.env.example` for all variables.

## Usage

```ts
// host app: src/middleware.ts
export { default, GATEWAY_MATCHER } from "@machi-asia/api-gateway/middleware";
```

```ts
// host app: app/api/usage/route.ts
export { POST } from "@machi-asia/api-gateway/routes/usage";
```

## Build & test

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Related

- Auth: `@machi-asia/auth/server` issues the tokens this gateway verifies.
- Services upstream: `@machi-asia/auth`, `@machi-asia/rose`, `@machi-asia/media-library`.