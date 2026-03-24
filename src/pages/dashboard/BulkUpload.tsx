import { useState, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useBatchCreateMutation } from "@/rtk/slices/productSlice";
import { useLanguageAwareCategories } from "@/hooks/useLanguageAwareCategories";
import { SITE_TYPE } from "@/config/site";
import { SITE_CATEGORIES } from "@/config/categories";
import { Button } from "@/components/ui/button";
import {
  Upload, Download, CheckCircle2, XCircle, Loader2,
  FileSpreadsheet, ImageIcon, AlertCircle, ChevronRight,
} from "lucide-react";
import i18n from "@/i18n/config";
import DashboardLayout from "@/components/layouts/DashboardLayout";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BulkRow {
  rowNum: number;
  title: string;
  categoryId: string;     // term_id from API — set via dropdown
  categoryName: string;   // display name
  description: string;
  condition: string;      // comma-separated: "working,good"
  operationStatus: string;
  location: string;
  country: string;
  quantity: string;
  priceFormat: string;    // "buyNow" | "offer"
  pricePerUnit: string;
  priceCurrency: string;  // "USD" | "TWD"
  weightPerUnit: string;
  replacementCost: string;
}

type RowStatus = "pending" | "uploading" | "success" | "error";
interface RowResult {
  rowNum: number;
  status: RowStatus;
  message?: string;
  productId?: number;
  batchId?: number;   // each row gets its own batch
}

// ─── Multi-language category names ────────────────────────────────────────────
// Each entry maps to SITE_CATEGORIES by index (same order)
const CATEGORY_TRANSLATIONS: Record<string, string[]> = {
  en: [
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
  ],
  zh: [
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
  ],
  ja: [
    "マシニングセンタ",
    "旋盤（CNC・汎用）",
    "フライス盤",
    "中ぐり・ドリル盤",
    "研削・仕上げ",
    "鋸盤",
    "プレスブレーキ・剪断機",
    "パンチング・鍛造",
    "レーザー・プラズマ切断",
    "溶接機器",
    "スクラップ",
    "マテリアルハンドリング",
  ],
  th: [
    "ศูนย์กลางการกลึง",
    "เครื่องกลึง (CNC และทั่วไป)",
    "เครื่องกัด",
    "เครื่องคว้านและเจาะ",
    "เครื่องเจียรและขัดผิว",
    "เครื่องเลื่อย",
    "เครื่องพับและตัดแผ่นโลหะ",
    "เครื่องปั๊มและตีขึ้นรูป",
    "เครื่องตัดเลเซอร์และพลาสมา",
    "อุปกรณ์เชื่อม",
    "เศษโลหะ",
    "การจัดการวัสดุ",
  ],
};

const LANG_LABELS: Record<string, string> = {
  en: "English",
  zh: "繁體中文",
  ja: "日本語",
  th: "ภาษาไทย",
};

/** Resolve any language's category name → SITE_CATEGORIES slug */
function catNameToSlug(name: string): string | null {
  const n = name.trim().toLowerCase();
  for (const [, names] of Object.entries(CATEGORY_TRANSLATIONS)) {
    const idx = names.findIndex((nm) => nm.toLowerCase() === n);
    if (idx !== -1) return SITE_CATEGORIES[idx].slug;
  }
  // fallback: try slug directly
  const bySlug = SITE_CATEGORIES.find((c) => c.slug === n || c.name.toLowerCase() === n);
  return bySlug?.slug ?? null;
}

// Column order — title first so it feels natural; category second with dropdown
// A=title  B=category  C=description  D=condition  E=operationStatus
// F=location  G=country  H=quantity  I=priceFormat  J=pricePerUnit
// K=priceCurrency  L=weightPerUnit  M=replacementCost
const DATA_COLS = [
  "title", "category", "description", "condition", "operationStatus",
  "location", "country", "quantity",
  "priceFormat", "pricePerUnit", "priceCurrency",
  "weightPerUnit", "replacementCost",
];

const COL_WIDTHS: Record<string, number> = {
  title: 32, category: 28, description: 40, condition: 18, operationStatus: 18,
  location: 24, country: 10, quantity: 10, priceFormat: 12,
  pricePerUnit: 14, priceCurrency: 12, weightPerUnit: 14, replacementCost: 16,
};

const EXAMPLES: Record<string, string> = {
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
};

function downloadTemplate(lang: string = "en") {
  const catNames = CATEGORY_TRANSLATIONS[lang] ?? CATEGORY_TRANSLATIONS.en;
  const catSheetName = `Categories`;   // single sheet with chosen-language names
  const numCats = catNames.length;     // 12
  const wb = XLSX.utils.book_new();

  // ── 1. Categories helper sheet (dropdown source) ──────────────────────────
  // Column A = category names in chosen language
  const wsCat = XLSX.utils.aoa_to_sheet([
    ["category"],  // header (hidden from dropdown range)
    ...catNames.map((n) => [n]),
  ]);
  wsCat["!cols"] = [{ wch: 36 }];
  XLSX.utils.book_append_sheet(wb, wsCat, catSheetName);

  // ── 2. Main Products sheet ────────────────────────────────────────────────
  // Row 1 = info row, Row 2 = headers, Row 3 = example, Row 4+ = data
  const infoRow = [
    `Fill one product per row. Category dropdown is in column B. Language: ${LANG_LABELS[lang] ?? lang}`,
    ...Array(DATA_COLS.length - 1).fill(""),
  ];
  const headerRow = DATA_COLS;
  const exampleRow = DATA_COLS.map((h) =>
    h === "category" ? catNames[2] : (EXAMPLES[h] ?? "")
  );
  const blankRows = Array(50).fill(null).map(() => DATA_COLS.map(() => ""));

  const ws = XLSX.utils.aoa_to_sheet([infoRow, headerRow, exampleRow, ...blankRows]);
  ws["!cols"] = DATA_COLS.map((h) => ({ wch: COL_WIDTHS[h] ?? 18 }));

  // ── 3. Data validations ───────────────────────────────────────────────────
  // Category = column B (index 1), data rows start at row 3 (Excel row 3)
  // Reference the Categories sheet — no char-limit issue unlike inline lists
  (ws as any)["!dataValidations"] = [
    {
      // Category dropdown — uses sheet reference (works for any length)
      sqref: "B3:B1000",
      type: "list",
      formula1: `${catSheetName}!$A$2:$A$${numCats + 1}`,  // A2:A13 (skip header)
      showDropDown: false,
      error: "Please select a category from the dropdown.",
      errorTitle: "Invalid Category",
      showErrorMessage: true,
    },
    {
      // priceFormat = column I (index 8)
      sqref: "I3:I1000",
      type: "list",
      formula1: '"buyNow,offer"',
      showDropDown: false,
    },
    {
      // priceCurrency = column K (index 10)
      sqref: "K3:K1000",
      type: "list",
      formula1: '"USD,TWD,JPY,THB"',
      showDropDown: false,
    },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Products");

  // Products sheet first
  wb.SheetNames = ["Products", catSheetName];

  XLSX.writeFile(wb, `bulk_upload_template_${lang}.xlsx`);
}

interface ParsedRow {
  rowNum: number; categorySlugHint: string; title: string; description: string;
  condition: string; operationStatus: string; location: string; country: string;
  quantity: string; priceFormat: string; pricePerUnit: string; priceCurrency: string;
  weightPerUnit: string; replacementCost: string;
}

function parseSheet(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]]; // always "Products" first
        // Sheet has: row1=lang selector, row2=headers, row3+=data
        const allRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "", header: 1 }) as any[];
        // Find header row (contains "title")
        const headerRowIdx = allRows.findIndex((r: any[]) =>
          r.some((cell: any) => cell?.toString().toLowerCase() === "title")
        );
        if (headerRowIdx === -1) throw new Error("Could not find header row");
        const headers: string[] = allRows[headerRowIdx].map((h: any) => h?.toString().trim() ?? "");
        const dataRows = allRows.slice(headerRowIdx + 1).filter((r: any[]) =>
          r.some((c: any) => c?.toString().trim())
        );

        const colIdx = (name: string) => headers.findIndex((h) => h.toLowerCase() === name.toLowerCase());

        const parsed: ParsedRow[] = dataRows
          .filter((r) => r[colIdx("title")]?.toString().trim())
          .map((r, i) => ({
            rowNum: i + 1,
            categorySlugHint: catNameToSlug(r[colIdx("category")]?.toString() ?? "") ?? "",
            title: r[colIdx("title")]?.toString().trim() ?? "",
            description: r[colIdx("description")]?.toString().trim() ?? "",
            condition: r[colIdx("condition")]?.toString().trim() ?? "",
            operationStatus: r[colIdx("operationStatus")]?.toString().trim() ?? "",
            location: r[colIdx("location")]?.toString().trim() ?? "",
            country: r[colIdx("country")]?.toString().trim() ?? "",
            quantity: r[colIdx("quantity")]?.toString().trim() || "1",
            priceFormat: r[colIdx("priceFormat")]?.toString().trim() || "offer",
            pricePerUnit: r[colIdx("pricePerUnit")]?.toString().trim() ?? "",
            priceCurrency: r[colIdx("priceCurrency")]?.toString().trim() || "USD",
            weightPerUnit: r[colIdx("weightPerUnit")]?.toString().trim() ?? "",
            replacementCost: r[colIdx("replacementCost")]?.toString().trim() ?? "",
          }));
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

/** Group images by row-number prefix: "1_1.jpg" → row 1 */
function groupImagesByRow(files: FileList): Map<number, File[]> {
  const map = new Map<number, File[]>();
  Array.from(files).forEach((f) => {
    const match = f.name.match(/^(\d+)[_\-]/);
    if (!match) return;
    const row = parseInt(match[1], 10);
    if (!map.has(row)) map.set(row, []);
    map.get(row)!.push(f);
  });
  map.forEach((imgs, row) =>
    map.set(row, imgs.sort((a, b) => a.name.localeCompare(b.name)))
  );
  return map;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function BulkUpload() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const lang = i18n.language || "en";
  const userId = localStorage.getItem("userId");
  const baseURL = import.meta.env.VITE_PRODUCTION_URL;
  const [batchCreate] = useBatchCreateMutation();

  // Load API categories silently — needed to resolve term_id for backend
  const { data: catData } = useLanguageAwareCategories();
  const apiCategories: any[] = Array.isArray(catData)
    ? catData
    : (catData as any)?.data ?? [];

  // Match SITE_CATEGORY slug/name → API term_id
  function resolveTermId(slug: string): string {
    const siteCat = SITE_CATEGORIES.find((c) => c.slug === slug);
    if (!siteCat) return slug;
    const matched = apiCategories.find(
      (c: any) =>
        c.slug === siteCat.slug ||
        c.name?.toLowerCase() === siteCat.name.toLowerCase()
    );
    if (matched) {
      return (matched.id ?? matched.term_taxonomy_id ?? matched.term_id)?.toString() ?? slug;
    }
    return slug; // fallback: send slug if API not loaded yet
  }

  const [rows, setRows] = useState<BulkRow[]>([]);
  const [imageMap, setImageMap] = useState<Map<number, File[]>>(new Map());
  const [results, setResults] = useState<RowResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [batchId, setBatchId] = useState<number | null>(null);
  const [csvFileName, setCsvFileName] = useState("");
  const [imageCount, setImageCount] = useState(0);

  const csvRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  // ── Category helpers ────────────────────────────────────────────────────────
  function getCatId(cat: { slug: string }): string {
    return cat.slug; // slug used as select value; resolveTermId maps to term_id on submit
  }

  function updateRowCategory(rowNum: number, slug: string) {
    const matched = apiCategories.find((c) => c.slug === slug);
    setRows((prev) =>
      prev.map((r) =>
        r.rowNum === rowNum
          ? { ...r, categoryId: slug, categoryName: matched?.name || "" }
          : r
      )
    );
  }

  // ── File handlers ───────────────────────────────────────────────────────────
  const handleCsvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    try {
      const parsed = await parseSheet(file);
      setRows(
        parsed.map((r) => {
          // Use category from Excel dropdown if valid, else fall back to first category
          const matched = SITE_CATEGORIES.find((c) => c.slug === r.categorySlugHint);
          const cat = matched ?? SITE_CATEGORIES[0];
          const { categorySlugHint: _hint, ...rest } = r;
          return { ...rest, categoryId: cat.slug, categoryName: cat.name } as BulkRow;
        })
      );
      setResults([]);
      setDone(false);
    } catch {
      alert("Could not parse file. Please use the downloaded template.");
    }
    e.target.value = "";
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setImageMap(groupImagesByRow(files));
    setImageCount(files.length);
  };

  // ── Upload ──────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    const invalid = rows.find((r) => !r.categoryId);
    if (invalid) {
      alert(`Row ${invalid.rowNum}: Please select a category.`);
      return;
    }

    setIsUploading(true);
    setDone(false);
    setResults(rows.map((r) => ({ rowNum: r.rowNum, status: "pending" })));

    let totalBatches = 0;

    for (const row of rows) {
      setResults((prev) =>
        prev.map((r) => (r.rowNum === row.rowNum ? { ...r, status: "uploading" } : r))
      );

      try {
        const formData = new FormData();

        // ── Core fields (identical to UploadMethod.tsx) ──
        formData.append("product_title", row.title);
        formData.append("product_content", row.description);
        formData.append("product_type", "simple");
        formData.append("product_category_ids", resolveTermId(row.categoryId));
        formData.append("category_name", row.categoryName);
        formData.append("seller_name", "seller-name");
        formData.append("post_author_id", userId || "");
        formData.append("steps", "1");
        formData.append("quantity", row.quantity || "1");
        formData.append("country", row.country);
        formData.append("sellerVisible", "true");
        formData.append("weight_per_unit", row.weightPerUnit);
        formData.append("replacement_cost_per_unit", row.replacementCost);
        formData.append("price_now_enabled", row.priceFormat === "buyNow" ? "1" : "0");
        formData.append("price_format", row.priceFormat || "offer");
        formData.append("price_currency", row.priceCurrency || "USD");
        formData.append("price_per_unit", row.priceFormat === "buyNow" ? row.pricePerUnit : "");
        formData.append("allowed_sites[]", SITE_TYPE);

        row.condition.split(",").map((s) => s.trim()).filter(Boolean)
          .forEach((c) => formData.append("item_condition[]", c));
        row.operationStatus.split(",").map((s) => s.trim()).filter(Boolean)
          .forEach((s) => formData.append("operation_status[]", s));
        if (row.location) formData.append("location[]", row.location);

        (imageMap.get(row.rowNum) || []).slice(0, 10)
          .forEach((img) => formData.append("images", img));

        const response = await axios.post(
          `${baseURL}wp/create-product?lang=${lang}&type=${SITE_TYPE}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000 }
        );

        const result = response.data;
        if (!result?.success) throw new Error(result?.message || "Server returned failure");

        const pid = result?.data?.product_id;
        if (!pid) throw new Error("No product ID returned");

        // ── Create a separate batch for this product ──
        let rowBatchId: number | undefined;
        try {
          const batchResult = await batchCreate({
            productIds: [pid],
            sellerId: userId,
            visibility: "PUBLIC",
            type: SITE_TYPE,
            country: row.country || "",
          }).unwrap();
          rowBatchId = batchResult?.data?.batch_id ?? undefined;
          if (rowBatchId) totalBatches++;
        } catch {
          /* batch failed — product still created */
        }

        setResults((prev) =>
          prev.map((r) =>
            r.rowNum === row.rowNum
              ? { ...r, status: "success", productId: pid, batchId: rowBatchId }
              : r
          )
        );
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || "Upload failed";
        setResults((prev) =>
          prev.map((r) => (r.rowNum === row.rowNum ? { ...r, status: "error", message: msg } : r))
        );
      }
    }

    setBatchId(totalBatches);   // reuse state to store total batch count
    setIsUploading(false);
    setDone(true);
  };

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const allCategorySet = rows.length > 0 && rows.every((r) => r.categoryId);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>


      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-5xl">

          {/* Header */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-foreground">Bulk Upload Products</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload multiple products at once using a spreadsheet + photos.
            </p>
          </div>

          <div className="space-y-5">

            {/* ── STEP 1: Template ── */}
            <div className="border border-border rounded-lg p-5 bg-card">
              <StepHeader n={1} title="Download Template" />
              <div className="ml-10 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Fill in one product per row. <strong>Category</strong> is selected after upload via a dropdown — you don't need to type it in the file.
                </p>
                <div className="bg-secondary/50 border border-border rounded-md p-3 text-xs text-muted-foreground space-y-1">
                  <p><strong className="text-foreground">Condition values:</strong> working, non-working, good, fair, poor (comma-separated)</p>
                  <p><strong className="text-foreground">priceFormat:</strong> buyNow or offer</p>
                  <p><strong className="text-foreground">priceCurrency:</strong> USD or TWD</p>
                  <p><strong className="text-foreground">country:</strong> 2-letter code e.g. TW, US, JP</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadTemplate(lang)}>
                  <Download className="h-4 w-4" />
                  Download Template ({LANG_LABELS[lang] ?? lang})
                </Button>
              </div>
            </div>

            {/* ── STEP 2: Upload Spreadsheet ── */}
            <div className="border border-border rounded-lg p-5 bg-card">
              <StepHeader n={2} title="Upload Filled Spreadsheet" />
              <div className="ml-10 space-y-3">
                <input ref={csvRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleCsvChange} />
                <Button
                  variant="outline" size="sm" className="gap-2"
                  onClick={() => csvRef.current?.click()}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {csvFileName || "Choose .xlsx / .csv file"}
                </Button>
                {rows.length > 0 && (
                  <p className="text-sm text-primary font-medium">
                    ✓ {rows.length} product{rows.length !== 1 ? "s" : ""} loaded
                  </p>
                )}
              </div>

              {/* Editable preview table */}
              {rows.length > 0 && (
                <div className="mt-4 ml-10 overflow-x-auto rounded border border-border">
                  <table className="min-w-full text-xs">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium w-8">#</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Title</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium min-w-[180px]">
                          Category <span className="text-destructive">*</span>
                        </th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Qty</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Price</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Country</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Photos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.rowNum} className="border-t border-border hover:bg-secondary/30">
                          <td className="px-3 py-2 text-muted-foreground">{r.rowNum}</td>
                          <td className="px-3 py-2 font-medium text-foreground max-w-[200px] truncate">{r.title}</td>

                          {/* Category dropdown */}
                          <td className="px-3 py-2">
                            <select
                              value={r.categoryId}
                              onChange={(e) => updateRowCategory(r.rowNum, e.target.value)}
                              className={`w-full text-xs border rounded px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary ${!r.categoryId ? "border-destructive" : "border-border"
                                }`}
                            >
                              <option value="">— Select category —</option>
                              {apiCategories.map((cat) => (
                                <option key={getCatId(cat)} value={getCatId(cat)}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="px-3 py-2 text-muted-foreground">{r.quantity}</td>
                          <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                            {r.pricePerUnit ? `${r.priceCurrency} ${r.pricePerUnit}` : r.priceFormat}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{r.country}</td>
                          <td className="px-3 py-2 text-center">
                            {(imageMap.get(r.rowNum)?.length ?? 0) > 0 ? (
                              <span className="text-green-600 font-medium">{imageMap.get(r.rowNum)!.length} ✓</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── STEP 3: Photos ── */}
            <div className="border border-border rounded-lg p-5 bg-card">
              <StepHeader n={3} title={<>Upload Photos <span className="font-normal text-muted-foreground text-sm">(optional)</span></>} />
              <div className="ml-10 space-y-4">

                {/* Option A — Folder (recommended) */}
                <div className="border border-primary/30 rounded-lg p-4 bg-primary/5">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    ⭐ Easiest — Select a Folder
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Create a folder on your computer. Inside it, make subfolders named <strong>1</strong>, <strong>2</strong>, <strong>3</strong>… (matching row numbers). Put photos inside each subfolder — any filename is fine.
                  </p>
                  <div className="bg-background border border-border rounded p-2.5 text-xs text-muted-foreground font-mono mb-3 space-y-0.5">
                    <p>📁 my_products/</p>
                    <p className="pl-4">📁 1/ → row 1 photos (any names)</p>
                    <p className="pl-4">📁 2/ → row 2 photos</p>
                    <p className="pl-4">📁 3/ → row 3 photos</p>
                  </div>
                  {/* webkitdirectory lets user pick a whole folder */}
                  <input
                    ref={folderRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    // @ts-ignore
                    webkitdirectory=""
                    onChange={handleImagesChange}
                  />
                  <Button variant="default" size="sm" className="gap-2" onClick={() => folderRef.current?.click()}>
                    <ImageIcon className="h-4 w-4" />
                    Select Folder
                  </Button>
                </div>

                {/* Option B — Individual files */}
                <div className="border border-border rounded-lg p-4">
                  <p className="text-sm font-medium text-foreground mb-1">Or — Select Individual Files</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Name each photo with its row number prefix: <code className="bg-secondary px-1 rounded">1_1.jpg</code> <code className="bg-secondary px-1 rounded">1_2.jpg</code> <code className="bg-secondary px-1 rounded">2_1.jpg</code> … then select all at once.
                  </p>
                  <input ref={imgRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagesChange} />
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => imgRef.current?.click()}>
                    <ImageIcon className="h-4 w-4" />
                    Select Files
                  </Button>
                </div>

                {imageCount > 0 && (
                  <p className="text-sm text-primary font-medium">✓ {imageCount} photo{imageCount !== 1 ? "s" : ""} loaded</p>
                )}

                {imageMap.size > 0 && (
                  <div className="space-y-1">
                    {Array.from(imageMap.entries()).sort((a, b) => a[0] - b[0]).map(([row, imgs]) => (
                      <div key={row} className="text-xs flex items-center gap-2">
                        <span className="text-foreground font-medium w-12">Row {row}:</span>
                        <span className="text-green-700">{imgs.length} photo{imgs.length !== 1 ? "s" : ""}</span>
                        <span className="text-muted-foreground truncate">{imgs.map((i) => i.name).join(", ")}</span>
                      </div>
                    ))}
                    {rows.filter((r) => !imageMap.has(r.rowNum)).length > 0 && (
                      <div className="flex items-center gap-1.5 text-amber-600 text-xs mt-1">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>
                          No photos for row{rows.filter((r) => !imageMap.has(r.rowNum)).length > 1 ? "s" : ""}&nbsp;
                          {rows.filter((r) => !imageMap.has(r.rowNum)).map((r) => r.rowNum).join(", ")} — will upload without photos
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── STEP 4: Submit ── */}
            {rows.length > 0 && !done && (
              <div className="border border-border rounded-lg p-5 bg-card">
                <StepHeader n={4} title="Start Upload" />
                <div className="ml-10 space-y-3">
                  {!allCategorySet && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      Please select a category for all rows before uploading.
                    </div>
                  )}
                  <Button onClick={handleUpload} disabled={isUploading || !allCategorySet} className="gap-2">
                    {isUploading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
                    ) : (
                      <><Upload className="h-4 w-4" /> Upload {rows.length} Product{rows.length !== 1 ? "s" : ""}</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* ── Progress & Results ── */}
            {results.length > 0 && (
              <div className="border border-border rounded-lg p-5 bg-card">
                <h2 className="font-semibold text-foreground mb-4">
                  Upload Progress
                  {done && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      — {successCount} succeeded{errorCount > 0 ? `, ${errorCount} failed` : ""}
                    </span>
                  )}
                </h2>

                {/* Progress bar */}
                {isUploading && (
                  <div className="mb-4 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(results.filter((r) => r.status !== "pending").length / results.length) * 100}%` }}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  {results.map((r) => {
                    const row = rows.find((row) => row.rowNum === r.rowNum);
                    return (
                      <div
                        key={r.rowNum}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm border ${r.status === "success" ? "bg-green-50 border-green-200 text-green-800" :
                            r.status === "error" ? "bg-red-50 border-red-200 text-red-800" :
                              r.status === "uploading" ? "bg-blue-50 border-blue-200 text-blue-800" :
                                "bg-secondary border-border text-muted-foreground"
                          }`}
                      >
                        {r.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />}
                        {r.status === "success" && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
                        {r.status === "error" && <XCircle className="h-4 w-4 flex-shrink-0" />}
                        {r.status === "pending" && <div className="h-4 w-4 rounded-full border-2 border-current flex-shrink-0" />}

                        <span className="font-medium flex-1 truncate">
                          Row {r.rowNum}: {row?.title}
                        </span>
                        <span className="text-xs opacity-70 flex-shrink-0">
                          {row?.categoryName}
                        </span>
                        {r.status === "success" && r.productId && (
                          <span className="text-xs opacity-60 ml-2 flex-shrink-0">
                            Product #{r.productId}{r.batchId ? ` · Batch #${r.batchId}` : ""}
                          </span>
                        )}
                        {r.status === "error" && r.message && (
                          <span className="text-xs ml-2 flex-shrink-0">{r.message}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {done && (
                  <div className="mt-5 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                    <div>
                      {successCount > 0 ? (
                        <p className="text-sm text-foreground">
                          <CheckCircle2 className="inline h-4 w-4 text-green-600 mr-1" />
                          <strong>{successCount}</strong> product{successCount !== 1 ? "s" : ""} uploaded —&nbsp;
                          <strong>{batchId ?? 0}</strong> batch{(batchId ?? 0) !== 1 ? "es" : ""} created.
                        </p>
                      ) : successCount > 0 ? (
                        <p className="text-sm text-amber-700">
                          <AlertCircle className="inline h-4 w-4 mr-1" />
                          Products created but batch could not be created. Contact support.
                        </p>
                      ) : (
                        <p className="text-sm text-red-700">All uploads failed. Check errors above and try again.</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {batchId && (
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate(`/upload/batch/${batchId}`)}>
                          View Batch <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="sm" onClick={() => navigate("/dashboard/submissions")}>
                        Go to Submissions
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── Small helper ─────────────────────────────────────────────────────────────
function StepHeader({ n, title }: { n: number; title: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">
        {n}
      </span>
      <h2 className="font-semibold text-foreground">{title}</h2>
    </div>
  );
}
