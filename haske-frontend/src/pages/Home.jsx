import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Sun, Brain, ArrowRight } from 'lucide-react';

function Home() {
  const features = [
    { icon: Sun, title: 'Monitoring Temps Réel', description: 'Surveillance continue de la production solaire', color: '#FDB913' },
    { icon: Brain, title: 'Intelligence Artificielle', description: 'Prédiction et détection d\'anomalies', color: '#E63946' }
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#F5F5F5'
    }}>
      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto', 
        padding: '4rem 1.5rem' 
      }}>
        
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          {/* Logo */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: '2rem' 
          }}>
            <div style={{
  backgroundColor: '#FDB913',  // Jaune au lieu du dégradé bleu
  padding: '1.5rem',
  borderRadius: '50%',
  boxShadow: '0 10px 25px rgba(253, 185, 19, 0.3)'
}}>
  <Zap size={64} color="white" strokeWidth={3} />
</div>
          </div>
          
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: 'bold',
            color: '#1A3A5C',
            marginBottom: '1rem',
            letterSpacing: '-0.025em'
          }}>
            Haské Énergie
          </h1>
          
          <p style={{
            fontSize: '1.5rem',
            color: '#4B5563',
            marginBottom: '0.75rem',
            fontWeight: '500'
          }}>
            Mini-centrale Solaire Intelligente
          </p>
          
          <p style={{
            fontSize: '1.125rem',
            color: '#6B7280',
            maxWidth: '700px',
            margin: '0 auto 2.5rem',
            lineHeight: '1.7'
          }}>
          </p>
          
          {/* Bouton principal uniquement */}
          <Link 
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              backgroundColor: '#FDB913',
              color: 'white',
              padding: '1rem 2.5rem',
              borderRadius: '0.75rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 6px rgba(253, 185, 19, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F59E0B';
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(253, 185, 19, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FDB913';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(253, 185, 19, 0.4)';
            }}
          >
            Accéder au Dashboard
            <ArrowRight size={22} />
          </Link>
        </div>

        {/* Features - 2 cartes seulement */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '1rem',
                  padding: '2rem',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  borderTop: `4px solid ${feature.color}`,
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  backgroundColor: `${feature.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}>
                  <Icon size={32} style={{ color: feature.color }} strokeWidth={2.5} />
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#1A3A5C',
                  marginBottom: '0.5rem'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  color: '#6B7280',
                  fontSize: '0.95rem',
                  lineHeight: '1.6'
                }}>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>


      </div>

      <style>{`
        @media (max-width: 768px) {
          h1 {
            font-size: 2.5rem !important;
          }
          p {
            font-size: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Home;