
import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import './About.css';

const SCIENTIFIC_TEAM = [
  { name: 'Dr. Kathrin Spettel, MSc BSc', role: 'Inhaltlich verantwortlich · Wissenschaftliche Leitung', photo: '/about/kathrin.jpg' },
  { name: 'Prof. Birgit Willinger',       role: 'Wissenschaftliche Leitung',                              photo: '/about/birgit.jpg' },
  { name: 'Richard Kriz, MSc BSc',        role: 'Wissenschaftliche Betreuung',                            photo: '/about/richard.jpg' },
];

const DEVELOPERS = [
  { name: 'Cristina Postoronca',     role: 'Backend-Entwicklung',                  photo: '/about/cristina.jpg' },
  { name: 'Oyu-Erdene Khurelbaatar', role: 'Frontend-Entwicklung',                 photo: '/about/oyu-erdene.jpg' },
  { name: 'Linlin Kou',              role: 'Projektmanagment',                     photo: '/about/linlin.jpg' },
];

function PersonCard({ name, role, photo }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .replace(/^(Dr\.|Prof\.)\s*/, '')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="person-card">
      <div className="person-photo-wrap">
        {!failed ? (
          <img src={photo} alt={name} className="person-photo" onError={() => setFailed(true)} />
        ) : (
          <div className="person-initials">{initials}</div>
        )}
      </div>
      <div className="person-name">{name}</div>
      <div className="person-role">{role}</div>
    </div>
  );
}

function LogoSlot({ src, alt, fallbackLabel }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="logo-slot">
      {!failed
        ? <img src={src} alt={alt} className="logo-img" onError={() => setFailed(true)} />
        : <div className="logo-fallback">{fallbackLabel}</div>}
    </div>
  );
}

export default function About() {
  return (
    <div className="about-page">
      <Navbar />

      <div className="about-hero">
        <div className="about-hero-eyebrow">Kooperationsprojekt</div>
        <h1 className="about-hero-title">Team &amp; Impressum</h1>
        <p className="about-hero-sub">
          Das Candida auris Dashboard Österreich ist ein gemeinsames Projekt der
          Medizinischen Universität Wien und der Hochschule Campus Wien.
        </p>
      </div>

      <div className="card">
        <div className="card-title">Institutionen</div>
        <div className="logos-row">
          <LogoSlot src="/about/meduni.png" alt="Medizinische Universität Wien"
            fallbackLabel="Logo Med Uni Wien hier einfügen (public/about/logo-meduni.svg)" />
          <LogoSlot src="/about/hcw.png" alt="Hochschule Campus Wien"
            fallbackLabel="Logo HCW hier einfügen (public/about/logo-hcw.svg)" />
        </div>
      </div>

      <div className="card">
        <div className="card-title">Projektteam</div>
        <div className="person-grid">
          {SCIENTIFIC_TEAM.map((p) => <PersonCard key={p.name} {...p} />)}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Entwicklungsteam</div>
        <div className="person-grid">
          {DEVELOPERS.map((p) => <PersonCard key={p.name} {...p} />)}
        </div>
      </div>

      <div className="card impressum-card">
        <div className="card-title">Impressum</div>

        <div className="impressum-block">
          <div className="impressum-label">Herausgeber</div>
          <p className="impressum-org">
            Medizinische Universität Wien<br />
            Abteilung für Klinische Mikrobiologie<br />
            Währinger Gürtel 18–20<br />
            1090 Wien
          </p>
          <p className="impressum-org">
            Hochschule Campus Wien<br />
            Favoritenstraße 226<br />
            1100 Wien
          </p>
        </div>

        <div className="impressum-block">
          <div className="impressum-label">Inhaltlich verantwortlich</div>
          <p className="impressum-org">
            Kathrin Spettel<br />
            <a href="mailto:kathrin.spettel@hcw.ac.at">kathrin.spettel@hcw.ac.at</a>
          </p>
        </div>

        <div className="impressum-block">
          <div className="impressum-label">Zweck</div>
          <p className="impressum-text">
            Dieses Dashboard dient der wissenschaftlichen Surveillance und
            Bewusstseinsbildung zu Candidozyma auris (C.&nbsp;auris) in Österreich
            und wird als Kooperationsprojekt der MedUni Wien und der Hochschule
            Campus Wien betrieben. Es enthält keinerlei klinische
            Therapieempfehlungen oder medizinische Handlungsanweisungen.
          </p>
        </div>

        <div className="impressum-block">
          <div className="impressum-label">Urheberrecht</div>
          <p className="impressum-text">
            Alle Inhalte sind urheberrechtlich geschützt. Nutzung und Weitergabe
            nur mit ausdrücklicher Genehmigung der Herausgeber.
          </p>
        </div>

        <div className="impressum-block">
          <div className="impressum-label">Haftung</div>
          <p className="impressum-text">
            Die Inhalte dieses Dashboards dienen ausschließlich wissenschaftlichen
            und epidemiologischen Zwecken. Es werden keine Therapieempfehlungen
            oder klinischen Leitlinien bereitgestellt. Für externe verlinkte
            Inhalte übernehmen wir keine Haftung.
          </p>
        </div>
      </div>
    </div>
  );
}
