import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetMachinesCategoriesQuery } from '@/rtk/slices/apiSlice';
import { useGetCategorySummaryQuery as useBatchCategorySummary } from '@/rtk/slices/batchApiSlice';
import { processCategories, processCategorySummary } from '@/utils/categoryTranslations';

/**
 * Custom hook for language-aware category fetching
 * Automatically refetches categories when language changes and translates them
 */
export const useLanguageAwareCategories = (_platform?: string) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language as 'en' | 'zh';

  const machinesCategoriesQuery = useGetMachinesCategoriesQuery(currentLang);

  // Refetch when language changes
  useEffect(() => {
    machinesCategoriesQuery.refetch();
  }, [currentLang]); // eslint-disable-line react-hooks/exhaustive-deps

  // Process the data to ensure proper language
  const processedData = machinesCategoriesQuery.data ?
    processCategories(machinesCategoriesQuery.data, currentLang) :
    machinesCategoriesQuery.data;

  return {
    ...machinesCategoriesQuery,
    data: processedData,
    currentLanguage: currentLang,
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
  const currentLang = i18n.language as 'en' | 'zh';

  const categorySummaryQuery = useBatchCategorySummary({
    ...params,
    lang: currentLang,
  });

  // Refetch when language changes
  useEffect(() => {
    categorySummaryQuery.refetch();
  }, [currentLang]); // eslint-disable-line react-hooks/exhaustive-deps

  // Process the data to ensure proper language
  const processedData = categorySummaryQuery.data?.data ? 
    processCategorySummary(categorySummaryQuery.data.data, currentLang) : 
    categorySummaryQuery.data?.data;

  return {
    ...categorySummaryQuery,
    data: categorySummaryQuery.data ? {
      ...categorySummaryQuery.data,
      data: processedData
    } : categorySummaryQuery.data,
    currentLanguage: currentLang,
  };
};