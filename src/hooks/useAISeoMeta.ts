import { useEffect, useState } from "react";
import axiosInstance from "@/rtk/api/axiosInstance";

export interface AISeoMeta {
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
}

// Cache TTL: 7 days in ms — AI-generated tags rarely need to refresh
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

const cacheKey = (id: string | number, lang: string) => `ai_seo_${id}_${lang}`;

const readCache = (key: string): AISeoMeta | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const writeCache = (key: string, data: AISeoMeta) => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // localStorage quota exceeded — skip cache write
  }
};

/**
 * Fetches AI-generated SEO meta tags for a dynamic page (batch/product listing).
 * Results are cached in localStorage for 7 days per entity+language combination.
 *
 * Falls back to the provided title/description if generation fails.
 */
export const useAISeoMeta = (
  id: string | number | undefined,
  title: string,
  description: string,
  category?: string,
  lang = "en"
): { seo: AISeoMeta; isLoading: boolean } => {
  const [seo, setSeo] = useState<AISeoMeta>({
    seo_title: title,
    seo_description: description,
    seo_keywords: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!id || !title) return;

    const key = cacheKey(id, lang);
    const cached = readCache(key);
    if (cached) {
      setSeo(cached);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    axiosInstance
      .post("seo/generate", { title, description, category, type: "product" })
      .then((res) => {
        if (cancelled) return;
        if (res.data?.success && res.data?.data) {
          const result: AISeoMeta = res.data.data;
          setSeo(result);
          writeCache(key, result);
        }
      })
      .catch(() => {
        // silently fall back to raw title/description already in state
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  // Re-run only when the entity identity changes, not on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, lang]);

  // Keep fallback in sync when the raw data changes (before AI loads)
  useEffect(() => {
    setSeo((prev) => ({
      seo_title: prev.seo_title || title,
      seo_description: prev.seo_description || description,
      seo_keywords: prev.seo_keywords,
    }));
  }, [title, description]);

  return { seo, isLoading };
};
