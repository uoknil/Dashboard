import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  fetchSubmissions, updateSubmission, approveSubmission, rejectSubmission,
  fetchCases, updateCase, deleteCase,
  fetchUsers, createUser, toggleUser,
} from '../services/api';
import Navbar from '../components/Navbar';
import { COUNTRY_OPTIONS } from '../constants/countries';
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
// Clade-Namen → Übersetzungsschlüssel
const CLADE_INFO_KEY = {
  'Clade I':   'admin_clade_1',
  'Clade II':  'admin_clade_2',
  'Clade III': 'admin_clade_3',
  'Clade IV':  'admin_clade_4',
  'Clade V':   'admin_clade_5',
  'Clade VI':  'admin_clade_6',
};
const MIC_KEYS = ['mic_and','mic_mic','mic_cas','mic_flc','mic_pos','mic_vor','mic_5fc','mic_amb','mic_mgx'];
const MIC_LABELS = {
  mic_and: 'Anidulafungin', mic_mic: 'Micafungin', mic_cas: 'Caspofungin',
  mic_flc: 'Fluconazol', mic_pos: 'Posaconazol', mic_vor: 'Voriconazol',
  mic_5fc: '5-Flucytosin', mic_amb: 'Amphotericin B', mic_mgx: 'Manogepix',
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
  const { t } = useTranslation();
  return (
    <div className="modal-bg" onClick={onCancel}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">⚠️</div>
        <div className="confirm-title">{title}</div>
        <div className="confirm-body">{body}</div>
        <div className="modal-actions centered">
          <button className="btn-secondary" onClick={onCancel}>{t('admin_cancel')}</button>
          <button className="btn-danger"    onClick={onConfirm}>{t('admin_confirm')}</button>
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

// ─── Detailansicht mit ALLEN Datenfeldern ───────────
function DetailField({ label, value }) {
  return (
    <div className="detail-field">
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value ?? '—'}</div>
    </div>
  );
}

function CaseDetailPanel({ item, type }) {
  const { t } = useTranslation();
  const isSub = type === 'submission';
  const micLine = MIC_KEYS
    .filter((k) => item[k] != null)
    .map((k) => `${MIC_LABELS[k]}: ${item[k]} mg/L`)
    .join(' · ');

  const fmtBool = (v) => v ? t('admin_yes') : t('admin_no');
  const fmtDate = (v) => v ? new Date(v).toLocaleString('de-AT') : '—';

  return (
    <div className="detail-grid">
      <DetailField label={t('admin_d_age')} value={item.age} />
      <DetailField label={t('admin_d_gender')} value={item.gender} />
      <DetailField label={t('admin_d_immune')} value={item.immune_status} />
      <DetailField label={t('admin_d_clade_region')} value={item.clade_region} />
      <DetailField label={t('admin_d_medical')} value={item.medical_history} />
      <DetailField label={t('admin_d_travel')} value={item.travel_history} />
      <DetailField label={t('admin_d_abroad')} value={fmtBool(item.hospitalized_abroad)} />
      <DetailField label={t('admin_d_hospital')} value={item.hospital_name} />
      <DetailField label={t('admin_d_origin')} value={item.origin_country} />
      <DetailField label={t('admin_d_antifungal')} value={fmtBool(item.antifungal_therapy)} />
      <DetailField label={t('admin_d_antifungal_det')} value={item.antifungal_therapy_details} />
      <DetailField label={t('admin_d_topical')} value={fmtBool(item.topical_therapy)} />
      <DetailField label={t('admin_d_topical_det')} value={item.topical_therapy_details} />
      <DetailField label={t('admin_d_relation')} value={item.relation_to} />
      <DetailField label={t('admin_d_additional')} value={item.additional_info} />
      <DetailField label={t('admin_d_mic')} value={micLine || '—'} />
      {isSub ? (
        <>
          <DetailField label={t('admin_d_reporter')} value={item.reporter_email} />
          <DetailField label={t('admin_d_received')} value={fmtDate(item.submitted_at)} />
        </>
      ) : (
        <>
          <DetailField label={t('admin_d_created')} value={fmtDate(item.created_at)} />
          <DetailField label={t('admin_d_modified')} value={fmtDate(item.updated_at)} />
        </>
      )}
    </div>
  );
}

// Feld-Wrapper fürs Edit-Modal
function ModalField({ id, label, full, children }) {
  return (
    <div className={`modal-field${full ? ' modal-field-full' : ''}`}>
      <label htmlFor={`ef-${id}`}>{label}</label>
      {children}
    </div>
  );
}

// ─── Edit Modal ────────
function EditModal({ item, type, onSave, onClose }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ ...item });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isSub = type === 'submission';

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          <span>
            {isSub ? t('admin_edit_sub') : t('admin_edit_case')}
            <span className="modal-endpoint">
              {isSub ? `PATCH /api/admin/submissions/${item.id}` : `PATCH /api/admin/cases/${item.id}`}
            </span>
          </span>
          <button className="modal-close" onClick={onClose} aria-label={t('admin_close')}>×</button>
        </div>

        <div className="modal-section-label">{t('admin_sec_basic')}</div>
        <div className="modal-grid">
          <ModalField id="state" label={t('admin_f_state')}>
            <select id="ef-state" value={form.state || ''} onChange={(e) => set('state', e.target.value)}>
              <option value="">{t('admin_select_empty')}</option>
              {STATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </ModalField>
          <ModalField id="city" label={t('admin_f_city')}>
            <input id="ef-city" value={form.city || ''} onChange={(e) => set('city', e.target.value)} />
          </ModalField>
          <ModalField id="date_of_isolation" label={t('admin_f_date')}>
            <input id="ef-date_of_isolation" type="date" value={form.date_of_isolation || ''}
              onChange={(e) => set('date_of_isolation', e.target.value)} />
          </ModalField>
          <ModalField id="isolation_site" label={t('admin_f_site')}>
            <input id="ef-isolation_site" value={form.isolation_site || ''}
              onChange={(e) => set('isolation_site', e.target.value)} />
          </ModalField>
          <ModalField id="infection_type" label={t('admin_f_inftype')}>
            <select id="ef-infection_type" value={form.infection_type || 'unknown'}
              onChange={(e) => set('infection_type', e.target.value)}>
              {INFECTION_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </ModalField>
          <ModalField id="clade" label={t('admin_f_clade')}>
            <select id="ef-clade" value={form.clade || ''} onChange={(e) => set('clade', e.target.value)}>
              {CLADE_OPTS.map((o) => (
                <option key={o} value={o}>{o ? `${o} – ${t(CLADE_INFO_KEY[o])}` : t('admin_clade_none')}</option>
              ))}
            </select>
          </ModalField>
        </div>

        <div className="modal-section-label">{t('admin_sec_clinical')}</div>
        <div className="modal-grid">
          <ModalField id="gender" label={t('admin_f_gender')}>
            <select id="ef-gender" value={form.gender || 'unknown'} onChange={(e) => set('gender', e.target.value)}>
              {GENDER_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </ModalField>
          <ModalField id="age" label={t('admin_f_age')}>
            <input id="ef-age" type="number" value={form.age ?? ''}
              onChange={(e) => set('age', e.target.value ? parseInt(e.target.value) : null)} />
          </ModalField>
          <ModalField id="immune_status" label={t('admin_f_immune')}>
            <select id="ef-immune_status" value={form.immune_status || 'unknown'}
              onChange={(e) => set('immune_status', e.target.value)}>
              {IMMUNE_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </ModalField>
          <ModalField id="medical_history" label={t('admin_f_medical')} full>
            <textarea id="ef-medical_history" rows={2} value={form.medical_history || ''}
              onChange={(e) => set('medical_history', e.target.value)} />
          </ModalField>
          <ModalField id="travel_history" label={t('admin_f_travel')} full>
            <textarea id="ef-travel_history" rows={2} value={form.travel_history || ''}
              onChange={(e) => set('travel_history', e.target.value)} />
          </ModalField>
          <ModalField id="relation_to" label={t('admin_f_relation')} full>
            <input id="ef-relation_to" value={form.relation_to || ''}
              onChange={(e) => set('relation_to', e.target.value)} />
          </ModalField>
        </div>

        <div className="modal-section-label">{t('admin_sec_hosp')}</div>
        <div className="modal-grid">
          <ModalField id="hospitalized_abroad" label={t('admin_f_abroad')}>
            <select id="ef-hospitalized_abroad" value={form.hospitalized_abroad ? 'yes' : 'no'}
              onChange={(e) => set('hospitalized_abroad', e.target.value === 'yes')}>
              <option value="no">{t('admin_no')}</option>
              <option value="yes">{t('admin_yes')}</option>
            </select>
          </ModalField>
          <ModalField id="hospital_name" label={t('admin_f_hospital')}>
            <input id="ef-hospital_name" value={form.hospital_name || ''}
              onChange={(e) => set('hospital_name', e.target.value)} />
          </ModalField>
          <ModalField id="origin_country" label={t('admin_f_origin')}>
            <select id="ef-origin_country" value={form.origin_country || ''}
              onChange={(e) => set('origin_country', e.target.value)}>
              <option value="">{t('admin_origin_none')}</option>
              {COUNTRY_OPTIONS.map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </ModalField>
          <ModalField id="antifungal_therapy" label={t('admin_f_antifungal')}>
            <select id="ef-antifungal_therapy" value={form.antifungal_therapy ? 'yes' : 'no'}
              onChange={(e) => set('antifungal_therapy', e.target.value === 'yes')}>
              <option value="no">{t('admin_no')}</option>
              <option value="yes">{t('admin_yes')}</option>
            </select>
          </ModalField>
          <ModalField id="antifungal_therapy_details" label={t('admin_f_antifungal_det')}>
            <input id="ef-antifungal_therapy_details" value={form.antifungal_therapy_details || ''}
              onChange={(e) => set('antifungal_therapy_details', e.target.value)} />
          </ModalField>
          <ModalField id="topical_therapy" label={t('admin_f_topical')}>
            <select id="ef-topical_therapy" value={form.topical_therapy ? 'yes' : 'no'}
              onChange={(e) => set('topical_therapy', e.target.value === 'yes')}>
              <option value="no">{t('admin_no')}</option>
              <option value="yes">{t('admin_yes')}</option>
            </select>
          </ModalField>
          <ModalField id="topical_therapy_details" label={t('admin_f_topical_det')}>
            <input id="ef-topical_therapy_details" value={form.topical_therapy_details || ''}
              onChange={(e) => set('topical_therapy_details', e.target.value)} />
          </ModalField>
          <ModalField id="additional_info" label={t('admin_f_additional')} full>
            <textarea id="ef-additional_info" rows={2} value={form.additional_info || ''}
              onChange={(e) => set('additional_info', e.target.value)} />
          </ModalField>
        </div>

        <div className="modal-section-label">{t('admin_sec_mic')}</div>
        <div className="modal-grid modal-grid-mic">
          {MIC_KEYS.map((k) => (
            <ModalField key={k} id={k} label={MIC_LABELS[k]}>
              <input id={`ef-${k}`} type="number" step="0.001" min="0" value={form[k] ?? ''}
                onChange={(e) => set(k, e.target.value === '' ? null : parseFloat(e.target.value))} />
            </ModalField>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>{t('admin_cancel')}</button>
          <button className="btn-primary" onClick={() => onSave(form)}>{t('admin_save')}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Submission Card ────────────────
function SubmissionCard({ sub, onApprove, onEdit, onReject, loading }) {
  const { t } = useTranslation();
  const stateDisplay = STATE_DE[sub.state] || sub.state;
  const submittedAt  = new Date(sub.submitted_at).toLocaleString('de-AT',{
    day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'
  });
  const micEntries = MIC_KEYS.filter((k) => sub[k] != null);

  return (
    <div className="sub-card">
      <div className="sub-header">
        <div className="sub-id">{t('admin_submission_n', { id: sub.id })}</div>
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
          <span className="meta-chip" title={t(CLADE_INFO_KEY[sub.clade]) || ''}>
            {sub.clade}
          </span>
        )}
        {sub.gender && sub.gender !== 'unknown' && (
          <span className="meta-chip">{sub.gender}{sub.age ? `, ${sub.age} ${t('admin_years')}` : ''}</span>
        )}
        {sub.immune_status && sub.immune_status !== 'unknown' && (
          <span className="meta-chip meta-blue">{sub.immune_status}</span>
        )}
      </div>
      <div className="sub-details">
        <div className="sub-detail-row"><span className="sub-detail-key">{t('admin_d_travel')}</span><span>{sub.travel_history||'—'}</span></div>
        {sub.hospitalized_abroad && <div className="sub-detail-row"><span className="sub-detail-key">{t('admin_chip_abroad')}</span><span>{sub.hospital_name||'—'}</span></div>}
        {sub.origin_country && <div className="sub-detail-row"><span className="sub-detail-key">{t('admin_chip_origin')}</span><span>{sub.origin_country}</span></div>}
        <div className="sub-detail-row"><span className="sub-detail-key">{t('admin_d_medical')}</span><span>{sub.medical_history||'—'}</span></div>
        {sub.antifungal_therapy && <div className="sub-detail-row"><span className="sub-detail-key">{t('admin_chip_antifungal')}</span><span>{sub.antifungal_therapy_details||'—'}</span></div>}
        {sub.topical_therapy && <div className="sub-detail-row"><span className="sub-detail-key">{t('admin_chip_topical')}</span><span>{sub.topical_therapy_details||'—'}</span></div>}
        {sub.relation_to && <div className="sub-detail-row"><span className="sub-detail-key">{t('admin_chip_relation')}</span><span>{sub.relation_to}</span></div>}
        {sub.clade_region && <div className="sub-detail-row"><span className="sub-detail-key">{t('admin_d_clade_region')}</span><span>{sub.clade_region}</span></div>}
        {micEntries.length > 0 && (
          <div className="sub-detail-row">
            <span className="sub-detail-key">{t('admin_chip_mic')}</span>
            <span>{micEntries.map((k) => `${MIC_LABELS[k]}: ${sub[k]}`).join(' · ')}</span>
          </div>
        )}
        {sub.additional_info && <div className="sub-detail-row"><span className="sub-detail-key">{t('admin_chip_additional')}</span><span>{sub.additional_info}</span></div>}
      </div>
      <div className="sub-actions">
        <button className="btn-approve" onClick={() => onApprove(sub.id)} disabled={loading}>{t('admin_approve')}</button>
        <button className="btn-edit-sm" onClick={() => onEdit(sub)}>{t('admin_edit')}</button>
        <button className="btn-reject"  onClick={() => onReject(sub.id)} disabled={loading}>{t('admin_reject')}</button>
      </div>
    </div>
  );
}

// ─── Cases Table ──────────────
function CasesTable({ cases, onEdit, onDelete, expandedId, onToggleExpand }) {
  const { t } = useTranslation();
  if (!cases.length) return <div className="empty-state">{t('admin_no_cases')}</div>;
  return (
    <div className="table-wrapper">
      <table className="cases-table">
        <thead>
          <tr>
            <th></th><th>{t('admin_th_id')}</th><th>{t('admin_th_date')}</th><th>{t('admin_th_state')}</th>
            <th>{t('admin_th_site')}</th><th>{t('admin_th_inftype')}</th>
            <th>{t('admin_th_clade')}</th><th>{t('admin_th_modified_by')}</th><th>{t('admin_th_actions')}</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <React.Fragment key={c.id}>
              <tr>
                <td>
                  <button className="expand-btn" onClick={() => onToggleExpand(c.id)}
                    aria-label={t('admin_show_all_fields')}>
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
                    ? <span title={t(CLADE_INFO_KEY[c.clade]) || ''}>
                        <span className="clade-dot" style={{background:CLADE_COLORS[c.clade]||'#888'}}/>
                        {c.clade}
                      </span>
                    : '—'}
                </td>
                <td className="td-muted">{c.last_modified_by||'—'}</td>
                <td>
                  <div className="tbl-actions">
                    <button className="tbl-btn" onClick={() => onEdit(c)}>{t('admin_edit')}</button>
                    <button className="tbl-btn tbl-btn-danger" onClick={() => onDelete(c.id)}>{t('admin_delete')}</button>
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

// ─── Benutzerverwaltung ───────────────────────
function UserManagement({ currentUsername, safeApi, showToast }) {
  const { t } = useTranslation();
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [newName,    setNewName]    = useState('');
  const [newPass,    setNewPass]    = useState('');
  const [formError,  setFormError]  = useState('');
  const [busy,       setBusy]       = useState(false);

  useEffect(() => {
    safeApi(async () => {
      const data = await fetchUsers();
      if (data) setUsers(data);
    }).finally(() => setLoading(false));
  }, [safeApi]);

  async function handleToggle(user) {
    setBusy(true);
    try {
      const updated = await safeApi(() => toggleUser(user.id, !user.is_active));
      if (updated) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
        showToast(t('admin_toast_account_status', {
          name: user.username,
          status: updated.is_active ? t('admin_active') : t('admin_inactive'),
        }));
      }
    } catch (err) {
      showToast(err.status === 400 ? t('admin_err_self_deactivate') : t('admin_err_account_change'));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    setFormError('');
    if (newName.trim().length < 3) { setFormError(t('admin_err_username_short')); return; }
    if (newPass.length < 6)        { setFormError(t('admin_err_password_short')); return; }

    setBusy(true);
    try {
      const created = await safeApi(() => createUser(newName.trim(), newPass));
      if (created) {
        setUsers((prev) => [...prev, created]);
        setNewName('');
        setNewPass('');
        showToast(t('admin_toast_account_created', { name: created.username }));
      }
    } catch (err) {
      setFormError(err.status === 400 ? t('admin_err_username_taken') : t('admin_err_account_create'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div role="tabpanel">
      <div className="card">
        <div className="card-title">{t('admin_new_account_title')}</div>
        <div className="modal-grid">
          <div className="modal-field">
            <label htmlFor="nu-username">{t('admin_username')}</label>
            <input id="nu-username" value={newName}
              onChange={(e) => { setNewName(e.target.value); setFormError(''); }}
              placeholder={t('admin_username_ph')} autoComplete="off" />
          </div>
          <div className="modal-field">
            <label htmlFor="nu-password">{t('admin_password')}</label>
            <input id="nu-password" type="password" value={newPass}
              onChange={(e) => { setNewPass(e.target.value); setFormError(''); }}
              placeholder={t('admin_password_ph')} autoComplete="new-password" />
          </div>
        </div>
        {formError && <div className="login-err-msg" style={{ marginTop: 8 }}>{formError}</div>}
        <div className="modal-actions">
          <button className="btn-primary" onClick={handleCreate} disabled={busy}>
            {t('admin_create_account')}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          {t('admin_existing_accounts')}
          {!loading && <span className="card-count">{t('admin_accounts_count', { count: users.length })}</span>}
        </div>
        {loading ? (
          <div className="loading-state">{t('admin_loading_accounts')}</div>
        ) : users.length === 0 ? (
          <div className="empty-state">{t('admin_no_accounts')}</div>
        ) : (
          <div className="table-wrapper">
            <table className="cases-table">
              <thead>
                <tr>
                  <th>{t('admin_th_id')}</th><th>{t('admin_username')}</th><th>{t('admin_th_status')}</th><th>{t('admin_th_action')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="td-muted">#{u.id}</td>
                    <td>
                      {u.username}
                      {u.username === currentUsername && (
                        <span className="meta-chip meta-blue" style={{ marginLeft: 8 }}>{t('admin_you')}</span>
                      )}
                    </td>
                    <td>
                      <span className={`type-badge ${u.is_active ? 'badge-col' : 'badge-unk'}`}>
                        {u.is_active ? t('admin_active') : t('admin_inactive')}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`tbl-btn${u.is_active ? ' tbl-btn-danger' : ''}`}
                        onClick={() => handleToggle(u)}
                        disabled={busy || u.username === currentUsername}
                        title={u.username === currentUsername ? t('admin_cannot_deactivate_self') : ''}
                      >
                        {u.is_active ? t('admin_deactivate') : t('admin_activate')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Hauptkomponente ──────────────────────────────────────────
export default function Admin() {
  const { t } = useTranslation();
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
      showToast(t('admin_toast_approved'));
    } catch { showToast(t('admin_err_approve')); }
    finally   { setActionLoading(false); }
  }

  function handleRejectConfirm(id) {
    setConfirm({
      title: t('admin_reject_title'),
      body:  t('admin_reject_body', { id }),
      onConfirm: () => doReject(id),
    });
  }

  async function doReject(id) {
    setConfirm(null);
    setActionLoading(true);
    try {
      await safeApi(() => rejectSubmission(id));
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      showToast(t('admin_toast_rejected'));
    } catch { showToast(t('admin_err_reject')); }
    finally   { setActionLoading(false); }
  }

  // ── Cases ─────────────────────────────────────────────────────
  function handleDeleteConfirm(id) {
    setConfirm({
      title: t('admin_delete_title'),
      body:  t('admin_delete_body', { id }),
      onConfirm: () => doDelete(id),
    });
  }

  async function doDelete(id) {
    setConfirm(null);
    setActionLoading(true);
    try {
      await safeApi(() => deleteCase(id));
      setCases((prev) => prev.filter((c) => c.id !== id));
      showToast(t('admin_toast_deleted'));
    } catch { showToast(t('admin_err_delete')); }
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
    if (!Object.keys(patch).length) { showToast(t('admin_no_changes')); return; }
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
      showToast(t('admin_toast_saved'));
    } catch { showToast(t('admin_err_save')); }
  }

  const affectedStates = new Set(cases.map((c) => c.state)).size;
  const distinctClades = new Set(cases.filter((c) => c.clade).map((c) => c.clade)).size;

  return (
    <div className="admin-page">
      <Navbar />

      <div className="stats-bar">
        <StatCard value={loadingCases ? '…' : cases.length}       label={t('admin_stat_cases')} />
        <StatCard value={loadingSubs  ? '…' : submissions.length} label={t('admin_stat_open')} />
        <StatCard value={loadingCases ? '…' : affectedStates}     label={t('admin_stat_states')} />
        <StatCard value={loadingCases ? '…' : distinctClades}     label={t('admin_stat_clades')} />
      </div>

      <div className="admin-tabs" role="tablist">
        {[
          { id:'submissions', label: t('admin_tab_open'),  count: submissions.length },
          { id:'cases',       label: t('admin_tab_cases'), count: null },
          { id:'users',       label: t('admin_tab_users'), count: null },
        ].map((tab) => (
          <button key={tab.id} role="tab" aria-selected={activeTab===tab.id}
            className={`admin-tab${activeTab===tab.id?' active':''}`}
            onClick={() => setActiveTab(tab.id)}>
            {tab.label}
            {tab.count > 0 && <span className="tab-badge">{tab.count}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'submissions' && (
        <div role="tabpanel">
          {loadingSubs && <div className="loading-state">{t('admin_loading_subs')}</div>}
          {!loadingSubs && submissions.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">✓</div>
              {t('admin_no_open_subs')}
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
            {t('admin_all_cases')}
            {!loadingCases && <span className="card-count">{t('admin_entries_count', { count: cases.length })}</span>}
          </div>
          {loadingCases
            ? <div className="loading-state">{t('admin_loading_cases')}</div>
            : <CasesTable cases={cases}
                onEdit={(c) => setEditItem({ item:c, type:'case' })}
                onDelete={handleDeleteConfirm}
                expandedId={expandedId}
                onToggleExpand={toggleExpand} />}
          <div className="table-note">{t('admin_table_note')}</div>
        </div>
      )}

      {activeTab === 'users' && (
        <UserManagement
          currentUsername={username}
          safeApi={safeApi}
          showToast={showToast}
        />
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

