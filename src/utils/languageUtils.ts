/**
 * Utility functions for language-aware API calls
 */

/**
 * Get current language from localStorage or default to 'en'
 */
export const getCurrentLanguage = (): string => {
  return localStorage.getItem('language') || 'en';
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
  
  // Add language parameter
  const currentLang = params.lang || getCurrentLanguage();
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