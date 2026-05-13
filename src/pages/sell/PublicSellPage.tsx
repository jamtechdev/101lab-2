// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useBatchCreateMutation } from "@/rtk/slices/productSlice";
import { useLanguageAwareCategories } from "@/hooks/useLanguageAwareCategories";
import { SITE_TYPE } from "@/config/site";
import { useLoginModal } from "@/context/LoginModalContext";
import { CountrySelectItems } from "@/components/common/CountrySelect";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";
import toast from "react-hot-toast";
import logo from "@/assets/greenbidz_logo.png";
import {
  Upload, ImagePlus, Video, X, Plus, Trash2, CheckCircle2,
  ArrowRight, Package, Sparkles, Home, LayoutDashboard, FileText
} from "lucide-react";
import axiosInstance from "@/rtk/api/axiosInstance";

// ─── helpers ────────────────────────────────────────────────────────────────

function isoDate(date: Date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function biddingDefaults() {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 45);
  return { start_date: isoDate(start), end_date: isoDate(end) };
}

// ─── Not-Seller popup ───────────────────────────────────────────────────────

function NotSellerPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">You're not a seller yet</DialogTitle>
          <DialogDescription className="mt-2 text-base">
            To publish a product, you need a seller account. Apply to become a seller from your dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button variant="hero" onClick={() => { onClose(); navigate("/dashboard"); }}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Go to Dashboard & Apply
          </Button>
          <Button variant="outline" onClick={onClose}>Maybe later</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Thank-you screen ───────────────────────────────────────────────────────

function ThankYouPublish({ onGoToDashboard }: { onGoToDashboard: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-medium">
        <CardContent className="pt-12 pb-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-accent" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-3">Your machine is published!</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Thank you! Our team will review your listing and it will go live shortly.
            You can track its status from your dashboard.
          </p>

          <div className="bg-secondary/50 rounded-lg p-6 mb-8 text-left">
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">1.</span>
                Your product is live with bidding open for 45 days.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">2.</span>
                Our team reviews the listing and approves it for the marketplace.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">3.</span>
                Buyers will contact you once approved. Track everything from your dashboard.
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" onClick={onGoToDashboard}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/")}>
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

const CONDITIONS = [
  { key: "new", label: "New" },
  { key: "usedFunctional", label: "Used – Functional" },
  { key: "forParts", label: "For Parts" },
  { key: "wasteDisposal", label: "Waste / Disposal" },
  { key: "demolitionRemoval", label: "Demolition / Removal" },
];

interface MediaFile {
  file: File;
  url: string;
  type: "image" | "video";
}

export default function PublicSellPage() {
  const navigate = useNavigate();
  const { openLoginModal } = useLoginModal();

  const [batchCreate] = useBatchCreateMutation();
  const { data: catData } = useLanguageAwareCategories();
  const lang = localStorage.getItem("language") || "en";

  // ── form state ─────────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [parentCategory, setParentCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<string[]>([]);
  const [operationStatus, setOperationStatus] = useState<string[]>([]);
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [estimatedValue, setEstimatedValue] = useState("");
  const [currency, setCurrency] = useState<"TWD" | "USD">("USD");
  const [enableBuyNow, setEnableBuyNow] = useState(true);
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [media, setMedia] = useState<MediaFile[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // ── ui state ───────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [notSellerOpen, setNotSellerOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── categories ─────────────────────────────────────────────────────────────
  const parents = catData ?? [];
  const children = (catData?.find((c: any) => c.slug === parentCategory)?.subcategories) ?? [];

  // ── media handlers ─────────────────────────────────────────────────────────
  const handleMedia = (files: FileList | null, type: "image" | "video") => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      setMedia((prev) => [...prev, { file, url, type }]);
    });
  };

  const removeMedia = (idx: number) => {
    setMedia((prev) => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // ── validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required";
    if (!subCategory) e.category = "Category is required";
    if (!description.trim()) e.description = "Description is required";
    if (condition.length === 0) e.condition = "Select at least one condition";
    if (operationStatus.length === 0) e.operationStatus = "Select at least one operation status";
    if (!country) e.country = "Country is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── submit logic ────────────────────────────────────────────────────────────
  const doSubmit = async () => {
    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("userRole");

    if (!userId) {
      // Not logged in — open login/signup modal, then re-run on success
      openLoginModal({
        portalType: "seller",
        onSuccess: () => doSubmit(),
      });
      return;
    }

    if (role !== "seller") {
      setNotSellerOpen(true);
      return;
    }

    if (!validate()) return;

    setLoading(true);
    try {
      // 1. Build FormData — exactly matching /upload
      const formData = new FormData();
      formData.append("product_title", title);
      formData.append("product_content", description);
      formData.append("product_type", "simple");
      formData.append("product_category_ids", subCategory);
      formData.append("category_name", subCategoryName);
      formData.append("seller_name", localStorage.getItem("userName") || "");
      formData.append("seller_company", localStorage.getItem("companyName") || "");
      formData.append("post_author_id", userId);
      formData.append("steps", "1");
      formData.append("quantity", String(quantity));
      formData.append("location[]", address ? `${address}, ${country}` : country);
      formData.append("country", country);
      condition.forEach((c) => formData.append("item_condition[]", c));
      operationStatus.forEach((s) => formData.append("operation_status[]", s));
      formData.append("sellerVisible", "true");
      formData.append("replacement_cost_per_unit", "");
      formData.append("weight_per_unit", "");
      formData.append("price_now_enabled", enableBuyNow ? "1" : "0");
      formData.append("price_format", enableBuyNow ? "buyNow" : "offer");
      formData.append("price_currency", currency);
      formData.append("price_per_unit", enableBuyNow && pricePerUnit ? pricePerUnit : "");
      formData.append("visibility", "PUBLIC");
      ["101it.co", "greenbidz.com"].forEach((site) => formData.append("allowed_sites[]", site));

      media.forEach((m) => {
        if (m.type === "image") formData.append("images", m.file);
        else formData.append("videos", m.file);
      });

      const baseURL = import.meta.env.VITE_PRODUCTION_URL;
      const productRes = await axiosInstance.post(
        `${baseURL}wp/create-product-direct?lang=${lang}&type=${SITE_TYPE}`,
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
      if (!productRes?.data?.success) throw new Error(productRes?.data?.message || "Failed to add product");

      const productId = productRes?.data?.data?.product_id;

      // 2. Create batch with 45-day bidding defaults
      const { start_date, end_date } = biddingDefaults();
      const batchRes = await batchCreate({
        productIds: [productId],
        sellerId: userId,
        visibility: "PUBLIC",
        type: "bidding",
        start_date,
        end_date,
      }).unwrap();

      if (!batchRes?.success) throw new Error(batchRes?.message || "Failed to create listing");

      setDone(true);
    } catch (err: any) {
      toast.error(err?.message || err?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSubmit();
  };

  if (done) {
    return (
      <ThankYouPublish
        onGoToDashboard={() => navigate("/dashboard")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <img src={logo} alt="GreenBidz" className="h-8 cursor-pointer" onClick={() => navigate("/")} />
          <span className="text-muted-foreground text-sm hidden sm:block">|</span>
          <span className="font-semibold text-foreground text-sm hidden sm:block">Publish Your Machine</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Hero text */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Free to list — no account needed to start
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Sell your machine on GreenBidz
          </h1>
          <p className="text-muted-foreground text-lg">
            Fill in the details below. We'll publish your listing with bidding open for 45 days.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Product title ── */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-accent" /> Product Details
              </h2>

              <div>
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. CNC Milling Machine – Haas VF-2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && <p className="text-destructive text-xs mt-1">{errors.title}</p>}
              </div>

              {/* Categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Category *</Label>
                  <Select value={parentCategory} onValueChange={(v) => { setParentCategory(v); setSubCategory(""); setSubCategoryName(""); }}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {parents.map((c: any) => (
                        <SelectItem key={c.slug} value={c.slug}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sub-category *</Label>
                  <Select value={subCategory} onValueChange={(v) => { setSubCategory(v); setSubCategoryName(children.find((c: any) => String(c.id) === v)?.name || ""); }} disabled={!parentCategory}>
                    <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select sub-category" />
                    </SelectTrigger>
                    <SelectContent>
                      {children.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-destructive text-xs mt-1">{errors.category}</p>}
                </div>
              </div>

              {/* Description */}
              <div>
                <Label>Description *</Label>
                <div className={errors.description ? "border border-destructive rounded-md" : ""}>
                  <SunEditor
                    setContents={description}
                    onChange={setDescription}
                    setOptions={{
                      height: "180",
                      buttonList: [["bold", "italic", "underline", "list"], ["align", "fontSize"]],
                    }}
                  />
                </div>
                {errors.description && <p className="text-destructive text-xs mt-1">{errors.description}</p>}
              </div>

              {/* Condition */}
              <div>
                <Label>Condition *</Label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {CONDITIONS.map((c) => (
                    <label key={c.key} className="flex items-center gap-2 cursor-pointer select-none">
                      <Checkbox
                        checked={condition.includes(c.key)}
                        onCheckedChange={(checked) =>
                          setCondition((prev) =>
                            checked ? [...prev, c.key] : prev.filter((k) => k !== c.key)
                          )
                        }
                      />
                      <span className="text-sm">{c.label}</span>
                    </label>
                  ))}
                </div>
                {errors.condition && <p className="text-destructive text-xs mt-1">{errors.condition}</p>}
              </div>

              {/* Operation Status */}
              <div>
                <Label>Operation Status *</Label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {[
                    { key: "deinstalled", label: "Deinstalled" },
                    { key: "needDeinstall", label: "Need Deinstall" },
                    { key: "collected", label: "Collected" },
                    { key: "other", label: "Other" },
                  ].map((s) => (
                    <label key={s.key} className="flex items-center gap-2 cursor-pointer select-none">
                      <Checkbox
                        checked={operationStatus.includes(s.key)}
                        onCheckedChange={(checked) =>
                          setOperationStatus((prev) =>
                            checked ? [...prev, s.key] : prev.filter((k) => k !== s.key)
                          )
                        }
                      />
                      <span className="text-sm">{s.label}</span>
                    </label>
                  ))}
                </div>
                {errors.operationStatus && <p className="text-destructive text-xs mt-1">{errors.operationStatus}</p>}
              </div>

              {/* Quantity + Value */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Estimated Value</Label>
                  <Input
                    placeholder="e.g. 15000"
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={(v) => setCurrency(v as "TWD" | "USD")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="TWD">TWD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Location ── */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="font-semibold text-lg">Location</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Country *</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className={errors.country ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <CountrySelectItems />
                    </SelectContent>
                  </Select>
                  {errors.country && <p className="text-destructive text-xs mt-1">{errors.country}</p>}
                </div>
                <div>
                  <Label>Address / City</Label>
                  <Input
                    placeholder="e.g. Taipei, Taiwan"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Pricing ── */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="font-semibold text-lg">Pricing</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={enableBuyNow}
                  onCheckedChange={(v) => setEnableBuyNow(!!v)}
                />
                <span className="font-medium">Enable Buy Now price</span>
              </label>
              {enableBuyNow && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label>Price per unit</Label>
                    <Input
                      placeholder="e.g. 12000"
                      value={pricePerUnit}
                      onChange={(e) => setPricePerUnit(e.target.value)}
                    />
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Bidding will be open from today for <strong>45 days</strong> by default.
              </p>
            </CardContent>
          </Card>

          {/* ── Photos / Videos ── */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <ImagePlus className="h-5 w-5 text-accent" /> Photos & Videos
              </h2>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => imageInputRef.current?.click()}>
                  <ImagePlus className="h-4 w-4 mr-2" /> Add Photos
                </Button>
                <Button type="button" variant="outline" onClick={() => videoInputRef.current?.click()}>
                  <Video className="h-4 w-4 mr-2" /> Add Video
                </Button>
              </div>

              <input ref={imageInputRef} type="file" accept="image/*" multiple hidden
                onChange={(e) => handleMedia(e.target.files, "image")} />
              <input ref={videoInputRef} type="file" accept="video/*" hidden
                onChange={(e) => handleMedia(e.target.files, "video")} />

              {media.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-2">
                  {media.map((m, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border group">
                      {m.type === "image" ? (
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <video src={m.url} className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeMedia(i)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Submit ── */}
          <div className="pb-8">
            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full text-base"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Publishing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Publish My Machine
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-3">
              By publishing you agree to our terms. You'll be asked to log in or create an account.
            </p>
          </div>
        </form>
      </div>

      {/* Not-seller popup */}
      <NotSellerPopup open={notSellerOpen} onClose={() => setNotSellerOpen(false)} />
    </div>
  );
}
