import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Sun, Brain, ArrowRight } from 'lucide-react';

function Home() {
  // L'or est réservé à l'énergie (Monitoring) ; l'IA passe en marine. Plus d'arc-en-ciel.
  const features = [
    { icon: Sun, title: 'Monitoring temps réel', description: 'Surveillance continue de la production solaire', accent: '#F5B301' },
    { icon: Brain, title: 'Intelligence artificielle', description: "Prédiction et détection d'anomalies", accent: '#0B1F3A' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '4rem 1.5rem' }}>

        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          {/* Logo — INCHANGÉ (rond jaune, éclair blanc) */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <div style={{
              backgroundColor: '#FDB913',
              padding: '1.5rem',
              borderRadius: '50%',
              boxShadow: '0 10px 25px rgba(253, 185, 19, 0.3)'
            }}>
              <Zap size={64} color="white" strokeWidth={3} />
            </div>
          </div>

          {/* Titre en MARINE (avant : un mélange) — plus sérieux */}
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: 'bold',
            color: '#0B1F3A',
            marginBottom: '1rem',
            letterSpacing: '-0.025em'
          }}>
            Haské Énergie
          </h1>

          <p style={{ fontSize: '1.4rem', color: '#475569', marginBottom: '0.75rem', fontWeight: 500 }}>
            Mini-centrale solaire intelligente
          </p>

          <p style={{ fontSize: '1.05rem', color: '#94A3B8', maxWidth: '640px', margin: '0 auto 2.5rem', lineHeight: '1.7' }}>
            Supervision en temps réel, prédiction de production et détection d'anomalies par intelligence artificielle.
          </p>

          {/* Bouton principal — l'or est justifié ici (appel à l'action) */}
          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              backgroundColor: '#F5B301',
              color: '#0B1F3A',
              padding: '0.9rem 2.2rem',
              borderRadius: '10px',
              fontSize: '1.05rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(245, 179, 1, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 18px rgba(245, 179, 1, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 179, 1, 0.3)';
            }}
          >
            Accéder au dashboard
            <ArrowRight size={20} />
          </Link>
        </div>

        {/* Features - 2 cartes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          marginBottom: '3rem'
        }}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '14px',
                  padding: '1.75rem',
                  border: '0.5px solid #E2E8F0',
                  boxShadow: '0 1px 2px rgba(11,31,58,0.04)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 18px rgba(11,31,58,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(11,31,58,0.04)';
                }}
              >
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '11px',
                  backgroundColor: index === 0 ? '#FEF6E0' : '#EEF2F7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.1rem'
                }}>
                  <Icon size={24} style={{ color: feature.accent }} strokeWidth={2} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0B1F3A', marginBottom: '0.4rem' }}>
                  {feature.title}
                </h3>
                <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: '1.6', margin: 0 }}>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>

      <style>{`
        @media (max-width: 768px) {
          h1 { font-size: 2.5rem !important; }
        }
      `}</style>
    </div>
  );
}

export default Home;