import React from 'react';

function Card({ title, value, unit, icon: Icon, color = '#FDB913' }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      borderTop: `4px solid ${color}`,
      transition: 'all 0.3s ease',
      cursor: 'default'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 10px 15px rgba(0, 0, 0, 0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    }}>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        
        {/* Contenu texte */}
        <div style={{ flex: 1 }}>
          <p style={{
            color: '#6B7280',
            fontSize: '0.875rem',
            fontWeight: '600',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {title}
          </p>
          
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.5rem'
          }}>
            <p style={{
              fontSize: '2.25rem',
              fontWeight: 'bold',
              color: color,
              lineHeight: '1'
            }}>
              {value}
            </p>
            {unit && (
              <span style={{
                fontSize: '1.125rem',
                color: '#9CA3AF',
                fontWeight: '500'
              }}>
                {unit}
              </span>
            )}
          </div>
        </div>
        
        {/* Icône */}
        {Icon && (
          <div style={{
            padding: '0.75rem',
            borderRadius: '50%',
            backgroundColor: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon 
              size={32} 
              style={{ 
                color: color,
                strokeWidth: 2.5
              }} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Card;