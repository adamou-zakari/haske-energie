// haske-frontend/src/pages/Dashboard.js
// v10 — graphe Puissance seule (or, axe recalé) + created_at + filtre anti-pic. Palette pro, Puissance en hero.

import React, { useState, useEffect } from 'react';
import { Zap, Activity, Thermometer, Battery, RefreshCw, WifiOff, Gauge, Sun } from 'lucide-react';
import Card from '../components/Card';
import Chart from '../components/Chart';
import apiService from '../services/api';

const STALE_MS = 2 * 60 * 1000;
const MARINE = '#0B1F3A';
const OR = '#F5B301';

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

// Filtre anti-pic : ignore les valeurs physiquement impossibles (vieilles données d'avant calibration)
function isClean(d) {
  if (d.voltage     != null && d.voltage     > 20) return false;
  if (d.current     != null && d.current     > 10) return false;
  if (d.power       != null && d.power       > 60) return false;
  if (d.temperature != null && (d.temperature < 0 || d.temperature > 80)) return false;
  return true;
}

function Dashboard() {
  const [latestData,     setLatestData]     = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [serverError,    setServerError]    = useState(false);
  const [now,            setNow]            = useState(Date.now());

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(interval); clearInterval(tick); };
  }, []);

  const loadData = async () => {
    try {
      const [latest, history] = await Promise.all([
        apiService.getLatestData(1),
        apiService.getHistoricalData(24),
      ]);
      setServerError(false);
      setLatestData(latest.success && latest.data.length > 0 ? latest.data[0] : null);
      if (history.success) setHistoricalData(history.data || []);
    } catch {
      setServerError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <RefreshCw size={44} style={{ color: OR, animation: 'spin 1s linear infinite', marginBottom: 16 }} />
        <p style={{ color: '#475569', fontSize: 16 }}>Connexion au serveur...</p>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  if (serverError) {
    return (
      <div style={styles.center}>
        <WifiOff size={44} style={{ color: '#C0392B', marginBottom: 16 }} />
        <p style={{ color: MARINE, fontSize: 19, fontWeight: 600 }}>Serveur non joignable</p>
        <p style={{ color: '#475569', marginTop: 8 }}>Vérifiez que le backend Node.js est démarré sur le port 5000.</p>
        <button onClick={loadData} style={styles.btnRefresh}>
          <RefreshCw size={16} /> Réessayer
        </button>
      </div>
    );
  }

  if (!latestData) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', paddingBottom: '3rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
          <Header onRefresh={loadData} measuredAt={null} isStale ageMs={null} />
          <div style={styles.waiting}>
            <Activity size={44} style={{ color: OR, marginBottom: 16 }} />
            <p style={{ fontSize: 19, fontWeight: 600, color: MARINE }}>
              En attente des données de l'ESP32
            </p>
            <p style={{ color: '#475569', marginTop: 8, textAlign: 'center', maxWidth: 400 }}>
              Le serveur est connecté. Dès que l'ESP32 enverra ses premières mesures,
              elles apparaîtront ici automatiquement.
            </p>
          </div>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const measuredAt = parseTs(latestData.timestamp);
  const ageMs = measuredAt ? (now - measuredAt.getTime()) : null;
  const isStale = ageMs == null || ageMs > STALE_MS;

  const battLevel = latestData.battery_level ?? null;
  const battStatus = battLevel == null ? '—'
    : battLevel >= 80 ? 'Pleine'
    : battLevel >= 50 ? 'Bonne'
    : battLevel >= 20 ? 'Faible'
    : 'Critique';
  const tempStatus = latestData.temperature == null ? undefined
    : latestData.temperature > 50 ? 'danger'
    : latestData.temperature > 45 ? 'warning'
    : 'normal';

  const dim = isStale ? 0.5 : 1;

  // Prépare les données du graphe : filtre les pics aberrants + ajoute created_at (clé attendue par <Chart>)
  const chartData = historicalData
    .filter(isClean)
    .map(d => {
      const t = d.timestamp?._seconds ? new Date(d.timestamp._seconds * 1000) : new Date(d.timestamp);
      return { ...d, created_at: t.getTime() };
    });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        <Header onRefresh={loadData} measuredAt={measuredAt} isStale={isStale} ageMs={ageMs} />

        {isStale && (
          <div style={{ background: '#FCEBEA', border: '0.5px solid #F5B0AB', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#8E2A20', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8 }}>
            <WifiOff size={18} />
            <span>
              <strong>ESP32 hors ligne</strong> — aucune nouvelle mesure depuis {ago(ageMs)}.
              Les valeurs ci-dessous sont la <strong>dernière mesure enregistrée</strong>, pas du temps réel.
            </span>
          </div>
        )}

        {/* Cartes métriques — grille 3 colonnes (2 lignes de 3). Puissance en hero. */}
        <div className="haske-grid" style={{ ...styles.grid, opacity: dim, transition: 'opacity 0.3s' }}>
          <Card hero title="Puissance"       value={latestData.power != null ? latestData.power.toFixed(2) : '—'}        unit="W"  icon={Zap} />
          <Card      title="Ensoleillement"  value={latestData.irradiation != null ? (latestData.irradiation * 100).toFixed(0) : '—'} unit="%" icon={Sun} />
          <Card      title="Tension"         value={latestData.voltage != null ? latestData.voltage.toFixed(2) : '—'}    unit="V"  icon={Activity} />
          <Card      title="Courant"         value={latestData.current != null ? latestData.current.toFixed(2) : '—'}    unit="A"  icon={Gauge} />
          <Card      title="Température"      value={latestData.temperature != null ? latestData.temperature.toFixed(1) : '—'} unit="°C" icon={Thermometer} status={tempStatus} />
          <Card      title="Batterie"        value={battLevel != null ? battLevel.toFixed(0) : '—'}                       unit="%"  icon={Battery} />
        </div>

        {chartData.length > 1 ? (
          <div style={{ marginBottom: '2rem' }}>
            <Chart
              data={chartData}
              dataKeys={[
                { key: 'power', name: 'Puissance (W)' },
              ]}
              title="Production d'énergie · 24h"
              height={340}
            />
          </div>
        ) : (
          <div style={styles.noChart}>
            <Activity size={24} style={{ color: OR, marginBottom: 8 }} />
            <p style={{ color: '#475569', fontSize: 14 }}>
              Le graphique apparaîtra dès que suffisamment de mesures seront enregistrées.
            </p>
          </div>
        )}

        {battLevel != null && (
          <div style={{ ...styles.card, opacity: dim, transition: 'opacity 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Battery size={20} color={MARINE} />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: MARINE, margin: 0 }}>État de la batterie</h3>
              </div>
              <span style={{ fontSize: 24, fontWeight: 500, color: MARINE }}>{battLevel.toFixed(0)}%</span>
            </div>
            <div style={styles.battBar}>
              <div style={{ height: '100%', width: `${battLevel}%`, backgroundColor: OR, borderRadius: 9999, transition: 'width 0.5s ease' }} />
            </div>
            <p style={{ color: '#475569', fontSize: 13, fontWeight: 500, marginTop: 10, marginBottom: 0 }}>
              État : {battStatus}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @media (max-width: 900px) { .haske-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 560px) { .haske-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

function Header({ onRefresh, measuredAt, isStale, ageMs }) {
  const dotColor = measuredAt == null ? '#94A3B8' : isStale ? '#C0392B' : '#1D9E75';
  const label = measuredAt == null ? 'Aucune mesure'
    : isStale ? `Hors ligne · dernière mesure il y a ${ago(ageMs)}`
    : 'En direct';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: MARINE, margin: 0 }}>Tableau de bord</h1>
        <p style={{ color: '#94A3B8', fontSize: 13, marginTop: 4 }}>
          Monitoring de la mini-centrale solaire
          {measuredAt && <span> · {measuredAt.toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</span>}
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 8, padding: '3px 10px', borderRadius: 999, background: `${dotColor}14` }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor }} />
          <span style={{ color: dotColor, fontWeight: 600, fontSize: 11.5 }}>{label}</span>
        </div>
      </div>
      <button onClick={onRefresh} style={styles.btnRefresh}>
        <RefreshCw size={15} /> Actualiser
      </button>
    </div>
  );
}

const styles = {
  center: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', padding: 24 },
  waiting: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: 12, padding: 48, border: '0.5px solid #E2E8F0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: '16px 18px', border: '0.5px solid #E2E8F0', boxShadow: '0 1px 2px rgba(11,31,58,0.04)' },
  battBar: { width: '100%', height: 8, backgroundColor: '#F1F5F9', borderRadius: 9999, overflow: 'hidden' },
  noChart: { backgroundColor: 'white', borderRadius: 12, padding: 32, textAlign: 'center', border: '1px dashed #CBD5E1', marginBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  btnRefresh: { display: 'flex', alignItems: 'center', gap: 7, backgroundColor: 'transparent', color: MARINE, padding: '8px 14px', borderRadius: 8, border: `0.5px solid ${MARINE}`, fontWeight: 500, cursor: 'pointer', fontSize: 13, transition: 'all 0.2s ease' },
};

export default Dashboard;