import { useEffect, useState, useRef, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { fetchStatsByState, fetchStatsBySite,
  fetchStatsByClade, fetchStatsByYear, fetchStatsByCountry, fetchLastUpdated } from '../services/api';
import './Dashboard.css';
import Navbar from '../components/Navbar';
import WorldMap from '../components/WorldMap';
import AustriaMapGeo from '../components/AustriaMapGeo';

ChartJS.register(CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler);

const STATE_MAP = {
  Vienna: 'Wien', 'Upper Austria': 'Oberösterreich',
  'Lower Austria': 'Niederösterreich', Styria: 'Steiermark',
  Tyrol: 'Tirol', Salzburg: 'Salzburg', Carinthia: 'Kärnten',
  Vorarlberg: 'Vorarlberg', Burgenland: 'Burgenland',
};



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
    byState: {}, bySite: {}, byClade: {}, byYear: {}, byCountry: {}, lastUpdated: null,
  });
  const [status, setStatus] = useState('loading');
  const [selectedYear, setSelectedYear] = useState('all');

  useEffect(() => {
    async function load() {
      setStatus('loading');
      try {
        const [byState, bySite, byClade, byYear, byCountry, meta] = await Promise.all([
          fetchStatsByState(), fetchStatsBySite(),
          fetchStatsByClade(), fetchStatsByYear(), fetchStatsByCountry(), fetchLastUpdated(),
        ]);
        setData({ byState, bySite, byClade, byYear, byCountry,
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
            : <AustriaMapGeo stateData={data.byState} />}
        </div>
        <div className="card">
          <div className="card-title">Herkunftsländer (Reiseanamnese)</div>
          {status === 'loading'
            ? <div className="skeleton skeleton-map" />
            : <WorldMap countryData={data.byCountry} />}
        </div>
      </div>

      <div className="card timeline-card">
        <div className="card-title">Zeitlicher Verlauf (kumulativ)</div>
        <div className="chart-wrapper">
          {status === 'loading'
            ? <div className="skeleton skeleton-chart" />
            : Object.keys(filteredYearData).length > 0
              ? <TimelineChart yearData={filteredYearData} />
              : <div className="no-data">Keine Daten verfügbar</div>}
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




