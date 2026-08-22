# PolyAxis Phase 1 — Architecture

## 1. Overview

PolyAxis Phase 1 is a full-stack web application with a clear separation between the React
frontend, the Express API / business-logic layer, and a JSON file data layer.

```
┌──────────────────────────────────────────────────────┐
│                  FRONTEND (React)                     │
│  9 screens — Tailwind CSS — React Router — Axios      │
└──────────────────┬───────────────────────────────────┘
                    │ REST API (JSON, Bearer JWT)
┌──────────────────▼───────────────────────────────────┐
│              BACKEND (Node.js / Express)              │
│  Auth (JWT+bcrypt)     PackagingEngine                │
│  ConstraintChecker     CandidateGenerator              │
│  TrialOptimisationEngine   RecommendationEngine        │
│  DashboardModule       AdminService                    │
└──────────────────┬───────────────────────────────────┘
                    │ synchronous fs
┌──────────────────▼───────────────────────────────────┐
│           DATA LAYER (JSON File System)                │
│  users, projects, specifications, requirements,        │
│  manufacturing, regulatory, materials, trials,          │
│  results, regulations, scoring                          │
└──────────────────────────────────────────────────────┘
```

## 2. Backend modules

| Module | File | Responsibility |
|---|---|---|
| `PackagingEngine` | `backend/services/PackagingEngine.js` | Project CRUD, workflow-stage tracking, packaging specification, performance/manufacturing/regulatory requirement storage |
| `ConstraintChecker` | `backend/services/ConstraintChecker.js` | Manufacturing feasibility (temperature, line speed, material compatibility) and regulatory compliance (UK EPR, EU PPWR) checks per material |
| `CandidateGenerator` | `backend/services/CandidateGenerator.js` | Builds ≥3 process-parameter profiles per material and generates candidate trials, pre-filtering hard constraint failures |
| `TrialOptimisationEngine` | `backend/services/TrialOptimisationEngine.js` | The Compliance-Constrained Trial Design Engine — 5-dimension weighted scoring and deterministic ranking |
| `RecommendationEngine` | `backend/services/RecommendationEngine.js` | Orchestrates a full optimisation run, selects the primary recommendation, builds the plain-language rationale, incorporates trial results, and re-optimises |
| `DashboardModule` | `backend/services/DashboardModule.js` | Aggregates project state for the Project Dashboard screen |
| `AuthService` | `backend/services/AuthService.js` | Credential verification and JWT issuance |
| `AdminService` | `backend/services/AdminService.js` | Scenario reset, materials/regulatory/scoring configuration, system status |

## 3. Request flow — running the optimisation engine

1. Frontend `POST /api/projects/:id/run-optimisation` with the user's selected material IDs.
2. `RecommendationEngine.runOptimisation` loads the project's requirements, manufacturing
   constraints, and regulatory settings, and excludes any material that already failed a prior
   trial (evidence base).
3. `CandidateGenerator.generate` builds 3 process-parameter profiles per remaining material and
   asks `ConstraintChecker` to evaluate manufacturing feasibility and regulatory compliance for
   each; hard failures are excluded with a recorded reason.
4. `TrialOptimisationEngine.score` computes the five dimension scores and composite score for
   every surviving candidate trial and sorts them deterministically.
5. `RecommendationEngine` selects the top trial, computes a confidence level from the score gap
   between #1 and #2, writes a plain-language rationale, and persists the full run to `trials.json`.
6. The frontend renders the ranked list via `RecommendationPanel`.

## 4. API structure

See [`DataStructure.md`](./DataStructure.md) for the JSON schemas referenced below.

```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id

POST   /api/projects/:id/specification      GET  /api/projects/:id/specification
POST   /api/projects/:id/requirements       GET  /api/projects/:id/requirements
POST   /api/projects/:id/manufacturing      GET  /api/projects/:id/manufacturing
POST   /api/projects/:id/regulatory         GET  /api/projects/:id/regulatory
GET    /api/projects/:id/materials-overview

GET    /api/materials
GET    /api/materials/:id

POST   /api/projects/:id/run-optimisation
GET    /api/projects/:id/recommendation
GET    /api/projects/:id/recommendation/history

POST   /api/projects/:id/trial-result       GET  /api/projects/:id/trial-results
POST   /api/projects/:id/re-optimise

GET    /api/projects/:id/dashboard

GET    /api/admin/scenarios                 POST /api/admin/scenarios/reset
GET    /api/admin/materials                 PATCH /api/admin/materials/:id[/active]
GET    /api/admin/regulations                PATCH /api/admin/regulations
GET    /api/admin/scoring                     PATCH /api/admin/scoring
GET    /api/admin/status
```

Every route except `/api/auth/login` requires `Authorization: Bearer <token>`. Every
`/api/admin/*` route additionally requires the `Administrator` role (`middleware/auth.js`).

## 5. Security architecture

- **AuthN**: stateless JWT (`jsonwebtoken`), 60-minute expiry, bcrypt password hashing (cost 10).
- **AuthZ**: `requireAuth` + `requireAdmin` middleware; every project-scoped route additionally
  checks resource ownership (`PackagingEngine.getProject` throws 403 for a non-owner Technical
  User; Administrators can access all projects).
- **Transport hardening**: Helmet security headers, CORS locked to `FRONTEND_ORIGIN`, JSON body
  size limit, rate limiting (global + a tighter limiter on `/api/auth/login`).
- **Input handling**: `sanitiseBody` strips HTML-significant characters from every request body;
  `validateBody` enforces required/type/enum/range rules per route and returns field-level errors.
- **Error handling**: a single `errorHandler` middleware returns structured `{ error: { code,
  message } }` JSON and never leaks stack traces to the client.

## 6. Frontend architecture

- **Routing**: React Router v6 with a `ProtectedRoute` wrapper (redirects unauthenticated users to
  `/login`) and an `AdminRoute` wrapper (renders a 403 notice for non-Administrator users).
- **State**: `AuthContext` (session/user/idle-timeout) and `ToastContext` (notifications) via
  Context API; screen-local state via `useState`; data fetching via the `useApi` hook.
- **API client**: a single Axios instance (`src/api/client.js`) injects the bearer token on every
  request and triggers a session-expiry logout on any `401` response.
- **Screens** map 1:1 to the 9 core screens + Login + Admin Panel defined in §7 of the
  requirements document.

## 7. Data layer & Phase 2 migration path

The JSON file layer (`backend/utils/dataStore.js`) uses synchronous `fs` reads/writes with
relational-style foreign keys (`projectId`, `materialId`, …) and ISO 8601 timestamps throughout,
so each collection maps directly onto a future PostgreSQL table without restructuring — see
[`DataStructure.md`](./DataStructure.md).
