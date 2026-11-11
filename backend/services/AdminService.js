const fs = require('fs');
const path = require('path');
const { readCollection, writeCollection, readObject, writeObject, nowIso, DATA_DIR } = require('../utils/dataStore');
const { ApiError } = require('../middleware/errorHandler');
const { SESSION_TIMEOUT_SECONDS } = require('../middleware/auth');
const sessionTracker = require('../utils/sessionTracker');

const WEIGHT_KEYS = ['informationGain', 'feasibility', 'uncertaintyReduction', 'regulatory', 'cost'];
const PROJECT_FIELDS = ['name', 'productType', 'description', 'transitionObjective'];
const SUB_RESOURCES = [['specification', 'specifications'], ['requirements', 'requirements'], ['manufacturing', 'manufacturing'], ['regulatory', 'regulatory']];
const MATERIAL_FIELDS = [
  'name', 'polymerFamily', 'barrierType', 'layerStructure', 'otr', 'wvtr', 'sealTempMinC', 'sealTempMaxC',
  'processingTempMinC', 'processingTempMaxC', 'minLineSpeedMpm', 'maxLineSpeedMpm',
  'ukEprRecyclabilityPercent', 'euPpwrRecyclabilityPercent', 'baseTrialCostGbp', 'typicalShelfLifeSuitability',
];

/** AdminService — demonstration scenario management, materials/regulatory/scoring config, status (Module 12). */
class AdminService {
  // ---- Projects & scenarios ------------------------------------------------

  listAllProjects() {
    const users = Object.fromEntries(readCollection('users').map((u) => [u.id, u]));
    const baselines = readObject('baselines');
    return readCollection('projects')
      .map((p) => ({
        ...p,
        ownerName: users[p.userId]?.name || 'Unknown',
        ownerEmail: users[p.userId]?.email || '',
        isDemo: Boolean(baselines[p.id]),
      }))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  /**
   * ADMIN-03 / PROJ-10: return a project to its BASELINE — trial history and results cleared and, for the seeded
   * demonstration projects, the specification, requirements, manufacturing and regulatory inputs restored exactly
   * as seeded (so a live constraint change such as DEMO-05 is undone). Non-demo projects keep their inputs and
   * just lose their trials/results.
   */
  resetProject(projectId) {
    const projects = readCollection('projects');
    const idx = projects.findIndex((p) => p.id === projectId);
    if (idx === -1) throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project not found.');

    for (const name of ['trials', 'results']) {
      writeCollection(name, readCollection(name).filter((r) => r.projectId !== projectId));
    }

    const baseline = readObject('baselines')[projectId];
    const project = projects[idx];

    if (baseline) {
      for (const f of PROJECT_FIELDS) project[f] = baseline.project[f];
      project.stage = baseline.project.stage;
      project.stagesCompleted = [...baseline.project.stagesCompleted];

      for (const [key, collection] of SUB_RESOURCES) {
        const list = readCollection(collection);
        const at = list.findIndex((r) => r.projectId === projectId);
        const record = { ...structuredClone(baseline[key]), id: at === -1 ? require('uuid').v4() : list[at].id, projectId, updatedAt: nowIso() };
        if (at === -1) list.push(record); else list[at] = record;
        writeCollection(collection, list);
      }
    } else {
      project.stagesCompleted = project.stagesCompleted.filter((s) => s !== 'Optimisation' && s !== 'Results');
      project.stage = project.stagesCompleted.includes('Requirements') ? 'Materials' : project.stagesCompleted.includes('Specification') ? 'Requirements' : 'Specification';
    }

    project.updatedAt = nowIso();
    projects[idx] = project;
    writeCollection('projects', projects);

    this.recordReset();
    return project;
  }

  /** ADMIN-04: reset every demonstration project at once (user-created projects are left alone). */
  resetAllProjects() {
    const baselines = readObject('baselines');
    const demoIds = readCollection('projects').map((p) => p.id).filter((id) => baselines[id]);
    for (const id of demoIds) this.resetProject(id);
    this.recordReset();
    return demoIds.length;
  }

  recordReset() {
    const status = readObject('systemStatus');
    status.lastResetAt = nowIso();
    writeObject('systemStatus', status);
  }

  // ---- Materials library (MAT-09, ADMIN-05/06) -------------------------------

  listMaterials() {
    return readCollection('materials');
  }

  assertWindowsOrdered(m) {
    const bad = (a, b, label) => {
      if (m[a] != null && m[b] != null && Number(m[a]) > Number(m[b])) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', { [a]: `Minimum ${label} cannot exceed the maximum.` });
      }
    };
    bad('sealTempMinC', 'sealTempMaxC', 'seal temperature');
    bad('processingTempMinC', 'processingTempMaxC', 'processing temperature');
    bad('minLineSpeedMpm', 'maxLineSpeedMpm', 'line speed');
  }

  createMaterial(payload) {
    const materials = readCollection('materials');
    const next = materials.reduce((max, m) => Math.max(max, Number(String(m.id).replace(/\D/g, '')) || 0), 0) + 1;
    const material = { id: `MAT-${String(next).padStart(3, '0')}` };
    for (const f of MATERIAL_FIELDS) if (payload[f] !== undefined) material[f] = payload[f];
    material.barrierType = material.barrierType || 'None';
    material.typicalShelfLifeSuitability = material.typicalShelfLifeSuitability || '';
    material.euPpwrRecyclabilityPercent = material.euPpwrRecyclabilityPercent ?? material.ukEprRecyclabilityPercent;
    material.equipmentProfiles = {};
    material.active = true;
    this.assertWindowsOrdered(material);
    materials.push(material);
    writeCollection('materials', materials);
    return material;
  }

  updateMaterial(materialId, patch) {
    const materials = readCollection('materials');
    const idx = materials.findIndex((m) => m.id === materialId);
    if (idx === -1) throw new ApiError(404, 'MATERIAL_NOT_FOUND', 'Material not found.');
    const updated = { ...materials[idx] };
    for (const f of MATERIAL_FIELDS) if (patch[f] !== undefined) updated[f] = patch[f];
    this.assertWindowsOrdered(updated);
    materials[idx] = updated;
    writeCollection('materials', materials);
    return updated;
  }

  setMaterialActive(materialId, active) {
    const materials = readCollection('materials');
    const idx = materials.findIndex((m) => m.id === materialId);
    if (idx === -1) throw new ApiError(404, 'MATERIAL_NOT_FOUND', 'Material not found.');
    materials[idx] = { ...materials[idx], active: Boolean(active) };
    writeCollection('materials', materials);
    return materials[idx];
  }

  // ---- Regulatory rules (REG-09, ADMIN-07) ---------------------------------------

  getRegulations() {
    return readObject('regulations');
  }

  updateRegulations(patch) {
    const current = readObject('regulations');
    const merged = {
      ...current,
      ukEpr: { ...current.ukEpr, ...(patch.ukEpr || {}) },
      euPpwr: { ...current.euPpwr, ...(patch.euPpwr || {}) },
    };
    const errors = {};
    for (const key of ['ukEpr', 'euPpwr']) {
      const { compliantThreshold: c, conditionalThreshold: k } = merged[key];
      const valid = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100;
      if (!valid(Number(c))) errors[`${key}.compliantThreshold`] = 'Must be a number between 0 and 100.';
      if (!valid(Number(k))) errors[`${key}.conditionalThreshold`] = 'Must be a number between 0 and 100.';
      if (!errors[`${key}.compliantThreshold`] && !errors[`${key}.conditionalThreshold`]) {
        merged[key].compliantThreshold = Number(c);
        merged[key].conditionalThreshold = Number(k);
        if (merged[key].conditionalThreshold > merged[key].compliantThreshold) errors[`${key}.conditionalThreshold`] = 'The conditional threshold cannot exceed the compliant threshold.';
      }
    }
    if (Object.keys(errors).length) throw new ApiError(400, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', errors);
    merged.updatedAt = nowIso();
    writeObject('regulations', merged);
    return merged;
  }

  // ---- Scoring weights (ENGINE-08, ADMIN-08) -------------------------------------

  getScoringWeights() {
    return readObject('scoring');
  }

  updateScoringWeights(weights) {
    const missing = WEIGHT_KEYS.filter((k) => weights?.[k] === undefined);
    if (missing.length) throw new ApiError(400, 'INVALID_WEIGHTS', `Missing weight(s): ${missing.join(', ')}.`);
    const clean = {};
    for (const k of WEIGHT_KEYS) {
      const v = Number(weights[k]);
      if (!Number.isFinite(v) || v < 0 || v > 1) throw new ApiError(400, 'INVALID_WEIGHTS', `Weight "${k}" must be between 0% and 100%.`);
      clean[k] = v;
    }
    const total = Object.values(clean).reduce((s, v) => s + v, 0);
    if (Math.abs(total - 1) > 0.01) throw new ApiError(400, 'INVALID_WEIGHTS', 'Scoring weights must sum to 100%.');
    writeObject('scoring', { weights: clean, updatedAt: nowIso() });
    return { weights: clean };
  }

  // ---- System status (ADMIN-09) ------------------------------------------------------

  systemStatus() {
    const stored = readObject('systemStatus');
    const dataFiles = fs.existsSync(DATA_DIR)
      ? fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json')).sort().map((f) => ({ name: f, bytes: fs.statSync(path.join(DATA_DIR, f)).size }))
      : [];
    return {
      totalProjects: readCollection('projects').length,
      totalUsers: readCollection('users').length,
      activeSessions: sessionTracker.activeCount(SESSION_TIMEOUT_SECONDS),
      lastResetAt: stored.lastResetAt || null,
      dataFiles,
      uptimeSeconds: Math.round(process.uptime()),
    };
  }
}

module.exports = new AdminService();
