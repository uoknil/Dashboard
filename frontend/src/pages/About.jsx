
import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useTranslation } from 'react-i18next';
import './About.css';

const SCIENTIFIC_TEAM = [
  { name: 'Dr. Kathrin Spettel, MSc BSc', roleKey: 'about_role_kathrin', photo: '/about/kathrin.jpg' },
  { name: 'Prof. Birgit Willinger',       roleKey: 'about_role_birgit',  photo: '/about/birgit.jpg' },
  { name: 'Richard Kriz, MSc BSc',        roleKey: 'about_role_richard', photo: '/about/richard.jpg' },
];

const DEVELOPERS = [
  { name: 'Cristina Postoronca',     roleKey: 'about_role_backend',  photo: '/about/cristina.jpg' },
  { name: 'Oyu-Erdene Khurelbaatar', roleKey: 'about_role_frontend', photo: '/about/oyu-erdene.jpg' },
  { name: 'Linlin Kou',              roleKey: 'about_role_pm',       photo: '/about/linlin.jpg' },
];

function PersonCard({ name, roleKey, photo }) {
  const { t } = useTranslation();
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
      <div className="person-role">{t(roleKey)}</div>
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
  const { t } = useTranslation();
  return (
    <div className="about-page">
      <Navbar />

      <div className="about-hero">
        <div className="about-hero-eyebrow">{t('about_eyebrow')}</div>
        <h1 className="about-hero-title">{t('about_title')}</h1>
        <p className="about-hero-sub">{t('about_sub')}</p>
      </div>

      <div className="card">
        <div className="card-title">{t('about_institutions')}</div>
        <div className="logos-row">
          <LogoSlot src="/about/meduni.png" alt="Medizinische Universität Wien"
            fallbackLabel="Logo Med Uni Wien" />
          <LogoSlot src="/about/hcw.png" alt="Hochschule Campus Wien"
            fallbackLabel="Logo HCW Wien" />
        </div>
      </div>

      <div className="card">
        <div className="card-title">{t('about_project_team')}</div>
        <div className="person-grid">
          {SCIENTIFIC_TEAM.map((p) => <PersonCard key={p.name} {...p} />)}
        </div>
      </div>

      <div className="card">
        <div className="card-title">{t('about_dev_team')}</div>
        <div className="person-grid">
          {DEVELOPERS.map((p) => <PersonCard key={p.name} {...p} />)}
        </div>
      </div>

      <div className="card impressum-card">
        <div className="card-title">{t('about_imprint')}</div>

        <div className="impressum-block">
          <div className="impressum-label">{t('about_imp_publisher')}</div>
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
          <div className="impressum-label">{t('about_imp_responsible')}</div>
          <p className="impressum-org">
            Kathrin Spettel<br />
            <a href="mailto:kathrin.spettel@hcw.ac.at">kathrin.spettel@hcw.ac.at</a>
          </p>
        </div>

        <div className="impressum-block">
          <div className="impressum-label">{t('about_imp_purpose')}</div>
          <p className="impressum-text">{t('about_imp_purpose_text')}</p>
        </div>

        <div className="impressum-block">
          <div className="impressum-label">{t('about_imp_copyright')}</div>
          <p className="impressum-text">{t('about_imp_copyright_text')}</p>
        </div>

        <div className="impressum-block">
          <div className="impressum-label">{t('about_imp_liability')}</div>
          <p className="impressum-text">{t('about_imp_liability_text')}</p>
        </div>
      </div>
    </div>
  );
}
