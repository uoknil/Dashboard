import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import { DATENSCHUTZ_DE, DATENSCHUTZ_EN } from '../constants/datenschutzText';
import './Datenschutz.css';

export default function Datenschutz() {
  const { i18n } = useTranslation();

  // Je nach aktiver Sprache den passenden Textblock wählen
  const content = i18n.language === 'en' ? DATENSCHUTZ_EN : DATENSCHUTZ_DE;

  return (
    <div className="datenschutz-page">
      <Navbar />

      <div className="datenschutz-card">
        <h1 className="datenschutz-title">{content.title}</h1>

        {content.sections.map((section, i) => (
          <section key={i} className="datenschutz-section">
            <h2 className="datenschutz-heading">{section.heading}</h2>
            {section.paragraphs.map((para, j) => (
              <p key={j} className="datenschutz-text">{para}</p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}