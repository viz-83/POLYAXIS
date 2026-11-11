# PolyAxis Phase 1 — Requirements Audit

Audit of the implementation against `PolyAxis_Phase1_Prototype_Requirements.md` (module IDs `AUTH-*`
… `ADMIN-*`, screens §7, non-functional §8, acceptance §12, demo scenarios §13).

**Result:** every numbered requirement is implemented. The gaps the audit found were fixed in code and
are now guarded by an automated suite. Two points the specification leaves open are listed under
*Deviations and ambiguities* rather than guessed at.

## How it was verified

| Check | Result |
|---|---|
| `cd backend && npm test` — `tests/acceptance.test.js`, 58 tests tagged by requirement ID, run against an isolated server on port 4390 with its own data | **58 / 58 pass** |
| DEMO-01 … DEMO-05 executed end to end against the engine (see `DemoOperationGuide.md`) | All pass |
| Frontend production build (`vite build`) | Compiles |
| WCAG 2.1 AA text-contrast scan (§8.3) of every signed-in screen at 1024 px: Projects, New project, Setup, Requirements, Materials, Recommendation, Trial result, Updated recommendation, Dashboard, and all 7 Admin tabs | 0 failures |
| Horizontal overflow at 375 px on the 7 project screens; primary action visible without scrolling | None; visible |
| Determinism (ENGINE-09): the same inputs produce an identical ranking across repeated runs | Test passes |
| Performance (§8.1): optimisation run and API reads inside the stated limits | Test passes |

Not covered by automation: the Login screen's photo and gradient panels (contrast was checked by
eye, not by the scanner), and a real multi-user concurrency test (the JSON data layer is single
process by design).

## Gaps found and fixed

**Engine correctness**
- Hard exclusion never triggered when only one dimension failed, because feasibility was a single
  blended score. Each dimension (temperature, line speed, compatibility) is now judged separately; any
  single failure excludes the candidate when constraint flexibility is Hard (TRIAL-04, MFG-06).
- The final sort tie-broke on a random UUID, so identical inputs could rank differently between runs.
  It now uses the unrounded composite score and then `materialId|profileId` (ENGINE-09).
- Candidates were generated from 3 profiles and the per-material min/max parameters (TRIAL-05) were
  not meaningful. Five profiles now live in `data/profiles.json`; the top 12 are kept after scoring.
- Materials had a single temperature/speed window, so DEMO-02 and DEMO-05 could not behave as
  specified. Materials carry optional per-equipment windows (`equipmentProfiles`).
- Trials now carry `performanceTargets` and a `performanceCheck`, shown on the recommendation card.

**Validation, auth and admin**
- Request bodies were not validated. `middleware/schemas.js` and `validateBody` now return
  field-level errors (SPEC-07); optional fields may be blank (SPEC-08).
- The session had a fixed lifetime. It is now a sliding inactivity timeout (AUTH-06).
- Admin could not add or edit a material. `POST` / `PATCH /api/admin/materials` and a modal with
  inline errors were added (ADMIN-05).
- Reset did not restore a project's original inputs. Demo projects are restored from `baselines.json`;
  user-created projects lose only trials and results (ADMIN-03/04). "Reset all" touches demo projects only.
- Regulatory thresholds and scoring weights are validated on save (ADMIN-07/08).
- System Status gained active sessions, uptime, last reset and data-file sizes.

**Screens**
- Candidate spec sheets show every MAT-03 field; the compare drawer gained matching rows.
- A requirements summary (SPEC-09) appears on Materials and Recommendation.
- Recommendation shows Manufacturing / Regulatory / Performance status and an information-gain tile.
- Trial result shows the "targets to beat" reminder (S-06); the updated recommendation shows the
  evidence banner (S-07).
- The dashboard has existing/target specification detail, a chronological trial history table, a
  candidates overview and quick actions, and refreshes every 20 s and on focus (DASH-09).
- Project list shows creation date; Login shows the version footer.
- The stage stepper stays visible on phones (§8.3).
- Unsaved form edits survive navigation (`useDraft`).
- Several greys and badge combinations were darkened to meet AA contrast (`ink-400`/`ink-500`, the
  active step badge, the active requirements zone caption).

## Deviations and ambiguities

1. **DEMO-02 expected materials.** The specification names only the EVOH and SiOx barrier materials
   as excluded at 100–140 m/min. In the seeded library the barrier Mono-PP variant is also below that
   speed on a cast-film line, so it is excluded too. The demonstrated behaviour (one tightened
   constraint re-orders the list) is as specified.
2. **"5 regulatory rule sets" (§13.2).** The specification does not define the five. Two frameworks
   (UK EPR, EU PPWR) are implemented as configurable rule sets. Adding more means extending
   `regulations.json`, the checker and the project's regulatory form.
3. **Historical trial outcomes.** No pre-recorded results are seeded; DEMO-04 has the operator enter
   the result live.
4. **Seal vs. processing temperature.** The line-temperature check uses the processing window, not
   the heat-seal window (see `OptimisationLogic.md` §7).
