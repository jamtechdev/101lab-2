/**
 * Category translation utilities
 * Handles cases where API returns mixed language category names and HTML entities
 */

import type { LabCategory } from '@/rtk/slices/apiSlice';

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
  '細胞培養與分析': 'Cell Culture & Analysis',
  '生命科學與生物技術': 'Life Sciences & Biotech (Bio)',
  '生命科學與生物技術（Bio）': 'Life Sciences & Biotech (Bio)',
  '製藥與分析': 'Pharmaceutical & Analytical (Pharma)',
  '製藥與分析（Pharma）': 'Pharmaceutical & Analytical (Pharma)',
  '測試與測量': 'Test & Measurement (T&M)',
  '測試與量測（T&M）': 'Test & Measurement (T&M)',
  '實驗室基礎設施與必備工具': 'Lab Infrastructure & Essentials',
  '實驗室基礎設施與必需品': 'Lab Infrastructure & Essentials',

  // Lab subcategories (ZH → EN)
  '生物反應器與發酵槽': 'Bioreactors & Fermenters',
  '離心機 (落地式、桌上型、超高速)': 'Centrifuges (Floor, Tabletop, Ultra)',
  '基因體學與 PCR': 'Genomics & PCR',
  '培養箱與震盪器': 'Incubators & Shakers',
  '顯微鏡與影像系統': 'Microscopy & Imaging Systems',
  '蛋白質純化 (FPLC)': 'Protein Purification (FPLC)',
  '滅菌與高壓滅菌器': 'Sterilization & Autoclaves',
  '層析儀 (HPLC, GC, TLC)': 'Chromatography (HPLC, GC, TLC)',
  '質譜儀 (LC-MS, GC-MS)': 'Mass Spectrometry (LC-MS, GC-MS)',
  '光譜儀 (UV-Vis, FTIR, NMR)': 'Spectroscopy (UV-Vis, FTIR, NMR)',
  '溶離與錠劑測試': 'Dissolution & Tablet Testing',
  '液體處理與實驗室自動化': 'Liquid Handling & Lab Automation',
  '製藥加工 (混合機、造粒機)': 'Pharmaceutical Processing (Mixers, Granulators)',
  '樣品製備 (蒸發儀、冷凍乾燥機)': 'Sample Preparation (Evaporators, Freeze Dryers)',
  '熱分析 (DSC, TGA)': 'Thermal Analysis (DSC, TGA)',
  '校準與標準件': 'Calibration & Standards',
  '電子測試 (示波器、三用電表)': 'Electronic Test (Oscilloscopes, Multimeters)',
  '環境試驗箱 (溫濕度)': 'Environmental Chambers (Temp/Humidity)',
  '材料測試 (萬能試驗機、硬度計)': 'Materials Testing (UTM, Hardness)',
  '計量與檢測 (三次元量測儀、影像量測系統)': 'Metrology & Inspection (CMM, Vision Systems)',
  '物理性質測試 (黏度計、流變儀)': 'Physical Property Testing (Viscometers, Rheometers)',
  '壓力、流量與真空測量': 'Pressure, Flow & Vacuum Measurement',
  '訊號產生器與分析儀': 'Signal Generators & Analyzers',
  '低溫儲存 (-80°C 冷凍櫃、液氮罐)': 'Cold Storage (-80°C Freezers, LN2 Tanks)',
  '低溫儲存 (-80C 冷凍櫃、液氮罐)': 'Cold Storage (-80C Freezers, LN2 Tanks)',
  '排煙櫃與生物安全櫃': 'Fume Hoods & Biosafety Cabinets',
  '實驗室家具與工作台': 'Lab Furniture & Benches',
  '純水系統': 'Water Purification Systems',
  '通用實驗工具 (天平、微量移液器、攪拌器)': 'General Lab Tools (Balances, Pipettes, Stirrers)',

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
  'Cell Culture & Analysis': '細胞培養與分析',
  'Life Sciences & Biotech (Bio)': '生命科學與生物技術',
  'Pharmaceutical & Analytical (Pharma)': '製藥與分析',
  'Test & Measurement (T&M)': '測試與測量',
  'Lab Infrastructure & Essentials': '實驗室基礎設施與必備工具',

  // Lab subcategories (EN → ZH) — WP returns English names; map here until WPML has full ZH labels
  'Bioreactors & Fermenters': '生物反應器與發酵槽',
  'Centrifuges (Floor, Tabletop, Ultra)': '離心機 (落地式、桌上型、超高速)',
  'Genomics & PCR': '基因體學與 PCR',
  'Incubators & Shakers': '培養箱與震盪器',
  'Microscopy & Imaging Systems': '顯微鏡與影像系統',
  'Protein Purification (FPLC)': '蛋白質純化 (FPLC)',
  'Sterilization & Autoclaves': '滅菌與高壓滅菌器',
  'Chromatography (HPLC, GC, TLC)': '層析儀 (HPLC, GC, TLC)',
  'Mass Spectrometry (LC-MS, GC-MS)': '質譜儀 (LC-MS, GC-MS)',
  'Spectroscopy (UV-Vis, FTIR, NMR)': '光譜儀 (UV-Vis, FTIR, NMR)',
  'Dissolution & Tablet Testing': '溶離與錠劑測試',
  'Liquid Handling & Lab Automation': '液體處理與實驗室自動化',
  'Pharmaceutical Processing (Mixers, Granulators)': '製藥加工 (混合機、造粒機)',
  'Sample Preparation (Evaporators, Freeze Dryers)': '樣品製備 (蒸發儀、冷凍乾燥機)',
  'Thermal Analysis (DSC, TGA)': '熱分析 (DSC, TGA)',
  'Calibration & Standards': '校準與標準件',
  'Electronic Test (Oscilloscopes, Multimeters)': '電子測試 (示波器、三用電表)',
  'Environmental Chambers (Temp/Humidity)': '環境試驗箱 (溫濕度)',
  'Materials Testing (UTM, Hardness)': '材料測試 (萬能試驗機、硬度計)',
  'Metrology & Inspection (CMM, Vision Systems)': '計量與檢測 (三次元量測儀、影像量測系統)',
  'Physical Property Testing (Viscometers, Rheometers)': '物理性質測試 (黏度計、流變儀)',
  'Pressure, Flow & Vacuum Measurement': '壓力、流量與真空測量',
  'Signal Generators & Analyzers': '訊號產生器與分析儀',
  'Cold Storage (-80°C Freezers, LN2 Tanks)': '低溫儲存 (-80°C 冷凍櫃、液氮罐)',
  'Cold Storage (-80C Freezers, LN2 Tanks)': '低溫儲存 (-80°C 冷凍櫃、液氮罐)',
  'Fume Hoods & Biosafety Cabinets': '排煙櫃與生物安全櫃',
  'Lab Furniture & Benches': '實驗室家具與工作台',
  'Water Purification Systems': '純水系統',
  'General Lab Tools (Balances, Pipettes, Stirrers)': '通用實驗工具 (天平、微量移液器、攪拌器)',
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

/** Lab category API tree: translate parent + subcategory display names */
export const processLabCategoryTree = (
  categories: LabCategory[] | undefined,
  targetLang: 'en' | 'zh'
): LabCategory[] => {
  if (!Array.isArray(categories)) return [];
  return categories.map((cat) => ({
    ...cat,
    name: cat.name ? translateCategoryName(cat.name, targetLang) : cat.name,
    subcategories: Array.isArray(cat.subcategories)
      ? cat.subcategories.map((sub) => ({
          ...sub,
          name: sub.name ? translateCategoryName(sub.name, targetLang) : sub.name,
        }))
      : cat.subcategories,
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