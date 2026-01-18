import React from 'react';

function Card({ title, value, unit, icon: Icon, color = 'blue' }) {
  const colors = {
    blue: { text: 'text-blue-600', bg: 'bg-blue-50' },
    green: { text: 'text-green-600', bg: 'bg-green-50' },
    orange: { text: 'text-orange-600', bg: 'bg-orange-50' },
    purple: { text: 'text-purple-600', bg: 'bg-purple-50' }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 card-hover">
      <div className="flex items-center justify-between">
        <div style={{flex: 1}}>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-3xl font-bold ${colors[color].text}`}>{value}</p>
            {unit && <span className="text-gray-500">{unit}</span>}
          </div>
        </div>
        {Icon && (
          <div className={`p-3 rounded-full ${colors[color].bg}`}>
            <Icon className={`w-8 h-8 ${colors[color].text}`} style={{opacity: 0.3}} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Card;