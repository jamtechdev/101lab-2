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
import { Loader2, X, UploadCloud } from "lucide-react";
import {
  useGetBatchDetailsQuery,
  useUpdateAdminProductMutation,
  useUpdateAdminBiddingMutation,
  useAddAdminProductImagesMutation,
  useDeleteAdminProductImageMutation,
  type BatchDetailsProductImage,
} from "@/rtk/slices/adminApiSlice";
import { toastSuccess, toastError } from "@/helper/toasterNotification";

interface Props {
  batchId: number | null;
  open: boolean;
  onClose: () => void;
}

const AdminEditListingDialog = ({ batchId, open, onClose }: Props) => {
  const { t } = useTranslation();
  const { data, isLoading } = useGetBatchDetailsQuery(batchId!, { skip: !batchId || !open });
  const [updateProduct, { isLoading: savingProduct }] = useUpdateAdminProductMutation();
  const [updateBidding, { isLoading: savingBidding }] = useUpdateAdminBiddingMutation();
  const [addImages, { isLoading: uploadingImages }] = useAddAdminProductImagesMutation();
  const [deleteImage, { isLoading: deletingImage }] = useDeleteAdminProductImageMutation();

  // ── Product fields ──────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceFormat, setPriceFormat] = useState("offer");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [priceCurrency, setPriceCurrency] = useState("USD");
  const [condition, setCondition] = useState("");
  const [operationStatus, setOperationStatus] = useState("");
  const [quantity, setQuantity] = useState("1");

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

  // Pre-fill from fetched data
  useEffect(() => {
    if (!data) return;
    const p = data.data?.products?.[0];
    if (p) {
      setTitle(p.title || "");
      setDescription(p.description?.replace(/<[^>]*>/g, "") || "");
      setExistingMedia(p.images || []);
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

  // Clean up pending previews on close
  useEffect(() => {
    if (!open) {
      pendingPreviews.forEach((p) => URL.revokeObjectURL(p));
      setPendingFiles([]);
      setPendingPreviews([]);
    }
  }, [open]);

  const productId = data?.data?.products?.[0]?.product_id;

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
      const body: Record<string, unknown> = {
        title,
        description,
        price_format: priceFormat,
        price_currency: priceCurrency,
        price_now_enabled: priceFormat === "buyNow",
        quantity,
      };
      if (priceFormat === "buyNow" && pricePerUnit) body.price_per_unit = parseFloat(pricePerUnit);
      if (condition) body.condition = condition;
      if (operationStatus) body.operation_status = operationStatus;

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
                <Label>{t("admin.edit.fieldTitle", "Title")}</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label>{t("admin.edit.fieldDescription", "Description")}</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
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

              <DialogFooter>
                <Button onClick={handleSaveProduct} disabled={savingProduct}>
                  {savingProduct && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t("admin.edit.saveProduct", "Save Product")}
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* ── Media tab ────────────────────────────────────────────── */}
            <TabsContent value="media" className="space-y-4 mt-4">
              {/* Existing media grid */}
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

              {/* Pending uploads preview */}
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

              {/* Drop zone */}
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
