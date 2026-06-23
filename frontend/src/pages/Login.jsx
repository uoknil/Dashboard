import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, forgotPassword } from '../services/api';
import './Login.css';
import Navbar from '../components/Navbar';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);

  // Passwort-vergessen-Bereich
  const [forgotMode,   setForgotMode]   = useState(false);  // zeigt das Benutzername-Feld
  const [forgotName,   setForgotName]   = useState('');
  const [forgotMsg,    setForgotMsg]    = useState('');     // Bestätigungstext
  const [forgotError,  setForgotError]  = useState('');
  const [forgotBusy,   setForgotBusy]   = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const userRef  = useRef(null);

  // Schon eingeloggt → direkt zum Admin
  useEffect(() => {
    if (isAuthenticated) navigate('/admin', { replace: true });
  }, [isAuthenticated, navigate]);

  // Cursor sofort ins Username-Feld
  useEffect(() => { userRef.current?.focus(); }, []);

  // ── Validierung ──────────────────────────────────────────────
  function validate() {
    const e = {};
    if (!username.trim()) e.username = 'Benutzername erforderlich.';
    if (!password)        e.password = 'Passwort erforderlich.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Absenden ─────────────────────────────────────────────────
  async function handleSubmit(e) {
    e?.preventDefault();
    setApiError('');
    if (!validate()) return;

    setLoading(true);
    try {
      // loginUser() sendet als URLSearchParams — NICHT als JSON!
      // Das Backend nutzt OAuth2PasswordRequestForm
      const data = await loginUser(username.trim(), password);
      login(data.access_token, username.trim());
      navigate('/admin', { replace: true });
    } catch (err) {
      if (err.status === 401) {
        setApiError('Ungültige Anmeldedaten oder Account deaktiviert.');
      } else {
        setApiError(
          `Verbindungsfehler: ${err.message}. ` +
          `Läuft der Backend-Server? (${import.meta.env.VITE_API_URL || 'http://localhost:8000'})`
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Passwort vergessen ───────────────────────────────────────
  async function handleForgot() {
    setForgotError('');
    setForgotMsg('');
    if (!forgotName.trim()) {
      setForgotError('Bitte geben Sie Ihren Benutzernamen ein.');
      return;
    }
    setForgotBusy(true);
    try {
      await forgotPassword(forgotName.trim());
      // Backend antwortet aus Sicherheitsgründen immer mit Erfolg —
      // egal ob der Benutzername existiert. Daher zeigen wir immer dieselbe Meldung.
      setForgotMsg(
        'Falls dieses Konto existiert, wurde ein Wiederherstellungslink an die ' +
        'System-/Supervisor-E-Mail gesendet. Bitte kontaktieren Sie Kathrin Spettel, ' +
        'um Ihren Link zu erhalten.'
      );
    } catch (err) {
      setForgotError(`Verbindungsfehler: ${err.message}. Läuft der Backend-Server?`);
    } finally {
      setForgotBusy(false);
    }
  }

  return (
    <div className="login-page">
   {/*  <Navbar />  */}

      {/* Logo */}
      <div className="login-logo">
        <div className="login-logo-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
            <circle cx="12" cy="12" r="8"    stroke="#9bb8d4" strokeWidth="1.5"/>
            <circle cx="12" cy="9"  r="2.2"  stroke="#9bb8d4" strokeWidth="1.3"/>
            <circle cx="7.5"  cy="15" r="1.6" stroke="#9bb8d4" strokeWidth="1.1"/>
            <circle cx="16.5" cy="15" r="1.6" stroke="#9bb8d4" strokeWidth="1.1"/>
            <line x1="12" y1="11.2" x2="8.8"  y2="13.8" stroke="#9bb8d4" strokeWidth=".9"/>
            <line x1="12" y1="11.2" x2="15.2" y2="13.8" stroke="#9bb8d4" strokeWidth=".9"/>
          </svg>
        </div>
        <div className="login-logo-title">Candida auris Dashboard</div>
        <div className="login-logo-sub">Österreich · Geschützter Bereich</div>
      </div>

      {/* Karte */}
      <div className="login-card" role="main">
        <h1 className="login-title">Anmeldung</h1>
        <p  className="login-sub">Nur für autorisierte Personen zugänglich</p>

        {/* API-Fehler */}
        {apiError && (
          <div className="login-api-err" role="alert">{apiError}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* Benutzername */}
          <div className={`login-field${errors.username ? ' login-field-err' : ''}`}>
            <label htmlFor="login-username">Benutzername</label>
            <input
              ref={userRef}
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setErrors((v) => ({ ...v, username: '' }));
              }}
              placeholder="admin"
              autoComplete="username"
            />
            {errors.username && (
              <div className="login-err-msg" role="alert">{errors.username}</div>
            )}
          </div>

          {/* Passwort */}
          <div className={`login-field${errors.password ? ' login-field-err' : ''}`}>
            <label htmlFor="login-password">Passwort</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((v) => ({ ...v, password: '' }));
              }}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {errors.password && (
              <div className="login-err-msg" role="alert">{errors.password}</div>
            )}
          </div>

<button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" aria-hidden="true" /> Anmelden…</>
              : 'Anmelden'}
          </button>
        </form>

        {/* Passwort vergessen */}
        {!forgotMode ? (
          <button
            type="button"
            className="login-forgot-link"
            onClick={() => { setForgotMode(true); setApiError(''); }}
          >
            Passwort vergessen?
          </button>
        ) : (
          <div className="login-forgot-box">
            {forgotMsg ? (
              <div className="login-forgot-success" role="status">{forgotMsg}</div>
            ) : (
              <>
                <div className="login-field">
                  <label htmlFor="forgot-username">Benutzername</label>
                  <input
                    id="forgot-username"
                    type="text"
                    value={forgotName}
                    onChange={(e) => { setForgotName(e.target.value); setForgotError(''); }}
                    placeholder="Ihr Benutzername"
                    autoComplete="username"
                  />
                </div>
                {forgotError && (
                  <div className="login-err-msg" role="alert">{forgotError}</div>
                )}
                <button
                  type="button"
                  className="login-btn"
                  onClick={handleForgot}
                  disabled={forgotBusy}
                >
                  {forgotBusy
                    ? <><span className="spinner" aria-hidden="true" /> Wird gesendet…</>
                    : 'Wiederherstellungslink anfordern'}
                </button>
              </>
            )}
            <button
              type="button"
              className="login-forgot-link"
              onClick={() => {
                setForgotMode(false);
                setForgotName('');
                setForgotMsg('');
                setForgotError('');
              }}
            >
              ← Zurück zur Anmeldung
            </button>
          </div>
        )}

        <div className="login-notice">
          <strong>Token-Gültigkeit:</strong> 180 Minuten. Kein automatischer Refresh.<br />
          Bei Ablauf werden Sie automatisch abgemeldet.<br /><br />
        </div>
      </div>
    </div>
  );
}