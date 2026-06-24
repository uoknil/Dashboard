import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/api';
import './ResetPassword.css';

export default function ResetPassword() {
  const navigate = useNavigate();

  const [token,    setToken]    = useState('');
  const [pass1,    setPass1]    = useState('');
  const [pass2,    setPass2]    = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  // Token aus der URL lesen: /reset-password?token=XYZ
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) setToken(t);
  }, []);

  async function handleSubmit() {
    setError('');
    if (!token) {
      setError('Kein gültiges Token gefunden. Bitte verwenden Sie den Link aus der E-Mail.');
      return;
    }
    if (pass1.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }
    if (pass1 !== pass2) {
      setError('Die beiden Passwörter stimmen nicht überein.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, pass1);
      setSuccess(true);
    } catch (err) {
      setError(
        err.status === 400
          ? 'Der Wiederherstellungslink ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen an.'
          : `Fehler: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  }

  // Erfolg
  if (success) {
    return (
      <div className="reset-page">
        <div className="reset-card">
          <div className="reset-success-icon" aria-hidden="true" />
          <h1 className="reset-title">Passwort geändert</h1>
          <p className="reset-sub">
            Ihr Passwort wurde erfolgreich zurückgesetzt. Sie können sich nun
            mit Ihrem neuen Passwort anmelden.
          </p>
          <button className="login-btn" onClick={() => navigate('/login', { replace: true })}>
            Zur Anmeldung
          </button>
        </div>
      </div>
    );
  }

  // Formular
  return (
    <div className="reset-page">
      <div className="reset-card">
        <h1 className="reset-title">Neues Passwort festlegen</h1>
        <p className="reset-sub">Bitte wählen Sie ein neues Passwort für Ihr Konto.</p>

        {!token && (
          <div className="login-api-err" role="alert">
            Kein Token in der Adresse gefunden. Bitte öffnen Sie diese Seite
            über den Link aus der E-Mail.
          </div>
        )}

        {error && <div className="login-api-err" role="alert">{error}</div>}

        <div className="login-field">
          <label htmlFor="reset-pass1">Neues Passwort</label>
          <input
            id="reset-pass1"
            type="password"
            value={pass1}
            onChange={(e) => { setPass1(e.target.value); setError(''); }}
            placeholder="mindestens 6 Zeichen"
            autoComplete="new-password"
          />
        </div>

        <div className="login-field">
          <label htmlFor="reset-pass2">Passwort bestätigen</label>
          <input
            id="reset-pass2"
            type="password"
            value={pass2}
            onChange={(e) => { setPass2(e.target.value); setError(''); }}
            placeholder="Passwort wiederholen"
            autoComplete="new-password"
          />
        </div>

        <button
          className="login-btn"
          onClick={handleSubmit}
          disabled={loading || !token}
        >
          {loading
            ? <><span className="spinner" aria-hidden="true" /> Wird gespeichert…</>
            : 'Passwort speichern'}
        </button>
      </div>
    </div>
  );
}