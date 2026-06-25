import React from 'react';

// hero=true  -> carte mise en avant (valeur OR + filet or en haut). À utiliser SEULEMENT pour Puissance.
// Sinon, valeur en bleu marine. status="normal"|"warning"|"danger" -> petit badge d'état (optionnel).
function Card({ title, value, unit, icon: Icon, hero = false, status }) {
  const ACCENT = '#C98A02';   // or lisible (texte)
  const MARINE = '#0B1F3A';
  const valueColor = hero ? ACCENT : MARINE;
  const topBorder  = hero ? '2.5px solid #F5B301' : 'none';

  const statusMap = {
    normal:  { c: '#0F6E56', bg: 'rgba(29,158,117,0.1)', t: 'Normal' },
    warning: { c: '#854F0B', bg: 'rgba(186,117,23,0.1)', t: 'Attention' },
    danger:  { c: '#8E2A20', bg: 'rgba(192,57,43,0.1)',  t: 'Critique' },
  };
  const st = status ? statusMap[status] : null;

  return (
    <div className="hk-card" style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1rem 1.1rem',
      border: '0.5px solid #E2E8F0',
      borderTop: topBorder,
      boxShadow: '0 1px 2px rgba(11,31,58,0.04)',
      cursor: 'default'
    }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          {Icon && <Icon size={16} style={{ color: hero ? '#F5B301' : '#94A3B8' }} strokeWidth={2} />}
          <span style={{ color: '#475569', fontSize: '0.72rem', fontWeight: 500 }}>{title}</span>
        </div>
        {st && (
          <span style={{ fontSize: '0.6rem', color: st.c, backgroundColor: st.bg, padding: '2px 7px', borderRadius: '4px' }}>{st.t}</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
        <span style={{ fontSize: '1.6rem', fontWeight: 500, color: valueColor, lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{unit}</span>}
      </div>
    </div>
  );
}

export default Card;