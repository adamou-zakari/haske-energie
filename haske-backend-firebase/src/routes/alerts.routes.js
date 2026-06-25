// haske-backend-firebase/src/routes/alerts.routes.js
// Haské Énergie — routes des alertes
// Les fonctions sont déjà dans sensors.controller.js, on les expose juste.

const express = require('express');
const router = express.Router();
const sensorsController = require('../controllers/sensors.controller');

// GET  /api/alerts             -> alertes non résolues
router.get('/', sensorsController.getAlerts);

// GET  /api/alerts/all         -> toutes les alertes (100 dernières)
router.get('/all', sensorsController.getAllAlerts);

// PUT  /api/alerts/:id/resolve -> marquer une alerte comme résolue
router.put('/:id/resolve', sensorsController.resolveAlert);

module.exports = router;