import i18n from 'i18next';
import ICU from 'i18next-icu';
import { initReactI18next } from 'react-i18next';
import { normalizeStoredLanguage } from '@/utils/languageUtils';
import en from './locales/en.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import th from './locales/th.json';

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('language') : null;

i18n
  .use(ICU)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
      ja: { translation: ja },
      th: { translation: th }
    },
    lng: normalizeStoredLanguage(stored || 'en'),
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh', 'ja', 'th'],
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
