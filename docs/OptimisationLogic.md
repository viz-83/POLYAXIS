# PolyAxis Phase 1 — Compliance-Constrained Trial Design Engine: Optimisation Logic Reference

## 1. Pipeline

```
Selected materials
   │
   ▼
Evidence filter (exclude materials with a prior manufacturing/regulatory/overall trial failure)
   │
   ▼
CandidateGenerator: 3 process-parameter profiles per remaining material
   │
   ▼
ConstraintChecker: manufacturing feasibility + regulatory compliance per candidate
   │
   ▼
Hard-constraint pre-filter (TRIAL-04 / REG-07) — excluded candidates recorded with a reason
   │
   ▼
TrialOptimisationEngine: 5-dimension weighted score → composite score (0–100)
   │
   ▼
Deterministic sort (composite score desc, id asc tie-break) → ranked list
   │
   ▼
RecommendationEngine: primary pick, confidence level, plain-language rationale
```

The engine is **rule-based and deterministic**: identical project inputs and identical evidence
(prior results) always produce an identical ranking (ENGINE-09). Nothing in the pipeline uses
randomness.

## 2. Manufacturing feasibility (`ConstraintChecker.manufacturingFeasibility`)

Three sub-checks, each returning a 0–1 score:

| Check | Compares | Weight in feasibility score |
|---|---|---|
| Temperature | Project's `temperatureMinC–temperatureMaxC` (line operating/extrusion window) vs. the material's `processingTempMinC–processingTempMaxC` (melt/converting window — **not** the seal-temperature range, which is a separate downstream process shown for reference only) | 45% |
| Line speed | Project's `lineSpeedMinMpm–lineSpeedMaxMpm` vs. the material's `minLineSpeedMpm–maxLineSpeedMpm` | 35% |
| Material compatibility | Free-text constraint note (e.g. "PE-compatible sealing unit only") vs. the material's polymer family | 20% |

Overlapping ranges score 1.0 (full pass) or 0.6 (partial overlap, <50% of the material's span
covered); non-overlapping ranges score 0.35 if the gap is ≤10°C / ≤15 m/min ("conditional"), or 0.0
("fail") beyond that. A material is **hard-excluded** (TRIAL-04) when the blended feasibility score
falls below 0.4 **and** the project's `constraintFlexibility` is `Hard` (the default). Setting it to
`Soft` downgrades a would-be exclusion to a scored-down candidate instead (MFG-06).

## 3. Regulatory compliance (`ConstraintChecker.regulatoryCompliance`)

For each enabled framework (UK EPR, EU PPWR), the material's recyclability percentage is compared
against `regulations.json` thresholds:

- `percent ≥ compliantThreshold` → **Compliant** (1.0)
- `conditionalThreshold ≤ percent < compliantThreshold` → **Conditionally Compliant** (0.5)
- `percent < conditionalThreshold` → **Non-Compliant** (0.0)

If any *mandatory* framework returns Non-Compliant, the candidate is hard-excluded (REG-07) and the
failing framework/threshold is recorded as the exclusion reason (REG-08). A non-mandatory
("monitoring only") framework never excludes — it only affects the regulatory dimension score.

## 4. The five scoring dimensions (`TrialOptimisationEngine`)

Every dimension is normalised to 0–1 before weighting.

### 4.1 Information Gain

```
performanceMargin = (target − actual) / target        # clamped to [-1, 1] per OTR/WVTR
                                                        # blended 50/50, or 75/25 toward the
                                                        # sensitive parameter when the project's
                                                        # productSensitivity is Oxygen- or
                                                        # Moisture-Sensitive
headroom          = clamp(performanceMargin, 0, 1)     # 0 = at/below target, 1 = far exceeds it
novelty           = 1.0 if this material has no prior recorded trial in this project, else 0.3
profileVariety    = normalised process-profile uncertainty modifier (0.9 low-temp … 1.15 high-temp)

informationGain = 0.55·headroom + 0.30·novelty + 0.15·profileVariety
```

Interpretation: a candidate that comfortably clears its performance target is treated as the most
informative trial to run next, because a physical test converts that confidence into validated
evidence at the lowest risk of an inconclusive result — the same logic a packaging engineer applies
when sequencing trials under a limited budget. Materials with no evidence yet score higher than
ones already partially tested (`novelty`).

### 4.2 Manufacturing Feasibility

Directly the blended 0–1 score from §2 above (`trial.manufacturingCheck.score`).

### 4.3 Uncertainty Reduction

```
uncertaintyReduction = 0.6·headroom + 0.4·profile.uncertaintyModifier
```

Reuses the same performance-headroom term as Information Gain but weights the process profile's
inherent variability (low-temperature/low-speed profiles are the most conservative and reduce the
least uncertainty; high-temperature/high-speed profiles carry more variability and, if they pass,
resolve more doubt about the outer edge of the process window).

### 4.4 Regulatory Compliance

Directly `trial.regulatoryCheck.score` (1.0 / 0.5 / 0.0 — see §3).

### 4.5 Cost (inverse)

```
costScore = 1 − (trialCost − minCostInBatch) / (maxCostInBatch − minCostInBatch)
```

Normalised within the current candidate batch so the cheapest trial in the run always scores 1.0
and the most expensive scores 0.0, regardless of absolute £ values.

## 5. Composite score & ranking

```
composite = 100 × ( 0.30·informationGain + 0.25·feasibility + 0.20·uncertaintyReduction
                   + 0.15·regulatory      + 0.10·cost )
```

Default weights (ENGINE-02, admin-configurable via **Admin Panel → Scoring Weights**, must sum to
100%): Information Gain 30%, Feasibility 25%, Uncertainty Reduction 20%, Regulatory 15%, Cost 10%.

The ranked list sorts by composite score descending; ties break on trial ID for full determinism.
**Confidence level** (REC-09) is derived from the gap between rank #1 and #2: ≥15 points → High,
5–14 → Medium, <5 → Low.

## 6. Evidence incorporation & re-optimisation (RESULT-04/05)

When a trial result is submitted:

1. The result is appended to `results.json` (the evidence base).
2. Any material with a recorded **Manufacturing Fail**, **Regulatory Fail**, or **Unsuccessful**
   overall result is excluded from every subsequent optimisation run for that project — it will not
   reappear in the ranked list, and the exclusion is listed with reason `evidence`.
3. The engine re-runs automatically over the remaining selected materials, so the next-best
   candidate is promoted. The rationale for the new #1 explicitly references the prior trial and
   its failure reason (RESULT-07).

## 7. Worked example (illustrative, from the seeded "Fresh Food Tray Lidding" project)

Project constraints: OTR target 5.0 cc/m²/day, WVTR target 3.0 g/m²/day, blown-film line
180–220°C / 80–120 m/min, UK EPR mandatory (≥70% compliant / ≥60% conditional).

| Material | OTR margin | Feasibility | Regulatory | Cost | → Composite (indicative) |
|---|---|---|---|---|---|
| Mono-PE 80µm + EVOH (MAT-003) | 0.64 (best margin among barrier options within budget) | 1.0 (fully inside line window) | 1.0 (72% ≥ 70%) | Mid | **Highest** |
| Mono-PE 80µm + SiOx (MAT-004) | 0.52 | 1.0 | 1.0 (74% ≥ 70%) | Lower cost score (priciest material) | 2nd |
| Mono-PP options | — | 0.0 (processing melt window ~235–260°C does not reach the 180–220°C line window) | — | — | Hard-excluded |
| Mono-PE 60µm/80µm (uncoated) | Negative (OTR/WVTR exceed target) | 1.0 | 0.5 (65–68%, conditional) | Higher cost score (cheapest) | Low — informative headroom is 0 |

This mirrors the qualitative pattern described in the requirements walkthrough (§11.3, DEMO-01):
the barrier-coated Mono-PE candidates lead, uncoated Mono-PE trails on performance headroom, and
Mono-PP is eliminated by the manufacturing temperature constraint. Exact composite scores depend on
the live candidate batch (cost is batch-normalised) — run **DEMO-01** from
[`DemoOperationGuide.md`](./DemoOperationGuide.md) to see the live figures the deployed engine
actually computes.

> **Note on the source requirements document:** a few illustrative numbers in the original
> walkthrough (§11.3) are internally inconsistent (e.g. an EU PPWR threshold quoted as both 70% and
> 80%, and "seal temperature" language applied to what is actually the extrusion/converting
> temperature window). This implementation resolves those by (a) using the *converting* temperature
> range — not the heat-seal range — for the manufacturing-line temperature check, since a blown-film
> die and a downstream sealing station run at genuinely different temperatures, and (b) defining
> explicit, admin-configurable UK EPR / EU PPWR thresholds in `regulations.json`. The scoring
> *dimensions, weights, and pipeline* strictly follow §6 Module 8 (ENGINE-01..10) of the requirements.
