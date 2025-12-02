import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en/translation.json';
import heTranslations from './locales/he/translation.json';

// Configure language detection
const languageDetector = new LanguageDetector();
languageDetector.addDetector({
  name: 'userPreference',
  lookup() {
    // Try to get from localStorage first (set by our app)
    const stored = localStorage.getItem('i18nextLng');
    if (stored) return stored;
    
    // Try to get from user profile (will be set via API)
    // This will be handled in AppRouter after user loads
    return null;
  },
  cacheUserLanguage(lng) {
    localStorage.setItem('i18nextLng', lng);
  }
});

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations
      },
      he: {
        translation: heTranslations
      }
    },
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    detection: {
      order: ['userPreference', 'localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

// Set document direction based on language
const updateDocumentDirection = (lng) => {
  const isRTL = lng === 'he';
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
};

// Update direction when language changes
i18n.on('languageChanged', (lng) => {
  updateDocumentDirection(lng);
});

// Set initial direction
updateDocumentDirection(i18n.language);

export default i18n;


