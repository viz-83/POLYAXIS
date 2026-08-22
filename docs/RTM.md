# PolyAxis Phase 1 — Requirements Traceability Matrix

Maps each functional requirement ID (§6 of the requirements document) to its implementation and
verification point. "Screen" references §7 screen IDs; "Acceptance" references §12.1 checklist items.

## Module 1 — Authentication & Session Management

| ID | Implementation | Screen | Verification |
|---|---|---|---|
| AUTH-01 | `frontend/src/screens/Login.jsx` | S-00 | Manual: email/password form renders |
| AUTH-02 | `backend/services/AuthService.js`, `backend/middleware/auth.js` (`issueToken`) | — | Manual: login returns JWT |
| AUTH-03 | `frontend/src/screens/Login.jsx` (`navigate('/projects')`) | S-00→S-01 | Manual |
| AUTH-04 | `AuthService.login` generic `INVALID_CREDENTIALS` error | S-00 | Acceptance: "Invalid credentials… without revealing which field" |
| AUTH-05 | `AuthContext.logout`, `POST /api/auth/logout` | All | Manual |
| AUTH-06 | `AuthContext.jsx` idle timer (60 min) + JWT `expiresIn` | All | Acceptance: "Session expires after 60 minutes" |
| AUTH-07 | `middleware/auth.js` (`requireAdmin`), `components/ProtectedRoute.jsx` (`AdminRoute`) | S-09 | Acceptance: "Technical User cannot access Admin Panel… 403" |
| AUTH-08 | JWT in `sessionStorage`, Axios interceptor (`api/client.js`) | All | Manual |

## Module 2 — Project Management

| ID | Implementation | Screen | Verification |
|---|---|---|---|
| PROJ-01 | `POST /api/projects`, `screens/ProjectSetup.jsx` | S-02 | Acceptance |
| PROJ-02 | `validateBody` schema on `routes/projects.js` POST `/` | S-02 | Acceptance |
| PROJ-03 | `PRODUCT_TYPES` constant (`routes/projects.js`, `ProjectSetup.jsx`) | S-02 | Manual |
| PROJ-04 | `screens/ProjectList.jsx` | S-01 | Acceptance |
| PROJ-05 | `ProjectList.jsx` card (name, type badge, date, `ProgressStepper`) | S-01 | Manual |
| PROJ-06 | `ProjectList.jsx` "Resume" button routes by `project.stage` | S-01 | Acceptance |
| PROJ-07 | `PackagingEngine.STAGES`, `advanceStage()` | S-01, S-08 | Manual |
| PROJ-08 | `PATCH /api/projects/:id`, editable forms on S-02/S-03 | S-02, S-03 | Manual |
| PROJ-09 | `PackagingEngine.listProjectsForUser` (Administrator sees all) | S-09 | Manual |
| PROJ-10 | `AdminService.resetProject` | S-09 | Acceptance |

## Module 3 — Packaging Specification & Performance Requirements

| ID | Implementation | Screen |
|---|---|---|
| SPEC-01 | `PackagingEngine.saveSpecification`, `ProjectSetup.jsx` "Existing Packaging" section | S-02 |
| SPEC-02 | Same, "Target Packaging" section | S-02 |
| SPEC-03 | `requirements.otrTarget` / `wvtrTarget` | S-03 tab 1 |
| SPEC-04 | `requirements.sealStrengthMinimum` | S-03 tab 1 |
| SPEC-05 | `requirements.shelfLifeRequirementMonths` / `productSensitivity` | S-03 tab 1 |
| SPEC-06 | `requirements.recyclabilityTargetPercent` | S-03 tab 1 |
| SPEC-07 | `middleware/validate.js` (`validateBody`), inline `field-error` rendering | S-02, S-03 |
| SPEC-08 | "Save Draft" button — saves without stage advance | S-02 |
| SPEC-09 | `CandidateAlternatives.jsx` requirements summary card | S-04 |

## Module 4 — Manufacturing Constraints

| ID | Implementation | Screen |
|---|---|---|
| MFG-01 | `RequirementsConstraints.jsx` tab 2 | S-03 |
| MFG-02 | `EQUIPMENT_TYPES` constant, multi-select toggle buttons | S-03 |
| MFG-03 | `manufacturing.temperatureMinC/MaxC` | S-03 |
| MFG-04 | `manufacturing.lineSpeedMinMpm/MaxMpm` | S-03 |
| MFG-05 | `manufacturing.materialCompatibilityNote` | S-03 |
| MFG-06 | `manufacturing.constraintFlexibility` (Hard/Soft radio) | S-03 |
| MFG-07 | `ConstraintChecker.manufacturingFeasibility` (temperature/lineSpeed/compatibility sub-scores) | — |
| MFG-08 | `CandidateAlternatives.jsx` `StatusBadge` per material | S-04 |
| MFG-09 | Editing constraints + re-running `/materials-overview` and `/run-optimisation` | S-03, S-04 |

## Module 5 — Regulatory Constraints

| ID | Implementation | Screen |
|---|---|---|
| REG-01 | `RequirementsConstraints.jsx` tab 3 toggles | S-03 |
| REG-02 | `ConstraintChecker.classifyUkEpr` | — |
| REG-03 | `regulations.json` `ukEpr.compliantThreshold/conditionalThreshold` | — |
| REG-04 | `ConstraintChecker.classifyEuPpwr` | — |
| REG-05 | `regulations.json` `euPpwr.*` | — |
| REG-06 | `StatusBadge` (Compliant/Conditional/Non-Compliant) | S-04, S-05 |
| REG-07 | `ConstraintChecker.regulatoryCompliance` (`hardFail`), `CandidateGenerator.generate` pre-filter | — |
| REG-08 | `excluded[].reason` surfaced in `RecommendationPanel` "Excluded candidates" | S-05 |
| REG-09 | `AdminService.updateRegulations`, `AdminPanel.jsx` "Regulatory Rules" | S-09 |
| REG-10 | `regulations.json` | — |

## Module 6 — Candidate Materials

| ID | Implementation | Screen |
|---|---|---|
| MAT-01 | `GET /api/projects/:id/materials-overview`, `CandidateAlternatives.jsx` | S-04 |
| MAT-02 | `backend/scripts/seed.js` materials array (8 materials) | — |
| MAT-03 | Material card fields in `CandidateAlternatives.jsx` | S-04 |
| MAT-04 | `manufacturingCheck` badge per card | S-04 |
| MAT-05 | `regulatoryCheck` badge per card | S-04 |
| MAT-06 | Comparison slide-in panel (up to 3) | S-04 |
| MAT-07 | Selection checkboxes, `selected` state | S-04 |
| MAT-08 | Card dimming (`opacity-60` on hard fail) + status badges | S-04 |
| MAT-09 | `AdminService.upsertMaterial/setMaterialActive`, `AdminPanel.jsx` "Materials Library" | S-09 |
| MAT-10 | `materials.json` schema (see `docs/DataStructure.md`) | — |

## Module 7 — Trial Candidate Generator

| ID | Implementation |
|---|---|
| TRIAL-01 | `CandidateGenerator.generate` |
| TRIAL-02 | Trial record shape (`id`, `materialId`, `processParameters`, targets, feasibility, cost, `expectedOutcomeDescription`) |
| TRIAL-03 | `CandidateGenerator.buildProcessProfiles` — 3 profiles (low/mid/high) per material |
| TRIAL-04 | Hard-fail pre-filter in `CandidateGenerator.generate` + `RecommendationEngine.runOptimisation` (evidence exclusions) |
| TRIAL-05 | `CandidateGenerator.generate` caps `candidates.slice(0, 12)` |
| TRIAL-06 | Persisted to `trials.json` per run |
| TRIAL-07 | `TrialRecommendation.jsx` `LoadingBlock label="Generating candidate trials…"` |

## Module 8 — Compliance-Constrained Trial Design Engine

| ID | Implementation |
|---|---|
| ENGINE-01 | `TrialOptimisationEngine.score` — 5 dimensions computed per trial |
| ENGINE-02 | `TrialOptimisationEngine.DEFAULT_WEIGHTS` (30/25/20/15/10), `scoring.json` |
| ENGINE-03 | `informationGain()` — margin, novelty, profile variety |
| ENGINE-04 | `feasibility` = `manufacturingCheck.score` (weighted sub-checks) |
| ENGINE-05 | `regulatory` = `regulatoryCheck.score` (1.0/0.5/0.0) |
| ENGINE-06 | `.sort()` descending composite score |
| ENGINE-07 | `dimensionScores` persisted per trial, rendered via `ScoreBar.jsx` |
| ENGINE-08 | `AdminService.updateScoringWeights`, `AdminPanel.jsx` "Scoring Weights" |
| ENGINE-09 | Pure function of inputs + deterministic tie-break by `id` |
| ENGINE-10 | Synchronous in-process computation, no I/O in the scoring loop — well under 3s for ≤12 trials |

## Module 9 — Recommendation & Explanation

| ID | Implementation | Screen |
|---|---|---|
| REC-01 | `RecommendationEngine.runOptimisation` — `ranked[0]` | — |
| REC-02 | `RecommendationPanel.jsx` primary card | S-05 |
| REC-03 | `alternatives.slice(0, 4)` | S-05 |
| REC-04 | `StatusBadge` per constraint dimension | S-05 |
| REC-05 | `RecommendationEngine.buildRationale` | — |
| REC-06 | Rationale sentence structure (barrier/manufacturing/regulatory/cost/confidence) | S-05 |
| REC-07 | `recommendation.excluded[]`, "Excluded candidates" collapsible | S-05 |
| REC-08 | "Record Simulated Trial Result →" button | S-05 |
| REC-09 | `TrialOptimisationEngine.confidenceLevel` | S-05 |

## Module 10 — Simulated Trial Result & Re-optimisation

| ID | Implementation | Screen |
|---|---|---|
| RESULT-01 | `screens/TrialResult.jsx` | S-06 |
| RESULT-02 | Form fields + `validateBody` on `POST /trial-result` | S-06 |
| RESULT-03 | `measuredOtr/Wvtr/SealStrength` optional fields | S-06 |
| RESULT-04 | `RecommendationEngine.submitTrialResult` → `runOptimisation` | — |
| RESULT-05 | `excludedMaterialIdsFromEvidence` | — |
| RESULT-06 | `screens/UpdatedRecommendation.jsx` | S-07 |
| RESULT-07 | `buildRationale` prior-result sentence | S-07 |
| RESULT-08 | `RecommendationEngine.getResults` sorted chronologically | S-08 |
| RESULT-09 | Repeatable flow: S-06 → S-07 → "Record Another Trial Result →" | S-06, S-07 |
| RESULT-10 | `ProjectDashboard.jsx` "Trial History" table | S-08 |

## Module 11 — Project Dashboard

| ID | Implementation |
|---|---|
| DASH-01 | `screens/ProjectDashboard.jsx`, route `/projects/:id/dashboard` |
| DASH-02 | Project header section |
| DASH-03 | `ProgressStepper` |
| DASH-04 | `packagingSummary` (existing vs. target) |
| DASH-05 | `candidatesOverview` |
| DASH-06 | `currentRecommendation` card |
| DASH-07 | `trialHistory` table |
| DASH-08 | `keyConstraints` section |
| DASH-09 | `window.addEventListener('focus', load)` |
| DASH-10 | "Quick Actions" links |

## Module 12 — Administrator Panel

| ID | Implementation |
|---|---|
| ADMIN-01 | `routes/admin.js` (`requireAdmin`), `/admin` route wrapped in `AdminRoute` |
| ADMIN-02 | `AdminService.listAllProjects`, "All Projects" section |
| ADMIN-03 | `AdminService.resetProject` |
| ADMIN-04 | `AdminService.resetAllProjects`, "Reset Scenarios" section |
| ADMIN-05 | `AdminService.upsertMaterial`, "Materials Library" |
| ADMIN-06 | `AdminService.setMaterialActive` |
| ADMIN-07 | `AdminService.updateRegulations`, "Regulatory Rules" |
| ADMIN-08 | `AdminService.updateScoringWeights`, "Scoring Weights" |
| ADMIN-09 | `AdminService.systemStatus`, "System Status" |

## Non-functional requirements (§8)

| Area | Implementation |
|---|---|
| 8.4 Auth | JWT + bcrypt (cost 10), `SESSION_TIMEOUT_SECONDS` |
| 8.4 API protection | `requireAuth` on every router except `/api/auth/login` |
| 8.4 Admin protection | `requireAdmin` on all `/api/admin/*` |
| 8.4 Input sanitisation | `middleware/validate.js` (`sanitiseBody`) |
| 8.4 CORS | `cors({ origin: FRONTEND_ORIGIN })` in `server.js` |
| 8.3 Loading states | `LoadingBlock`, per-screen `loading`/`saving` flags |
| 8.3 Empty states | `EmptyState` component (Project List, Trial Recommendation) |
| 8.3 Validation feedback | `field-error` inline messages |
| 8.3 Responsive | Tailwind responsive utilities (`sm:`/`lg:` breakpoints) throughout |
| 8.5 Modularity | One service per backend module; one component/screen per frontend concern |
