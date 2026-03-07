// src/components/Footer.jsx
import React from 'react';
import { Zap, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{
      background: 'linear-gradient(90deg, #020e20 0%, #4B5563 100%)',
      color: 'white',
      marginTop: 'auto',
      borderTop: '3px solid #FDB913'
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
          {/* Section À propos */}
          <div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              marginBottom: '1rem'
            }}>
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
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                margin: 0,
                letterSpacing: '0.025em'
              }}>
                Haské Énergie
              </h3>
            </div>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              margin: 0
            }}>
              L'énergie pour tous
            </p>
          </div>

          {/* Section Contact */}
          <div>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              marginBottom: '1.25rem',
              color: '#FDB913',
              letterSpacing: '0.025em',
              textTransform: 'uppercase'
            }}>
              Contact
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <MapPin size={18} style={{ color: '#FDB913' }} />
                <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' }}>
                  Niamey, Niger
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <Mail size={18} style={{ color: '#FDB913' }} />
                <a 
                  href="mailto:contact@haskeenergie.ne" 
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.9)', 
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#FDB913'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'}
                >
                  contact@haskeenergie.ne
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <Phone size={18} style={{ color: '#FDB913' }} />
                <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' }}>
                  +227 90 00 00 00
                </span>
              </div>
            </div>
          </div>

          {/* Section Navigation */}
          <div>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              marginBottom: '1.25rem',
              color: '#FDB913',
              letterSpacing: '0.025em',
              textTransform: 'uppercase'
            }}>
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
                <a
                  key={index}
                  href={link.href}
                  style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    transition: 'color 0.3s ease',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#FDB913'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          paddingTop: '1.5rem',
          textAlign: 'center'
        }}>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '0.875rem',
            margin: 0
          }}>
            © {new Date().getFullYear()} <span style={{ color: '#FDB913', fontWeight: '600' }}>Haské Énergie</span> - Tous droits réservés - Développé par Adamou Zakari & Sallah Alkassoum
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          footer > div {
            padding: 2.5rem 1rem 1.5rem;
          }
          
          footer > div > div:first-child {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;