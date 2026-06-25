import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ComposableMap,
  Geographies,
  Geography,
} from '@vnedyalk0v/react19-simple-maps';
import { COUNTRY_EN_DE } from '../constants/countries';

const GEO_URL = 'https://unpkg.com/world-atlas@2.0.2/countries-110m.json';

const COLOR_SCALE = ['#d4e8f7', '#9fc7e8', '#5a9fd4', '#2878b8', '#1a3a5c'];

// Umkehrung: deutscher Name (kleingeschrieben) → englischer Kartenname.
// Wird automatisch erzeugt, damit deine Admin-Eingaben ("Indien") das
// richtige Land auf der Karte finden.
const COUNTRY_DE_EN = {};
Object.entries(COUNTRY_EN_DE).forEach(([en, de]) => {
  COUNTRY_DE_EN[de.toLowerCase()] = en;
});

function normalizeCountry(input) {
  if (!input) return null;
  return COUNTRY_DE_EN[input.trim().toLowerCase()] || null;
}

function displayName(enName, lang) {
  if (lang === 'de') return COUNTRY_EN_DE[enName] || enName;
  return enName; 
}

function buildEnglishCounts(countryData) {
  const result = {};
  Object.entries(countryData).forEach(([deName, count]) => {
    const enName = normalizeCountry(deName);
    if (enName) {
      result[enName] = (result[enName] || 0) + count;
    }
  });
  return result;
}

function getColor(value, max) {
  if (!value || value === 0) return '#f0f0f0';
  const t = value / max;
  const idx = Math.min(Math.floor(t * COLOR_SCALE.length), COLOR_SCALE.length - 1);
  return COLOR_SCALE[idx];
}

export default function WorldMap({ countryData = {} }) {
  const { t, i18n } = useTranslation();
  const [geoData, setGeoData] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });

  useEffect(() => {
    fetch(GEO_URL)
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error('Weltkarte: Geometrie-Ladefehler', err));
  }, []);

  if (!geoData) {
    return <div className="skeleton skeleton-map" />;
  }

  const counts = buildEnglishCounts(countryData);
  const max = Math.max(...Object.values(counts), 1);

  return (
    <div className="worldmap-wrapper">
      {tooltip.visible && (
        <div className="map-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.text}
        </div>
      )}
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 130 }}
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
                  stroke="#fff"
                  strokeWidth={0.4}
                  style={{
                    default: { outline: 'none' },
                    hover:   { outline: 'none', fill: value > 0 ? '#e6a817' : '#dfe6ee' },
                    pressed: { outline: 'none' },
                  }}
                  onMouseEnter={(e) => {
                    const label = displayName(name, i18n.language);
                    setTooltip({
                      visible: true,
                      text: value > 0
                        ? `${label}: ${value} ${value === 1 ? t('dash_case_singular') : t('dash_case_plural')}`
                        : label,
                      x: e.clientX,
                      y: e.clientY,
                    });
                  }}
                  onMouseMove={(e) => {
                    setTooltip((t) => ({ ...t, x: e.clientX, y: e.clientY }));
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