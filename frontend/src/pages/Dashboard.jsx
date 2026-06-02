import { useEffect, useState, useRef, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { fetchStatsByState, fetchStatsBySite,
  fetchStatsByClade, fetchStatsByYear, fetchLastUpdated } from '../services/api';
import './Dashboard.css';
import Navbar from '../components/Navbar';

ChartJS.register(CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler);

const STATE_MAP = {
  Vienna: 'Wien', 'Upper Austria': 'Oberösterreich',
  'Lower Austria': 'Niederösterreich', Styria: 'Steiermark',
  Tyrol: 'Tirol', Salzburg: 'Salzburg', Carinthia: 'Kärnten',
  Vorarlberg: 'Vorarlberg', Burgenland: 'Burgenland',
};

const COLOR_SCALE = ['#f0ece6','#d4e8f7','#9fc7e8','#5a9fd4','#2878b8','#1a3a5c'];

const BUNDESLAENDER = [
  { name:'Wien',            cx:313, cy:141,
    path:'M 305 138 L 315 132 L 322 138 L 322 148 L 310 150 L 303 145 Z' },
  { name:'Niederösterreich',cx:290, cy:112,
    path:'M 230 95 L 325 85 L 355 100 L 340 135 L 322 138 L 315 132 L 305 138 L 303 145 L 280 148 L 255 140 L 235 130 L 225 110 Z' },
  { name:'Steiermark',      cx:272, cy:178,
    path:'M 235 148 L 280 148 L 303 145 L 310 150 L 322 148 L 335 160 L 320 190 L 295 205 L 265 210 L 240 195 L 225 170 L 228 152 Z' },
  { name:'Oberösterreich',  cx:185, cy:108,
    path:'M 150 80 L 228 75 L 230 95 L 225 110 L 210 130 L 185 138 L 155 125 L 140 105 Z' },
  { name:'Salzburg',        cx:148, cy:135,
    path:'M 110 110 L 150 100 L 155 125 L 185 138 L 185 158 L 160 168 L 135 155 L 112 138 L 108 120 Z' },
  { name:'Tirol',           cx:83,  cy:128,
    path:'M 60 115 L 108 108 L 110 110 L 108 120 L 112 138 L 90 145 L 70 138 L 52 128 Z' },
  { name:'Kärnten',         cx:178, cy:178,
    path:'M 135 155 L 160 168 L 185 158 L 210 168 L 225 170 L 225 185 L 205 195 L 175 198 L 148 185 L 130 168 Z' },
  { name:'Vorarlberg',      cx:48,  cy:118,
    path:'M 38 110 L 58 105 L 60 115 L 52 128 L 40 125 Z' },
  { name:'Burgenland',      cx:348, cy:142,
    path:'M 322 138 L 340 135 L 355 100 L 370 110 L 365 145 L 350 175 L 335 160 L 322 148 Z' },
];

function getMapColor(value, max) {
  if (!value || value === 0) return COLOR_SCALE[0];
  const t = value / max;
  const idx = Math.min(Math.floor(t * (COLOR_SCALE.length - 1)), COLOR_SCALE.length - 1);
  return COLOR_SCALE[Math.max(1, idx)];
}

function MetricCard({ label, value, sub }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value ?? '—'}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

function HorizontalBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const display = label.length > 16 ? label.slice(0, 15) + '…' : label;
  return (
    <div className="bar-row">
      <div className="bar-label" title={label}>{display}</div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="bar-val">{value}</div>
    </div>
  );
}

function AustriaMap({ stateData }) {
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });
  const svgRef = useRef(null);
  const germanData = {};
  Object.entries(stateData).forEach(([k, v]) => {
    germanData[STATE_MAP[k] || k] = v;
  });
  const max = Math.max(...Object.values(germanData), 1);
  const handleMove = useCallback((e, name, v) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return;
    setTooltip({ visible: true, text: `${name}: ${v} ${v === 1 ? 'Fall' : 'Fälle'}`,
      x: e.clientX - r.left + 10, y: e.clientY - r.top - 30 });
  }, []);
  return (
    <div className="map-wrapper">
      {tooltip.visible && (
        <div className="map-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.text}
        </div>
      )}
      <svg ref={svgRef} viewBox="0 0 500 280" className="austria-svg">
        {BUNDESLAENDER.map((bl) => {
          const v = germanData[bl.name] || 0;
          return (
            <g key={bl.name}>
              <path d={bl.path} fill={getMapColor(v, max)}
                stroke="#fff" strokeWidth="1.2" className="bl-path"
                onMouseMove={(e) => handleMove(e, bl.name, v)}
                onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))} />
              {v > 0 && (
                <text x={bl.cx} y={bl.cy} fontSize="9" fill="#1a3a5c"
                  textAnchor="middle" fontWeight="600">{v}</text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="map-legend">
        {['0','1–3','4–6','7–10','11–15','15+'].map((l, i) => (
          <div key={i} className="legend-item">
            <div className="legend-swatch" style={{ background: COLOR_SCALE[i] }} />
            <span>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineChart({ yearData }) {
  const years = Object.keys(yearData).sort();
  const cumData = years.reduce((acc, y) => {
  const last = acc.length > 0 ? acc[acc.length - 1] : 0;
  return [...acc, last + (yearData[y] || 0)];
}, []);
  
  const chartData = {
    labels: years,
    datasets: [{
      label: 'Fälle kumulativ', data: cumData,
      borderColor: '#2878b8', backgroundColor: 'rgba(40,120,184,0.08)',
      fill: true, tension: 0.4, pointRadius: 5,
      pointBackgroundColor: '#1a3a5c', borderWidth: 2,
    }],
  };
  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' },
           ticks: { color: '#888', font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { color: '#888', font: { size: 10 } } },
    },
  };
  return <Line data={chartData} options={options} />;
}

export default function Dashboard() {
  const [data, setData] = useState({
    byState: {}, bySite: {}, byClade: {}, byYear: {}, lastUpdated: null,
  });
  const [status, setStatus] = useState('loading');
  const [selectedYear, setSelectedYear] = useState('all');

  useEffect(() => {
    async function load() {
      setStatus('loading');
      try {
        const [byState, bySite, byClade, byYear, meta] = await Promise.all([
          fetchStatsByState(), fetchStatsBySite(),
          fetchStatsByClade(), fetchStatsByYear(), fetchLastUpdated(),
        ]);
        setData({ byState, bySite, byClade, byYear,
          lastUpdated: meta.last_updated });
        setStatus('ok');
      } catch (e) {
        console.error('Dashboard API error:', e);
        setStatus('error');
      }
    }
    load();
  }, []);

  const totalCases     = Object.values(data.byState).reduce((a, b) => a + b, 0);
  const affectedStates = Object.values(data.byState).filter(v => v > 0).length;
  const topSite  = Object.entries(data.bySite).sort((a, b) => b[1] - a[1])[0];
  const topClade = Object.entries(data.byClade).sort((a, b) => b[1] - a[1])[0];
  const years = Object.keys(data.byYear).sort();

  const siteSorted  = Object.entries(data.bySite).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const cladeSorted = Object.entries(data.byClade).sort((a,b)=>b[1]-a[1]);
  const stateSorted = Object.entries(data.byState)
    .map(([k,v]) => [STATE_MAP[k]||k, v])
    .sort((a,b)=>b[1]-a[1]).slice(0,6);

  const filteredYearData = selectedYear === 'all'
    ? data.byYear
    : { [selectedYear]: data.byYear[selectedYear] || 0 };

  return (
    <div className="dashboard-page">
{/*       <header className="topbar">
        <div>
          <div className="topbar-title">Candida auris Surveillance Dashboard · Österreich</div>
          <div className="topbar-sub">Aggregierte, anonymisierte Falldaten auf Bundeslandebene</div>
        </div>
        <div className="topbar-right">
          <div className="status-row">
            <span className={`status-dot status-${status}`} />
            <span className="status-text">
              {status === 'loading' && 'Daten werden geladen…'}
              {status === 'ok'      && 'Aktuell'}
              {status === 'error'   && 'API nicht erreichbar'}
            </span>
          </div>
          <div className="topbar-sub">
            {data.lastUpdated ? `Letzte Aktualisierung: ${data.lastUpdated}` : '—'}
          </div>
        </div>
      </header> */}

      <Navbar />
<div className="dashboard-hero">
  <div>
    <div className="dashboard-hero-title">
      Candida auris Surveillance Dashboard · Österreich
    </div>
    <div className="dashboard-hero-sub">
      Aggregierte, anonymisierte Falldaten auf Bundeslandebene
    </div>
  </div>
  <div className="status-row">
    <span className={`status-dot status-${status}`} />
    <span className="status-text">
      {status === 'loading' && 'Daten werden geladen…'}
      {status === 'ok'      && 'Aktuell'}
      {status === 'error'   && 'API nicht erreichbar'}
    </span>
    <span className="topbar-sub">
      {data.lastUpdated ? `Letzte Aktualisierung: ${data.lastUpdated}` : '—'}
    </span>
  </div>
</div>

      {status === 'error' && (
        <div className="error-banner" role="alert">
          Backend nicht erreichbar. Prüfe ob der Server läuft:&nbsp;
          <code>{import.meta.env.VITE_API_URL || 'http://localhost:8000'}</code>
        </div>
      )}

      <div className="metrics-grid">
        <MetricCard label="Fälle gesamt"          value={totalCases || '—'} sub="seit Erfassungsbeginn" />
        <MetricCard label="Bundesländer betroffen" value={affectedStates || '—'} sub="von 9 Bundesländern" />
        <MetricCard label="Häufigste Lokalisation"
          value={topSite ? topSite[0].slice(0,14) : '—'}
          sub={topSite ? `${topSite[1]} Fälle` : '—'} />
        <MetricCard label="Häufigste Clade"
          value={topClade ? topClade[0] : '—'}
          sub={topClade ? `${topClade[1]} Fälle` : '—'} />
      </div>

      <div className="filter-bar">
        <span className="filter-label">Jahr:</span>
        <button className={`filter-btn${selectedYear==='all'?' active':''}`}
          onClick={() => setSelectedYear('all')}>Alle Jahre</button>
        {years.map(y => (
          <button key={y}
            className={`filter-btn${selectedYear===y?' active':''}`}
            onClick={() => setSelectedYear(y)}>{y}</button>
        ))}
      </div>

      <div className="main-grid">
        <div className="card">
          <div className="card-title">Fallzahlen nach Bundesland</div>
          {status === 'loading'
            ? <div className="skeleton skeleton-map" />
            : <AustriaMap stateData={data.byState} />}
        </div>
        <div className="card">
          <div className="card-title">Zeitlicher Verlauf (kumulativ)</div>
          <div className="chart-wrapper">
            {status === 'loading'
              ? <div className="skeleton skeleton-chart" />
              : Object.keys(filteredYearData).length > 0
                ? <TimelineChart yearData={filteredYearData} />
                : <div className="no-data">Keine Daten verfügbar</div>}
          </div>
        </div>
      </div>

      <div className="bottom-grid">
        <div className="card">
          <div className="card-title">Isolationsort (Top 6)</div>
          {siteSorted.map(([label, val]) => (
            <HorizontalBar key={label} label={label} value={val}
              max={siteSorted[0]?.[1]||1} color="#5a9fd4" />
          ))}
        </div>
        <div className="card">
          <div className="card-title">Clade-Verteilung</div>
          {cladeSorted.map(([label, val]) => (
            <HorizontalBar key={label} label={label} value={val}
              max={cladeSorted[0]?.[1]||1} color="#2878b8" />
          ))}
        </div>
        <div className="card">
          <div className="card-title">Bundesland-Ranking</div>
          {stateSorted.map(([label, val]) => (
            <HorizontalBar key={label} label={label} value={val}
              max={stateSorted[0]?.[1]||1} color="#1a3a5c" />
          ))}
        </div>
      </div>
    </div>
  );
}




