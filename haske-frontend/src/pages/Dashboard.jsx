import React, { useState, useEffect } from 'react';
import { Zap, Activity, Thermometer, Battery, RefreshCw } from 'lucide-react';
import Card from '../components/Card';
import Chart from '../components/Chart';
import apiService from '../services/api';

function Dashboard() {
  const [latestData, setLatestData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [latest, history] = await Promise.all([
        apiService.getLatestData(1),
        apiService.getHistoricalData(24)
      ]);
      
      if (latest.success && latest.data.length > 0) setLatestData(latest.data[0]);
      if (history.success) setHistoricalData(history.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F5F5F5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw 
            size={48} 
            style={{ 
              color: '#FDB913',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }} 
          />
          <p style={{ fontSize: '1.25rem', color: '#6B7280' }}>Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        
        {/* Header avec bouton actualiser */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#1A3A5C',
              marginBottom: '0.5rem'
            }}>
              Dashboard Temps Réel
            </h1>
            <p style={{ color: '#6B7280', fontSize: '1rem' }}>
              Monitoring de la mini-centrale solaire
            </p>
          </div>
          
          <button 
            onClick={loadData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#FDB913',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 6px rgba(253, 185, 19, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F59E0B';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(253, 185, 19, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FDB913';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(253, 185, 19, 0.3)';
            }}
          >
            <RefreshCw size={20} />
            Actualiser
          </button>
        </div>

        {/* Cartes de métriques */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <Card 
            title="Puissance" 
            value={latestData ? latestData.power.toFixed(0) : '0'} 
            unit="W" 
            icon={Zap} 
            color="#FDB913"  // Jaune Haské
          />
          <Card 
            title="Tension" 
            value={latestData ? latestData.voltage.toFixed(1) : '0'} 
            unit="V" 
            icon={Activity} 
            color="#1A3A5C"  // Bleu marine Haské
          />
          <Card 
            title="Température" 
            value={latestData ? latestData.temperature.toFixed(1) : '0'} 
            unit="°C" 
            icon={Thermometer} 
            color="#E63946"  // Rouge Haské
          />
          <Card 
            title="Batterie" 
            value={latestData ? (latestData.battery_level || 0).toFixed(0) : '0'} 
            unit="%" 
            icon={Battery} 
            color="#10B981"  // Vert
          />
        </div>

        {/* Graphique principal */}
        <div style={{ marginBottom: '2rem' }}>
          <Chart
            data={historicalData}
            dataKeys={[
              { key: 'power', name: 'Puissance (W)', color: '#FDB913' },
              { key: 'temperature', name: 'Température (°C)', color: '#E63946' }
            ]}
            title="Production d'énergie (24h)"
            height={350}
          />
        </div>

        {/* Barre de batterie */}
        {latestData && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            borderTop: '4px solid #10B981'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#1A3A5C'
              }}>
                État de la Batterie
              </h3>
              <span style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: latestData.battery_level > 70 ? '#10B981' : 
                       latestData.battery_level > 30 ? '#FDB913' : '#E63946'
              }}>
                {(latestData.battery_level || 0).toFixed(0)}%
              </span>
            </div>
            
            <div style={{
              width: '100%',
              height: '2rem',
              backgroundColor: '#E5E7EB',
              borderRadius: '9999px',
              overflow: 'hidden',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                height: '100%',
                width: `${latestData.battery_level || 0}%`,
                backgroundColor: latestData.battery_level > 70 ? '#10B981' : 
                                latestData.battery_level > 30 ? '#FDB913' : '#E63946',
                transition: 'width 0.5s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.875rem'
              }}>
                {latestData.battery_level > 15 && `${(latestData.battery_level || 0).toFixed(0)}%`}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          h1 {
            font-size: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;