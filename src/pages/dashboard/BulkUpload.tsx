import { useState, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format, addDays } from "date-fns";
import { useBatchCreateMutation } from "@/rtk/slices/productSlice";
import { useStartBidMutation } from "@/rtk/slices/bidApiSlice";
import { useLanguageAwareCategories } from "@/hooks/useLanguageAwareCategories";
import { SITE_TYPE } from "@/config/site";
import { SITE_CATEGORIES } from "@/config/categories";
import { Button } from "@/components/ui/button";
import {
  Upload, Download, CheckCircle2, XCircle, Loader2,
  FileSpreadsheet, ImageIcon, AlertCircle, ChevronRight,
  Pencil, Trash2, X, ChevronLeft,
} from "lucide-react";
import i18n from "@/i18n/config";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { pushListingCreatedEvent } from "@/utils/gtm"; 

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
  /** From spreadsheet "images" column; converted to File at upload (browser fetch) */
  imageUrls?: string[];
  auctionGroupId: number | null;  // optional auction group to assign batch to
  // Bidding config
  bidType: "make-offer" | "fixed-price";
  bidPrice: string;
  bidCurrency: string;
  bidStartDate: string;   // ISO date string yyyy-MM-dd
  bidEndDate: string;     // ISO date string yyyy-MM-dd
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
// K=priceCurrency  L=weightPerUnit  M=replacementCost  N=images  O=auctionGroupId
const DATA_COLS = [
  "title", "category", "description", "condition", "operationStatus",
  "location", "country", "quantity",
  "priceFormat", "pricePerUnit", "priceCurrency",
  "weightPerUnit", "replacementCost", "images", "auctionGroupId",
];

const COL_WIDTHS: Record<string, number> = {
  title: 32, category: 28, description: 40, condition: 18, operationStatus: 18,
  location: 24, country: 10, quantity: 10, priceFormat: 12,
  pricePerUnit: 14, priceCurrency: 12, weightPerUnit: 14, replacementCost: 16, images: 50,
  auctionGroupId: 16,
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
  images: "",
  auctionGroupId: "",  // optional, left blank
};

function downloadTemplate(lang: string = "en", labCategories: any[] = []) {
  // Build flat subcategory list from API categories; fall back to hardcoded EN list
  const apiSubcatNames: string[] = labCategories.flatMap((cat: any) =>
    cat.subcategories?.length > 0
      ? cat.subcategories.map((s: any) => s.name)
      : [cat.name]
  );
  const catNames = apiSubcatNames.length > 0
    ? apiSubcatNames
    : (CATEGORY_TRANSLATIONS[lang] ?? CATEGORY_TRANSLATIONS.en);

  const catSheetName = `Categories`;
  const numCats = catNames.length;
  const wb = XLSX.utils.book_new();

  // ── 1. Categories helper sheet (dropdown source) ──────────────────────────
  const wsCat = XLSX.utils.aoa_to_sheet([
    ["category"],
    ...catNames.map((n) => [n]),
  ]);
  wsCat["!cols"] = [{ wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsCat, catSheetName);

  // ── 2. Main Products sheet ────────────────────────────────────────────────
  // Row 1 = info row, Row 2 = headers, Row 3 = example, Row 4+ = data
  const infoRow = [
    `Fill one product per row. Category in B. Optional column "images": comma-separated https URLs (max 10). Language: ${LANG_LABELS[lang] ?? lang}`,
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
  /** Deduped https URLs from optional "images" / "Images" column */
  imageUrls: string[];
  auctionGroupId: number | null;
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
        const imagesCol =
          colIdx("images") >= 0
            ? colIdx("images")
            : headers.findIndex((h) => h.toLowerCase() === "image_urls");

        const parseImageUrls = (cell: unknown): string[] => {
          const raw = cell?.toString() ?? "";
          const parts = raw.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
          const seen = new Set<string>();
          const out: string[] = [];
          for (const p of parts) {
            if (!/^https?:\/\//i.test(p)) continue;
            if (seen.has(p)) continue;
            seen.add(p);
            out.push(p);
            if (out.length >= 10) break;
          }
          return out;
        };

        const parsed: ParsedRow[] = dataRows
          .filter((r) => r[colIdx("title")]?.toString().trim())
          .map((r, i) => {
            const auctionGroupIdStr = r[colIdx("auctionGroupId")]?.toString().trim() ?? "";
            const auctionGroupIdNum = auctionGroupIdStr ? Number(auctionGroupIdStr) : null;
            return {
              rowNum: i + 1,
              // Try slug lookup first; fall back to raw name so new API subcategory names match by name
              categorySlugHint: catNameToSlug(r[colIdx("category")]?.toString() ?? "") ?? r[colIdx("category")]?.toString().trim() ?? "",
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
              imageUrls: imagesCol >= 0 ? parseImageUrls(r[imagesCol]) : [],
              auctionGroupId: isNaN(auctionGroupIdNum as number) ? null : auctionGroupIdNum,
            };
          });
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

/** Fetch remote image URLs as Files for multipart upload (CORS must allow the app origin). */
async function imageUrlsToFiles(urls: string[]): Promise<File[]> {
  const files: File[] = [];
  let i = 0;
  for (const url of urls.slice(0, 10)) {
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) continue;
      const blob = await res.blob();
      if (!blob.size || !blob.type.startsWith("image/")) continue;
      const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : blob.type.includes("gif") ? "gif" : "jpg";
      const name = `url_${i + 1}.${ext}`;
      files.push(new File([blob], name, { type: blob.type }));
      i++;
    } catch {
      /* CORS or network */
    }
  }
  return files;
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
  const [createBid] = useStartBidMutation();

  // Load API categories (LabCategory[] with subcategories) — needed to resolve id for backend
  const { data: catData } = useLanguageAwareCategories();
  const apiCategories = Array.isArray(catData) ? catData : [];

  // Resolve subcategory slug → numeric id for backend submission
  function resolveTermId(slug: string): string {
    for (const cat of apiCategories) {
      if (cat.slug === slug) return String(cat.id ?? slug);
      for (const sub of (cat.subcategories ?? [])) {
        if (sub.slug === slug) return String(sub.id ?? slug);
      }
    }
    return slug;
  }

  const [rows, setRows] = useState<BulkRow[]>([]);
  const [imageMap, setImageMap] = useState<Map<number, File[]>>(new Map());
  const [results, setResults] = useState<RowResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [batchId, setBatchId] = useState<number | null>(null);
  const [csvFileName, setCsvFileName] = useState("");
  const [imageCount, setImageCount] = useState(0);
  // inline per-row photo add
  const [addingPhotoRow, setAddingPhotoRow] = useState<number | null>(null);
  // edit modal
  const [editingRow, setEditingRow] = useState<BulkRow | null>(null);
  // photo lightbox
  const [lightbox, setLightbox] = useState<{ files: File[]; index: number } | null>(null);
  // multi-select
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const csvRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const inlineImgRef = useRef<HTMLInputElement>(null);

  // ── Category helpers ────────────────────────────────────────────────────────
  function findCategoryName(slug: string): string {
    for (const cat of apiCategories) {
      if (cat.slug === slug) return cat.name;
      for (const sub of (cat.subcategories ?? [])) {
        if (sub.slug === slug) return sub.name;
      }
    }
    return "";
  }

  function updateRowCategory(rowNum: number, slug: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.rowNum === rowNum
          ? { ...r, categoryId: slug, categoryName: findCategoryName(slug) }
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
      // Build flat list of all subcategories from API for name→slug matching
      const allSubcats = apiCategories.flatMap((cat: any) =>
        cat.subcategories?.length > 0 ? cat.subcategories : [cat]
      );
      setRows(
        parsed.map((r) => {
          // Match category name from Excel to API subcategory slug
          const bySlugHint = allSubcats.find((c: any) => c.slug === r.categorySlugHint);
          const byName = allSubcats.find(
            (c: any) => c.name?.toLowerCase() === r.categorySlugHint?.toLowerCase()
          );
          const matched = bySlugHint ?? byName ?? allSubcats[0];
          const today = new Date();
          const { categorySlugHint: _hint, imageUrls, ...rest } = r;
          return {
            ...rest,
            categoryId: matched?.slug ?? "",
            categoryName: matched?.name ?? "",
            imageUrls: imageUrls?.length ? imageUrls : undefined,
            bidType: rest.priceFormat === "buyNow" ? "fixed-price" : "make-offer",
            bidPrice: rest.priceFormat === "buyNow" ? rest.pricePerUnit : "",
            bidCurrency: rest.priceCurrency || "USD",
            bidStartDate: format(today, "yyyy-MM-dd"),
            bidEndDate: format(addDays(today, 90), "yyyy-MM-dd"),
          } as BulkRow;
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

  // ── Inline per-row photo helpers ────────────────────────────────────────────
  const openInlinePhotoAdd = (rowNum: number) => {
    setAddingPhotoRow(rowNum);
    setTimeout(() => inlineImgRef.current?.click(), 50);
  };

  const handleInlinePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || addingPhotoRow === null) return;
    const newFiles = Array.from(files);
    setImageMap((prev) => {
      const next = new Map(prev);
      const existing = next.get(addingPhotoRow) ?? [];
      const merged = [...existing, ...newFiles].slice(0, 10); // max 10
      next.set(addingPhotoRow, merged);
      return next;
    });
    setAddingPhotoRow(null);
    e.target.value = "";
  };

  const removeInlinePhoto = (rowNum: number, idx: number) => {
    setImageMap((prev) => {
      const next = new Map(prev);
      const imgs = [...(next.get(rowNum) ?? [])];
      imgs.splice(idx, 1);
      if (imgs.length === 0) next.delete(rowNum);
      else next.set(rowNum, imgs);
      return next;
    });
  };

  // ── Delete / Edit / Multi-select helpers ────────────────────────────────────
  const deleteRows = (rowNums: number[]) => {
    if (!window.confirm(rowNums.length > 1 ? t('bulkUpload.deleteConfirm_other', { count: rowNums.length }) : t('bulkUpload.deleteConfirm_one'))) return;
    setRows((prev) => prev.filter((r) => !rowNums.includes(r.rowNum)));
    setImageMap((prev) => {
      const n = new Map(prev);
      rowNums.forEach((rn) => n.delete(rn));
      return n;
    });
    setSelectedRows((prev) => { const n = new Set(prev); rowNums.forEach((rn) => n.delete(rn)); return n; });
  };

  const toggleSelectRow = (rowNum: number) =>
    setSelectedRows((prev) => { const n = new Set(prev); n.has(rowNum) ? n.delete(rowNum) : n.add(rowNum); return n; });

  const toggleSelectAll = () =>
    setSelectedRows((prev) => prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.rowNum)));

  const saveEditRow = (updated: BulkRow) => {
    setRows((prev) => prev.map((r) => r.rowNum === updated.rowNum ? updated : r));
    setEditingRow(null);
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

        // Send image URLs to backend for server-side download (avoids CORS)
        row.imageUrls?.slice(0, 10).forEach((url) => formData.append("image_urls[]", url));
        // Also append any manually uploaded files
        (imageMap.get(row.rowNum) || []).slice(0, 10).forEach((img) => formData.append("images", img));

        const response = await axios.post(
          `${baseURL}wp/create-product?lang=${lang}&type=${SITE_TYPE}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              "x-platform": "LabGreenbidz",
              "x-system-key": import.meta.env.VITE_X_SYSTEM_KEY || "",
            },
            timeout: 120000,
          }
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
            groupId: row.auctionGroupId || undefined,
          }).unwrap();
          rowBatchId = batchResult?.data?.batch_id ?? undefined;
          if (rowBatchId) {
            totalBatches++;
            // Auto-create bidding config
            try {
              const startDate = row.bidStartDate || format(new Date(), "yyyy-MM-dd");
              const endDate = row.bidEndDate || format(addDays(new Date(), 90), "yyyy-MM-dd");
              await createBid({
                batch_id: rowBatchId,
                type: row.bidType === "fixed-price" ? "fixed_price" : "make_offer",
                start_date: `${startDate} 00:00:00`,
                end_date: `${endDate} 23:59:59`,
                target_price: Number(row.bidPrice) || 0,
                location: row.location || "",
                currency: row.bidCurrency || "USD",
                isHidden: false,
                allowWholePrice: true,
                allowWeightPrice: false,
                taxInclusive: true,
                isAuction: false,
                notes: { required_docs: "", inspection_needed: false },
                language: "en",
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              } as any).unwrap();
            } catch {
              /* bid creation failure is non-blocking */
            }
          }

          // GA4 tracking — listing_created (once per row after batchCreate success)
          try {
            if (rowBatchId) {
              // priceFormat values in bulk: "buyNow" → bidding, "offer" → make_offer
              const dealType: "bidding" | "make_offer" =
                row.priceFormat === "offer" ? "make_offer" : "bidding";
              const imagesCount =
                (row.imageUrls?.length || 0) +
                ((imageMap.get(row.rowNum) || []).length);
              pushListingCreatedEvent({
                listing_id:             rowBatchId,
                listing_title:          row.title ?? "",
                listing_category:       row.categoryName ?? "",
                asking_price:           Number(row.pricePerUnit) || 0,
                deal_type:              dealType,
                images_uploaded:        imagesCount || undefined,
                currency:               row.priceCurrency,
              });
            }
          } catch { /* tracking errors must never affect UX */ }
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
  const totalPhotoCount =
    Array.from(imageMap.values()).reduce((s, a) => s + a.length, 0) +
    rows.reduce((s, r) => s + (r.imageUrls?.length ?? 0), 0);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>


      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">

          {/* Header */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-foreground">{t('bulkUpload.pageTitle')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('bulkUpload.pageSubtitle')}</p>
          </div>

          <div className="space-y-5">

            {/* ── STEP 1: Template ── */}
            <div className="border border-border rounded-lg p-5 bg-card">
              <StepHeader n={1} title={t('bulkUpload.step1Title')} />
              <div className="ml-10 space-y-3">
                <p className="text-sm text-muted-foreground">{t('bulkUpload.step1Desc')}</p>
                <div className="bg-secondary/50 border border-border rounded-md p-3 text-xs text-muted-foreground">
                  <p>{t('bulkUpload.step1Hint')}</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadTemplate(lang, apiCategories)}>
                  <Download className="h-4 w-4" />
                  {t('bulkUpload.downloadBtn')} ({LANG_LABELS[lang] ?? lang})
                </Button>
              </div>
            </div>

            {/* ── STEP 2: Upload Spreadsheet ── */}
            <div className="border border-border rounded-lg p-5 bg-card">
              <StepHeader n={2} title={t('bulkUpload.step2Title')} />
              <div className="ml-10 space-y-3">
                <input ref={csvRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleCsvChange} />
                <Button
                  variant="outline" size="sm" className="gap-2"
                  onClick={() => csvRef.current?.click()}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {csvFileName || t('bulkUpload.chooseFile')}
                </Button>
                {rows.length > 0 && (
                  <p className="text-sm text-primary font-medium">
                    ✓ {t('bulkUpload.productsLoaded_other', { count: rows.length })}
                  </p>
                )}
              </div>

              {/* Editable preview table */}
              {rows.length > 0 && (
                <div className="mt-4 ml-10 overflow-x-auto rounded border border-border">
                  {/* Bulk-action bar — shown when ≥1 row selected */}
                  {selectedRows.size > 0 && (
                    <div className="flex items-center justify-between px-3 py-2 bg-destructive/10 border-b border-destructive/20">
                      <span className="text-xs font-medium text-destructive">
                        {t('bulkUpload.rowsSelected_other', { count: selectedRows.size })}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteRows(Array.from(selectedRows))}
                        className="flex items-center gap-1.5 text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t('bulkUpload.deleteSelected')}
                      </button>
                    </div>
                  )}
                  <table className="min-w-full text-xs">
                    <thead className="bg-secondary">
                      <tr>
                        {/* Select-all checkbox */}
                        <th className="px-3 py-2 w-8">
                          <input
                            type="checkbox"
                            checked={rows.length > 0 && selectedRows.size === rows.length}
                            ref={(el) => { if (el) el.indeterminate = selectedRows.size > 0 && selectedRows.size < rows.length; }}
                            onChange={toggleSelectAll}
                            className="cursor-pointer accent-primary"
                          />
                        </th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium w-8">{t('bulkUpload.colNum')}</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">{t('bulkUpload.colTitle')}</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium min-w-[180px]">
                          {t('bulkUpload.colCategory')} <span className="text-destructive">*</span>
                        </th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">{t('bulkUpload.colQty')}</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">{t('bulkUpload.colPrice')}</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">{t('bulkUpload.colCountry')}</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Group ID</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Bid Config</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">{t('bulkUpload.colPhotos')}</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium w-16">{t('bulkUpload.colActions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.rowNum} className={`border-t border-border hover:bg-secondary/30 ${selectedRows.has(r.rowNum) ? "bg-destructive/5" : ""}`}>
                          <td className="px-3 py-2">
                            <input type="checkbox" checked={selectedRows.has(r.rowNum)} onChange={() => toggleSelectRow(r.rowNum)} className="cursor-pointer accent-primary" />
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{r.rowNum}</td>
                          <td className="px-3 py-2 font-medium text-foreground max-w-[200px] truncate">{r.title}</td>

                          {/* Category dropdown */}
                          <td className="px-3 py-2">
                            <select
                              value={r.categoryId}
                              onChange={(e) => updateRowCategory(r.rowNum, e.target.value)}
                              className={`w-full text-xs border rounded px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary ${!r.categoryId ? "border-destructive" : "border-border"}`}
                            >
                              <option value="">{t('bulkUpload.selectCategory')}</option>
                              {apiCategories.map((cat) => (
                                cat.subcategories?.length > 0 ? (
                                  <optgroup key={cat.slug} label={cat.name}>
                                    {cat.subcategories.map((sub: any) => (
                                      <option key={sub.slug} value={sub.slug}>{sub.name}</option>
                                    ))}
                                  </optgroup>
                                ) : (
                                  <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                                )
                              ))}
                            </select>
                          </td>

                          <td className="px-3 py-2 text-muted-foreground">{r.quantity}</td>
                          <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                            {r.pricePerUnit ? `${r.priceCurrency} ${r.pricePerUnit}` : r.priceFormat}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{r.country}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {r.auctionGroupId ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                                #{r.auctionGroupId}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40 text-[10px]">—</span>
                            )}
                          </td>
                          {/* Bid config cell */}
                          <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${r.bidType === "fixed-price" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                                {r.bidType === "fixed-price" ? "Fixed" : "Make Offer"}
                              </span>
                              {r.bidType === "fixed-price" && r.bidPrice && (
                                <span className="text-[10px] text-foreground">{r.bidCurrency} {r.bidPrice}</span>
                              )}
                              <span className="text-[10px] text-muted-foreground/60">{r.bidStartDate} → {r.bidEndDate}</span>
                            </div>
                          </td>
                          {/* Inline photo upload cell */}
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1 flex-wrap min-w-[120px]">
                              {(imageMap.get(r.rowNum) ?? []).map((file, idx) => (
                                <div key={idx} className="relative group flex-shrink-0">
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    onClick={() => setLightbox({ files: imageMap.get(r.rowNum)!, index: idx })}
                                    className="w-9 h-9 object-cover rounded border border-border cursor-zoom-in hover:opacity-90 transition-opacity"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeInlinePhoto(r.rowNum, idx)}
                                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                    title="Remove photo"
                                  >
                                    <span className="text-[9px] leading-none font-bold">✕</span>
                                  </button>
                                </div>
                              ))}
                              {(imageMap.get(r.rowNum)?.length ?? 0) < 10 && (
                                <button
                                  type="button"
                                  onClick={() => openInlinePhotoAdd(r.rowNum)}
                                  className="w-9 h-9 flex-shrink-0 rounded border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                                  title="Add photos"
                                >
                                  <ImageIcon className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {(r.imageUrls?.length ?? 0) > 0 && (
                                <span className="text-[10px] text-primary whitespace-nowrap" title={r.imageUrls!.join("\n")}>
                                  +{r.imageUrls!.length} URL
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingRow({ ...r })}
                                className="p-1.5 rounded hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
                                title={t('bulkUpload.editRow')}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteRows([r.rowNum])}
                                className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                                title={t('bulkUpload.deleteRow')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
              <StepHeader n={3} title={<>{t('bulkUpload.step3Title')} <span className="font-normal text-muted-foreground text-sm">{t('bulkUpload.step3Optional')}</span></>} />
              <div className="ml-10 space-y-4">

                {/* Option A — Folder (recommended) */}
                <div className="border border-primary/30 rounded-lg p-4 bg-primary/5">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    ⭐ {t('bulkUpload.folderMethodTitle')}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">{t('bulkUpload.folderMethodDesc')}</p>
                  <div className="bg-background border border-border rounded p-2.5 text-xs text-muted-foreground font-mono mb-3 space-y-0.5">
                    <p>{t('bulkUpload.folderDiagram1')}</p>
                    <p className="pl-4">{t('bulkUpload.folderDiagram2')}</p>
                    <p className="pl-4">{t('bulkUpload.folderDiagram3')}</p>
                    <p className="pl-4">{t('bulkUpload.folderDiagram4')}</p>
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
                    {t('bulkUpload.selectFolder')}
                  </Button>
                </div>

                {/* Option B — Individual files */}
                <div className="border border-border rounded-lg p-4">
                  <p className="text-sm font-medium text-foreground mb-1">{t('bulkUpload.flatMethodTitle')}</p>
                  <p className="text-xs text-muted-foreground mb-3">{t('bulkUpload.flatMethodDesc')}</p>
                  <input ref={imgRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagesChange} />
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => imgRef.current?.click()}>
                    <ImageIcon className="h-4 w-4" />
                    {t('bulkUpload.selectFiles')}
                  </Button>
                </div>

                {totalPhotoCount > 0 && (
                  <p className="text-sm text-primary font-medium">{t('bulkUpload.photosLoaded_other', { count: totalPhotoCount })}</p>
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
                <StepHeader n={4} title={t('bulkUpload.step4Title')} />
                <div className="ml-10 space-y-3">
                  {!allCategorySet && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {t('bulkUpload.categoryWarning')}
                    </div>
                  )}
                  <Button onClick={handleUpload} disabled={isUploading || !allCategorySet} className="gap-2">
                    {isUploading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> {t('bulkUpload.uploading')}</>
                    ) : (
                      <><Upload className="h-4 w-4" /> {t('bulkUpload.uploadBtn_other', { count: rows.length })}</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* ── Progress & Results ── */}
            {results.length > 0 && (
              <div className="border border-border rounded-lg p-5 bg-card">
                <h2 className="font-semibold text-foreground mb-4">
                  {t('bulkUpload.progressTitle')}
                  {done && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      — {successCount} {t('bulkUpload.progressSummary', { success: successCount, failed: errorCount > 0 ? t('bulkUpload.progressFailed', { count: errorCount }) : '' })}
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
                          {t('bulkUpload.resultSuccess', { count: successCount, batches: batchId ?? 0 })}
                        </p>
                      ) : errorCount > 0 ? (
                        <p className="text-sm text-amber-700">
                          <AlertCircle className="inline h-4 w-4 mr-1" />
                          {t('bulkUpload.resultBatchFailed')}
                        </p>
                      ) : (
                        <p className="text-sm text-red-700">{t('bulkUpload.resultAllFailed')}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {batchId && (
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate(`/upload/batch/${batchId}`)}>
                          {t('bulkUpload.viewBatch')} <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="sm" onClick={() => navigate("/dashboard/submissions")}>
                        {t('bulkUpload.goToSubmissions')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Hidden input for inline per-row photo add */}
      <input
        ref={inlineImgRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleInlinePhotoAdd}
      />

      {/* ── Edit Row Modal ─────────────────────────────────────────────────── */}
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditingRow(null)}>
          <div
            className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground text-sm">{t('bulkUpload.editModalTitle', { num: editingRow.rowNum })}</h2>
              <button onClick={() => setEditingRow(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Fields */}
            <div className="px-5 py-4 space-y-3">
              {(
                [
                  { key: "title",           label: t('bulkUpload.fieldTitle'),            type: "text" },
                  { key: "description",     label: t('bulkUpload.fieldDescription'),       type: "textarea" },
                  { key: "condition",       label: t('bulkUpload.fieldCondition'),         type: "text", hint: t('bulkUpload.fieldConditionHint') },
                  { key: "operationStatus", label: t('bulkUpload.fieldOperationStatus'),   type: "text", hint: t('bulkUpload.fieldOperationStatusHint') },
                  { key: "location",        label: t('bulkUpload.fieldLocation'),          type: "text", hint: t('bulkUpload.fieldLocationHint') },
                  { key: "country",         label: t('bulkUpload.fieldCountry'),           type: "text", hint: t('bulkUpload.fieldCountryHint') },
                  { key: "quantity",        label: t('bulkUpload.fieldQuantity'),          type: "text" },
                  { key: "priceFormat",     label: t('bulkUpload.fieldPriceFormat'),       type: "select", options: ["buyNow", "offer"] },
                  { key: "pricePerUnit",    label: t('bulkUpload.fieldPricePerUnit'),      type: "text", hint: t('bulkUpload.fieldPricePerUnitHint') },
                  { key: "priceCurrency",   label: t('bulkUpload.fieldCurrency'),          type: "select", options: ["USD", "TWD", "JPY", "THB"] },
                  { key: "weightPerUnit",   label: t('bulkUpload.fieldWeight'),            type: "text" },
                  { key: "replacementCost", label: t('bulkUpload.fieldReplacementCost'),  type: "text" },
                  { key: "bidType",         label: "Bid Type",                             type: "select", options: ["make-offer", "fixed-price"] },
                  { key: "bidPrice",        label: "Bid Price (required if Fixed)",        type: "text", hint: "Leave blank for make-offer" },
                  { key: "bidCurrency",     label: "Bid Currency",                         type: "select", options: ["USD", "TWD", "JPY", "THB"] },
                  { key: "bidStartDate",    label: "Bid Start Date",                       type: "date" },
                  { key: "bidEndDate",      label: "Bid End Date",                         type: "date", hint: "Default: start + 90 days" },
                ] as const
              ).map(({ key, label, type, hint, options }: any) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-foreground mb-1">{label}</label>
                  {type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={(editingRow as any)[key]}
                      onChange={(e) => setEditingRow({ ...editingRow, [key]: e.target.value })}
                      className="w-full text-xs border border-border rounded px-2.5 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  ) : type === "select" ? (
                    <select
                      value={(editingRow as any)[key]}
                      onChange={(e) => setEditingRow({ ...editingRow, [key]: e.target.value })}
                      className="w-full text-xs border border-border rounded px-2.5 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : type === "date" ? (
                    <input
                      type="date"
                      value={(editingRow as any)[key]}
                      onChange={(e) => setEditingRow({ ...editingRow, [key]: e.target.value })}
                      className="w-full text-xs border border-border rounded px-2.5 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <input
                      type="text"
                      value={(editingRow as any)[key]}
                      onChange={(e) => setEditingRow({ ...editingRow, [key]: e.target.value })}
                      className="w-full text-xs border border-border rounded px-2.5 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  )}
                  {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Image URLs (optional)</label>
                <textarea
                  rows={3}
                  placeholder="https://… one per line or comma-separated (max 10)"
                  value={(editingRow.imageUrls ?? []).join("\n")}
                  onChange={(e) => {
                    const parts = e.target.value.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
                    const seen = new Set<string>();
                    const urls: string[] = [];
                    for (const p of parts) {
                      if (!/^https?:\/\//i.test(p)) continue;
                      if (seen.has(p)) continue;
                      seen.add(p);
                      urls.push(p);
                      if (urls.length >= 10) break;
                    }
                    setEditingRow({ ...editingRow, imageUrls: urls.length ? urls : undefined });
                  }}
                  className="w-full text-xs border border-border rounded px-2.5 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">Fetched at upload; needs CORS, or use folder upload with 1_1.jpg naming.</p>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setEditingRow(null)}>{t('bulkUpload.cancel')}</Button>
              <Button size="sm" onClick={() => saveEditRow(editingRow)}>{t('bulkUpload.saveChanges')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Photo Lightbox ─────────────────────────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors z-10"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Prev */}
          {lightbox.files.length > 1 && (
            <button
              className="absolute left-4 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); setLightbox((lb) => lb && { ...lb, index: (lb.index - 1 + lb.files.length) % lb.files.length }); }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Image */}
          <div className="relative max-w-[90vw] max-h-[85vh] flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <img
              src={URL.createObjectURL(lightbox.files[lightbox.index])}
              alt={lightbox.files[lightbox.index].name}
              className="max-w-full max-h-[78vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="flex items-center gap-3">
              <span className="text-white/70 text-xs">{lightbox.files[lightbox.index].name}</span>
              {lightbox.files.length > 1 && (
                <span className="text-white/50 text-xs">{lightbox.index + 1} / {lightbox.files.length}</span>
              )}
            </div>
            {/* Thumbnail strip */}
            {lightbox.files.length > 1 && (
              <div className="flex gap-1.5 flex-wrap justify-center">
                {lightbox.files.map((f, i) => (
                  <img
                    key={i}
                    src={URL.createObjectURL(f)}
                    alt=""
                    onClick={() => setLightbox((lb) => lb && { ...lb, index: i })}
                    className={`w-10 h-10 object-cover rounded cursor-pointer transition-all ${i === lightbox.index ? "ring-2 ring-white opacity-100" : "opacity-50 hover:opacity-80"}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Next */}
          {lightbox.files.length > 1 && (
            <button
              className="absolute right-4 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); setLightbox((lb) => lb && { ...lb, index: (lb.index + 1) % lb.files.length }); }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
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
