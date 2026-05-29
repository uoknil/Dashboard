import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchSubmissions, updateSubmission, approveSubmission, rejectSubmission,
  fetchCases, updateCase, deleteCase,
} from '../services/api';
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

// ─── Edit Modal ───────────────────────────────────────────────
function EditModal({ item, type, onSave, onClose }) {
  const [form, setForm] = useState({ ...item });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isSub = type === 'submission';

  function ModalField({ id, label, full, children }) {
    return (
      <div className={`modal-field${full ? ' modal-field-full' : ''}`}>
        <label htmlFor={`ef-${id}`}>{label}</label>
        {children}
      </div>
    );
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          <span>
            {isSub ? 'Meldung bearbeiten' : 'Fall bearbeiten'}
            <span className="modal-endpoint">
              {isSub ? `PATCH /api/admin/submissions/${item.id}` : `PATCH /api/admin/cases/${item.id}`}
            </span>
          </span>
          <button className="modal-close" onClick={onClose} aria-label="Schließen">×</button>
        </div>
        <div className="modal-grid">
          <ModalField id="state" label="Bundesland (Englisch)">
            <select id="ef-state" value={form.state||''} onChange={(e) => set('state',e.target.value)}>
              <option value="">– wählen –</option>
              {STATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </ModalField>
          {isSub && (
            <ModalField id="city" label="Stadt">
              <input id="ef-city" value={form.city||''} onChange={(e) => set('city',e.target.value)} />
            </ModalField>
          )}
          <ModalField id="date_of_isolation" label="Datum (YYYY-MM-DD)">
            <input id="ef-date_of_isolation" type="date" value={form.date_of_isolation||''}
              onChange={(e) => set('date_of_isolation',e.target.value)} />
          </ModalField>
          <ModalField id="isolation_site" label="Isolationsort">
            <input id="ef-isolation_site" value={form.isolation_site||''}
              onChange={(e) => set('isolation_site',e.target.value)} />
          </ModalField>
          <ModalField id="infection_type" label="Infektionstyp">
            <select id="ef-infection_type" value={form.infection_type||'unknown'}
              onChange={(e) => set('infection_type',e.target.value)}>
              {INFECTION_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </ModalField>
          <ModalField id="clade" label="Clade">
            <select id="ef-clade" value={form.clade||''}
              onChange={(e) => set('clade',e.target.value)}>
              {CLADE_OPTS.map((o) => <option key={o} value={o}>{o||'– keine –'}</option>)}
            </select>
          </ModalField>
          {isSub && (
            <>
              <ModalField id="gender" label="Geschlecht">
                <select id="ef-gender" value={form.gender||'unknown'}
                  onChange={(e) => set('gender',e.target.value)}>
                  {GENDER_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </ModalField>
              <ModalField id="age" label="Alter">
                <input id="ef-age" type="number" value={form.age||''}
                  onChange={(e) => set('age',e.target.value ? parseInt(e.target.value) : null)} />
              </ModalField>
              <ModalField id="immune_status" label="Immunstatus">
                <select id="ef-immune_status" value={form.immune_status||'unknown'}
                  onChange={(e) => set('immune_status',e.target.value)}>
                  {IMMUNE_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </ModalField>
              <ModalField id="medical_history" label="Grunderkrankung" full>
                <textarea id="ef-medical_history" rows={2} value={form.medical_history||''}
                  onChange={(e) => set('medical_history',e.target.value)} />
              </ModalField>
              <ModalField id="travel_history" label="Reiseanamnese" full>
                <textarea id="ef-travel_history" rows={2} value={form.travel_history||''}
                  onChange={(e) => set('travel_history',e.target.value)} />
              </ModalField>
              <ModalField id="hospital_name" label="Auslandshosp. (hospital_name)" full>
                <input id="ef-hospital_name" value={form.hospital_name||''}
                  onChange={(e) => set('hospital_name',e.target.value)} />
              </ModalField>
              <ModalField id="additional_info" label="Zusatzinfos" full>
                <textarea id="ef-additional_info" rows={2} value={form.additional_info||''}
                  onChange={(e) => set('additional_info',e.target.value)} />
              </ModalField>
            </>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Abbrechen</button>
          <button className="btn-primary"   onClick={() => onSave(form)}>Speichern</button>
        </div>
      </div>
    </div>
  );
}

// ─── Submission Card ──────────────────────────────────────────
function SubmissionCard({ sub, onApprove, onEdit, onReject, loading }) {
  const stateDisplay = STATE_DE[sub.state] || sub.state;
  const submittedAt  = new Date(sub.submitted_at).toLocaleString('de-AT',{
    day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'
  });
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
        {sub.clade && <span className="meta-chip">{sub.clade}</span>}
        {sub.gender && sub.gender !== 'unknown' && (
          <span className="meta-chip">{sub.gender}{sub.age ? `, ${sub.age} J.` : ''}</span>
        )}
      </div>
      <div className="sub-details">
        <div className="sub-detail-row"><span className="sub-detail-key">Reiseanamnese</span><span>{sub.travel_history||'—'}</span></div>
        {sub.hospitalized_abroad && <div className="sub-detail-row"><span className="sub-detail-key">Auslandshosp.</span><span>{sub.hospital_name||'—'}</span></div>}
        <div className="sub-detail-row"><span className="sub-detail-key">Grunderkrankung</span><span>{sub.medical_history||'—'}</span></div>
        {sub.antifungal_therapy && <div className="sub-detail-row"><span className="sub-detail-key">Antimykotika</span><span>{sub.antifungal_therapy_details||'—'}</span></div>}
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

// ─── Cases Table ──────────────────────────────────────────────
function CasesTable({ cases, onEdit, onDelete }) {
  if (!cases.length) return <div className="empty-state">Keine Fälle vorhanden.</div>;
  return (
    <div className="table-wrapper">
      <table className="cases-table">
        <thead>
          <tr>
            <th>ID</th><th>Datum</th><th>Bundesland</th>
            <th>Isolationsort</th><th>Infektionstyp</th>
            <th>Clade</th><th>Geändert von</th><th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c.id}>
              <td className="td-muted">#{c.id}</td>
              <td>{c.date_of_isolation}</td>
              <td>{STATE_DE[c.state]||c.state}</td>
              <td>{c.isolation_site}</td>
              <td><InfectionBadge type={c.infection_type} /></td>
              <td>
                {c.clade
                  ? <><span className="clade-dot" style={{background:CLADE_COLORS[c.clade]||'#888'}}/>{c.clade}</>
                  : '—'}
              </td>
              <td className="td-muted">{c.last_modified_by||'—'}</td>
              <td>
                <div className="tbl-actions">
                  <button className="tbl-btn"            onClick={() => onEdit(c)}>Bearbeiten</button>
                  <button className="tbl-btn tbl-btn-danger" onClick={() => onDelete(c.id)}>Löschen</button>
                </div>
              </td>
            </tr>
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

  // Automatischer Logout bei 401
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

  // Beim Laden: beide APIs parallel aufrufen
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
      body:  `Submission #${id} wird dauerhaft gelöscht. DELETE /api/admin/submissions/${id}`,
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
    // Nur geänderte Felder senden
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

  // ── Statistiken ───────────────────────────────────────────────
  const affectedStates = new Set(cases.map((c) => c.state)).size;
  const distinctClades = new Set(cases.filter((c) => c.clade).map((c) => c.clade)).size;

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="admin-page">

      <header className="topbar">
        <div className="topbar-title">C. auris Dashboard · Admin-Bereich</div>
        <div className="topbar-right">
          <span className="admin-user">
            Angemeldet als: <strong>{username}</strong>
          </span>
          <button className="logout-btn"
            onClick={() => { logout(); navigate('/login', { replace: true }); }}>
            Abmelden
          </button>
        </div>
      </header>

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

      {/* Submissions Tab */}
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

      {/* Cases Tab */}
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
                onDelete={handleDeleteConfirm} />}
          <div className="table-note">
            PATCH setzt automatisch last_modified_by und updated_at. Clade-Region wird automatisch berechnet.
          </div>
        </div>
      )}

      {/* Modals */}
      {editItem && (
        <EditModal item={editItem.item} type={editItem.type}
          onSave={handleSave} onClose={() => setEditItem(null)} />
      )}
      {confirm && (
        <ConfirmModal title={confirm.title} body={confirm.body}
          onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}

