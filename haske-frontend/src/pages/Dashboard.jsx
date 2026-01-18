import React, { useState, useEffect } from 'react';
import { Zap, Activity, Thermometer, Battery, RefreshCw } from 'lucide-react';
import Card from '../components/Card';
import Chart from '../components/Chart';
import apiService from '../services/api';

function Dashboard() {
  const [latestData, setLatestData] = useState(null);
  const [stats, setStats] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [latest, statsRes, history] = await Promise.all([
        apiService.getLatestData(1),
        apiService.getStats(),
        apiService.getHistoricalData(24)
      ]);
      
      if (latest.success && latest.data.length > 0) setLatestData(latest.data[0]);
      if (statsRes.success) setStats(statsRes.stats);
      if (history.success) setHistoricalData(history.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <div className="container py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard Temps Réel</h1>
            <p className="text-gray-600 mt-1">Monitoring de la mini-centrale</p>
          </div>
          <button onClick={loadData} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <RefreshCw className="w-5 h-5" />
            Actualiser
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <Card title="Puissance" value={latestData ? latestData.power.toFixed(0) : '0'} unit="W" icon={Zap} color="blue" />
          <Card title="Tension" value={latestData ? latestData.voltage.toFixed(1) : '0'} unit="V" icon={Activity} color="green" />
          <Card title="Température" value={latestData ? latestData.temperature.toFixed(1) : '0'} unit="°C" icon={Thermometer} color="orange" />
          <Card title="Batterie" value={latestData ? (latestData.battery_level || 0).toFixed(0) : '0'} unit="%" icon={Battery} color="purple" />
        </div>

        <div className="mb-8">
          <Chart
            data={historicalData}
            dataKeys={[
              { key: 'power', name: 'Puissance (W)' },
              { key: 'temperature', name: 'Température (°C)' }
            ]}
            title="Production d'énergie (24h)"
            height={350}
          />
        </div>

        {stats && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Statistiques Globales</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-sm mb-2">Total</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total_records || 0}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-sm mb-2">Moyenne</p>
                <p className="text-3xl font-bold text-blue-600">{stats.avg_power?.toFixed(0) || 0} W</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-sm mb-2">Maximum</p>
                <p className="text-3xl font-bold text-green-600">{stats.max_power?.toFixed(0) || 0} W</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;