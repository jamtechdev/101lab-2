import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, X, UploadCloud, Languages, Sparkles, Search } from "lucide-react";
import {
  useGetBatchDetailsQuery,
  useUpdateAdminProductMutation,
  useTranslateAdminProductMutation,
  useUpdateAdminBiddingMutation,
  useAddAdminProductImagesMutation,
  useDeleteAdminProductImageMutation,
  useUpdateProductSeoMutation,
  type BatchDetailsProductImage,
} from "@/rtk/slices/adminApiSlice";
import { useLanguageAwareCategories } from "@/hooks/useLanguageAwareCategories";
import { toastSuccess, toastError } from "@/helper/toasterNotification";
import axiosInstance from "@/rtk/api/axiosInstance";
import { adminApi } from "@/rtk/slices/adminApiSlice";

interface Props {
  batchId: number | null;
  open: boolean;
  onClose: () => void;
}

const LANG_LABELS: Record<string, string> = {
  zh: "Chinese (繁體)",
  ja: "Japanese (日本語)",
  th: "Thai (ภาษาไทย)",
};

const SEO_LANG_LABELS: Record<string, string> = {
  en: "🇺🇸 English",
  zh: "🇹🇼 中文",
  ja: "🇯🇵 日本語",
  th: "🇹🇭 ไทย",
};

const EDITOR_OPTIONS = {
  height: "220",
  buttonList: [
    ["undo", "redo"],
    ["font", "fontSize", "formatBlock"],
    ["bold", "underline", "italic", "strike", "subscript", "superscript"],
    ["fontColor", "hiliteColor"],
    ["removeFormat"],
    ["outdent", "indent"],
    ["align", "horizontalRule", "list", "lineHeight"],
    ["table", "link", "image", "video"],
    ["blockquote", "paragraphStyle", "textStyle"],
    ["fullScreen", "showBlocks", "codeView", "preview", "print"],
  ],
  defaultStyle: "white-space: pre-wrap; word-break: break-word; font-size: 14px; line-height: 1.6;",
  addStyleForCss: "p, span, h1, h2, h3, h4, h5, h6, li, td, th, blockquote { white-space: pre-wrap !important; word-break: break-word; }",
  charCounter: false,
};

// Character counter helper
const CharCount = ({ value, max }: { value: string; max: number }) => (
  <span className={`text-xs ml-auto ${value.length > max ? "text-destructive" : "text-muted-foreground"}`}>
    {value.length}/{max}
  </span>
);

const ICON_CELL = (gradient: string, emoji: string) =>
  `<td style="padding:6px 8px 6px 0;vertical-align:top;width:50px;">` +
  `<div style="width:42px;height:42px;border-radius:12px;background:${gradient};text-align:center;line-height:42px;font-size:18px">${emoji}</div>` +
  `</td>`;

function buildExtraContentHtml(s: {
  manufacturer: string; model: string; serial: string;
  dimensions: string; weight: string; keyFeatures: string;
  rigging: string; loading: string; shipping: string; packaging: string;
}): string {
  const parts: string[] = [];

  // ── Core Specifications table ──────────────────────────────────────────
  const coreRows: string[] = [];

  if (s.manufacturer || s.model || s.serial) {
    let cell = "";
    if (s.manufacturer) cell += `<strong>Manufacturer:</strong> ${s.manufacturer}`;
    if (s.model) cell += `${s.manufacturer ? "<br>" : ""}<strong>Model:</strong> ${s.model}`;
    if (s.serial) cell += `${(s.manufacturer || s.model) ? "<br>" : ""}<strong>Serial Number:</strong> ${s.serial}`;
    coreRows.push(`<tr>${ICON_CELL("linear-gradient(135deg,#f8a5a5,#f67280)", "⚙")}<td style="padding:6px 0;vertical-align:top;"><div>${cell}</div></td></tr>`);
  }

  if (s.dimensions || s.weight) {
    let cell = "";
    if (s.dimensions) cell += `<strong>Dimensions:</strong> ${s.dimensions}`;
    if (s.weight) cell += `${s.dimensions ? "<br>" : ""}<strong>Weight:</strong> ${s.weight}`;
    coreRows.push(`<tr>${ICON_CELL("linear-gradient(135deg,#74b9ff,#0984e3)", "📐")}<td style="padding:6px 0;vertical-align:top;"><div>${cell}</div></td></tr>`);
  }

  if (s.keyFeatures) {
    const items = s.keyFeatures.split("\n").map(f => f.trim()).filter(Boolean);
    const listHtml = items.map(f => `<li style="margin:2px 0;">${f}</li>`).join("");
    coreRows.push(`<tr>${ICON_CELL("linear-gradient(135deg,#a29bfe,#6c5ce7)", "★")}<td style="padding:6px 0;vertical-align:top;"><div><strong>Key Features:</strong><ul style="margin:4px 0 0 0;padding-left:16px;">${listHtml}</ul></div></td></tr>`);
  }

  if (coreRows.length) {
    parts.push(
      `<table style="border-collapse:collapse;width:100%;margin-bottom:12px;">` +
      `<tbody>` +
      `<tr><td colspan="2"><div><strong>Core Specifications</strong></div></td></tr>` +
      coreRows.join("") +
      `</tbody></table>`
    );
  }

  // ── Logistics table ────────────────────────────────────────────────────
  const logRows: string[] = [];

  if (s.rigging) {
    logRows.push(`<tr>${ICON_CELL("linear-gradient(135deg,#b2bec3,#636e72)", "🏗")}<td style="padding:6px 0;vertical-align:top;"><div><strong>Rigging Responsibility:</strong> <span style="color:#00a86b;font-size:12px;">${s.rigging}</span></div></td></tr>`);
  }
  if (s.loading) {
    logRows.push(`<tr>${ICON_CELL("linear-gradient(135deg,#b2bec3,#636e72)", "📦")}<td style="padding:6px 0;vertical-align:top;"><div><strong>Loading Responsibility:</strong> <span style="color:#00a86b;font-size:12px;">${s.loading}</span></div></td></tr>`);
  }
  if (s.shipping) {
    logRows.push(`<tr>${ICON_CELL("linear-gradient(135deg,#b2bec3,#636e72)", "🚛")}<td style="padding:6px 0;vertical-align:top;"><div><strong>Shipping Responsibility:</strong> ${s.shipping} or <span style="font-size:12px;color:#0d6efd;">Get a Quote</span></div></td></tr>`);
  }
  if (s.packaging) {
    logRows.push(`<tr>${ICON_CELL("linear-gradient(135deg,#b2bec3,#636e72)", "📦")}<td style="padding:6px 0;vertical-align:top;"><div><strong>Packaging:</strong> ${s.packaging}</div></td></tr>`);
  }

  if (logRows.length) {
    parts.push(
      `<table style="border-collapse:collapse;width:100%;">` +
      `<tbody>` +
      `<tr><td colspan="2"><div><strong>Logistics</strong></div></td></tr>` +
      logRows.join("") +
      `</tbody></table>`
    );
  }

  return parts.join("");
}

function parseExtraContentToFields(html: string) {
  const result = { manufacturer: "", model: "", serial: "", dimensions: "", weight: "", keyFeatures: "", rigging: "", loading: "", shipping: "", packaging: "" };
  if (!html) return result;
  const doc = new DOMParser().parseFromString(html, "text/html");

  // New styled format: each <tr> has icon cell + content cell
  // Content cell has <strong>Label:</strong> Value pairs (with <br> between them)
  doc.querySelectorAll("tr").forEach((row) => {
    const cells = row.querySelectorAll("td");
    // Skip header rows (colspan=2) and rows with < 2 cells
    if (cells.length < 2) return;
    // Content is in the last td (cells[1] for icon rows)
    const contentCell = cells[cells.length - 1];
    // Extract all strong+value pairs from this cell
    const strongs = Array.from(contentCell.querySelectorAll("strong"));
    strongs.forEach((strong) => {
      const label = strong.textContent?.replace(/:$/, "").trim().toLowerCase() || "";
      // Value = next sibling text nodes until next <strong> or <br>
      let val = "";
      let node = strong.nextSibling;
      while (node) {
        if (node.nodeType === Node.TEXT_NODE) val += node.textContent || "";
        else if ((node as Element).tagName === "BR") break;
        else if ((node as Element).tagName === "STRONG") break;
        else val += (node as Element).textContent || "";
        node = node.nextSibling;
      }
      val = val.replace(/^\s*[–-]\s*/, "").trim();
      if (label === "manufacturer") result.manufacturer = val;
      else if (label === "model") result.model = val;
      else if (label === "serial number") result.serial = val;
      else if (label === "dimensions") result.dimensions = val;
      else if (label === "weight") result.weight = val;
      else if (label === "rigging responsibility") result.rigging = val;
      else if (label === "loading responsibility") result.loading = val;
      else if (label === "shipping responsibility") result.shipping = val.replace(/\s*or\s*get a quote.*/i, "").trim();
      else if (label === "packaging") result.packaging = val;
    });
    // Key Features: parse <ul><li> inside this cell
    const liItems = Array.from(contentCell.querySelectorAll("ul li"))
      .map((li) => li.textContent?.trim()).filter(Boolean);
    if (liItems.length) result.keyFeatures = liItems.join("\n");
  });

  return result;
}

const AdminEditListingDialog = ({ batchId, open, onClose }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { data, isLoading } = useGetBatchDetailsQuery(batchId!, { skip: !batchId || !open });
  const [updateProduct, { isLoading: savingProduct }] = useUpdateAdminProductMutation();
  const [translateProduct, { isLoading: translating }] = useTranslateAdminProductMutation();
  const [updateBidding, { isLoading: savingBidding }] = useUpdateAdminBiddingMutation();
  const [addImages, { isLoading: uploadingImages }] = useAddAdminProductImagesMutation();
  const [deleteImage, { isLoading: deletingImage }] = useDeleteAdminProductImageMutation();
  const [updateProductSeo, { isLoading: savingSeo }] = useUpdateProductSeoMutation();

  const invalidateBatchCache = () => {
    if (batchId) dispatch(adminApi.util.invalidateTags([{ type: "Batches", id: batchId }]));
  };

  const { data: categories } = useLanguageAwareCategories();

  // ── English fields ──────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [extraContent, setExtraContent] = useState("");
  const [condition, setCondition] = useState("");
  const [operationStatus, setOperationStatus] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [parentCategorySlug, setParentCategorySlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");

  // ── Per-language editable fields ────────────────────────────────────────
  const [titleZh, setTitleZh] = useState("");
  const [descriptionZh, setDescriptionZh] = useState("");
  const [extraContentZh, setExtraContentZh] = useState("");
  const [titleJa, setTitleJa] = useState("");
  const [descriptionJa, setDescriptionJa] = useState("");
  const [extraContentJa, setExtraContentJa] = useState("");
  const [titleTh, setTitleTh] = useState("");
  const [descriptionTh, setDescriptionTh] = useState("");
  const [extraContentTh, setExtraContentTh] = useState("");

  // ── Structured extra_content fields (EN only — builds HTML automatically) ──
  const [specManufacturer, setSpecManufacturer] = useState("");
  const [specModel, setSpecModel] = useState("");
  const [specSerial, setSpecSerial] = useState("");
  const [specDimensions, setSpecDimensions] = useState("");
  const [specWeight, setSpecWeight] = useState("");
  const [specKeyFeatures, setSpecKeyFeatures] = useState("");
  const [specRigging, setSpecRigging] = useState("");
  const [specLoading, setSpecLoading] = useState("");
  const [specShipping, setSpecShipping] = useState("");
  const [specPackaging, setSpecPackaging] = useState("");

  // ── Language tab state + SunEditor re-mount keys ────────────────────────
  const [langTab, setLangTab] = useState<"en" | "zh" | "ja" | "th">("en");
  const [translatingLang, setTranslatingLang] = useState<"zh" | "ja" | "th" | null>(null);
  const [zhKey, setZhKey] = useState(0);
  const [jaKey, setJaKey] = useState(0);
  const [thKey, setThKey] = useState(0);
  const [dataLoadKey, setDataLoadKey] = useState(0);

  // ── SEO fields (per language) ───────────────────────────────────────────
  const [seoLangTab, setSeoLangTab] = useState<"en" | "zh" | "ja" | "th">("en");
  // Track each language independently so parallel/sequential generation doesn't conflict
  const [generatingSeoLangs, setGeneratingSeoLangs] = useState<Set<string>>(new Set());

  const [seoTitleEn, setSeoTitleEn] = useState("");
  const [seoDescEn, setSeoDescEn] = useState("");
  const [seoKeywordsEn, setSeoKeywordsEn] = useState("");

  const [seoTitleZh, setSeoTitleZh] = useState("");
  const [seoDescZh, setSeoDescZh] = useState("");
  const [seoKeywordsZh, setSeoKeywordsZh] = useState("");

  const [seoTitleJa, setSeoTitleJa] = useState("");
  const [seoDescJa, setSeoDescJa] = useState("");
  const [seoKeywordsJa, setSeoKeywordsJa] = useState("");

  const [seoTitleTh, setSeoTitleTh] = useState("");
  const [seoDescTh, setSeoDescTh] = useState("");
  const [seoKeywordsTh, setSeoKeywordsTh] = useState("");

  // ── Bidding fields ──────────────────────────────────────────────────────
  const [bidType, setBidType] = useState("make_offer");
  const [bidStartDate, setBidStartDate] = useState("");
  const [bidEndDate, setBidEndDate] = useState("");
  const [bidTargetPrice, setBidTargetPrice] = useState("");
  const [bidCurrency, setBidCurrency] = useState("USD");
  const [bidStatus, setBidStatus] = useState("active");
  const [isAuction, setIsAuction] = useState(false);

  // ── Media state ─────────────────────────────────────────────────────────
  const [existingMedia, setExistingMedia] = useState<BatchDetailsProductImage[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill all fields from fetched data
  useEffect(() => {
    if (!data) return;
    const p = data.data?.products?.[0];
    if (p) {
      setTitle(p.title_en || p.title || "");
      setDescription((p.description_en || p.description || "").replace(/<[^>]*>/g, ""));
      const rawExtra = p.extra_content_en || p.extra_content || "";
      setExtraContent(rawExtra);
      const parsed = parseExtraContentToFields(rawExtra);
      setSpecManufacturer(parsed.manufacturer || p.manufacturer || "");
      setSpecModel(parsed.model || p.model || "");
      setSpecSerial(parsed.serial || p.serial_number || "");
      setSpecDimensions(parsed.dimensions || p.dimensions || "");
      setSpecWeight(parsed.weight || p.weight || "");
      setSpecKeyFeatures(parsed.keyFeatures);
      setSpecRigging(parsed.rigging || p.rigging_responsibility || "");
      setSpecLoading(parsed.loading || p.loading_responsibility || "");
      setSpecShipping(parsed.shipping || p.shipping_responsibility || "");
      setSpecPackaging(parsed.packaging || p.packaging_type || "");
      setExistingMedia(p.images || []);

      setTitleZh(p.title_zh || "");
      setDescriptionZh(p.description_zh || "");
      setExtraContentZh(p.extra_content_zh || "");
      setTitleJa(p.title_ja || "");
      setDescriptionJa(p.description_ja || "");
      setExtraContentJa(p.extra_content_ja || "");
      setTitleTh(p.title_th || "");
      setDescriptionTh(p.description_th || "");
      setExtraContentTh(p.extra_content_th || "");
      setDataLoadKey((k) => k + 1);

      if (p.condition) setCondition(p.condition);
      if (p.operation_status) setOperationStatus(p.operation_status);
      if (p.quantity) setQuantity(String(p.quantity));

      // SEO fields
      setSeoTitleEn(p.seo_title || "");
      setSeoDescEn(p.seo_description || "");
      setSeoKeywordsEn(p.seo_keywords || "");
      setSeoTitleZh(p.seo_title_zh || "");
      setSeoDescZh(p.seo_description_zh || "");
      setSeoKeywordsZh(p.seo_keywords_zh || "");
      setSeoTitleJa(p.seo_title_ja || "");
      setSeoDescJa(p.seo_description_ja || "");
      setSeoKeywordsJa(p.seo_keywords_ja || "");
      setSeoTitleTh(p.seo_title_th || "");
      setSeoDescTh(p.seo_description_th || "");
      setSeoKeywordsTh(p.seo_keywords_th || "");
    }
    const b = data.data?.bidding;
    if (b) {
      setBidType(b.type || "make_offer");
      setBidStartDate(b.start_date ? b.start_date.split("T")[0] : "");
      setBidEndDate(b.end_date ? b.end_date.split("T")[0] : "");
      setBidTargetPrice(b.target_price ?? "");
      setBidCurrency(b.currency || "USD");
      setBidStatus(b.status || "active");
      setIsAuction(b.isAuction ?? false);
    }
  }, [data]);

  // Pre-fill category
  useEffect(() => {
    if (!data || !categories.length) return;
    const existingId = data.data?.products?.[0]?.category_ids?.[0];
    if (!existingId) return;
    for (const parent of categories) {
      const sub = parent.subcategories?.find((s) => s.id === existingId);
      if (sub) {
        setParentCategorySlug(parent.slug);
        setCategoryId(String(sub.id));
        setCategoryName(sub.name);
        return;
      }
      if (parent.id === existingId) {
        setParentCategorySlug(parent.slug);
        setCategoryId(String(parent.id));
        setCategoryName(parent.name);
        return;
      }
    }
  }, [data, categories]);

  // Clean up on close
  useEffect(() => {
    if (!open) {
      pendingPreviews.forEach((p) => URL.revokeObjectURL(p));
      setPendingFiles([]);
      setPendingPreviews([]);
      setLangTab("en");
      setSeoLangTab("en");
      setTranslatingLang(null);
      setGeneratingSeoLangs(new Set());
    }
  }, [open]);

  const productId = data?.data?.products?.[0]?.product_id;

  // Translate all languages at once
  const handleTranslateAll = async () => {
    if (!title.trim()) { toastError("Please enter a title before translating"); return; }
    try {
      const builtHtmlForTranslate = buildExtraContentHtml({ manufacturer: specManufacturer, model: specModel, serial: specSerial, dimensions: specDimensions, weight: specWeight, keyFeatures: specKeyFeatures, rigging: specRigging, loading: specLoading, shipping: specShipping, packaging: specPackaging });
      const res = await translateProduct({ title, description, extra_content: builtHtmlForTranslate }).unwrap();
      const d = res.data;
      setTitleZh(d.title_zh); setDescriptionZh(d.description_zh); setExtraContentZh(d.extra_content_zh);
      setTitleJa(d.title_ja); setDescriptionJa(d.description_ja); setExtraContentJa(d.extra_content_ja);
      setTitleTh(d.title_th); setDescriptionTh(d.description_th); setExtraContentTh(d.extra_content_th);
      setZhKey((k) => k + 1); setJaKey((k) => k + 1); setThKey((k) => k + 1);
      toastSuccess("Translated into Chinese, Japanese and Thai");
    } catch (err: any) {
      toastError(err?.data?.message || "Translation failed");
    }
  };

  // Translate a single language
  const handleTranslateLang = async (lang: "zh" | "ja" | "th") => {
    if (!title.trim()) { toastError("Please enter a title before translating"); return; }
    setTranslatingLang(lang);
    try {
      const builtHtmlForTranslate = buildExtraContentHtml({ manufacturer: specManufacturer, model: specModel, serial: specSerial, dimensions: specDimensions, weight: specWeight, keyFeatures: specKeyFeatures, rigging: specRigging, loading: specLoading, shipping: specShipping, packaging: specPackaging });
      const res = await translateProduct({ title, description, extra_content: builtHtmlForTranslate }).unwrap();
      const d = res.data;
      if (lang === "zh") { setTitleZh(d.title_zh); setDescriptionZh(d.description_zh); setExtraContentZh(d.extra_content_zh); setZhKey((k) => k + 1); }
      if (lang === "ja") { setTitleJa(d.title_ja); setDescriptionJa(d.description_ja); setExtraContentJa(d.extra_content_ja); setJaKey((k) => k + 1); }
      if (lang === "th") { setTitleTh(d.title_th); setDescriptionTh(d.description_th); setExtraContentTh(d.extra_content_th); setThKey((k) => k + 1); }
      toastSuccess(`Generated ${LANG_LABELS[lang]} content`);
    } catch (err: any) {
      toastError(err?.data?.message || "Translation failed");
    } finally {
      setTranslatingLang(null);
    }
  };

  // Generate SEO for a specific language, set state, and auto-save to backend.
  // Returns the generated fields so callers can batch-save across languages.
  const generateSeoForLang = async (lang: "en" | "zh" | "ja" | "th") => {
    const langTitle = lang === "zh" ? (titleZh || title)
      : lang === "ja" ? (titleJa || title)
      : lang === "th" ? (titleTh || title)
      : title;
    const langDesc = lang === "zh" ? (descriptionZh || description)
      : lang === "ja" ? (descriptionJa || description)
      : lang === "th" ? (descriptionTh || description)
      : description;

    const res = await axiosInstance.post("seo/generate", {
      title: langTitle,
      description: langDesc,
      category: categoryName || undefined,
      type: "product",
      lang,
    });

    if (!res.data?.success || !res.data?.data) throw new Error("SEO generation returned no data");
    return res.data.data as { seo_title: string; seo_description: string; seo_keywords: string };
  };

  // Generate for one language, update state, and immediately save that language to backend
  const handleGenerateSeo = async (lang: "en" | "zh" | "ja" | "th") => {
    if (!title.trim()) { toastError("Please enter a title first"); return; }
    if (!productId) return;

    setGeneratingSeoLangs((prev) => new Set(prev).add(lang));
    try {
      const { seo_title, seo_description, seo_keywords } = await generateSeoForLang(lang);

      // Update local state
      if (lang === "en") { setSeoTitleEn(seo_title); setSeoDescEn(seo_description); setSeoKeywordsEn(seo_keywords); }
      if (lang === "zh") { setSeoTitleZh(seo_title); setSeoDescZh(seo_description); setSeoKeywordsZh(seo_keywords); }
      if (lang === "ja") { setSeoTitleJa(seo_title); setSeoDescJa(seo_description); setSeoKeywordsJa(seo_keywords); }
      if (lang === "th") { setSeoTitleTh(seo_title); setSeoDescTh(seo_description); setSeoKeywordsTh(seo_keywords); }

      // Auto-save this language to backend immediately
      await axiosInstance.patch(`product/${productId}/seo`, {
        [`seo_title${lang === "en" ? "" : `_${lang}`}`]: seo_title,
        [`seo_description${lang === "en" ? "" : `_${lang}`}`]: seo_description,
        [`seo_keywords${lang === "en" ? "" : `_${lang}`}`]: seo_keywords,
      });
      invalidateBatchCache();

      toastSuccess(`SEO generated & saved for ${SEO_LANG_LABELS[lang]}`);
    } catch (err: any) {
      toastError(err?.response?.data?.message || `Failed to generate SEO for ${SEO_LANG_LABELS[lang]}`);
    } finally {
      setGeneratingSeoLangs((prev) => { const s = new Set(prev); s.delete(lang); return s; });
    }
  };

  // Generate all 4 languages in one request, then save all to backend
  const handleGenerateAllSeo = async () => {
    if (!title.trim()) { toastError("Please enter a title first"); return; }
    if (!productId) return;

    setGeneratingSeoLangs(new Set(["en", "zh", "ja", "th"]));
    try {
      const res = await axiosInstance.post("seo/generate-all", {
        title,
        description,
        category: categoryName || undefined,
        type: "product",
        titles: { zh: titleZh || title, ja: titleJa || title, th: titleTh || title },
        descriptions: { zh: descriptionZh || description, ja: descriptionJa || description, th: descriptionTh || description },
      });

      if (!res.data?.success || !res.data?.data) throw new Error("No data returned");

      const { en, zh, ja, th } = res.data.data;

      if (en) { setSeoTitleEn(en.seo_title); setSeoDescEn(en.seo_description); setSeoKeywordsEn(en.seo_keywords); }
      if (zh) { setSeoTitleZh(zh.seo_title); setSeoDescZh(zh.seo_description); setSeoKeywordsZh(zh.seo_keywords); }
      if (ja) { setSeoTitleJa(ja.seo_title); setSeoDescJa(ja.seo_description); setSeoKeywordsJa(ja.seo_keywords); }
      if (th) { setSeoTitleTh(th.seo_title); setSeoDescTh(th.seo_description); setSeoKeywordsTh(th.seo_keywords); }

      // Save all languages to backend in one PATCH
      await axiosInstance.patch(`product/${productId}/seo`, {
        ...(en ? { seo_title: en.seo_title, seo_description: en.seo_description, seo_keywords: en.seo_keywords } : {}),
        ...(zh ? { seo_title_zh: zh.seo_title, seo_description_zh: zh.seo_description, seo_keywords_zh: zh.seo_keywords } : {}),
        ...(ja ? { seo_title_ja: ja.seo_title, seo_description_ja: ja.seo_description, seo_keywords_ja: ja.seo_keywords } : {}),
        ...(th ? { seo_title_th: th.seo_title, seo_description_th: th.seo_description, seo_keywords_th: th.seo_keywords } : {}),
      });
      invalidateBatchCache();
      toastSuccess("All language SEO generated & saved");
    } catch (err: any) {
      toastError(err?.response?.data?.message || "Failed to generate SEO for all languages");
    } finally {
      setGeneratingSeoLangs(new Set());
    }
  };

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (!arr.length) return;
    const newPreviews = arr.map((f) => URL.createObjectURL(f));
    setPendingFiles((prev) => [...prev, ...arr]);
    setPendingPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePending = (index: number) => {
    URL.revokeObjectURL(pendingPreviews[index]);
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    setPendingPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExisting = async (img: BatchDetailsProductImage) => {
    if (!productId) return;
    try {
      await deleteImage({ productId, attachmentId: img.id }).unwrap();
      setExistingMedia((prev) => prev.filter((m) => m.id !== img.id));
    } catch (err: any) {
      toastError(err?.data?.message || "Failed to delete media");
    }
  };

  const handleUploadPending = async () => {
    if (!productId || !pendingFiles.length) return;
    const formData = new FormData();
    pendingFiles.forEach((f) => formData.append("media", f));
    try {
      const res = await addImages({ productId, formData }).unwrap();
      setExistingMedia((prev) => [...prev, ...res.data]);
      pendingPreviews.forEach((p) => URL.revokeObjectURL(p));
      setPendingFiles([]);
      setPendingPreviews([]);
      toastSuccess("Media uploaded");
    } catch (err: any) {
      toastError(err?.data?.message || "Failed to upload media");
    }
  };

  const handleSaveProduct = async () => {
    if (!productId) return;
    try {
      const body: Record<string, unknown> = { title, description, quantity };
      if (condition) body.condition = condition;
      if (operationStatus) body.operation_status = operationStatus;
      if (categoryId) { body.category_id = parseInt(categoryId); body.category_name = categoryName; }

      body.title_en = title;
      body.description_en = description;
      const builtHtml = buildExtraContentHtml({
        manufacturer: specManufacturer, model: specModel, serial: specSerial,
        dimensions: specDimensions, weight: specWeight, keyFeatures: specKeyFeatures,
        rigging: specRigging, loading: specLoading, shipping: specShipping, packaging: specPackaging,
      });
      body.extra_content = builtHtml;
      body.extra_content_en = builtHtml;

      body.title_zh = titleZh;
      body.description_zh = descriptionZh;
      body.extra_content_zh = extraContentZh;
      body.title_ja = titleJa;
      body.description_ja = descriptionJa;
      body.extra_content_ja = extraContentJa;
      body.title_th = titleTh;
      body.description_th = descriptionTh;
      body.extra_content_th = extraContentTh;

      // SEO fields (all languages)
      body.seo_title = seoTitleEn;
      body.seo_description = seoDescEn;
      body.seo_keywords = seoKeywordsEn;
      body.seo_title_zh = seoTitleZh;
      body.seo_description_zh = seoDescZh;
      body.seo_keywords_zh = seoKeywordsZh;
      body.seo_title_ja = seoTitleJa;
      body.seo_description_ja = seoDescJa;
      body.seo_keywords_ja = seoKeywordsJa;
      body.seo_title_th = seoTitleTh;
      body.seo_description_th = seoDescTh;
      body.seo_keywords_th = seoKeywordsTh;

      await updateProduct({ productId, body }).unwrap();
      toastSuccess(t("admin.edit.productSaved", "Product updated"));
      onClose();
    } catch (err: any) {
      toastError(err?.data?.message || "Failed to update product");
    }
  };

  const handleSaveSeo = async () => {
    if (!productId) return;
    try {
      await updateProductSeo({
        productId,
        batchId: batchId!,
        body: {
          seo_title: seoTitleEn,
          seo_description: seoDescEn,
          seo_keywords: seoKeywordsEn,
          seo_title_zh: seoTitleZh,
          seo_description_zh: seoDescZh,
          seo_keywords_zh: seoKeywordsZh,
          seo_title_ja: seoTitleJa,
          seo_description_ja: seoDescJa,
          seo_keywords_ja: seoKeywordsJa,
          seo_title_th: seoTitleTh,
          seo_description_th: seoDescTh,
          seo_keywords_th: seoKeywordsTh,
        },
      }).unwrap();
      toastSuccess(t("admin.edit.seoSaved", "SEO saved"));
      onClose();
    } catch (err: any) {
      toastError(err?.data?.message || "Failed to save SEO");
    }
  };

  const handleSaveBidding = async () => {
    if (!batchId) return;
    try {
      const body: Record<string, unknown> = {
        type: bidType,
        start_date: bidStartDate,
        end_date: bidEndDate,
        currency: bidCurrency,
        status: bidStatus,
        isAuction,
      };
      if (bidType === "fixed_price" && bidTargetPrice)
        body.target_price = parseFloat(bidTargetPrice);

      await updateBidding({ batchId, body }).unwrap();
      toastSuccess(t("admin.edit.biddingSaved", "Bidding updated"));
      onClose();
    } catch (err: any) {
      toastError(err?.data?.message || "Failed to update bidding");
    }
  };

  // ── Reusable SEO fields for one language ───────────────────────────────
  const SeoFields = ({
    lang,
    seoTitle, setSeoTitle,
    seoDesc, setSeoDesc,
    seoKeywords, setSeoKeywords,
  }: {
    lang: "en" | "zh" | "ja" | "th";
    seoTitle: string; setSeoTitle: (v: string) => void;
    seoDesc: string; setSeoDesc: (v: string) => void;
    seoKeywords: string; setSeoKeywords: (v: string) => void;
  }) => {
    const isGenerating = generatingSeoLangs.has(lang);
    const anyGenerating = generatingSeoLangs.size > 0;
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {lang === "en"
              ? "SEO metadata for English pages."
              : `SEO metadata for ${SEO_LANG_LABELS[lang]} pages. Falls back to English if empty.`}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleGenerateSeo(lang)}
            disabled={anyGenerating}
            className="gap-1.5 h-7 text-xs shrink-0 ml-2"
          >
            {isGenerating
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Sparkles className="h-3 w-3" />}
            {isGenerating ? "Generating…" : "Generate with AI"}
          </Button>
        </div>

        {/* SEO Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Label className="text-xs">SEO Title</Label>
            <CharCount value={seoTitle} max={60} />
          </div>
          <Input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            placeholder="Page title shown in search results (50–60 chars ideal)"
            maxLength={80}
          />
          {seoTitle && (
            <div className="mt-1.5 px-3 py-2 rounded-md bg-muted/40 border border-border/50">
              <p className="text-[11px] text-muted-foreground mb-0.5">Preview</p>
              <p className="text-[13px] text-blue-600 dark:text-blue-400 font-medium leading-snug line-clamp-1">{seoTitle}</p>
            </div>
          )}
        </div>

        {/* SEO Description */}
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Label className="text-xs">SEO Description</Label>
            <CharCount value={seoDesc} max={160} />
          </div>
          <Textarea
            value={seoDesc}
            onChange={(e) => setSeoDesc(e.target.value)}
            rows={3}
            placeholder="Snippet shown under the title in search results (120–160 chars ideal)"
            maxLength={200}
          />
          {seoDesc && (
            <div className="mt-1.5 px-3 py-2 rounded-md bg-muted/40 border border-border/50">
              <p className="text-[11px] text-muted-foreground mb-0.5">Preview</p>
              <p className="text-[12px] text-muted-foreground leading-snug line-clamp-2">{seoDesc}</p>
            </div>
          )}
        </div>

        {/* SEO Keywords */}
        <div className="space-y-1">
          <Label className="text-xs">Keywords</Label>
          <Input
            value={seoKeywords}
            onChange={(e) => setSeoKeywords(e.target.value)}
            placeholder="comma, separated, keywords"
          />
          {seoKeywords && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {seoKeywords.split(",").map((kw, i) => {
                const k = kw.trim();
                return k ? (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 text-xs">
                    {k}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("admin.edit.title", "Edit Listing")}
            {batchId ? ` — Batch #${batchId}` : ""}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="product">
            <TabsList className="w-full">
              <TabsTrigger value="product" className="flex-1">
                {t("admin.edit.tabProduct", "Product")}
              </TabsTrigger>
              <TabsTrigger value="media" className="flex-1">
                {t("admin.edit.tabMedia", "Photos & Videos")}
              </TabsTrigger>
              <TabsTrigger value="bidding" className="flex-1">
                {t("admin.edit.tabBidding", "Bidding")}
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex-1 gap-1.5">
                <Search className="h-3.5 w-3.5" />
                {t("admin.edit.tabSeo", "SEO")}
              </TabsTrigger>
            </TabsList>

            {/* ── Product tab ─────────────────────────────────────────── */}
            <TabsContent value="product" className="space-y-4 mt-4">

              {/* Language sub-tabs for content editing */}
              <div className="border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Content Language
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTranslateAll}
                    disabled={translating || !title.trim()}
                    className="gap-1.5 h-7 text-xs"
                  >
                    {translating && !translatingLang
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <Languages className="h-3 w-3" />}
                    {translating && !translatingLang ? "Translating…" : "Translate All with AI"}
                  </Button>
                </div>

                <Tabs value={langTab} onValueChange={(v) => setLangTab(v as typeof langTab)}>
                  <TabsList className="w-full rounded-none border-b bg-muted/20 h-9">
                    <TabsTrigger value="en" className="flex-1 text-xs h-8">🇺🇸 English</TabsTrigger>
                    <TabsTrigger value="zh" className="flex-1 text-xs h-8">🇹🇼 中文</TabsTrigger>
                    <TabsTrigger value="ja" className="flex-1 text-xs h-8">🇯🇵 日本語</TabsTrigger>
                    <TabsTrigger value="th" className="flex-1 text-xs h-8">🇹🇭 ไทย</TabsTrigger>
                  </TabsList>

                  {/* English */}
                  <TabsContent value="en" className="p-4 space-y-3 mt-0">
                    <div className="space-y-1">
                      <Label className="text-xs">Title</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter title in English"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Enter description in English"
                      />
                    </div>
                    <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Core Specifications</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Manufacturer</Label>
                          <Input value={specManufacturer} onChange={(e) => setSpecManufacturer(e.target.value)} placeholder="e.g. CAPP" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Model</Label>
                          <Input value={specModel} onChange={(e) => setSpecModel(e.target.value)} placeholder="e.g. 2-1000 µL" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Serial Number</Label>
                          <Input value={specSerial} onChange={(e) => setSpecSerial(e.target.value)} placeholder="e.g. Not Specified" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Dimensions</Label>
                          <Input value={specDimensions} onChange={(e) => setSpecDimensions(e.target.value)} placeholder="e.g. 11.02 × 2.87 × 1.69 inches" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Weight</Label>
                          <Input value={specWeight} onChange={(e) => setSpecWeight(e.target.value)} placeholder="e.g. 0.5 kg" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Key Features <span className="text-muted-foreground font-normal">(one per line)</span></Label>
                        <Textarea value={specKeyFeatures} onChange={(e) => setSpecKeyFeatures(e.target.value)} rows={3} placeholder={"High flow rates\nUniform media distribution\nExcellent scalability"} />
                      </div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">Logistics</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Rigging Responsibility</Label>
                          <Input value={specRigging} onChange={(e) => setSpecRigging(e.target.value)} placeholder="e.g. Buyer" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Loading Responsibility</Label>
                          <Input value={specLoading} onChange={(e) => setSpecLoading(e.target.value)} placeholder="e.g. Buyer" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Shipping Responsibility</Label>
                          <Input value={specShipping} onChange={(e) => setSpecShipping(e.target.value)} placeholder="e.g. Buyer" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Packaging Type</Label>
                          <Input value={specPackaging} onChange={(e) => setSpecPackaging(e.target.value)} placeholder="e.g. 10 Piece" />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Chinese */}
                  <TabsContent value="zh" className="p-4 space-y-3 mt-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Edit Chinese content directly, or generate from English using AI.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleTranslateLang("zh")}
                        disabled={translating || !title.trim()}
                        className="gap-1.5 h-7 text-xs shrink-0 ml-2"
                      >
                        {translatingLang === "zh"
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <Languages className="h-3 w-3" />}
                        {translatingLang === "zh" ? "Generating…" : "Generate from English"}
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Title (Chinese)</Label>
                      <Input value={titleZh} onChange={(e) => setTitleZh(e.target.value)} placeholder="Chinese title…" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description (Chinese)</Label>
                      <Textarea value={descriptionZh} onChange={(e) => setDescriptionZh(e.target.value)} rows={3} placeholder="Chinese description…" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Additional Content (Chinese)
                        <span className="text-muted-foreground ml-1">(rich text)</span>
                      </Label>
                      <SunEditor
                        key={`zh-${dataLoadKey}-${zhKey}`}
                        setContents={extraContentZh}
                        onChange={(html) => setExtraContentZh(html)}
                        setOptions={{ ...EDITOR_OPTIONS, placeholder: "Chinese rich content…" }}
                      />
                    </div>
                  </TabsContent>

                  {/* Japanese */}
                  <TabsContent value="ja" className="p-4 space-y-3 mt-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Edit Japanese content directly, or generate from English using AI.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleTranslateLang("ja")}
                        disabled={translating || !title.trim()}
                        className="gap-1.5 h-7 text-xs shrink-0 ml-2"
                      >
                        {translatingLang === "ja"
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <Languages className="h-3 w-3" />}
                        {translatingLang === "ja" ? "Generating…" : "Generate from English"}
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Title (Japanese)</Label>
                      <Input value={titleJa} onChange={(e) => setTitleJa(e.target.value)} placeholder="Japanese title…" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description (Japanese)</Label>
                      <Textarea value={descriptionJa} onChange={(e) => setDescriptionJa(e.target.value)} rows={3} placeholder="Japanese description…" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Additional Content (Japanese)
                        <span className="text-muted-foreground ml-1">(rich text)</span>
                      </Label>
                      <SunEditor
                        key={`ja-${dataLoadKey}-${jaKey}`}
                        setContents={extraContentJa}
                        onChange={(html) => setExtraContentJa(html)}
                        setOptions={{ ...EDITOR_OPTIONS, placeholder: "Japanese rich content…" }}
                      />
                    </div>
                  </TabsContent>

                  {/* Thai */}
                  <TabsContent value="th" className="p-4 space-y-3 mt-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Edit Thai content directly, or generate from English using AI.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleTranslateLang("th")}
                        disabled={translating || !title.trim()}
                        className="gap-1.5 h-7 text-xs shrink-0 ml-2"
                      >
                        {translatingLang === "th"
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <Languages className="h-3 w-3" />}
                        {translatingLang === "th" ? "Generating…" : "Generate from English"}
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Title (Thai)</Label>
                      <Input value={titleTh} onChange={(e) => setTitleTh(e.target.value)} placeholder="Thai title…" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description (Thai)</Label>
                      <Textarea value={descriptionTh} onChange={(e) => setDescriptionTh(e.target.value)} rows={3} placeholder="Thai description…" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Additional Content (Thai)
                        <span className="text-muted-foreground ml-1">(rich text)</span>
                      </Label>
                      <SunEditor
                        key={`th-${dataLoadKey}-${thKey}`}
                        setContents={extraContentTh}
                        onChange={(html) => setExtraContentTh(html)}
                        setOptions={{ ...EDITOR_OPTIONS, placeholder: "Thai rich content…" }}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* ── Product details ──────────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>{t("admin.edit.fieldQuantity", "Quantity")}</Label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                  />
                </div>

                <div className="space-y-1">
                  <Label>{t("admin.edit.fieldCondition", "Condition")}</Label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="like_new">Like New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="working">Working</SelectItem>
                      <SelectItem value="non-working">Non-working</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>{t("admin.edit.fieldOpStatus", "Operation Status")}</Label>
                  <Select value={operationStatus} onValueChange={setOperationStatus}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="needs-repair">Needs Repair</SelectItem>
                      <SelectItem value="for-parts">For Parts</SelectItem>
                      <SelectItem value="Idle">Idle</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>{t("admin.edit.fieldCategory", "Category")}</Label>
                <Select
                  value={parentCategorySlug}
                  onValueChange={(val) => {
                    setParentCategorySlug(val);
                    setCategoryId("");
                    setCategoryName("");
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {(categories ?? []).map((cat) => (
                      <SelectItem key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(() => {
                  const parent = (categories ?? []).find((c) => c.slug === parentCategorySlug);
                  if (!parent?.subcategories?.length) return null;
                  return (
                    <Select
                      value={categoryId}
                      onValueChange={(val) => {
                        const sub = parent.subcategories.find((s) => String(s.id) === val);
                        setCategoryId(val);
                        setCategoryName(sub?.name ?? "");
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                      <SelectContent>
                        {parent.subcategories.map((sub) => (
                          <SelectItem key={sub.id} value={String(sub.id)}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                })()}
              </div>

              <DialogFooter>
                <Button onClick={handleSaveProduct} disabled={savingProduct}>
                  {savingProduct && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t("admin.edit.saveProduct", "Save Product")}
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* ── Media tab ────────────────────────────────────────────── */}
            <TabsContent value="media" className="space-y-4 mt-4">
              {existingMedia.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    {t("admin.edit.currentMedia", "Current Media")}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {existingMedia.map((img) => (
                      <div key={img.id} className="relative group w-24 h-24">
                        {img.type?.startsWith("video/") ? (
                          <video src={img.url} className="w-full h-full object-cover rounded border" muted />
                        ) : (
                          <img src={img.url} alt="" className="w-full h-full object-cover rounded border" />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveExisting(img)}
                          disabled={deletingImage}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingPreviews.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    {t("admin.edit.pendingMedia", "Ready to Upload")}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {pendingPreviews.map((src, i) => (
                      <div key={i} className="relative group w-24 h-24">
                        {pendingFiles[i]?.type?.startsWith("video/") ? (
                          <video src={src} className="w-full h-full object-cover rounded border border-dashed border-primary" muted />
                        ) : (
                          <img src={src} alt="" className="w-full h-full object-cover rounded border border-dashed border-primary" />
                        )}
                        <button
                          type="button"
                          onClick={() => removePending(i)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  addFiles(e.dataTransfer.files);
                }}
              >
                <UploadCloud className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {t("admin.edit.dropzone", "Drag & drop photos/videos here, or click to select")}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                />
              </div>

              <DialogFooter>
                <Button onClick={handleUploadPending} disabled={uploadingImages || pendingFiles.length === 0}>
                  {uploadingImages && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t("admin.edit.uploadMedia", "Upload")}
                  {pendingFiles.length > 0 ? ` (${pendingFiles.length})` : ""}
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* ── Bidding tab ──────────────────────────────────────────── */}
            <TabsContent value="bidding" className="space-y-4 mt-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                <input
                  type="checkbox"
                  id="isAuction"
                  checked={isAuction}
                  onChange={(e) => setIsAuction(e.target.checked)}
                  className="h-4 w-4"
                />
                <div>
                  <Label htmlFor="isAuction" className="cursor-pointer font-medium">
                    {t("admin.edit.isAuction", "Auction")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {isAuction
                      ? t("admin.edit.isAuctionOn", "Buyers will see Place Bid button")
                      : t("admin.edit.isAuctionOff", "Buyers will see Buy Now / Make Offer button")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>{t("admin.edit.bidType", "Type")}</Label>
                  <Select value={bidType} onValueChange={setBidType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="make_offer">Make Offer</SelectItem>
                      <SelectItem value="fixed_price">Fixed Price (Buy Now)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>{t("admin.edit.bidStatus", "Status")}</Label>
                  <Select value={bidStatus} onValueChange={setBidStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {bidType === "fixed_price" && (
                  <div className="space-y-1">
                    <Label>{t("admin.edit.bidTargetPrice", "Target Price")}</Label>
                    <Input
                      type="number"
                      value={bidTargetPrice}
                      onChange={(e) => setBidTargetPrice(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label>{t("admin.edit.bidCurrency", "Currency")}</Label>
                  <Select value={bidCurrency} onValueChange={setBidCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="TWD">TWD</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                      <SelectItem value="THB">THB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>{t("admin.edit.bidStart", "Start Date")}</Label>
                  <Input type="date" value={bidStartDate} onChange={(e) => setBidStartDate(e.target.value)} />
                </div>

                <div className="space-y-1">
                  <Label>{t("admin.edit.bidEnd", "End Date")}</Label>
                  <Input type="date" value={bidEndDate} onChange={(e) => setBidEndDate(e.target.value)} />
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleSaveBidding} disabled={savingBidding}>
                  {savingBidding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t("admin.edit.saveBidding", "Save Bidding")}
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* ── SEO tab ──────────────────────────────────────────────── */}
            <TabsContent value="seo" className="space-y-4 mt-4">

              {/* Header row */}
              <div className="flex items-start justify-between gap-3 px-1">
                <div>
                  <h3 className="text-sm font-semibold">Search Engine Optimisation</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add SEO metadata per language. AI generates optimised titles, descriptions and keywords from your listing content.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAllSeo}
                  disabled={generatingSeoLangs.size > 0 || !title.trim()}
                  className="gap-1.5 h-8 text-xs shrink-0"
                >
                  {generatingSeoLangs.size > 0
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Sparkles className="h-3 w-3" />}
                  {generatingSeoLangs.size > 0 ? "Generating…" : "Generate All with AI"}
                </Button>
              </div>

              {/* Language sub-tabs */}
              <div className="border rounded-lg overflow-hidden">
                <Tabs value={seoLangTab} onValueChange={(v) => setSeoLangTab(v as typeof seoLangTab)}>
                  <TabsList className="w-full rounded-none border-b bg-muted/20 h-9">
                    <TabsTrigger value="en" className="flex-1 text-xs h-8">🇺🇸 English</TabsTrigger>
                    <TabsTrigger value="zh" className="flex-1 text-xs h-8">🇹🇼 中文</TabsTrigger>
                    <TabsTrigger value="ja" className="flex-1 text-xs h-8">🇯🇵 日本語</TabsTrigger>
                    <TabsTrigger value="th" className="flex-1 text-xs h-8">🇹🇭 ไทย</TabsTrigger>
                  </TabsList>

                  <TabsContent value="en" className="mt-0">
                    <SeoFields
                      lang="en"
                      seoTitle={seoTitleEn} setSeoTitle={setSeoTitleEn}
                      seoDesc={seoDescEn} setSeoDesc={setSeoDescEn}
                      seoKeywords={seoKeywordsEn} setSeoKeywords={setSeoKeywordsEn}
                    />
                  </TabsContent>
                  <TabsContent value="zh" className="mt-0">
                    <SeoFields
                      lang="zh"
                      seoTitle={seoTitleZh} setSeoTitle={setSeoTitleZh}
                      seoDesc={seoDescZh} setSeoDesc={setSeoDescZh}
                      seoKeywords={seoKeywordsZh} setSeoKeywords={setSeoKeywordsZh}
                    />
                  </TabsContent>
                  <TabsContent value="ja" className="mt-0">
                    <SeoFields
                      lang="ja"
                      seoTitle={seoTitleJa} setSeoTitle={setSeoTitleJa}
                      seoDesc={seoDescJa} setSeoDesc={setSeoDescJa}
                      seoKeywords={seoKeywordsJa} setSeoKeywords={setSeoKeywordsJa}
                    />
                  </TabsContent>
                  <TabsContent value="th" className="mt-0">
                    <SeoFields
                      lang="th"
                      seoTitle={seoTitleTh} setSeoTitle={setSeoTitleTh}
                      seoDesc={seoDescTh} setSeoDesc={setSeoDescTh}
                      seoKeywords={seoKeywordsTh} setSeoKeywords={setSeoKeywordsTh}
                    />
                  </TabsContent>
                </Tabs>
              </div>

              <DialogFooter>
                <Button onClick={handleSaveSeo} disabled={savingSeo}>
                  {savingSeo && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t("admin.edit.saveSeo", "Save SEO")}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminEditListingDialog;
