const { readObject } = require('../utils/dataStore');

const DEFAULT_WEIGHTS = {
  informationGain: 0.30,
  feasibility: 0.25,
  uncertaintyReduction: 0.20,
  regulatory: 0.15,
  cost: 0.10,
};

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

/**
 * TrialOptimisationEngine — the Compliance-Constrained Trial Design Engine (Module 8).
 * Scores each feasible candidate trial across five dimensions and produces a
 * deterministic, ranked composite-score list (ENGINE-01..ENGINE-10).
 */
class TrialOptimisationEngine {
  getWeights() {
    const stored = readObject('scoring');
    if (stored && stored.weights) return stored.weights;
    return DEFAULT_WEIGHTS;
  }

  /** How much margin the material carries against a numeric target (positive = comfortably under target). */
  marginRatio(actual, target) {
    if (target == null || target === 0 || actual == null) return 0.3; // neutral default when target undefined
    return clamp((target - actual) / target, -1, 1);
  }

  /** Monotonic in margin: the more comfortably a material clears its performance target, the more
   *  confidently the engine can prioritise physically testing it next (0 = at/below target, 1 = far exceeds it). */
  headroomToInformation(margin) {
    return clamp(margin, 0, 1);
  }

  performanceHeadroom(material, requirements) {
    const sensitivity = requirements?.productSensitivity || 'Standard';
    const marginOtr = this.marginRatio(material.otr, requirements?.otrTarget);
    const marginWvtr = this.marginRatio(material.wvtr, requirements?.wvtrTarget);

    let otrWeight = 0.5;
    let wvtrWeight = 0.5;
    if (sensitivity === 'Oxygen-Sensitive') { otrWeight = 0.75; wvtrWeight = 0.25; }
    if (sensitivity === 'Moisture-Sensitive') { otrWeight = 0.25; wvtrWeight = 0.75; }

    const blendedMargin = marginOtr * otrWeight + marginWvtr * wvtrWeight;
    return { blendedMargin, marginOtr, marginWvtr };
  }

  informationGain(trial, material, requirements, priorMaterialIds) {
    const { blendedMargin } = this.performanceHeadroom(material, requirements);
    const headroom = this.headroomToInformation(blendedMargin);
    const novelty = priorMaterialIds.has(material.id) ? 0.3 : 1.0;
    const profileVariety = clamp((trial.uncertaintyModifier - 0.9) / (1.15 - 0.9), 0, 1);
    return clamp(0.55 * headroom + 0.30 * novelty + 0.15 * profileVariety, 0, 1);
  }

  uncertaintyReduction(trial, material, requirements) {
    const { blendedMargin } = this.performanceHeadroom(material, requirements);
    const headroom = this.headroomToInformation(blendedMargin);
    return clamp(0.6 * headroom + 0.4 * trial.uncertaintyModifier, 0, 1);
  }

  costScore(trial, allCosts) {
    const min = Math.min(...allCosts);
    const max = Math.max(...allCosts);
    if (max === min) return 1;
    return clamp(1 - (trial.estimatedCostGbp - min) / (max - min), 0, 1);
  }

  /**
   * @param {Array} trials - pre-filtered candidate trials (already passed hard constraints)
   * @param {Object} materialsById
   * @param {Object} requirements
   * @param {Array} priorResults - trial results already recorded for this project (evidence base)
   */
  score(trials, materialsById, requirements, priorResults = []) {
    const weights = this.getWeights();
    const allCosts = trials.map((t) => t.estimatedCostGbp);
    const priorMaterialIds = new Set(priorResults.map((r) => r.materialId));

    const scored = trials.map((trial) => {
      const material = materialsById[trial.materialId];
      const dims = {
        informationGain: this.informationGain(trial, material, requirements, priorMaterialIds),
        feasibility: trial.manufacturingCheck.score,
        uncertaintyReduction: this.uncertaintyReduction(trial, material, requirements),
        regulatory: trial.regulatoryCheck.score,
        cost: this.costScore(trial, allCosts),
      };

      const compositeRaw =
        dims.informationGain * weights.informationGain +
        dims.feasibility * weights.feasibility +
        dims.uncertaintyReduction * weights.uncertaintyReduction +
        dims.regulatory * weights.regulatory +
        dims.cost * weights.cost;

      return {
        ...trial,
        dimensionScores: dims,
        compositeScore: Math.round(compositeRaw * 100),
      };
    });

    // ENGINE-09: deterministic tie-break by trial id after score, so repeat runs on identical
    // input always yield an identical order.
    scored.sort((a, b) => b.compositeScore - a.compositeScore || a.id.localeCompare(b.id));
    return scored;
  }

  /**
   * REC-09: gap between the #1 trial and the best trial of a *different* material — comparing
   * against another profile of the same winning material would understate confidence, since
   * same-material profiles are naturally close in score.
   */
  confidenceLevel(rankedTrials) {
    if (rankedTrials.length < 2) return 'High';
    const topMaterialId = rankedTrials[0].materialId;
    const runnerUp = rankedTrials.find((t) => t.materialId !== topMaterialId);
    if (!runnerUp) return 'High';
    const gap = rankedTrials[0].compositeScore - runnerUp.compositeScore;
    if (gap >= 15) return 'High';
    if (gap >= 5) return 'Medium';
    return 'Low';
  }
}

module.exports = new TrialOptimisationEngine();
module.exports.DEFAULT_WEIGHTS = DEFAULT_WEIGHTS;
