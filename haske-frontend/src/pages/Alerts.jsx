import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import apiService from '../services/api';

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [allAlerts, setAllAlerts] = useState([]);
  const [filter, setFilter] = useState('unresolved');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      const [unresolved, all] = await Promise.all([
        apiService.getAlerts(),
        apiService.getAllAlerts(100)
      ]);
      if (unresolved.success) setAlerts(unresolved.data || []);
      if (all.success) setAllAlerts(all.data || []);
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
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity] || colors.medium;
  };

  const displayed = filter === 'unresolved' ? alerts : allAlerts;

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Chargement...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
            Système d'Alertes
          </h1>
          <p className="text-gray-600">Monitoring en temps réel</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Actives</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{alerts.length}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{allAlerts.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Critiques</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{allAlerts.filter(a => a.severity === 'critical').length}</p>
              </div>
              <XCircle className="w-10 h-10 text-orange-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Résolues</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{allAlerts.filter(a => a.is_resolved).length}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">Afficher :</span>
            <button onClick={() => setFilter('unresolved')} className={`px-4 py-2 rounded-lg transition ${filter === 'unresolved' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              Non résolues ({alerts.length})
            </button>
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg transition ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              Toutes ({allAlerts.length})
            </button>
          </div>
        </div>

        {/* Liste */}
        <div style={{display: 'grid', gap: '1rem'}}>
          {displayed.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Aucune alerte</h3>
              <p className="text-gray-600">Tout fonctionne normalement</p>
            </div>
          ) : (
            displayed.map((alert) => (
              <div key={alert.id} className={`bg-white rounded-lg shadow-lg p-6 border-l-4 ${alert.severity === 'critical' ? 'border-red-500' : alert.severity === 'high' ? 'border-orange-500' : 'border-yellow-500'}`}>
                <div className="flex items-start justify-between">
                  <div style={{flex: 1}}>
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                        {alert.severity?.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">{alert.alert_type}</span>
                      {alert.is_resolved && <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">RÉSOLUE</span>}
                    </div>
                    <p className="text-gray-800 font-medium mb-2">{alert.message}</p>
                    <p className="text-sm text-gray-500">{new Date(alert.created_at).toLocaleString('fr-FR')}</p>
                  </div>
                  {!alert.is_resolved && (
                    <button onClick={() => resolve(alert.id)} className="ml-4 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Résoudre
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Alerts;