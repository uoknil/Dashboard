import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitCase } from '../services/api';
import './Meldeformular.css';
import Navbar from '../components/Navbar';
import ReCAPTCHA from "react-google-recaptcha";

// ─── Schritt-Anzeige ─────────────────────────────────────────
const STEPS = ['Fall & Lokalisation','Klinische Angaben','Therapie & Kontakt','Bestätigung'];

function StepIndicator({ current }) {
  return (
    <div className="step-indicator" role="list">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < current ? 'done' : n === current ? 'active' : 'pending';
        return (
          <React.Fragment key={n}>
            <div className="step-item" role="listitem">
              <div className={`step-circle step-${state}`}>
                {state === 'done' ? '✓' : n}
              </div>
              <div className={`step-label${state === 'active' ? ' step-label-active' : ''}`}>
                {label}
              </div>
            </div>
            {i < STEPS.length - 1 && (
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

function SelectField({ id, value, onChange, options, placeholder = '– bitte wählen –', error }) {
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
    if (!form.state)                 e.state          = 'Bitte wählen Sie ein Bundesland.';
    if (!form.city.trim())           e.city           = 'Stadt ist ein Pflichtfeld.';
    if (!form.date_of_isolation)     e.date_of_isolation = 'Datum erforderlich.';
    if (!form.isolation_site.trim()) e.isolation_site = 'Isolationsort erforderlich.';
    if (!form.travel_history.trim()) e.travel_history = 'Reiseanamnese ist Pflicht (ggf. "Keine Auslandsreise").';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validate2() {
    const e = {};
    if (!form.gender)                   e.gender         = 'Bitte wählen Sie ein Geschlecht.';
    if (!form.medical_history.trim())   e.medical_history= 'Grunderkrankung erforderlich.';
    if (form.hospitalized_abroad && !form.hospital_name.trim())
      e.hospital_name = 'Pflichtfeld wenn Auslandshospitalisierung aktiv.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validate3() {
    const e = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.reporter_email))
      e.reporter_email = 'Gültige E-Mail-Adresse erforderlich.';
    if (form.antifungal_therapy && !form.antifungal_therapy_details.trim())
      e.antifungal_therapy_details = 'Details zur antimykotischen Therapie erforderlich.';
    if (form.topical_therapy && !form.topical_therapy_details.trim())
      e.topical_therapy_details = 'Details zur topischen Therapie erforderlich.';
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
      setErrors((e) => ({ ...e, captcha: 'Bitte bestätigen Sie, dass Sie kein Roboter sind.' }));
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
      setApiError(err.status === 422 ? `Validierungsfehler: ${errorMsg}` : `Fehler: ${errorMsg}`);
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
    ['Bundesland',           form.state],
    ['Stadt',                form.city],
    ['Datum der Isolierung', form.date_of_isolation],
    ['Isolationsort',        form.isolation_site],
    ['Infektionstyp',        form.infection_type],
    ['Reiseanamnese',        form.travel_history],
    ['Geschlecht',           form.gender],
    ['Alter',                form.age || '—'],
    ['Grunderkrankung',      form.medical_history],
    ['Immunstatus',          form.immune_status],
    ['Auslandshospitalisierung', form.hospitalized_abroad ? `Ja — ${form.hospital_name}` : 'Nein'],
    ['Antimykotische Therapie',  form.antifungal_therapy ? `Ja — ${form.antifungal_therapy_details}` : 'Nein'],
    ['Topische Therapie',        form.topical_therapy ? `Ja — ${form.topical_therapy_details}` : 'Nein'],
    ['E-Mail',               form.reporter_email],
    ['Zusatzinfos',          form.additional_info || '—'],
  ];

  // ── Erfolg ───────────────────────────────────────────────────
  if (submitState === 'success') {
    return (
      <div className="form-page">
        <header className="topbar">
          <div className="topbar-title">Candida auris Dashboard · Österreich</div>
        </header>
        <div className="success-panel">
          <div className="success-icon" aria-hidden="true" />
          <h2 className="success-title">Meldung erfolgreich übermittelt</h2>
          <p className="success-sub">
            Ihre Meldung wurde per E-Mail weitergeleitet und wird nach fachlicher Prüfung übernommen.
          </p>
          {submissionId && <p className="success-id">Submission-ID: <strong>{submissionId}</strong></p>}
          <div className="success-actions">
            <button className="btn-primary" onClick={reset}>Neue Meldung erstellen</button>
            <button className="btn-secondary" onClick={() => navigate('/')}>Zurück zum Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Formular ─────────────────────────────────────────────────
  return (
    <div className="form-page">
{/*       <header className="topbar">
        <div className="topbar-title">Candida auris Dashboard · Österreich</div>
        <nav className="topbar-nav">
          <button className="nav-btn">Dashboard</button>
          <button className="nav-btn nav-btn-active">Fallmeldung</button>
          <button className="nav-btn">Informationen</button>
        </nav>
      </header> */}

      <Navbar />

      <div className="info-banner" role="note">
        <div className="info-icon">i</div>
        <div>Die Meldung wird <strong>nicht direkt gespeichert</strong> — sie wird per E-Mail
        weitergeleitet. Pflichtfelder sind mit <span className="req">*</span> markiert.</div>
      </div>

      <StepIndicator current={step} />
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${(step / 4) * 100}%` }} />
      </div>

      {/* ═══ SCHRITT 1 ═══ */}
      {step === 1 && (
        <>
          <div className="panel">
            <div className="panel-title">Angaben zum Fall <span className="panel-badge">Pflichtangaben</span></div>
            <div className="field-grid">
              <Field id="state" label="Bundesland" required error={errors.state}>
                <SelectField id="state" value={form.state} onChange={(v) => set('state', v)}
                  error={!!errors.state}
                  options={[
                    ['Vienna','Wien'],['Lower Austria','Niederösterreich'],
                    ['Upper Austria','Oberösterreich'],['Styria','Steiermark'],
                    ['Tyrol','Tirol'],['Salzburg','Salzburg'],['Carinthia','Kärnten'],
                    ['Vorarlberg','Vorarlberg'],['Burgenland','Burgenland'],
                  ]} />
                <div className="field-hint">Wird als englischer Name ans Backend gesendet</div>
              </Field>
              <Field id="city" label="Stadt / Ort" required error={errors.city}
                hint="Pflichtfeld laut Backend-Schema">
                <input id="city" type="text" value={form.city}
                  className={errors.city ? 'input-error' : ''}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="z. B. Wien, Graz, Innsbruck" />
              </Field>
              <Field id="date_of_isolation" label="Datum der Isolierung" required
                error={errors.date_of_isolation} hint='Format: "YYYY-MM-DD"'>
                <input id="date_of_isolation" type="date" value={form.date_of_isolation}
                  max={new Date().toISOString().split('T')[0]}
                  className={errors.date_of_isolation ? 'input-error' : ''}
                  onChange={(e) => set('date_of_isolation', e.target.value)} />
              </Field>
              <Field id="isolation_site" label="Isolationsort" required
                error={errors.isolation_site} hint="z. B. Blood culture, Urinary tract">
                <input id="isolation_site" type="text" value={form.isolation_site}
                  className={errors.isolation_site ? 'input-error' : ''}
                  onChange={(e) => set('isolation_site', e.target.value)}
                  placeholder="z. B. Blood culture …" />
              </Field>
              <Field id="infection_type" label="Infektionstyp" required fullWidth
                hint='"infection" | "colonization" | "unknown"'>
                <RadioGroup name="infection_type" value={form.infection_type}
                  onChange={(v) => set('infection_type', v)}
                  options={[['infection','Manifeste Infektion'],['colonization','Besiedelung'],['unknown','Unbekannt']]} />
              </Field>
            </div>
          </div>
          <div className="panel">
            <div className="panel-title">Reiseanamnese <span className="panel-badge panel-badge-required">Pflicht</span></div>
            <Field id="travel_history" label="Reiseanamnese" required error={errors.travel_history}
              hint='Wenn keine Auslandsreise: bitte "Keine Auslandsreise" eintragen.'>
              <textarea id="travel_history" rows={3} value={form.travel_history}
                className={errors.travel_history ? 'input-error' : ''}
                onChange={(e) => set('travel_history', e.target.value)}
                placeholder="z. B. Hospitalisierung in Athen, Griechenland · Keine Auslandsreise" />
            </Field>
          </div>
          <div className="btn-row">
            <span className="step-hint">Schritt 1 von 4</span>
            <button className="btn-primary" onClick={nextStep}>Weiter →</button>
          </div>
        </>
      )}

      {/* ═══ SCHRITT 2 ═══ */}
      {step === 2 && (
        <>
          <div className="panel">
            <div className="panel-title">Patientendaten <span className="panel-badge">Anonym</span></div>
            <div className="field-grid">
              <Field id="gender" label="Geschlecht" required error={errors.gender}
                hint='"male" | "female" | "divers" | "inter" | "other"'>
                <SelectField id="gender" value={form.gender} onChange={(v) => set('gender', v)}
                  error={!!errors.gender}
                  options={[['male','männlich'],['female','weiblich'],['other','divers'],['intersex','intersex / inter'],['unknown','unbekannt']]} />
              </Field>
              <Field id="age" label="Alter" hint="Optional, 1–119">
                <input id="age" type="number" value={form.age} min="1" max="119"
                  onChange={(e) => set('age', e.target.value)} placeholder="z. B. 72" />
              </Field>
              <Field id="immune_status" label="Immunstatus" fullWidth
                hint='"immunocompetent" | "immunocompromised" | "unknown"'>
                <RadioGroup name="immune_status" value={form.immune_status}
                  onChange={(v) => set('immune_status', v)}
                  options={[['immunocompetent','Immunkompetent'],['immunocompromised','Immunkompromittiert'],['unknown','Unbekannt']]} />
              </Field>
              <Field id="medical_history" label="Grunderkrankung / Aufnahmegrund" required
                error={errors.medical_history} fullWidth>
                <textarea id="medical_history" rows={2} value={form.medical_history}
                  className={errors.medical_history ? 'input-error' : ''}
                  onChange={(e) => set('medical_history', e.target.value)}
                  placeholder="z. B. Diabetes mellitus Typ 2 …" />
              </Field>
            </div>
          </div>
          <div className="panel">
            <div className="panel-title">Auslandshospitalisierung</div>
            <ToggleSection label="Im Ausland hospitalisiert? (hospitalized_abroad)"
              fieldName="hospitalized_abroad" checked={form.hospitalized_abroad} onChange={set}>
              <Field id="hospital_name" label="Krankenhaus / Land / Stadt" required
                error={errors.hospital_name} hint="Land und Stadt bevorzugt">
                <input id="hospital_name" type="text" value={form.hospital_name}
                  className={errors.hospital_name ? 'input-error' : ''}
                  onChange={(e) => set('hospital_name', e.target.value)}
                  placeholder="z. B. Hospitalisierung in Athen, Griechenland" />
              </Field>
            </ToggleSection>
          </div>
          <div className="panel">
            <div className="panel-title">MIC-Werte <span className="panel-badge">Optional</span></div>
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
            <button className="btn-secondary" onClick={() => setStep(1)}>← Zurück</button>
            <button className="btn-primary" onClick={nextStep}>Weiter →</button>
          </div>
        </>
      )}

      {/* ═══ SCHRITT 3 ═══ */}
      {step === 3 && (
        <>
          <div className="panel">
            <div className="panel-title">Antimykotische Therapie</div>
            <ToggleSection label="Aktuelle antimykotische Therapie? (antifungal_therapy)"
              fieldName="antifungal_therapy" checked={form.antifungal_therapy} onChange={set}>
              <Field id="antifungal_therapy_details" label="Welche Therapie?" required
                error={errors.antifungal_therapy_details}>
                <input id="antifungal_therapy_details" type="text"
                  value={form.antifungal_therapy_details}
                  className={errors.antifungal_therapy_details ? 'input-error' : ''}
                  onChange={(e) => set('antifungal_therapy_details', e.target.value)}
                  placeholder="z. B. Caspofungin 70 mg/d …" />
              </Field>
            </ToggleSection>
          </div>
          <div className="panel">
            <div className="panel-title">Topische Therapie</div>
            <ToggleSection label="Lokale/topische Therapie? (topical_therapy)"
              fieldName="topical_therapy" checked={form.topical_therapy} onChange={set}>
              <Field id="topical_therapy_details" label="Welche Therapie?" required
                error={errors.topical_therapy_details}>
                <input id="topical_therapy_details" type="text"
                  value={form.topical_therapy_details}
                  className={errors.topical_therapy_details ? 'input-error' : ''}
                  onChange={(e) => set('topical_therapy_details', e.target.value)}
                  placeholder="z. B. Chlorhexidin-Waschungen …" />
              </Field>
            </ToggleSection>
          </div>
          <div className="panel">
            <div className="panel-title">Kontakt</div>
            <div className="field-grid">
              <Field id="reporter_email" label="E-Mail (reporter_email)" required
                error={errors.reporter_email} hint="Nur für Rückfragen" fullWidth>
                <input id="reporter_email" type="email" value={form.reporter_email}
                  className={errors.reporter_email ? 'input-error' : ''}
                  onChange={(e) => set('reporter_email', e.target.value)}
                  placeholder="name@krankenhaus.at" />
              </Field>
              <Field id="additional_info" label="Zusatzinfos" hint="Keine Personendaten" fullWidth>
                <textarea id="additional_info" rows={3} value={form.additional_info}
                  onChange={(e) => set('additional_info', e.target.value)}
                  placeholder="Sonstige Angaben …" />
              </Field>
            </div>
          </div>
          <div className="btn-row">
            <button className="btn-secondary" onClick={() => setStep(2)}>← Zurück</button>
            <button className="btn-primary" onClick={nextStep}>Weiter →</button>
          </div>
        </>
      )}

      {/* ═══ SCHRITT 4 ═══ */}
      {step === 4 && (
        <>
          <div className="panel">
            <div className="panel-title">Zusammenfassung</div>
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
            <div className="panel-title">Sicherheitsüberprüfung</div>
            
            {/* Real Official Google reCAPTCHA widget alignment container */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
              <ReCAPTCHA
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
              <strong>Fehler:</strong> {apiError}
            </div>
          )}
          <div className="btn-row">
            <button className="btn-secondary" onClick={() => setStep(3)}>← Zurück</button>
            <button className="btn-primary" onClick={handleSubmit}
              disabled={submitState === 'loading'}>
              {submitState === 'loading'
                ? <><span className="spinner" /> Wird gesendet…</>
                : 'Meldung absenden'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}