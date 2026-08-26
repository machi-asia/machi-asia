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

- Shared components and libraries belong in `packages/*`.
- Microservices and deployable web applications belong in `apps/*`.
- Use Turborepo commands (`npm run build`, `npm run test`, `npm run lint`, `npm run typecheck`) to ensure all workspaces remain passing.

### 4. Vercel Deployment Assumption

Every app in `apps/*` is deployed to **Vercel** as its own Vercel project. Do not assume any app runs outside of Vercel in production. All configuration, build outputs, and environment variable strategies must be compatible with the Vercel platform.

### 5. Document All Environment Variables

Every project with environment variable requirements **must** include a `.env.example` file (at the project root) that lists every variable the app depends on, with inline comments explaining each one. This file must be kept in sync whenever env vars are added, renamed, or removed.

- Use `.env.example` as the canonical reference (never commit real secrets).
- Never leave a required env var undocumented.

### 6. Site URL Resolution

When generating links, redirects, or any reference to the site's public URL, always resolve from the `VERCEL_PROJECT_PRODUCTION_URL` environment variable first. If that variable is unset, fall back to `localhost` with the app's local dev port.

```ts
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : `http://localhost:${LOCAL_PORT}`;
```
