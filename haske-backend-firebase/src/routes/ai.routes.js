/**
 * Routes IA
 * Haské Énergie
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

// Vérifier l'état du service IA
router.get('/health', aiController.checkAIHealth);

// Prédire la production d'énergie
router.post('/predict/power', aiController.predictPower);

// Détecter les anomalies
router.post('/detect/anomaly', aiController.detectAnomaly);

// Prédictions multiples
router.post('/predict/batch', aiController.predictBatch);

module.exports = router;