# CLAUDE.md

Guidance for Claude Code (or any AI coding assistant) working in this repository.

## What this is

PolyAxis Phase 1 Prototype — a full-stack decision-support tool for flexible-packaging
manufacturers transitioning to recyclable mono-material structures. The centrepiece is the
**Compliance-Constrained Trial Design Engine**, a rule-based optimisation engine that ranks
candidate physical trials by expected information gain, cost, feasibility, uncertainty reduction,
and regulatory compliance.

The full functional/UI spec is [`PolyAxis_Phase1_Prototype_Requirements.md`](./PolyAxis_Phase1_Prototype_Requirements.md)
at repo root — read it before changing behaviour that touches a numbered requirement ID
(`AUTH-*`, `PROJ-*`, `SPEC-*`, `MFG-*`, `REG-*`, `MAT-*`, `TRIAL-*`, `ENGINE-*`, `REC-*`,
`RESULT-*`, `DASH-*`, `ADMIN-*`). [`docs/RTM.md`](./docs/RTM.md) maps every one of those IDs to the
file that implements it.

## Stack & structure

- **Backend**: Node.js + Express, JSON file data layer (`backend/data/*.json`, synchronous `fs`),
  JWT + bcrypt auth. Entry point `backend/server.js`.
- **Frontend**: React 18 + React Router v6 + Tailwind CSS + Axios + Context API (no Redux). Entry
  point `frontend/src/main.jsx` → `App.jsx`.
- **Six backend service modules** (`backend/services/`), each doing exactly one job:
  `PackagingEngine` (project/spec/requirements CRUD) → `ConstraintChecker` (manufacturing +
  regulatory pass/fail per material) → `CandidateGenerator` (material × process-profile trial
  generation) → `TrialOptimisationEngine` (the five-dimension scoring engine) →
  `RecommendationEngine` (orchestrates a run, builds rationale, handles trial results and
  re-optimisation) → `DashboardModule` (read-only aggregation for the dashboard). `AuthService` and
  `AdminService` sit alongside these.
- **Nine core screens + Login + Admin Panel** in `frontend/src/screens/`, one file each, matching
  §7 of the requirements document 1:1 (see the route table in `frontend/src/App.jsx`).

Full architecture write-up: [`docs/Architecture.md`](./docs/Architecture.md). Data schemas:
[`docs/DataStructure.md`](./docs/DataStructure.md). Engine formulas:
[`docs/OptimisationLogic.md`](./docs/OptimisationLogic.md).

## Running it

```bash
cd backend && npm install && cp .env.example .env   # set JWT_SECRET
npm run seed && npm run dev                            # :4000
cd ../frontend && npm install && npm run dev            # :5173
```

Demo logins are in [`docs/DemoOperationGuide.md`](./docs/DemoOperationGuide.md).

## Conventions to preserve

- **Every backend service is synchronous** (`fs.readFileSync`/`writeFileSync` via
  `backend/utils/dataStore.js`). Don't introduce async I/O into the data layer without also
  reworking every caller — the whole request pipeline currently relies on synchronous throws being
  caught by Express 4's built-in try/catch around route handlers (see `errorHandler.js`). If you add
  an async route handler, wrap it or add a catch — Express 4 does **not** auto-catch rejected
  promises.
- **`ApiError` is how routes signal HTTP errors** — `throw new ApiError(status, code, message,
  details)` from anywhere in a service or route; `middleware/errorHandler.js` turns it into
  `{ error: { code, message, details } }`. Never leak raw error objects or stack traces to the
  client.
- **Material `processingTempMinC/MaxC` vs `sealTempMinC/MaxC` are deliberately different fields.**
  The manufacturing-line temperature constraint check (`ConstraintChecker.checkTemperature`)
  compares the project's operating temperature against `processingTempMinC/MaxC` (the
  extrusion/converting melt window) — **not** the seal temperature, which is a separate downstream
  process shown on the material card for reference only. See the note in
  `docs/OptimisationLogic.md` §7 for why this distinction exists (it resolves an inconsistency in
  the original requirements walkthrough).
- **Scoring weights and regulatory thresholds are runtime config**, not constants —
  `backend/data/scoring.json` and `backend/data/regulations.json`, editable via the Admin Panel
  (`AdminService`). Don't hardcode weight values anywhere except the `DEFAULT_WEIGHTS` fallback in
  `TrialOptimisationEngine.js`.
- **The engine must stay deterministic** (ENGINE-09): no `Math.random()`, no wall-clock-dependent
  scoring, no unstable sort. The final `.sort()` in `TrialOptimisationEngine.score` breaks ties on
  trial `id` specifically to guarantee this.
- **RBAC is enforced server-side, not just hidden in the UI.** `middleware/auth.js`
  (`requireAuth`/`requireAdmin`) gates every route; `PackagingEngine.getProject` additionally
  checks resource ownership for non-Administrator users. The frontend's `ProtectedRoute`/
  `AdminRoute` wrappers are a UX convenience, not the security boundary — don't remove the backend
  checks even if a frontend guard seems to cover it.
- **Frontend screens fetch their own data** via the `useApi` hook or inline `useEffect` + `api.get`
  — there is no global project store. If a screen needs data another screen already fetched,
  re-fetch it rather than reaching across screens; this keeps each screen independently
  refresh-safe (see DASH-09's focus-triggered refetch in `ProjectDashboard.jsx`).
- **Tailwind design tokens** live in `frontend/tailwind.config.js` (`brand.*` teal palette,
  `ink.*` neutrals) and the reusable component classes (`.btn-primary`, `.card`, `.field-input`,
  etc.) in `frontend/src/index.css`. Prefer those over ad-hoc utility soup for anything that repeats
  across screens.

## Where to look for X

| Task | Start here |
|---|---|
| Change scoring formula / weights | `backend/services/TrialOptimisationEngine.js`, `docs/OptimisationLogic.md` |
| Change manufacturing/regulatory pass-fail rules | `backend/services/ConstraintChecker.js` |
| Add a field to a project sub-resource (spec/requirements/mfg/regulatory) | `backend/services/PackagingEngine.js` + matching screen in `frontend/src/screens/` + `docs/DataStructure.md` |
| Add/edit a candidate material | `backend/scripts/seed.js` (baseline) or Admin Panel → Materials Library (runtime) |
| Add a new screen | `frontend/src/screens/`, register the route in `frontend/src/App.jsx` |
| Change auth/session behaviour | `backend/middleware/auth.js` + `frontend/src/context/AuthContext.jsx` |
| Reset demo data | `npm run seed` (backend) or Admin Panel → Reset Scenarios |
