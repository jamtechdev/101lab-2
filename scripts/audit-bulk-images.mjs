/**
 * Compares repo root image.xlsx (Title + Images) with a bulk workbook (title + images columns).
 * Reports: matched titles, bulk rows missing URLs in image.xlsx, image.xlsx rows not in bulk.
 *
 * Env (optional, paths relative to Green-Bidz repo root unless absolute):
 *   BULK_XLSX=bulk_upload_industrial_en.xlsx
 *
 * Run: npm run audit:bulk-images
 */

import * as XLSX from "xlsx";
import { readFileSync, existsSync } from "fs";
import { dirname, join, isAbsolute } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");

function resolvePath(envVal, defaultRelative) {
  const p = envVal || defaultRelative;
  return isAbsolute(p) ? p : join(REPO_ROOT, p);
}

function normTitle(s) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function hasHttpUrl(cell) {
  return /https?:\/\//i.test(String(cell ?? ""));
}

function loadImageMap(imagePath) {
  const buf = readFileSync(imagePath);
  const wb = XLSX.read(buf, { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
    defval: "",
  });
  const map = new Map();
  for (const r of rows) {
    const t = normTitle(r.Title);
    if (!t) continue;
    map.set(t, String(r.Images ?? "").trim());
  }
  return map;
}

function findHeaderRow(aoa) {
  return aoa.findIndex((r) =>
    r?.some((c) => String(c).toLowerCase() === "title"),
  );
}

function main() {
  const IMAGE_XLSX = resolvePath(process.env.IMAGE_XLSX, "image.xlsx");
  const BULK_XLSX = resolvePath(
    process.env.BULK_XLSX,
    "bulk_upload_industrial_en.xlsx",
  );

  if (!existsSync(IMAGE_XLSX)) {
    console.error("Missing:", IMAGE_XLSX);
    process.exit(1);
  }
  if (!existsSync(BULK_XLSX)) {
    console.error("Missing:", BULK_XLSX);
    process.exit(1);
  }

  const urlByTitle = loadImageMap(IMAGE_XLSX);
  const bulkBuf = readFileSync(BULK_XLSX);
  const wb = XLSX.read(bulkBuf, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const hi = findHeaderRow(aoa);
  if (hi < 0) {
    console.error("No header row with 'title' in bulk file");
    process.exit(1);
  }
  const headers = aoa[hi].map((h) => String(h).trim());
  const titleCol = headers.findIndex((h) => h.toLowerCase() === "title");
  const imgCol = headers.findIndex((h) => h.toLowerCase() === "images");
  if (titleCol < 0) {
    console.error("No title column");
    process.exit(1);
  }

  const bulkTitles = new Set();
  let missingInImageSheet = [];
  let missingUrlInImage = [];
  let hasUrl = 0;

  for (let r = hi + 1; r < aoa.length; r++) {
    const row = aoa[r];
    if (!row.some((c) => String(c).trim())) continue;
    const title = normTitle(row[titleCol]);
    if (!title) continue;
    bulkTitles.add(title);
    if (!urlByTitle.has(title)) {
      missingInImageSheet.push(row[titleCol]);
      continue;
    }
    const cell = urlByTitle.get(title);
    if (!hasHttpUrl(cell)) {
      missingUrlInImage.push({ title: row[titleCol], cell });
    } else hasUrl++;
  }

  const orphanImageTitles = [];
  for (const t of urlByTitle.keys()) {
    if (!bulkTitles.has(t)) orphanImageTitles.push(t);
  }

  console.log("image.xlsx:", IMAGE_XLSX);
  console.log("bulk file:", BULK_XLSX);
  console.log("");
  console.log("Bulk rows with a matching Title in image.xlsx that have http URL:", hasUrl);
  console.log("Bulk titles with NO row in image.xlsx:", missingInImageSheet.length);
  if (missingInImageSheet.length && missingInImageSheet.length <= 30) {
    for (const t of missingInImageSheet) console.log("  -", t);
  } else if (missingInImageSheet.length) {
    console.log("  (first 20)");
    for (const t of missingInImageSheet.slice(0, 20)) console.log("  -", t);
  }
  console.log(
    "Titles in image.xlsx with empty/non-URL Images cell (matched title):",
    missingUrlInImage.length,
  );
  for (const x of missingUrlInImage.slice(0, 15)) {
    console.log("  -", x.title, "→", JSON.stringify(x.cell).slice(0, 60));
  }
  console.log("Titles in image.xlsx not present in bulk (orphans):", orphanImageTitles.length);
  if (orphanImageTitles.length && orphanImageTitles.length <= 20) {
    for (const t of orphanImageTitles) console.log("  -", t);
  }
}

main();
