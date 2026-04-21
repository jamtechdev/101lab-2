import { useEffect, useState } from "react";
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
import { Loader2 } from "lucide-react";
import {
  useGetBatchDetailsQuery,
  useUpdateAdminProductMutation,
  useUpdateAdminBiddingMutation,
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

  // Pre-fill from fetched data
  useEffect(() => {
    if (!data) return;
    const p = data.data?.products?.[0];
    if (p) {
      setTitle(p.title || "");
      setDescription(p.description?.replace(/<[^>]*>/g, "") || "");
    }
    // Bidding
    const b = data.data?.bidding;
    if (b) {
      setBidType(b.type || "make_offer");
      setBidStartDate(b.start_date ? b.start_date.split("T")[0] : "");
      setBidEndDate(b.end_date ? b.end_date.split("T")[0] : "");
      setBidTargetPrice(b.target_price ?? "");
      setBidCurrency(b.currency || "USD");
      setBidStatus(b.status || "active");
    }
  }, [data]);

  const productId = data?.data?.products?.[0]?.product_id;

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
              <TabsTrigger value="bidding" className="flex-1">
                {t("admin.edit.tabBidding", "Bidding")}
              </TabsTrigger>
            </TabsList>

            {/* ── Product tab ─────────────────────────────────────────── */}
            <TabsContent value="product" className="space-y-4 mt-4">
              {/* Existing photos (read-only preview) */}
              {data?.data?.products?.[0]?.images?.length ? (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    {t("admin.edit.currentPhotos", "Current Photos")}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {data.data.products[0].images.map((img, i) => (
                      <img
                        key={i}
                        src={img.url}
                        alt=""
                        className="w-20 h-20 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              ) : null}

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
                  <Label>{t("admin.edit.fieldPriceFormat", "Price Format")}</Label>
                  <Select value={priceFormat} onValueChange={setPriceFormat}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offer">Make Offer</SelectItem>
                      <SelectItem value="buyNow">Buy Now</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {priceFormat === "buyNow" && (
                  <div className="space-y-1">
                    <Label>{t("admin.edit.fieldPrice", "Price")}</Label>
                    <Input
                      type="number"
                      value={pricePerUnit}
                      onChange={(e) => setPricePerUnit(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label>{t("admin.edit.fieldCurrency", "Currency")}</Label>
                  <Select value={priceCurrency} onValueChange={setPriceCurrency}>
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

            {/* ── Bidding tab ──────────────────────────────────────────── */}
            <TabsContent value="bidding" className="space-y-4 mt-4">
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
