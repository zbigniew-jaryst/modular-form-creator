# Modular Form Creator

Frontend application for managing resources through a modular draft-to-completed lifecycle.

## Overview

- List, filter, sort, and paginate resources
- Create and delete resources
- Complete **Basic Info** and **Project Details** modules on draft resources (separate PATCH endpoints)
- Provision a ready draft (`draft` → `completed`) when both modules are complete
- Review a read-only resource summary on Details
- Edit completed-resource modules through a **local in-memory buffer**, then submit one explicit full-resource PUT from Details

Unsaved completed edits live only in the browser session. Reloading the page clears the buffer (the browser may warn first).

## Quick start (Docker)

```bash
docker compose up --build
```

Open [http://localhost:5173](http://localhost:5173).

Stop:

```bash
docker compose down
```

This starts MongoDB, the backend API on port `5001`, and the production frontend (Nginx) on port `5173`.

## Local development

Prerequisites: Node.js 20+, Docker (for MongoDB/backend), or a running backend at `http://localhost:5001`.

```bash
npm ci
cp .env.example .env   # optional; defaults already match localhost:5001
docker compose up -d backend mongo
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Environment

| Variable | Default | Notes |
|----------|---------|--------|
| `VITE_API_URL` | `http://localhost:5001` | API base URL baked into the Vite bundle at build time |

Changing `VITE_API_URL` for Docker requires rebuilding the frontend image (`docker compose build frontend` / `up --build`). Browser requests must use a host-accessible URL such as `http://localhost:5001`, not an internal Compose hostname.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite development server |
| `npm run build` | Typecheck + production build |
| `npm run typecheck` | TypeScript project references check only |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write across the repo |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Vitest unit/integration tests (no MongoDB required) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright E2E against a real backend |
| `npm run test:e2e:headed` | Playwright headed mode |
| `npm run storybook` | Design-system Storybook dev server |
| `npm run build-storybook` | Build Storybook static site |

## Required routes

- `/resources`
- `/resources/:resourceId`
- `/resources/:resourceId/details`
- `/resources/:resourceId/basic-info`
- `/resources/:resourceId/project-details`

Direct refresh of every route is supported (SPA fallback in the production Nginx image).

## Architecture decisions

- **Fetch API** boundary in `src/shared/api` and feature API modules
- **TanStack Query** for server state, cache, and mutations
- **React Hook Form** for module forms and validation
- **URL-owned** resource list filters, sort, and page (`pageSize` fixed at 10)
- Pure **domain selectors** for progress and provisioning eligibility; presentation helpers for labels/formatting
- **In-memory completed-resource buffer** stores module overrides (not a full cloned Resource), so server fields stay authoritative and PUT payloads stay complete
- Full **PUT** is only available from Details after explicit confirmation
- Buffer data disappears on reload by design (session-only)

## Testing strategy

- **Domain unit tests** and **component/integration tests** via Vitest (`npm run test`)
- **Real-backend Playwright tests** (`npm run test:e2e`) covering the golden lifecycle, buffer loss on reload, and draft guards
- E2E tests create uniquely named resources and delete only what they create

### Running E2E

Start backend + Mongo only (keep the Compose frontend stopped so Vite can own port `5173`):

```bash
docker compose up -d backend mongo
npx playwright install chromium
npm run test:e2e
```

Optional: set `E2E_REUSE_SERVER=1` to reuse an already-running Vite server. By default Playwright starts its own Vite process and will fail if port `5173` is already occupied.

## Important behavior

- Resource name is immutable after creation
- Project Details stays locked for drafts until Basic Info is complete
- Provisioning is the only status transition (`draft` → `completed`)
- Completed local applies do not call the backend until explicit Details submission
- Budget has no assumed currency
- Unsaved completed edits are intentionally not persisted across reload

## Reviewer notes

- Backend API documentation: [backend/README.md](backend/README.md)
- Frontend architecture: [docs/FRONTEND_ARCHITECTURE.md](docs/FRONTEND_ARCHITECTURE.md)
- Design-system source under `src/design-system` is treated as given for this assignment
