import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { submitCase } from '../services/api';
import './Meldeformular.css';
import Navbar from '../components/Navbar';
import ReCAPTCHA from "react-google-recaptcha";

// ─── Schritt-Anzeige ─────────────────────────────────────────
const STEP_KEYS = ['form_step1', 'form_step2', 'form_step3', 'form_step4'];

function StepIndicator({ current }) {
  const { t } = useTranslation();
  return (
    <div className="step-indicator" role="list">
      {STEP_KEYS.map((labelKey, i) => {
        const n = i + 1;
        const state = n < current ? 'done' : n === current ? 'active' : 'pending';
        return (
          <React.Fragment key={n}>
            <div className="step-item" role="listitem">
              <div className={`step-circle step-${state}`}>
                {state === 'done' ? '✓' : n}
              </div>
              <div className={`step-label${state === 'active' ? ' step-label-active' : ''}`}>
                {t(labelKey)}
              </div>
            </div>
            {i < STEP_KEYS.length - 1 && (
              <div className={`step-line${n < current ? ' step-line-done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Wiederverwendbare Hilfskomponenten ───────────────────────
function Field({ id, label, required, hint, error, fullWidth = false, children }) {
  return (
    <div className={`field${error ? ' field-error' : ''}${fullWidth ? ' field-full' : ''}`}>
      <label htmlFor={id}>
        {label}{required && <span className="req"> *</span>}
      </label>
      {children}
      {hint  && <div className="field-hint">{hint}</div>}
      {error && <div className="field-err-msg" role="alert">{error}</div>}
    </div>
  );
}

function SelectField({ id, value, onChange, options, placeholder, error }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)}
      className={error ? 'input-error' : ''}>
      <option value="">{placeholder}</option>
      {options.map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  );
}

function RadioGroup({ name, value, onChange, options }) {
  return (
    <div className="radio-group" role="radiogroup">
      {options.map(([val, label]) => (
        <label key={val} className="radio-opt">
          <input type="radio" name={name} value={val}
            checked={value === val} onChange={() => onChange(val)} />
          {label}
        </label>
      ))}
    </div>
  );
}

function ToggleSection({ label, fieldName, checked, onChange, children }) {
  return (
    <div className="toggle-section">
      <div className="toggle-header">
        <span className="toggle-header-label">{label}</span>
        <label className="toggle-switch">
          <input type="checkbox" checked={checked}
            onChange={(e) => onChange(fieldName, e.target.checked)} />
          <span className="toggle-track" />
          <span className="toggle-thumb" />
        </label>
      </div>
      {checked && <div className="toggle-body">{children}</div>}
    </div>
  );
}

function MicInput({ id, label, value, onChange }) {
  return (
    <div className="field mic-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="number" step="0.001" min="0" value={value} placeholder="–"
        onChange={(e) => onChange(id, e.target.value === '' ? '' : parseFloat(e.target.value))} />
    </div>
  );
}

// ─── Anfangswerte ─────────────────────────────────────────────
const INITIAL = {
  state: '', city: '',
  date_of_isolation: new Date().toISOString().split('T')[0],
  isolation_site: '', infection_type: 'unknown', travel_history: '',
  gender: '', age: '', immune_status: 'unknown', medical_history: '',
  hospitalized_abroad: false, hospital_name: '',
  antifungal_therapy: false, antifungal_therapy_details: '',
  topical_therapy: false, topical_therapy_details: '',
  reporter_email: '', additional_info: '',
  mic_and: '', mic_mic: '', mic_cas: '', mic_flc: '',
  mic_pos: '', mic_vor: '', mic_5fc: '', mic_amb: '', mic_mgx: '',
};

// ─── Hauptkomponente ──────────────────────────────────────────
export default function Meldeformular() {
  const { t, i18n } = useTranslation();
  const [form,         setForm]         = useState(INITIAL);
  const [errors,       setErrors]       = useState({});
  const [step,         setStep]         = useState(1);
  const [captchaToken,  setCaptchaToken] = useState("");
  const [submitState,  setSubmitState]  = useState('idle');
  const [apiError,     setApiError]     = useState('');
  const [submissionId, setSubmissionId] = useState(null);
  const navigate = useNavigate();

  const set = useCallback((key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  }, []);

  // ── Validierung ──────────────────────────────────────────────
  function validate1() {
    const e = {};
    if (!form.state)                 e.state          = t('form_err_state');
    if (!form.city.trim())           e.city           = t('form_err_city');
    if (!form.date_of_isolation)     e.date_of_isolation = t('form_err_date');
    if (!form.isolation_site.trim()) e.isolation_site = t('form_err_site');
    if (!form.travel_history.trim()) e.travel_history = t('form_err_travel');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validate2() {
    const e = {};
    if (!form.gender)                   e.gender         = t('form_err_gender');
    if (!form.medical_history.trim())   e.medical_history= t('form_err_medical');
    if (form.age !== '') {
      const ageNum = Number(form.age);
      if (!Number.isInteger(ageNum) || ageNum < 1 || ageNum > 119)
        e.age = t('form_err_age');
    }
    if (form.hospitalized_abroad && !form.hospital_name.trim())
      e.hospital_name = t('form_err_hospital');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validate3() {
    const e = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.reporter_email))
      e.reporter_email = t('form_err_email');
    if (form.antifungal_therapy && !form.antifungal_therapy_details.trim())
      e.antifungal_therapy_details = t('form_err_antifungal');
    if (form.topical_therapy && !form.topical_therapy_details.trim())
      e.topical_therapy_details = t('form_err_topical');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function nextStep() {
    const validators = [null, validate1, validate2, validate3];
    if (validators[step]?.()) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ── Payload bauen ────────────────────────────────────────────
  function buildPayload() {
    const mic = (k) => form[k] !== '' ? parseFloat(form[k]) : undefined;
    const payload = {
      reporter_email: form.reporter_email,
      gender: form.gender || 'unknown',
      medical_history: form.medical_history,
      isolation_site: form.isolation_site,
      date_of_isolation: form.date_of_isolation,
      city: form.city,
      state: form.state,
      travel_history: form.travel_history,
      infection_type: form.infection_type,
      captcha_token: captchaToken,
      ...(form.age !== '' && parseInt(form.age) > 0 && parseInt(form.age) < 120
          ? { age: parseInt(form.age) } : {}),
      ...(form.immune_status ? { immune_status: form.immune_status } : {}),
      ...(form.additional_info.trim() ? { additional_info: form.additional_info } : {}),
      hospitalized_abroad: form.hospitalized_abroad,
      ...(form.hospitalized_abroad ? { hospital_name: form.hospital_name } : {}),
      antifungal_therapy: form.antifungal_therapy,
      ...(form.antifungal_therapy ? { antifungal_therapy_details: form.antifungal_therapy_details } : {}),
      topical_therapy: form.topical_therapy,
      ...(form.topical_therapy ? { topical_therapy_details: form.topical_therapy_details } : {}),
    };
    ['mic_and','mic_mic','mic_cas','mic_flc','mic_pos','mic_vor','mic_5fc','mic_amb','mic_mgx']
      .forEach(k => { const v = mic(k); if (v !== undefined) payload[k] = v; });
    return payload;
  }

  // ── Absenden ─────────────────────────────────────────────────
  async function handleSubmit() {
    if (!captchaToken) {
      setErrors((e) => ({ ...e, captcha: t('form_err_captcha') }));
      return;
    }
    setSubmitState('loading');
    setApiError('');
    try {
      const res = await submitCase(buildPayload());
      setSubmissionId(res.submission_id);
      setSubmitState('success');
    } catch (err) {
    // If it's an object, stringify it so it doesn't render as [object Object]
      const errorMsg = typeof err.message === 'object' ? JSON.stringify(err.message) : err.message;
      setApiError(err.status === 422 ? t('form_err_validation', { msg: errorMsg }) : t('form_err_generic', { msg: errorMsg }));
      setSubmitState('error');
    }
  }

  function reset() {
    setForm(INITIAL); setErrors({}); setStep(1);
    setCaptchaToken(""); setSubmitState('idle');
    setApiError(''); setSubmissionId(null);
  }

  // ── Zusammenfassung ──────────────────────────────────────────
  const SUMMARY = [
    [t('form_sum_state'),    form.state],
    [t('form_sum_city'),     form.city],
    [t('form_sum_date'),     form.date_of_isolation],
    [t('form_sum_site'),     form.isolation_site],
    [t('form_sum_inftype'),  form.infection_type],
    [t('form_sum_travel'),   form.travel_history],
    [t('form_sum_gender'),   form.gender],
    [t('form_sum_age'),      form.age || '—'],
    [t('form_sum_medical'),  form.medical_history],
    [t('form_sum_immune'),   form.immune_status],
    [t('form_sum_hosp'),     form.hospitalized_abroad ? t('form_sum_yes_dash', { val: form.hospital_name }) : t('form_no')],
    [t('form_sum_antifungal'), form.antifungal_therapy ? t('form_sum_yes_dash', { val: form.antifungal_therapy_details }) : t('form_no')],
    [t('form_sum_topical'),  form.topical_therapy ? t('form_sum_yes_dash', { val: form.topical_therapy_details }) : t('form_no')],
    [t('form_sum_email'),    form.reporter_email],
    [t('form_sum_additional'), form.additional_info || '—'],
  ];

  // ── Erfolg ───────────────────────────────────────────────────
  if (submitState === 'success') {
    return (
      <div className="form-page">
        <header className="topbar">
          <div className="topbar-title">{t('form_topbar_title')}</div>
        </header>
        <div className="success-panel">
          <div className="success-icon" aria-hidden="true" />
          <h2 className="success-title">{t('form_success_title')}</h2>
          <p className="success-sub">{t('form_success_sub')}</p>
          {submissionId && <p className="success-id">{t('form_success_id')} <strong>{submissionId}</strong></p>}
          <div className="success-actions">
            <button className="btn-primary" onClick={reset}>{t('form_new_report')}</button>
            <button className="btn-secondary" onClick={() => navigate('/')}>{t('form_back_dashboard')}</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Formular ─────────────────────────────────────────────────
  return (
    <div className="form-page">
      <Navbar />

      <div className="info-banner" role="note">
        <div className="info-icon">i</div>
        <div>{t('form_banner_pre')}<strong>{t('form_banner_strong')}</strong>{t('form_banner_post')}<span className="req">*</span>{t('form_banner_end')}</div>
      </div>

      <StepIndicator current={step} />
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${(step / 4) * 100}%` }} />
      </div>

      {/* ═══ SCHRITT 1 ═══ */}
      {step === 1 && (
        <>
          <div className="panel">
            <div className="panel-title">{t('form_p1_title')} <span className="panel-badge">{t('form_badge_required')}</span></div>
            <div className="field-grid">
              <Field id="state" label={t('form_state')} required error={errors.state}>
                <SelectField id="state" value={form.state} onChange={(v) => set('state', v)}
                  error={!!errors.state}
                  placeholder={t('form_select_ph')}
                  options={[
                    ['Vienna','Wien'],['Lower Austria','Niederösterreich'],
                    ['Upper Austria','Oberösterreich'],['Styria','Steiermark'],
                    ['Tyrol','Tirol'],['Salzburg','Salzburg'],['Carinthia','Kärnten'],
                    ['Vorarlberg','Vorarlberg'],['Burgenland','Burgenland'],
                  ]} />
                <div className="field-hint">{t('form_state_hint')}</div>
              </Field>
              <Field id="city" label={t('form_city')} required error={errors.city}
                hint={t('form_city_hint')}>
                <input id="city" type="text" value={form.city}
                  className={errors.city ? 'input-error' : ''}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder={t('form_city_ph')} />
              </Field>
              <Field id="date_of_isolation" label={t('form_date')} required
                error={errors.date_of_isolation} hint={t('form_date_hint')}>
                <input id="date_of_isolation" type="date" value={form.date_of_isolation}
                  max={new Date().toISOString().split('T')[0]}
                  className={errors.date_of_isolation ? 'input-error' : ''}
                  onChange={(e) => set('date_of_isolation', e.target.value)} />
              </Field>
              <Field id="isolation_site" label={t('form_site')} required
                error={errors.isolation_site} hint={t('form_site_hint')}>
                <input id="isolation_site" type="text" value={form.isolation_site}
                  className={errors.isolation_site ? 'input-error' : ''}
                  onChange={(e) => set('isolation_site', e.target.value)}
                  placeholder={t('form_site_ph')} />
              </Field>
              <Field id="infection_type" label={t('form_inftype')} required fullWidth
                hint='"infection" | "colonization" | "unknown"'>
                <RadioGroup name="infection_type" value={form.infection_type}
                  onChange={(v) => set('infection_type', v)}
                  options={[['infection',t('form_inftype_infection')],['colonization',t('form_inftype_colonization')],['unknown',t('form_unknown')]]} />
              </Field>
            </div>
          </div>
          <div className="panel">
            <div className="panel-title">{t('form_travel_panel')} <span className="panel-badge panel-badge-required">{t('form_badge_req_short')}</span></div>
            <Field id="travel_history" label={t('form_travel')} required error={errors.travel_history}
              hint={t('form_travel_hint')}>
              <textarea id="travel_history" rows={3} value={form.travel_history}
                className={errors.travel_history ? 'input-error' : ''}
                onChange={(e) => set('travel_history', e.target.value)}
                placeholder={t('form_travel_ph')} />
            </Field>
          </div>
          <div className="btn-row">
            <span className="step-hint">{t('form_step_of', { current: 1 })}</span>
            <button className="btn-primary" onClick={nextStep}>{t('form_next')}</button>
          </div>
        </>
      )}

      {/* ═══ SCHRITT 2 ═══ */}
      {step === 2 && (
        <>
          <div className="panel">
            <div className="panel-title">{t('form_p2_title')} <span className="panel-badge">{t('form_badge_anon')}</span></div>
            <div className="field-grid">
              <Field id="gender" label={t('form_gender')} required error={errors.gender}
                hint='"male" | "female" | "divers" | "inter" | "other"'>
                <SelectField id="gender" value={form.gender} onChange={(v) => set('gender', v)}
                  error={!!errors.gender}
                  placeholder={t('form_select_ph')}
                  options={[['male',t('form_gender_male')],['female',t('form_gender_female')],['other',t('form_gender_divers')],['intersex',t('form_gender_inter')],['unknown',t('form_unknown')]]} />
              </Field>
              <Field id="age" label={t('form_age')} hint={t('form_age_hint')} error={errors.age}>
                <input id="age" type="number" value={form.age} min="1" max="119"
                  className={errors.age ? 'input-error' : ''}
                  onChange={(e) => set('age', e.target.value)} placeholder={t('form_age_ph')} />
              </Field>
              <Field id="immune_status" label={t('form_immune')} fullWidth
                hint='"immunocompetent" | "immunocompromised" | "unknown"'>
                <RadioGroup name="immune_status" value={form.immune_status}
                  onChange={(v) => set('immune_status', v)}
                  options={[['immunocompetent',t('form_immune_competent')],['immunocompromised',t('form_immune_compromised')],['unknown',t('form_unknown')]]} />
              </Field>
              <Field id="medical_history" label={t('form_medical')} required
                error={errors.medical_history} fullWidth>
                <textarea id="medical_history" rows={2} value={form.medical_history}
                  className={errors.medical_history ? 'input-error' : ''}
                  onChange={(e) => set('medical_history', e.target.value)}
                  placeholder={t('form_medical_ph')} />
              </Field>
            </div>
          </div>
          <div className="panel">
            <div className="panel-title">{t('form_abroad_panel')}</div>
            <ToggleSection label={t('form_abroad_toggle')}
              fieldName="hospitalized_abroad" checked={form.hospitalized_abroad} onChange={set}>
              <Field id="hospital_name" label={t('form_hospital')} required
                error={errors.hospital_name} hint={t('form_hospital_hint')}>
                <input id="hospital_name" type="text" value={form.hospital_name}
                  className={errors.hospital_name ? 'input-error' : ''}
                  onChange={(e) => set('hospital_name', e.target.value)}
                  placeholder={t('form_hospital_ph')} />
              </Field>
            </ToggleSection>
          </div>
          <div className="panel">
            <div className="panel-title">{t('form_mic_panel')} <span className="panel-badge">{t('form_badge_optional')}</span></div>
            <div className="mic-grid">
              {[['mic_and','Anidulafungin'],['mic_mic','Micafungin'],['mic_cas','Caspofungin'],
                ['mic_flc','Fluconazol'],['mic_pos','Posaconazol'],['mic_vor','Voriconazol'],
                ['mic_5fc','5-Flucytosin'],['mic_amb','Amphotericin B'],['mic_mgx','Manogepix']]
                .map(([id, label]) => (
                  <MicInput key={id} id={id} label={label} value={form[id]} onChange={set} />
                ))}
            </div>
          </div>
          <div className="btn-row">
            <button className="btn-secondary" onClick={() => setStep(1)}>{t('form_back')}</button>
            <button className="btn-primary" onClick={nextStep}>{t('form_next')}</button>
          </div>
        </>
      )}

      {/* ═══ SCHRITT 3 ═══ */}
      {step === 3 && (
        <>
          <div className="panel">
            <div className="panel-title">{t('form_antifungal_panel')}</div>
            <ToggleSection label={t('form_antifungal_toggle')}
              fieldName="antifungal_therapy" checked={form.antifungal_therapy} onChange={set}>
              <Field id="antifungal_therapy_details" label={t('form_which_therapy')} required
                error={errors.antifungal_therapy_details}>
                <input id="antifungal_therapy_details" type="text"
                  value={form.antifungal_therapy_details}
                  className={errors.antifungal_therapy_details ? 'input-error' : ''}
                  onChange={(e) => set('antifungal_therapy_details', e.target.value)}
                  placeholder={t('form_antifungal_ph')} />
              </Field>
            </ToggleSection>
          </div>
          <div className="panel">
            <div className="panel-title">{t('form_topical_panel')}</div>
            <ToggleSection label={t('form_topical_toggle')}
              fieldName="topical_therapy" checked={form.topical_therapy} onChange={set}>
              <Field id="topical_therapy_details" label={t('form_which_therapy')} required
                error={errors.topical_therapy_details}>
                <input id="topical_therapy_details" type="text"
                  value={form.topical_therapy_details}
                  className={errors.topical_therapy_details ? 'input-error' : ''}
                  onChange={(e) => set('topical_therapy_details', e.target.value)}
                  placeholder={t('form_topical_ph')} />
              </Field>
            </ToggleSection>
          </div>
          <div className="panel">
            <div className="panel-title">{t('form_contact_panel')}</div>
            <div className="field-grid">
              <Field id="reporter_email" label={t('form_email')} required
                error={errors.reporter_email} hint={t('form_email_hint')} fullWidth>
                <input id="reporter_email" type="email" value={form.reporter_email}
                  className={errors.reporter_email ? 'input-error' : ''}
                  onChange={(e) => set('reporter_email', e.target.value)}
                  placeholder="name@krankenhaus.at" />
              </Field>
              <Field id="additional_info" label={t('form_additional')} hint={t('form_additional_hint')} fullWidth>
                <textarea id="additional_info" rows={3} value={form.additional_info}
                  onChange={(e) => set('additional_info', e.target.value)}
                  placeholder={t('form_additional_ph')} />
              </Field>
            </div>
          </div>
          <div className="btn-row">
            <button className="btn-secondary" onClick={() => setStep(2)}>{t('form_back')}</button>
            <button className="btn-primary" onClick={nextStep}>{t('form_next')}</button>
          </div>
        </>
      )}

      {/* ═══ SCHRITT 4 ═══ */}
      {step === 4 && (
        <>
          <div className="panel">
            <div className="panel-title">{t('form_summary_title')}</div>
            <div className="summary-table">
              {SUMMARY.map(([key, val]) => (
                <div key={key} className="summary-row">
                  <div className="summary-key">{key}</div>
                  <div className="summary-val">{val || '—'}</div>
                </div>
              ))}
            </div>
          </div>
<div className="panel">
            <div className="panel-title">{t('form_captcha_panel')}</div>

            {/* Real Official Google reCAPTCHA widget alignment container */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
              <ReCAPTCHA
                key={i18n.language}
                hl={i18n.language}
                sitekey="6LcKBS0tAAAAAHx2okwkn1eIg0D2Vtwilkhc0Z3o"
                onChange={(token) => {
                  setCaptchaToken(token || "");
                  setErrors((e) => ({ ...e, captcha: '' }));
                }}
              />
            </div>

            {errors.captcha && <div className="field-err-msg" style={{textAlign: 'center', marginTop:'6px'}}>{errors.captcha}</div>}
          </div>
          {submitState === 'error' && (
            <div className="api-err-banner" role="alert">
              <strong>{t('form_error_label')}</strong> {apiError}
            </div>
          )}
          <div className="btn-row">
            <button className="btn-secondary" onClick={() => setStep(3)}>{t('form_back')}</button>
            <button className="btn-primary" onClick={handleSubmit}
              disabled={submitState === 'loading'}>
              {submitState === 'loading'
                ? <><span className="spinner" /> {t('form_submitting')}</>
                : t('form_submit')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
