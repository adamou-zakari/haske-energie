import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Brain, Zap, AlertTriangle, CheckCircle, Sun, Thermometer, Activity } from 'lucide-react';
import api from '../services/api';

const AI = () => {
  // Valeurs par défaut réalistes pour panneau 50W au Niger (midi ensoleillé)
  const [irradiation, setIrradiation] = useState(0.85);
  const [ambientTemp, setAmbientTemp] = useState(32);
  const [moduleTemp, setModuleTemp] = useState(45);
  const [acPower, setAcPower] = useState(48);
  
  const [prediction, setPrediction] = useState(null);
  const [anomaly, setAnomaly] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiServiceStatus, setAiServiceStatus] = useState('checking');
  const [predictionHistory, setPredictionHistory] = useState([]);
  
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

      // Prédiction de puissance
      const predResponse = await api.post('/ai/predict/power', predictionData);
      if (predResponse.data.success) {
        const predData = predResponse.data.data;
        setPrediction(predData);
        
        const newEntry = {
          time: new Date().toLocaleTimeString(),
          actual: parseFloat(acPower),
          predicted: predData.predicted_power
        };
        setPredictionHistory(prev => [...prev.slice(-9), newEntry]);
      }

      // Détection d'anomalie
      const anomalyResponse = await api.post('/ai/detect/anomaly', anomalyData);
      if (anomalyResponse.data.success) {
        setAnomaly(anomalyResponse.data.data);
      }

    } catch (error) {
      console.error('Erreur prédiction:', error);
      alert(`Erreur: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (aiServiceStatus === 'online') return '#10B981';
    if (aiServiceStatus === 'offline') return '#E63946';
    return '#FDB913';
  };

  const getStatusText = () => {
    if (aiServiceStatus === 'checking') return 'Vérification...';
    if (aiServiceStatus === 'online') return 'Service IA opérationnel';
    if (aiServiceStatus === 'offline') return 'Service IA hors ligne';
    return 'Modèles non chargés';
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5F5F5',
      paddingBottom: '3rem'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '3rem 1.5rem'
      }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <Brain size={32} color="#1A3A5C" strokeWidth={2.5} />
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#1A3A5C',
              margin: 0
            }}>
              Intelligence Artificielle
            </h1>
          </div>

          {/* Status IA */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '9999px',
            backgroundColor: `${getStatusColor()}20`,
            border: `2px solid ${getStatusColor()}`
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(),
              animation: aiServiceStatus === 'online' ? 'pulse 2s infinite' : 'none'
            }} />
            <span style={{
              color: getStatusColor(),
              fontWeight: '600',
              fontSize: '0.875rem'
            }}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* Formulaire */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem',
          borderTop: '4px solid #1A3A5C'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1A3A5C',
            marginBottom: '1.5rem'
          }}>
            Paramètres de Prédiction
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#4B5563',
                fontWeight: '600',
                marginBottom: '0.5rem',
                fontSize: '0.875rem'
              }}>
                <Sun size={16} color="#F59E0B" />
                Irradiation (kW/m²)
              </label>
              <input
                type="number"
                step="0.01"
                value={irradiation}
                onChange={(e) => setIrradiation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  transition: 'border-color 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#FDB913'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#4B5563',
                fontWeight: '600',
                marginBottom: '0.5rem',
                fontSize: '0.875rem'
              }}>
                <Thermometer size={16} color="#E63946" />
                Température Ambiante (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={ambientTemp}
                onChange={(e) => setAmbientTemp(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
                onFocus={(e) => e.target.style.borderColor = '#FDB913'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#4B5563',
                fontWeight: '600',
                marginBottom: '0.5rem',
                fontSize: '0.875rem'
              }}>
                <Activity size={16} color="#10B981" />
                Température Module (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={moduleTemp}
                onChange={(e) => setModuleTemp(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
                onFocus={(e) => e.target.style.borderColor = '#FDB913'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#4B5563',
                fontWeight: '600',
                marginBottom: '0.5rem',
                fontSize: '0.875rem'
              }}>
                <Zap size={16} color="#FDB913" />
                Puissance Actuelle (W)
              </label>
              <input
                type="number"
                step="1"
                value={acPower}
                onChange={(e) => setAcPower(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
                onFocus={(e) => e.target.style.borderColor = '#FDB913'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>
          </div>

          <button
            onClick={handlePredict}
            disabled={loading || aiServiceStatus !== 'online'}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: loading || aiServiceStatus !== 'online' ? '#9CA3AF' : '#FDB913',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading || aiServiceStatus !== 'online' ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 6px rgba(253, 185, 19, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? (
              <>⏳ Analyse en cours...</>
            ) : (
              <>
                <Zap size={20} />
                Lancer la Prédiction
              </>
            )}
          </button>
        </div>

        {/* Résultats */}
        {prediction && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Carte Prédiction */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              borderTop: '4px solid #FDB913'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Zap size={24} color="#FDB913" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1A3A5C', margin: 0 }}>
                  Prédiction de Puissance
                </h3>
              </div>
              <div style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: '#FDB913',
                marginBottom: '0.5rem'
              }}>
                {prediction.predicted_power.toFixed(2)} W
              </div>
              <div style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                {new Date(prediction.timestamp).toLocaleString('fr-FR')}
              </div>
            </div>

            {/* Carte Anomalie */}
            {anomaly && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                borderTop: `4px solid ${anomaly.is_anomaly ? '#E63946' : '#10B981'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  {anomaly.is_anomaly ? 
                    <AlertTriangle size={24} color="#E63946" /> :
                    <CheckCircle size={24} color="#10B981" />
                  }
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1A3A5C', margin: 0 }}>
                    Détection d'Anomalie
                  </h3>
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: anomaly.is_anomaly ? '#E63946' : '#10B981',
                  marginBottom: '0.75rem'
                }}>
                  {anomaly.is_anomaly ? 'ANOMALIE DÉTECTÉE' : 'FONCTIONNEMENT NORMAL'}
                </div>
                {anomaly.is_anomaly && (
                  <div style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                    <p style={{ margin: '0.25rem 0' }}><strong>Type:</strong> {anomaly.anomaly_type}</p>
                    <p style={{ margin: '0.25rem 0' }}><strong>Sévérité:</strong> {anomaly.severity}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Graphique */}
        {predictionHistory.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            borderTop: '4px solid #10B981'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1A3A5C',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Activity size={20} color="#10B981" />
              Comparaison Réel vs Prédit
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={predictionHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="time" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="actual" stroke="#1A3A5C" name="Réel" strokeWidth={2} />
                <Line type="monotone" dataKey="predicted" stroke="#FDB913" name="Prédit" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default AI;

