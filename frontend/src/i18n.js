import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import de from './locales/de.json';
import en from './locales/en.json';

// Gespeicherte Sprachwahl lesen (oder Deutsch als Standard)
const savedLang = localStorage.getItem('lang') || 'de';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
    },
    lng: savedLang,
    fallbackLng: 'de',
    interpolation: {
      escapeValue: false,
    },
  });

// Bei jedem Sprachwechsel die Wahl speichern
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('lang', lng);
});

export default i18n;