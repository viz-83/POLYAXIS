# PolyAxis Phase 1 — Demo Operation Guide

## Demo accounts

| Name | Email | Password | Role | Seeded project |
|---|---|---|---|---|
| Alex Chapman | `alex.chapman@polyaxis-demo.com` | `Demo2026!` | Technical User | Fresh Food Tray Lidding — PE/PA to Mono-PE |
| Sarah Mitchell | `sarah.mitchell@polyaxis-demo.com` | `Demo2026!` | Technical User | Snack Pouch — OPP/PE to Mono-PP |
| James Okafor | `james.okafor@polyaxis-demo.com` | `Demo2026!` | Technical User | Industrial Stretch Wrap — Multi-layer to Barrier Mono-PE |
| Admin User | `admin@polyaxis-demo.com` | `Admin2026!` | Administrator | Full system access |

Run `npm run seed` from `backend/` (or **Admin Panel → Reset Scenarios → Reset All**) before any
demonstration to return all three projects to their baseline state: specification, performance
requirements, manufacturing constraints, and regulatory frameworks entered — no trials or results
recorded yet.

---

## DEMO-01 — Standard Recommendation

**Login:** Alex Chapman

1. Open **"Fresh Food Tray Lidding — PE/PA to Mono-PE"** from the Project List → **Resume**.
2. Review **Requirements & Constraints**: OTR ≤ 5.0, WVTR ≤ 3.0, blown-film line 180–220°C /
   80–120 m/min, UK EPR mandatory (≥70% compliant threshold).
3. Go to **Candidate Alternatives**. Select the four Mono-PE variants (60µm, 80µm, 80µm+EVOH,
   80µm+SiOx) and click **Generate Trials & Optimise →**.
4. On **Trial Recommendation**, observe:
   - The two Mono-PP materials never appear as selectable feasible candidates when included — their
     converting temperature window (~235–260°C) does not reach the line's 180–220°C window, so they
     are hard-excluded on manufacturing feasibility (visible under "Excluded candidates" if selected).
   - **Mono-PE 80µm + EVOH barrier** ranks first: it has the best margin against the OTR/WVTR
     targets among the barrier options, full manufacturing feasibility, and full UK EPR compliance
     (72% ≥ 70%).
   - The rationale card explains the ranking in plain language, referencing barrier performance,
     manufacturing compatibility, regulatory compliance, cost, and confidence.

**Key demo point:** the engine explains *why* a specific trial was prioritised — not a black box.

---

## DEMO-02 — Manufacturing Constraint Filter

**Login:** Sarah Mitchell

1. Open **"Snack Pouch — OPP/PE to Mono-PP"**.
2. On **Requirements & Constraints → Manufacturing Constraints**, confirm/set line speed to
   **100–140 m/min** (Cast Film Line, 160–190°C) and save.
3. Go to **Candidate Alternatives** — note the manufacturing compatibility badges update
   immediately for materials whose `minLineSpeedMpm–maxLineSpeedMpm` no longer reaches the
   tightened range.
4. Select several candidates (include at least one barrier-coated Mono-PE and the Mono-PP options)
   and **Generate Trials & Optimise →**.
5. Observe that materials whose processing speed range falls short of 100–140 m/min are scored down
   or excluded, visibly shifting the ranking versus an unconstrained run.

**Key demo point:** tightening a single manufacturing constraint visibly re-orders the ranked list —
the manufacturing feasibility engine is live, not cosmetic.

---

## DEMO-03 — Regulatory Constraint Exclusion

**Login:** James Okafor

1. Open **"Industrial Stretch Wrap — Multi-layer to Barrier Mono-PE"**.
2. Confirm **Regulatory Frameworks**: EU PPWR **mandatory**, UK EPR monitoring only.
3. Go to **Candidate Alternatives**, select all Mono-PE variants, and **Generate Trials &
   Optimise →**.
4. Observe: materials below the EU PPWR conditional threshold (65%, 68%, 69% recyclability —
   Mono-PE 60µm, 80µm, and Bio-based Mono-PE) are hard-excluded with the reason naming EU PPWR and
   the threshold; materials at 70%+ remain in the ranked list.
5. Expand **"Excluded candidates"** to show the regulatory exclusion reason independently of any
   manufacturing constraint.

**Key demo point:** the regulatory constraint engine operates independently of the manufacturing
engine — a material can pass manufacturing feasibility and still be excluded purely on regulatory
grounds (REG-07/REG-08).

---

## DEMO-04 — Re-optimisation After a Trial Result

**Login:** Alex Chapman (continuation of DEMO-01)

1. From the **Trial Recommendation** screen (Mono-PE 80µm + EVOH ranked #1), click **Record
   Simulated Trial Result →**.
2. Enter the pre-scripted Round 1 outcome:
   - Performance: **Pass**
   - Manufacturing: **Fail**
   - Regulatory: **Pass**
   - Failure reason: *"Seal unit temperature variance caused inconsistent seal formation at target
     line speed."*
   - Overall result auto-sets to **Unsuccessful**.
3. Click **Submit Result & Re-optimise →**.
4. On **Updated Recommendation**, observe:
   - The evidence banner: *"Recommendation updated following Mono-PE 80µm + EVOH barrier
     coating — Standard process-window profile result… Manufacturing: ❌ … Overall: Unsuccessful."*
   - Mono-PE 80µm + EVOH no longer appears in the ranked list (excluded — evidence-based).
   - **Mono-PE 80µm + SiOx barrier** is promoted to the new primary recommendation, and its
     rationale explicitly references the prior trial's failure.

**Key demo point:** the platform learns from physical trial outcomes and reprioritises automatically
— evidence-driven iteration, not a one-shot recommendation.

---

## DEMO-05 — Constraint Sensitivity (live, interactive)

**Login:** Alex Chapman (same project as DEMO-01/04)

1. Go to **Requirements & Constraints → Manufacturing Constraints**.
2. Live, in front of the audience, tighten the operating temperature range from **180–220°C** to
   **160–180°C** and save.
3. Return to **Candidate Alternatives** — compatibility badges update immediately.
4. Click **↻ Re-run Optimisation** on the **Trial Recommendation** screen (or regenerate trials).
5. Observe the ranking shift as materials whose converting-temperature window no longer overlaps
   the tightened 160–180°C range lose manufacturing feasibility score, changing which trial is
   prioritised.

**Key demo point:** the engine responds to constraint changes in real time — demonstrating the value
of structured constraint modelling over a static spreadsheet-based assessment.

---

## Resetting between demonstrations

**Admin Panel → Reset Scenarios**: reset an individual project (per-row **Reset Scenario** button
under **All Projects**) or click **Reset All Demo Scenarios** to return every seeded project to its
baseline state in one action (ADMIN-03/04).
