// src/components/Footer.jsx
import React from 'react';
import { Zap, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{
      background: '#0B1F3A',
      color: 'white',
      marginTop: 'auto',
      borderTop: '2.5px solid #F5B301'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '3rem 1.5rem 2rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '3rem',
          marginBottom: '2.5rem'
        }}>
          {/* Section À propos — LOGO D'ORIGINE INCHANGÉ */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                backgroundColor: '#FDB913',
                borderRadius: '50%',
                padding: '0.625rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px rgba(253, 185, 19, 0.3)'
              }}>
                <Zap size={24} strokeWidth={3} color="white" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, letterSpacing: '0.025em' }}>
                Haské Énergie
              </h3>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              L'énergie pour tous
            </p>
          </div>

          {/* Section Contact */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.25rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Contact
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <MapPin size={17} style={{ color: '#94A3B8' }} />
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Niamey, Niger</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <Mail size={17} style={{ color: '#94A3B8' }} />
                <a href="mailto:contact@haskeenergie.ne"
                  style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#F5B301'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}>
                  contact@haskeenergie.ne
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <Phone size={17} style={{ color: '#94A3B8' }} />
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>+227 90 91 91 03</span>
              </div>
            </div>
          </div>

          {/* Section Navigation */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.25rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Navigation
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Accueil', href: '/' },
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Historique', href: '/history' },
                { label: 'IA', href: '/ai' },
                { label: 'Alertes', href: '/alerts' }
              ].map((link, index) => (
                <a key={index} href={link.href}
                  style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s ease', fontWeight: 500 }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#F5B301'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: 0 }}>
            © {new Date().getFullYear()} <span style={{ color: '#F5B301', fontWeight: 600 }}>Haské Énergie</span> — Tous droits réservés — Développé par Adamou Zakari & Sallah Alkassoum
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          footer > div { padding: 2.5rem 1rem 1.5rem; }
          footer > div > div:first-child { grid-template-columns: 1fr; gap: 2rem; }
        }
      `}</style>
    </footer>
  );
};

export default Footer;