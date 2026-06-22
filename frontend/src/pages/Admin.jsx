import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchSubmissions, updateSubmission, approveSubmission, rejectSubmission,
  fetchCases, updateCase, deleteCase,
} from '../services/api';
import Navbar from '../components/Navbar';
// import { COUNTRY_OPTIONS } from '../constants/countries';
import './Admin.css';

// ─── Konstanten ───────────────────────────────────────────────
const STATE_DE = {
  Vienna:'Wien', 'Upper Austria':'Oberösterreich', 'Lower Austria':'Niederösterreich',
  Styria:'Steiermark', Tyrol:'Tirol', Salzburg:'Salzburg',
  Carinthia:'Kärnten', Vorarlberg:'Vorarlberg', Burgenland:'Burgenland',
};
const STATE_OPTIONS = Object.entries(STATE_DE).map(([v,l]) => ({ value:v, label:l }));
const INFECTION_OPTS = ['infection','colonization','unknown'];
const CLADE_OPTS = ['','Clade I','Clade II','Clade III','Clade IV','Clade V','Clade VI'];
const GENDER_OPTS = ['male','female','intersex','other','unknown'];
const IMMUNE_OPTS = ['immunocompetent','immunocompromised','unknown'];
const CLADE_COLORS = {
  'Clade I':'#c0392b','Clade II':'#e67e22','Clade III':'#e67e22',
  'Clade IV':'#1D9E75','Clade V':'#6b7280','Clade VI':'#6b7280',
};
// Punkt 5 — Clade-Namen
const CLADE_INFO = {
  'Clade I':   'Südasiatische Klade',
  'Clade II':  'Ostasiatische Klade',
  'Clade III': 'Afrikanische Klade',
  'Clade IV':  'Südamerikanische Klade',
  'Clade V':   'Iranische Klade',
  'Clade VI':  'Neu beschriebene Klade',
};
const MIC_KEYS = ['mic_and','mic_mic','mic_cas','mic_flc','mic_pos','mic_vor','mic_5fc','mic_amb','mic_mgx'];
const MIC_LABELS = {
  mic_and: 'Anidulafungin', mic_mic: 'Micafungin', mic_cas: 'Caspofungin',
  mic_flc: 'Fluconazol', mic_pos: 'Posaconazol', mic_vor: 'Voriconazol',
  mic_5fc: '5-Flucytosin', mic_amb: 'Amphotericin B', mic_mgx: 'Manogepix',
};

function formatBool(v) { return v ? 'Ja' : 'Nein'; }
function formatDate(v) { return v ? new Date(v).toLocaleString('de-AT') : '—'; }

// ─── Kleine Hilfskomponenten ──────────────────────────────────
function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return <div className="toast" role="status">{message}</div>;
}

function ConfirmModal({ title, body, onConfirm, onCancel }) {
  return (
    <div className="modal-bg" onClick={onCancel}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">⚠️</div>
        <div className="confirm-title">{title}</div>
        <div className="confirm-body">{body}</div>
        <div className="modal-actions centered">
          <button className="btn-secondary" onClick={onCancel}>Abbrechen</button>
          <button className="btn-danger"    onClick={onConfirm}>Bestätigen</button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-val">{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function InfectionBadge({ type }) {
  const cls = type==='infection' ? 'badge-inf' : type==='colonization' ? 'badge-col' : 'badge-unk';
  return <span className={`type-badge ${cls}`}>{type}</span>;
}

// ─── Punkt 1 — Detailansicht mit ALLEN Datenfeldern ───────────
function DetailField({ label, value }) {
  return (
    <div className="detail-field">
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value ?? '—'}</div>
    </div>
  );
}

function CaseDetailPanel({ item, type }) {
  const isSub = type === 'submission';
  const micLine = MIC_KEYS
    .filter((k) => item[k] != null)
    .map((k) => `${MIC_LABELS[k]}: ${item[k]} mg/L`)
    .join(' · ');

  return (
    <div className="detail-grid">
      <DetailField label="Alter" value={item.age} />
      <DetailField label="Geschlecht" value={item.gender} />
      <DetailField label="Immunstatus" value={item.immune_status} />
      <DetailField label="Clade-Region" value={item.clade_region} />
      <DetailField label="Grunderkrankung" value={item.medical_history} />
      <DetailField label="Reiseanamnese" value={item.travel_history} />
      <DetailField label="Auslandshospitalisierung" value={formatBool(item.hospitalized_abroad)} />
      <DetailField label="Krankenhaus / Ort" value={item.hospital_name} />
      <DetailField label="Herkunftsland (travel_country)" value={item.travel_country} />
      <DetailField label="Antimykotische Therapie" value={formatBool(item.antifungal_therapy)} />
      <DetailField label="Antimykotika-Details" value={item.antifungal_therapy_details} />
      <DetailField label="Topische Therapie" value={formatBool(item.topical_therapy)} />
      <DetailField label="Topische Details" value={item.topical_therapy_details} />
      <DetailField label="Bezug zu anderen Fällen" value={item.relation_to} />
      <DetailField label="Zusatzinfos" value={item.additional_info} />
      <DetailField label="MIC-Werte (Resistenz)" value={micLine || '—'} />
      {isSub ? (
        <>
          <DetailField label="Reporter-E-Mail" value={item.reporter_email} />
          <DetailField label="Eingegangen am" value={formatDate(item.submitted_at)} />
        </>
      ) : (
        <>
          <DetailField label="Erstellt am" value={formatDate(item.created_at)} />
          <DetailField label="Zuletzt geändert" value={formatDate(item.updated_at)} />
        </>
      )}
    </div>
  );
}

// ─── Edit Modal — zeigt jetzt ALLE editierbaren Felder ────────
function EditModal({ item, type, onSave, onClose }) {
  const [form, setForm] = useState({ ...item });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isSub = type === 'submission';

  function Field({ id, label, full, children }) {
    return (
      <div className={`modal-field${full ? ' modal-field-full' : ''}`}>
        <label htmlFor={`ef-${id}`}>{label}</label>
        {children}
      </div>
    );
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          <span>
            {isSub ? 'Meldung bearbeiten' : 'Fall bearbeiten'}
            <span className="modal-endpoint">
              {isSub ? `PATCH /api/admin/submissions/${item.id}` : `PATCH /api/admin/cases/${item.id}`}
            </span>
          </span>
          <button className="modal-close" onClick={onClose} aria-label="Schließen">×</button>
        </div>

        <div className="modal-section-label">Basisdaten</div>
        <div className="modal-grid">
          <Field id="state" label="Bundesland">
            <select id="ef-state" value={form.state || ''} onChange={(e) => set('state', e.target.value)}>
              <option value="">– wählen –</option>
              {STATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field id="city" label="Stadt">
            <input id="ef-city" value={form.city || ''} onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field id="date_of_isolation" label="Datum (YYYY-MM-DD)">
            <input id="ef-date_of_isolation" type="date" value={form.date_of_isolation || ''}
              onChange={(e) => set('date_of_isolation', e.target.value)} />
          </Field>
          <Field id="isolation_site" label="Isolationsort">
            <input id="ef-isolation_site" value={form.isolation_site || ''}
              onChange={(e) => set('isolation_site', e.target.value)} />
          </Field>
          <Field id="infection_type" label="Infektionstyp">
            <select id="ef-infection_type" value={form.infection_type || 'unknown'}
              onChange={(e) => set('infection_type', e.target.value)}>
              {INFECTION_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field id="clade" label="Clade">
            <select id="ef-clade" value={form.clade || ''} onChange={(e) => set('clade', e.target.value)}>
              {CLADE_OPTS.map((o) => (
                <option key={o} value={o}>{o ? `${o} – ${CLADE_INFO[o]}` : '– keine –'}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="modal-section-label">Klinische Angaben</div>
        <div className="modal-grid">
          <Field id="gender" label="Geschlecht">
            <select id="ef-gender" value={form.gender || 'unknown'} onChange={(e) => set('gender', e.target.value)}>
              {GENDER_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field id="age" label="Alter">
            <input id="ef-age" type="number" value={form.age ?? ''}
              onChange={(e) => set('age', e.target.value ? parseInt(e.target.value) : null)} />
          </Field>
          <Field id="immune_status" label="Immunstatus">
            <select id="ef-immune_status" value={form.immune_status || 'unknown'}
              onChange={(e) => set('immune_status', e.target.value)}>
              {IMMUNE_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field id="medical_history" label="Grunderkrankung" full>
            <textarea id="ef-medical_history" rows={2} value={form.medical_history || ''}
              onChange={(e) => set('medical_history', e.target.value)} />
          </Field>
          <Field id="travel_history" label="Reiseanamnese" full>
            <textarea id="ef-travel_history" rows={2} value={form.travel_history || ''}
              onChange={(e) => set('travel_history', e.target.value)} />
          </Field>
          <Field id="relation_to" label="Bezug zu anderen Fällen" full>
            <input id="ef-relation_to" value={form.relation_to || ''}
              onChange={(e) => set('relation_to', e.target.value)} />
          </Field>
        </div>

        <div className="modal-section-label">Hospitalisierung &amp; Therapie</div>
        <div className="modal-grid">
          <Field id="hospitalized_abroad" label="Auslandshospitalisierung">
            <select id="ef-hospitalized_abroad" value={form.hospitalized_abroad ? 'yes' : 'no'}
              onChange={(e) => set('hospitalized_abroad', e.target.value === 'yes')}>
              <option value="no">Nein</option>
              <option value="yes">Ja</option>
            </select>
          </Field>
          <Field id="hospital_name" label="Krankenhaus / Ort">
            <input id="ef-hospital_name" value={form.hospital_name || ''}
              onChange={(e) => set('hospital_name', e.target.value)} />
          </Field>
          <Field id="travel_country" label="Herkunftsland (für Weltkarte)">
            <select id="ef-travel_country" value={form.travel_country || ''}
              onChange={(e) => set('travel_country', e.target.value)}>
              <option value="">– keine Angabe –</option>
              {COUNTRY_OPTIONS.map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </Field>
          <Field id="antifungal_therapy" label="Antimykotische Therapie">
            <select id="ef-antifungal_therapy" value={form.antifungal_therapy ? 'yes' : 'no'}
              onChange={(e) => set('antifungal_therapy', e.target.value === 'yes')}>
              <option value="no">Nein</option>
              <option value="yes">Ja</option>
            </select>
          </Field>
          <Field id="antifungal_therapy_details" label="Antimykotika-Details">
            <input id="ef-antifungal_therapy_details" value={form.antifungal_therapy_details || ''}
              onChange={(e) => set('antifungal_therapy_details', e.target.value)} />
          </Field>
          <Field id="topical_therapy" label="Topische Therapie">
            <select id="ef-topical_therapy" value={form.topical_therapy ? 'yes' : 'no'}
              onChange={(e) => set('topical_therapy', e.target.value === 'yes')}>
              <option value="no">Nein</option>
              <option value="yes">Ja</option>
            </select>
          </Field>
          <Field id="topical_therapy_details" label="Topische Details">
            <input id="ef-topical_therapy_details" value={form.topical_therapy_details || ''}
              onChange={(e) => set('topical_therapy_details', e.target.value)} />
          </Field>
          <Field id="additional_info" label="Zusatzinfos" full>
            <textarea id="ef-additional_info" rows={2} value={form.additional_info || ''}
              onChange={(e) => set('additional_info', e.target.value)} />
          </Field>
        </div>

        <div className="modal-section-label">Resistenzdaten — MIC-Werte (mg/L)</div>
        <div className="modal-grid modal-grid-mic">
          {MIC_KEYS.map((k) => (
            <Field key={k} id={k} label={MIC_LABELS[k]}>
              <input id={`ef-${k}`} type="number" step="0.001" min="0" value={form[k] ?? ''}
                onChange={(e) => set(k, e.target.value === '' ? null : parseFloat(e.target.value))} />
            </Field>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Abbrechen</button>
          <button className="btn-primary" onClick={() => onSave(form)}>Speichern</button>
        </div>
      </div>
    </div>
  );
}

// ─── Submission Card — jetzt mit allen Feldern ────────────────
function SubmissionCard({ sub, onApprove, onEdit, onReject, loading }) {
  const stateDisplay = STATE_DE[sub.state] || sub.state;
  const submittedAt  = new Date(sub.submitted_at).toLocaleString('de-AT',{
    day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'
  });
  const micEntries = MIC_KEYS.filter((k) => sub[k] != null);

  return (
    <div className="sub-card">
      <div className="sub-header">
        <div className="sub-id">Submission #{sub.id}</div>
        <div className="sub-meta-row">
          <span className="sub-email">{sub.reporter_email}</span>
          <span className="sub-date">{submittedAt}</span>
        </div>
      </div>
      <div className="sub-chips">
        <span className="meta-chip">{stateDisplay}{sub.city ? `, ${sub.city}` : ''}</span>
        <span className="meta-chip meta-blue">{sub.isolation_site}</span>
        <span className={`meta-chip ${sub.infection_type==='infection'?'meta-amber':sub.infection_type==='colonization'?'meta-green':''}`}>
          {sub.infection_type}
        </span>
        {sub.clade && (
          <span className="meta-chip" title={CLADE_INFO[sub.clade] || ''}>
            {sub.clade}
          </span>
        )}
        {sub.gender && sub.gender !== 'unknown' && (
          <span className="meta-chip">{sub.gender}{sub.age ? `, ${sub.age} J.` : ''}</span>
        )}
        {sub.immune_status && sub.immune_status !== 'unknown' && (
          <span className="meta-chip meta-blue">{sub.immune_status}</span>
        )}
      </div>
      <div className="sub-details">
        <div className="sub-detail-row"><span className="sub-detail-key">Reiseanamnese</span><span>{sub.travel_history||'—'}</span></div>
        {sub.hospitalized_abroad && <div className="sub-detail-row"><span className="sub-detail-key">Auslandshosp.</span><span>{sub.hospital_name||'—'}</span></div>}
        {sub.travel_country && <div className="sub-detail-row"><span className="sub-detail-key">Herkunftsland</span><span>{sub.travel_country}</span></div>}
        <div className="sub-detail-row"><span className="sub-detail-key">Grunderkrankung</span><span>{sub.medical_history||'—'}</span></div>
        {sub.antifungal_therapy && <div className="sub-detail-row"><span className="sub-detail-key">Antimykotika</span><span>{sub.antifungal_therapy_details||'—'}</span></div>}
        {sub.topical_therapy && <div className="sub-detail-row"><span className="sub-detail-key">Topische Therapie</span><span>{sub.topical_therapy_details||'—'}</span></div>}
        {sub.relation_to && <div className="sub-detail-row"><span className="sub-detail-key">Bezug zu Fällen</span><span>{sub.relation_to}</span></div>}
        {sub.clade_region && <div className="sub-detail-row"><span className="sub-detail-key">Clade-Region</span><span>{sub.clade_region}</span></div>}
        {micEntries.length > 0 && (
          <div className="sub-detail-row">
            <span className="sub-detail-key">MIC-Werte</span>
            <span>{micEntries.map((k) => `${MIC_LABELS[k]}: ${sub[k]}`).join(' · ')}</span>
          </div>
        )}
        {sub.additional_info && <div className="sub-detail-row"><span className="sub-detail-key">Zusatzinfo</span><span>{sub.additional_info}</span></div>}
      </div>
      <div className="sub-actions">
        <button className="btn-approve" onClick={() => onApprove(sub.id)} disabled={loading}>✓ Genehmigen</button>
        <button className="btn-edit-sm" onClick={() => onEdit(sub)}>Bearbeiten</button>
        <button className="btn-reject"  onClick={() => onReject(sub.id)} disabled={loading}>✕ Ablehnen</button>
      </div>
    </div>
  );
}

// ─── Cases Table mit aufklappbarer Detailansicht ──────────────
function CasesTable({ cases, onEdit, onDelete, expandedId, onToggleExpand }) {
  if (!cases.length) return <div className="empty-state">Keine Fälle vorhanden.</div>;
  return (
    <div className="table-wrapper">
      <table className="cases-table">
        <thead>
          <tr>
            <th></th><th>ID</th><th>Datum</th><th>Bundesland</th>
            <th>Isolationsort</th><th>Infektionstyp</th>
            <th>Clade</th><th>Geändert von</th><th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <React.Fragment key={c.id}>
              <tr>
                <td>
                  <button className="expand-btn" onClick={() => onToggleExpand(c.id)}
                    aria-label="Alle Datenfelder anzeigen">
                    {expandedId === c.id ? '▾' : '▸'}
                  </button>
                </td>
                <td className="td-muted">#{c.id}</td>
                <td>{c.date_of_isolation}</td>
                <td>{STATE_DE[c.state]||c.state}</td>
                <td>{c.isolation_site}</td>
                <td><InfectionBadge type={c.infection_type} /></td>
                <td>
                  {c.clade
                    ? <span title={CLADE_INFO[c.clade] || ''}>
                        <span className="clade-dot" style={{background:CLADE_COLORS[c.clade]||'#888'}}/>
                        {c.clade}
                      </span>
                    : '—'}
                </td>
                <td className="td-muted">{c.last_modified_by||'—'}</td>
                <td>
                  <div className="tbl-actions">
                    <button className="tbl-btn" onClick={() => onEdit(c)}>Bearbeiten</button>
                    <button className="tbl-btn tbl-btn-danger" onClick={() => onDelete(c.id)}>Löschen</button>
                  </div>
                </td>
              </tr>
              {expandedId === c.id && (
                <tr className="detail-row">
                  <td colSpan="9">
                    <CaseDetailPanel item={c} type="case" />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Hauptkomponente ──────────────────────────────────────────
export default function Admin() {
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  const [submissions,    setSubmissions]    = useState([]);
  const [cases,          setCases]          = useState([]);
  const [loadingSubs,    setLoadingSubs]    = useState(true);
  const [loadingCases,   setLoadingCases]   = useState(true);
  const [actionLoading,  setActionLoading]  = useState(false);
  const [activeTab,      setActiveTab]      = useState('submissions');
  const [editItem,       setEditItem]       = useState(null);
  const [confirm,        setConfirm]        = useState(null);
  const [toast,          setToast]          = useState('');
  const [expandedId,     setExpandedId]     = useState(null);

  const handle401 = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const safeApi = useCallback(async (fn) => {
    try { return await fn(); }
    catch (err) {
      if (err.status === 401) { handle401(); return null; }
      throw err;
    }
  }, [handle401]);

  useEffect(() => {
    safeApi(async () => {
      const data = await fetchSubmissions();
      setSubmissions(data);
    }).finally(() => setLoadingSubs(false));

    safeApi(async () => {
      const data = await fetchCases();
      setCases(data);
    }).finally(() => setLoadingCases(false));
  }, [safeApi]);

  const showToast = useCallback((msg) => setToast(msg), []);

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  // ── Submissions ───────────────────────────────────────────────
  async function handleApprove(id) {
    setActionLoading(true);
    try {
      await safeApi(() => approveSubmission(id));
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      const updated = await safeApi(() => fetchCases());
      if (updated) setCases(updated);
      showToast('Meldung genehmigt und in Falldaten übernommen ✓');
    } catch { showToast('Fehler beim Genehmigen.'); }
    finally   { setActionLoading(false); }
  }

  function handleRejectConfirm(id) {
    setConfirm({
      title: 'Meldung ablehnen?',
      body:  `Submission #${id} wird dauerhaft gelöscht.`,
      onConfirm: () => doReject(id),
    });
  }

  async function doReject(id) {
    setConfirm(null);
    setActionLoading(true);
    try {
      await safeApi(() => rejectSubmission(id));
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      showToast('Meldung abgelehnt und gelöscht.');
    } catch { showToast('Fehler beim Ablehnen.'); }
    finally   { setActionLoading(false); }
  }

  // ── Cases ─────────────────────────────────────────────────────
  function handleDeleteConfirm(id) {
    setConfirm({
      title: 'Fall unwiderruflich löschen?',
      body:  `Fall #${id} wird dauerhaft aus der Datenbank entfernt. Irreversibel!`,
      onConfirm: () => doDelete(id),
    });
  }

  async function doDelete(id) {
    setConfirm(null);
    setActionLoading(true);
    try {
      await safeApi(() => deleteCase(id));
      setCases((prev) => prev.filter((c) => c.id !== id));
      showToast('Fall gelöscht.');
    } catch { showToast('Fehler beim Löschen.'); }
    finally   { setActionLoading(false); }
  }

  // ── Edit / Speichern ──────────────────────────────────────────
  async function handleSave(updatedForm) {
    const { item, type } = editItem;
    setEditItem(null);
    const patch = {};
    Object.keys(updatedForm).forEach((k) => {
      if (updatedForm[k] !== item[k]) patch[k] = updatedForm[k];
    });
    if (!Object.keys(patch).length) { showToast('Keine Änderungen erkannt.'); return; }
    try {
      if (type === 'case') {
        await safeApi(() => updateCase(item.id, patch));
        setCases((prev) => prev.map((c) =>
          c.id === item.id ? { ...c, ...patch, last_modified_by: username } : c
        ));
      } else {
        await safeApi(() => updateSubmission(item.id, patch));
        setSubmissions((prev) => prev.map((s) =>
          s.id === item.id ? { ...s, ...patch } : s
        ));
      }
      showToast('Änderungen gespeichert ✓');
    } catch { showToast('Fehler beim Speichern.'); }
  }

  const affectedStates = new Set(cases.map((c) => c.state)).size;
  const distinctClades = new Set(cases.filter((c) => c.clade).map((c) => c.clade)).size;

  return (
    <div className="admin-page">
      <Navbar />

      <div className="stats-bar">
        <StatCard value={loadingCases ? '…' : cases.length}       label="Fälle in DB" />
        <StatCard value={loadingSubs  ? '…' : submissions.length} label="Offene Meldungen" />
        <StatCard value={loadingCases ? '…' : affectedStates}     label="Bundesländer" />
        <StatCard value={loadingCases ? '…' : distinctClades}     label="Clades erfasst" />
      </div>

      <div className="admin-tabs" role="tablist">
        {[
          { id:'submissions', label:'Offene Meldungen', count: submissions.length },
          { id:'cases',       label:'Falldaten',        count: null },
        ].map((t) => (
          <button key={t.id} role="tab" aria-selected={activeTab===t.id}
            className={`admin-tab${activeTab===t.id?' active':''}`}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
            {t.count > 0 && <span className="tab-badge">{t.count}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'submissions' && (
        <div role="tabpanel">
          {loadingSubs && <div className="loading-state">Meldungen werden geladen…</div>}
          {!loadingSubs && submissions.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">✓</div>
              Keine offenen Meldungen — alle wurden geprüft.
            </div>
          )}
          {submissions.map((sub) => (
            <SubmissionCard key={sub.id} sub={sub} loading={actionLoading}
              onApprove={handleApprove}
              onEdit={(s) => setEditItem({ item:s, type:'submission' })}
              onReject={handleRejectConfirm} />
          ))}
        </div>
      )}

      {activeTab === 'cases' && (
        <div className="card" role="tabpanel">
          <div className="card-title">
            Alle Fälle
            {!loadingCases && <span className="card-count">{cases.length} Einträge</span>}
          </div>
          {loadingCases
            ? <div className="loading-state">Fälle werden geladen…</div>
            : <CasesTable cases={cases}
                onEdit={(c) => setEditItem({ item:c, type:'case' })}
                onDelete={handleDeleteConfirm}
                expandedId={expandedId}
                onToggleExpand={toggleExpand} />}
          <div className="table-note">
            ▸ anklicken zeigt alle Datenfelder dieses Falls (Alter, MIC-Werte, Therapie, etc.)
          </div>
        </div>
      )}

      {editItem && (
        <EditModal item={editItem.item} type={editItem.type}
          onSave={handleSave} onClose={() => setEditItem(null)} />
      )}
      {confirm && (
        <ConfirmModal title={confirm.title} body={confirm.body}
          onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />
      )}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
