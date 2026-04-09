/**
 * Merges photo URLs from Green-Bidz root `image.xlsx` (column "Images") into a bulk-upload
 * workbook by matching **Title** (case-insensitive, normalized whitespace).
 *
 * Output (repo root): bulk_upload_with_image_urls.xlsx
 *
 * Industrial example:
 *   BULK_XLSX=bulk_upload_industrial_en.xlsx OUT_XLSX=bulk_upload_industrial_with_images.xlsx npm run merge:bulk-images
 *
 * Run: npm run merge:bulk-images
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

/** Env (optional, relative to repo root): IMAGE_XLSX, BULK_XLSX, OUT_XLSX */
const IMAGE_XLSX = resolvePath(process.env.IMAGE_XLSX, "image.xlsx");
const BULK_XLSX = resolvePath(process.env.BULK_XLSX, "bulk_upload_filled_en.xlsx");
const OUT_XLSX = resolvePath(process.env.OUT_XLSX, "bulk_upload_with_image_urls.xlsx");

function normTitle(s) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function dedupeUrls(cell) {
  const raw = String(cell ?? "");
  const parts = raw.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const p of parts) {
    if (!/^https?:\/\//i.test(p)) continue;
    if (seen.has(p)) continue;
    seen.add(p);
    out.push(p);
    if (out.length >= 10) break;
  }
  return out.join(", ");
}

function loadImageMap() {
  const buf = readFileSync(IMAGE_XLSX);
  const wb = XLSX.read(buf, { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
  const map = new Map();
  for (const r of rows) {
    const t = normTitle(r.Title);
    if (!t) continue;
    const urls = dedupeUrls(r.Images);
    if (urls) map.set(t, urls);
  }
  return map;
}

function findHeaderRow(aoa) {
  return aoa.findIndex((r) => r?.some((c) => String(c).toLowerCase() === "title"));
}

function main() {
  if (!existsSync(IMAGE_XLSX)) {
    console.error("Missing:", IMAGE_XLSX);
    process.exit(1);
  }
  if (!existsSync(BULK_XLSX)) {
    console.error("Missing:", BULK_XLSX, "(run convert:bio-pharma-bulk first or point BULK_XLSX in script)");
    process.exit(1);
  }

  const urlByTitle = loadImageMap();
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
  let imgCol = headers.findIndex((h) => h.toLowerCase() === "images");
  if (imgCol < 0) {
    headers.push("images");
    imgCol = headers.length - 1;
    aoa[hi] = headers;
  }

  const titleCol = headers.findIndex((h) => h.toLowerCase() === "title");
  if (titleCol < 0) {
    console.error("No 'title' column in bulk file");
    process.exit(1);
  }

  for (let r = 0; r < aoa.length; r++) {
    const row = aoa[r];
    while (row.length < headers.length) row.push("");
  }

  let matched = 0;
  for (let r = hi + 1; r < aoa.length; r++) {
    const row = aoa[r];
    if (!row.some((c) => String(c).trim())) continue;
    const title = normTitle(row[titleCol]);
    const urls = urlByTitle.get(title);
    if (urls) {
      row[imgCol] = urls;
      matched++;
    }
  }

  const newWs = XLSX.utils.aoa_to_sheet(aoa);
  newWs["!cols"] = headers.map(() => ({ wch: 18 }));
  wb.Sheets[wb.SheetNames[0]] = newWs;

  try {
    XLSX.writeFile(wb, OUT_XLSX);
  } catch (e) {
    if (e?.code === "EBUSY" || e?.errno === -4082) {
      console.error(
        `\nCould not write (file is in use): ${OUT_XLSX}\n` +
          "→ Close it in Excel / Preview, or set OUT_XLSX to a new name, then run again.\n" +
          "  Example: $env:OUT_XLSX=\"bulk_upload_industrial_with_images_v2.xlsx\"\n",
      );
      process.exit(1);
    }
    throw e;
  }
  console.log("Wrote:", OUT_XLSX);
  console.log("Rows with URLs merged:", matched, "(from", urlByTitle.size, "unique titles in image.xlsx)");
}

main();
