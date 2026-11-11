const { v4: uuid } = require('uuid');
const { readCollection } = require('../utils/dataStore');
const ConstraintChecker = require('./ConstraintChecker');

// Only used if data/profiles.json is missing — the controlled dataset normally supplies these (TRIAL-03).
const FALLBACK_PROFILES = [
  { id: 'low-temp', label: 'Low-temperature / low-speed profile', tempPosition: 0, speedPosition: 0, sealConditions: 'Conservative seal dwell (+15%), lower throughput', costMultiplier: 1.0, uncertaintyModifier: 0.9 },
  { id: 'mid-temp', label: 'Standard process-window profile', tempPosition: 0.5, speedPosition: 0.5, sealConditions: 'Standard seal dwell, nominal throughput', costMultiplier: 1.12, uncertaintyModifier: 1.0 },
  { id: 'high-temp', label: 'High-temperature / high-speed profile', tempPosition: 1, speedPosition: 1, sealConditions: 'Reduced seal dwell (-10%), higher throughput', costMultiplier: 1.22, uncertaintyModifier: 1.15 },
];

/**
 * CandidateGenerator — builds candidate physical trials from material × process parameter
 * combinations (Module 7), then applies the ConstraintChecker pre-filter (TRIAL-04) before scoring.
 * Deterministic: identical inputs -> identical candidates in identical order.
 */
class CandidateGenerator {
  getProfiles() {
    const stored = readCollection('profiles');
    return stored.length >= 3 ? stored : FALLBACK_PROFILES;
  }

  /** TRIAL-03: the dataset's process-parameter profiles (≥3) applied to this material on the chosen equipment. */
  buildProcessProfiles(material, manufacturing, equipment) {
    const win = ConstraintChecker.windowsFor(material, equipment);

    // Run the trial inside the overlap of the line's window and the material's window when there is one.
    let tLo = win.tempMin;
    let tHi = win.tempMax;
    if (manufacturing?.temperatureMinC != null && manufacturing?.temperatureMaxC != null) {
      const lo = Math.max(tLo, manufacturing.temperatureMinC);
      const hi = Math.min(tHi, manufacturing.temperatureMaxC);
      if (lo <= hi) { tLo = lo; tHi = hi; }
    }
    const sLo = manufacturing?.lineSpeedMinMpm ?? win.speedMin;
    const sHi = manufacturing?.lineSpeedMaxMpm ?? win.speedMax;

    return this.getProfiles().map((p) => ({
      profileId: p.id,
      label: p.label,
      processTempC: Math.round(tLo + p.tempPosition * (tHi - tLo)),
      lineSpeedMpm: Math.round(sLo + p.speedPosition * (sHi - sLo)),
      sealConditions: p.sealConditions,
      costMultiplier: p.costMultiplier,
      uncertaintyModifier: p.uncertaintyModifier,
      operatingWindowRef: `${manufacturing?.temperatureMinC ?? '—'}–${manufacturing?.temperatureMaxC ?? '—'}°C line window`,
    }));
  }

  /**
   * @param {Array} materials - selected candidate materials (MAT-07)
   * @param {Object} context - { manufacturing, regulatorySettings, regulations, requirements }
   * @returns {{ candidates: Array, excluded: Array }} candidates are NOT capped here — the engine scores them
   *          all and the RecommendationEngine keeps the best 12 (TRIAL-05), so no material is dropped blindly.
   */
  generate(materials, context) {
    const { manufacturing, regulatorySettings, regulations, requirements } = context;
    const candidates = [];
    const excluded = [];

    const performanceTargets = {
      otrTarget: requirements?.otrTarget ?? null,
      wvtrTarget: requirements?.wvtrTarget ?? null,
      sealStrengthMinimum: requirements?.sealStrengthMinimum ?? null,
      shelfLifeRequirementMonths: requirements?.shelfLifeRequirementMonths ?? null,
    };

    for (const material of materials) {
      const manufacturingCheck = ConstraintChecker.manufacturingFeasibility(material, manufacturing);
      const regulatoryCheck = ConstraintChecker.regulatoryCompliance(material, regulatorySettings, regulations);
      const performanceCheck = ConstraintChecker.performanceCheck(material, requirements);

      if (regulatoryCheck.hardFail) {
        excluded.push({ materialId: material.id, materialName: material.name, reasonType: 'regulatory', reason: regulatoryCheck.reason });
        continue;
      }
      if (manufacturingCheck.hardFail) {
        excluded.push({ materialId: material.id, materialName: material.name, reasonType: 'manufacturing', reason: manufacturingCheck.reason });
        continue;
      }

      for (const profile of this.buildProcessProfiles(material, manufacturing, manufacturingCheck.equipment)) {
        candidates.push({
          id: uuid(),
          materialId: material.id,
          materialName: material.name,
          profileId: profile.profileId,
          trialName: `${material.name} — ${profile.label}`,
          processParameters: {
            temperatureC: profile.processTempC,
            lineSpeedMpm: profile.lineSpeedMpm,
            sealConditions: profile.sealConditions,
            equipment: manufacturingCheck.equipment,
          },
          performanceTargets,
          estimatedCostGbp: Math.round(material.baseTrialCostGbp * profile.costMultiplier),
          uncertaintyModifier: profile.uncertaintyModifier,
          manufacturingCheck,
          regulatoryCheck,
          performanceCheck,
          expectedOutcomeDescription: `Validates ${material.name} against the OTR/WVTR targets under the ${profile.label.toLowerCase()} at ${profile.processTempC}°C, ${profile.lineSpeedMpm} m/min.`,
        });
      }
    }

    return { candidates, excluded };
  }
}

module.exports = new CandidateGenerator();
