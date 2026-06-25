/**
 * Contrôleur IA - Pont entre React et Flask
 * Haské Énergie — Adamou Zakari & Sallah Alkassoum
 */

const axios = require('axios');

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5001';

/** Vérifier l'état du service IA */
const checkAIHealth = async (req, res) => {
  try {
    const response = await axios.get(`${FLASK_API_URL}/health`);
    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    res.status(503).json({ success: false, message: 'Service IA indisponible', error: error.message });
  }
};

/** Prédire la production d'énergie (modèle Random Forest) */
const predictPower = async (req, res) => {
  try {
    const { irradiation, ambient_temperature } = req.body;
    if (irradiation == null || ambient_temperature == null) {
      return res.status(400).json({ success: false, message: 'Données incomplètes' });
    }
    const response = await axios.post(`${FLASK_API_URL}/predict/power`, {
      irradiation:         parseFloat(irradiation),
      ambient_temperature: parseFloat(ambient_temperature)
    });
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la prédiction', error: error.response?.data || error.message });
  }
};

/** Détecter les anomalies (simulateur du modèle) */
const detectAnomaly = async (req, res) => {
  try {
    const { ac_power, irradiation, ambient_temperature } = req.body;
    if (ac_power == null || !irradiation || !ambient_temperature) {
      return res.status(400).json({ success: false, message: 'Données incomplètes' });
    }
    const response = await axios.post(`${FLASK_API_URL}/detect/anomaly`, {
      ac_power:            parseFloat(ac_power),
      irradiation:         parseFloat(irradiation),
      ambient_temperature: parseFloat(ambient_temperature)
    });
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la détection', error: error.response?.data || error.message });
  }
};

/** Détection d'anomalie EN TEMPS RÉEL (signaux réellement mesurés par l'ESP32) */
const detectAnomalyRealtime = async (req, res) => {
  try {
    const response = await axios.post(`${FLASK_API_URL}/detect/anomaly/realtime`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la détection temps réel', error: error.response?.data || error.message });
  }
};

/** Prédictions multiples (batch) */
const predictBatch = async (req, res) => {
  try {
    const { data } = req.body;
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ success: false, message: 'Format de données invalide' });
    }
    const response = await axios.post(`${FLASK_API_URL}/predict/batch`, { data });
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors des prédictions', error: error.response?.data || error.message });
  }
};

/**
 * PRÉVISION DE PRODUCTION via météo (Open-Meteo, gratuit, sans clé)
 * Récupère le rayonnement prévu pour Niamey -> convertit W/m² en irradiation 0..1
 * -> passe au modèle (batch) -> renvoie la production prévue heure par heure.
 */
const getForecast = async (req, res) => {
  try {
    // 1. Météo Niamey (prochaines heures)
    const url = 'https://api.open-meteo.com/v1/forecast'
      + '?latitude=13.51&longitude=2.13'
      + '&hourly=shortwave_radiation,temperature_2m'
      + '&timezone=auto&forecast_days=2';
    const meteo = await axios.get(url);
    const H = meteo.data.hourly;
    const times = H.time || [];
    const swr   = H.shortwave_radiation || [];
    const temp  = H.temperature_2m || [];

    // 2. Garder les 24 prochaines heures (à partir de maintenant)
    const now = new Date();
    const items = [];
    for (let i = 0; i < times.length && items.length < 24; i++) {
      if (new Date(times[i]) >= now) {
        items.push({
          time: times[i],
          irradiation: Math.min((swr[i] || 0) / 1000, 1),   // W/m² -> 0..1 (1000 ≈ plein soleil)
          ambient_temperature: temp[i] != null ? temp[i] : 30,
        });
      }
    }

    if (items.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // 3. Prédire la production de chaque heure via Flask (batch)
    const flask = await axios.post(`${FLASK_API_URL}/predict/batch`, {
      data: items.map(it => ({ irradiation: it.irradiation, ambient_temperature: it.ambient_temperature })),
    });
    const predictions = flask.data?.data?.predictions || [];

    // 4. Combiner heure + ensoleillement prévu + production prévue
    const forecast = items.map((it, i) => ({
      time:            it.time.slice(11, 16),                       // HH:MM
      irradiation:     Math.round(it.irradiation * 100),           // en %
      predicted_power: predictions[i] != null ? predictions[i] : null,
    }));

    res.status(200).json({ success: true, data: forecast });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur prévision météo', error: error.response?.data || error.message });
  }
};

module.exports = {
  checkAIHealth,
  predictPower,
  detectAnomaly,
  detectAnomalyRealtime,
  predictBatch,
  getForecast,
};