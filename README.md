# machi-asia

Unified monorepo for the **machi-asia** ecosystem, powered by [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) and [Turborepo](https://turbo.build/repo).

---

## 📁 Repository Structure

```
.
├── apps/
│   ├── api-gateway/       # Token-verifying reverse proxy, JWT gateway & weekly usage limits (Next.js)
│   │                         Includes a usage dashboard at `/` with Supabase Realtime live updates
│   ├── auth/              # Supabase Auth wrapper & token issuer service (Next.js)
│   ├── media-library/     # CRUD app for media assets — image gallery & management (Next.js)
│   ├── rose/              # Rose — general-purpose AI companion powered by Google Gemini (Next.js)
│   └── tween/             # Motion-first web page builder (Next.js)
├── packages/
│   ├── auth/              # @machi-asia/auth shared auth provider, hooks, and AuthGate
│   └── ui/                # @machi-asia/ui animated React component library
├── .github/
│   ├── workflows/         # Monorepo CI & GitHub Actions
│   └── dependabot.yml     # Automated dependency updates across all workspaces
├── package.json           # Root workspace definitions & pipeline scripts
└── turbo.json             # Turborepo task pipeline configuration
```

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
Start all apps and watch mode across packages concurrently:
```bash
npm run dev
```

Or target a specific app:
```bash
npx turbo run dev --filter=tween
npx turbo run dev --filter=machi-asia-auth
npx turbo run dev --filter=machi-asia-api-gateway
npx turbo run dev --filter=machi-asia-media-library
npx turbo run dev --filter=machi-asia-rose
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

### api-gateway
Token-verifying reverse proxy with weekly usage limits and a real-time usage dashboard.
- **Routes**: API requests are proxied to registered microservices; `/api/usage` returns current usage stats.
- **Dashboard**: The root `/` path serves a live usage card (powered by `@machi-asia/ui` Card) that subscribes to Supabase Realtime INSERT events on the `usage_limits` table.
- **Env vars**: See `apps/api-gateway/.env.example` — requires `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_SECRET`, and `INTERNAL_GATEWAY_SECRET`.

### media-library
Image management app with upload, gallery/list views, and real-time sync.
- **Modal**: A `MediaLibraryModal` component using `@machi-asia/ui` Modal with upload, search, Gallery and Table view toggle, and delete-with-confirmation.
- **Realtime**: Subscribes to Supabase Realtime INSERT/UPDATE events on the `media` table for live updates.
- **API**: `/api/media` (GET list, POST upload) and `/api/media/[id]` (DELETE soft-delete) routes with JWT verification via jose.
- **Storage**: Files uploaded to Supabase Storage `media` bucket, metadata stored in the `media` table.
- **Env vars**: See `apps/media-library/.env.example` — requires `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_SECRET`, `NEXT_PUBLIC_AUTH_API_URL`, and optionally `MEDIA_STORAGE_BUCKET`.

### rose
General-purpose AI companion powered by Google Gemini, accessible through the api-gateway.
- **Chat API**: `POST /api/rose/chat` — accepts `{ history, message }`, returns `{ text, history, traces, emotion, optionsPayload }`.
- **Chat UI**: Full interactive chat interface at `/chat` with markdown rendering, emotion avatars, interactive option buttons, and typing indicators.
- **Tools**: Web search, calculator, code analyzer, and interactive question picker.
- **Usage**: Role-based weekly limits enforced by the api-gateway — admins: unlimited, users: 200 req/week, anonymous: blocked.
- **Env vars**: See `apps/rose/.env.example` — requires `GEMINI_API_KEY`, `INTERNAL_GATEWAY_SECRET`, and `NEXT_PUBLIC_AUTH_API_URL`.

### Packages

#### @machi-asia/auth
Shared authentication package consumed by all frontend apps.
- **AuthProvider**: Wraps app tree; manages session state, token refresh, login/register/guestLogin/logout.
- **useAuth**: Hook exposing `{ session, loading, login, register, guestLogin, logout }`.
- **AuthGate**: Composes `AuthProvider` + `AuthModal`; if no session, renders the login modal with "Continue as guest" support.
- **Token store**: localStorage-backed `saveTokens` / `loadTokens` / `clearTokens` for cross-component access token sharing.

---

## 📦 Publishing Packages

Shared packages (such as `@machi-asia/ui`) live in `packages/ui` and can be consumed locally via workspace linking (`@machi-asia/ui: "*"`) or published to the npm registry.

---

## 📜 Agent Guidelines

See [`AGENTS.md`](./AGENTS.md) for mandatory duties regarding `latest.commit.txt`, commit formatting, and documentation synchronization.
