/**
 * Reads Green-Bidz repo root: 101machine-industrial-equipment.xlsx (WordPress-style "Products" sheet)
 * and writes **industrial** bulk-upload workbooks (same taxonomy as src/config/categories.ts + BulkUpload.tsx):
 *   - bulk_upload_industrial_en.xlsx  (EN titles + EN categories)
 *   - bulk_upload_industrial_zh.xlsx  (ZH/mixed titles + ZH categories)
 *
 * Rows split by Title: no CJK → EN file; CJK in title → ZH file.
 * Each output has a "Categories" sheet listing the categories for reference/dropdown.
 *
 * Source columns used: Title, Description, Main Category, USD Price, TWD Price, Images
 *
 * Run from 101lab-2: npm run convert:101machine-industrial
 *
 * If Excel has the output files open (EBUSY), either close them or write new names:
 *   $env:OUT_EN="bulk_upload_industrial_en_v2.xlsx"; $env:OUT_ZH="bulk_upload_industrial_zh_v2.xlsx"; npm run convert:101machine-industrial
 */

import * as XLSX from "xlsx";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { dirname, join, isAbsolute } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const SOURCE_XLSX = join(REPO_ROOT, "101machine-industrial-equipment.xlsx");

function resolveOut(envName, defaultFilename) {
  const p = process.env[envName];
  if (!p?.trim()) return join(REPO_ROOT, defaultFilename);
  return isAbsolute(p) ? p : join(REPO_ROOT, p);
}

/** Must match src/config/categories.ts + CATEGORY_TRANSLATIONS en/zh in BulkUpload.tsx */
const EN_NAMES = [
  "Machining Centers",
  "Lathes (CNC & Conventional)",
  "Milling Machines",
  "Boring & Drilling Machines",
  "Grinding & Finishing",
  "Sawing Machines",
  "Press Brakes & Shears",
  "Punching & Forging",
  "Laser & Plasma Cutting",
  "Welding Equipment",
  "Scrap",
  "Material Handling",
];

const ZH_NAMES = [
  "加工中心",
  "車床（CNC 及傳統）",
  "銑床",
  "搪孔及鑽孔機",
  "磨削及精加工",
  "鋸床",
  "折彎機及剪板機",
  "沖壓及鍛造",
  "雷射及電漿切割",
  "焊接設備",
  "廢料",
  "物料搬運",
];

const EN_TO_ZH = Object.fromEntries(EN_NAMES.map((en, i) => [en, ZH_NAMES[i]]));

/** Common WordPress / export variants → canonical EN name */
const SUB_ALIASES = {
  "machining center": "Machining Centers",
  "machining centers": "Machining Centers",
  "cnc machining": "Machining Centers",
  "machining": "Machining Centers",
  lathe: "Lathes (CNC & Conventional)",
  lathes: "Lathes (CNC & Conventional)",
  "cnc lathe": "Lathes (CNC & Conventional)",
  // Source uses "Lathes" (without CNC qualifier) — map it
  "lathes (cnc & conventional)": "Lathes (CNC & Conventional)",
  milling: "Milling Machines",
  "milling machine": "Milling Machines",
  "milling machines": "Milling Machines",
  boring: "Boring & Drilling Machines",
  drilling: "Boring & Drilling Machines",
  "boring & drilling machines": "Boring & Drilling Machines",
  grinding: "Grinding & Finishing",
  "grinding & finishing": "Grinding & Finishing",
  saw: "Sawing Machines",
  sawing: "Sawing Machines",
  "sawing machines": "Sawing Machines",
  "press brake": "Press Brakes & Shears",
  "press brakes & shears": "Press Brakes & Shears",
  shear: "Press Brakes & Shears",
  punching: "Punching & Forging",
  forging: "Punching & Forging",
  "punching & forging": "Punching & Forging",
  laser: "Laser & Plasma Cutting",
  plasma: "Laser & Plasma Cutting",
  "laser & plasma cutting": "Laser & Plasma Cutting",
  welding: "Welding Equipment",
  "welding equipment": "Welding Equipment",
  scrap: "Scrap",
  "material handling": "Material Handling",
  forklift: "Material Handling",
  crane: "Material Handling",
  "machining centers": "Machining Centers",
};

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

function containsCjk(s) {
  return /[\u4e00-\u9fff]/.test(String(s ?? ""));
}

function toZh(en) {
  return EN_TO_ZH[en] ?? en;
}

function flatIndustrialNames() {
  return [...EN_NAMES];
}

function normalizeSubCategory(raw, canonicalSet) {
  let s = String(raw ?? "").trim();
  if (!s) return "";
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/-80°C/gi, "-80C").replace(/−80/g, "-80");
  if (canonicalSet.has(s)) return s;
  const lower = s.toLowerCase().replace(/\s+/g, " ").trim();
  if (SUB_ALIASES[lower]) {
    const c = SUB_ALIASES[lower];
    if (canonicalSet.has(c)) return c;
  }
  for (const c of canonicalSet) {
    if (c.toLowerCase() === lower) return c;
  }
  for (const [alias, canon] of Object.entries(SUB_ALIASES)) {
    if (lower.includes(alias) && canonicalSet.has(canon)) return canon;
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
  const m =
    t.match(/Quantity:\s*<\/strong>\s*(\d+)/i) ||
    t.match(/數量[：:]\s*<\/strong>\s*(\d+)/i);
  return m ? m[1] : "1";
}

function guessCondition(html) {
  const t = String(html ?? "");
  const m =
    t.match(/Condition\s*:\s*<\/strong>\s*([^<]+)/i) ||
    t.match(/條件[：:]\s*<\/strong>\s*([^<]+)/i);
  return m ? m[1].trim().toLowerCase().replace(/\s+/g, "") : "working";
}

function mapSourceRow(row, canonicalSet, useZhCategory) {
  const title = String(row.Title ?? "").trim();
  const desc = String(row.Description ?? "").trim();
  // Source uses "Main Category" column (not "Sub Category")
  const subRaw = row["Main Category"] ?? row["Sub Category"] ?? "";
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
  // Deduplicate image URLs from source (source often has duplicates)
  const rawImages = String(row.Images ?? "").trim();
  if (rawImages) {
    const seen = new Set();
    out.images = rawImages
      .split(/,\s*/)
      .map((u) => u.trim())
      .filter((u) => u && !seen.has(u) && seen.add(u))
      .join(", ");
  } else {
    out.images = "";
  }
  return DATA_COLS.map((k) => out[k] ?? "");
}

function buildFilledWorkbook(catNames, langKey, dataRows) {
  const catSheetName = "Categories";
  const numCats = catNames.length;
  const wb = XLSX.utils.book_new();

  // Categories sheet: column A = category used in Products sheet,
  // column B = EN name, column C = ZH name (for reference)
  const isZh = langKey === "zh";
  const catRows = catNames.map((name, i) => {
    const enName = isZh ? EN_NAMES[i] : name;
    const zhName = isZh ? name : ZH_NAMES[i];
    return [name, enName, zhName];
  });
  const wsCat = XLSX.utils.aoa_to_sheet([
    ["category", "EN Name", "ZH Name"],
    ...catRows,
  ]);
  wsCat["!cols"] = [{ wch: 40 }, { wch: 38 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsCat, catSheetName);

  const infoRow = [
    `Imported from 101machine-industrial-equipment.xlsx — industrial categories (101Machines). Language: ${LANG_LABELS[langKey] ?? langKey}`,
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
    console.error("Place 101machine-industrial-equipment.xlsx at Green-Bidz repo root (next to 101lab-2).");
    process.exit(1);
  }

  const enSubs = flatIndustrialNames();
  const canonicalSet = new Set(enSubs);
  const zhSubs = enSubs.map((n) => toZh(n));

  const buf = readFileSync(SOURCE_XLSX);
  const wbSrc = XLSX.read(buf, { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json(wbSrc.Sheets[wbSrc.SheetNames[0]], {
    defval: "",
  });

  const enRows = [];
  const zhRows = [];
  const reportLines = [];
  for (const r of rows) {
    const title = r.Title;
    if (!String(title ?? "").trim()) continue;
    const subRaw = String(r["Main Category"] ?? r["Sub Category"] ?? "").trim();
    const enCat = normalizeSubCategory(subRaw, canonicalSet);
    if (!canonicalSet.has(enCat)) {
      reportLines.push(
        `UNKNOWN_SUB_CATEGORY\t${String(title).slice(0, 80)}\t"${subRaw}"\t→\t"${enCat}"`,
      );
    }
    if (containsCjk(title)) zhRows.push(mapSourceRow(r, canonicalSet, true));
    else enRows.push(mapSourceRow(r, canonicalSet, false));
  }

  const outEn = resolveOut("OUT_EN", "bulk_upload_industrial_en.xlsx");
  const outZh = resolveOut("OUT_ZH", "bulk_upload_industrial_zh.xlsx");
  const reportPath = join(REPO_ROOT, "bulk_upload_industrial_category_report.txt");

  function writeWorkbook(path, wb) {
    try {
      XLSX.writeFile(wb, path);
    } catch (e) {
      if (e?.code === "EBUSY" || e?.errno === -4082) {
        console.error(
          `\nCould not write (file is in use): ${path}\n` +
            "→ Close it in Excel / Preview, or use new names:\n" +
            '  $env:OUT_EN="bulk_upload_industrial_en_v2.xlsx"; $env:OUT_ZH="bulk_upload_industrial_zh_v2.xlsx"; npm run convert:101machine-industrial\n',
        );
        process.exit(1);
      }
      throw e;
    }
  }

  writeWorkbook(outEn, buildFilledWorkbook(enSubs, "en", enRows));
  writeWorkbook(outZh, buildFilledWorkbook(zhSubs, "zh", zhRows));

  if (reportLines.length) {
    writeFileSync(
      reportPath,
      [
        "Rows where Sub Category did not map cleanly to industrial taxonomy (check manually):",
        "",
        ...reportLines,
      ].join("\n"),
      "utf8",
    );
    console.log("Category warnings:", reportPath, `(${reportLines.length} lines)`);
  }

  console.log("Source:", SOURCE_XLSX);
  console.log("Wrote:", outEn, `(${enRows.length} rows)`);
  console.log("Wrote:", outZh, `(${zhRows.length} rows)`);
  console.log(
    "EN/ZH categories are paired from the same source row (industrial list — not lab/bio taxonomy).",
  );
}

main();
