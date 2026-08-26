# machi-asia

Unified monorepo for the **machi-asia** ecosystem, powered by [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) and [Turborepo](https://turbo.build/repo).

---

## 📁 Repository Structure

```
.
├── apps/
│   ├── api-gateway/       # Token-verifying reverse proxy & JWT gateway (Next.js)
│   ├── auth/              # Supabase Auth wrapper & token issuer service (Next.js)
│   └── tween/             # Motion-first web page builder (Next.js)
├── packages/
│   ├── ui/                # @machi-asia/ui animated React component library
│   └── media-library/     # Media asset management package
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

## 📦 Publishing Packages

Shared packages (such as `@machi-asia/ui`) live in `packages/ui` and can be consumed locally via workspace linking (`@machi-asia/ui: "*"`) or published to the npm registry.

---

## 📜 Agent Guidelines

See [`AGENTS.md`](./AGENTS.md) for mandatory duties regarding `latest.commit.txt`, commit formatting, and documentation synchronization.
