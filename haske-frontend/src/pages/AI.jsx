import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import './AI.css';

const AI = () => {
  const [irradiation, setIrradiation] = useState(0.5);
  const [ambientTemp, setAmbientTemp] = useState(25);
  const [moduleTemp, setModuleTemp] = useState(35);
  const [acPower, setAcPower] = useState(150);
  
  const [prediction, setPrediction] = useState(null);
  const [anomaly, setAnomaly] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiServiceStatus, setAiServiceStatus] = useState('checking');
  
  const [predictionHistory, setPredictionHistory] = useState([]);

  // Vérifier l'état du service IA au chargement
  useEffect(() => {
    checkAIService();
  }, []);

  const checkAIService = async () => {
    try {
      const response = await api.get('/ai/health');
      if (response.data.success && response.data.data.models_loaded) {
        setAiServiceStatus('online');
      } else {
        setAiServiceStatus('models_not_loaded');
      }
    } catch (error) {
      console.error('Erreur vérification service IA:', error);
      setAiServiceStatus('offline');
    }
  };

  const handlePredict = async () => {
  setLoading(true);
  try {
    console.log('=== DÉBUT PRÉDICTION ===');
    
    // Préparer les données
    const predictionData = {
      irradiation: parseFloat(irradiation),
      ambient_temperature: parseFloat(ambientTemp),
      module_temperature: parseFloat(moduleTemp)
    };
    
    const anomalyData = {
      ac_power: parseFloat(acPower),
      irradiation: parseFloat(irradiation),
      ambient_temperature: parseFloat(ambientTemp)
    };
    
    console.log('Données prédiction:', predictionData);
    console.log('Données anomalie:', anomalyData);
    
    // 1. Prédiction de puissance
    console.log('Appel /ai/predict/power...');
    const predResponse = await api.post('/ai/predict/power', predictionData);
    console.log('Réponse prédiction:', predResponse.data);

    if (predResponse.data.success) {
      setPrediction(predResponse.data.data);
      
      // Ajouter à l'historique
      const newEntry = {
        time: new Date().toLocaleTimeString(),
        actual: parseFloat(acPower),
        predicted: predResponse.data.data.predicted_power
      };
      setPredictionHistory(prev => [...prev.slice(-9), newEntry]);
    }

    // 2. Détection d'anomalie
    console.log('Appel /ai/detect/anomaly...');
    const anomalyResponse = await api.post('/ai/detect/anomaly', anomalyData);
    console.log('Réponse anomalie:', anomalyResponse.data);

    if (anomalyResponse.data.success) {
      setAnomaly(anomalyResponse.data.data);
    }
    
    console.log('=== FIN PRÉDICTION ===');

  } catch (error) {
    console.error('=== ERREUR PRÉDICTION ===');
    console.error('Message:', error.message);
    console.error('Response:', error.response?.data);
    console.error('Status:', error.response?.status);
    alert(`Erreur: ${error.response?.data?.message || error.message}`);
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="ai-page">
      <h1>🤖 Intelligence Artificielle</h1>
      
      {/* Status du service IA */}
      <div className={`ai-status ${aiServiceStatus}`}>
        {aiServiceStatus === 'checking' && '🔄 Vérification du service IA...'}
        {aiServiceStatus === 'online' && '✅ Service IA opérationnel - Modèles chargés'}
        {aiServiceStatus === 'models_not_loaded' && '⚠️ Service IA actif mais modèles non chargés'}
        {aiServiceStatus === 'offline' && '❌ Service IA hors ligne - Vérifiez les services'}
      </div>

      {/* Formulaire de prédiction */}
      <div className="ai-form-container">
        <h2>📊 Prédiction de Production</h2>
        
        <div className="form-grid">
          <div className="form-group">
            <label>☀️ Irradiation (kW/m²)</label>
            <input
              type="number"
              step="0.01"
              value={irradiation}
              onChange={(e) => setIrradiation(e.target.value)}
              placeholder="0.5"
            />
          </div>

          <div className="form-group">
            <label>🌡️ Température Ambiante (°C)</label>
            <input
              type="number"
              step="0.1"
              value={ambientTemp}
              onChange={(e) => setAmbientTemp(e.target.value)}
              placeholder="25"
            />
          </div>

          <div className="form-group">
            <label>📟 Température Module (°C)</label>
            <input
              type="number"
              step="0.1"
              value={moduleTemp}
              onChange={(e) => setModuleTemp(e.target.value)}
              placeholder="35"
            />
          </div>

          <div className="form-group">
            <label>⚡ Puissance Actuelle (W)</label>
            <input
              type="number"
              step="1"
              value={acPower}
              onChange={(e) => setAcPower(e.target.value)}
              placeholder="150"
            />
          </div>
        </div>

        <button 
          onClick={handlePredict} 
          disabled={loading || aiServiceStatus !== 'online'}
          className="predict-btn"
        >
          {loading ? '⏳ Analyse en cours...' : '🚀 Lancer la prédiction'}
        </button>
      </div>

      {/* Résultats */}
      {prediction && (
        <div className="results-container">
          <div className="result-card prediction-card">
            <h3>⚡ Prédiction de Puissance</h3>
            <div className="result-value">
              {prediction.predicted_power.toFixed(2)} W
            </div>
            <div className="result-meta">
              <span>Confiance: {prediction.confidence}</span>
              <span>Heure: {new Date(prediction.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>

          {anomaly && (
            <div className={`result-card anomaly-card ${anomaly.severity}`}>
              <h3>🔍 Détection d'Anomalie</h3>
              <div className="anomaly-status">
                {anomaly.is_anomaly ? '⚠️ ANOMALIE DÉTECTÉE' : '✅ FONCTIONNEMENT NORMAL'}
              </div>
              {anomaly.is_anomaly && (
                <div className="anomaly-details">
                  <p><strong>Type:</strong> {anomaly.anomaly_type}</p>
                  <p><strong>Sévérité:</strong> {anomaly.severity}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Graphique comparatif */}
      {predictionHistory.length > 0 && (
        <div className="chart-container">
          <h3>📈 Historique des Prédictions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={predictionHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="actual" stroke="#8884d8" name="Puissance Réelle" />
              <Line type="monotone" dataKey="predicted" stroke="#82ca9d" name="Puissance Prédite" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Informations sur les modèles */}
      <div className="model-info">
        <h3>🧠 Modèles Utilisés</h3>
        <ul>
          <li>✅ Random Forest Regressor - Prédiction de production</li>
          <li>✅ Isolation Forest - Détection d'anomalies</li>
          <li>📊 Entraînés sur 68 528 échantillons réels</li>
          <li>🎯 Précision: R² Score 0.99+</li>
        </ul>
      </div>
    </div>
  );
};

export default AI;