/**
 * Run: node generate-test-template.cjs
 * Generates bulk_upload_TEST_50rows.xlsx with 50 sample products
 * and a proper category dropdown from the Categories sheet.
 */
const XLSX = require("xlsx");
const path = require("path");

const SITE_CATEGORIES = [
  { name: "Machining Centers",            slug: "machining-centers" },
  { name: "Lathes (CNC & Conventional)",  slug: "lathes-cnc-conventional" },
  { name: "Milling Machines",             slug: "milling-machines" },
  { name: "Boring & Drilling Machines",   slug: "boring-drilling-machines" },
  { name: "Grinding & Finishing",         slug: "grinding-finishing" },
  { name: "Sawing Machines",              slug: "sawing-machines" },
  { name: "Press Brakes & Shears",        slug: "press-brakes-shears" },
  { name: "Punching & Forging",           slug: "punching-forging" },
  { name: "Laser & Plasma Cutting",       slug: "laser-plasma-cutting" },
  { name: "Welding Equipment",            slug: "welding-equipment" },
  { name: "Scrap",                        slug: "scrap" },
  { name: "Material Handling",            slug: "material-handling" },
];

const PRICE_FORMATS  = ["buyNow", "offer"];
const CURRENCIES     = ["USD", "TWD"];
const CONDITIONS     = ["working", "non-working", "good", "fair"];
const OP_STATUSES    = ["operational", "needs-repair", "for-parts"];
const LOCATIONS      = ["Taipei, Taiwan", "Tokyo, Japan", "Seoul, Korea", "Bangkok, Thailand", "Singapore"];
const COUNTRIES      = ["TW", "JP", "KR", "TH", "SG"];
const MACHINE_NAMES  = [
  "CNC Milling Machine", "Lathe Machine", "Grinding Machine", "Plasma Cutter",
  "Laser Cutter", "Press Brake", "Band Saw", "Drill Press", "Welding Machine",
  "Machining Center", "Boring Machine", "Forging Press", "Material Handler",
  "Scrap Baler", "Hydraulic Shear",
];
const BRANDS = ["Mazak", "Fanuc", "Haas", "DMG Mori", "Okuma", "Mitsubishi", "Trumpf", "AMADA", "Doosan", "Makino"];
const YEARS  = ["2015", "2016", "2017", "2018", "2019", "2020", "2021"];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randNum(min, max) { return String(Math.floor(Math.random() * (max - min + 1)) + min); }

// Build 50 sample rows
const DATA_COLS = [
  "title", "category", "description", "condition", "operationStatus",
  "location", "country", "quantity", "priceFormat", "pricePerUnit",
  "priceCurrency", "weightPerUnit", "replacementCost",
];

const rows = [];
for (let i = 1; i <= 50; i++) {
  const cat    = SITE_CATEGORIES[(i - 1) % SITE_CATEGORIES.length];
  const name   = rand(MACHINE_NAMES);
  const brand  = rand(BRANDS);
  const year   = rand(YEARS);
  const cond   = rand(CONDITIONS);
  const fmt    = rand(PRICE_FORMATS);
  const cur    = rand(CURRENCIES);
  const loc    = LOCATIONS[(i - 1) % LOCATIONS.length];
  const cntry  = COUNTRIES[(i - 1) % COUNTRIES.length];
  const price  = randNum(5000, 80000);
  const weight = randNum(100, 5000);
  const repl   = String(Math.round(parseInt(price) * 1.3));

  rows.push({
    title:            `${brand} ${name} ${year} #${i}`,
    category:         cat.name,   // human-readable name (dropdown value)
    description:      `${brand} ${name}, ${year} model, ${cond} condition. Serial: SN-${1000 + i}. Ready for inspection.`,
    condition:        cond,
    operationStatus:  rand(OP_STATUSES),
    location:         loc,
    country:          cntry,
    quantity:         randNum(1, 5),
    priceFormat:      fmt,
    pricePerUnit:     fmt === "buyNow" ? price : "",
    priceCurrency:    cur,
    weightPerUnit:    weight,
    replacementCost:  repl,
  });
}

const wb = XLSX.utils.book_new();

// ── Categories helper sheet (dropdown source) ──────────────────────────────
const wsCat = XLSX.utils.aoa_to_sheet([
  ["category"],
  ...SITE_CATEGORIES.map((c) => [c.name]),
]);
wsCat["!cols"] = [{ wch: 36 }];
XLSX.utils.book_append_sheet(wb, wsCat, "Categories");

// ── Main Products sheet ────────────────────────────────────────────────────
const infoRow  = [`TEST FILE — 50 sample products. Language: en (English). Fill rows 3+.`,
                  ...Array(DATA_COLS.length - 1).fill("")];
const headerRow = DATA_COLS;
const dataRows  = rows.map((r) => DATA_COLS.map((c) => r[c] ?? ""));

const ws = XLSX.utils.aoa_to_sheet([infoRow, headerRow, ...dataRows]);

const COL_WIDTHS = {
  title: 36, category: 30, description: 50, condition: 14, operationStatus: 16,
  location: 22, country: 10, quantity: 10, priceFormat: 12,
  pricePerUnit: 14, priceCurrency: 12, weightPerUnit: 14, replacementCost: 16,
};
ws["!cols"] = DATA_COLS.map((h) => ({ wch: COL_WIDTHS[h] || 18 }));

// ── Data validations ───────────────────────────────────────────────────────
// category = column B (index 1), data starts at row 3 (Excel row 3)
ws["!dataValidations"] = [
  {
    sqref:            "B3:B1000",
    type:             "list",
    formula1:         `Categories!$A$2:$A$${SITE_CATEGORIES.length + 1}`,
    showDropDown:     false,
    error:            "Please select a category from the dropdown.",
    errorTitle:       "Invalid Category",
    showErrorMessage: true,
  },
  {
    sqref:        "I3:I1000",   // priceFormat
    type:         "list",
    formula1:     '"buyNow,offer"',
    showDropDown: false,
  },
  {
    sqref:        "K3:K1000",   // priceCurrency
    type:         "list",
    formula1:     '"USD,TWD,JPY,THB"',
    showDropDown: false,
  },
];

XLSX.utils.book_append_sheet(wb, ws, "Products");
wb.SheetNames = ["Products", "Categories"];

const outPath = path.join(__dirname, "bulk_upload_TEST_50rows.xlsx");
XLSX.writeFile(wb, outPath);
console.log("✅  Generated:", outPath);
console.log("   Rows:", rows.length);
console.log("   Categories used:", [...new Set(rows.map(r => r.category))].join(", "));
console.log("\n   Open the file and verify:");
console.log("   1. Column B has a dropdown arrow for category");
console.log("   2. Column I has buyNow/offer dropdown");
console.log("   3. Column K has USD/TWD/JPY/THB dropdown");
console.log("   4. 50 data rows filled with sample data");
