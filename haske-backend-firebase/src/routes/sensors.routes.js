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
// Volontairement absentes ici : elles sont exposees une seule fois, dans
// routes/alerts.routes.js, monte sur /api/alerts. Les avoir en double sous
// /api/sensors/alerts creait deux chemins vers les memes fonctions.

module.exports = router;