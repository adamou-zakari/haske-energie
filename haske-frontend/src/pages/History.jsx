// haske-frontend/src/pages/History.jsx
// v13 — filtrage anti-pic (ignore les valeurs aberrantes d'avant calibration) + largeur 1280 + palette pro.

import React, { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw, Zap, Thermometer, Battery, Activity, Gauge, Sun, Download, CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../components/Card';
import api from '../services/api';

const OR     = '#F5B301';
const NAVY   = '#0B1F3A';
const FAINT  = '#94A3B8';
const LINE   = '#E2E8F0';
const MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const WDAYS  = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0,0);
const endOfDay   = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23,59,59,999);
const sameDay = (a,b) => a && b && a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
const fmtD = (d) => d ? d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'}) : '…';

// ── Filtre anti-pic : ignore les mesures physiquement impossibles (vieilles données d'avant calibration) ──
// Batterie 12V → V jamais >20 | système ~4A → I jamais >10 | panneau 50W → P jamais >60 | T plausible 0–80°C
function isClean(d) {
  if (d.voltage     != null && d.voltage     > 20) return false;
  if (d.current     != null && d.current     > 10) return false;
  if (d.power       != null && d.power       > 60) return false;
  if (d.temperature != null && (d.temperature < 0 || d.temperature > 80)) return false;
  return true;
}

function formatTime(ts) {
  if (!ts) return '';
  const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function computeStats(data) {
  if (!data || data.length === 0) return null;
  const avg = (f) => {
    const v = data.map(d => d[f]).filter(x => x != null);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  return { power:avg('power'), irradiation:avg('irradiation'), voltage:avg('voltage'), current:avg('current'), temperature:avg('temperature'), battery_level:avg('battery_level') };
}

function exportCSV(data, suffix) {
  if (!data || data.length === 0) return;
  const headers = ['Heure','Tension (V)','Courant (A)','Puissance (W)','Température (°C)','Batterie (%)'];
  const rows = data.map(d => [d.time, d.voltage??0, d.current??0, d.power??0, d.temperature??0, d.battery_level??0]);
  const csv = [headers,...rows].map(r => r.join(';')).join('\n');
  const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `haske_${suffix}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

function SensorChart({ data, dataKey, label, color, unit, domain, icon: Icon }) {
  return (
    <div style={{ background:'#fff', borderRadius:12, border:`0.5px solid ${LINE}`, padding:'16px 12px 8px', marginBottom:14, boxShadow:'0 1px 2px rgba(11,31,58,0.04)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:12.5, fontWeight:600, color:NAVY, marginBottom:10, paddingLeft:4 }}>
        {Icon && <Icon size={15} color={color} strokeWidth={2} />}
        <span>{label}</span>
      </div>
      <ResponsiveContainer width="100%" height={170}>
        <LineChart data={data} margin={{top:4,right:16,left:0,bottom:4}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="time" tick={{fontSize:11,fill:FAINT}} interval="preserveStartEnd" />
          <YAxis domain={domain||['auto','auto']} tick={{fontSize:11,fill:FAINT}} unit={unit} width={52} />
          <Tooltip contentStyle={{borderRadius:8,border:`0.5px solid ${LINE}`,fontSize:12}} formatter={v=>[`${v!=null?v.toFixed(2):'—'} ${unit}`,label]} labelFormatter={l=>`${l}`} />
          <Line type="monotone" dataKey={dataKey} stroke={color} dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Sélecteur de plage de dates (calendrier maison, sans librairie) ──
function DateRangePicker({ range, onApply }) {
  const [open, setOpen]       = useState(false);
  const [selFrom, setSelFrom] = useState(range?.from || null);
  const [selTo, setSelTo]     = useState(range?.to || null);
  const [view, setView]       = useState(startOfDay(range?.to || range?.from || new Date()));
  const today = startOfDay(new Date());

  const openPicker = () => {
    setSelFrom(range?.from || null); setSelTo(range?.to || null);
    setView(startOfDay(range?.to || range?.from || new Date())); setOpen(true);
  };

  const pickDay = (d) => {
    if (!selFrom || (selFrom && selTo)) { setSelFrom(d); setSelTo(null); }
    else if (d < selFrom) { setSelTo(selFrom); setSelFrom(d); }
    else setSelTo(d);
  };

  const apply = () => { if (selFrom) { onApply({ from: selFrom, to: selTo || selFrom }); setOpen(false); } };
  const applyPreset = (f, t) => { onApply({ from: f, to: t }); setOpen(false); };

  const presets = [
    { label:'Ce mois-ci',   f:new Date(today.getFullYear(),today.getMonth(),1),   t:today },
    { label:'Mois dernier', f:new Date(today.getFullYear(),today.getMonth()-1,1), t:new Date(today.getFullYear(),today.getMonth(),0) },
  ];

  const year=view.getFullYear(), month=view.getMonth();
  const startWeekday=(new Date(year,month,1).getDay()+6)%7;
  const daysInMonth=new Date(year,month+1,0).getDate();
  const cells=[]; for(let i=0;i<startWeekday;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(new Date(year,month,d));

  const active = range && `${fmtD(range.from)} → ${fmtD(range.to)}`;

  return (
    <div style={{ position:'relative', display:'inline-block' }}>
      <button onClick={()=> open ? setOpen(false) : openPicker()} style={{
        display:'flex', alignItems:'center', gap:6, padding:'6px 14px', fontSize:13, fontWeight:active?600:500,
        background: active ? NAVY : '#fff', color: active ? '#fff' : NAVY,
        border:`0.5px solid ${active ? NAVY : LINE}`, borderRadius:8, cursor:'pointer'
      }}>
        <CalendarRange size={15} /> {active || 'Dates précises'}
      </button>

      {open && (
        <>
          <div onClick={()=>setOpen(false)} style={{ position:'fixed', inset:0, zIndex:40 }} />
          <div style={{ position:'absolute', top:'calc(100% + 8px)', left:0, zIndex:50, background:'#fff', borderRadius:14, border:`0.5px solid ${LINE}`, boxShadow:'0 12px 32px rgba(11,31,58,0.14)', padding:14, width:300 }}>

            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
              {presets.map(p => (
                <button key={p.label} onClick={()=>applyPreset(p.f,p.t)} style={{ flex:'1 1 calc(50% - 3px)', padding:'7px 8px', fontSize:11.5, fontWeight:600, color:NAVY, background:'#F1F5F9', border:`0.5px solid ${LINE}`, borderRadius:8, cursor:'pointer' }}>
                  {p.label}
                </button>
              ))}
            </div>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <button onClick={()=>setView(new Date(year,month-1,1))} style={{ background:'none', border:'none', cursor:'pointer', color:NAVY, display:'flex' }}><ChevronLeft size={18} /></button>
              <span style={{ fontSize:14, fontWeight:600, color:NAVY }}>{MONTHS[month]} {year}</span>
              <button onClick={()=>setView(new Date(year,month+1,1))} style={{ background:'none', border:'none', cursor:'pointer', color:NAVY, display:'flex' }}><ChevronRight size={18} /></button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
              {WDAYS.map((w,i)=><div key={i} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:FAINT, padding:'2px 0' }}>{w}</div>)}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
              {cells.map((d,i) => {
                if (!d) return <div key={i} />;
                const isStart=sameDay(d,selFrom), isEnd=sameDay(d,selTo);
                const inRange=selFrom&&selTo&&d>startOfDay(selFrom)&&d<startOfDay(selTo);
                const isFuture=d>today;
                const bg = (isStart||isEnd) ? NAVY : inRange ? '#EEF2F7' : 'transparent';
                const col = (isStart||isEnd) ? '#fff' : isFuture ? '#CBD5E1' : NAVY;
                return (
                  <button key={i} disabled={isFuture} onClick={()=>pickDay(d)} style={{
                    aspectRatio:'1', fontSize:12.5, fontWeight:(isStart||isEnd)?700:500,
                    background:bg, color:col, border:'none', borderRadius:8,
                    cursor:isFuture?'not-allowed':'pointer'
                  }}>{d.getDate()}</button>
                );
              })}
            </div>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:12, gap:8 }}>
              <span style={{ fontSize:12, color:FAINT }}>{fmtD(selFrom)} → {fmtD(selTo)}</span>
              <button onClick={apply} disabled={!selFrom} style={{ padding:'7px 16px', fontSize:13, fontWeight:600, background:selFrom?NAVY:'#E2E8F0', color:selFrom?'#fff':'#9ca3af', border:'none', borderRadius:8, cursor:selFrom?'pointer':'not-allowed' }}>
                Appliquer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function History() {
  const [rawData, setRawData] = useState([]);
  const [hours,   setHours]   = useState(24);
  const [range,   setRange]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      let url;
      if (range) {
        url = `/sensors/history?from=${startOfDay(range.from).getTime()}&to=${endOfDay(range.to).getTime()}`;
      } else {
        url = `/sensors/history?hours=${hours}`;
      }
      const h = await api.get(url);
      setRawData((h.data.data||[])
        .filter(isClean)                    // ← ignore les pics aberrants (vieilles données d'avant calibration)
        .map(d=>({
          time: formatTime(d.timestamp),
          voltage: d.voltage, current: d.current, power: d.power,
          temperature: d.temperature, battery_level: d.battery_level, irradiation: d.irradiation,
        })));
    } catch {
      setError("Impossible de charger l'historique. Vérifiez que le serveur est démarré.");
    } finally {
      setLoading(false);
    }
  }, [hours, range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const periods = [
    { label: '6h',  value: 6   },
    { label: '24h', value: 24  },
    { label: '7j',  value: 168 },
    { label: '30j', value: 720 },
  ];

  const periodLabel = range ? `${fmtD(range.from)} → ${fmtD(range.to)}` : (periods.find(p => p.value === hours)?.label || `${hours}h`);
  const csvSuffix   = range ? `${fmtD(range.from).replace(/\//g,'-')}_${fmtD(range.to).replace(/\//g,'-')}` : (hours>=24?`${hours/24}j`:`${hours}h`);
  const stats = computeStats(rawData);

  const btn = (active) => ({
    padding:'6px 16px', fontSize:13, fontWeight:active?600:500,
    background: active ? NAVY : '#fff', color: active ? '#fff' : NAVY,
    border: `0.5px solid ${active ? NAVY : LINE}`, borderRadius:8, cursor:'pointer'
  });

  return (
    <div style={{fontFamily:'system-ui,sans-serif', background:'#F8FAFC', minHeight:'100vh'}}>

      {/* Header — bandeau pleine largeur, contenu aligné à 1280 comme le Dashboard */}
      <div style={{background:'#fff', borderBottom:`0.5px solid ${LINE}`}}>
        <div style={{maxWidth:1280, margin:'0 auto', padding:'22px 32px'}}>
          <h1 style={{fontSize:20, fontWeight:600, color:NAVY, margin:0}}>Historique des mesures</h1>
          <p style={{color:FAINT, fontSize:13, marginTop:4, margin:'4px 0 0'}}>
            {rawData.length} enregistrement(s) · {periodLabel}
          </p>
        </div>
      </div>

      <div style={{maxWidth:1280, margin:'0 auto', padding:'22px 32px'}}>

        {/* Filtres période */}
        <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:18, background:'#fff', borderRadius:12, border:`0.5px solid ${LINE}`, padding:'12px 16px'}}>
          <span style={{fontSize:13, fontWeight:600, color:NAVY}}>Période :</span>
          {periods.map(({label, value}) => (
            <button key={value} onClick={()=>{ setRange(null); setHours(value); }} style={btn(!range && hours===value)}>{label}</button>
          ))}
          <DateRangePicker range={range} onApply={setRange} />

          <div style={{marginLeft:'auto', display:'flex', gap:8}}>
            <button onClick={fetchData} style={{display:'flex', alignItems:'center', gap:6, padding:'7px 14px', fontSize:13, fontWeight:500, background:'transparent', color:NAVY, border:`0.5px solid ${NAVY}`, borderRadius:8, cursor:'pointer'}}>
              <RefreshCw size={15} /> Actualiser
            </button>
            <button onClick={()=>exportCSV(rawData,csvSuffix)} disabled={rawData.length===0} style={{
              display:'flex', alignItems:'center', gap:6, padding:'7px 14px', fontSize:13, fontWeight:500,
              background: rawData.length===0 ? '#F1F5F9' : NAVY, color: rawData.length===0 ? '#9ca3af' : '#fff',
              border:'none', borderRadius:8, cursor: rawData.length===0 ? 'not-allowed' : 'pointer'
            }}><Download size={15} /> Exporter CSV</button>
          </div>
        </div>

        {/* Stats — grille 3 colonnes, Puissance en hero */}
        {stats && (
          <div className="haske-stats" style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:18}}>
            <Card hero title="Puissance moy."      value={stats.power!=null?stats.power.toFixed(1):'—'}              unit="W"  icon={Zap} />
            <Card      title="Ensoleillement moy." value={stats.irradiation!=null?(stats.irradiation*100).toFixed(0):'—'} unit="%" icon={Sun} />
            <Card      title="Tension moy."         value={stats.voltage!=null?stats.voltage.toFixed(2):'—'}          unit="V"  icon={Activity} />
            <Card      title="Courant moy."         value={stats.current!=null?stats.current.toFixed(2):'—'}          unit="A"  icon={Gauge} />
            <Card      title="Température moy."      value={stats.temperature!=null?stats.temperature.toFixed(1):'—'}  unit="°C" icon={Thermometer} />
            <Card      title="Batterie moy."        value={stats.battery_level!=null?stats.battery_level.toFixed(0):'—'} unit="%" icon={Battery} />
          </div>
        )}

        {error && (
          <div style={{background:'#FCEBEA', border:'0.5px solid #F5B0AB', borderRadius:10, padding:14, marginBottom:16, color:'#8E2A20', fontSize:13}}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{textAlign:'center', padding:60, color:FAINT}}>Chargement...</div>
        ) : rawData.length === 0 ? (
          <div style={{background:'#fff', border:`0.5px solid ${LINE}`, borderRadius:12, padding:60, textAlign:'center', color:FAINT}}>
            Aucune donnée sur cette période.
          </div>
        ) : (
          <>
            <SensorChart data={rawData} dataKey="power"         label="Puissance produite" color={OR}    unit="W"  icon={Zap} />
            <SensorChart data={rawData} dataKey="battery_level" label="Niveau batterie"    color={NAVY}  unit="%"  domain={[0,100]} icon={Battery} />
            <SensorChart data={rawData} dataKey="temperature"   label="Température"         color={NAVY}  unit="°C" icon={Thermometer} />
            <SensorChart data={rawData} dataKey="voltage"       label="Tension"            color={NAVY}  unit="V"  icon={Activity} />
            <SensorChart data={rawData} dataKey="current"       label="Courant"            color={NAVY}  unit="A"  icon={Gauge} />
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) { .haske-stats { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 560px) { .haske-stats { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}