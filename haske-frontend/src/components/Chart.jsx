import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Chart({ data, dataKeys, title, height = 300 }) {
  // Palette Haské : couleur selon la métrique (pas selon l'ordre).
  // Puissance/énergie = or ; tension/courant/température/autres = marine ; fallback teal/rouge.
  const colorFor = (key, index) => {
    const k = (key || '').toLowerCase();
    if (k.includes('power') || k.includes('puissance') || k.includes('irrad') || k.includes('production')) return '#F5B301'; // énergie → or
    if (k.includes('volt') || k.includes('tension') || k.includes('current') || k.includes('courant') ||
        k.includes('temp') || k.includes('batt')) return '#0B1F3A'; // marine par défaut
    return ['#0B1F3A', '#1D9E75', '#C0392B'][index % 3];
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!data || data.length === 0) {
    return (
      <div style={{ background: '#fff', border: '0.5px solid #E2E8F0', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 2px rgba(11,31,58,0.04)' }}>
        {title && <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0B1F3A', marginBottom: '1rem' }}>{title}</h3>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', height }}>
          <p>Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', border: '0.5px solid #E2E8F0', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 2px rgba(11,31,58,0.04)' }}>
      {title && <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0B1F3A', marginBottom: '1rem' }}>{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="created_at" tickFormatter={formatTime} stroke="#94A3B8" tick={{ fontSize: 11 }} />
          {/* domain=['auto','auto'] => échelle AUTOMATIQUE : fini les lignes plates écrasées */}
          <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
          <Tooltip labelFormatter={(value) => new Date(value).toLocaleString('fr-FR')} contentStyle={{ borderRadius: 8, border: '0.5px solid #E2E8F0', fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {dataKeys.map((key, index) => (
            <Line
              key={key.key}
              type="monotone"
              dataKey={key.key}
              stroke={colorFor(key.key, index)}
              name={key.name}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Chart;