# machi-asia API Gateway

Token-verifying reverse proxy in front of all machi-asia microservices. Built with Next.js.

Every request that passes through this gateway has its Supabase access token verified locally
against the project's asymmetric signing keys (JWKS) — microservices never see an unverified
request and never need to implement token verification themselves.

```
Frontend repos ──login/refresh──▶ auth service (machi-asia/auth)
      │                                    │
      │ Bearer JWT                  Supabase Auth (ES256 keys, roles claim via hook)
      ▼                                    │
api-gateway ──verify JWT (jose + JWKS)─────┘
      │  x-gateway-sub / -roles / -session-id / -secret headers
      ▼
Microservice repos
```

## How verification works

1. `middleware.ts` resolves the request path against the service registry
   (`lib/services.ts` → `lib/routes.ts`).
2. For protected routes, the `Authorization: Bearer <jwt>` header is verified with `jose`
   (`lib/verify.ts`): signature checked against the project JWKS at
   `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`, plus `iss`, `aud=authenticated` and expiry.
   Keys are fetched once and cached by jose (~10 min).
3. Any inbound `x-gateway-*` headers are stripped first, so callers cannot spoof identity.
4. Verified identity is re-injected as trusted headers:
   - `x-gateway-sub` — user id
   - `x-gateway-email` — email claim
   - `x-gateway-roles` — comma-separated roles from the JWT `roles` claim
   - `x-gateway-session-id` — Supabase session id
   - `x-gateway-secret` — shared internal secret; upstream services MUST reject requests without it
5. The catch-all handler (`app/[...path]/route.ts`) streams the request to the upstream service
   and relays the response. Hop-by-hop headers, `authorization`, and framing headers are stripped.

Error responses are JSON: `{ "error": { "code": "...", "message": "..." } }` with codes
`unauthorized` (401), `forbidden` (403), `not_found` (404), `upstream_error` (502).

## Service registry

Routes come from a code-side catalog (`lib/services.ts`) — one entry per microservice:

```ts
{
  key: "AUTH",                    // registry identity
  prefix: "/api/auth",            // public path prefix (longest prefix wins)
  envVar: "AUTH_SERVICE_URL",     // env var holding the deployed upstream URL
  devPort: 4000,                  // local dev port for the localhost fallback
  requiredRoles: ["admin"],       // optional: JWT roles claim gate
  isPublic: true,                 // optional: skip token verification
}
```

Prefixes follow the `/api/<service>` convention (e.g. `/api/auth`, `/api/users`).
`/api/health` is gateway-owned — the registry validator rejects any service trying
to register it or a child of it.

Upstream resolution per request path:

1. `<envVar>` set → use it (trailing slashes normalized; invalid URL = loud startup error).
2. Unset + localhost fallback allowed → `http://localhost:<devPort>`.
3. Unset + fallback disabled → route disabled; the gateway answers `404 not_found`.

Fallback gating (`GATEWAY_ALLOW_LOCAL_FALLBACK`):

| Value    | Behavior                                            |
| -------- | --------------------------------------------------- |
| unset    | Enabled unless `NODE_ENV=production` (dev-only default) |
| `true`   | Forced on everywhere                                |
| `false`  | Hard-disabled everywhere                            |

Production deployments therefore **never** proxy to localhost: an unconfigured service
is simply unreachable through the gateway until its URL variable is set.

### Onboarding a new microservice

1. Deploy the microservice repo (Next.js) to its Vercel project / internal URL.
2. Add its shared `INTERNAL_GATEWAY_SECRET` env var (same value as the gateway's).
3. Reject any request missing a valid `x-gateway-secret` header in the service.
4. Read identity from `x-gateway-sub` / `x-gateway-roles`; never trust inbound copies.
5. Add a registry entry in `lib/services.ts` (prefix, env var, dev port, roles).
6. Set the service's URL var on this gateway's deployment (e.g. `USERS_SERVICE_URL`).

## Environment variables

| Variable                       | Scope            | Purpose                                        |
| ------------------------------ | ---------------- | ---------------------------------------------- |
| `SUPABASE_URL`                 | server           | Project URL used to build the JWKS endpoint    |
| `INTERNAL_GATEWAY_SECRET`      | server           | Shared secret injected into forwarded requests |
| `<KEY>_SERVICE_URL`            | server           | Upstream base URL per registered service       |
| `GATEWAY_ALLOW_LOCAL_FALLBACK` | server           | Localhost fallback gating (see table above)    |

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm test
npm run build
```

`/api/health` is unauthenticated and used by CI smoke tests.

## Deployment

Deployed on Vercel. CI runs the org reusable pipeline
(`machi-asia/.github/.github/workflows/pr-pipeline-service.yml`): lint, typecheck, sharded Jest,
build, preview deploy, healthcheck probe, auto-rollback on failure. Requires repo secrets
`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

## Related

- Token issuer: `machi-asia/auth` — issues Supabase Auth tokens and manages role claims.
- Role claims: `raw_app_meta_data.roles` promoted into the top-level JWT `roles` claim by a
  Custom Access Token Hook maintained in the auth repository.
