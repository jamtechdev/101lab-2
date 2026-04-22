import { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetMachinesCategoriesQuery, LabCategory } from '@/rtk/slices/apiSlice';
import { useGetCategorySummaryQuery as useBatchCategorySummary } from '@/rtk/slices/batchApiSlice';
import { processCategorySummary } from '@/utils/categoryTranslations';
import { toBackendContentLang, toUiCategoryLang } from '@/utils/languageUtils';

export type { LabCategory };

const LAB_CATEGORY_FALLBACKS: Record<string, Record<string, string>> = {
  ja: {
    'Lab Infrastructure & Essentials': '実験室インフラと必須機器',
    'Life Sciences & Biotech': 'ライフサイエンスとバイオテクノロジー',
    'Life Sciences & Biotech (Bio)': 'ライフサイエンスとバイオテクノロジー',
    'Pharmaceutical & Analytical': '製薬・分析',
    'Pharmaceutical & Analytical (Pharma)': '製薬・分析',
    'Test & Measurement': 'テストと計測',
    'Test & Measurement (T&M)': 'テストと計測',
    'Bioreactors & Fermenters': 'バイオリアクターと発酵槽',
    'Centrifuges (Floor, Tabletop, Ultra)': '遠心分離機（床置き・卓上・超高速）',
    'Genomics & PCR': 'ゲノミクスとPCR',
    'Incubators & Shakers': 'インキュベーターとシェーカー',
    'Microscopy & Imaging Systems': '顕微鏡とイメージングシステム',
    'Protein Purification (FPLC)': 'タンパク質精製（FPLC）',
    'Sterilization & Autoclaves': '滅菌とオートクレーブ',
    'Chromatography (HPLC, GC, TLC)': 'クロマトグラフィー（HPLC, GC, TLC）',
    'Mass Spectrometry (LC-MS, GC-MS)': '質量分析（LC-MS, GC-MS）',
    'Spectroscopy (UV-Vis, FTIR, NMR)': '分光法（UV-Vis, FTIR, NMR）',
    'Dissolution & Tablet Testing': '溶出試験と錠剤試験',
    'Liquid Handling & Lab Automation': '液体ハンドリングと実験室自動化',
    'Pharmaceutical Processing (Mixers, Granulators)': '製薬プロセス（ミキサー・造粒機）',
    'Sample Preparation (Evaporators, Freeze Dryers)': 'サンプル調製（蒸発器・凍結乾燥機）',
    'Thermal Analysis (DSC, TGA)': '熱分析（DSC, TGA）',
    'Calibration & Standards': '校正と標準',
    'Electronic Test (Oscilloscopes, Multimeters)': '電子テスト（オシロスコープ・マルチメーター）',
    'Environmental Chambers (Temp/Humidity)': '環境試験槽（温度・湿度）',
    'Materials Testing (UTM, Hardness)': '材料試験（UTM・硬度）',
    'Metrology & Inspection (CMM, Vision Systems)': '計量・検査（CMM・ビジョンシステム）',
    'Physical Property Testing (Viscometers, Rheometers)': '物性試験（粘度計・レオメーター）',
    'Pressure, Flow & Vacuum Measurement': '圧力・流量・真空計測',
    'Signal Generators & Analyzers': '信号発生器とアナライザー',
    'Cold Storage (-80Â°C Freezers, LN2 Tanks)': '冷凍保存（-80°C冷凍庫・液体窒素タンク）',
    'Cold Storage (-80C Freezers, LN2 Tanks)': '冷凍保存（-80°C冷凍庫・液体窒素タンク）',
    'Fume Hoods & Biosafety Cabinets': 'ドラフトチャンバーと安全キャビネット',
    'Lab Furniture & Benches': '実験室家具と作業台',
    'Water Purification Systems': '水精製システム',
    'General Lab Tools (Balances, Pipettes, Stirrers)': '汎用実験器具（天秤・ピペット・スターラー）',
    'Cell Culture & Analysis': '細胞培養と分析',
  },
  th: {
    'Lab Infrastructure & Essentials': 'โครงสร้างพื้นฐานและอุปกรณ์จำเป็นสำหรับห้องปฏิบัติการ',
    'Life Sciences & Biotech': 'วิทยาศาสตร์ชีวภาพและเทคโนโลยีชีวภาพ',
    'Life Sciences & Biotech (Bio)': 'วิทยาศาสตร์ชีวภาพและเทคโนโลยีชีวภาพ',
    'Pharmaceutical & Analytical': 'เภสัชกรรมและการวิเคราะห์',
    'Pharmaceutical & Analytical (Pharma)': 'เภสัชกรรมและการวิเคราะห์',
    'Test & Measurement': 'การทดสอบและการวัด',
    'Test & Measurement (T&M)': 'การทดสอบและการวัด',
    'Bioreactors & Fermenters': 'ไบโอรีแอคเตอร์และถังหมัก',
    'Centrifuges (Floor, Tabletop, Ultra)': 'เครื่องปั่นเหวี่ยง (ตั้งพื้น, ตั้งโต๊ะ, ความเร็วสูงพิเศษ)',
    'Genomics & PCR': 'จีโนมิกส์และ PCR',
    'Incubators & Shakers': 'ตู้บ่มและเครื่องเขย่า',
    'Microscopy & Imaging Systems': 'กล้องจุลทรรศน์และระบบถ่ายภาพ',
    'Protein Purification (FPLC)': 'การทำโปรตีนให้บริสุทธิ์ (FPLC)',
    'Sterilization & Autoclaves': 'การฆ่าเชื้อและหม้อนึ่งฆ่าเชื้อ',
    'Chromatography (HPLC, GC, TLC)': 'โครมาโทกราฟี (HPLC, GC, TLC)',
    'Mass Spectrometry (LC-MS, GC-MS)': 'แมสสเปกโตรเมทรี (LC-MS, GC-MS)',
    'Spectroscopy (UV-Vis, FTIR, NMR)': 'สเปกโทรสโกปี (UV-Vis, FTIR, NMR)',
    'Dissolution & Tablet Testing': 'การทดสอบการละลายและเม็ดยา',
    'Liquid Handling & Lab Automation': 'การจัดการของเหลวและระบบอัตโนมัติในห้องปฏิบัติการ',
    'Pharmaceutical Processing (Mixers, Granulators)': 'กระบวนการผลิตยา (เครื่องผสม, เครื่องทำเม็ด)',
    'Sample Preparation (Evaporators, Freeze Dryers)': 'การเตรียมตัวอย่าง (เครื่องระเหย, เครื่องทำแห้งแบบแช่เยือกแข็ง)',
    'Thermal Analysis (DSC, TGA)': 'การวิเคราะห์เชิงความร้อน (DSC, TGA)',
    'Calibration & Standards': 'การสอบเทียบและมาตรฐาน',
    'Electronic Test (Oscilloscopes, Multimeters)': 'การทดสอบอิเล็กทรอนิกส์ (ออสซิลโลสโคป, มัลติมิเตอร์)',
    'Environmental Chambers (Temp/Humidity)': 'ตู้ทดสอบสภาพแวดล้อม (อุณหภูมิ/ความชื้น)',
    'Materials Testing (UTM, Hardness)': 'การทดสอบวัสดุ (UTM, ความแข็ง)',
    'Metrology & Inspection (CMM, Vision Systems)': 'มาตรวิทยาและการตรวจสอบ (CMM, ระบบวิชัน)',
    'Physical Property Testing (Viscometers, Rheometers)': 'การทดสอบสมบัติทางกายภาพ (วิสโคมิเตอร์, รีโอมิเตอร์)',
    'Pressure, Flow & Vacuum Measurement': 'การวัดความดัน การไหล และสุญญากาศ',
    'Signal Generators & Analyzers': 'เครื่องกำเนิดสัญญาณและเครื่องวิเคราะห์',
    'Cold Storage (-80Â°C Freezers, LN2 Tanks)': 'ระบบจัดเก็บความเย็น (-80°C, ตู้แช่แข็ง, ถังไนโตรเจนเหลว)',
    'Cold Storage (-80C Freezers, LN2 Tanks)': 'ระบบจัดเก็บความเย็น (-80°C, ตู้แช่แข็ง, ถังไนโตรเจนเหลว)',
    'Fume Hoods & Biosafety Cabinets': 'ตู้ดูดควันและตู้ความปลอดภัยทางชีวภาพ',
    'Lab Furniture & Benches': 'เฟอร์นิเจอร์และโต๊ะปฏิบัติการ',
    'Water Purification Systems': 'ระบบทำน้ำบริสุทธิ์',
    'General Lab Tools (Balances, Pipettes, Stirrers)': 'เครื่องมือห้องปฏิบัติการทั่วไป (เครื่องชั่ง, ปิเปต, เครื่องกวน)',
  },
};

const applyCategoryFallbacks = (
  categories: LabCategory[] | undefined,
  language: string
): LabCategory[] => {
  if (!Array.isArray(categories)) return [];

  const fallbackMap = LAB_CATEGORY_FALLBACKS[language];
  if (!fallbackMap) return categories;

  return categories.map((category) => ({
    ...category,
    name: fallbackMap[category.name] ?? category.name,
    subcategories: Array.isArray(category.subcategories)
      ? category.subcategories.map((subcategory) => ({
          ...subcategory,
          name: fallbackMap[subcategory.name] ?? subcategory.name,
        }))
      : category.subcategories,
  }));
};

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
  const normalizedLang = (i18n.language || 'en').toLowerCase().split('-')[0];

  // Pass the current language — backend returns English slugs + translated names
  const categoriesQuery = useGetMachinesCategoriesQuery(apiLang);

  const categories: LabCategory[] = useMemo(
    () => applyCategoryFallbacks(categoriesQuery.data?.data ?? [], normalizedLang),
    [categoriesQuery.data?.data, normalizedLang]
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
