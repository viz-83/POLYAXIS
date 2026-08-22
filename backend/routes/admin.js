const express = require('express');
const AdminService = require('../services/AdminService');
const { requireAdmin } = require('../middleware/auth');

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

router.patch('/materials/:id', (req, res) => {
  const material = AdminService.upsertMaterial(req.params.id, req.body);
  res.json({ material });
});

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
