/**
 * Routes IA — Haské Énergie
 */
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

router.get('/health', aiController.checkAIHealth);
router.post('/predict/power', aiController.predictPower);
router.post('/detect/anomaly', aiController.detectAnomaly);
router.post('/detect/anomaly/realtime', aiController.detectAnomalyRealtime);
router.post('/predict/batch', aiController.predictBatch);
router.get('/forecast', aiController.getForecast); // <-- NOUVEAU : prévision météo

module.exports = router;