# Frontend Architecture — Modular Form Creator

Architecture overview of the React frontend: layers, data flow, and the resource lifecycle. For setup and scripts, see [`README.md`](../README.md). Backend API details live in [`backend/README.md`](../backend/README.md).

---

## 1. Product scope

The UI manages resources through a modular draft → completed lifecycle:

1. **List** — filter, sort, paginate, create, delete
2. **Draft modules** — Basic Info and Project Details updated via separate `PATCH` endpoints
3. **Provisioning** — sole status transition (`draft` → `completed`) when both modules are complete
4. **Completed edits** — temporary in-memory buffer; one explicit full-resource `PUT` from Details

Out of scope: auth, global client stores (Redux/Zustand), autosave, buffer persistence, generic form builders.

---

## 2. Stack

| Concern | Choice |
|---------|--------|
| UI | React 19, TypeScript |
| Bundler | Vite 8 |
| Routing | React Router 7 (`createBrowserRouter` / `RouterProvider`) |
| Server state | TanStack Query 5 |
| Forms | React Hook Form |
| Styling | styled-components 6 + local design-system |
| Unit / integration | Vitest + Testing Library |
| E2E | Playwright against a real backend |
| Delivery | Docker multi-stage (Node 20 → Nginx SPA) |

`VITE_API_URL` (default `http://localhost:5001`) is baked into the bundle at build time.

---

## 3. Source layout

```text
src/
├── app/                  # providers, shell, router, NotFoundPage
├── design-system/        # UI primitives + theme (given)
├── features/resources/   # product domain
├── shared/               # HTTP client, env, path helpers
└── test/setup.ts         # Vitest bootstrap
```

### Layer rules

| Layer | May depend on | Must not depend on |
|-------|---------------|--------------------|
| `app/` | features (wiring), design-system, shared | domain logic beyond wiring |
| `features/resources/routes/` | api, state, domain, ui, shared, design-system | direct `fetch` |
| `features/resources/ui/` | domain, design-system | api, state, routing workflow |
| `features/resources/state/` | domain | routes, ui |
| `features/resources/api/` | domain, shared | React UI, routes |
| `features/resources/domain/` | — (pure TypeScript) | React, Router, Query, design-system |
| `shared/` | — | features |
| `design-system/` | its own theme | features / shared API |

**Colocation:** UI used by a single route lives next to that route. Shared presentational pieces that are route-agnostic live in `ui/`.

---

## 4. Bootstrap

```text
StrictMode
  └─ AppProviders
       ThemeProvider + GlobalStyles
         QueryClientProvider
           CompletedResourceEditsProvider   ← session buffer for completed resources
             App → AppRouter
               RouterProvider
                 AppShell → Outlet → pages
```

The completed-edits provider sits **above** the router so the buffer survives in-app navigation and is cleared on full reload.

A data router is required so `useBlocker` can guard dirty completed-module forms.

Query defaults (`AppProviders`):

- `refetchOnWindowFocus: false`
- query retry at most once; no retry on `ApiError` 4xx
- mutations never retry

---

## 5. Routing

Path builders and patterns: [`src/shared/routing/paths.ts`](src/shared/routing/paths.ts).

| Path | Page |
|------|------|
| `/` | redirect → `/resources` |
| `/resources` | list |
| `/resources/:resourceId` | overview |
| `/resources/:resourceId/details` | summary / submit buffer |
| `/resources/:resourceId/basic-info` | Basic Info module |
| `/resources/:resourceId/project-details` | Project Details module |
| `*` | not found |

Production Nginx serves `index.html` for unknown paths so deep links refresh correctly.

---

## 6. HTTP

```text
shared/api/apiClient.ts   # fetch wrapper, JSON, AbortSignal
shared/api/ApiError.ts    # status + message; isApiError()
shared/config/environment.ts
```

- Feature code calls the API layer, never `fetch` directly.
- Path identifiers are `encodeURIComponent`-encoded.
- Backend `Resource` payloads map 1:1 (no extra DTO layer).

---

## 7. Feature: `resources`

```text
api / domain / state / routes / ui / test
```

### API

| Module | Role |
|--------|------|
| `resourceApi.ts` | HTTP operations (framework-free) |
| `resourceQueries.ts` | TanStack Query hooks + cache updates |
| `resourceQueryKeys.ts` | Query key factory |

| Operation | HTTP |
|-----------|------|
| List | `GET /api/resources?…` |
| Detail | `GET /api/resources/:id` |
| Create | `POST /api/resources` |
| Basic Info | `PATCH …/basic-info` |
| Project Details | `PATCH …/project-details` |
| Provision | `PATCH …/provisioning` |
| Full replace | `PUT /api/resources/:id` |
| Delete | `DELETE /api/resources/:id` |

Successful module / provision / replace mutations update the detail cache and invalidate list queries. Delete removes the detail cache entry and invalidates lists.

### Domain (pure)

Types, identifiers, name/module validation, progress/completeness, provisioning eligibility (reason codes only — UI copy stays in the overview route).

Frontend completeness checks are UX guards; the backend remains authoritative.

### Completed-edits state

Session-only buffer of module overrides for `completed` resources (not a full `Resource` clone).

| Concept | Meaning |
|---------|---------|
| **buffer** | In-memory overrides (`bufferedEdits`) |
| **edits** | Context / module naming (`CompletedResourceEdits*`) |
| **pending** | UI labels for unsaved overrides |

Context API: `getBufferedEdits`, `applyBasicInfo`, `applyProjectDetails`, `clearBufferedEdits`, `reconcileBufferedEdits`, `reconcileAndGetBufferedEdits`, `hasAnyBufferedEdits`.

Rules:

- Apply is a no-op unless `status === 'completed'`
- Buffer stores a **whole-module snapshot** (last write wins within a module)
- Persist only via Details submit (`PUT`) after confirmation
- Reload clears the buffer
- Provider warns on `beforeunload` when any buffer exists
- Dirty, unapplied module forms also use `useUnsavedChangesWarning` (`beforeunload` + SPA `useBlocker`)

### Routes

| Folder | Responsibility |
|--------|----------------|
| `routes/shared/` | Load-state resolver/view, navigation notices, module page chrome, shared link styles |
| `resources-list/` | List page, URL search params, filters, pagination, create/delete |
| `resource-overview/` | Modules, progress, provisioning |
| `resource-details/` | Summary, submit/discard buffered edits |
| `basic-info/` | Basic Info page + form |
| `project-details/` | Project Details page + form + locked view |

### Shared UI

`ResourceMetadata`, `ResourceStatusBadge`, `StatusBanner` (visual, neutral by default), `StatusLiveRegion` (`aria-live` announcements).

---

## 8. Product flows

### List

URL search params own filters, sort, and page (`pageSize` fixed at 10).

### Draft module edit

1. Overview → Basic Info / Project Details
2. Project Details stays locked until Basic Info is complete
3. Save → `PATCH` → one-shot `moduleSave` notice → Overview

### Provisioning

1. `getProvisioningEligibility` returns allow / reason codes
2. Overview maps reasons to user-facing copy
3. Confirm → `PATCH …/provisioning` → `completed`

### Completed local apply → submit

1. Module forms call `apply*` (no network)
2. Dirty forms are guarded for reload and in-app leave; local apply clears dirty (`flushSync`) before navigate
3. `localApply` notice → Details (effective values + pending badges)
4. Submit: refetch → reconcile → full `PUT` → clear buffer
5. Discard clears the buffer after confirmation

---

## 9. Where state lives

| State | Owner |
|-------|--------|
| Server resources / lists | TanStack Query |
| List filters | URL search params |
| Completed overrides | `CompletedResourceEditsProvider` |
| One-shot feedback | `location.state` notices + `StatusLiveRegion` |
| Dirty completed forms | page-local state + `useUnsavedChangesWarning` |

---

## 10. Forms and validation

- React Hook Form in route-owned `BasicInfoForm` / `ProjectDetailsForm`
- Pure validators/normalizers in `domain/resourceModuleValidation`
- Resource name is immutable after create
- Budget is digits only; no assumed currency
- Select options map from domain constants inside the forms

---

## 11. Accessibility

| Mechanism | Use |
|-----------|-----|
| `StatusLiveRegion` | Dynamic announcements (create, delete, save, apply) |
| `StatusBanner` | Static info panels; no implicit `aria-live` |
| `role="alert"` | Errors / blocked retries where needed |
| Drawers | Confirm destructive or irreversible actions |
| Focus | Design-system `:focus-visible` |

---

## 12. Testing

| Level | Tool | Location |
|-------|------|----------|
| Domain / state unit | Vitest | next to implementation |
| Route | Vitest + Testing Library | route folders |
| Cross-route integration | Vitest + Testing Library | `features/resources/test/integration/` |
| E2E | Playwright | `e2e/` |

E2E expects `docker compose up -d backend mongo` and a free (or reused) Vite port `5173`. Coverage includes the golden lifecycle, buffer loss on reload, and draft guards (locked Project Details / blocked provision).

---

## 13. Delivery

```bash
docker compose up --build
```

Services: MongoDB, backend (`:5001`), frontend Nginx (`:5173`).

---

## 14. Conventions

- **Resources** = collection; **Resource** = entity
- Verbs: `apply` (local buffer), `update`/`persist` (network), `submit` (confirmed `PUT`), `effective` (server + buffer), `resolve` (derived load state)
- No feature barrels; relative imports (no `@/` alias)
- Design-system and backend are out of feature change scope

### Design choices (present system)

| Choice | Rationale |
|--------|-----------|
| Route-colocated UI | Find screen behavior by route, not by artifact type |
| Flat `ui/` for multi-route presentation only | Avoids a catch-all components bag |
| Provisioning copy outside `domain/` | Domain returns reason codes; Overview owns wording |
| `StatusBanner` vs `StatusLiveRegion` | Visual reuse without incorrect live-region semantics |
| Shared `pathPatterns` | App router and tests stay aligned |
| Module-level buffer snapshots | Simple contract; last write wins within a module |
| Applied buffer: reload warning only | SPA leave blocked only for dirty, unapplied forms |

---

## 15. Dependency map

```text
app
  → features/resources/routes/*
  → features/resources/state/completed-edits (provider)
  → shared, design-system

routes → api | state | domain | ui | shared | design-system
ui     → domain | design-system
state  → domain
api    → domain | shared
domain → (pure)
shared → ∅
design-system → ∅
```
