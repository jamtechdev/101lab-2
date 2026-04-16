import { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetMachinesCategoriesQuery, LabCategory } from '@/rtk/slices/apiSlice';
import { useGetCategorySummaryQuery as useBatchCategorySummary } from '@/rtk/slices/batchApiSlice';
import { processCategorySummary } from '@/utils/categoryTranslations';
import { toBackendContentLang, toUiCategoryLang } from '@/utils/languageUtils';

export type { LabCategory };

/**
 * Lab category tree for navigation (mega menu, filters).
 *
 * The backend now handles translation server-side:
 *  - Always fetches WordPress with language=en for proper slugs + full subcategory tree
 *  - Applies the static Chinese translation map before returning
 * So we just pass the current language and get back the correctly named tree.
 */
export const useLanguageAwareCategories = (_platform?: string) => {
  const { i18n } = useTranslation();
  const apiLang = toBackendContentLang(i18n.language); // 'zh-hant' for zh, 'en' otherwise
  const uiLang = toUiCategoryLang(i18n.language);

  // Pass the current language — backend returns English slugs + translated names
  const categoriesQuery = useGetMachinesCategoriesQuery(apiLang);

  const categories: LabCategory[] = useMemo(
    () => categoriesQuery.data?.data ?? [],
    [categoriesQuery.data?.data]
  );

  const { data: _serverPayload, ...queryRest } = categoriesQuery;
  return {
    ...queryRest,
    data: categories,
    currentLanguage: uiLang,
  };
};

/**
 * Custom hook for language-aware category summary fetching
 * Used for marketplace category cards with batch counts
 */
export const useLanguageAwareCategorySummary = (params: {
  status?: string;
  highlighted?: boolean;
  sort?: string;
} = {}) => {
  const { i18n } = useTranslation();
  const apiLang = toBackendContentLang(i18n.language);
  const uiLang = toUiCategoryLang(i18n.language);

  const categorySummaryQuery = useBatchCategorySummary({
    ...params,
    lang: apiLang,
  });

  // Refetch when language changes
  useEffect(() => {
    categorySummaryQuery.refetch();
  }, [apiLang]); // eslint-disable-line react-hooks/exhaustive-deps

  // Process the data to ensure proper language
  const processedData = categorySummaryQuery.data?.data ?
    processCategorySummary(categorySummaryQuery.data.data, uiLang) :
    categorySummaryQuery.data?.data;

  return {
    ...categorySummaryQuery,
    data: categorySummaryQuery.data ? {
      ...categorySummaryQuery.data,
      data: processedData
    } : categorySummaryQuery.data,
    currentLanguage: uiLang,
  };
};
