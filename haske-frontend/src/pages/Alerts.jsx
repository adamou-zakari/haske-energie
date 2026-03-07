import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import apiService from '../services/api';

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await apiService.getAlerts();
      if (response.success) setAlerts(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const resolve = async (id) => {
    try {
      await apiService.resolveAlert(id);
      loadAlerts();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: '#10B981',
      medium: '#FDB913',
      high: '#F59E0B',
      critical: '#E63946'
    };
    return colors[severity] || colors.medium;
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
          <p style={{ fontSize: '1.25rem', color: '#6B7280' }}>Chargement des alertes...</p>
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
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            marginBottom: '0.5rem' 
          }}>
            <AlertTriangle size={32} color="#E63946" strokeWidth={2.5} />
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#1A3A5C',
              margin: 0
            }}>
              Système d'Alertes
            </h1>
          </div>
          <p style={{ color: '#6B7280', fontSize: '1rem' }}>
            Alertes actives : <strong style={{ color: '#E63946' }}>{alerts.length}</strong>
          </p>
        </div>

        {/* Liste des alertes */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          {alerts.length === 0 ? (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '4rem 2rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              borderTop: '4px solid #10B981'
            }}>
              <CheckCircle 
                size={64} 
                color="#10B981" 
                style={{ margin: '0 auto 1.5rem' }} 
              />
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1A3A5C',
                marginBottom: '0.5rem'
              }}>
                Aucune alerte active
              </h3>
              <p style={{ color: '#6B7280', fontSize: '1rem' }}>
                Tous les systèmes fonctionnent normalement
              </p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div 
                key={alert.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  borderLeft: `6px solid ${getSeverityColor(alert.severity)}`,
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ flex: 1, minWidth: '250px' }}>
                    {/* En-tête alerte */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.75rem',
                      flexWrap: 'wrap'
                    }}>
                      <AlertTriangle 
                        size={20} 
                        color={getSeverityColor(alert.severity)} 
                      />
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        backgroundColor: `${getSeverityColor(alert.severity)}20`,
                        color: getSeverityColor(alert.severity),
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {alert.severity}
                      </span>
                      <span style={{
                        fontSize: '0.875rem',
                        color: '#6B7280',
                        fontWeight: '500'
                      }}>
                        {alert.alert_type}
                      </span>
                    </div>

                    {/* Message */}
                    <p style={{
                      color: '#1F2937',
                      fontWeight: '500',
                      fontSize: '1rem',
                      marginBottom: '0.5rem',
                      lineHeight: '1.5'
                    }}>
                      {alert.message}
                    </p>

                    {/* Date */}
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#9CA3AF'
                    }}>
                      📅 {new Date(alert.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>

                  {/* Bouton résoudre */}
                  {!alert.is_resolved && (
                    <button 
                      onClick={() => resolve(alert.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: '#10B981',
                        color: 'white',
                        padding: '0.625rem 1.25rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                        whiteSpace: 'nowrap'
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
                      <CheckCircle size={16} />
                      Résoudre
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
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

export default Alerts;