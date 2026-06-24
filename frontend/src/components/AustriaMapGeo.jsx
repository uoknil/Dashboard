import { useEffect, useState, useRef } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
} from '@vnedyalk0v/react19-simple-maps';

// Liegt lokal in public/ — wird vom eigenen Server geladen, kein CORS-Problem
const GEO_URL = '/austria-states.json';

// gleiche Farbskala wie bei der Weltkarte / alten Karte
const COLOR_SCALE = ['#d4e8f7', '#9fc7e8', '#5a9fd4', '#2878b8', '#1a3a5c'];

// Backend liefert Bundesländer auf Englisch, die Geometrie auf Deutsch.
// Diese Tabelle übersetzt Englisch → Deutsch (Geometrie-Namen).
const STATE_EN_DE = {
  'Vienna': 'Wien',
  'Lower Austria': 'Niederösterreich',
  'Upper Austria': 'Oberösterreich',
  'Styria': 'Steiermark',
  'Tyrol': 'Tirol',
  'Salzburg': 'Salzburg',
  'Carinthia': 'Kärnten',
  'Vorarlberg': 'Vorarlberg',
  'Burgenland': 'Burgenland',
};

// Baut aus { "Vienna": 5, ... } eine Map mit deutschen Namen { "Wien": 5, ... }
function buildGermanCounts(stateData) {
  const result = {};
  Object.entries(stateData).forEach(([enName, count]) => {
    const deName = STATE_EN_DE[enName] || enName;
    result[deName] = (result[deName] || 0) + count;
  });
  return result;
}

function getColor(value, max) {
  if (!value || value === 0) return '#f0ece6';
  const t = value / max;
  const idx = Math.min(Math.floor(t * COLOR_SCALE.length), COLOR_SCALE.length - 1);
  return COLOR_SCALE[idx];
}

export default function AustriaMapGeo({ stateData = {} }) {
  const [geoData, setGeoData] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });
  const wrapperRef = useRef(null);

  useEffect(() => {
    fetch(GEO_URL)
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error('Österreich-Karte: Geometrie-Ladefehler', err));
  }, []);

  if (!geoData) {
    return <div className="skeleton skeleton-map" />;
  }

  const counts = buildGermanCounts(stateData);
  const max = Math.max(...Object.values(counts), 1);

  return (
    <div className="map-wrapper" ref={wrapperRef}>
      {tooltip.visible && (
        <div className="map-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.text}
        </div>
      )}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 3500, center: [13.3, 47.7] }}
        width={500}
        height={280}
        style={{ width: '100%', height: 'auto' }}
      >
        <Geographies geography={geoData}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const name = geo.properties.name;
              const value = counts[name] || 0;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getColor(value, max)}
                  stroke="#1a3a5c"
                  strokeWidth={0.6}
                  style={{
                    default: { outline: 'none' },
                    hover:   { outline: 'none', fill: '#e6a817' },
                    pressed: { outline: 'none' },
                  }}
                onMouseEnter={(e) => {
                    const r = wrapperRef.current?.getBoundingClientRect();
                    setTooltip({
                      visible: true,
                      text: `${name}: ${value} ${value === 1 ? 'Fall' : 'Fälle'}`,
                      x: r ? e.clientX - r.left + 10 : 0,
                      y: r ? e.clientY - r.top - 30 : 0,
                    });
                  }}
                  onMouseMove={(e) => {
                    const r = wrapperRef.current?.getBoundingClientRect();
                    setTooltip((t) => ({
                      ...t,
                      x: r ? e.clientX - r.left + 10 : t.x,
                      y: r ? e.clientY - r.top - 30 : t.y,
                    }));
                  }}
                  onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}