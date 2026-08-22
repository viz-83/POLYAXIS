const { v4: uuid } = require('uuid');
const { readCollection, writeCollection, nowIso } = require('../utils/dataStore');
const { ApiError } = require('../middleware/errorHandler');

const STAGES = ['Specification', 'Requirements', 'Materials', 'Optimisation', 'Results'];

/**
 * PackagingEngine — project lifecycle, packaging specification, and performance /
 * manufacturing / regulatory requirement storage & retrieval (Modules 2 & 3).
 */
class PackagingEngine {
  // ---- Projects -----------------------------------------------------

  listProjectsForUser(user) {
    const projects = readCollection('projects');
    const scoped = user.role === 'Administrator' ? projects : projects.filter((p) => p.userId === user.id);
    return scoped.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  getProject(projectId, user) {
    const project = readCollection('projects').find((p) => p.id === projectId);
    if (!project) throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project not found.');
    if (user.role !== 'Administrator' && project.userId !== user.id) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this project.');
    }
    return project;
  }

  createProject(user, payload) {
    const projects = readCollection('projects');
    const project = {
      id: uuid(),
      userId: user.id,
      name: payload.name,
      productType: payload.productType,
      description: payload.description || '',
      transitionObjective: payload.transitionObjective || '',
      stage: 'Specification',
      stagesCompleted: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    projects.push(project);
    writeCollection('projects', projects);
    return project;
  }

  updateProject(projectId, user, patch) {
    const projects = readCollection('projects');
    const idx = projects.findIndex((p) => p.id === projectId);
    if (idx === -1) throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project not found.');
    const project = projects[idx];
    if (user.role !== 'Administrator' && project.userId !== user.id) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this project.');
    }
    const allowed = ['name', 'productType', 'description', 'transitionObjective'];
    for (const key of allowed) {
      if (patch[key] !== undefined) project[key] = patch[key];
    }
    project.updatedAt = nowIso();
    projects[idx] = project;
    writeCollection('projects', projects);
    return project;
  }

  advanceStage(projectId, stageJustCompleted) {
    const projects = readCollection('projects');
    const idx = projects.findIndex((p) => p.id === projectId);
    if (idx === -1) return;
    const project = projects[idx];
    if (!project.stagesCompleted.includes(stageJustCompleted)) {
      project.stagesCompleted.push(stageJustCompleted);
    }
    const nextIdx = STAGES.indexOf(stageJustCompleted) + 1;
    if (nextIdx < STAGES.length && STAGES.indexOf(project.stage) < nextIdx) {
      project.stage = STAGES[nextIdx];
    }
    project.updatedAt = nowIso();
    projects[idx] = project;
    writeCollection('projects', projects);
  }

  // ---- Packaging specification (SPEC-01 / SPEC-02) -------------------

  saveSpecification(projectId, data) {
    const specs = readCollection('specifications');
    const idx = specs.findIndex((s) => s.projectId === projectId);
    const record = {
      id: idx === -1 ? uuid() : specs[idx].id,
      projectId,
      existingMaterial: data.existingMaterial || '',
      layerStructure: data.layerStructure || '',
      currentShelfLifeMonths: data.currentShelfLifeMonths ?? null,
      currentOtr: data.currentOtr ?? null,
      currentWvtr: data.currentWvtr ?? null,
      currentRecyclabilityStatus: data.currentRecyclabilityStatus || 'Unknown',
      targetMaterialType: data.targetMaterialType || '',
      targetRecyclabilityPercent: data.targetRecyclabilityPercent ?? null,
      targetRecyclingStream: data.targetRecyclingStream || '',
      transitionPriority: data.transitionPriority || 'Recyclability',
      updatedAt: nowIso(),
    };
    if (idx === -1) specs.push(record); else specs[idx] = record;
    writeCollection('specifications', specs);
    this.advanceStage(projectId, 'Specification');
    return record;
  }

  getSpecification(projectId) {
    return readCollection('specifications').find((s) => s.projectId === projectId) || null;
  }

  // ---- Performance requirements (SPEC-03..06) ------------------------

  saveRequirements(projectId, data) {
    const list = readCollection('requirements');
    const idx = list.findIndex((r) => r.projectId === projectId);
    const record = {
      id: idx === -1 ? uuid() : list[idx].id,
      projectId,
      otrTarget: data.otrTarget ?? null,
      wvtrTarget: data.wvtrTarget ?? null,
      sealStrengthMinimum: data.sealStrengthMinimum ?? null,
      shelfLifeRequirementMonths: data.shelfLifeRequirementMonths ?? null,
      productSensitivity: data.productSensitivity || 'Standard',
      recyclabilityTargetPercent: data.recyclabilityTargetPercent ?? null,
      additionalParameters: data.additionalParameters || '',
      updatedAt: nowIso(),
    };
    if (idx === -1) list.push(record); else list[idx] = record;
    writeCollection('requirements', list);
    this.advanceStage(projectId, 'Requirements');
    return record;
  }

  getRequirements(projectId) {
    return readCollection('requirements').find((r) => r.projectId === projectId) || null;
  }

  // ---- Manufacturing constraints (Module 4) ---------------------------

  saveManufacturing(projectId, data) {
    const list = readCollection('manufacturing');
    const idx = list.findIndex((m) => m.projectId === projectId);
    const record = {
      id: idx === -1 ? uuid() : list[idx].id,
      projectId,
      equipmentTypes: Array.isArray(data.equipmentTypes) ? data.equipmentTypes : [data.equipmentTypes].filter(Boolean),
      temperatureMinC: data.temperatureMinC ?? null,
      temperatureMaxC: data.temperatureMaxC ?? null,
      lineSpeedMinMpm: data.lineSpeedMinMpm ?? null,
      lineSpeedMaxMpm: data.lineSpeedMaxMpm ?? null,
      materialCompatibilityNote: data.materialCompatibilityNote || '',
      constraintFlexibility: data.constraintFlexibility || 'Hard',
      updatedAt: nowIso(),
    };
    if (idx === -1) list.push(record); else list[idx] = record;
    writeCollection('manufacturing', list);
    return record;
  }

  getManufacturing(projectId) {
    return readCollection('manufacturing').find((m) => m.projectId === projectId) || null;
  }

  // ---- Regulatory requirements (Module 5) ------------------------------

  saveRegulatory(projectId, data) {
    const list = readCollection('regulatory');
    const idx = list.findIndex((r) => r.projectId === projectId);
    const record = {
      id: idx === -1 ? uuid() : list[idx].id,
      projectId,
      ukEprEnabled: Boolean(data.ukEprEnabled),
      ukEprMandatory: data.ukEprMandatory !== false,
      euPpwrEnabled: Boolean(data.euPpwrEnabled),
      euPpwrMandatory: Boolean(data.euPpwrMandatory),
      classificationPriority: data.classificationPriority || 'Most Restrictive',
      notes: data.notes || '',
      updatedAt: nowIso(),
    };
    if (idx === -1) list.push(record); else list[idx] = record;
    writeCollection('regulatory', list);
    this.advanceStage(projectId, 'Requirements');
    return record;
  }

  getRegulatory(projectId) {
    return readCollection('regulatory').find((r) => r.projectId === projectId) || null;
  }

  deleteProjectCascade(projectId) {
    const collections = ['specifications', 'requirements', 'manufacturing', 'regulatory', 'trials', 'results'];
    for (const name of collections) {
      const list = readCollection(name);
      writeCollection(name, list.filter((r) => r.projectId !== projectId));
    }
  }
}

module.exports = new PackagingEngine();
module.exports.STAGES = STAGES;
