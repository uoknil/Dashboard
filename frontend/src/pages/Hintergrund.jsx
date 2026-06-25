import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Hintergrund.css';
import Navbar from '../components/Navbar';

// ─── Statische Daten: nur Schlüssel + sprachneutrale Werte ───────────────
const KLINIK_ACCORDION = [
  { qKey: 'info_klinik_q1', aKey: 'info_klinik_a1' },
  { qKey: 'info_klinik_q2', aKey: 'info_klinik_a2' },
  { qKey: 'info_klinik_q3', aKey: 'info_klinik_a3' },
  { qKey: 'info_klinik_q4', aKey: 'info_klinik_a4' },
  { qKey: 'info_klinik_q5', aKey: 'info_klinik_a5' },
];

const TIMELINE = [
  { year: '2009', titleKey: 'info_tl_2009_t', textKey: 'info_tl_2009_x' },
  { year: '2012', titleKey: 'info_tl_2012_t', textKey: 'info_tl_2012_x' },
  { year: '2015', titleKey: 'info_tl_2015_t', textKey: 'info_tl_2015_x' },
  { year: '2017', titleKey: 'info_tl_2017_t', textKey: 'info_tl_2017_x' },
  { year: '2022', titleKey: 'info_tl_2022_t', textKey: 'info_tl_2022_x' },
  { year: '2024', titleKey: 'info_tl_2024_t', textKey: 'info_tl_2024_x' },
];

const CLADES = [
  { n: 'I',   regionKey: 'info_clade_1_r', resKey: 'info_clade_1_res', col: '#c0392b' },
  { n: 'II',  regionKey: 'info_clade_2_r', resKey: 'info_clade_2_res', col: '#e67e22' },
  { n: 'III', regionKey: 'info_clade_3_r', resKey: 'info_clade_3_res', col: '#e67e22' },
  { n: 'IV',  regionKey: 'info_clade_4_r', resKey: 'info_clade_4_res', col: '#1D9E75' },
  { n: 'V',   regionKey: 'info_clade_5_r', resKey: 'info_clade_5_res', col: '#6b7280' },
  { n: 'VI',  regionKey: 'info_clade_6_r', resKey: 'info_clade_6_res', col: '#6b7280' },
];

const PROCESS_STEPS = [
  { titleKey: 'info_proc_1_t', subKey: 'info_proc_1_s' },
  { titleKey: 'info_proc_2_t', subKey: 'info_proc_2_s' },
  { titleKey: 'info_proc_3_t', subKey: 'info_proc_3_s' },
  { titleKey: 'info_proc_4_t', subKey: 'info_proc_4_s' },
  { titleKey: 'info_proc_5_t', subKey: 'info_proc_5_s' },
  { titleKey: 'info_proc_6_t', subKey: 'info_proc_6_s' },
];

const GLOSSAR = [
  { termKey: 'info_gl_1_t', defKey: 'info_gl_1_d' },
  { termKey: 'info_gl_2_t', defKey: 'info_gl_2_d' },
  { termKey: 'info_gl_3_t', defKey: 'info_gl_3_d' },
  { termKey: 'info_gl_4_t', defKey: 'info_gl_4_d' },
  { termKey: 'info_gl_5_t', defKey: 'info_gl_5_d' },
  { termKey: 'info_gl_6_t', defKey: 'info_gl_6_d' },
  { termKey: 'info_gl_7_t', defKey: 'info_gl_7_d' },
  { termKey: 'info_gl_8_t', defKey: 'info_gl_8_d' },
  { termKey: 'info_gl_9_t', defKey: 'info_gl_9_d' },
  { termKey: 'info_gl_10_t', defKey: 'info_gl_10_d' },
];

const FAQS = [
  { qKey: 'info_faq_1_q', aKey: 'info_faq_1_a' },
  { qKey: 'info_faq_2_q', aKey: 'info_faq_2_a' },
  { qKey: 'info_faq_3_q', aKey: 'info_faq_3_a' },
  { qKey: 'info_faq_4_q', aKey: 'info_faq_4_a' },
];

// ─── Accordion-Komponente ────────────────────────────────────
function Accordion({ items }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);
  return (
    <div className="accordion">
      {items.map((item, i) => (
        <div key={i} className="acc-item">
          <button className={`acc-header${open === i ? ' open' : ''}`}
            onClick={() => setOpen(open === i ? null : i)}>
            <span>{t(item.qKey)}</span>
            <span className="acc-arrow">▾</span>
          </button>
          {open === i && <div className="acc-body">{t(item.aKey)}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── Tab-Inhalte ─────────────────────────────────────────────
function TabErreger() {
  const { t } = useTranslation();
  return (
    <>
      <div className="info-stat-row">
        <div className="info-stat-card"><div className="info-stat-val">2009</div><div className="info-stat-label">{t('info_stat_1')}</div></div>
        <div className="info-stat-card"><div className="info-stat-val">6</div><div className="info-stat-label">{t('info_stat_2')}</div></div>
        <div className="info-stat-card"><div className="info-stat-val">&gt; 60%</div><div className="info-stat-label">{t('info_stat_3')}</div></div>
      </div>
      <div className="card">
        <div className="card-title">{t('info_what_title')}</div>
        <div className="prose">
          <p>{t('info_what_p1')}</p>
          <p>{t('info_what_p2_pre')}<strong>{t('info_what_p2_strong')}</strong>{t('info_what_p2_post')}</p>
        </div>
      </div>
      <div className="card">
        <div className="card-title">{t('info_klinik_title')}</div>
        <Accordion items={KLINIK_ACCORDION} />
      </div>
    </>
  );
}

function TabEpidemio() {
  const { t } = useTranslation();
  return (
    <>
      <div className="card">
        <div className="card-title">{t('info_timeline_title')}</div>
        <div className="timeline">
          {TIMELINE.map((item, i) => (
            <div key={item.year} className="tl-item">
              <div className="tl-left">
                <div className="tl-year">{item.year}</div>
                <div className="tl-dot" />
                {i < TIMELINE.length - 1 && <div className="tl-line" />}
              </div>
              <div className="tl-body"><strong>{t(item.titleKey)}</strong>{t(item.textKey)}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-title">{t('info_clades_title')}</div>
        {CLADES.map((c) => (
          <div key={c.n} className="clade-row">
            <div className="clade-badge" style={{ background: c.col }}>{c.n}</div>
            <div className="clade-region">{t(c.regionKey)}</div>
            <div className="clade-res">{t(c.resKey)}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-title">{t('info_situation_title')}</div>
        <div className="prose">
          <p>{t('info_situation_p1')}</p>
          <p>{t('info_situation_p2_pre')}<strong>{t('info_situation_p2_strong')}</strong>{t('info_situation_p2_post')}</p>
        </div>
      </div>
    </>
  );
}

function TabMeldung({ onFormClick }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="notice">
        <strong>{t('info_who_strong')}</strong> {t('info_who_text')}
      </div>
      <div className="card">
        <div className="card-title">{t('info_process_title')}</div>
        {PROCESS_STEPS.map((s, i) => (
          <div key={i} className="process-step">
            <div className="process-num">{i + 1}</div>
            <div>
              <div className="process-title">{t(s.titleKey)}</div>
              <div className="process-sub">{t(s.subKey)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-title">{t('info_privacy_title')}</div>
        <div className="prose">
          <p>{t('info_privacy_p1_pre')}<strong>{t('info_privacy_p1_strong')}</strong>{t('info_privacy_p1_post')}</p>
          <p>{t('info_privacy_p2')}</p>
        </div>
      </div>
      <div className="cta-banner">
        <div>
          <div className="cta-title">{t('info_cta_title')}</div>
          <div className="cta-sub">{t('info_cta_sub')}</div>
        </div>
        <button className="cta-btn" onClick={onFormClick}>{t('info_cta_btn')}</button>
      </div>
    </>
  );
}

function TabGlossar() {
  const { t } = useTranslation();
  return (
    <>
      <div className="card">
        <div className="card-title">{t('info_glossar_title')}</div>
        <div className="glossar-grid">
          {GLOSSAR.map((g) => (
            <div key={g.termKey} className="glossar-item">
              <div className="glossar-term">{t(g.termKey)}</div>
              <div className="glossar-def">{t(g.defKey)}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-title">{t('info_faq_title')}</div>
        <Accordion items={FAQS} />
      </div>
    </>
  );
}

// ─── Hauptkomponente ─────────────────────────────────────────
const TABS = [
  { id: 'erreger',  labelKey: 'info_tab_erreger' },
  { id: 'epidemio', labelKey: 'info_tab_epidemio' },
  { id: 'meldung',  labelKey: 'info_tab_meldung' },
  { id: 'glossar',  labelKey: 'info_tab_glossar' },
];

export default function Hintergrund() {
  const navigate   = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('erreger');

  return (
    <div className="info-page">
      <Navbar />

      <div className="hero">
        <div className="hero-eyebrow">{t('info_hero_eyebrow')}</div>
        <h1 className="hero-title">{t('info_hero_title')}</h1>
        <p className="hero-sub">{t('info_hero_sub')}</p>
        <div className="hero-tags">
          <span className="tag tag-danger">{t('info_tag_resistance')}</span>
          <span className="tag tag-warn">{t('info_tag_nosocomial')}</span>
          <span className="tag tag-info">{t('info_tag_who')}</span>
          <span className="tag tag-success">{t('info_tag_notifiable')}</span>
        </div>
      </div>

      <div className="tab-bar" role="tablist">
        {TABS.map((tab) => (
          <button key={tab.id} role="tab" aria-selected={activeTab === tab.id}
            className={`tab-btn${activeTab === tab.id ? ' tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}>
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <main className="tab-content">
        {activeTab === 'erreger'  && <TabErreger />}
        {activeTab === 'epidemio' && <TabEpidemio />}
        {activeTab === 'meldung'  && <TabMeldung onFormClick={() => navigate('/meldung')} />}
        {activeTab === 'glossar'  && <TabGlossar />}
      </main>
    </div>
  );
}
