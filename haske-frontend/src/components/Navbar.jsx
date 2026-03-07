// src/components/Navbar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart3, History, Brain, Bell, Zap } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/dashboard', icon: BarChart3, label: 'Dashboard' },
    { path: '/history', icon: History, label: 'Historique' },
    { path: '/ai', icon: Brain, label: 'IA' },
    { path: '/alerts', icon: Bell, label: 'Alertes' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      background: 'linear-gradient(90deg, #020e20 0%, #4B5563 100%)',
      color: 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '2rem'
      }}>
        {/* Logo et titre */}
        <Link 
          to="/" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            textDecoration: 'none',
            color: 'white',
            flex: '0 0 auto'
          }}
        >
          <div style={{
            backgroundColor: '#FDB913',
            borderRadius: '50%',
            padding: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px rgba(253, 185, 19, 0.3)'
          }}>
            <Zap size={28} strokeWidth={3} color="white" />
          </div>
          <div>
            <h1 style={{ 
              fontSize: '1.875rem', 
              fontWeight: 'bold',
              margin: 0,
              letterSpacing: '0.025em'
            }}>
              Haské Énergie
            </h1>
            <p style={{ 
              fontSize: '0.875rem',
              color: 'white',
              margin: 0,
              opacity: 0.9
            }}>
              L'énergie pour tous
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem',
          alignItems: 'center',
          flex: '1 1 auto',
          justifyContent: 'flex-end',
          flexWrap: 'wrap'
        }}>
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.875rem',
                transition: 'all 0.3s ease',
                backgroundColor: isActive(path) ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
                color: 'white',
                border: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive(path)) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(path)) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          nav > div {
            flex-direction: column;
            align-items: flex-start;
          }
          
          nav > div > div:last-child {
            width: 100%;
            justify-content: flex-start;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;