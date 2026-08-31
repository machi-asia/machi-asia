# machi-asia

Unified monorepo for the **machi-asia** ecosystem, powered by [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) and [Turborepo](https://turbo.build/repo).

---

## 📁 Repository Structure

```
.
├── apps/
│   ├── rose/              # AI companion chatbot (Next.js, port 5000) — sessions, login, usage limits
│   ├── test/              # Dynamic TSX component explorer across all packages (Next.js, port 3005)
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

The services formerly deployed as standalone apps (`api-gateway`, `auth`, `media-library`, `rose`) now live in `packages/` as importable libraries. The deployable applications are `apps/tween`, `apps/rose`, and `apps/test`, which consume the packages.

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
npx turbo run dev --filter=test
```

The `dev` pipeline starts every workspace's watcher in parallel (`cache: false`,
`persistent: true`). Each package watches its source and re-emits both its
JavaScript bundle and TypeScript type declarations, so editing a file inside any
`packages/*` automatically recompiles that package — and the running Next.js app
dev servers (which read the packages through `transpilePackages` and the rebuilt
`dist/` output) pick the change up live.

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

### test
Dynamic TSX component explorer & playground (Next.js, dev port `3005`).
- **Dynamic Monorepo Discovery**: Scans `packages/*` at runtime to discover every `.tsx` file across all packages without manual configuration or hardcoding. Whenever a new `.tsx` file or package is added, the navigation updates automatically.
- **Live Component Sandbox**: Renders interactive component previews with dark/light themes, responsive viewports (Mobile, Tablet, Laptop, Desktop), and mock providers. Enumerable props are discovered **dynamically** — the explorer parses each package's TypeScript types and renders a dropdown for every enumerable prop on any component in any package (UI and Rose alike): literal-union props (`variant`, `size`, `direction`, `mode`, `layout`, `padding`, `initialMode`, `weekStartsOn`, `toolbar`, …), resolved across aliases and files, **plus boolean props** as `true`/`false` toggles (e.g. `RoseChat`'s `requireAuth` / `showSidebar` / `showHeader` / `showMemories` / `showUsage` / `showLogout`, `Modal.open`, `Button.loading`, `Navbar.sticky`, …). Select `RoseChat` to render the full component and live-toggle its layout switches. No hand-maintained registry.
- **Docs & Requirements Inspector**: Every package ships a `component-docs.json` manifest plus a human-readable `COMPONENTS.md` describing each component — purpose, auth requirements, required providers, environment variables, API endpoints it calls, usage snippet, and shipping notes. The **Docs & Requirements** tab renders this per component so you can tell at a glance whether a component is self-contained or needs an `AuthProvider`, env vars, mounted routes, etc.
- **Source Code & Metadata Inspector**: Displays formatted source code with syntax highlighting, line numbers, export tags, copy-to-clipboard, file stats, and dependency analysis.
- **Search & Filters**: Instant fuzzy search across all packages, with category filters (Components, Pages, Tests, Modals).
- **Live API routes**: mirrors `apps/rose` by mounting the shared route handlers — `/api/auth/*`, `/api/health`, `/api/usage`, `/api/rose/*` (chat, usage, sessions, memories), and `/api/media-library/media*` — behind a gateway-style `middleware.ts` that verifies the bearer token and injects `x-gateway-sub`/`x-gateway-roles`. API-backed previews (Rose `UsageBar`, `UsageCard`, `MediaLibraryModal`) therefore work in the explorer. See `apps/test/.env.example`.

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
- **Components**: `MediaLibraryModal`, `MediaPage`, `Providers` — built on `@machi-asia/ui`; implements upload, search, gallery/list toggle, and delete-with-confirmation, with Supabase Realtime INSERT/UPDATE sync on the `media` table. Components accept an `apiBasePath` (default: `NEXT_PUBLIC_GATEWAY_URL` + `/api/media-library`, else same-origin `/api/media-library`) and `Providers` accepts `authApiUrl`. Realtime subscribes are skipped when Supabase env vars are missing.
- **Routes**: `./routes/media` (GET list, POST upload) and `./routes/media-by-id` (DELETE soft-delete). Routes trust `x-gateway-sub` for user identity (requests are routed through the api-gateway).
- **Storage**: files uploaded to the Supabase Storage `media` bucket; metadata stored in the `media` table.
- **Env vars**: see `packages/media-library/.env.example` — requires `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_SECRET`, `NEXT_PUBLIC_GATEWAY_URL`, and optionally `MEDIA_STORAGE_BUCKET`.

Every package (`ui`, `auth`, `api-gateway`, `media-library`, `rose`) ships a machine-readable **`component-docs.json`** manifest and a human-readable **`COMPONENTS.md`** documenting auth/provider/env/API requirements per component — consumed by the `apps/test` explorer's Docs tab and useful as integration reference.

### @machi-asia/rose
Rose — an extensible AI companion skeleton and orchestrator engine powered by Google Gemini (library + Next.js route handlers). Designed as a clean, pluggable foundation for any web app to integrate chat and easily register custom tools, specialists, slash commands, and system instructions.
- **Default Tools**: general-purpose utility tools included by default (`webSearch`, `takeNotes`, `calculator`, `codeAnalyzer`, `askQuestion`, `delegateToSpecialist`).
- **Long-Term Memory**: permanent cross-conversation user memory backed by Supabase `rose_memories` table. The agent automatically calls `takeNotes` whenever important user details, preferences, constraints, or requests are detected, and loads past memories into every session prompt.
- **Extensible Registry**: easily add custom tools with `createTool` / `registerTool`, custom sub-agents with `createSpecialist` / `registerSpecialist`, custom slash categories with `createCommandCategory` / `createCommandItem`, or build custom pre-configured runners with `createAgentRunner`.
- **Components**: `RoseChat` (all-in-one full-featured chat application with session sidebar history, new chat creation, session deletion, memories settings modal, usage limit bar, dynamic emotion avatars, thinking reasoning traces, suggestion cards, interactive option pills, slash commands palette, and entity badges), `Chat` (presentational chat thread with rich Markdown rendering, emotion avatars, tool reasoning traces, user & model profile pictures, and interactive option buttons), `ChatbotInputArea` (multi-segment input with removable badge chips and slash command triggers), `ChatbotSlashMenu` (keyboard-navigable command palette), `ChatbotWelcome` (customizable starter cards, quick command shortcuts, and clickable category badges), `ChatbotTraces` (expandable reasoning tracer with thinking avatar), `ChatbotOptionsPicker` (interactive option pills), `MarkdownRenderer` (GFM, GitHub-style callouts, syntax-highlighted copyable code blocks, zoomable images, and embedded video players), `MemoriesSettingsModal` (view, search, add, edit, and delete permanent user memories), `RoseChatModal` (a compound, shippable modal wrapper around `RoseChat` with `RoseChatModalProvider`, a full-screen `RoseChatModal` overlay, and `RoseChatModalActionButton` / `RoseChatModalFloatingButton` triggers — every trigger opens the same shared modal instance via context; sidebar and header visibility are configurable via props), `UsageBar`, `Providers`. Import `@machi-asia/rose/styles.css` in the host root layout to pick up the chat styles.
- **Shippable API resolution**: all rose clients resolve their base URL through shared helpers `roseApiBase()` / `roseApiUrl()` / `roseGatewayUrl()` / `isBrowserSupabaseConfigured()`: explicit `apiBasePath` prop > `NEXT_PUBLIC_GATEWAY_URL` + `/api/rose` > same-origin `/api/rose`. `RoseChat`, `UsageBar`, and `MemoriesSettingsModal` accept `apiBasePath`; `getBrowserSupabase()` returns `null` (instead of throwing) when Supabase env vars are unset so Realtime features degrade gracefully. `Providers` defaults its auth URL to same-origin and accepts an `authApiUrl` prop.
- **Routes**: `POST ./routes/chat` (`{ history, message }` → `{ text, history, traces, emotion, optionsPayload, usage }`, requires `x-gateway-sub` and enforces tiered role usage limits), `GET ./routes/usage` (daily and weekly usage for the `ROSE` service key), `GET/POST ./routes/sessions` (list/create), `GET/PATCH/DELETE ./routes/sessions/[id]`, `POST ./routes/sessions/[id]/chat` (chat within a persisted session), `GET/POST ./routes/memories` (list/create user memories), and `PATCH/DELETE ./routes/memories/[id]` (update/delete user memory).
- **Sessions & Memories**: chat threads persisted via `rose_sessions` / `rose_session_messages`, and memories stored via `rose_memories` with RLS and user indexing (see `supabase/migrations/`). Memory and session routes require the user id from `x-gateway-sub`.
- **Assets**: 9 emotion avatars (`bright`, `coding`, `confused`, `happy`, `researching`, `sad`, `sleeping`, `surprised`, `thinking`) live in `assets/rose/` and are referenced by the components as `/rose/<emotion>.png` — host apps copy the folder into their `public/` directory.
- **Env vars**: see `packages/rose/.env.example` — requires `GEMINI_API_KEY`, `SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`, optional `SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_GATEWAY_URL`, `NEXT_PUBLIC_AUTH_API_URL`, `ROSE_DAILY_LIMIT_GUEST`, `ROSE_WEEKLY_LIMIT_GUEST`, `ROSE_DAILY_LIMIT_USER`, and `ROSE_WEEKLY_LIMIT_USER`.

### @machi-asia/ui
Animated React component library (Modal, Card, AuthModal, etc.). See `packages/ui`.

---

## 📦 Publishing Packages

Shared packages live under `packages/` and can be consumed locally via workspace linking (e.g. `@machi-asia/ui: "*"`) or published to the npm registry. Route-handler subpaths are exposed via each package's `exports` map (e.g. `@machi-asia/rose/routes/chat`).

### Shipping a component to another app

1. Read the package's `COMPONENTS.md` (or the Docs tab in `apps/test`) for the component's requirements.
2. Mount the required route handlers and gateway middleware in the host app (copy the wrapper pattern from `apps/rose` or `apps/test/app/api/*`).
3. Copy any required static assets into the host `public/` (e.g. `/rose/*.png`) or pass image-base props.
4. Set the env vars listed in `<package>/.env.example`.

---

## 📜 Agent Guidelines

See [`AGENTS.md`](./AGENTS.md) for mandatory duties regarding `latest.commit.txt`, commit formatting, and documentation synchronization.