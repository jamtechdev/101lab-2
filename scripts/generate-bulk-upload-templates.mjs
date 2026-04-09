/**
 * Builds bulk_upload_template_en.xlsx and bulk_upload_template_zh.xlsx matching
 * src/pages/dashboard/BulkUpload.tsx (downloadTemplate): same sheet names, column
 * order, example row, and data validations.
 *
 * Category list is driven by scripts/data/lab-product-categories-en.json (EN tree).
 * ZH names mirror src/utils/categoryTranslations.ts (EN → 繁體).
 *
 * Run: npm run generate:bulk-templates
 */

import * as XLSX from "xlsx";
import { readFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
/** Green-Bidz monorepo root (parent of 101lab-2) — templates also written here */
const REPO_ROOT = join(__dirname, "..", "..");

/** Same keys as BulkUpload.tsx DATA_COLS */
const DATA_COLS = [
  "title",
  "category",
  "description",
  "condition",
  "operationStatus",
  "location",
  "country",
  "quantity",
  "priceFormat",
  "pricePerUnit",
  "priceCurrency",
  "weightPerUnit",
  "replacementCost",
  "images",
];

const COL_WIDTHS = {
  title: 32,
  category: 28,
  description: 40,
  condition: 18,
  operationStatus: 18,
  location: 24,
  country: 10,
  quantity: 10,
  priceFormat: 12,
  pricePerUnit: 14,
  priceCurrency: 12,
  weightPerUnit: 14,
  replacementCost: 16,
  images: 48,
};

const EXAMPLES = {
  title: "CNC Milling Machine XYZ-500",
  description: "Used machine, 2018 model, good condition",
  condition: "working",
  operationStatus: "operational",
  location: "Taipei, Taiwan",
  country: "TW",
  quantity: "1",
  priceFormat: "buyNow",
  pricePerUnit: "15000",
  priceCurrency: "USD",
  weightPerUnit: "500",
  replacementCost: "20000",
  images: "",
};

const LANG_LABELS = { en: "English", zh: "繁體中文" };

/** EN display name → ZH (keep in sync with categoryTranslations.ts lab section) */
const EN_TO_ZH = {
  "Lab Infrastructure & Essentials": "實驗室基礎設施與必備工具",
  "Life Sciences & Biotech (Bio)": "生命科學與生物技術",
  "Pharmaceutical & Analytical (Pharma)": "製藥與分析",
  "Test & Measurement (T&M)": "測試與測量",
  "Cold Storage (-80C Freezers, LN2 Tanks)": "低溫儲存 (-80°C 冷凍櫃、液氮罐)",
  "Fume Hoods & Biosafety Cabinets": "排煙櫃與生物安全櫃",
  "General Lab Tools (Balances, Pipettes, Stirrers)": "通用實驗工具 (天平、微量移液器、攪拌器)",
  "Lab Furniture & Benches": "實驗室家具與工作台",
  "Water Purification Systems": "純水系統",
  "Bioreactors & Fermenters": "生物反應器與發酵槽",
  "Cell Culture & Analysis": "細胞培養與分析",
  "Centrifuges (Floor, Tabletop, Ultra)": "離心機 (落地式、桌上型、超高速)",
  "Genomics & PCR": "基因體學與 PCR",
  "Incubators & Shakers": "培養箱與震盪器",
  "Microscopy & Imaging Systems": "顯微鏡與影像系統",
  "Protein Purification (FPLC)": "蛋白質純化 (FPLC)",
  "Sterilization & Autoclaves": "滅菌與高壓滅菌器",
  "Chromatography (HPLC, GC, TLC)": "層析儀 (HPLC, GC, TLC)",
  "Dissolution & Tablet Testing": "溶離與錠劑測試",
  "Mass Spectrometry (LC-MS, GC-MS)": "質譜儀 (LC-MS, GC-MS)",
  "Pharmaceutical Processing (Mixers, Granulators)": "製藥加工 (混合機、造粒機)",
  "Sample Preparation (Evaporators, Freeze Dryers)": "樣品製備 (蒸發儀、冷凍乾燥機)",
  "Spectroscopy (UV-Vis, FTIR, NMR)": "光譜儀 (UV-Vis, FTIR, NMR)",
  "Thermal Analysis (DSC, TGA)": "熱分析 (DSC, TGA)",
  "Liquid Handling & Lab Automation": "液體處理與實驗室自動化",
  "Calibration & Standards": "校準與標準件",
  "Electronic Test (Oscilloscopes, Multimeters)": "電子測試 (示波器、三用電表)",
  "Environmental Chambers (Temp/Humidity)": "環境試驗箱 (溫濕度)",
  "Materials Testing (UTM, Hardness)": "材料測試 (萬能試驗機、硬度計)",
  "Metrology & Inspection (CMM, Vision Systems)": "計量與檢測 (三次元量測儀、影像量測系統)",
  "Physical Property Testing (Viscometers, Rheometers)": "物理性質測試 (黏度計、流變儀)",
  "Pressure, Flow & Vacuum Measurement": "壓力、流量與真空測量",
  "Signal Generators & Analyzers": "訊號產生器與分析儀",
};

function toZh(enName) {
  return EN_TO_ZH[enName] ?? enName;
}

function flatSubcategories(tree) {
  const rows = [];
  for (const parent of tree) {
    const subs = parent.subcategories ?? [];
    if (subs.length === 0) {
      rows.push({
        parentId: parent.id,
        parentName: parent.name,
        parentSlug: parent.slug,
        id: parent.id,
        name: parent.name,
        slug: parent.slug,
      });
      continue;
    }
    for (const s of subs) {
      rows.push({
        parentId: parent.id,
        parentName: parent.name,
        parentSlug: parent.slug,
        id: s.id,
        name: s.name,
        slug: s.slug || "",
      });
    }
  }
  return rows;
}

function buildWorkbook(catNames, langKey) {
  const catSheetName = "Categories";
  const numCats = catNames.length;
  const wb = XLSX.utils.book_new();

  const wsCat = XLSX.utils.aoa_to_sheet([["category"], ...catNames.map((n) => [n])]);
  wsCat["!cols"] = [{ wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsCat, catSheetName);

  const infoRow = [
    `Fill one product per row. Category dropdown is in column B. Language: ${LANG_LABELS[langKey] ?? langKey}`,
    ...Array(DATA_COLS.length - 1).fill(""),
  ];
  const headerRow = DATA_COLS;
  const exampleRow = DATA_COLS.map((h) =>
    h === "category" ? catNames[Math.min(2, catNames.length - 1)] : EXAMPLES[h] ?? ""
  );
  const blankRows = Array(50)
    .fill(null)
    .map(() => DATA_COLS.map(() => ""));

  const ws = XLSX.utils.aoa_to_sheet([infoRow, headerRow, exampleRow, ...blankRows]);
  ws["!cols"] = DATA_COLS.map((h) => ({ wch: COL_WIDTHS[h] ?? 18 }));

  ws["!dataValidations"] = [
    {
      sqref: "B3:B1000",
      type: "list",
      formula1: `${catSheetName}!$A$2:$A$${numCats + 1}`,
      showDropDown: false,
      error: "Please select a category from the dropdown.",
      errorTitle: "Invalid Category",
      showErrorMessage: true,
    },
    {
      sqref: "I3:I1000",
      type: "list",
      formula1: '"buyNow,offer"',
      showDropDown: false,
    },
    {
      sqref: "K3:K1000",
      type: "list",
      formula1: '"USD,TWD,JPY,THB"',
      showDropDown: false,
    },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Products");
  wb.SheetNames = ["Products", catSheetName];
  return wb;
}

function main() {
  const jsonPath = join(__dirname, "data", "lab-product-categories-en.json");
  const raw = JSON.parse(readFileSync(jsonPath, "utf8"));
  const tree = raw.data;
  if (!Array.isArray(tree)) {
    console.error("Invalid JSON: expected data array");
    process.exit(1);
  }

  const flat = flatSubcategories(tree);
  const enNames = flat.map((r) => r.name);
  const zhNames = flat.map((r) => toZh(r.name));

  const outDir = join(__dirname, "generated");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const wbEn = buildWorkbook(enNames, "en");
  const wbZh = buildWorkbook(zhNames, "zh");

  const paths = [
    [wbEn, join(REPO_ROOT, "bulk_upload_template_en.xlsx")],
    [wbZh, join(REPO_ROOT, "bulk_upload_template_zh.xlsx")],
    [wbEn, join(outDir, "bulk_upload_template_en.xlsx")],
    [wbZh, join(outDir, "bulk_upload_template_zh.xlsx")],
  ];
  for (const [wb, p] of paths) XLSX.writeFile(wb, p);

  // Reference sheet: id ↔ slug ↔ EN ↔ ZH (separate workbook for clarity)
  const mapWb = XLSX.utils.book_new();
  const mapRows = [
    ["subcategory_id", "slug", "name_en", "name_zh", "parent_id", "parent_slug"],
    ...flat.map((r) => [
      r.id,
      r.slug,
      r.name,
      toZh(r.name),
      r.parentId,
      r.parentSlug,
    ]),
  ];
  const wsMap = XLSX.utils.aoa_to_sheet(mapRows);
  wsMap["!cols"] = [{ wch: 12 }, { wch: 36 }, { wch: 42 }, { wch: 36 }, { wch: 10 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(mapWb, wsMap, "CategoryMap");
  XLSX.writeFile(mapWb, join(REPO_ROOT, "lab_category_id_slug_reference.xlsx"));
  XLSX.writeFile(mapWb, join(outDir, "lab_category_id_slug_reference.xlsx"));

  console.log("Wrote (repo root):");
  console.log(`  ${join(REPO_ROOT, "bulk_upload_template_en.xlsx")}`);
  console.log(`  ${join(REPO_ROOT, "bulk_upload_template_zh.xlsx")}`);
  console.log(`  ${join(REPO_ROOT, "lab_category_id_slug_reference.xlsx")}`);
  console.log(`Also mirrored under: ${outDir}`);
  console.log(`Subcategories: ${enNames.length}`);
}

main();
