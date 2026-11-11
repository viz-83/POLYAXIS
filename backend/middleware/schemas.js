/**
 * Request schemas for every writable resource (SPEC-07: numeric ranges + field-level errors).
 * Enumerations mirror the lists in the requirements document.
 */
const { rangeOrder } = require('./validate');

const PRODUCT_TYPES = ['Fresh Food', 'Ambient Food', 'Frozen Food', 'Consumer Goods', 'Industrial', 'Other'];
const EQUIPMENT_TYPES = ['Blown Film Line', 'Cast Film Line', 'Extrusion Coating Line', 'Flexographic Printing Line', 'Lamination Line', 'Rotogravure Line'];
const RECYCLABILITY_STATUS = ['Recyclable', 'Non-Recyclable', 'Unknown'];
const RECYCLING_STREAMS = ['UK EPR Household', 'UK EPR Industrial', 'EU PPWR', 'Other'];
const PRIORITIES = ['Recyclability', 'Cost', 'Performance', 'Regulatory'];
const SENSITIVITIES = ['Standard', 'Moisture-Sensitive', 'Oxygen-Sensitive', 'Both'];
const CLASSIFICATION_PRIORITY = ['UK EPR', 'EU PPWR', 'Most Restrictive'];
const FLEXIBILITY = ['Hard', 'Soft'];

const num = (min, max) => ({ type: 'number', min, max });
const text = (maxLength = 2000) => ({ type: 'string', maxLength });

const project = {
  name: { ...text(120), required: true },
  productType: { type: 'string', required: true, enum: PRODUCT_TYPES },
  description: { ...text(2000), required: true },
  transitionObjective: { ...text(2000), required: true },
};

const projectPatch = {
  name: text(120),
  productType: { type: 'string', enum: PRODUCT_TYPES },
  description: text(2000),
  transitionObjective: text(2000),
};

const specification = {
  existingMaterial: text(300),
  layerStructure: text(500),
  currentShelfLifeMonths: num(0, 120),
  currentOtr: num(0, 10000),
  currentWvtr: num(0, 1000),
  currentRecyclabilityStatus: { type: 'string', enum: RECYCLABILITY_STATUS },
  targetMaterialType: text(300),
  targetRecyclabilityPercent: num(0, 100),
  targetRecyclingStream: { type: 'string', enum: RECYCLING_STREAMS },
  transitionPriority: { type: 'string', enum: PRIORITIES },
};

const requirements = {
  otrTarget: num(0, 10000),
  wvtrTarget: num(0, 1000),
  sealStrengthMinimum: num(0, 500),
  shelfLifeRequirementMonths: num(0, 120),
  productSensitivity: { type: 'string', enum: SENSITIVITIES },
  recyclabilityTargetPercent: num(0, 100),
  additionalParameters: text(2000),
};

const manufacturing = {
  equipmentTypes: { type: 'array', itemsEnum: EQUIPMENT_TYPES },
  temperatureMinC: num(-50, 500),
  temperatureMaxC: num(-50, 500),
  lineSpeedMinMpm: num(0, 1000),
  lineSpeedMaxMpm: num(0, 1000),
  materialCompatibilityNote: text(500),
  constraintFlexibility: { type: 'string', enum: FLEXIBILITY },
};
const manufacturingCross = (body, errors) => ({
  ...rangeOrder('temperatureMinC', 'temperatureMaxC', 'temperature')(body, errors),
  ...rangeOrder('lineSpeedMinMpm', 'lineSpeedMaxMpm', 'line speed')(body, errors),
});

const regulatory = {
  ukEprEnabled: { type: 'boolean' },
  ukEprMandatory: { type: 'boolean' },
  euPpwrEnabled: { type: 'boolean' },
  euPpwrMandatory: { type: 'boolean' },
  classificationPriority: { type: 'string', enum: CLASSIFICATION_PRIORITY },
  notes: text(2000),
};

/** Material profile (MAT-03). `required` = true when creating, false for partial edits. */
function material(required) {
  const r = (rules) => (required ? { ...rules, required: true } : rules);
  return {
    name: r(text(120)),
    polymerFamily: r(text(60)),
    barrierType: text(60),
    layerStructure: r(text(300)),
    otr: r(num(0, 100000)),
    wvtr: r(num(0, 10000)),
    sealTempMinC: r(num(0, 400)),
    sealTempMaxC: r(num(0, 400)),
    processingTempMinC: r(num(0, 500)),
    processingTempMaxC: r(num(0, 500)),
    minLineSpeedMpm: r(num(0, 1000)),
    maxLineSpeedMpm: r(num(0, 1000)),
    ukEprRecyclabilityPercent: r(num(0, 100)),
    euPpwrRecyclabilityPercent: num(0, 100),
    baseTrialCostGbp: r(num(0, 1000000)),
    typicalShelfLifeSuitability: text(200),
  };
}
const materialCross = (body, errors) => ({
  ...rangeOrder('sealTempMinC', 'sealTempMaxC', 'seal temperature')(body, errors),
  ...rangeOrder('processingTempMinC', 'processingTempMaxC', 'processing temperature')(body, errors),
  ...rangeOrder('minLineSpeedMpm', 'maxLineSpeedMpm', 'line speed')(body, errors),
});

const trialResult = {
  performanceResult: { type: 'string', required: true, enum: ['Pass', 'Fail'] },
  manufacturingResult: { type: 'string', required: true, enum: ['Pass', 'Fail'] },
  regulatoryResult: { type: 'string', required: true, enum: ['Pass', 'Fail'] },
  overallResult: { type: 'string', enum: ['Successful', 'Unsuccessful'] },
  failureReason: text(2000),
  measuredOtr: num(0, 100000),
  measuredWvtr: num(0, 10000),
  measuredSealStrength: num(0, 500),
  notes: text(2000),
  trialDate: text(10),
};

module.exports = {
  schemas: { project, projectPatch, specification, requirements, manufacturing, regulatory, material, trialResult },
  cross: { manufacturing: manufacturingCross, material: materialCross },
  lists: { PRODUCT_TYPES, EQUIPMENT_TYPES },
};
