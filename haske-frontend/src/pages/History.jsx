import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
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
    if (data.length === 0) return alert('Aucune donnée');
    const csv = [
      ['Date', 'Puissance (W)', 'Tension (V)', 'Courant (A)', 'Température (°C)'],
      ...data.map(row => [
        new Date(row.created_at).toLocaleString('fr-FR'),
        row.power, row.voltage, row.current, row.temperature
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `haske-energie-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Chargement...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <div className="container py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Historique</h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">Période :</span>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="px-4 py-2 border rounded-lg">
              <option value="1">1h</option>
              <option value="6">6h</option>
              <option value="24">24h</option>
              <option value="168">7 jours</option>
            </select>
            <button onClick={exportCSV} className="ml-auto flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>
        </div>

        <div style={{marginBottom: '2rem'}}>
          <Chart data={data} dataKeys={[{ key: 'power', name: 'Puissance (W)' }]} title="Production" height={300} />
        </div>
        <Chart data={data} dataKeys={[{ key: 'temperature', name: 'Température (°C)' }]} title="Température" height={300} />
      </div>
    </div>
  );
}

export default History;