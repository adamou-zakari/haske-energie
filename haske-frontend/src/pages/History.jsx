import React, { useState, useEffect } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import Chart from '../components/Chart';
import apiService from '../services/api';

function History() {
  const [data, setData] = useState([]);
  const [timeRange, setTimeRange] = useState('24');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await apiService.getHistoricalData(parseInt(timeRange));
      if (response.success) setData(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (data.length === 0) return alert('Aucune donnée à exporter');
    const csv = [
      ['Date', 'Puissance (W)', 'Tension (V)', 'Température (°C)'],
      ...data.map(row => [
        new Date(row.created_at).toLocaleString('fr-FR'),
        row.power, 
        row.voltage, 
        row.temperature
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `haske-energie-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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
          <p style={{ fontSize: '1.25rem', color: '#6B7280' }}>Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#F5F5F5', 
      paddingBottom: '3rem' 
    }}>
      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto', 
        padding: '3rem 1.5rem' 
      }}>
        
        {/* Header */}
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#1A3A5C',
          marginBottom: '2rem'
        }}>
          Historique de Production
        </h1>

        {/* Contrôles */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          borderTop: '4px solid #FDB913'
        }}>
          <span style={{ 
            color: '#1A3A5C', 
            fontWeight: '600',
            fontSize: '0.95rem'
          }}>
            Période :
          </span>
          
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: '0.625rem 1rem',
              border: '2px solid #E5E7EB',
              borderRadius: '0.5rem',
              fontSize: '0.95rem',
              fontWeight: '500',
              color: '#1A3A5C',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#FDB913';
              e.currentTarget.style.outline = 'none';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
            }}
          >
            <option value="1">Dernière heure</option>
            <option value="6">6 heures</option>
            <option value="24">24 heures</option>
            <option value="168">7 jours</option>
          </select>

          <button 
            onClick={exportCSV}
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#10B981',
              color: 'white',
              padding: '0.625rem 1.25rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: '600',
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#059669';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#10B981';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
            }}
          >
            <Download size={18} />
            Exporter CSV
          </button>
        </div>

        {/* Graphique unique combiné */}
        <div style={{ marginBottom: '2rem' }}>
          <Chart 
            data={data} 
            dataKeys={[
              { key: 'power', name: 'Puissance (W)', color: '#FDB913' },
              { key: 'temperature', name: 'Température (°C)', color: '#E63946' }
            ]} 
            title="Production et Température" 
            height={400} 
          />
        </div>

        {/* Résumé des données */}
        {data.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            borderTop: '4px solid #1A3A5C'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: '#1A3A5C',
              marginBottom: '1rem'
            }}>
              Résumé
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  Points de données
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1A3A5C' }}>
                  {data.length}
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  Puissance moyenne
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FDB913' }}>
                  {(data.reduce((sum, d) => sum + d.power, 0) / data.length).toFixed(0)} W
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  Température moyenne
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E63946' }}>
                  {(data.reduce((sum, d) => sum + d.temperature, 0) / data.length).toFixed(1)} °C
                </p>
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

export default History;