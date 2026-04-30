import { useEffect, useRef, useState } from "react";
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
import { Loader2, X, UploadCloud, Languages } from "lucide-react";
import {
  useGetBatchDetailsQuery,
  useUpdateAdminProductMutation,
  useTranslateAdminProductMutation,
  useUpdateAdminBiddingMutation,
  useAddAdminProductImagesMutation,
  useDeleteAdminProductImageMutation,
  type BatchDetailsProductImage,
} from "@/rtk/slices/adminApiSlice";
import { useLanguageAwareCategories } from "@/hooks/useLanguageAwareCategories";
import { toastSuccess, toastError } from "@/helper/toasterNotification";

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
  // Applies to the editable div inside the SunEditor iframe
  defaultStyle: "white-space: pre-wrap; word-break: break-word; font-size: 14px; line-height: 1.6;",
  // Injects CSS directly into the editor iframe — overrides suneditor's own p/span rules
  addStyleForCss: "p, span, h1, h2, h3, h4, h5, h6, li, td, th, blockquote { white-space: pre-wrap !important; word-break: break-word; }",
  charCounter: false,
};

const AdminEditListingDialog = ({ batchId, open, onClose }: Props) => {
  const { t } = useTranslation();
  const { data, isLoading } = useGetBatchDetailsQuery(batchId!, { skip: !batchId || !open });
  const [updateProduct, { isLoading: savingProduct }] = useUpdateAdminProductMutation();
  const [translateProduct, { isLoading: translating }] = useTranslateAdminProductMutation();
  const [updateBidding, { isLoading: savingBidding }] = useUpdateAdminBiddingMutation();
  const [addImages, { isLoading: uploadingImages }] = useAddAdminProductImagesMutation();
  const [deleteImage, { isLoading: deletingImage }] = useDeleteAdminProductImageMutation();

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

  // ── Language tab state + SunEditor re-mount keys ────────────────────────
  const [langTab, setLangTab] = useState<"en" | "zh" | "ja" | "th">("en");
  const [translatingLang, setTranslatingLang] = useState<"zh" | "ja" | "th" | null>(null);
  const [zhKey, setZhKey] = useState(0);
  const [jaKey, setJaKey] = useState(0);
  const [thKey, setThKey] = useState(0);
  const [dataLoadKey, setDataLoadKey] = useState(0);

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
      setExtraContent(p.extra_content_en || p.extra_content || "");
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
      setTranslatingLang(null);
    }
  }, [open]);

  const productId = data?.data?.products?.[0]?.product_id;

  console.log("product id is there ",productId);
  

  // Translate all languages at once
  const handleTranslateAll = async () => {
    if (!title.trim()) { toastError("Please enter a title before translating"); return; }
    try {
      const res = await translateProduct({ title, description, extra_content: extraContent }).unwrap();
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
      const res = await translateProduct({ title, description, extra_content: extraContent }).unwrap();
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
      body.extra_content = extraContent;
      body.extra_content_en = extraContent;

      body.title_zh = titleZh;
      body.description_zh = descriptionZh;
      body.extra_content_zh = extraContentZh;
      body.title_ja = titleJa;
      body.description_ja = descriptionJa;
      body.extra_content_ja = extraContentJa;
      body.title_th = titleTh;
      body.description_th = descriptionTh;
      body.extra_content_th = extraContentTh;

      await updateProduct({ productId, body }).unwrap();
      toastSuccess(t("admin.edit.productSaved", "Product updated"));
      onClose();
    } catch (err: any) {
      toastError(err?.data?.message || "Failed to update product");
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
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Additional Content
                        <span className="text-muted-foreground ml-1">(rich text)</span>
                      </Label>
                      <SunEditor
                        key={`en-${dataLoadKey}`}
                        setContents={extraContent}
                        onChange={(html) => setExtraContent(html)}
                        setOptions={{ ...EDITOR_OPTIONS, placeholder: "Add extra rich content here (specs, features, notes)…" }}
                      />
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
                      <Input
                        value={titleZh}
                        onChange={(e) => setTitleZh(e.target.value)}
                        placeholder="Chinese title…"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description (Chinese)</Label>
                      <Textarea
                        value={descriptionZh}
                        onChange={(e) => setDescriptionZh(e.target.value)}
                        rows={3}
                        placeholder="Chinese description…"
                      />
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
                      <Input
                        value={titleJa}
                        onChange={(e) => setTitleJa(e.target.value)}
                        placeholder="Japanese title…"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description (Japanese)</Label>
                      <Textarea
                        value={descriptionJa}
                        onChange={(e) => setDescriptionJa(e.target.value)}
                        rows={3}
                        placeholder="Japanese description…"
                      />
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
                      <Input
                        value={titleTh}
                        onChange={(e) => setTitleTh(e.target.value)}
                        placeholder="Thai title…"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description (Thai)</Label>
                      <Textarea
                        value={descriptionTh}
                        onChange={(e) => setDescriptionTh(e.target.value)}
                        rows={3}
                        placeholder="Thai description…"
                      />
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
                          <video
                            src={img.url}
                            className="w-full h-full object-cover rounded border"
                            muted
                          />
                        ) : (
                          <img
                            src={img.url}
                            alt=""
                            className="w-full h-full object-cover rounded border"
                          />
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
                          <video
                            src={src}
                            className="w-full h-full object-cover rounded border border-dashed border-primary"
                            muted
                          />
                        ) : (
                          <img
                            src={src}
                            alt=""
                            className="w-full h-full object-cover rounded border border-dashed border-primary"
                          />
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
                <Button
                  onClick={handleUploadPending}
                  disabled={uploadingImages || pendingFiles.length === 0}
                >
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
                  <Input
                    type="date"
                    value={bidStartDate}
                    onChange={(e) => setBidStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label>{t("admin.edit.bidEnd", "End Date")}</Label>
                  <Input
                    type="date"
                    value={bidEndDate}
                    onChange={(e) => setBidEndDate(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleSaveBidding} disabled={savingBidding}>
                  {savingBidding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t("admin.edit.saveBidding", "Save Bidding")}
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
