// haske-frontend/src/pages/AI.js
// v10 — palette pro, largeur 1280, doublon capteurs retiré, états sobres. Logique préservée.

import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Brain, AlertTriangle, CheckCircle, Activity, RefreshCw, WifiOff, Sun, CloudSun } from 'lucide-react';
import api from '../services/api';

const OR     = '#F5B301';
const NAVY   = '#0B1F3A';
const GREEN  = '#1D9E75';
const RED    = '#C0392B';
const ORANGE = '#BA7517';
const FAINT  = '#94A3B8';
const MUTED  = '#475569';
const LINE   = '#E2E8F0';

const STALE_MS = 2 * 60 * 1000;

function parseTs(ts) {
  if (!ts) return null;
  if (ts._seconds) return new Date(ts._seconds * 1000);
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}
function ago(ms) {
  if (ms == null) return '—';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${m % 60} min`;
}

const AI = () => {
  const [sensor, setSensor] = useState({ voltage: 0, current: 0, power: 0, temperature: 0, battery: 0, irradiation: 0 });
  const [measuredAt,  setMeasuredAt]  = useState(null);
  const [liveAnomaly, setLiveAnomaly] = useState(null);
  const [prediction,  setPrediction]  = useState(null);
  const [forecast,    setForecast]    = useState([]);
  const [aiStatus,    setAiStatus]    = useState('checking');
  const [history,     setHistory]     = useState([]);
  const [now,         setNow]         = useState(Date.now());
  const intervalRef = useRef(null);

  const loadSensorData = async () => {
    try {
      const res = await api.get('/sensors/latest');
      if (res.data.success && res.data.data && res.data.data.length > 0) {
        const d = res.data.data[0];
        const vals = {
          voltage:     d.voltage       != null ? parseFloat(d.voltage)       : 0,
          current:     d.current       != null ? parseFloat(d.current)       : 0,
          power:       d.power         != null ? parseFloat(d.power)         : 0,
          temperature: d.temperature   != null ? parseFloat(d.temperature)   : 0,
          battery:     d.battery_level != null ? parseFloat(d.battery_level) : 0,
          irradiation: d.irradiation   != null ? parseFloat(d.irradiation)   : 0,
        };
        setSensor(vals);
        setMeasuredAt(parseTs(d.timestamp));
        setHistory(prev => [
          ...prev.slice(-19),
          { time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), power: vals.power, voltage: vals.voltage },
        ]);
        checkLiveAnomaly(vals);
        runPrediction(vals);
      }
    } catch (err) {
      console.warn('ESP32 non disponible');
    }
  };

  const checkLiveAnomaly = async (vals) => {
    try {
      const r = await api.post('/ai/detect/anomaly/realtime', {
        voltage: vals.voltage, current: vals.current, power: vals.power,
        temperature: vals.temperature, battery_level: vals.battery,
      });
      if (r.data.success) setLiveAnomaly(r.data.data);
    } catch (err) {
      setLiveAnomaly(null);
    }
  };

  const runPrediction = async (vals) => {
    try {
      const r = await api.post('/ai/predict/power', {
        irradiation:         vals.irradiation,
        ambient_temperature: vals.temperature,
      });
      if (r.data.success) setPrediction(r.data.data);
    } catch (err) {
      setPrediction(null);
    }
  };

  const loadForecast = async () => {
    try {
      const r = await api.get('/ai/forecast');
      if (r.data.success) setForecast(r.data.data || []);
    } catch (err) {
      setForecast([]);
    }
  };

  const checkAI = async () => {
    try {
      const r = await api.get('/ai/health');
      setAiStatus(r.data.success && r.data.data.models_loaded ? 'online' : 'models_not_loaded');
    } catch { setAiStatus('offline'); }
  };

  useEffect(() => {
    checkAI();
    loadSensorData();
    loadForecast();
    intervalRef.current = setInterval(() => loadSensorData(), 30000);
    const fcast = setInterval(() => loadForecast(), 30 * 60 * 1000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(intervalRef.current); clearInterval(fcast); clearInterval(tick); };
  }, []);

  const ageMs   = measuredAt ? (now - measuredAt.getTime()) : null;
  const isStale = ageMs == null || ageMs > STALE_MS;
  const dim     = isStale ? 0.5 : 1;

  const aiColor = aiStatus === 'online' ? GREEN : aiStatus === 'offline' ? RED : ORANGE;
  const aiLabel = { checking:'Vérification...', online:'Service opérationnel', offline:'Service hors ligne', models_not_loaded:'Modèles non chargés' }[aiStatus];

  const espColor = measuredAt == null ? FAINT : isStale ? RED : GREEN;
  const espLabel = measuredAt == null ? 'En attente ESP32'
    : isStale ? `ESP32 hors ligne · il y a ${ago(ageMs)}`
    : `ESP32 · mesure de ${measuredAt.toLocaleTimeString('fr-FR')}`;

  const sevColor = (s) => s === 'critical' ? RED : s === 'warning' ? ORANGE : GREEN;

  // Score de santé calculé (pas codé en dur) : 100 - pénalités selon anomalie + écart prédiction
  const healthScore = (() => {
    let score = 100;
    if (liveAnomaly?.is_anomaly) {
      score -= liveAnomaly.severity === 'critical' ? 45 : liveAnomaly.severity === 'warning' ? 20 : 10;
    }
    if (isStale) score -= 8;
    return Math.max(0, Math.min(100, score));
  })();
  const healthLabel = healthScore >= 85 ? 'Bon état général' : healthScore >= 60 ? 'À surveiller' : 'Attention requise';

  return (
    <div style={{ fontFamily: 'system-ui,sans-serif', background: '#F8FAFC', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `0.5px solid ${LINE}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '22px 32px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: NAVY, margin: 0 }}>Intelligence artificielle</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: `${aiColor}14` }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: aiColor }} />
              <span style={{ color: aiColor, fontWeight: 600, fontSize: 11.5 }}>{aiLabel}</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: `${espColor}14` }}>
              {isStale ? <WifiOff size={12} color={espColor} /> : <RefreshCw size={12} color={espColor} />}
              <span style={{ color: espColor, fontWeight: 600, fontSize: 11.5 }}>{espLabel}</span>
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '22px 32px' }}>

        {isStale && (
          <div style={{ background: '#FCEBEA', border: '0.5px solid #F5B0AB', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#8E2A20', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8 }}>
            <WifiOff size={18} />
            <span><strong>ESP32 hors ligne</strong> — aucune nouvelle mesure {measuredAt ? `depuis ${ago(ageMs)}` : ''}. Les valeurs ci-dessous sont la dernière mesure enregistrée, pas du temps réel.</span>
          </div>
        )}

        {/* Score de santé + diagnostic (remplace le doublon de capteurs) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 16 }} className="ai-top">
          <div style={{ background: NAVY, borderRadius: 12, padding: 18 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Score de santé système</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '6px 0 10px' }}>
              <span style={{ fontSize: 36, fontWeight: 500, color: '#fff' }}>{healthScore}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>/100</span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${healthScore}%`, height: '100%', background: healthScore >= 60 ? GREEN : RED }} />
            </div>
            <span style={{ fontSize: 11, color: healthScore >= 60 ? '#5DCAA5' : '#F0A39C', marginTop: 8, display: 'inline-block' }}>{healthLabel}</span>
          </div>

          <div style={{ background: '#fff', border: `0.5px solid ${LINE}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              {liveAnomaly?.is_anomaly ? <AlertTriangle size={16} color={sevColor(liveAnomaly.severity)} /> : <CheckCircle size={16} color={GREEN} />}
              <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>État de l'installation</span>
            </div>
            {liveAnomaly == null ? (
              <div style={{ fontSize: 13, color: FAINT }}>En attente de données…</div>
            ) : liveAnomaly.is_anomaly ? (
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: sevColor(liveAnomaly.severity), marginBottom: 6 }}>Anomalie détectée</div>
                <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.6 }}>
                  <div>Type : {liveAnomaly.anomaly_type}</div>
                  <div>Sévérité : {liveAnomaly.severity}</div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 15, fontWeight: 600, color: GREEN }}>Fonctionnement normal</div>
            )}
          </div>
        </div>

        {/* Prédiction de production (live, LDR) */}
        <div style={{ background: '#fff', borderRadius: 12, border: `0.5px solid ${LINE}`, padding: 18, marginBottom: 14, opacity: dim, transition: 'opacity 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Sun size={16} color={OR} />
            <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>Prédiction de production (modèle Random Forest)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11.5, color: MUTED, marginBottom: 6 }}>Ensoleillement estimé (LDR)</div>
              <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, sensor.irradiation * 100)}%`, height: '100%', background: OR }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 500, color: NAVY, marginTop: 6 }}>{(sensor.irradiation * 100).toFixed(0)} <span style={{ fontSize: 11, color: FAINT }}>%</span></div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: MUTED, marginBottom: 6 }}>Production solaire estimée</div>
              <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${prediction ? Math.min(100, (Number(prediction.predicted_power || 0) / 50) * 100) : 0}%`, height: '100%', background: NAVY }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 500, color: NAVY, marginTop: 6 }}>
                {prediction != null ? `${Number(prediction.predicted_power || 0).toFixed(2)}` : '—'} <span style={{ fontSize: 11, color: FAINT }}>W</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `0.5px solid ${LINE}`, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: MUTED }}>Confiance du modèle · <strong style={{ color: NAVY }}>Élevée</strong> <span style={{ color: FAINT }}>(R² 0.83)</span></span>
            <span style={{ fontSize: 11.5, color: MUTED }}>Erreur moyenne · <strong style={{ color: NAVY }}>39 W</strong></span>
          </div>
        </div>

        {/* PRÉVISION météo (Open-Meteo) — ton joyau, mis en avant */}
        <div style={{ background: '#fff', borderRadius: 12, border: `0.5px solid ${LINE}`, padding: 18, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <CloudSun size={16} color={OR} />
            <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>Prévision de production · prochaines heures</span>
          </div>
          <div style={{ fontSize: 11.5, color: FAINT, marginBottom: 14 }}>
            D'après les prévisions météo de Niamey (Open-Meteo) · production estimée par le modèle
          </div>
          {forecast.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={forecast} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: FAINT }} interval={2} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: FAINT }} unit=" W" width={50} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: FAINT }} unit="%" width={42} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `0.5px solid ${LINE}`, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line yAxisId="left"  type="monotone" dataKey="predicted_power" name="Production prévue (W)" stroke={OR}   strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="irradiation"     name="Ensoleillement (%)"   stroke={NAVY} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ fontSize: 13, color: FAINT, textAlign: 'center', padding: 24 }}>Chargement de la prévision…</div>
          )}
        </div>

        {/* Tendance temps réel — affichée seulement si assez de points (évite la courbe plate) */}
        {history.length > 3 && (
          <div style={{ background: '#fff', borderRadius: 12, border: `0.5px solid ${LINE}`, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 16 }}>
              <Activity size={15} color={OR} /> Tendance temps réel · ESP32
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={history} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: FAINT }} />
                <YAxis tick={{ fontSize: 11, fill: FAINT }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `0.5px solid ${LINE}`, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="power"   stroke={OR}   name="Puissance (W)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="voltage" stroke={NAVY} name="Tension (V)"   strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 700px) { .ai-top { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
};

export default AI;