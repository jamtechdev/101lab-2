/**
 * Reads Green-Bidz repo root: 101lab-bio-pharma-equipment.xlsx (WordPress export sheet "Products")
 * and writes bulk-upload workbooks to the same repo root:
 *   - bulk_upload_filled_en.xlsx  — rows whose Title has no CJK (English listings)
 *   - bulk_upload_filled_zh.xlsx  — rows whose Title contains Chinese (Traditional)
 *
 * Column layout matches src/pages/dashboard/BulkUpload.tsx (Products + Categories sheets).
 *
 * Run from 101lab-2: npm run convert:bio-pharma-bulk
 */

import * as XLSX from "xlsx";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
/** Green-Bidz monorepo root (parent of 101lab-2) */
const REPO_ROOT = join(__dirname, "..", "..");
const SOURCE_XLSX = join(REPO_ROOT, "101lab-bio-pharma-equipment.xlsx");
const LAB_JSON = join(__dirname, "data", "lab-product-categories-en.json");

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

const LANG_LABELS = { en: "English", zh: "繁體中文" };

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

/** Sub Category strings from export → canonical EN name in product-labs JSON */
const SUB_ALIASES = {
  "cold storage (-80°c freezers, ln2 tanks)": "Cold Storage (-80C Freezers, LN2 Tanks)",
  "cold storage (-80c freezers, ln2 tanks)": "Cold Storage (-80C Freezers, LN2 Tanks)",
  "pharmaceutical & analytical": "Pharmaceutical & Analytical (Pharma)",
  "test & measurement": "Test & Measurement (T&M)",
};

function containsCjk(s) {
  return /[\u4e00-\u9fff]/.test(String(s ?? ""));
}

function toZh(en) {
  return EN_TO_ZH[en] ?? en;
}

function flatSubcategoryNames(tree) {
  const names = [];
  for (const p of tree) {
    const subs = p.subcategories ?? [];
    if (subs.length === 0) names.push(p.name);
    else for (const s of subs) names.push(s.name);
  }
  return names;
}

function normalizeSubCategory(raw, canonicalSet) {
  let s = String(raw ?? "").trim();
  if (!s) return "";
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/-80°C/gi, "-80C").replace(/−80/g, "-80");
  if (canonicalSet.has(s)) return s;
  const lower = s.toLowerCase();
  if (SUB_ALIASES[lower]) {
    const c = SUB_ALIASES[lower];
    if (canonicalSet.has(c)) return c;
  }
  for (const c of canonicalSet) {
    if (c.toLowerCase() === lower) return c;
  }
  return s;
}

function parseNum(v) {
  if (v == null || v === "") return NaN;
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : NaN;
}

function guessQuantity(html) {
  const t = String(html ?? "");
  const m = t.match(/Quantity:\s*<\/strong>\s*(\d+)/i) || t.match(/數量[：:]\s*<\/strong>\s*(\d+)/i);
  return m ? m[1] : "1";
}

function guessCondition(html) {
  const t = String(html ?? "");
  const m = t.match(/Condition\s*:\s*<\/strong>\s*([^<]+)/i) || t.match(/條件[：:]\s*<\/strong>\s*([^<]+)/i);
  return m ? m[1].trim().toLowerCase().replace(/\s+/g, "") : "working";
}

function mapSourceRow(row, canonicalSet, useZhCategory) {
  const title = String(row.Title ?? "").trim();
  const desc = String(row.Description ?? "").trim();
  const subRaw = row["Sub Category"] ?? "";
  const enCat = normalizeSubCategory(subRaw, canonicalSet);
  const category = useZhCategory ? toZh(enCat) : enCat;

  const usd = parseNum(row["USD Price"]);
  const twd = parseNum(row["TWD Price"]);
  let priceFormat = "offer";
  let pricePerUnit = "";
  let priceCurrency = "USD";
  if (Number.isFinite(usd) && usd > 0) {
    priceFormat = "buyNow";
    pricePerUnit = String(usd);
    priceCurrency = "USD";
  } else if (Number.isFinite(twd) && twd > 0) {
    priceFormat = "buyNow";
    pricePerUnit = String(twd);
    priceCurrency = "TWD";
  }

  const out = {};
  out.title = title;
  out.category = category;
  out.description = desc;
  out.condition = guessCondition(desc);
  out.operationStatus = "operational";
  out.location = "";
  out.country = "TW";
  out.quantity = guessQuantity(desc);
  out.priceFormat = priceFormat;
  out.pricePerUnit = pricePerUnit;
  out.priceCurrency = priceCurrency;
  out.weightPerUnit = "";
  out.replacementCost = "";
  out.images = "";
  return DATA_COLS.map((k) => out[k] ?? "");
}

function buildFilledWorkbook(catNames, langKey, dataRows) {
  const catSheetName = "Categories";
  const numCats = catNames.length;
  const wb = XLSX.utils.book_new();

  const wsCat = XLSX.utils.aoa_to_sheet([["category"], ...catNames.map((n) => [n])]);
  wsCat["!cols"] = [{ wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsCat, catSheetName);

  const infoRow = [
    `Imported from 101lab-bio-pharma-equipment.xlsx — match category in column B. Language: ${LANG_LABELS[langKey] ?? langKey}`,
    ...Array(DATA_COLS.length - 1).fill(""),
  ];
  const headerRow = DATA_COLS;
  const ws = XLSX.utils.aoa_to_sheet([infoRow, headerRow, ...dataRows]);
  ws["!cols"] = DATA_COLS.map((h) => ({ wch: COL_WIDTHS[h] ?? 18 }));

  const lastDataRow = 2 + Math.max(dataRows.length, 1);
  const endRef = Math.max(lastDataRow, 1000);
  ws["!dataValidations"] = [
    {
      sqref: `B3:B${endRef}`,
      type: "list",
      formula1: `${catSheetName}!$A$2:$A$${numCats + 1}`,
      showDropDown: false,
      error: "Please select a category from the dropdown.",
      errorTitle: "Invalid Category",
      showErrorMessage: true,
    },
    {
      sqref: `I3:I${endRef}`,
      type: "list",
      formula1: '"buyNow,offer"',
      showDropDown: false,
    },
    {
      sqref: `K3:K${endRef}`,
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
  if (!existsSync(SOURCE_XLSX)) {
    console.error("Missing source file:", SOURCE_XLSX);
    process.exit(1);
  }
  if (!existsSync(LAB_JSON)) {
    console.error("Missing lab categories JSON:", LAB_JSON);
    process.exit(1);
  }

  const tree = JSON.parse(readFileSync(LAB_JSON, "utf8")).data;
  const enSubs = flatSubcategoryNames(tree);
  const canonicalSet = new Set(enSubs);
  const zhSubs = enSubs.map((n) => toZh(n));

  const buf = readFileSync(SOURCE_XLSX);
  const wbSrc = XLSX.read(buf, { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json(wbSrc.Sheets[wbSrc.SheetNames[0]], { defval: "" });

  const enRows = [];
  const zhRows = [];
  for (const r of rows) {
    const title = r.Title;
    if (!String(title ?? "").trim()) continue;
    if (containsCjk(title)) zhRows.push(mapSourceRow(r, canonicalSet, true));
    else enRows.push(mapSourceRow(r, canonicalSet, false));
  }

  const outEn = join(REPO_ROOT, "bulk_upload_filled_en.xlsx");
  const outZh = join(REPO_ROOT, "bulk_upload_filled_zh.xlsx");

  XLSX.writeFile(buildFilledWorkbook(enSubs, "en", enRows), outEn);
  XLSX.writeFile(buildFilledWorkbook(zhSubs, "zh", zhRows), outZh);

  console.log("Source:", SOURCE_XLSX);
  console.log("Wrote:", outEn, `(${enRows.length} rows)`);
  console.log("Wrote:", outZh, `(${zhRows.length} rows)`);
}

main();
