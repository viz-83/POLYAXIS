const { v4: uuid } = require('uuid');
const { readCollection, writeCollection, nowIso } = require('../utils/dataStore');
const { ApiError } = require('../middleware/errorHandler');
const PackagingEngine = require('./PackagingEngine');
const ConstraintChecker = require('./ConstraintChecker');
const CandidateGenerator = require('./CandidateGenerator');
const TrialOptimisationEngine = require('./TrialOptimisationEngine');

const MAX_TRIALS_PER_RUN = 12; // TRIAL-05

function fmt(n, digits = 1) {
  return typeof n === 'number' ? n.toFixed(digits) : n;
}

/**
 * RecommendationEngine — selects the top-ranked trial, generates the plain-language
 * rationale, and incorporates simulated trial results back into the evidence base for
 * re-optimisation (Modules 9 & 10).
 */
class RecommendationEngine {
  getActiveMaterials(ids) {
    const materials = readCollection('materials').filter((m) => m.active !== false);
    const chosen = ids && ids.length ? materials.filter((m) => ids.includes(m.id)) : materials;
    if (ids && ids.length && chosen.length !== ids.length) {
      throw new ApiError(400, 'INVALID_MATERIALS', 'One or more selected materials could not be found.');
    }
    return chosen;
  }

  /** Materials with a prior manufacturing or regulatory failure are struck from further trials (RESULT-05). */
  excludedMaterialIdsFromEvidence(priorResults) {
    const ids = new Set();
    for (const r of priorResults) {
      if (r.manufacturingResult === 'Fail' || r.regulatoryResult === 'Fail' || r.overallResult === 'Unsuccessful') {
        ids.add(r.materialId);
      }
    }
    return ids;
  }

  runOptimisation(projectId, user, selectedMaterialIds) {
    const project = PackagingEngine.getProject(projectId, user);
    const requirements = PackagingEngine.getRequirements(projectId);
    const manufacturing = PackagingEngine.getManufacturing(projectId);
    const regulatorySettings = PackagingEngine.getRegulatory(projectId);
    const regulations = ConstraintChecker.regulations();

    if (!requirements || !manufacturing || !regulatorySettings) {
      throw new ApiError(400, 'INCOMPLETE_PROJECT', 'Complete performance requirements, manufacturing constraints, and regulatory frameworks before running the optimisation engine.');
    }

    const priorResults = readCollection('results').filter((r) => r.projectId === projectId);
    const excludedByEvidence = this.excludedMaterialIdsFromEvidence(priorResults);

    let materials = this.getActiveMaterials(selectedMaterialIds);
    const requestedMaterialIds = materials.map((m) => m.id); // before evidence filtering, so re-runs keep the full shortlist
    const evidenceExcluded = materials.filter((m) => excludedByEvidence.has(m.id));
    materials = materials.filter((m) => !excludedByEvidence.has(m.id));

    const { candidates, excluded } = CandidateGenerator.generate(materials, {
      manufacturing,
      regulatorySettings,
      regulations,
      requirements,
    });

    const materialsById = Object.fromEntries(readCollection('materials').map((m) => [m.id, m]));
    // Score EVERY candidate (cost is normalised across the whole batch), then keep the best MAX_TRIALS_PER_RUN
    // (TRIAL-05). Trimming by score — rather than slicing candidates in generation order — means no material is
    // silently dropped just because it appeared later in the list.
    const allScored = TrialOptimisationEngine.score(candidates, materialsById, requirements, priorResults);
    const ranked = allScored.slice(0, MAX_TRIALS_PER_RUN);
    const trimmedCount = allScored.length - ranked.length;
    const confidence = TrialOptimisationEngine.confidenceLevel(ranked);

    const fullExcluded = [
      ...excluded,
      ...evidenceExcluded.map((m) => ({
        materialId: m.id,
        materialName: m.name,
        reasonType: 'evidence',
        reason: `Excluded following a prior recorded trial failure for ${m.name}.`,
      })),
    ];

    const primary = ranked[0] || null;
    const rationale = primary
      ? this.buildRationale(primary, materialsById[primary.materialId], ranked, requirements, manufacturing, regulatorySettings, priorResults)
      : 'No feasible candidate trials remain — every selected material failed a mandatory manufacturing or regulatory constraint. Adjust constraints or select additional candidate materials.';

    const record = {
      id: uuid(),
      projectId,
      selectedMaterialIds: requestedMaterialIds,
      weights: TrialOptimisationEngine.getWeights(), // weights in force for this run, for score-composition charts
      generatedAt: nowIso(),
      ranked,
      trimmedCount, // lower-scoring trials beyond the 12-trial cap
      excluded: fullExcluded,
      primaryRecommendationId: primary ? primary.id : null,
      confidence,
      rationale,
      basedOnResultId: priorResults.length ? priorResults[priorResults.length - 1].id : null,
    };

    const trialsCollection = readCollection('trials');
    trialsCollection.push(record);
    writeCollection('trials', trialsCollection);

    // Completing "Materials" (running the engine) advances the project into "Optimisation" (PROJ-07).
    PackagingEngine.advanceStage(projectId, 'Materials');

    return record;
  }

  buildRationale(primary, material, ranked, requirements, manufacturing, regulatorySettings, priorResults) {
    const sentences = [];

    if (priorResults.length) {
      const last = priorResults[priorResults.length - 1];
      const failedDim = last.overallResult === 'Unsuccessful'
        ? (last.manufacturingResult === 'Fail' ? 'manufacturing' : last.regulatoryResult === 'Fail' ? 'regulatory' : 'performance')
        : null;
      if (failedDim) {
        sentences.push(`Following the ${last.trialName} trial, which failed on ${failedDim} (${last.failureReason || 'see trial history'}), the ranking has been updated and that candidate has been deprioritised.`);
      } else {
        sentences.push(`Following the successful ${last.trialName} trial, the evidence base has been updated and the ranking refreshed accordingly.`);
      }
    }

    sentences.push(
      `${primary.trialName} is recommended as the priority trial because it achieves the highest expected information gain for this packaging transition.`
    );
    sentences.push(
      `Its OTR of ${fmt(material.otr)} cc/m²/day and WVTR of ${fmt(material.wvtr)} g/m²/day provide margin against your ${requirements.otrTarget ?? '—'} cc/m²/day and ${requirements.wvtrTarget ?? '—'} g/m²/day targets, and its ${material.processingTempMinC}–${material.processingTempMaxC}°C processing window scores ${Math.round(primary.dimensionScores.feasibility * 100)}% on manufacturing feasibility against your ${manufacturing.temperatureMinC}–${manufacturing.temperatureMaxC}°C line window.`
    );
    sentences.push(
      `It achieves ${material.ukEprRecyclabilityPercent}% recyclability under UK EPR classification${regulatorySettings.euPpwrEnabled ? ` and ${material.euPpwrRecyclabilityPercent}% under EU PPWR design criteria` : ''}, scoring ${Math.round(primary.dimensionScores.regulatory * 100)}% on regulatory compliance.`
    );
    sentences.push(
      `Estimated trial cost is £${primary.estimatedCostGbp.toLocaleString('en-GB')}. Composite score: ${primary.compositeScore}/100.`
    );

    return sentences.join(' ');
  }

  getLatestRecommendation(projectId) {
    const all = readCollection('trials').filter((t) => t.projectId === projectId);
    if (!all.length) return null;
    return all.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))[0];
  }

  getAllRuns(projectId) {
    return readCollection('trials')
      .filter((t) => t.projectId === projectId)
      .sort((a, b) => new Date(a.generatedAt) - new Date(b.generatedAt));
  }

  submitTrialResult(projectId, user, payload) {
    const latest = this.getLatestRecommendation(projectId);
    if (!latest) {
      throw new ApiError(400, 'NO_RECOMMENDATION', 'Run the optimisation engine before recording a trial result.');
    }
    const trial = latest.ranked.find((t) => t.id === payload.trialId) || latest.ranked.find((t) => t.id === latest.primaryRecommendationId);
    if (!trial) {
      throw new ApiError(400, 'TRIAL_NOT_FOUND', 'The referenced trial could not be found in the current recommendation.');
    }

    const anyFail = [payload.performanceResult, payload.manufacturingResult, payload.regulatoryResult].includes('Fail');
    if (anyFail && !payload.failureReason) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Failure reason is required when any result dimension is Fail.', { failureReason: 'Required when any dimension fails.' });
    }

    const overallResult = payload.overallResult || (anyFail ? 'Unsuccessful' : 'Successful');

    const results = readCollection('results');
    const record = {
      id: uuid(),
      projectId,
      trialId: trial.id,
      trialName: trial.trialName,
      materialId: trial.materialId,
      performanceResult: payload.performanceResult,
      manufacturingResult: payload.manufacturingResult,
      regulatoryResult: payload.regulatoryResult,
      overallResult,
      failureReason: payload.failureReason || '',
      measuredOtr: payload.measuredOtr ?? null,
      measuredWvtr: payload.measuredWvtr ?? null,
      measuredSealStrength: payload.measuredSealStrength ?? null,
      notes: payload.notes || '',
      trialDate: payload.trialDate || nowIso().slice(0, 10),
      recordedByUserId: user.id,
      recordedAt: nowIso(),
    };
    results.push(record);
    writeCollection('results', results);

    PackagingEngine.advanceStage(projectId, 'Optimisation');
    PackagingEngine.advanceStage(projectId, 'Results');

    const updated = this.runOptimisation(projectId, user, latest.selectedMaterialIds);
    return { result: record, updatedRecommendation: updated };
  }

  reOptimise(projectId, user) {
    const latest = this.getLatestRecommendation(projectId);
    const selectedIds = latest ? latest.selectedMaterialIds : null;
    return this.runOptimisation(projectId, user, selectedIds);
  }

  getResults(projectId) {
    return readCollection('results')
      .filter((r) => r.projectId === projectId)
      .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
  }
}

module.exports = new RecommendationEngine();
