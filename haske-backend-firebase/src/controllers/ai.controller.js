/**
 * Contrôleur IA - Pont entre React et Flask
 * Haské Énergie
 */

const axios = require('axios');

// URL de l'API Flask Python
const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5001';

/**
 * Vérifier l'état du service IA
 */
const checkAIHealth = async (req, res) => {
  try {
    const response = await axios.get(`${FLASK_API_URL}/health`);
    res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service IA indisponible',
      error: error.message
    });
  }
};

/**
 * Prédire la production d'énergie
 */
const predictPower = async (req, res) => {
  try {
    const { irradiation, ambient_temperature, module_temperature } = req.body;

    if (!irradiation || !ambient_temperature || !module_temperature) {
      return res.status(400).json({
        success: false,
        message: 'Données incomplètes'
      });
    }

    const response = await axios.post(`${FLASK_API_URL}/predict/power`, {
      irradiation: parseFloat(irradiation),
      ambient_temperature: parseFloat(ambient_temperature),
      module_temperature: parseFloat(module_temperature)
    });

    res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la prédiction',
      error: error.response?.data || error.message
    });
  }
};

/**
 * Détecter les anomalies
 */
const detectAnomaly = async (req, res) => {
  try {
    const { ac_power, irradiation, ambient_temperature } = req.body;

    if (!ac_power || !irradiation || !ambient_temperature) {
      return res.status(400).json({
        success: false,
        message: 'Données incomplètes'
      });
    }

    const response = await axios.post(`${FLASK_API_URL}/detect/anomaly`, {
      ac_power: parseFloat(ac_power),
      irradiation: parseFloat(irradiation),
      ambient_temperature: parseFloat(ambient_temperature)
    });

    res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la détection',
      error: error.response?.data || error.message
    });
  }
};

/**
 * Prédictions multiples (batch)
 */
const predictBatch = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Format de données invalide'
      });
    }

    const response = await axios.post(`${FLASK_API_URL}/predict/batch`, {
      data: data
    });

    res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors des prédictions',
      error: error.response?.data || error.message
    });
  }
};

module.exports = {
  checkAIHealth,
  predictPower,
  detectAnomaly,
  predictBatch
};