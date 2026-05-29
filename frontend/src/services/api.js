
// 1. GRUNDKONFIGURATION

// Die Basisadresse des Backends
// process.env.VITE_API_URL liest
// aus der .env-Datei
// Wenn die nicht existiert, fällt es auf localhost:8000 zurück
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Die zentrale request()-Funktion. (privat, kein export)
// Nur die Funktionen unten benutzen sie
// Sie macht automatisch
// 1. Token aus localStorage holen
// 2. als Bearer-Header anhängen
// 3. Fehler als Exception werfen, mit HTTP-Status
async function request(path, options = {}) {
  const token = localStorage.getItem('cauris_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const error = new Error(err.detail || `HTTP ${res.status}`);
    error.status = res.status;
    throw error;
  }
  // 204 = Erfolg ohne Inhalt, z.B. für DELETE Requests
  // ohne dies, warf res.json() einen Fehler, weil nichts zu parsen gibt
  if (res.status === 204) return null;
  return res.json();
}

// 2. LOGIN

// URLSearchParams statt JSON
// FastAPIs 0Auth2PasswordRequestForm erwartet 
// username=admin&password=geheim als Form-Daten,
// nicht { "username":"admin"} als JSON
// URLSearchParams baut dieses Format automatisch
export async function loginUser(username, password) {
  const body = new URLSearchParams();
  body.append('username', username);
  body.append('password', password);

  // Kein Content-Type Header nötig
  // Wenn der Body ein URLSearchParams-Objekt ist,
  // setzt der Browser den Content-Type automatisch auf
  // application/x-www-form-urlencoded
  // Würde man ihn manuell auf application/json setzen
  // würde FastAPI den Request ablehnen
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const error = new Error(err.detail || `HTTP ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

// 3. ÖFFENTLICHE ENDPUNKTE

// Die Dashboard-Daten, alle einzeilig
// sie rufen request() mit dem jeweiligen Pfad auf
// Kein Token nötig, da die Endpunkte im Backend öffentlich sind
// Antwort kommt als JS-Objekt zurück
export const fetchStatsByState = () => request('/api/stats/by-state');
export const fetchStatsBySite  = () => request('/api/stats/by-site');
export const fetchStatsByClade = () => request('/api/stats/by-clade');
export const fetchStatsByYear  = () => request('/api/stats/by-year');
export const fetchLastUpdated  = () => request('/api/meta/last-updated');

// Fallmeldung absenden
// hier ist JSON nötig
// POST /api/report-case erwartet ein JSON-Objekt (nicht FormData)
// JSON.stringify(payload) wandelt das JS-Objekt in JSON-String um
// Content-Type application/json kommt automatisch aus der request()-Funktion
export const submitCase = (payload) =>
  request('/api/report-case', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// 4. ADMIN-ENDPUNKTE

// Die Admin-Funktionen
// Der Token wird automatisch von request() mitgeschickt
// das ${id} in den URLs ist Template-Syntax
// es fügt die ID direkt in den Pfad ein: z.B. /api/admin/cases/42
export const fetchCases       = () => request('/api/admin/cases');
export const fetchSubmissions = () => request('/api/admin/submissions');

// PATCH = nur die gesendeten Felder ändern
export const updateCase = (id, patch) =>
  request(`/api/admin/cases/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });

export const deleteCase = (id) =>
  request(`/api/admin/cases/${id}`, { method: 'DELETE' });

export const updateSubmission = (id, patch) =>
  request(`/api/admin/submissions/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });

export const approveSubmission = (id) =>
  request(`/api/admin/approve-submission/${id}`, { method: 'POST' });

export const rejectSubmission = (id) =>
  request(`/api/admin/submissions/${id}`, { method: 'DELETE' });