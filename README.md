# machi-asia

Unified monorepo for the **machi-asia** ecosystem, powered by [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) and [Turborepo](https://turbo.build/repo).

---

## 📁 Repository Structure

```
.
├── apps/
│   ├── rose/              # AI companion chatbot (Next.js, port 5000) — sessions, login, usage limits
│   └── tween/             # Motion-first web page builder (Next.js) — the consuming app
├── packages/
│   ├── api-gateway/       # @machi-asia/api-gateway — token-verifying reverse proxy, gateway middleware & route handlers (library)
│   ├── auth/              # @machi-asia/auth — auth provider/AuthGate (./client) + Supabase auth service routes & verification (./server)
│   ├── media-library/     # @machi-asia/media-library — media CRUD modal, client components & route handlers (library)
│   ├── rose/              # @machi-asia/rose — Gemini chat components, chat/usage/sessions routes, styles & assets (library)
│   └── ui/                # @machi-asia/ui animated React component library
├── .github/
│   ├── workflows/         # Monorepo CI & GitHub Actions
│   └── dependabot.yml     # Automated dependency updates across all workspaces
├── package.json           # Root workspace definitions & pipeline scripts
└── turbo.json             # Turborepo task pipeline configuration
```

The services formerly deployed as standalone apps (`api-gateway`, `auth`, `media-library`, `rose`) now live in `packages/` as importable libraries. The deployable applications are `apps/tween` and `apps/rose`, which consume the packages.

---

## 🚀 Quick Start

### Prerequisites
- Node.js `>= 18.18` (Node.js 22+ recommended)
- npm `>= 10`

### Installation
```bash
npm install
```

### Development
Run the app and watch the packages it depends on:
```bash
npm run dev
```

Or target a specific workspace:
```bash
npx turbo run dev --filter=tween
```

---

## 🛠 Available Commands

| Command | Action |
| :--- | :--- |
| `npm run build` | Builds all packages in topological dependency order |
| `npm run dev` | Starts development servers with hot reload |
| `npm run test` | Runs all test suites (Jest for backend services, Vitest for UI components) |
| `npm run lint` | Runs ESLint across all workspaces |
| `npm run typecheck` | Validates TypeScript types across all projects |
| `npm run clean` | Cleans build caches and output artifacts |

---

## 📦 Apps

### rose
General-purpose AI companion (Next.js, dev port `5000`). The `/chat` page provides a sessions-based chat experience:
- **Sessions**: persistent chat threads backed by the `rose_sessions` / `rose_session_messages` tables; create, switch, and delete sessions from the sidebar.
- **Login**: hosts the `@machi-asia/auth` server routes under `/api/auth/*` (login, signup, guest, logout, token, user) and wraps the UI with `AuthGate`.
- **Usage Limits**: tiered by role — guest (10/day, 50/week), authenticated user (20/day, 200/week), admin (unlimited). Limits are enforced automatically by the chat routes and surfaced by `UsageBar`.
- **Middleware**: `middleware.ts` verifies the Bearer access token for all `/api` traffic (except public auth routes) and injects `x-gateway-sub` / `x-gateway-roles`, so the `@machi-asia/rose` route handlers work unmodified.
- **Env vars**: see `apps/rose/.env.example` and `apps/rose/.env.development`.

### tween
Motion-first web page builder (Next.js). The second deployable app in the monorepo; consumes `@machi-asia/auth`, `@machi-asia/api-gateway`, `@machi-asia/media-library`, `@machi-asia/rose`, and `@machi-asia/ui`.

---

## 📦 Packages

### @machi-asia/api-gateway
Token-verifying reverse proxy with weekly usage limits (library + Next.js route handlers).
- **`src/middleware.ts`**: exports `GATEWAY_MATCHER`, `getCorsHeaders`, `gatewayMiddleware`, and a default export. Host apps copy/wrap this in their own `middleware.ts` (Next requires the `config.matcher` in the host file) to run JWT verification + origin allow-listing in front of all `/api` traffic.
- **Routes**: `./routes/gateway` (forwarding proxy via `NEXT_REWRITE`/`fetch`), `POST ./routes/usage` (usage stats), `./routes/health`. Gateway forwards verified JWTs as `x-gateway-sub`, `x-gateway-email`, `x-gateway-roles`, and `x-gateway-session-id` — upstream services trust these and skip their own token verification.
- **Env vars**: see `packages/api-gateway/.env.example` — requires `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_SECRET`, `INTERNAL_GATEWAY_SECRET`, and `ALLOWED_ORIGINS`.

### @machi-asia/auth
Authentication for machi-asia — one package with two entry points.
- **Client (`import ... from "@machi-asia/auth"`)**: `AuthProvider` (session state, token refresh, login/register/guestLogin/logout), `useAuth`, `AuthGate` (composes `AuthProvider` + `AuthModal`), and the localStorage-backed token store.
- **Server (`import ... from "@machi-asia/auth/server"`)**: the Supabase auth service — `POST ./server/auth/guest`, `./server/auth/login`, `./server/auth/signup`, `./server/auth/logout`, `./server/auth/token`, `./server/auth/user`, `GET ./server/health`, `PATCH ./server/admin/users/[id]/roles`; plus helpers `verifyAccessToken`, `refreshTokens`, `createPublicClient`/`createAdminClient`, `toTokenEnvelope`/`toPublicUser`, `authErrorResponse`/`apiError`/`handleRouteError`, and `authMiddleware` (CORS helper for route hosting).
- **Env vars**: see `packages/auth/.env.example` — requires `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_SECRET`, `ADMIN_API_SECRET`, and `ALLOWED_ORIGINS`.

### @machi-asia/media-library
Media asset library (library + Next.js route handlers).
- **Components**: `MediaLibraryModal`, `MediaPage`, `Providers` — built on `@machi-asia/ui`; implements upload, search, gallery/list toggle, and delete-with-confirmation, with Supabase Realtime INSERT/UPDATE sync on the `media` table.
- **Routes**: `./routes/media` (GET list, POST upload) and `./routes/media-by-id` (DELETE soft-delete). Routes trust `x-gateway-sub` for user identity (requests are routed through the api-gateway).
- **Storage**: files uploaded to the Supabase Storage `media` bucket; metadata stored in the `media` table.
- **Env vars**: see `packages/media-library/.env.example` — requires `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_SECRET`, `NEXT_PUBLIC_GATEWAY_URL`, and optionally `MEDIA_STORAGE_BUCKET`.

### @machi-asia/rose
Rose — an extensible AI companion skeleton and orchestrator engine powered by Google Gemini (library + Next.js route handlers). Designed as a clean, pluggable foundation for any web app to integrate chat and easily register custom tools, specialists, slash commands, and system instructions.
- **Default Tools**: general-purpose utility tools included by default (`webSearch`, `calculator`, `codeAnalyzer`, `askQuestion`, `delegateToSpecialist`).
- **Extensible Registry**: easily add custom tools with `createTool` / `registerTool`, custom sub-agents with `createSpecialist` / `registerSpecialist`, custom slash categories with `createCommandCategory` / `createCommandItem`, or build custom pre-configured runners with `createAgentRunner`.
- **Components**: `Chat` (presentational chat thread with rich Markdown rendering, emotion avatars, tool reasoning traces, and interactive option buttons), `ChatInterface` (self-contained chat UI wired to the chat route), `ChatbotInputArea` (multi-segment input with removable badge chips and slash command triggers), `ChatbotSlashMenu` (keyboard-navigable command palette), `ChatbotWelcome` (customizable starter cards, quick command shortcuts, and clickable category badges), `ChatbotTraces` (expandable reasoning tracer with thinking avatar), `ChatbotOptionsPicker` (interactive option pills), `MarkdownRenderer` (GFM, GitHub-style callouts, syntax-highlighted copyable code blocks, zoomable images, and embedded video players), `UsageBar`, `Providers`. Import `@machi-asia/rose/styles.css` in the host root layout to pick up the chat styles.
- **Routes**: `POST ./routes/chat` (`{ history, message }` → `{ text, history, traces, emotion, optionsPayload, usage }`, requires `x-gateway-sub` and enforces tiered role usage limits), `GET ./routes/usage` (daily and weekly usage for the `ROSE` service key), `GET/POST ./routes/sessions` (list/create), `GET/PATCH/DELETE ./routes/sessions/[id]`, and `POST ./routes/sessions/[id]/chat` (chat within a persisted session).
- **Sessions**: chat threads persisted via the `rose_sessions` and `rose_session_messages` tables (see `supabase/migrations/`). Session routes require the user id from `x-gateway-sub`.
- **Assets**: 9 emotion avatars (`bright`, `coding`, `confused`, `happy`, `researching`, `sad`, `sleeping`, `surprised`, `thinking`) live in `assets/rose/` and are referenced by the components as `/rose/<emotion>.png` — host apps copy the folder into their `public/` directory.
- **Env vars**: see `packages/rose/.env.example` — requires `GEMINI_API_KEY`, `SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`, optional `SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_GATEWAY_URL`, `NEXT_PUBLIC_AUTH_API_URL`, `ROSE_DAILY_LIMIT_GUEST`, `ROSE_WEEKLY_LIMIT_GUEST`, `ROSE_DAILY_LIMIT_USER`, and `ROSE_WEEKLY_LIMIT_USER`.

### @machi-asia/ui
Animated React component library (Modal, Card, AuthModal, etc.). See `packages/ui`.

---

## 📦 Publishing Packages

Shared packages live under `packages/` and can be consumed locally via workspace linking (e.g. `@machi-asia/ui: "*"`) or published to the npm registry. Route-handler subpaths are exposed via each package's `exports` map (e.g. `@machi-asia/rose/routes/chat`).

---

## 📜 Agent Guidelines

See [`AGENTS.md`](./AGENTS.md) for mandatory duties regarding `latest.commit.txt`, commit formatting, and documentation synchronization.