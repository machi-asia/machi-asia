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
- Deployable applications belong in `apps/*`. Currently the only app is `apps/tween`, which consumes the packages.
- Use Turborepo commands (`npm run build`, `npm run test`, `npm run lint`, `npm run typecheck`) to ensure all workspaces remain passing.
