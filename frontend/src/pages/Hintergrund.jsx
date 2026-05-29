import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Hintergrund.css';

// ─── Statische Daten ──────────────────────────────────────────
const RESISTANCE = [
  { label: 'Fluconazol (Azole)',     pct: 90, color: '#c0392b' },
  { label: 'Voriconazol (Azole)',    pct: 75, color: '#e67e22' },
  { label: 'Amphotericin B',         pct: 35, color: '#e67e22' },
  { label: 'Echinocandine',          pct: 10, color: '#1D9E75' },
  { label: 'Pan-Resistenz (alle 3)', pct: 5,  color: '#c0392b' },
];

const KLINIK_ACCORDION = [
  { q: 'Manifestationsformen',
    a: 'Candidämie (Blutstrominfektion), Harnwegsinfektionen, Wundinfektionen sowie asymptomatische Kolonisation. Seltener Meningitis oder Endokarditis bei prädisponierten Patientengruppen.' },
  { q: 'Risikofaktoren',
    a: 'Langzeitaufenthalt auf Intensivstationen, liegende Katheter (ZVK, Harnwegskatheter), vorherige Antimykotika-Therapie, schwere Grunderkrankungen (hämatologische Malignome, Diabetes mellitus, Niereninsuffizienz), mechanische Beatmung sowie vorheriger Auslandsaufenthalt in Endemiegebieten.' },
  { q: 'Übertragungswege',
    a: 'Primär durch direkten Kontakt — Hände des Personals, kontaminierte Oberflächen und Geräte. Candida auris persistiert wochenlang auf unbelebten Oberflächen, auch gegenüber vielen Standarddesinfektionsmitteln.' },
  { q: 'Prävention & Hygienemaßnahmen',
    a: 'Konsequente Händehygiene, Kontaktisolation betroffener Patientinnen und Patienten, effektive Flächendesinfektion mit sporizid wirksamen Mitteln (z. B. Natriumhypochlorit). Alkohol-basierte Desinfektionsmittel allein sind unzureichend.' },
  { q: 'Diagnostik',
    a: 'Standardmäßige Anzuchtmethoden können C. auris fehlidentifizieren. Zur sicheren Identifikation empfehlen sich MALDI-TOF MS (mit aktueller Datenbank) oder molekulare Methoden (PCR, ITS-Sequenzierung). Resistenztestung sollte immer erfolgen.' },
];

const TIMELINE = [
  { year: '2009', title: 'Erstbeschreibung',    text: 'Isolat aus dem Gehörgang einer japanischen Patientin — erste Beschreibung durch Satoh et al.' },
  { year: '2012', title: 'Erste Häufungen',     text: 'Retrospektive Analyse zeigt frühere Fälle in Südkorea und Pakistan; erste Häufungen in Indien.' },
  { year: '2015', title: 'Europäische Ausbrüche',text: 'Aufnahme in die Überwachung durch CDC und ECDC. Erste Ausbrüche im Vereinigten Königreich.' },
  { year: '2017', title: 'WHO-Prioritätsliste', text: 'Aufnahme in die erste WHO-Liste prioritärer Pilzerreger. Nachweis auf allen bewohnten Kontinenten.' },
  { year: '2022', title: 'Critical Priority',   text: 'WHO stuft C. auris als Critical Priority Fungal Pathogen ein. Beschleunigter Anstieg post-COVID.' },
  { year: '2024', title: 'Neue Clades',         text: 'Steigende Fallzahlen in Europa. Clade V und VI neu beschrieben. Zunehmende Echinocandin-Resistenz.' },
];

const CLADES = [
  { n: 'I',   region: 'Südasien (Indien, Pakistan)', res: 'Azole (90%+)',     col: '#c0392b' },
  { n: 'II',  region: 'Ostasien',                    res: 'Amphotericin B',   col: '#e67e22' },
  { n: 'III', region: 'Afrika',                      res: 'Azole (variabel)', col: '#e67e22' },
  { n: 'IV',  region: 'Südamerika',                  res: 'Gering',           col: '#1D9E75' },
  { n: 'V',   region: 'Iran / Naher Osten',          res: 'In Abklärung',     col: '#6b7280' },
  { n: 'VI',  region: 'Neu beschrieben (2023)',       res: 'In Abklärung',     col: '#6b7280' },
];

const PROCESS_STEPS = [
  { title: 'Labordiagnostischen Nachweis sichern',
    sub: 'Identifikation mittels MALDI-TOF (aktuelle Datenbank!) oder PCR. Resistenztestung durchführen.' },
  { title: 'Online-Formular aufrufen',
    sub: 'Das Meldeformular ist öffentlich zugänglich, keine Registrierung nötig.' },
  { title: 'Daten strukturiert eingeben',
    sub: 'Angaben zu Bundesland, Stadt, Infektionstyp, Isolationsort, Reiseanamnese und Patientendaten.' },
  { title: 'Meldung absenden (CAPTCHA)',
    sub: 'Nach Bestätigung wird die Meldung per E-Mail weitergeleitet. Sie erhalten eine Eingangsbestätigung.' },
  { title: 'Fachliche Prüfung',
    sub: 'Die verantwortliche Person prüft die Angaben und klärt bei Bedarf Rückfragen.' },
  { title: 'Übernahme ins System',
    sub: 'Nach Validierung erscheinen die aggregierten Daten im öffentlichen Dashboard auf Bundeslandebene.' },
];

const GLOSSAR = [
  { term: 'Isolat',              def: 'Im Labor isolierte Probe eines Mikroorganismus für weitere Analysen.' },
  { term: 'Kolonisation',        def: 'Nachweis des Erregers ohne klinische Infektionssymptome.' },
  { term: 'Manifeste Infektion', def: 'Klinisch relevante Erkrankung durch den Erreger mit Symptomen.' },
  { term: 'Nosokomial',          def: 'Im Gesundheitsversorgungskontext erworben (Krankenhaus, Pflegeheim).' },
  { term: 'Clade',               def: 'Phylogenetische Gruppe verwandter Organismen mit gemeinsamer Herkunft.' },
  { term: 'MALDI-TOF',           def: 'Massenspektrometrisches Verfahren zur schnellen Mikroorganismenidentifikation.' },
  { term: 'Echinocandin',        def: 'Antimykotika-Klasse (Caspofungin, Micafungin) — derzeit wirksamste Option.' },
  { term: 'Aggregierte Daten',   def: 'Zusammengefasste Daten ohne personenbezogene Einzelinformationen.' },
  { term: 'MIC-Wert',            def: 'Minimale Hemmkonzentration — niedrigste Antimykotika-Dosis mit Wachstumshemmung.' },
  { term: 'Candidämie',          def: 'Pilzsepsis durch Candida-Spezies im Blut — schwerwiegende Verlaufsform.' },
];

const FAQS = [
  { q: 'Ist Candida auris für gesunde Menschen gefährlich?',
    a: 'Für gesunde Personen mit intaktem Immunsystem stellt C. auris in der Regel keine unmittelbare Gefahr dar. Schwere Infektionen betreffen primär immungeschwächte oder intensivmedizinisch betreute Patientinnen und Patienten.' },
  { q: 'Was passiert nach meiner Meldung?',
    a: 'Ihre Meldung wird per E-Mail weitergeleitet. Nach inhaltlicher Prüfung werden die Daten manuell übernommen. Im Dashboard erscheinen ausschließlich aggregierte, anonymisierte Informationen auf Bundeslandebene.' },
  { q: 'Welche Desinfektionsmittel wirken gegen C. auris?',
    a: 'C. auris ist gegenüber vielen Standarddesinfektionsmitteln tolerant. Empfohlen werden chlorhaltige Mittel (Natriumhypochlorit) und Wasserstoffperoxid-basierte Produkte. Alkohol-basierte Mittel allein sind unzureichend.' },
  { q: 'Müssen auch Kolonisationsfälle gemeldet werden?',
    a: 'Ja. Auch asymptomatische Kolonisationsfälle sollen gemeldet werden, da sie für die epidemiologische Überwachung relevant sind. Der Infektionstyp wird im Formular als "colonization" angegeben.' },
];

// ─── Accordion-Komponente ────────────────────────────────────
function Accordion({ items }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="accordion">
      {items.map((item, i) => (
        <div key={i} className="acc-item">
          <button className={`acc-header${open === i ? ' open' : ''}`}
            onClick={() => setOpen(open === i ? null : i)}>
            <span>{item.q}</span>
            <span className="acc-arrow">▾</span>
          </button>
          {open === i && <div className="acc-body">{item.a}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── Tab-Inhalte ─────────────────────────────────────────────
function TabErreger() {
  return (
    <>
      <div className="stat-row">
        <div className="stat-card"><div className="stat-val">2009</div><div className="stat-label">Erstbeschreibung in Japan</div></div>
        <div className="stat-card"><div className="stat-val">6</div><div className="stat-label">Bekannte phylogenetische Clades</div></div>
        <div className="stat-card"><div className="stat-val">&gt;60%</div><div className="stat-label">Mortalität bei invasiver Infektion</div></div>
      </div>
      <div className="card">
        <div className="card-title">Was ist Candida auris?</div>
        <div className="prose">
          <p>Candida auris ist ein Hefepilz, der 2009 erstmals aus dem Gehörgang einer japanischen Patientin isoliert wurde. Er zeichnet sich durch ausgeprägte Resistenz gegenüber mehreren Antimykotika-Klassen, hohe Persistenz auf Oberflächen sowie rasche Ausbreitung in Gesundheitseinrichtungen aus.</p>
          <p>Die WHO stufte ihn 2022 als <strong>Critical Priority Fungal Pathogen</strong> ein — die höchste Dringlichkeitsstufe.</p>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Antimykotische Resistenzraten</div>
        {RESISTANCE.map((r) => (
          <div key={r.label} className="res-row">
            <div className="res-label">{r.label}</div>
            <div className="res-track"><div className="res-fill" style={{ width: `${r.pct}%`, background: r.color }} /></div>
            <div className="res-val">{r.pct}%</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-title">Klinik, Risikofaktoren & Prävention</div>
        <Accordion items={KLINIK_ACCORDION} />
      </div>
    </>
  );
}

function TabEpidemio() {
  return (
    <>
      <div className="card">
        <div className="card-title">Globale Ausbreitung — Zeitstrahl</div>
        <div className="timeline">
          {TIMELINE.map((t, i) => (
            <div key={t.year} className="tl-item">
              <div className="tl-left">
                <div className="tl-year">{t.year}</div>
                <div className="tl-dot" />
                {i < TIMELINE.length - 1 && <div className="tl-line" />}
              </div>
              <div className="tl-body"><strong>{t.title}</strong>{t.text}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-title">Phylogenetische Clades</div>
        {CLADES.map((c) => (
          <div key={c.n} className="clade-row">
            <div className="clade-badge" style={{ background: c.col }}>{c.n}</div>
            <div className="clade-region">{c.region}</div>
            <div className="clade-res">{c.res}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-title">Situation in Österreich</div>
        <div className="prose">
          <p>In Österreich wurden erste Fälle im Zuge des europäischen Ausbruchsgeschehens erfasst. Einträge erfolgten überwiegend durch Patientinnen und Patienten mit vorangegangenem Auslandsaufenthalt in Hochprävalenzregionen — insbesondere Südasien, Naher Osten und Afrika.</p>
          <p>Dieses Dashboard erfasst aggregierte, anonymisierte Falldaten auf Bundeslandebene. Im öffentlichen Dashboard werden <strong>keine Einrichtungsbezeichnungen oder patientenbezogenen Daten</strong> veröffentlicht.</p>
        </div>
      </div>
    </>
  );
}

function TabMeldung({ onFormClick }) {
  return (
    <>
      <div className="notice">
        <strong>Wer soll melden?</strong> Alle medizinischen Einrichtungen mit labordiagnostisch bestätigtem Nachweis von Candida auris — unabhängig ob manifeste Infektion oder asymptomatische Kolonisation. Dazu zählen Krankenhäuser, Labore, Pflegeheime und Rehabilitationszentren.
      </div>
      <div className="card">
        <div className="card-title">Schritt-für-Schritt — Ablauf der Meldung</div>
        {PROCESS_STEPS.map((s, i) => (
          <div key={i} className="process-step">
            <div className="process-num">{i + 1}</div>
            <div>
              <div className="process-title">{s.title}</div>
              <div className="process-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-title">Datenschutz & Verarbeitung</div>
        <div className="prose">
          <p>Die übermittelten Daten werden <strong>nicht automatisch gespeichert</strong>. Sie werden per E-Mail weitergeleitet und erst nach inhaltlicher Prüfung manuell übernommen.</p>
          <p>Im öffentlichen Dashboard erscheinen ausschließlich aggregierte Informationen auf Bundeslandebene. Einrichtungsbezeichnungen oder patientenbezogene Daten werden nie veröffentlicht.</p>
        </div>
      </div>
      <div className="cta-banner">
        <div>
          <div className="cta-title">Einen Fall melden?</div>
          <div className="cta-sub">Das Online-Formular ist öffentlich zugänglich. Die Meldung dauert ca. 3–5 Minuten.</div>
        </div>
        <button className="cta-btn" onClick={onFormClick}>Zum Meldeformular →</button>
      </div>
    </>
  );
}

function TabGlossar() {
  return (
    <>
      <div className="card">
        <div className="card-title">Glossar — Wichtige Begriffe</div>
        <div className="glossar-grid">
          {GLOSSAR.map((g) => (
            <div key={g.term} className="glossar-item">
              <div className="glossar-term">{g.term}</div>
              <div className="glossar-def">{g.def}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-title">Häufig gestellte Fragen</div>
        <Accordion items={FAQS} />
      </div>
    </>
  );
}

// ─── Hauptkomponente ─────────────────────────────────────────
const TABS = [
  { id: 'erreger',  label: 'Erreger & Klinik' },
  { id: 'epidemio', label: 'Epidemiologie' },
  { id: 'meldung',  label: 'Meldeprozess' },
  { id: 'glossar',  label: 'Glossar & FAQ' },
];

export default function Hintergrund() {
  const navigate   = useNavigate();
  const [activeTab, setActiveTab] = useState('erreger');

  return (
    <div className="info-page">
      <header className="topbar">
        <div className="topbar-title">Candida auris Dashboard · Österreich</div>
        <nav className="topbar-nav">
          <button className="nav-btn" onClick={() => navigate('/')}>Dashboard</button>
          <button className="nav-btn" onClick={() => navigate('/meldung')}>Fallmeldung</button>
          <button className="nav-btn nav-btn-active">Informationen</button>
        </nav>
      </header>

      <div className="hero">
        <div className="hero-eyebrow">Wissenschaftliche Hintergrundinformation</div>
        <h1 className="hero-title">Candida auris in Österreich</h1>
        <p className="hero-sub">
          Ein multiresistenter Hefepilz von globaler epidemiologischer Bedeutung —
          Informationen für medizinisches Fachpersonal und die interessierte Öffentlichkeit.
        </p>
        <div className="hero-tags">
          <span className="tag tag-danger">Multiresistenz</span>
          <span className="tag tag-warn">Nosokomiale Übertragung</span>
          <span className="tag tag-info">WHO Critical Priority</span>
          <span className="tag tag-success">Meldepflichtig in AT</span>
        </div>
      </div>

      <div className="tab-bar" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={activeTab === t.id}
            className={`tab-btn${activeTab === t.id ? ' tab-active' : ''}`}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
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