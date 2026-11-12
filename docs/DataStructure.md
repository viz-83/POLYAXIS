# PolyAxis Phase 1 — Data Structure Reference

All collections live as JSON arrays in `backend/data/*.json` (config singletons `regulations.json`,
`scoring.json`, `systemStatus.json` are plain objects). Every record uses relational-style IDs
(`id`, `projectId`, `materialId`, …) and ISO 8601 timestamps so the schema below maps directly onto
PostgreSQL tables in Phase 2 (§10.4 of the requirements document).

## `users.json`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `name` | string | |
| `email` | string | Unique, used for login |
| `passwordHash` | string | bcrypt, cost 10 |
| `role` | `'Technical User' \| 'Administrator'` | Access-control role (spec §4) — the only field authorization looks at |
| `jobTitle` | string | Display only (e.g. `Project Engineer`); shown on the login tiles and in the app header. Falls back to `role` when absent |
| `createdAt` | ISO 8601 | |

## `projects.json`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `userId` | uuid | FK → `users.id` (owner) |
| `name`, `productType`, `description`, `transitionObjective` | string | |
| `stage` | `'Specification'\|'Requirements'\|'Materials'\|'Optimisation'\|'Results'` | Current workflow stage |
| `stagesCompleted` | string[] | Completed stage names |
| `createdAt`, `updatedAt` | ISO 8601 | |

## `specifications.json` (one per project)

`projectId` (FK), `existingMaterial`, `layerStructure`, `currentShelfLifeMonths`, `currentOtr`,
`currentWvtr`, `currentRecyclabilityStatus`, `targetMaterialType`, `targetRecyclabilityPercent`,
`targetRecyclingStream`, `transitionPriority`, `updatedAt`.

## `requirements.json` (one per project)

`projectId` (FK), `otrTarget`, `wvtrTarget`, `sealStrengthMinimum`, `shelfLifeRequirementMonths`,
`productSensitivity` (`Standard\|Moisture-Sensitive\|Oxygen-Sensitive\|Both`),
`recyclabilityTargetPercent`, `additionalParameters`, `updatedAt`.

## `manufacturing.json` (one per project)

`projectId` (FK), `equipmentTypes` (string[]), `temperatureMinC`, `temperatureMaxC`,
`lineSpeedMinMpm`, `lineSpeedMaxMpm`, `materialCompatibilityNote`,
`constraintFlexibility` (`Hard\|Soft`), `updatedAt`.

## `regulatory.json` (one per project)

`projectId` (FK), `ukEprEnabled`, `ukEprMandatory`, `euPpwrEnabled`, `euPpwrMandatory`,
`classificationPriority` (`UK EPR\|EU PPWR\|Most Restrictive`), `notes`, `updatedAt`.

## `materials.json` (shared library, admin-configurable)

| Field | Type | Notes |
|---|---|---|
| `id` | string | e.g. `MAT-003` |
| `name`, `polymerFamily`, `barrierType`, `layerStructure` | string | |
| `otr` (cc/m²/day), `wvtr` (g/m²/day) | number | |
| `sealTempMinC`, `sealTempMaxC` | number | Downstream heat-seal window (display only) |
| `processingTempMinC`, `processingTempMaxC` | number | Extrusion/converting melt window — compared against the project's manufacturing operating-temperature range |
| `minLineSpeedMpm`, `maxLineSpeedMpm` | number | Compared against the project's line-speed constraint |
| `ukEprRecyclabilityPercent`, `euPpwrRecyclabilityPercent` | number | Compared against `regulations.json` thresholds |
| `equipmentProfiles` | `{ [equipmentType]: { processingTempMinC, processingTempMaxC, minLineSpeedMpm, maxLineSpeedMpm } }` | Optional per-equipment overrides of the default windows above; `ConstraintChecker.windowsFor` uses them when the project's equipment type matches |
| `baseTrialCostGbp` | number | |
| `typicalShelfLifeSuitability` | string | |
| `active` | boolean | Admin can disable a material from `AdminService.setMaterialActive` |

Admins add (`POST /api/admin/materials`, id auto-assigned as `MAT-00N`) and edit
(`PATCH /api/admin/materials/:id`) materials; both are validated by `middleware/schemas.js`.

## `trials.json` (one record per optimisation run)

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `projectId` | uuid (FK) | |
| `selectedMaterialIds` | string[] | Materials the user chose for this run |
| `generatedAt` | ISO 8601 | |
| `ranked` | Trial[] | See below — sorted by `compositeScore` desc |
| `excluded` | `{ materialId, materialName, trialName?, reasonType, reason }[]` | Hard-filtered candidates |
| `primaryRecommendationId` | string | `ranked[].id` of the top trial |
| `confidence` | `'High'\|'Medium'\|'Low'` | Derived from the #1/#2 score gap |
| `rationale` | string | Plain-language explanation |
| `basedOnResultId` | string \| null | Last result incorporated, if any |
| `trimmedCount` | number | Candidates scored but dropped because only the top 12 (`MAX_TRIALS_PER_RUN`) are kept |
| `weights` | object | The scoring weights in force when this run was produced |

**Trial** (element of `ranked`): `id`, `materialId`, `materialName`, `profileId`, `trialName`,
`processParameters { temperatureC, lineSpeedMpm, sealConditions, equipment }`, `performanceTargets`,
`performanceCheck { status, reason }`, `estimatedCostGbp`,
`manufacturingCheck { status, score, reason, dimensions }`, `regulatoryCheck { status, score,
reason, frameworks }`, `dimensionScores { informationGain, feasibility, uncertaintyReduction,
regulatory, cost }` (each 0–1), `compositeScore` (0–100), `expectedOutcomeDescription`.

## `results.json`

`id`, `projectId` (FK), `trialId`, `trialName`, `materialId`, `performanceResult` (`Pass\|Fail`),
`manufacturingResult` (`Pass\|Fail`), `regulatoryResult` (`Pass\|Fail`), `overallResult`
(`Successful\|Unsuccessful`), `failureReason`, `measuredOtr`, `measuredWvtr`,
`measuredSealStrength`, `notes`, `trialDate`, `recordedByUserId`, `recordedAt`.

## `regulations.json` (singleton object)

```json
{
  "ukEpr":  { "label": "...", "compliantThreshold": 70, "conditionalThreshold": 60, "description": "..." },
  "euPpwr": { "label": "...", "compliantThreshold": 75, "conditionalThreshold": 70, "description": "..." },
  "updatedAt": "..."
}
```

## `scoring.json` (singleton object)

```json
{ "weights": { "informationGain": 0.30, "feasibility": 0.25, "uncertaintyReduction": 0.20, "regulatory": 0.15, "cost": 0.10 } }
```

## `systemStatus.json` (singleton object)

`{ "lastResetAt": "...", "seededAt": "..." }`

## `profiles.json` (array, seeded)

The five process-parameter profiles the `CandidateGenerator` expands every material into:
`{ id, name, tempPosition (0–1 across the usable overlap), costModifier, uncertaintyModifier,
sealConditions }` — low-temp, low-mid-temp, mid-temp, upper-mid-temp, high-temp. If the file is
missing the generator falls back to three built-in profiles.

## `baselines.json` (array, seeded)

A pristine copy of each demo project's inputs (project, specification, requirements, manufacturing,
regulatory). **Admin → Reset** restores a demo project from this file; non-demo (user-created)
projects only lose their trials/results and have their stage recalculated.

## Session activity (in memory, not persisted)

`utils/sessionTracker.js` records the last request time per user so **System Status** can show
active sessions. The sliding session works through the `X-Session-Token` response header: once a
token is older than `SESSION_REFRESH_AFTER_SECONDS` (default 300) the API returns a fresh one, which
the frontend's Axios interceptor stores.
