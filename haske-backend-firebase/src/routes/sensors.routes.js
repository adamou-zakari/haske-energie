// Haské Énergie - Routes API
// Fichier : src/routes/sensors.routes.js

const express = require('express');
const router = express.Router();
const { SensorsController, AlertsController } = require('../controllers/sensors.controller');

// ============================================================
// ROUTES CAPTEURS
// ============================================================

// POST /api/sensors/data - Recevoir les données de l'ESP32
router.post('/sensors/data', SensorsController.receiveSensorData);

// GET /api/sensors/latest - Récupérer les dernières données
// Query params: ?limit=10
router.get('/sensors/latest', SensorsController.getLatestData);

// GET /api/sensors/history - Récupérer l'historique
// Query params: ?hours=24
router.get('/sensors/history', SensorsController.getHistoricalData);

// GET /api/sensors/stats - Récupérer les statistiques
router.get('/sensors/stats', SensorsController.getStats);

// ============================================================
// ROUTES ALERTES
// ============================================================

// GET /api/alerts - Récupérer les alertes non résolues
router.get('/alerts', AlertsController.getUnresolvedAlerts);

// GET /api/alerts/all - Récupérer toutes les alertes
router.get('/alerts/all', AlertsController.getAllAlerts);

// PUT /api/alerts/:id/resolve - Marquer une alerte comme résolue
router.put('/alerts/:id/resolve', AlertsController.resolveAlert);

module.exports = router;