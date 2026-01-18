import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Chart({ data, dataKeys, title, height = 300 }) {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };
  
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        {title && <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>}
        <div className="flex items-center justify-center text-gray-400" style={{height: height}}>
          <p>Aucune donnée disponible</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {title && <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="created_at" tickFormatter={formatTime} stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip labelFormatter={(value) => new Date(value).toLocaleString('fr-FR')} />
          <Legend />
          {dataKeys.map((key, index) => (
            <Line key={key.key} type="monotone" dataKey={key.key} stroke={colors[index]} name={key.name} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Chart;