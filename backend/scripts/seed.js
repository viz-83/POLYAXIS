/**
 * Seed script — initialises all JSON data files to the Phase 1 baseline demonstration state.
 * Safe to re-run at any time: it overwrites the data directory with fresh baseline records
 * (this is also what AdminService "Reset Scenarios" logically restores project state to).
 *
 * Usage: node scripts/seed.js   (run from /backend, or via `npm run seed`)
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { writeCollection, writeObject, nowIso } = require('../utils/dataStore');

const BCRYPT_COST = 10;

// ---------------------------------------------------------------------------
// Users (section 4.4)
// ---------------------------------------------------------------------------

// Deployments override these so a public instance never ships the published demo passwords.
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || 'Demo2026!';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin2026!';

const demoAccounts = [
  { name: 'Alex Chapman', email: 'alex.chapman@polyaxis-demo.com', password: DEMO_PASSWORD, role: 'Technical User' },
  { name: 'Sarah Mitchell', email: 'sarah.mitchell@polyaxis-demo.com', password: DEMO_PASSWORD, role: 'Technical User' },
  { name: 'James Okafor', email: 'james.okafor@polyaxis-demo.com', password: DEMO_PASSWORD, role: 'Technical User' },
  { name: 'Admin User', email: 'admin@polyaxis-demo.com', password: ADMIN_PASSWORD, role: 'Administrator' },
];

const userIds = {};
const users = demoAccounts.map((account) => {
  const id = uuid();
  userIds[account.email] = id;
  return {
    id,
    name: account.name,
    email: account.email,
    passwordHash: bcrypt.hashSync(account.password, BCRYPT_COST),
    role: account.role,
    createdAt: nowIso(),
  };
});

// ---------------------------------------------------------------------------
// Candidate materials library (section 11.2, MAT-01..10)
// processingTempMinC/MaxC = extrusion/converting melt window used for manufacturing-line
// temperature compatibility; sealTempMinC/MaxC = downstream heat-seal window shown for reference.
// ---------------------------------------------------------------------------

const materials = [
  {
    id: 'MAT-001', name: 'Mono-PE 60µm', polymerFamily: 'Mono-PE', barrierType: 'None',
    layerStructure: 'Single-layer blown PE film, 60µm gauge',
    otr: 8.5, wvtr: 4.2, sealTempMinC: 110, sealTempMaxC: 130,
    processingTempMinC: 175, processingTempMaxC: 205,
    minLineSpeedMpm: 90, maxLineSpeedMpm: 170,
    ukEprRecyclabilityPercent: 65, euPpwrRecyclabilityPercent: 65,
    baseTrialCostGbp: 1800, typicalShelfLifeSuitability: 'Up to 3 months, standard sensitivity',
    active: true,
  },
  {
    id: 'MAT-002', name: 'Mono-PE 80µm', polymerFamily: 'Mono-PE', barrierType: 'None',
    layerStructure: 'Single-layer blown PE film, 80µm gauge',
    otr: 6.8, wvtr: 3.5, sealTempMinC: 115, sealTempMaxC: 135,
    processingTempMinC: 180, processingTempMaxC: 210,
    minLineSpeedMpm: 80, maxLineSpeedMpm: 160,
    ukEprRecyclabilityPercent: 68, euPpwrRecyclabilityPercent: 68,
    baseTrialCostGbp: 2100, typicalShelfLifeSuitability: 'Up to 6 months, standard sensitivity',
    active: true,
  },
  {
    id: 'MAT-003', name: 'Mono-PE 80µm + EVOH barrier', polymerFamily: 'Mono-PE', barrierType: 'EVOH',
    layerStructure: 'Co-extruded PE/EVOH/PE, 80µm gauge, <5% EVOH by weight',
    otr: 1.8, wvtr: 1.2, sealTempMinC: 120, sealTempMaxC: 145,
    processingTempMinC: 185, processingTempMaxC: 215,
    minLineSpeedMpm: 70, maxLineSpeedMpm: 140,
    ukEprRecyclabilityPercent: 72, euPpwrRecyclabilityPercent: 72,
    baseTrialCostGbp: 2400, typicalShelfLifeSuitability: 'Up to 12 months, oxygen-sensitive',
    active: true,
  },
  {
    id: 'MAT-004', name: 'Mono-PE 80µm + SiOx barrier', polymerFamily: 'Mono-PE', barrierType: 'SiOx',
    layerStructure: 'PE film with vacuum-deposited SiOx coating, 80µm gauge',
    otr: 2.4, wvtr: 1.8, sealTempMinC: 115, sealTempMaxC: 140,
    processingTempMinC: 185, processingTempMaxC: 215,
    minLineSpeedMpm: 60, maxLineSpeedMpm: 130,
    ukEprRecyclabilityPercent: 74, euPpwrRecyclabilityPercent: 74,
    baseTrialCostGbp: 2600, typicalShelfLifeSuitability: 'Up to 12 months, oxygen-sensitive',
    active: true,
  },
  {
    id: 'MAT-005', name: 'Mono-PP 50µm', polymerFamily: 'Mono-PP', barrierType: 'None',
    layerStructure: 'Single-layer cast PP film, 50µm gauge',
    otr: 12.0, wvtr: 6.5, sealTempMinC: 130, sealTempMaxC: 155,
    processingTempMinC: 235, processingTempMaxC: 260,
    minLineSpeedMpm: 100, maxLineSpeedMpm: 180,
    ukEprRecyclabilityPercent: 71, euPpwrRecyclabilityPercent: 71,
    baseTrialCostGbp: 1900, typicalShelfLifeSuitability: 'Up to 6 months, standard sensitivity',
    active: true,
  },
  {
    id: 'MAT-006', name: 'Mono-PP 60µm + barrier coating', polymerFamily: 'Mono-PP', barrierType: 'Acrylic coating',
    layerStructure: 'Cast PP film with barrier coating, 60µm gauge',
    otr: 4.2, wvtr: 2.8, sealTempMinC: 135, sealTempMaxC: 160,
    processingTempMinC: 235, processingTempMaxC: 260,
    minLineSpeedMpm: 90, maxLineSpeedMpm: 160,
    ukEprRecyclabilityPercent: 73, euPpwrRecyclabilityPercent: 73,
    baseTrialCostGbp: 2300, typicalShelfLifeSuitability: 'Up to 9 months, moisture-sensitive',
    active: true,
  },
  {
    id: 'MAT-007', name: 'HDPE 70µm', polymerFamily: 'HDPE', barrierType: 'None',
    layerStructure: 'Single-layer blown HDPE film, 70µm gauge',
    otr: 5.1, wvtr: 3.1, sealTempMinC: 125, sealTempMaxC: 150,
    processingTempMinC: 190, processingTempMaxC: 220,
    minLineSpeedMpm: 80, maxLineSpeedMpm: 150,
    ukEprRecyclabilityPercent: 70, euPpwrRecyclabilityPercent: 70,
    baseTrialCostGbp: 2000, typicalShelfLifeSuitability: 'Up to 9 months, standard sensitivity',
    active: true,
  },
  {
    id: 'MAT-008', name: 'Bio-based Mono-PE 75µm', polymerFamily: 'Bio-based Mono-PE', barrierType: 'None',
    layerStructure: 'Single-layer blown bio-PE film (sugarcane-derived), 75µm gauge',
    otr: 7.2, wvtr: 3.8, sealTempMinC: 112, sealTempMaxC: 132,
    processingTempMinC: 180, processingTempMaxC: 210,
    minLineSpeedMpm: 70, maxLineSpeedMpm: 130,
    ukEprRecyclabilityPercent: 69, euPpwrRecyclabilityPercent: 69,
    baseTrialCostGbp: 3100, typicalShelfLifeSuitability: 'Up to 6 months, standard sensitivity',
    active: true,
  },
];

// Per-equipment processing windows (the dataset's answer to "what can each line actually run?").
// Blown-film windows are the material defaults above. On a CAST film line, plain PP and PE films run at cast
// speeds, whereas co-extruded EVOH, vacuum-coated SiOx and coated-PP barrier structures need a slower
// coating/co-extrusion step — which is what makes a 100–140 m/min cast line eliminate them (DEMO-02).
const castLine = (temp, speed) => ({ 'Cast Film Line': { processingTempMinC: temp[0], processingTempMaxC: temp[1], minLineSpeedMpm: speed[0], maxLineSpeedMpm: speed[1] } });
const equipmentProfiles = {
  'MAT-001': castLine([170, 200], [90, 170]),
  'MAT-002': castLine([175, 205], [80, 160]),
  'MAT-003': castLine([170, 200], [40, 80]),
  'MAT-004': castLine([170, 200], [30, 75]),
  'MAT-005': castLine([165, 195], [100, 180]),
  'MAT-006': castLine([170, 200], [50, 84]),
  'MAT-007': castLine([185, 215], [80, 150]),
  'MAT-008': castLine([175, 205], [70, 130]),
};
for (const m of materials) m.equipmentProfiles = equipmentProfiles[m.id];

// ---------------------------------------------------------------------------
// Process-parameter profiles (TRIAL-03) — the controlled dataset the CandidateGenerator draws from.
// tempPosition / speedPosition place the trial inside the usable temperature / line-speed window (0 = low end).
// ---------------------------------------------------------------------------

const profiles = [
  { id: 'low-temp', label: 'Low-temperature / low-speed profile', tempPosition: 0, speedPosition: 0, sealConditions: 'Conservative seal dwell (+15%), lower throughput', costMultiplier: 1.0, uncertaintyModifier: 0.9 },
  { id: 'low-mid-temp', label: 'Reduced process-window profile', tempPosition: 0.25, speedPosition: 0.25, sealConditions: 'Slightly extended seal dwell (+8%), reduced throughput', costMultiplier: 1.06, uncertaintyModifier: 0.95 },
  { id: 'mid-temp', label: 'Standard process-window profile', tempPosition: 0.5, speedPosition: 0.5, sealConditions: 'Standard seal dwell, nominal throughput', costMultiplier: 1.12, uncertaintyModifier: 1.0 },
  { id: 'upper-mid-temp', label: 'Elevated process-window profile', tempPosition: 0.75, speedPosition: 0.75, sealConditions: 'Slightly reduced seal dwell (-5%), raised throughput', costMultiplier: 1.17, uncertaintyModifier: 1.07 },
  { id: 'high-temp', label: 'High-temperature / high-speed profile', tempPosition: 1, speedPosition: 1, sealConditions: 'Reduced seal dwell (-10%), higher throughput', costMultiplier: 1.22, uncertaintyModifier: 1.15 },
];

// ---------------------------------------------------------------------------
// Regulatory rules (REG-01..10) — representative of UK EPR / EU PPWR, not legal advice (10.3)
// ---------------------------------------------------------------------------

const regulations = {
  ukEpr: {
    label: 'UK Extended Producer Responsibility',
    compliantThreshold: 70,
    conditionalThreshold: 60,
    description: '≥70% modelled as Recyclable (household stream); 60–69% Conditionally Recyclable; <60% Non-Recyclable.',
  },
  euPpwr: {
    label: 'EU Packaging and Packaging Waste Regulation',
    compliantThreshold: 75,
    conditionalThreshold: 70,
    description: '≥75% modelled as Recyclable under 2030 design-for-recycling criteria; 70–74% Conditionally Recyclable; <70% Non-Recyclable.',
  },
  updatedAt: nowIso(),
};

// ---------------------------------------------------------------------------
// Scoring weights (ENGINE-02, ADMIN-08)
// ---------------------------------------------------------------------------

const scoring = {
  weights: {
    informationGain: 0.30,
    feasibility: 0.25,
    uncertaintyReduction: 0.20,
    regulatory: 0.15,
    cost: 0.10,
  },
  updatedAt: nowIso(),
};

// ---------------------------------------------------------------------------
// Demo projects (section 11.1) — baseline state: specification + requirements +
// manufacturing + regulatory entered, no trials generated and no results recorded yet.
// ---------------------------------------------------------------------------

const projects = [];
const specifications = [];
const requirements = [];
const manufacturing = [];
const regulatory = [];
// Pristine copy of every demo project's inputs, so Admin "Reset Scenario" can restore the FULL baseline
// (specification, requirements, constraints, regulatory) — not just clear the trial results (ADMIN-03).
const baselines = {};

function seedProject({ userEmail, name, productType, description, transitionObjective, spec, reqs, mfg, reg }) {
  const id = uuid();
  const timestamp = nowIso();
  baselines[id] = {
    project: { name, productType, description, transitionObjective, stage: 'Materials', stagesCompleted: ['Specification', 'Requirements'] },
    specification: structuredClone(spec),
    requirements: structuredClone(reqs),
    manufacturing: structuredClone(mfg),
    regulatory: structuredClone(reg),
  };
  projects.push({
    id,
    userId: userIds[userEmail],
    name,
    productType,
    description,
    transitionObjective,
    stage: 'Materials',
    stagesCompleted: ['Specification', 'Requirements'],
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  specifications.push({ id: uuid(), projectId: id, ...spec, updatedAt: timestamp });
  requirements.push({ id: uuid(), projectId: id, ...reqs, updatedAt: timestamp });
  manufacturing.push({ id: uuid(), projectId: id, ...mfg, updatedAt: timestamp });
  regulatory.push({ id: uuid(), projectId: id, ...reg, updatedAt: timestamp });
  return id;
}

seedProject({
  userEmail: 'alex.chapman@polyaxis-demo.com',
  name: 'Fresh Food Tray Lidding — PE/PA to Mono-PE',
  productType: 'Fresh Food',
  description: 'Transitioning fresh produce tray lidding film from a non-recyclable PE/PA laminate to a recyclable mono-material alternative.',
  transitionObjective: 'We are transitioning from an 80µm PE/PA laminate to a recyclable Mono-PE structure in order to meet UK EPR household recyclability requirements while preserving oxygen and moisture barrier performance for a 12-day fresh-produce shelf life.',
  spec: {
    existingMaterial: '80µm PE/PA laminate (12-layer co-extrusion)',
    layerStructure: 'PE outer / tie / PA barrier / tie / PE sealant, 12-layer co-extrusion',
    currentShelfLifeMonths: 0.4, // ~12 days
    currentOtr: 2.1,
    currentWvtr: 1.8,
    currentRecyclabilityStatus: 'Non-Recyclable',
    targetMaterialType: 'Recyclable Mono-PE',
    targetRecyclabilityPercent: 70,
    targetRecyclingStream: 'UK EPR Household',
    transitionPriority: 'Recyclability',
  },
  reqs: {
    otrTarget: 5.0,
    wvtrTarget: 3.0,
    sealStrengthMinimum: 8,
    shelfLifeRequirementMonths: 0.4,
    productSensitivity: 'Oxygen-Sensitive',
    recyclabilityTargetPercent: 70,
    additionalParameters: 'Fresh produce tray lidding — film must resist fogging and support high-speed lidding seal.',
  },
  mfg: {
    equipmentTypes: ['Blown Film Line'],
    temperatureMinC: 180,
    temperatureMaxC: 220,
    lineSpeedMinMpm: 80,
    lineSpeedMaxMpm: 120,
    materialCompatibilityNote: 'Existing seal unit is PE-compatible only',
    constraintFlexibility: 'Hard',
  },
  reg: {
    ukEprEnabled: true,
    ukEprMandatory: true,
    euPpwrEnabled: true,
    euPpwrMandatory: false,
    classificationPriority: 'UK EPR',
    notes: 'EU PPWR monitored for future export markets but not currently mandatory.',
  },
});

seedProject({
  userEmail: 'sarah.mitchell@polyaxis-demo.com',
  name: 'Snack Pouch — OPP/PE to Mono-PP',
  productType: 'Ambient Food',
  description: 'Transitioning a consumer snacks stand-up pouch from an OPP/PE laminate to a recyclable Mono-PP alternative.',
  transitionObjective: 'We are transitioning from an OPP/PE laminate to a recyclable Mono-PP structure in order to meet UK EPR recyclability targets while maintaining a 6-month ambient shelf life.',
  spec: {
    existingMaterial: 'OPP/PE laminate (2-layer)',
    layerStructure: 'OPP print/barrier layer laminated to PE sealant layer',
    currentShelfLifeMonths: 6,
    currentOtr: 45,
    currentWvtr: 5.5,
    currentRecyclabilityStatus: 'Non-Recyclable',
    targetMaterialType: 'Recyclable Mono-PP',
    targetRecyclabilityPercent: 70,
    targetRecyclingStream: 'UK EPR Household',
    transitionPriority: 'Cost',
  },
  reqs: {
    otrTarget: 15,
    wvtrTarget: 5,
    sealStrengthMinimum: 10,
    shelfLifeRequirementMonths: 6,
    productSensitivity: 'Standard',
    recyclabilityTargetPercent: 70,
    additionalParameters: 'Consumer-facing print quality must be maintained on mono-material substrate.',
  },
  mfg: {
    equipmentTypes: ['Cast Film Line'],
    temperatureMinC: 160,
    temperatureMaxC: 190,
    lineSpeedMinMpm: 100,
    lineSpeedMaxMpm: 140,
    materialCompatibilityNote: 'Existing seal unit supports PE or PP',
    constraintFlexibility: 'Hard',
  },
  reg: {
    ukEprEnabled: true,
    ukEprMandatory: true,
    euPpwrEnabled: false,
    euPpwrMandatory: false,
    classificationPriority: 'UK EPR',
    notes: 'UK-only distribution for this SKU range.',
  },
});

seedProject({
  userEmail: 'james.okafor@polyaxis-demo.com',
  name: 'Industrial Stretch Wrap — Multi-layer to Barrier Mono-PE',
  productType: 'Industrial',
  description: 'Transitioning industrial stretch wrap from a multi-layer PE/EVA composite to an EU PPWR-compliant barrier Mono-PE structure.',
  transitionObjective: 'We are transitioning from a multi-layer PE/EVA composite to a barrier Mono-PE structure in order to meet EU PPWR 2030 recyclability design criteria for export markets.',
  spec: {
    existingMaterial: 'Multi-layer PE/EVA composite',
    layerStructure: 'PE/EVA/PE co-extrusion for cling and puncture resistance',
    currentShelfLifeMonths: 24,
    currentOtr: 20,
    currentWvtr: 8,
    currentRecyclabilityStatus: 'Unknown',
    targetMaterialType: 'Barrier Mono-PE (EU PPWR compliant)',
    targetRecyclabilityPercent: 80,
    targetRecyclingStream: 'EU PPWR',
    transitionPriority: 'Regulatory',
  },
  reqs: {
    otrTarget: 10,
    wvtrTarget: 6,
    sealStrengthMinimum: 12,
    shelfLifeRequirementMonths: 24,
    productSensitivity: 'Standard',
    recyclabilityTargetPercent: 80,
    additionalParameters: 'Puncture and cling performance must be retained for pallet stability.',
  },
  mfg: {
    equipmentTypes: ['Blown Film Line'],
    temperatureMinC: 185,
    temperatureMaxC: 218,
    lineSpeedMinMpm: 60,
    lineSpeedMaxMpm: 100,
    materialCompatibilityNote: 'Existing seal unit is PE-compatible only',
    constraintFlexibility: 'Soft',
  },
  reg: {
    ukEprEnabled: true,
    ukEprMandatory: false,
    euPpwrEnabled: true,
    euPpwrMandatory: true,
    classificationPriority: 'EU PPWR',
    notes: 'EU PPWR is the binding requirement for this export-focused product line.',
  },
});

// ---------------------------------------------------------------------------
// Write all collections
// ---------------------------------------------------------------------------

writeCollection('users', users);
writeCollection('profiles', profiles);
writeObject('baselines', baselines);
writeCollection('materials', materials);
writeObject('regulations', regulations);
writeObject('scoring', scoring);
writeCollection('projects', projects);
writeCollection('specifications', specifications);
writeCollection('requirements', requirements);
writeCollection('manufacturing', manufacturing);
writeCollection('regulatory', regulatory);
writeCollection('trials', []);
writeCollection('results', []);
writeObject('systemStatus', { lastResetAt: nowIso(), seededAt: nowIso() });

console.log(`Seed complete: ${users.length} users, ${materials.length} materials, ${projects.length} demo projects.`);
console.log('Demo credentials:');
for (const account of demoAccounts) {
  // Never print a password that was supplied through the environment (it would end up in deploy logs).
  const isDefault = account.password === 'Demo2026!' || account.password === 'Admin2026!';
  console.log(`  ${account.role.padEnd(16)} ${account.email}  /  ${isDefault ? account.password : '(set via SEED_*_PASSWORD)'}`);
}
