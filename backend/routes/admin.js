const express = require('express');
const AdminService = require('../services/AdminService');
const { requireAdmin } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { schemas, cross } = require('../middleware/schemas');

const router = express.Router();

// ADMIN-01: every route below is Administrator-only.
router.use(requireAdmin);

router.get('/scenarios', (req, res) => {
  res.json({ projects: AdminService.listAllProjects() });
});

router.post('/scenarios/reset', (req, res) => {
  if (req.body && req.body.projectId) {
    const project = AdminService.resetProject(req.body.projectId);
    return res.json({ project });
  }
  const count = AdminService.resetAllProjects();
  res.json({ resetCount: count });
});

router.get('/materials', (req, res) => {
  res.json({ materials: AdminService.listMaterials() });
});

// MAT-09 / ADMIN-05: add a material to the library.
router.post('/materials', validateBody(schemas.material(true), cross.material), (req, res) => {
  res.status(201).json({ material: AdminService.createMaterial(req.body) });
});

// MAT-09 / ADMIN-05: edit a material profile (partial update).
router.patch('/materials/:id', validateBody(schemas.material(false), cross.material), (req, res) => {
  res.json({ material: AdminService.updateMaterial(req.params.id, req.body) });
});

// MAT-09 / ADMIN-06: enable / disable a material.
router.patch('/materials/:id/active', (req, res) => {
  const material = AdminService.setMaterialActive(req.params.id, Boolean(req.body.active));
  res.json({ material });
});

router.get('/regulations', (req, res) => {
  res.json({ regulations: AdminService.getRegulations() });
});

router.patch('/regulations', (req, res) => {
  res.json({ regulations: AdminService.updateRegulations(req.body) });
});

router.get('/scoring', (req, res) => {
  res.json({ scoring: AdminService.getScoringWeights() });
});

router.patch('/scoring', (req, res) => {
  res.json(AdminService.updateScoringWeights(req.body.weights || req.body));
});

router.get('/status', (req, res) => {
  res.json({ status: AdminService.systemStatus() });
});

module.exports = router;
