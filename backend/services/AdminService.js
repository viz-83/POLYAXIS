const { readCollection, writeCollection, readObject, writeObject, nowIso } = require('../utils/dataStore');
const { ApiError } = require('../middleware/errorHandler');
const PackagingEngine = require('./PackagingEngine');

/** AdminService — demonstration scenario management, materials/regulatory config (Module 12). */
class AdminService {
  listAllProjects() {
    return readCollection('projects').sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  resetProject(projectId) {
    const projects = readCollection('projects');
    const idx = projects.findIndex((p) => p.id === projectId);
    if (idx === -1) throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project not found.');

    for (const name of ['trials', 'results']) {
      const list = readCollection(name);
      writeCollection(name, list.filter((r) => r.projectId !== projectId));
    }

    projects[idx].stage = 'Materials';
    if (!projects[idx].stagesCompleted.includes('Specification')) projects[idx].stagesCompleted.push('Specification');
    if (!projects[idx].stagesCompleted.includes('Requirements')) projects[idx].stagesCompleted.push('Requirements');
    projects[idx].stagesCompleted = projects[idx].stagesCompleted.filter((s) => s !== 'Optimisation' && s !== 'Results');
    projects[idx].updatedAt = nowIso();
    writeCollection('projects', projects);

    this.recordReset();
    return projects[idx];
  }

  resetAllProjects() {
    const projects = readCollection('projects');
    for (const p of projects) this.resetProject(p.id);
    this.recordReset();
    return projects.length;
  }

  recordReset() {
    const status = readObject('systemStatus');
    status.lastResetAt = nowIso();
    writeObject('systemStatus', status);
  }

  // ---- Materials library (MAT-09) --------------------------------------

  listMaterials() {
    return readCollection('materials');
  }

  upsertMaterial(materialId, patch) {
    const materials = readCollection('materials');
    const idx = materials.findIndex((m) => m.id === materialId);
    if (idx === -1) throw new ApiError(404, 'MATERIAL_NOT_FOUND', 'Material not found.');
    materials[idx] = { ...materials[idx], ...patch, id: materialId };
    writeCollection('materials', materials);
    return materials[idx];
  }

  setMaterialActive(materialId, active) {
    return this.upsertMaterial(materialId, { active });
  }

  // ---- Regulatory rules (REG-09) ----------------------------------------

  getRegulations() {
    return readObject('regulations');
  }

  updateRegulations(patch) {
    const current = readObject('regulations');
    const updated = {
      ukEpr: { ...current.ukEpr, ...(patch.ukEpr || {}) },
      euPpwr: { ...current.euPpwr, ...(patch.euPpwr || {}) },
    };
    writeObject('regulations', updated);
    return updated;
  }

  // ---- Scoring weights (ADMIN-08) ----------------------------------------

  getScoringWeights() {
    return readObject('scoring');
  }

  updateScoringWeights(weights) {
    const total = Object.values(weights).reduce((sum, v) => sum + Number(v), 0);
    if (Math.abs(total - 1) > 0.01) {
      throw new ApiError(400, 'INVALID_WEIGHTS', 'Scoring weights must sum to 100%.');
    }
    writeObject('scoring', { weights });
    return { weights };
  }

  // ---- System status (ADMIN-09) -------------------------------------------

  systemStatus() {
    const stored = readObject('systemStatus');
    return {
      totalProjects: readCollection('projects').length,
      totalUsers: readCollection('users').length,
      lastResetAt: stored.lastResetAt || null,
    };
  }
}

module.exports = new AdminService();
