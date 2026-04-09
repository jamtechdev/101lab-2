import { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetMachinesCategoriesQuery, LabCategory } from '@/rtk/slices/apiSlice';
import { useGetCategorySummaryQuery as useBatchCategorySummary } from '@/rtk/slices/batchApiSlice';
import { processCategorySummary, processLabCategoryTree } from '@/utils/categoryTranslations';
import { toBackendContentLang, toUiCategoryLang } from '@/utils/languageUtils';

export type { LabCategory };

/**
 * Lab category tree for navigation (mega menu, filters).
 * Always loads WP `product-labs?language=en` for hierarchy: the zh-hant endpoint returns
 * parents with empty `subcategories[]` (WPML data gap), which hides submenus in Chinese UI.
 * Display names are localized via processLabCategoryTree + categoryTranslations.
 */
export const useLanguageAwareCategories = (_platform?: string) => {
  const { i18n } = useTranslation();
  const uiLang = toUiCategoryLang(i18n.language);

  const machinesCategoriesQuery = useGetMachinesCategoriesQuery('en');

  const rawCategories: LabCategory[] = machinesCategoriesQuery.data?.data ?? [];
  const categories = useMemo(
    () => processLabCategoryTree(rawCategories, uiLang),
    [rawCategories, uiLang]
  );

  const { data: _serverPayload, ...queryRest } = machinesCategoriesQuery;
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
