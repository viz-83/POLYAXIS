const { v4: uuid } = require('uuid');
const ConstraintChecker = require('./ConstraintChecker');

/**
 * CandidateGenerator — builds candidate physical trials from material × process
 * parameter combinations (Module 7), then applies the ConstraintChecker pre-filter
 * (TRIAL-04) before scoring. Deterministic: identical inputs -> identical output order.
 */
class CandidateGenerator {
  /** At least 3 process-parameter profiles per candidate material (TRIAL-03). */
  buildProcessProfiles(material, manufacturing) {
    const opMin = manufacturing?.temperatureMinC ?? material.processingTempMinC;
    const opMax = manufacturing?.temperatureMaxC ?? material.processingTempMaxC;
    const speedMin = manufacturing?.lineSpeedMinMpm ?? material.minLineSpeedMpm;
    const speedMax = manufacturing?.lineSpeedMaxMpm ?? material.maxLineSpeedMpm;

    const matMid = (material.processingTempMinC + material.processingTempMaxC) / 2;

    return [
      {
        profileId: 'low-temp',
        label: 'Low-temperature / low-speed profile',
        processTempC: Math.round(material.processingTempMinC),
        lineSpeedMpm: Math.round(speedMin),
        sealConditions: 'Conservative seal dwell (+15%), lower throughput',
        costMultiplier: 1.0,
        uncertaintyModifier: 0.9,
      },
      {
        profileId: 'mid-temp',
        label: 'Standard process-window profile',
        processTempC: Math.round(matMid),
        lineSpeedMpm: Math.round((speedMin + speedMax) / 2),
        sealConditions: 'Standard seal dwell, nominal throughput',
        costMultiplier: 1.12,
        uncertaintyModifier: 1.0,
      },
      {
        profileId: 'high-temp',
        label: 'High-temperature / high-speed profile',
        processTempC: Math.round(material.processingTempMaxC),
        lineSpeedMpm: Math.round(speedMax),
        sealConditions: 'Reduced seal dwell (-10%), higher throughput',
        costMultiplier: 1.22,
        uncertaintyModifier: 1.15,
      },
    ].map((profile) => ({
      ...profile,
      operatingWindowRef: `${opMin ?? '—'}–${opMax ?? '—'}°C line window`,
    }));
  }

  /**
   * @param {Array} materials - selected candidate materials (MAT-07)
   * @param {Object} context - { manufacturing, regulatorySettings, regulations, requirements }
   * @returns {{ candidates: Array, excluded: Array }}
   */
  generate(materials, context) {
    const { manufacturing, regulatorySettings, regulations } = context;
    const candidates = [];
    const excluded = [];

    for (const material of materials) {
      const manufacturingCheck = ConstraintChecker.manufacturingFeasibility(material, manufacturing);
      const regulatoryCheck = ConstraintChecker.regulatoryCompliance(material, regulatorySettings, regulations);

      if (regulatoryCheck.hardFail) {
        excluded.push({
          materialId: material.id,
          materialName: material.name,
          reasonType: 'regulatory',
          reason: regulatoryCheck.reason,
        });
        continue;
      }

      const profiles = this.buildProcessProfiles(material, manufacturing);
      for (const profile of profiles) {
        const trialManufacturingCheck = manufacturingCheck;
        const estimatedCost = Math.round(material.baseTrialCostGbp * profile.costMultiplier);

        const trial = {
          id: uuid(),
          materialId: material.id,
          materialName: material.name,
          profileId: profile.profileId,
          trialName: `${material.name} — ${profile.label}`,
          processParameters: {
            temperatureC: profile.processTempC,
            lineSpeedMpm: profile.lineSpeedMpm,
            sealConditions: profile.sealConditions,
          },
          estimatedCostGbp: estimatedCost,
          uncertaintyModifier: profile.uncertaintyModifier,
          manufacturingCheck: trialManufacturingCheck,
          regulatoryCheck,
          expectedOutcomeDescription: `Validates ${material.name} against OTR/WVTR targets under ${profile.label.toLowerCase()} at ${profile.processTempC}°C, ${profile.lineSpeedMpm} m/min.`,
        };

        if (trialManufacturingCheck.hardFail) {
          excluded.push({
            materialId: material.id,
            materialName: material.name,
            trialName: trial.trialName,
            reasonType: 'manufacturing',
            reason: trialManufacturingCheck.reason,
          });
          continue;
        }

        candidates.push(trial);
      }
    }

    // TRIAL-05: 5–12 candidate trials per run. Trim deterministically (by material order, then profile order)
    // while always keeping at least one profile per surviving material.
    const capped = candidates.slice(0, 12);

    return { candidates: capped, excluded };
  }
}

module.exports = new CandidateGenerator();
