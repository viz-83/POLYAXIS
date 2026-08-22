const express = require('express');
const PackagingEngine = require('../services/PackagingEngine');
const RecommendationEngine = require('../services/RecommendationEngine');
const DashboardModule = require('../services/DashboardModule');
const ConstraintChecker = require('../services/ConstraintChecker');
const { readCollection } = require('../utils/dataStore');
const { validateBody } = require('../middleware/validate');
const { ApiError } = require('../middleware/errorHandler');

const router = express.Router();

const PRODUCT_TYPES = ['Fresh Food', 'Ambient Food', 'Frozen Food', 'Consumer Goods', 'Industrial', 'Other'];

// ---- Projects -------------------------------------------------------------

router.get('/', (req, res) => {
  res.json({ projects: PackagingEngine.listProjectsForUser(req.user) });
});

router.post(
  '/',
  validateBody({
    name: { required: true, type: 'string' },
    productType: { required: true, type: 'string', enum: PRODUCT_TYPES },
  }),
  (req, res) => {
    const project = PackagingEngine.createProject(req.user, req.body);
    res.status(201).json({ project });
  }
);

router.get('/:id', (req, res) => {
  const project = PackagingEngine.getProject(req.params.id, req.user);
  res.json({ project });
});

router.patch('/:id', (req, res) => {
  const project = PackagingEngine.updateProject(req.params.id, req.user, req.body);
  res.json({ project });
});

// ---- Packaging specification -----------------------------------------------

router.post('/:id/specification', (req, res) => {
  PackagingEngine.getProject(req.params.id, req.user); // ownership check
  const spec = PackagingEngine.saveSpecification(req.params.id, req.body);
  res.json({ specification: spec });
});

router.get('/:id/specification', (req, res) => {
  PackagingEngine.getProject(req.params.id, req.user);
  res.json({ specification: PackagingEngine.getSpecification(req.params.id) });
});

// ---- Performance requirements ------------------------------------------------

router.post('/:id/requirements', (req, res) => {
  PackagingEngine.getProject(req.params.id, req.user);
  const requirements = PackagingEngine.saveRequirements(req.params.id, req.body);
  res.json({ requirements });
});

router.get('/:id/requirements', (req, res) => {
  PackagingEngine.getProject(req.params.id, req.user);
  res.json({ requirements: PackagingEngine.getRequirements(req.params.id) });
});

// ---- Manufacturing constraints ------------------------------------------------

router.post('/:id/manufacturing', (req, res) => {
  PackagingEngine.getProject(req.params.id, req.user);
  const manufacturing = PackagingEngine.saveManufacturing(req.params.id, req.body);
  res.json({ manufacturing });
});

router.get('/:id/manufacturing', (req, res) => {
  PackagingEngine.getProject(req.params.id, req.user);
  res.json({ manufacturing: PackagingEngine.getManufacturing(req.params.id) });
});

// ---- Regulatory requirements ---------------------------------------------------

router.post('/:id/regulatory', (req, res) => {
  PackagingEngine.getProject(req.params.id, req.user);
  const regulatory = PackagingEngine.saveRegulatory(req.params.id, req.body);
  res.json({ regulatory });
});

router.get('/:id/regulatory', (req, res) => {
  PackagingEngine.getProject(req.params.id, req.user);
  res.json({ regulatory: PackagingEngine.getRegulatory(req.params.id) });
});

// ---- Candidate materials overview (MAT-04/05/08) -----------------------------------

router.get('/:id/materials-overview', (req, res) => {
  PackagingEngine.getProject(req.params.id, req.user);
  const manufacturing = PackagingEngine.getManufacturing(req.params.id);
  const regulatorySettings = PackagingEngine.getRegulatory(req.params.id);
  const regulations = ConstraintChecker.regulations();
  const materials = readCollection('materials').filter((m) => m.active !== false);

  const overview = materials.map((material) => ({
    material,
    manufacturingCheck: ConstraintChecker.manufacturingFeasibility(material, manufacturing),
    regulatoryCheck: ConstraintChecker.regulatoryCompliance(material, regulatorySettings, regulations),
  }));

  res.json({ overview });
});

// ---- Optimisation engine ----------------------------------------------------------

router.post('/:id/run-optimisation', (req, res) => {
  PackagingEngine.getProject(req.params.id, req.user);
  const selectedMaterialIds = Array.isArray(req.body.materialIds) ? req.body.materialIds : undefined;
  if (!selectedMaterialIds || selectedMaterialIds.length === 0) {
    throw new ApiError(400, 'NO_MATERIALS_SELECTED', 'Select at least one candidate material before running the optimisation engine.');
  }
  const recommendation = RecommendationEngine.runOptimisation(req.params.id, req.user, selectedMaterialIds);
  res.json({ recommendation });
});

router.get('/:id/recommendation', (req, res) => {
  PackagingEngine.getProject(req.params.id, req.user);
  const recommendation = RecommendationEngine.getLatestRecommendation(req.params.id);
  res.json({ recommendation });
});

router.get('/:id/recommendation/history', (req, res) => {
  PackagingEngine.getProject(req.params.id, req.user);
  res.json({ runs: RecommendationEngine.getAllRuns(req.params.id) });
});

// ---- Trial results & re-optimisation -----------------------------------------------

router.post(
  '/:id/trial-result',
  validateBody({
    performanceResult: { required: true, type: 'string', enum: ['Pass', 'Fail'] },
    manufacturingResult: { required: true, type: 'string', enum: ['Pass', 'Fail'] },
    regulatoryResult: { required: true, type: 'string', enum: ['Pass', 'Fail'] },
  }),
  (req, res) => {
    PackagingEngine.getProject(req.params.id, req.user);
    const { result, updatedRecommendation } = RecommendationEngine.submitTrialResult(req.params.id, req.user, req.body);
    res.status(201).json({ result, updatedRecommendation });
  }
);

router.get('/:id/trial-results', (req, res) => {
  PackagingEngine.getProject(req.params.id, req.user);
  res.json({ results: RecommendationEngine.getResults(req.params.id) });
});

router.post('/:id/re-optimise', (req, res) => {
  PackagingEngine.getProject(req.params.id, req.user);
  const recommendation = RecommendationEngine.reOptimise(req.params.id, req.user);
  res.json({ recommendation });
});

// ---- Dashboard ------------------------------------------------------------------------

router.get('/:id/dashboard', (req, res) => {
  const dashboard = DashboardModule.build(req.params.id, req.user);
  res.json({ dashboard });
});

module.exports = router;
module.exports.PRODUCT_TYPES = PRODUCT_TYPES;
