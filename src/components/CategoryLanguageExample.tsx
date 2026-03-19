import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageAwareCategorySummary } from '@/hooks/useLanguageAwareCategories';

/**
 * Simple working example of language-aware category fetching
 * This component fetches categories and automatically translates them based on current language
 */
export const CategoryLanguageExample: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  // Fetch category summary with language awareness and translation
  const { 
    data: categorySummary, 
    isLoading, 
    error,
    currentLanguage 
  } = useLanguageAwareCategorySummary({
    status: 'live_for_bids',
    sort: 'closing_soon'
  });

  const changeLanguage = (newLang: string) => {
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">
          Language-Aware Categories ({currentLanguage})
        </h1>
        
        {/* Language Switcher */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => changeLanguage('en')}
            className={`px-4 py-2 rounded ${currentLanguage === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            English
          </button>
          <button
            onClick={() => changeLanguage('zh')}
            className={`px-4 py-2 rounded ${currentLanguage === 'zh' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            中文
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading categories...</p>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">❌ Error loading categories</div>
          <p className="text-sm text-gray-600">Please try again later</p>
        </div>
      )}
      
      {/* Categories Grid */}
      {categorySummary?.data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categorySummary.data.map((category) => (
            <div key={category.slug} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              {/* Category Header */}
              <div className="mb-3">
                <h3 className="font-semibold text-lg text-gray-900">{category.name}</h3>
                {category.originalName && category.originalName !== category.name && (
                  <p className="text-xs text-gray-500 mt-1">
                    Original: {category.originalName}
                  </p>
                )}
              </div>
              
              {/* Stats */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-blue-600">
                  {category.count} {category.count === 1 ? 'batch' : 'batches'}
                </span>
                {category.earliestBidEndDate && (
                  <span className="text-xs text-gray-500">
                    Ends: {new Date(category.earliestBidEndDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              {/* Preview Images */}
              {category.previewImages && category.previewImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {category.previewImages.slice(0, 4).map((image, idx) => (
                    <div key={idx} className="aspect-square bg-gray-100 rounded overflow-hidden">
                      <img 
                        src={image} 
                        alt={`${category.name} preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {/* No Images Placeholder */}
              {(!category.previewImages || category.previewImages.length === 0) && (
                <div className="aspect-square bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-gray-400 text-sm">No images</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Empty State */}
      {categorySummary?.data && categorySummary.data.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
          <p className="text-gray-600">Try changing the language or check back later.</p>
        </div>
      )}
    </div>
  );
};

export default CategoryLanguageExample;