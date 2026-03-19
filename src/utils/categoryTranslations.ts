/**
 * Category translation utilities
 * Handles cases where API returns mixed language category names and HTML entities
 */

/**
 * Decode HTML entities in text
 */
export const decodeHtmlEntities = (text: string): string => {
  if (!text) return text;
  
  const entityMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '='
  };
  
  return text.replace(/&[#\w]+;/g, (entity) => {
    return entityMap[entity] || entity;
  });
};

/**
 * Check if a string contains Chinese characters
 */
export const containsChinese = (text: string): boolean => {
  return /[\u4e00-\u9fff]/.test(text);
};

// Category name mappings for translation
export const CATEGORY_TRANSLATIONS = {
  // Chinese to English mappings
  '工業設備及系統': 'Industrial Equipment & Systems',
  '工業設備、零件與系統': 'Industrial Equipment, Parts & Systems',
  '製藥與實驗室設備': 'Pharmaceutical & Laboratory Equipment',
  '資訊科技與資料中心設備': 'IT & Data Center Equipment',
  '建築與土方機械': 'Construction & Earthmoving Equipment',
  '半導體與電子製造': 'Semiconductor & Electronics Manufacturing',
  '工廠及商店設備': 'Factory & Shop Equipment',
  '機械工具及商店設備': 'Machine Tools & Shop Equipment',
  '工業設備': 'Industrial Equipment',
  '剩餘及廢料': 'Surplus & Scrap Materials',
  '剩餘與廢棄材料': 'Surplus & Scrap Materials',
  '印刷機械': 'Printing Equipment',
  '食品加工機械': 'Food Processing Equipment',
  '塑膠加工機械': 'Plastics Processing Equipment',
  '塑膠加工設備': 'Plastics Processing Equipment',
  '汽車與運輸設備': 'Automotive & Transportation Equipment',
  '農業設備': 'Agricultural Equipment',
  '物料搬運設備': 'Material Handling Equipment',
  '商店與維修工具': 'Shop & Maintenance Tools',
  '測試與測量設備': 'Test & Measurement Equipment',
  '包裝設備': 'Packaging Equipment',
  '自動化與機器人': 'Automation & Robotics',
  '能源、電力與公用事業': 'Energy, Power & Utilities',
  '金屬加工設備': 'Metalworking Equipment',
  '木工設備': 'Woodworking Equipment',
  '運輸與物流設備': 'Transport & Logistics Equipment',
  '回收技術': 'Recycling Technology',
  '其他': 'Others',
  '其他設備': 'Other Equipment',
  '實驗室設備': 'Laboratory Equipment',
  '實驗室模組': 'Laboratory Modules',
  '製程設備': 'Process Equipment',

  // English to Chinese mappings
  'Industrial Equipment & Systems': '工業設備及系統',
  'Industrial Equipment, Parts & Systems': '工業設備、零件與系統',
  'Pharmaceutical & Laboratory Equipment': '製藥與實驗室設備',
  'IT & Data Center Equipment': '資訊科技與資料中心設備',
  'Construction & Earthmoving Equipment': '建築與土方機械',
  'Semiconductor & Electronics Manufacturing': '半導體與電子製造',
  'Factory & Shop Equipment': '工廠及商店設備',
  'Machine Tools & Shop Equipment': '機械工具及商店設備',
  'Industrial Equipment': '工業設備',
  'Surplus & Scrap Materials': '剩餘與廢棄材料',
  'Material Handling Equipment': '物料搬運設備',
  'Plastics Processing Equipment': '塑膠加工機械',
  'Automotive & Transportation Equipment': '汽車與運輸設備',
  'Shop & Maintenance Tools': '商店與維修工具',
  'Test & Measurement Equipment': '測試與測量設備',
  'Agricultural Equipment': '農業設備',
  'Printing Equipment': '印刷機械',
  'Food Processing Equipment': '食品加工機械',
  'Packaging Equipment': '包裝設備',
  'Automation & Robotics': '自動化與機器人',
  'Energy, Power & Utilities': '能源、電力與公用事業',
  'Metalworking Equipment': '金屬加工設備',
  'Woodworking Equipment': '木工設備',
  'Transport & Logistics Equipment': '運輸與物流設備',
  'Recycling Technology': '回收技術',
  'Others': '其他',
  'Other Equipment': '其他設備',
  'Laboratory Equipment': '實驗室設備',
  'Laboratory Modules': '實驗室模組',
  'Process Equipment': '製程設備',
} as const;

/**
 * Translate category name based on target language
 */
export const translateCategoryName = (categoryName: string, targetLang: 'en' | 'zh'): string => {
  if (!categoryName) return categoryName;

  // First decode HTML entities
  const decodedName = decodeHtmlEntities(categoryName);

  const sourceIsChinese = containsChinese(decodedName);

  // Only translate ZH→EN when source is Chinese and target is English
  if (targetLang === 'en' && sourceIsChinese) {
    return (CATEGORY_TRANSLATIONS as any)[decodedName] ?? decodedName;
  }

  // Only translate EN→ZH when source is English and target is Chinese
  if (targetLang === 'zh' && !sourceIsChinese) {
    return (CATEGORY_TRANSLATIONS as any)[decodedName] ?? decodedName;
  }

  // Source and target language match — just return decoded name
  return decodedName;
};

/**
 * Process category summary data to ensure proper language and decode HTML entities
 */
export const processCategorySummary = (data: any[], targetLang: 'en' | 'zh') => {
  if (!Array.isArray(data)) return data;
  
  return data.map(category => ({
    ...category,
    name: translateCategoryName(category.name, targetLang),
    // Keep original name as fallback
    originalName: category.name,
  }));
};

/**
 * Process categories data to ensure proper language and decode HTML entities
 */
export const processCategories = (data: any, targetLang: 'en' | 'zh') => {
  // Handle { success, data: [...] } response shape
  if (data && !Array.isArray(data) && Array.isArray(data.data)) {
    return {
      ...data,
      data: data.data.map((category: any) => ({
        ...category,
        name: translateCategoryName(category.name, targetLang),
        originalName: category.name,
      })),
    };
  }

  if (!Array.isArray(data)) return data;

  return data.map(category => ({
    ...category,
    name: translateCategoryName(category.name, targetLang),
    originalName: category.name,
  }));
};

/**
 * Detect the language of a category name
 */
export const detectCategoryLanguage = (categoryName: string): 'en' | 'zh' | 'mixed' => {
  if (!categoryName) return 'en';
  
  const decodedName = decodeHtmlEntities(categoryName);
  const hasChinese = containsChinese(decodedName);
  const hasEnglish = /[a-zA-Z]/.test(decodedName);
  
  if (hasChinese && hasEnglish) return 'mixed';
  if (hasChinese) return 'zh';
  return 'en';
};