import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageAwareCategories, useLanguageAwareCategorySummary } from '@/hooks/useLanguageAwareCategories';
import { getCurrentLanguage, getLanguageDisplayName } from '@/utils/languageUtils';

/**
 * Demo component showing language-aware category fetching
 * This component automatically updates when language changes
 */
export const LanguageAwareCategoriesDemo: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  // Fetch categories with language awareness
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useLanguageAwareCategories();
  
  // Fetch category summary with language awareness
  const { 
    data: categorySummary, 
    isLoading: summaryLoading, 
    error: summaryError 
  } = useLanguageAwareCategorySummary({
    status: 'live_for_bids',
    sort: 'closing_soon'
  });

  const currentLang = getCurrentLanguage();
  const langDisplayName = getLanguageDisplayName(currentLang);

  const changeLanguage = (newLang: string) => {
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">
          {t('categories.title', 'Product Categories')} ({langDisplayName})
        </h1>
        
        {/* Language Switcher */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => changeLanguage('en')}
            className={`px-4 py-2 rounded ${currentLang === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            English
          </button>
          <button
            onClick={() => changeLanguage('zh')}
            className={`px-4 py-2 rounded ${currentLang === 'zh' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            中文
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {t('categories.list', 'Categories List')}
        </h2>
        
        {categoriesLoading && (
          <div className="text-gray-500">Loading categories...</div>
        )}
        
        {categoriesError && (
          <div className="text-red-500">Error loading categories</div>
        )}
        
        {categories && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category.term_id} className="border rounded-lg p-4">
                <h3 className="font-medium">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.description}</p>
                <span className="text-xs text-gray-400">ID: {category.term_id}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Summary */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {t('categories.summary', 'Category Summary with Batch Counts')}
        </h2>
        
        {summaryLoading && (
          <div className="text-gray-500">Loading category summary...</div>
        )}
        
        {summaryError && (
          <div className="text-red-500">Error loading category summary</div>
        )}
        
        {categorySummary?.data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorySummary.data.map((item) => (
              <div key={item.slug} className="border rounded-lg p-4">
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-blue-600">{item.count} batches available</p>
                {item.earliestBidEndDate && (
                  <p className="text-xs text-gray-500">
                    Closing soon: {new Date(item.earliestBidEndDate).toLocaleDateString()}
                  </p>
                )}
                {item.previewImages.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-400">
                      {item.previewImages.length} preview images
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageAwareCategoriesDemo;