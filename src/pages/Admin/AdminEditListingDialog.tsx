import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { Loader2, X, UploadCloud, Languages, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  useGetBatchDetailsQuery,
  useUpdateAdminProductMutation,
  useTranslateAdminProductMutation,
  useUpdateAdminBiddingMutation,
  useAddAdminProductImagesMutation,
  useDeleteAdminProductImageMutation,
  type BatchDetailsProductImage,
  type ProductTranslations,
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

const AdminEditListingDialog = ({ batchId, open, onClose }: Props) => {
  const { t } = useTranslation();
  const { data, isLoading } = useGetBatchDetailsQuery(batchId!, { skip: !batchId || !open });
  const [updateProduct, { isLoading: savingProduct }] = useUpdateAdminProductMutation();
  const [translateProduct, { isLoading: translating }] = useTranslateAdminProductMutation();
  const [updateBidding, { isLoading: savingBidding }] = useUpdateAdminBiddingMutation();
  const [addImages, { isLoading: uploadingImages }] = useAddAdminProductImagesMutation();
  const [deleteImage, { isLoading: deletingImage }] = useDeleteAdminProductImageMutation();

  const { data: categories } = useLanguageAwareCategories();

  // ── Product fields (always edited in English) ───────────────────────────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");
  const [operationStatus, setOperationStatus] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [parentCategorySlug, setParentCategorySlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");

  // ── AI Translation state ────────────────────────────────────────────────
  const [translations, setTranslations] = useState<ProductTranslations | null>(null);
  const [translationsStale, setTranslationsStale] = useState(false);

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

  // Pre-fill product + bidding fields from fetched data
  useEffect(() => {
    if (!data) return;
    const p = data.data?.products?.[0];
    if (p) {
      // Always show EN version first — fall back to raw title if EN not saved yet
      setTitle(p.title_en || p.title || "");
      setDescription(
        (p.description_en || p.description || "").replace(/<[^>]*>/g, "")
      );
      setExistingMedia(p.images || []);

      // Restore saved translations if they exist
      if (p.title_zh || p.title_ja || p.title_th) {
        setTranslations({
          title_en: p.title_en || p.title || "",
          description_en: (p.description_en || p.description || "").replace(/<[^>]*>/g, ""),
          title_zh: p.title_zh || "",
          description_zh: p.description_zh || "",
          title_ja: p.title_ja || "",
          description_ja: p.description_ja || "",
          title_th: p.title_th || "",
          description_th: p.description_th || "",
        });
        setTranslationsStale(false);
      } else {
        setTranslations(null);
      }
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

  // Mark translations stale when admin changes title or description
  useEffect(() => {
    if (translations) setTranslationsStale(true);
  }, [title, description]);

  // Pre-fill category — runs when either data or categories tree loads
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

  // Clean up pending previews on close
  useEffect(() => {
    if (!open) {
      pendingPreviews.forEach((p) => URL.revokeObjectURL(p));
      setPendingFiles([]);
      setPendingPreviews([]);
      setTranslations(null);
      setTranslationsStale(false);
    }
  }, [open]);

  const productId = data?.data?.products?.[0]?.product_id;

  const handleTranslate = async () => {
    if (!title.trim()) {
      toastError("Please enter a title before translating");
      return;
    }
    try {
      const res = await translateProduct({ title, description }).unwrap();
      setTranslations(res.data);
      setTranslationsStale(false);
      toastSuccess("Translated into Chinese, Japanese and Thai");
    } catch (err: any) {
      toastError(err?.data?.message || "Translation failed");
    }
  };

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) =>
      f.type.startsWith("image/") || f.type.startsWith("video/")
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

      // Always save EN version
      body.title_en = title;
      body.description_en = description;

      // If translations exist and are not stale, save them too
      if (translations && !translationsStale) {
        body.title_zh = translations.title_zh;
        body.description_zh = translations.description_zh;
        body.title_ja = translations.title_ja;
        body.description_ja = translations.description_ja;
        body.title_th = translations.title_th;
        body.description_th = translations.description_th;
      }

      await updateProduct({ productId, body }).unwrap();
      toastSuccess(
        translations && !translationsStale
          ? t("admin.edit.productSaved", "Product updated with translations")
          : t("admin.edit.productSaved", "Product updated")
      );
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label>{t("admin.edit.fieldTitle", "Title")} <span className="text-xs text-muted-foreground">(English)</span></Label>
                </div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title in English"
                />
              </div>

              <div className="space-y-1">
                <Label>{t("admin.edit.fieldDescription", "Description")} <span className="text-xs text-muted-foreground">(English)</span></Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Enter description in English"
                />
              </div>

              {/* ── AI Translate button ── */}
              <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">AI Translation</p>
                    <p className="text-xs text-muted-foreground">
                      Translates title &amp; description into Chinese, Japanese and Thai
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTranslate}
                    disabled={translating || !title.trim()}
                    className="gap-2 border-primary/40"
                  >
                    {translating
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Languages className="h-4 w-4" />}
                    {translating ? "Translating…" : translationsStale ? "Re-translate" : translations ? "Re-translate" : "Translate with AI"}
                  </Button>
                </div>

                {translations && (
                  <div className="space-y-2">
                    {translationsStale && (
                      <p className="text-xs text-amber-600 font-medium">
                        ⚠ Title or description changed — click Re-translate to update
                      </p>
                    )}
                    {(["zh", "ja", "th"] as const).map((lang) => (
                      <div key={lang} className="rounded-md bg-background border p-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{LANG_LABELS[lang]}</Badge>
                          {!translationsStale && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                        </div>
                        <p className="text-sm font-medium">{translations[`title_${lang}` as keyof ProductTranslations]}</p>
                        {translations[`description_${lang}` as keyof ProductTranslations] && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {translations[`description_${lang}` as keyof ProductTranslations]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

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

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                {translations && !translationsStale && (
                  <p className="text-xs text-green-600 self-center">
                    Translations ready — will be saved automatically
                  </p>
                )}
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
