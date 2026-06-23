import { useEffect, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
} from '@vnedyalk0v/react19-simple-maps';

const GEO_URL = 'https://unpkg.com/world-atlas@2.0.2/countries-110m.json';

const COLOR_SCALE = ['#d4e8f7', '#9fc7e8', '#5a9fd4', '#2878b8', '#1a3a5c'];

// Vollständige Übersetzung: Kartenname (Englisch, wie in der Geometrie) → Deutsch.
// Diese Tabelle ist die zentrale Quelle für Anzeige UND Daten-Zuordnung.
const COUNTRY_EN_DE = {
  'Afghanistan': 'Afghanistan',
  'Albania': 'Albanien',
  'Algeria': 'Algerien',
  'Angola': 'Angola',
  'Argentina': 'Argentinien',
  'Armenia': 'Armenien',
  'Australia': 'Australien',
  'Austria': 'Österreich',
  'Azerbaijan': 'Aserbaidschan',
  'Bahamas': 'Bahamas',
  'Bangladesh': 'Bangladesch',
  'Belarus': 'Belarus',
  'Belgium': 'Belgien',
  'Belize': 'Belize',
  'Benin': 'Benin',
  'Bhutan': 'Bhutan',
  'Bolivia': 'Bolivien',
  'Bosnia and Herzegovina': 'Bosnien und Herzegowina',
  'Botswana': 'Botswana',
  'Brazil': 'Brasilien',
  'Brunei': 'Brunei',
  'Bulgaria': 'Bulgarien',
  'Burkina Faso': 'Burkina Faso',
  'Burundi': 'Burundi',
  'Cambodia': 'Kambodscha',
  'Cameroon': 'Kamerun',
  'Canada': 'Kanada',
  'Central African Rep.': 'Zentralafrikanische Republik',
  'Chad': 'Tschad',
  'Chile': 'Chile',
  'China': 'China',
  'Colombia': 'Kolumbien',
  'Congo': 'Kongo',
  'Costa Rica': 'Costa Rica',
  'Croatia': 'Kroatien',
  'Cuba': 'Kuba',
  'Cyprus': 'Zypern',
  'Czechia': 'Tschechien',
  'Democratic Republic of the Congo': 'Demokratische Republik Kongo',
  'Denmark': 'Dänemark',
  'Djibouti': 'Dschibuti',
  'Dominican Republic': 'Dominikanische Republik',
  'Ecuador': 'Ecuador',
  'Egypt': 'Ägypten',
  'El Salvador': 'El Salvador',
  'Equatorial Guinea': 'Äquatorialguinea',
  'Eritrea': 'Eritrea',
  'Estonia': 'Estland',
  'Ethiopia': 'Äthiopien',
  'Fiji': 'Fidschi',
  'Finland': 'Finnland',
  'France': 'Frankreich',
  'Gabon': 'Gabun',
  'Gambia': 'Gambia',
  'Georgia': 'Georgien',
  'Germany': 'Deutschland',
  'Ghana': 'Ghana',
  'Greece': 'Griechenland',
  'Greenland': 'Grönland',
  'Guatemala': 'Guatemala',
  'Guinea': 'Guinea',
  'Guinea-Bissau': 'Guinea-Bissau',
  'Guyana': 'Guyana',
  'Haiti': 'Haiti',
  'Honduras': 'Honduras',
  'Hungary': 'Ungarn',
  'Iceland': 'Island',
  'India': 'Indien',
  'Indonesia': 'Indonesien',
  'Iran': 'Iran',
  'Iraq': 'Irak',
  'Ireland': 'Irland',
  'Israel': 'Israel',
  'Italy': 'Italien',
  'Ivory Coast': 'Elfenbeinküste',
  'Jamaica': 'Jamaika',
  'Japan': 'Japan',
  'Jordan': 'Jordanien',
  'Kazakhstan': 'Kasachstan',
  'Kenya': 'Kenia',
  'Kosovo': 'Kosovo',
  'Kuwait': 'Kuwait',
  'Kyrgyzstan': 'Kirgisistan',
  'Laos': 'Laos',
  'Latvia': 'Lettland',
  'Lebanon': 'Libanon',
  'Lesotho': 'Lesotho',
  'Liberia': 'Liberia',
  'Libya': 'Libyen',
  'Lithuania': 'Litauen',
  'Luxembourg': 'Luxemburg',
  'Madagascar': 'Madagaskar',
  'Malawi': 'Malawi',
  'Malaysia': 'Malaysia',
  'Mali': 'Mali',
  'Mauritania': 'Mauretanien',
  'Mexico': 'Mexiko',
  'Moldova': 'Moldau',
  'Mongolia': 'Mongolei',
  'Montenegro': 'Montenegro',
  'Morocco': 'Marokko',
  'Mozambique': 'Mosambik',
  'Myanmar': 'Myanmar',
  'Namibia': 'Namibia',
  'Nepal': 'Nepal',
  'Netherlands': 'Niederlande',
  'New Caledonia': 'Neukaledonien',
  'New Zealand': 'Neuseeland',
  'Nicaragua': 'Nicaragua',
  'Niger': 'Niger',
  'Nigeria': 'Nigeria',
  'North Korea': 'Nordkorea',
  'North Macedonia': 'Nordmazedonien',
  'Norway': 'Norwegen',
  'Oman': 'Oman',
  'Pakistan': 'Pakistan',
  'Panama': 'Panama',
  'Papua New Guinea': 'Papua-Neuguinea',
  'Paraguay': 'Paraguay',
  'Peru': 'Peru',
  'Philippines': 'Philippinen',
  'Poland': 'Polen',
  'Portugal': 'Portugal',
  'Puerto Rico': 'Puerto Rico',
  'Qatar': 'Katar',
  'Romania': 'Rumänien',
  'Russia': 'Russland',
  'Rwanda': 'Ruanda',
  'Saudi Arabia': 'Saudi-Arabien',
  'Senegal': 'Senegal',
  'Serbia': 'Serbien',
  'Sierra Leone': 'Sierra Leone',
  'Singapore': 'Singapur',
  'Slovakia': 'Slowakei',
  'Slovenia': 'Slowenien',
  'Solomon Islands': 'Salomonen',
  'Somalia': 'Somalia',
  'South Africa': 'Südafrika',
  'South Korea': 'Südkorea',
  'South Sudan': 'Südsudan',
  'Spain': 'Spanien',
  'Sri Lanka': 'Sri Lanka',
  'Sudan': 'Sudan',
  'Suriname': 'Suriname',
  'Sweden': 'Schweden',
  'Switzerland': 'Schweiz',
  'Syria': 'Syrien',
  'Taiwan': 'Taiwan',
  'Tajikistan': 'Tadschikistan',
  'Tanzania': 'Tansania',
  'Thailand': 'Thailand',
  'Timor-Leste': 'Osttimor',
  'Togo': 'Togo',
  'Trinidad and Tobago': 'Trinidad und Tobago',
  'Tunisia': 'Tunesien',
  'Turkey': 'Türkei',
  'Turkmenistan': 'Turkmenistan',
  'Uganda': 'Uganda',
  'Ukraine': 'Ukraine',
  'United Arab Emirates': 'Vereinigte Arabische Emirate',
  'United Kingdom': 'Vereinigtes Königreich',
  'United States of America': 'Vereinigte Staaten',
  'Uruguay': 'Uruguay',
  'Uzbekistan': 'Usbekistan',
  'Vanuatu': 'Vanuatu',
  'Venezuela': 'Venezuela',
  'Vietnam': 'Vietnam',
  'Yemen': 'Jemen',
  'Zambia': 'Sambia',
  'Zimbabwe': 'Simbabwe',
};

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

function displayName(enName) {
  return COUNTRY_EN_DE[enName] || enName;
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
                    const label = displayName(name);
                    setTooltip({
                      visible: true,
                      text: value > 0
                        ? `${label}: ${value} ${value === 1 ? 'Fall' : 'Fälle'}`
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