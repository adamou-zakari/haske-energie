// haske-frontend/src/pages/Alerts.js
// v7 — palette pro : compteurs uniformes, gravité sémantique (critique=rouge), largeur 1280.

import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { RefreshCw, Bell, Battery, Thermometer, Zap, Sun, AlertTriangle, AlertOctagon, AlertCircle, CheckCircle, ChevronRight, ChevronDown } from 'lucide-react';

const NAVY   = '#0B1F3A';
const FAINT  = '#94A3B8';
const MUTED  = '#475569';
const LINE   = '#E2E8F0';

const SEV = {
  critical: { bar:'#C0392B', badge:'#C0392B', badgeBg:'rgba(192,57,43,0.1)',  badgeTxt:'#8E2A20', label:'Critique' },
  high:     { bar:'#BA7517', badge:'#BA7517', badgeBg:'rgba(186,117,23,0.1)', badgeTxt:'#854F0B', label:'Élevée'   },
  medium:   { bar:'#94A3B8', badge:'#475569', badgeBg:'#F1F5F9',              badgeTxt:'#0B1F3A', label:'Moyenne'  },
  low:      { bar:'#1D9E75', badge:'#1D9E75', badgeBg:'rgba(29,158,117,0.1)', badgeTxt:'#0F6E56', label:'Faible'   },
};

function AlertIcon({ type, color }) {
  const p = { size: 18, color, strokeWidth: 2 };
  if (!type) return <AlertTriangle {...p} />;
  if (type.startsWith('battery')) return <Battery {...p} />;
  if (type.startsWith('temp'))    return <Thermometer {...p} />;
  if (type.startsWith('voltage')) return <Zap {...p} />;
  if (type.startsWith('power'))   return <Sun {...p} />;
  return <AlertTriangle {...p} />;
}

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts._seconds ? ts._seconds*1000 : ts);
  return d.toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
}

function AlertCard({ alert, onResolve, resolving }) {
  const s = SEV[alert.severity] || SEV.low;
  return (
    <div style={{ background:'#fff', borderRadius:12, border:`0.5px solid ${LINE}`, borderLeft:`3px solid ${s.bar}`, padding:'13px 16px', marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
      <div style={{ flex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
          <AlertIcon type={alert.type} color={s.badge} />
          <span style={{ background:s.badgeBg, color:s.badgeTxt, fontSize:10.5, fontWeight:600, padding:'2px 8px', borderRadius:5 }}>{s.label}</span>
          <span style={{ fontSize:11.5, color:FAINT }}>{formatDate(alert.timestamp)}</span>
        </div>
        <p style={{ margin:0, fontSize:13.5, color:NAVY, lineHeight:1.5 }}>{alert.message}</p>
      </div>

      {!alert.resolved ? (
        <button onClick={()=>onResolve(alert.id)} disabled={resolving===alert.id} style={{
          flexShrink:0, display:'flex', alignItems:'center', gap:6, padding:'6px 13px', fontSize:12.5, fontWeight:500,
          background:resolving===alert.id?'#F1F5F9':'transparent', color:resolving===alert.id?'#9ca3af':'#0F6E56',
          border:`0.5px solid ${resolving===alert.id?LINE:'#1D9E75'}`, borderRadius:7, cursor:resolving===alert.id?'not-allowed':'pointer',
        }}>
          {resolving===alert.id ? '...' : <><CheckCircle size={14} /> Résoudre</>}
        </button>
      ) : (
        <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11.5, color:FAINT, flexShrink:0 }}><CheckCircle size={14} /> Résolue</span>
      )}
    </div>
  );
}

export default function Alerts() {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [allAlerts,    setAllAlerts]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showHistory,  setShowHistory]  = useState(false);
  const [resolving,    setResolving]    = useState(null);
  const [error,        setError]        = useState(null);
  const [lastRefresh,  setLastRefresh]  = useState(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);
      const [activeRes, allRes] = await Promise.all([api.get('/alerts'), api.get('/alerts/all')]);
      setActiveAlerts(activeRes.data.alerts || []);
      setAllAlerts(allRes.data.alerts || []);
      setLastRefresh(new Date());
    } catch { setError('Impossible de charger les alertes. Vérifiez que le serveur est démarré.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleResolve = async (id) => {
    setResolving(id);
    try { await api.put(`/alerts/${id}/resolve`); await fetchAlerts(); }
    catch { alert("Erreur lors de la résolution."); }
    finally { setResolving(null); }
  };

  const criticalCount = activeAlerts.filter(a=>a.severity==='critical').length;
  const highCount     = activeAlerts.filter(a=>a.severity==='high').length;
  const mediumCount   = activeAlerts.filter(a=>a.severity==='medium').length;

  const activeIds = new Set(activeAlerts.map(a => a.id));
  const pastAlerts = allAlerts.filter(a => !activeIds.has(a.id));

  // Compteurs : tous neutres (marine), sauf le chiffre coloré selon la gravité
  const counters = [
    { label:'Alertes actives', value:activeAlerts.length, color:NAVY,      Icon:Bell },
    { label:'Critiques',       value:criticalCount,        color:'#C0392B', Icon:AlertOctagon },
    { label:'Élevées',         value:highCount,            color:'#BA7517', Icon:AlertTriangle },
    { label:'Moyennes',        value:mediumCount,          color:NAVY,      Icon:AlertCircle },
  ];

  return (
    <div style={{ fontFamily:'system-ui,sans-serif', background:'#F8FAFC', minHeight:'100vh' }}>

      {/* Header */}
      <div style={{ background:'#fff', borderBottom:`0.5px solid ${LINE}` }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'22px 32px' }}>
          <h1 style={{ fontSize:20, fontWeight:600, color:NAVY, margin:0 }}>Alertes système</h1>
          <p style={{ color:FAINT, fontSize:13, margin:'4px 0 0' }}>
            Monitoring en temps réel
            {lastRefresh && <span> · Mis à jour à {lastRefresh.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}</span>}
          </p>
        </div>
      </div>

      <div style={{ maxWidth:1280, margin:'0 auto', padding:'22px 32px' }}>

        {/* Compteurs uniformes */}
        <div className="alert-counters" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
          {counters.map(({label,value,color,Icon}) => (
            <div key={label} style={{ background:'#fff', border:`0.5px solid ${LINE}`, borderRadius:12, padding:'14px 16px', textAlign:'center', boxShadow:'0 1px 2px rgba(11,31,58,0.04)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <Icon size={16} color={FAINT} strokeWidth={2} />
                <div style={{ fontSize:24, fontWeight:500, color }}>{value}</div>
              </div>
              <div style={{ fontSize:11, color:MUTED, marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
          <button onClick={fetchAlerts} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', fontSize:13, fontWeight:500, background:'transparent', color:NAVY, border:`0.5px solid ${NAVY}`, borderRadius:8, cursor:'pointer' }}>
            <RefreshCw size={15} /> Actualiser
          </button>
        </div>

        {error && <div style={{ display:'flex', alignItems:'center', gap:8, background:'#FCEBEA', border:'0.5px solid #F5B0AB', borderRadius:10, padding:14, marginBottom:16, color:'#8E2A20', fontSize:13 }}><AlertTriangle size={16} /> {error}</div>}

        {/* Alertes actives */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:600, color:NAVY, marginBottom:10 }}>
            Alertes actives ({activeAlerts.length})
          </div>
          {loading ? (
            <p style={{ color:FAINT, textAlign:'center', padding:20 }}>Chargement...</p>
          ) : activeAlerts.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, background:'#fff', border:`0.5px solid ${LINE}`, borderRadius:12, padding:28, color:MUTED, fontSize:13.5 }}>
              <CheckCircle size={26} color="#1D9E75" /> Aucune alerte active — le système fonctionne normalement.
            </div>
          ) : (
            activeAlerts.map(alert => <AlertCard key={alert.id} alert={alert} onResolve={handleResolve} resolving={resolving} />)
          )}
        </div>

        {/* Historique */}
        <div style={{ background:'#fff', borderRadius:12, border:`0.5px solid ${LINE}`, padding:'14px 18px' }}>
          <button onClick={()=>setShowHistory(h=>!h)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, color:NAVY, padding:0, display:'flex', alignItems:'center', gap:8, width:'100%' }}>
            {showHistory ? <ChevronDown size={16} color={FAINT} /> : <ChevronRight size={16} color={FAINT} />}
            <span>Historique des alertes passées ({pastAlerts.length})</span>
          </button>
          {showHistory && (
            <div style={{ marginTop:16 }}>
              {pastAlerts.length === 0 ? (
                <p style={{ color:FAINT, textAlign:'center', fontSize:13 }}>Aucune alerte passée dans l'historique.</p>
              ) : (
                pastAlerts.map(alert => <AlertCard key={alert.id} alert={alert} onResolve={handleResolve} resolving={resolving} />)
              )}
            </div>
          )}
        </div>

      </div>

      <style>{`
        @media (max-width: 700px) { .alert-counters { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </div>
  );
}