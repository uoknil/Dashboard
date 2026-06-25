import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resetPassword } from '../services/api';
import './ResetPassword.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [token,    setToken]    = useState('');
  const [pass1,    setPass1]    = useState('');
  const [pass2,    setPass2]    = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  // Token aus der URL lesen: /reset-password?token=XYZ
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tok = params.get('token');
    if (tok) setToken(tok);
  }, []);

  async function handleSubmit() {
    setError('');
    if (!token) {
      setError(t('reset_err_no_token'));
      return;
    }
    if (pass1.length < 6) {
      setError(t('reset_err_too_short'));
      return;
    }
    if (pass1 !== pass2) {
      setError(t('reset_err_mismatch'));
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, pass1);
      setSuccess(true);
    } catch (err) {
      setError(
        err.status === 400
          ? t('reset_err_invalid_link')
          : t('reset_err_generic', { msg: err.message })
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
          <h1 className="reset-title">{t('reset_success_title')}</h1>
          <p className="reset-sub">{t('reset_success_sub')}</p>
          <button className="login-btn" onClick={() => navigate('/login', { replace: true })}>
            {t('reset_to_login')}
          </button>
        </div>
      </div>
    );
  }

  // Formular
  return (
    <div className="reset-page">
      <div className="reset-card">
        <h1 className="reset-title">{t('reset_title')}</h1>
        <p className="reset-sub">{t('reset_sub')}</p>

        {!token && (
          <div className="login-api-err" role="alert">{t('reset_no_token_banner')}</div>
        )}

        {error && <div className="login-api-err" role="alert">{error}</div>}

        <div className="login-field">
          <label htmlFor="reset-pass1">{t('reset_pass1_label')}</label>
          <input
            id="reset-pass1"
            type="password"
            value={pass1}
            onChange={(e) => { setPass1(e.target.value); setError(''); }}
            placeholder={t('reset_pass1_ph')}
            autoComplete="new-password"
          />
        </div>

        <div className="login-field">
          <label htmlFor="reset-pass2">{t('reset_pass2_label')}</label>
          <input
            id="reset-pass2"
            type="password"
            value={pass2}
            onChange={(e) => { setPass2(e.target.value); setError(''); }}
            placeholder={t('reset_pass2_ph')}
            autoComplete="new-password"
          />
        </div>

        <button
          className="login-btn"
          onClick={handleSubmit}
          disabled={loading || !token}
        >
          {loading
            ? <><span className="spinner" aria-hidden="true" /> {t('reset_submitting')}</>
            : t('reset_submit')}
        </button>
      </div>
    </div>
  );
}
