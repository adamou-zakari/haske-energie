// src/components/Navbar.jsx
// v4 — fond bleu marine uni + liens sobres. LOGO D'ORIGINE INCHANGÉ.
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart3, History, Brain, Bell, Zap } from 'lucide-react';
import api from '../services/api';

const SEV = {
  critical: { color: '#C0392B', label: 'Critique' },
  high:     { color: '#BA7517', label: 'Élevé'    },
  medium:   { color: '#475569', label: 'Moyen'    },
  low:      { color: '#1D9E75', label: 'Faible'   },
};
function alertIcon(type) {
  if (!type) return '⚠️';
  if (type.startsWith('battery')) return '🔋';
  if (type.startsWith('temp'))    return '🌡️';
  if (type.startsWith('voltage')) return '⚡';
  if (type.startsWith('power'))   return '☀️';
  return '⚠️';
}

const Navbar = () => {
  const location = useLocation();

  const [activeCount, setActiveCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const seenIds   = useRef(new Set());
  const firstLoad = useRef(true);

  const navItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/dashboard', icon: BarChart3, label: 'Dashboard' },
    { path: '/history', icon: History, label: 'Historique' },
    { path: '/ai', icon: Brain, label: 'IA' },
    { path: '/alerts', icon: Bell, label: 'Alertes' },
  ];

  const isActive = (path) => location.pathname === path;

  const addToast = (alert) => {
    const toastId = `${alert.id}-${Date.now()}`;
    setToasts(prev => [...prev, { ...alert, toastId }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.toastId !== toastId)), 6000);
  };
  const dismissToast = (toastId) => setToasts(prev => prev.filter(t => t.toastId !== toastId));

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      try { Notification.requestPermission(); } catch {}
    }

    let stopped = false;
    const poll = async () => {
      try {
        const res = await api.get('/alerts');
        const active = res.data.alerts || [];
        if (stopped) return;
        setActiveCount(active.length);

        if (firstLoad.current) {
          active.forEach(a => seenIds.current.add(a.id));
          firstLoad.current = false;
        } else {
          active.forEach(a => {
            if (!seenIds.current.has(a.id)) {
              seenIds.current.add(a.id);
              addToast(a);
              if ('Notification' in window && Notification.permission === 'granted') {
                try { new Notification('Haské Énergie — Alerte', { body: a.message }); } catch {}
              }
            }
          });
        }
      } catch { /* serveur indispo : on ignore */ }
    };

    poll();
    const interval = setInterval(poll, 30000);
    return () => { stopped = true; clearInterval(interval); };
  }, []);

  return (
    <>
      <nav style={{ background: '#0B1F3A', color: 'white', boxShadow: '0 1px 3px rgba(11,31,58,0.12)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem' }}>
          {/* Logo — TON logo d'origine, inchangé */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'white', flex: '0 0 auto' }}>
            <div style={{ backgroundColor: '#FDB913', borderRadius: '50%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(253, 185, 19, 0.3)' }}>
              <Zap size={28} strokeWidth={3} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, letterSpacing: '0.025em' }}>Haské Énergie</h1>
              <p style={{ fontSize: '0.875rem', color: 'white', margin: 0, opacity: 0.9 }}>L'énergie pour tous</p>
            </div>
          </Link>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flex: '1 1 auto', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link key={path} to={path}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.85rem', borderRadius: '7px', textDecoration: 'none', fontWeight: isActive(path) ? 600 : 500, fontSize: '0.85rem', transition: 'all 0.2s ease', backgroundColor: isActive(path) ? 'rgba(255,255,255,0.1)' : 'transparent', color: isActive(path) ? '#fff' : 'rgba(255,255,255,0.65)', border: 'none' }}
                onMouseEnter={(e) => { if (!isActive(path)) e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { if (!isActive(path)) e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
              >
                <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                  <Icon size={18} />
                  {path === '/alerts' && activeCount > 0 && (
                    <span style={{ position: 'absolute', top: -9, right: -11, background: '#FDB913', color: '#0B1F3A', fontSize: 10, fontWeight: 700, minWidth: 17, height: 17, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid #0B1F3A' }}>
                      {activeCount}
                    </span>
                  )}
                </span>
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
          @keyframes slideInToast { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          @media (max-width: 768px) {
            nav > div { flex-direction: column; align-items: flex-start; }
            nav > div > div:last-child { width: 100%; justify-content: flex-start; }
          }
        `}</style>
      </nav>

      {/* Notifications toast (sur toutes les pages) */}
      {toasts.length > 0 && (
        <div style={{ position: 'fixed', top: 90, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340 }}>
          {toasts.map(t => {
            const s = SEV[t.severity] || SEV.low;
            return (
              <div key={t.toastId} style={{ background: '#fff', borderLeft: `3px solid ${s.color}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(11,31,58,0.15)', padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start', animation: 'slideInToast 0.3s ease' }}>
                <span style={{ fontSize: 18 }}>{alertIcon(t.type)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.label}</div>
                  <div style={{ fontSize: 13, color: '#0B1F3A', marginTop: 2, lineHeight: 1.4 }}>{t.message}</div>
                </div>
                <button onClick={() => dismissToast(t.toastId)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default Navbar;