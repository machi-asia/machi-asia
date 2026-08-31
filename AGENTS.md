# Agent Instructions

These instructions apply to the **machi-asia** monorepo (`apps/*` and `packages/*`).

## Mandatory Duties

### 1. Keep `latest.commit.txt` in sync with uncommitted work

Whenever this working tree contains uncommitted changes, `latest.commit.txt` MUST be updated to describe ALL of them before a task or session ends.

- Base it strictly on the current uncommitted diff (`git status` + `git diff`) against HEAD.
- Format: the first line (title) MUST match
  `^(feature|fix|refactor|chore|docs|style|test|ci|build)\s*\([a-z0-9]+(-[a-z0-9]+)*\):\s*.+$`
  — choose the type closest to the dominant nature of the pending changes and a kebab-case scope naming the affected area. Below it, add one bullet per notable change (`- <area>: what changed and why`).
- Regenerate it from scratch every time; never append stale entries.
- Once everything is committed and the tree is clean, empty the file.

### 2. Update `README.md` for every major feature change

Any change that adds, removes, or alters user-facing behavior or developer-facing infrastructure (new apps, new packages, workflows, pipeline stages, or dependencies) requires a matching `README.md` update in the same change.

Excluded: pure styling tweaks and internal refactors with no behavioral surface.

### 3. Maintain Workspace Boundaries & Monorepo Integrity

- Shared components, libraries, and service code (route handlers, middleware, server helpers) belong in `packages/*`.
- Deployable applications belong in `apps/*`. Currently the apps are `apps/tween` and `apps/rose`, which consume the packages.
- Use Turborepo commands (`npm run build`, `npm run test`, `npm run lint`, `npm run typecheck`) to ensure all workspaces remain passing.

### 4. CI Pipeline Enforcement (Local Pre-flight)

Every change **must** pass the equivalent of both CI pipelines locally before completing a task. These pipelines are defined in `.github/workflows/pr-pipeline-web.yml` and `.github/workflows/pr-pipeline-service.yml`.

#### Required Scripts Per Workspace

| Workspace | `lint` | `typecheck` | `test` | `build` | `lint:style` |
|:--|:--|:--|:--|:--|:--|
| `apps/tween` | ✅ | ✅ | ✅ *add if missing* | ✅ | — |
| `apps/rose` | ✅ | ✅ | ✅ *add if missing* | ✅ | — |
| `packages/ui` | ✅ *add if missing* | ✅ | ✅ | ✅ | ✅ *add if missing* |
| `packages/auth` | ✅ | ✅ | ✅ | ✅ | — |
| `packages/api-gateway` | ✅ | ✅ | ✅ | ✅ | — |
| `packages/media-library` | ✅ | ✅ | ✅ | ✅ | — |
| `packages/rose` | ✅ | ✅ | ✅ *add if missing* | ✅ | — |

- **`lint:style`** is only required for web app workspaces (`apps/tween`) and `packages/ui`. Use `stylelint` or `prettier --check` as appropriate. Other packages skip this step.
- If a workspace is missing a required script above, **add it** (even as a no-op pass-through) so Turborepo can run uniformly. For example, `packages/media-library` with no tests should have `"test": "jest --passWithNoTests"`.

#### Local Pipeline Commands

**Step 1 — Clean install** (mimics `npm ci` in CI):
```powershell
npm install
```

**Step 2 — Run the Turborepo pipelines** (web + service equivalents across all workspaces):
```powershell
npm run lint
npm run typecheck
npm run test
npm run build
```

**Step 3 — Run the full monorepo validation** (final gate before ending a task):
```powershell
npx turbo run lint typecheck test build
```

If any step fails, fix the errors before proceeding. Never end a session or commit with failing checks.

### 5. Vercel Deployment Assumption

The apps in `apps/*` (`apps/tween`, `apps/rose`) are deployed to **Vercel** as their own Vercel projects. Packages under `packages/*` are libraries — they are not independently deployed; they are consumed by the apps at build time. Do not assume any app runs outside of Vercel in production. All configuration, build outputs, and environment variable strategies must be compatible with the Vercel platform (including importing package subpath assets such as CSS and static files into the host app).

### 6. Document All Environment Variables

Every project with environment variable requirements **must** include a `.env.example` file (at the project root) that lists every variable the app depends on, with inline comments explaining each one. This file must be kept in sync whenever env vars are added, renamed, or removed.

- Use `.env.example` as the canonical reference (never commit real secrets).
- Never leave a required env var undocumented.

### 7. Site URL Resolution

When generating links, redirects, or any reference to the site's public URL, always resolve from the `VERCEL_PROJECT_PRODUCTION_URL` environment variable first. If that variable is unset, fall back to `localhost` with the app's local dev port.

```ts
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : `http://localhost:${LOCAL_PORT}`;
```

### 8. Database Schema & Migrations via Supabase Skill

Whenever creating or modifying database tables, columns, indexes, permissions, RLS policies, or database functions:

- **Target Correct Supabase Instance**: There may be multiple Supabase MCP servers / projects installed. **ALWAYS** use the MCP instance and database corresponding to **`zyatzdkapdqngwyhiqqn.supabase.co`** (Project Ref: `zyatzdkapdqngwyhiqqn`) for all machi-asia monorepo operations.
- **Always update the live database**: Use the `/supabase` skill and Supabase MCP tools (`execute_sql`, `apply_migration`) to execute the changes and keep the live database synchronized.
- **Maintain Migration Files**: Save every schema change as a timestamped migration SQL file in the corresponding package/app `supabase/migrations/` directory (e.g. `packages/rose/supabase/migrations/`).
- **Permissions & Schema Cache Reload**: Always grant table permissions to `anon`, `authenticated`, and `service_role`, and execute `NOTIFY pgrst, 'reload schema';` so that PostgREST / Supabase API immediately reflects new or altered tables in its schema cache without `PGRST205` errors.
- **Follow Postgres Best Practices**: Follow the guidelines in the `/supabase-postgres-best-practices` skill for robust column typing, primary keys, foreign keys, indexing, and performant RLS policies.

