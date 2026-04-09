import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Detects language of text (simple heuristic: Chinese characters vs others)
 * Returns 'zh' if >30% Chinese characters, otherwise 'en'
 */
function detectLanguage(text: string): 'zh' | 'en' {
  if (!text || typeof text !== 'string') return 'en';
  const chineseRegex = /[\u4E00-\u9FFF]/g;
  const chineseChars = (text.match(chineseRegex) || []).length;
  // If more than 30% of characters are Chinese, consider it Chinese
  return chineseChars > text.length * 0.3 ? 'zh' : 'en';
}

/**
 * Smart post-processing fixes for common translation mistakes
 * Handles context-less translation issues
 */
function fixCommonTranslationIssues(_original: string, translated: string, targetLang: string): string {
  if (targetLang !== 'zh-TW') return translated;

  // Fix common machinery/equipment translations
  const fixes: Record<string, string> = {
    '裝滿': '灌裝', // "filling" mistranslation
    '機器滿': '灌裝機', // variant
    '充滿': '灌裝', // another variant
  };

  let result = translated;
  for (const [wrong, correct] of Object.entries(fixes)) {
    if (result.includes(wrong)) {
      result = result.replace(wrong, correct);
    }
  }

  return result;
}

/**
 * Translates text using MyMemory API (free, no key needed)
 * Maps i18next language codes to MyMemory language codes
 */
async function translateText(text: string, from: string, to: string): Promise<string> {
  if (!text || from === to) return text;

  // Map i18next language codes to MyMemory API language codes
  const langMap: Record<string, string> = {
    'zh': 'zh-TW',  // Map 'zh' to Traditional Chinese (zh-TW)
    'en': 'en',
  };

  const fromLang = langMap[from] || from;
  const toLang = langMap[to] || to;

  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`
    );
    const data = await response.json();
    let translated = data?.responseData?.translatedText || text;

    // Apply smart fixes for common translation issues
    translated = fixCommonTranslationIssues(text, translated, toLang);

    return translated;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

interface UseAutoTranslateResult {
  translatedTitle: string;
  translatedDescription: string;
  isLoading: boolean;
}

/**
 * Hook to auto-translate product title & description based on viewer's language
 * - Detects source language from title
 * - If viewer's language differs, translates both title and description
 * - Caches results in localStorage
 */
export const useAutoTranslate = (
  title: string,
  description?: string
): UseAutoTranslateResult => {
  const { i18n } = useTranslation();
  const viewerLang = i18n.language as 'en' | 'zh';

  const [translatedTitle, setTranslatedTitle] = useState(title);
  const [translatedDescription, setTranslatedDescription] = useState(description || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const translateIfNeeded = async () => {
      const sourceLang = detectLanguage(title);

      // If viewer's language matches source language, no translation needed
      if (sourceLang === viewerLang) {
        setTranslatedTitle(title);
        setTranslatedDescription(description || '');
        return;
      }

      // Check cache first (use title hash + lang pair to avoid huge keys)
      const titleHash = btoa(title).substring(0, 12); // base64 hash of title
      const cacheKey = `translate_${titleHash}_${sourceLang}_${viewerLang}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          const { translatedTitle: cachedTitle, translatedDescription: cachedDesc } = JSON.parse(cached);
          setTranslatedTitle(cachedTitle);
          setTranslatedDescription(cachedDesc);
          return;
        } catch {
          // Cache corrupted, proceed with translation
        }
      }

      // Translation needed - fetch
      setIsLoading(true);
      try {
        const newTitle = await translateText(title, sourceLang, viewerLang);
        const newDesc = description ? await translateText(description, sourceLang, viewerLang) : '';

        setTranslatedTitle(newTitle);
        setTranslatedDescription(newDesc);

        // Cache result
        localStorage.setItem(cacheKey, JSON.stringify({
          translatedTitle: newTitle,
          translatedDescription: newDesc,
        }));
      } finally {
        setIsLoading(false);
      }
    };

    translateIfNeeded();
  }, [title, description, viewerLang]);

  return { translatedTitle, translatedDescription, isLoading };
};
