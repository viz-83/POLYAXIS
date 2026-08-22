const express = require('express');
const { readCollection } = require('../utils/dataStore');
const { ApiError } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/', (req, res) => {
  const materials = readCollection('materials').filter((m) => m.active !== false);
  res.json({ materials });
});

router.get('/:id', (req, res) => {
  const material = readCollection('materials').find((m) => m.id === req.params.id);
  if (!material) throw new ApiError(404, 'MATERIAL_NOT_FOUND', 'Material not found.');
  res.json({ material });
});

module.exports = router;
