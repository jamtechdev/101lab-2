import React from 'react';
import { decodeHtmlEntities, translateCategoryName } from '@/utils/categoryTranslations';

export const CategoryDecodingTest: React.FC = () => {
  const testCategories = [
    "Transport &amp; Logistics Equipment",
    "Construction &amp; Earthmoving Equipment",
    "IT &amp; Data Center Equipment",
    "Automotive &amp; Transportation Equipment",
    "Energy, Power &amp; Utilities",
    "Surplus &amp; Scrap Materials",
    "Test &amp; Measurement Equipment",
    "Shop &amp; Maintenance Tools"
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Category HTML Entity Decoding Test</h1>
      <div className="space-y-4">
        {testCategories.map((category, index) => {
          const decoded = decodeHtmlEntities(category);
          const translatedEn = translateCategoryName(category, 'en');
          const translatedZh = translateCategoryName(category, 'zh');
          return (
            <div key={index} className="border rounded-lg p-4 bg-muted">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">Original & Processed</h3>
                  <p className="text-sm mb-1"><span className="font-medium">Original:</span> {category}</p>
                  <p className="text-sm mb-1"><span className="font-medium">Decoded:</span> {decoded}</p>
                  <p className="text-sm">
                    <span className="font-medium">Changed:</span>{' '}
                    <span className={category !== decoded ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                      {category !== decoded ? 'Yes' : 'No'}
                    </span>
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">Translations</h3>
                  <p className="text-sm mb-1"><span className="font-medium">EN:</span> {translatedEn}</p>
                  <p className="text-sm"><span className="font-medium">ZH:</span> {translatedZh}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryDecodingTest;
