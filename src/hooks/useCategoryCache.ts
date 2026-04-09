import { useState, useEffect } from 'react';
import { useGetMachinesCategoriesQuery } from '@/rtk/slices/apiSlice';

interface CategoryTranslationMap {
  [key: string]: {
    en: string;
    zh: string;
  };
}

interface CategoryCache {
  translations: CategoryTranslationMap;
  loaded: boolean;
}

// Global cache (loads once per app session)
let globalCategoryCache: CategoryCache = {
  translations: {},
  loaded: false,
};

export const useCategoryCache = () => {
  const [cache, setCache] = useState<CategoryCache>(globalCategoryCache);
  const { data: enCategories } = useGetMachinesCategoriesQuery('en');
  const { data: zhCategories } = useGetMachinesCategoriesQuery('zh');


  

  useEffect(() => {
    if (!globalCategoryCache.loaded && enCategories && zhCategories) {
      // Extract data from RTK response (which has { success, data, ... } structure)
      const enData = Array.isArray(enCategories) ? enCategories : (enCategories as any)?.data || [];
      const zhData = Array.isArray(zhCategories) ? zhCategories : (zhCategories as any)?.data || [];

      // Match categories by position (both endpoints return in same order)
      if (Array.isArray(enData) && Array.isArray(zhData)) {
        enData.forEach((enCat: any, index: number) => {
          const zhCat = zhData[index];
          if (zhCat) {
            console.log(`Match [${index}]: EN="${enCat.name}" → ZH="${zhCat.name}"`);
            globalCategoryCache.translations[enCat.name] = {
              en: enCat.name,
              zh: zhCat.name,
            };
          }
        });
      }

      globalCategoryCache.loaded = true;
      setCache({ ...globalCategoryCache });
    }
  }, [enCategories, zhCategories]);

  // Helper function to get translated category
  const getTranslatedCategory = (categoryName: string | undefined, lang: 'en' | 'zh'): string => {
    if (!categoryName) return '';
        

    
      


  

    const translations = cache.translations[categoryName];
    return translations ? translations[lang] : categoryName;
  };

  return { ...cache, getTranslatedCategory };
};
