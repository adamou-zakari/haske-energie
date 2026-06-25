// src/routes/sensors.routes.js

const express = require('express');
const router = express.Router();
const controller = require('../controllers/sensors.controller');

// ── CAPTEURS ──────────────────────────────────
router.post('/data',         controller.receiveSensorData);
router.get('/latest',        controller.getLatestData);
router.get('/history',       controller.getHistoricalData);
router.get('/stats',         controller.getStats);

// ── ALERTES ───────────────────────────────────
router.get('/alerts',           controller.getAlerts);
router.get('/alerts/all',       controller.getAllAlerts);
router.put('/alerts/:id/resolve', controller.resolveAlert);

module.exports = router;