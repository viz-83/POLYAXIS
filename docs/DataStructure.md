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
| `role` | `'Technical User' \| 'Administrator'` | |
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
| `baseTrialCostGbp` | number | |
| `typicalShelfLifeSuitability` | string | |
| `active` | boolean | Admin can disable a material from `AdminService.setMaterialActive` |

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

**Trial** (element of `ranked`): `id`, `materialId`, `materialName`, `profileId`, `trialName`,
`processParameters { temperatureC, lineSpeedMpm, sealConditions }`, `estimatedCostGbp`,
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
