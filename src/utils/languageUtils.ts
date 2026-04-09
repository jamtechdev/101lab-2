/**
 * Utility functions for language-aware API calls
 */

/**
 * Get current language from localStorage or default to 'en'
 */
export const getCurrentLanguage = (): string => {
  return localStorage.getItem('language') || 'en';
};

/** Canonical bundle keys: en | zh | ja | th */
export const normalizeStoredLanguage = (code: string | null | undefined): string => {
  if (!code) return 'en';
  const c = code.toLowerCase();
  if (c.startsWith('zh')) return 'zh';
  if (c === 'ja' || c.startsWith('ja')) return 'ja';
  if (c === 'th' || c.startsWith('th')) return 'th';
  if (c === 'en' || c.startsWith('en')) return 'en';
  return 'en';
};

/**
 * Map i18n language (e.g. zh, zh-TW) to UI category translation key used by categoryTranslations.ts
 */
export const toUiCategoryLang = (i18nLanguage: string): 'en' | 'zh' => {
  if (!i18nLanguage) return 'en';
  return i18nLanguage.toLowerCase().startsWith('zh') ? 'zh' : 'en';
};

/**
 * Language codes for backend / WPML (categories-summary, batch/fetch, product-labs).
 * WPML in this project uses zh-hant for Traditional Chinese category terms.
 */
export const toBackendContentLang = (i18nLanguage: string): string => {
  if (!i18nLanguage) return 'en';
  const l = i18nLanguage.toLowerCase();
  if (l.startsWith('zh')) return 'zh-hant';
  if (l.startsWith('ja')) return 'ja';
  if (l.startsWith('th')) return 'th';
  return 'en';
};

/**
 * Build category API URL with language parameter
 */
export const buildCategoryUrl = (lang?: string): string => {
  const currentLang = lang || getCurrentLanguage();
  return `/product/category?lang=${currentLang}`;
};

/**
 * Build category summary API URL with language and other parameters
 */
export const buildCategorySummaryUrl = (params: {
  type: string;
  status?: string;
  highlighted?: boolean;
  sort?: string;
  lang?: string;
}): string => {
  const queryParams = new URLSearchParams();
  queryParams.append('type', params.type);
  
  if (params.status) queryParams.append('status', params.status);
  if (params.highlighted) queryParams.append('highlighted', 'true');
  if (params.sort) queryParams.append('sort', params.sort);
  
  // Add language parameter (WPML expects e.g. zh-hant for Chinese)
  const currentLang = toBackendContentLang(params.lang || getCurrentLanguage());
  queryParams.append('lang', currentLang);
  
  return `/batch/categories-summary?${queryParams.toString()}`;
};

/**
 * Supported languages configuration
 */
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  zh: '中文',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

/**
 * Check if a language is supported
 */
export const isSupportedLanguage = (lang: string): lang is SupportedLanguage => {
  return lang in SUPPORTED_LANGUAGES;
};

/**
 * Get language display name
 */
export const getLanguageDisplayName = (lang: string): string => {
  return isSupportedLanguage(lang) ? SUPPORTED_LANGUAGES[lang] : lang;
};