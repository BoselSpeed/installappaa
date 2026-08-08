import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ar from './ar.json';
import en from './en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: {
        translation: ar
      },
      en: {
        translation: en
      }
    },
    fallbackLng: 'ar', // Default to Arabic as requested
    debug: false,
    interpolation: {
      escapeValue: false // React already safes from xss
    },
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: 'language',
      caches: ['localStorage']
    }
  });

export default i18n;
