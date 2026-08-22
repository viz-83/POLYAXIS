const { readObject } = require('../utils/dataStore');

/**
 * ConstraintChecker — validates a candidate material / trial against the project's
 * manufacturing constraints and selected regulatory frameworks (Modules 4 & 5).
 * Every check returns { status: 'pass' | 'conditional' | 'fail', score (0-1), reason }.
 */
class ConstraintChecker {
  // ---- Manufacturing ---------------------------------------------------

  /**
   * Compares the line's operating temperature range (extrusion/converting melt window, MFG-03)
   * against the material's processing temperature range. Note this is deliberately distinct from
   * the material's heat-seal temperature range (a separate, later process step, shown for
   * reference on the material card per MAT-03).
   */
  checkTemperature(material, manufacturing) {
    if (!manufacturing || manufacturing.temperatureMinC == null || manufacturing.temperatureMaxC == null) {
      return { status: 'pass', score: 1, reason: 'No temperature constraint defined.' };
    }
    const { temperatureMinC: opMin, temperatureMaxC: opMax } = manufacturing;
    const { processingTempMinC: matMin, processingTempMaxC: matMax } = material;

    const overlapLow = Math.max(opMin, matMin);
    const overlapHigh = Math.min(opMax, matMax);
    const overlap = overlapHigh - overlapLow;

    if (overlap >= 0) {
      const matSpan = matMax - matMin || 1;
      const coverage = Math.min(1, overlap / matSpan);
      if (coverage >= 0.5) {
        return { status: 'pass', score: 1, reason: `Processing window ${matMin}–${matMax}°C overlaps the line's ${opMin}–${opMax}°C operating range.` };
      }
      return { status: 'conditional', score: 0.6, reason: `Processing window ${matMin}–${matMax}°C only partially overlaps the line's ${opMin}–${opMax}°C operating range.` };
    }

    const gap = Math.abs(overlap);
    if (gap <= 10) {
      return { status: 'conditional', score: 0.35, reason: `Processing window ${matMin}–${matMax}°C sits ${gap}°C outside the line's ${opMin}–${opMax}°C operating range.` };
    }
    return { status: 'fail', score: 0, reason: `Processing window ${matMin}–${matMax}°C is incompatible with the line's ${opMin}–${opMax}°C operating range.` };
  }

  checkLineSpeed(material, manufacturing) {
    if (!manufacturing || manufacturing.lineSpeedMinMpm == null || manufacturing.lineSpeedMaxMpm == null) {
      return { status: 'pass', score: 1, reason: 'No line-speed constraint defined.' };
    }
    const { lineSpeedMinMpm: reqMin, lineSpeedMaxMpm: reqMax } = manufacturing;
    const { minLineSpeedMpm: matMin, maxLineSpeedMpm: matMax } = material;

    const overlapLow = Math.max(reqMin, matMin);
    const overlapHigh = Math.min(reqMax, matMax);
    const overlap = overlapHigh - overlapLow;

    if (overlap >= 0) {
      return { status: 'pass', score: 1, reason: `Material's ${matMin}–${matMax} m/min processing range covers the required ${reqMin}–${reqMax} m/min.` };
    }
    const gap = Math.abs(overlap);
    if (gap <= 15) {
      return { status: 'conditional', score: 0.5, reason: `Material's ${matMin}–${matMax} m/min processing range is ${gap} m/min short of the required ${reqMin}–${reqMax} m/min.` };
    }
    return { status: 'fail', score: 0, reason: `Material's ${matMin}–${matMax} m/min processing range cannot reach the required ${reqMin}–${reqMax} m/min line speed.` };
  }

  /** Base polymer code a compatibility note is likely to reference, independent of gauge/barrier naming. */
  basePolymerCode(polymerFamily) {
    const f = polymerFamily.toLowerCase();
    if (f.includes('pp')) return 'pp';
    if (f.includes('pe')) return 'pe'; // covers Mono-PE, HDPE, Bio-based Mono-PE
    return f;
  }

  checkMaterialCompatibility(material, manufacturing) {
    const note = (manufacturing && manufacturing.materialCompatibilityNote || '').toLowerCase();
    if (!note) return { status: 'pass', score: 1, reason: 'No specific material compatibility constraint defined.' };

    const base = this.basePolymerCode(material.polymerFamily);
    const mentionsPe = note.includes('pe') || note.includes('polyethylene');
    const mentionsPp = note.includes('pp') || note.includes('polypropylene');

    if ((base === 'pe' && mentionsPe) || (base === 'pp' && mentionsPp)) {
      return { status: 'pass', score: 1, reason: `Compatible with stated constraint: "${manufacturing.materialCompatibilityNote}".` };
    }
    if (mentionsPe || mentionsPp) {
      return { status: 'conditional', score: 0.5, reason: `Constraint "${manufacturing.materialCompatibilityNote}" may not cover ${material.polymerFamily}.` };
    }
    return { status: 'pass', score: 1, reason: 'No conflicting compatibility constraint identified.' };
  }

  manufacturingFeasibility(material, manufacturing) {
    const temperature = this.checkTemperature(material, manufacturing);
    const lineSpeed = this.checkLineSpeed(material, manufacturing);
    const compatibility = this.checkMaterialCompatibility(material, manufacturing);

    const score = temperature.score * 0.45 + lineSpeed.score * 0.35 + compatibility.score * 0.2;
    const worst = [temperature, lineSpeed, compatibility].reduce((a, b) => (b.score < a.score ? b : a));
    const status = score >= 0.85 ? 'pass' : score >= 0.4 ? 'conditional' : 'fail';
    const isHard = !manufacturing || manufacturing.constraintFlexibility !== 'Soft';

    return {
      status,
      score,
      hardFail: isHard && status === 'fail',
      reason: status === 'pass' ? 'Meets all manufacturing constraints.' : worst.reason,
      dimensions: { temperature, lineSpeed, compatibility },
    };
  }

  // ---- Regulatory --------------------------------------------------------

  classifyUkEpr(material, regulations) {
    const pct = material.ukEprRecyclabilityPercent;
    const { compliantThreshold, conditionalThreshold } = regulations.ukEpr;
    if (pct >= compliantThreshold) return { status: 'pass', percent: pct, label: 'Recyclable' };
    if (pct >= conditionalThreshold) return { status: 'conditional', percent: pct, label: 'Conditionally Recyclable' };
    return { status: 'fail', percent: pct, label: 'Non-Recyclable' };
  }

  classifyEuPpwr(material, regulations) {
    const pct = material.euPpwrRecyclabilityPercent;
    const { compliantThreshold, conditionalThreshold } = regulations.euPpwr;
    if (pct >= compliantThreshold) return { status: 'pass', percent: pct, label: 'Recyclable (2030 design criteria)' };
    if (pct >= conditionalThreshold) return { status: 'conditional', percent: pct, label: 'Conditionally Recyclable' };
    return { status: 'fail', percent: pct, label: 'Non-Recyclable' };
  }

  regulatoryCompliance(material, regulatorySettings, regulations) {
    const frameworks = [];
    let hardFail = false;
    let anyConditional = false;
    let anyEvaluated = false;

    if (regulatorySettings && regulatorySettings.ukEprEnabled) {
      anyEvaluated = true;
      const result = this.classifyUkEpr(material, regulations);
      frameworks.push({ framework: 'UK EPR', ...result, mandatory: regulatorySettings.ukEprMandatory !== false });
      if (result.status === 'fail' && regulatorySettings.ukEprMandatory !== false) hardFail = true;
      if (result.status === 'conditional') anyConditional = true;
    }
    if (regulatorySettings && regulatorySettings.euPpwrEnabled) {
      anyEvaluated = true;
      const result = this.classifyEuPpwr(material, regulations);
      frameworks.push({ framework: 'EU PPWR', ...result, mandatory: Boolean(regulatorySettings.euPpwrMandatory) });
      if (result.status === 'fail' && regulatorySettings.euPpwrMandatory) hardFail = true;
      if (result.status === 'conditional') anyConditional = true;
    }

    if (!anyEvaluated) {
      return { status: 'pass', score: 1, hardFail: false, frameworks: [], reason: 'No regulatory framework selected.' };
    }

    const score = hardFail ? 0 : anyConditional ? 0.5 : 1;
    const status = hardFail ? 'fail' : anyConditional ? 'conditional' : 'pass';
    const failing = frameworks.find((f) => f.status === 'fail');
    const conditionalOne = frameworks.find((f) => f.status === 'conditional');
    const reason = failing
      ? `${failing.framework} classifies this material as ${failing.label} (${failing.percent}%), below the mandatory threshold.`
      : conditionalOne
        ? `${conditionalOne.framework} classifies this material as ${conditionalOne.label} (${conditionalOne.percent}%).`
        : 'Compliant with all selected regulatory frameworks.';

    return { status, score, hardFail, frameworks, reason };
  }

  regulations() {
    const stored = readObject('regulations');
    if (stored && stored.ukEpr && stored.euPpwr) return stored;
    return { ukEpr: { compliantThreshold: 70, conditionalThreshold: 60 }, euPpwr: { compliantThreshold: 80, conditionalThreshold: 70 } };
  }
}

module.exports = new ConstraintChecker();
