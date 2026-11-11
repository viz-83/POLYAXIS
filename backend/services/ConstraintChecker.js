const { readObject } = require('../utils/dataStore');

const TEMPERATURE_TOLERANCE_C = 5; // slack before a non-overlapping window becomes a hard failure
const LINE_SPEED_TOLERANCE_MPM = 15;

/**
 * ConstraintChecker — validates a candidate material / trial against the project's
 * manufacturing constraints and selected regulatory frameworks (Modules 4 & 5).
 * Every check returns { status: 'pass' | 'conditional' | 'fail', score (0-1), reason }.
 */
class ConstraintChecker {
  // ---- Manufacturing ---------------------------------------------------

  /**
   * The processing/line-speed windows a material has on a given piece of equipment. Materials carry
   * defaults plus optional per-equipment overrides (`equipmentProfiles`) — e.g. a co-extruded EVOH
   * barrier cannot run at cast-line speeds the way a plain PP film can.
   */
  windowsFor(material, equipmentType) {
    const o = (equipmentType && material.equipmentProfiles && material.equipmentProfiles[equipmentType]) || {};
    return {
      equipment: equipmentType || null,
      tempMin: o.processingTempMinC ?? material.processingTempMinC,
      tempMax: o.processingTempMaxC ?? material.processingTempMaxC,
      speedMin: o.minLineSpeedMpm ?? material.minLineSpeedMpm,
      speedMax: o.maxLineSpeedMpm ?? material.maxLineSpeedMpm,
    };
  }

  /**
   * Compares the line's operating temperature range (extrusion/converting melt window, MFG-03)
   * against the material's processing temperature range. Deliberately distinct from the heat-seal
   * range (a later, separate process step shown on the material card per MAT-03).
   */
  checkTemperature(win, manufacturing) {
    if (!manufacturing || manufacturing.temperatureMinC == null || manufacturing.temperatureMaxC == null) {
      return { status: 'pass', score: 1, reason: 'No temperature constraint defined.' };
    }
    const { temperatureMinC: opMin, temperatureMaxC: opMax } = manufacturing;
    const { tempMin: matMin, tempMax: matMax } = win;
    const on = win.equipment ? ` on the ${win.equipment}` : '';

    const overlap = Math.min(opMax, matMax) - Math.max(opMin, matMin);
    if (overlap >= 0) {
      const coverage = Math.min(1, overlap / (matMax - matMin || 1));
      if (coverage >= 0.5) {
        return { status: 'pass', score: 1, reason: `Processing window ${matMin}–${matMax}°C${on} overlaps the line's ${opMin}–${opMax}°C operating range.` };
      }
      return { status: 'conditional', score: 0.6, reason: `Processing window ${matMin}–${matMax}°C${on} only partially overlaps the line's ${opMin}–${opMax}°C operating range.` };
    }
    const gap = Math.abs(overlap);
    if (gap <= TEMPERATURE_TOLERANCE_C) {
      return { status: 'conditional', score: 0.35, reason: `Processing window ${matMin}–${matMax}°C${on} sits ${gap}°C outside the line's ${opMin}–${opMax}°C operating range.` };
    }
    return { status: 'fail', score: 0, reason: `Processing window ${matMin}–${matMax}°C${on} is incompatible with the line's ${opMin}–${opMax}°C operating range.` };
  }

  checkLineSpeed(win, manufacturing) {
    if (!manufacturing || manufacturing.lineSpeedMinMpm == null || manufacturing.lineSpeedMaxMpm == null) {
      return { status: 'pass', score: 1, reason: 'No line-speed constraint defined.' };
    }
    const { lineSpeedMinMpm: reqMin, lineSpeedMaxMpm: reqMax } = manufacturing;
    const { speedMin: matMin, speedMax: matMax } = win;
    const on = win.equipment ? ` on the ${win.equipment}` : '';

    const overlap = Math.min(reqMax, matMax) - Math.max(reqMin, matMin);
    if (overlap >= 0) {
      const coverage = Math.min(1, overlap / (reqMax - reqMin || 1)); // how much of the REQUIRED range it can run
      if (coverage >= 0.5) {
        return { status: 'pass', score: 1, reason: `Material's ${matMin}–${matMax} m/min line speed${on} covers the required ${reqMin}–${reqMax} m/min.` };
      }
      return { status: 'conditional', score: 0.6, reason: `Material's ${matMin}–${matMax} m/min line speed${on} only partly covers the required ${reqMin}–${reqMax} m/min.` };
    }
    const gap = Math.abs(overlap);
    if (gap <= LINE_SPEED_TOLERANCE_MPM) {
      return { status: 'conditional', score: 0.35, reason: `Material's ${matMin}–${matMax} m/min line speed${on} is ${gap} m/min short of the required ${reqMin}–${reqMax} m/min.` };
    }
    return { status: 'fail', score: 0, reason: `Material's ${matMin}–${matMax} m/min line speed${on} cannot reach the required ${reqMin}–${reqMax} m/min.` };
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

  /** ENGINE-04: weighted sum of temperature (45%), line-speed (35%) and material-compatibility (20%) scores. */
  manufacturingFeasibility(material, manufacturing) {
    const equipment = manufacturing?.equipmentTypes?.length ? manufacturing.equipmentTypes : [null];
    const compatibility = this.checkMaterialCompatibility(material, manufacturing);

    // A material only needs to run on ONE of the selected pieces of equipment — evaluate each, keep the best.
    let best = null;
    for (const eq of equipment) {
      const win = this.windowsFor(material, eq);
      const temperature = this.checkTemperature(win, manufacturing);
      const lineSpeed = this.checkLineSpeed(win, manufacturing);
      const score = temperature.score * 0.45 + lineSpeed.score * 0.35 + compatibility.score * 0.2;
      if (!best || score > best.score) best = { score, temperature, lineSpeed, win };
    }

    const { score, temperature, lineSpeed, win } = best;
    const worst = [temperature, lineSpeed, compatibility].reduce((a, b) => (b.score < a.score ? b : a));
    // MFG-07: pass/fail is evaluated PER constraint dimension — one failed dimension fails the material outright,
    // however well it scores on the others (a blended score alone would let an impossible material through).
    const anyDimensionFails = [temperature, lineSpeed, compatibility].some((d) => d.status === 'fail');
    const status = anyDimensionFails ? 'fail' : score >= 0.85 ? 'pass' : 'conditional';
    const isHard = !manufacturing || manufacturing.constraintFlexibility !== 'Soft';

    return {
      status,
      score,
      hardFail: isHard && status === 'fail',
      equipment: win.equipment,
      reason: status === 'pass' ? 'Meets all manufacturing constraints.' : worst.reason,
      dimensions: { temperature, lineSpeed, compatibility },
    };
  }

  // ---- Performance (REC-04) ------------------------------------------------

  /** Does the material's barrier performance meet the project's OTR / WVTR targets? */
  performanceCheck(material, requirements) {
    const targets = [
      ['OTR', material.otr, requirements?.otrTarget, 'cc/m²/day'],
      ['WVTR', material.wvtr, requirements?.wvtrTarget, 'g/m²/day'],
    ].filter(([, , target]) => target != null);

    if (targets.length === 0) return { status: 'pass', reason: 'No performance targets defined.' };

    const misses = targets.filter(([, actual, target]) => actual > target);
    if (misses.length === 0) return { status: 'pass', reason: `Meets the ${targets.map(([n]) => n).join(' and ')} target${targets.length > 1 ? 's' : ''}.` };

    const near = misses.every(([, actual, target]) => actual <= target * 1.15);
    const detail = misses.map(([n, actual, target, unit]) => `${n} ${actual} vs target ≤ ${target} ${unit}`).join('; ');
    return near
      ? { status: 'conditional', reason: `Marginally above target (${detail}).` }
      : { status: 'fail', reason: `Above target (${detail}).` };
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
      ? `${failing.framework} classifies this material as ${failing.label} (${failing.percent}%), below the ${failing.mandatory ? 'mandatory' : 'monitoring'} threshold.`
      : conditionalOne
        ? `${conditionalOne.framework} classifies this material as ${conditionalOne.label} (${conditionalOne.percent}%).`
        : 'Compliant with all selected regulatory frameworks.';

    return { status, score, hardFail, frameworks, reason };
  }

  regulations() {
    const stored = readObject('regulations');
    if (stored && stored.ukEpr && stored.euPpwr) return stored;
    return { ukEpr: { compliantThreshold: 70, conditionalThreshold: 60 }, euPpwr: { compliantThreshold: 75, conditionalThreshold: 70 } };
  }
}

module.exports = new ConstraintChecker();
