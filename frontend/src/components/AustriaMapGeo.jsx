import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next'; // 1. Import hinzugefügt
import {
  ComposableMap,
  Geographies,
  Geography,
} from '@vnedyalk0v/react19-simple-maps';

const GEO_URL = '/austria-states.json';
const COLOR_SCALE = ['#d4e8f7', '#9fc7e8', '#5a9fd4', '#2878b8', '#1a3a5c'];

const STATE_CONFIG = {
  'Vienna':           { geo: 'Wien',             key: 'state_vienna' },
  'Lower Austria':    { geo: 'Niederösterreich', key: 'state_lower_austria' },
  'Upper Austria':    { geo: 'Oberösterreich',   key: 'state_upper_austria' },
  'Styria':           { geo: 'Steiermark',       key: 'state_styria' },
  'Tyrol':            { geo: 'Tirol',            key: 'state_tyrol' },
  'Salzburg':         { geo: 'Salzburg',         key: 'state_salzburg' },
  'Carinthia':        { geo: 'Kärnten',          key: 'state_carinthia' },
  'Vorarlberg':       { geo: 'Vorarlberg',       key: 'state_vorarlberg' },
  'Burgenland':       { geo: 'Burgenland',       key: 'state_burgenland' },
};

// Hilfsfunktion verwendet jetzt die neue Config
function aggregateData(stateData) {
  const result = {};
  Object.entries(stateData).forEach(([enName, count]) => {
    const config = STATE_CONFIG[enName];
    if (config) {
      result[config.geo] = (result[config.geo] || 0) + count;
    }
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
  const { t } = useTranslation(); // 2. Hook initialisiert
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

  // 3. Aufruf der richtigen Funktion
  const counts = aggregateData(stateData);
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
                    hover:   { outline: 'none', fill: '#e6a817', cursor: 'pointer' },
                    pressed: { outline: 'none', fill: '#e6a817' },
                  }}
                  onMouseEnter={(e) => {
                    const r = wrapperRef.current?.getBoundingClientRect();
                    const entry = Object.values(STATE_CONFIG).find(c => c.geo === name);
                    const transKey = entry ? entry.key : 'unknown';

                    setTooltip({
                      visible: true,
                      text: `${t(transKey)}: ${value} ${value === 1 ? t('dash_case_singular') : t('dash_case_plural')}`,
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