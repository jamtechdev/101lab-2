// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import "suneditor/dist/css/suneditor.min.css";
import { useNavigate, useParams } from "react-router-dom";
import { useLoginModal } from "@/context/LoginModalContext";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  CalendarIcon,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Loader2,
  EditIcon,
  Edit,
  Gavel,
  Share2,
  Copy,
  Check,
  Eye,
  Users,
  ChevronDown,
  Truck,
  Tag,
  Wrench,
  Layers,
  Heart,
  Info,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import logo from "@/assets/greenbidz_logo.png";
import { useGetBatchByIdQuery, useGetBatchesQuery } from "@/rtk/slices/batchApiSlice";
import { translateCategoryName } from "@/utils/categoryTranslations";
import { useRegisterCompanyForInspectionMutation, useCheckInspectionMutation, useUpdateCompanyRegistrationMutation } from "@/rtk/slices/productSlice";
import { useCheckBidStatusMutation, usePlaceBidMutation, useGetBuyerBidsQuery, useSubmitOfferMutation } from "@/rtk/slices/bidApiSlice";
import { getSocket } from "@/services/socket";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { convertUTCToLocalRange } from "@/utils/timeUtils";
import { subscribeBuyerEvents } from "@/socket/buyerEvents"
import ChatSidebarWrapper from "@/components/common/ChatSidebarWrapper";
import { useUpdateBuyerBidMutation } from "@/rtk/slices/buyerApiSlice";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { formatDate } from "@/utils/formatDate";
import i18n from "@/i18n/config";
import { pushViewListingEvent, pushAddToWishlistEvent } from "@/utils/gtm";
import axiosInstance from "@/rtk/api/axiosInstance";


// Country name → ISO 3166-1 alpha-2 code → flag emoji
const COUNTRY_TO_ISO: Record<string, string> = {
  "Afghanistan": "AF", "Albania": "AL", "Algeria": "DZ", "Argentina": "AR", "Australia": "AU",
  "Austria": "AT", "Bangladesh": "BD", "Belgium": "BE", "Brazil": "BR", "Canada": "CA",
  "Chile": "CL", "China": "CN", "Colombia": "CO", "Croatia": "HR", "Czech Republic": "CZ",
  "Denmark": "DK", "Egypt": "EG", "Finland": "FI", "France": "FR", "Germany": "DE",
  "Ghana": "GH", "Greece": "GR", "Hong Kong": "HK", "Hungary": "HU", "India": "IN",
  "Indonesia": "ID", "Iran": "IR", "Iraq": "IQ", "Ireland": "IE", "Israel": "IL",
  "Italy": "IT", "Japan": "JP", "Jordan": "JO", "Kenya": "KE", "South Korea": "KR",
  "Kuwait": "KW", "Lebanon": "LB", "Malaysia": "MY", "Mexico": "MX", "Morocco": "MA",
  "Netherlands": "NL", "New Zealand": "NZ", "Nigeria": "NG", "Norway": "NO", "Oman": "OM",
  "Pakistan": "PK", "Peru": "PE", "Philippines": "PH", "Poland": "PL", "Portugal": "PT",
  "Qatar": "QA", "Romania": "RO", "Russia": "RU", "Saudi Arabia": "SA", "Singapore": "SG",
  "South Africa": "ZA", "Spain": "ES", "Sri Lanka": "LK", "Sweden": "SE", "Switzerland": "CH",
  "Taiwan": "TW", "Thailand": "TH", "Turkey": "TR", "UAE": "AE", "United Arab Emirates": "AE",
  "United Kingdom": "GB", "UK": "GB", "United States": "US", "USA": "US", "Vietnam": "VN",
};

const getCountryIso = (countryName: string): string => {
  return (COUNTRY_TO_ISO[countryName] || "").toLowerCase();
};

const maskName = (name: string): string => {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => word.charAt(0) + "*".repeat(Math.max(word.length - 1, 2)))
    .join(" ");
};

const getRealFileUrl = (doc: any) => {
  const match = doc.url.match(/https?:\/\/[^\s"]+/);
  return match ? match[0] : doc.url;
};


console.log("chages done");


// ----------------- Mapping Logic -----------------
const mapApiProductToUI = (product: any) => {
  const meta: Record<string, string> = {};
  product.meta?.forEach((m: any) => (meta[m.meta_key] = m.meta_value));

  let phase: "inspection" | "bidding" | "none" = "none";
  switch (product.status) {
    case "inspection_schedule":
      phase = "inspection";
      break;
    case "live_for_bid":
      phase = "bidding";
      break;
    default:
      phase = "none";
  }

  return {
    id: product.product_id,
    title: product.title,
    title_en: meta["title_en"],
    title_zh: meta["title_zh"],
    title_ja: meta["title_ja"],
    title_th: meta["title_th"],
    description: product.description,
    description_en: meta["description_en"],
    description_zh: meta["description_zh"],
    description_ja: meta["description_ja"],
    description_th: meta["description_th"],
    extra_content: meta["extra_content"],
    extra_content_en: meta["extra_content_en"],
    extra_content_zh: meta["extra_content_zh"],
    extra_content_ja: meta["extra_content_ja"],
    extra_content_th: meta["extra_content_th"],
    images: product.attachments?.filter((a: any) => a.type?.startsWith('image') || a.type?.startsWith('video')).map((a: any) => a.url) || [],
    documents: product.documents?.map((doc: any) => ({
      id: doc.id,
      url: doc.url,
      type: doc.type,
    })) || [],
    category: product.categories?.[0]?.term || "N/A",
    askingPrice: `$${meta["usd_price"] || 0}`,
    quantity: meta["quantity"] || "N/A",
    condition: meta["condition"] || "N/A",
    phase,
    inspectionDate: meta["inspection_date"] || "",
    inspectionTime: meta["inspection_time"] || "",
    location: meta["product_locations"] || "",
    seller: {
      name: meta["seller_name"] || "N/A",
      company: meta["seller_company"] || meta["seller_name"] || "Industrial Corporation Ltd.",
    },
    sellerVisible: meta["sellerVisible"],
    // Core Specifications
    manufacturer: meta["manufacturer"] || meta["brand"] || "",
    model: meta["model"] || "",
    serial_number: meta["serial_number"] || meta["vin"] || "",
    dimensions: meta["dimensions"] || "",
    weight: meta["weight"] || "",
    // Logistics
    rigging_responsibility: meta["rigging_responsibility"] || "",
    loading_responsibility: meta["loading_responsibility"] || "",
    shipping_responsibility: meta["shipping_responsibility"] || "",
    packaging_type: meta["packaging_type"] || "",
    // Sale / batch level
    lot_type: meta["lot_type"] || meta["sales_type"] || "",
    buyer_premium: meta["buyer_premium"] || "",
    removal_shipping: meta["removal_shipping"] || "",
    watchers_count: meta["watchers_count"] || "",
    visitors_count: meta["visitors_count"] || "",
    event_id: meta["event_id"] || "",
  };
};

// ── Similar Batch Card ────────────────────────────────────────────────────────
const SimilarBatchCard = ({ batch, lang, onClick }: { batch: any; lang: string; onClick: () => void }) => {
  const now = Date.now();
  const start = batch.bid_start_date ? new Date(batch.bid_start_date).getTime() : null;
  const end = batch.bid_end_date ? new Date(batch.bid_end_date).getTime() : null;
  const isLive = start && end && now >= start && now <= end;
  const isUpcoming = start && now < start;
  const isEnded = end && now > end;
  const image = batch.firstProductImages?.[0];
  const category = translateCategoryName(batch.category || "", lang as 'en' | 'zh');

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short" });

  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-52 cursor-pointer group border border-border rounded overflow-hidden bg-card hover:shadow-md transition-shadow"
    >
      <div className="relative h-36 bg-muted overflow-hidden">
        {image ? (
          <img src={image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
        )}
        <div className="absolute bottom-1.5 left-1.5">
          {isLive && end && (
            <span className="inline-flex items-center gap-1 bg-primary/90 text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
              <Clock className="h-2.5 w-2.5" /> LIVE
            </span>
          )}
          {isUpcoming && start && (
            <span className="inline-flex items-center gap-1 bg-accent/90 text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
              <Clock className="h-2.5 w-2.5" /> Opens {formatDate(start)}
            </span>
          )}
          {isEnded && (
            <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-sm border border-border">
              <Clock className="h-2.5 w-2.5" /> Ended
            </span>
          )}
        </div>
        <div className="absolute top-1 left-1">
          <span className="bg-muted text-muted-foreground text-[9px] font-bold px-1 py-0.5 rounded-sm">#{batch.batchId}</span>
        </div>
      </div>
      <div className="px-2.5 py-2">
        <p className="text-[12px] font-semibold text-foreground line-clamp-2 uppercase leading-snug group-hover:text-primary transition-colors">
          {batch.title || `Batch #${batch.batchId}`}
        </p>
        {category && category !== "N/A" && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{category}</p>
        )}
      </div>
    </div>
  );
};

const SellerListingDetail = ({ hideLayout = false }: { hideLayout?: boolean }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { openLoginModal } = useLoginModal();

  const {
    data,
    isLoading,
    isError,
    refetch
  } = useGetBatchByIdQuery(Number(id));

  const currentBatchId = Number(id);

  // Fire GA4 view_listing once batch data loads
  useEffect(() => {
    try {
      const b = (data as any)?.data?.batch;
      if (!b) return;
      pushViewListingEvent({
        batch_id:       b.batch_id ?? currentBatchId,
        batch_number:   b.batch_number,
        batch_category: (data as any)?.data?.products?.[0]?.categories?.[0]?.term_slug,
        batch_status:   b.status,
        item_count:     (data as any)?.data?.products?.length ?? 0,
        seller_id:      b.seller_id,
      });
    } catch {}
  }, [(data as any)?.data?.batch?.batch_id ?? currentBatchId]);

  const categorySlug = (data as any)?.data?.products?.[0]?.categories?.[0]?.term_slug || "";

  const { data: similarData } = useGetBatchesQuery(
    { category: categorySlug, sort: "closing_soon", limit: 12, lang: i18n.language },
    { skip: !categorySlug }
  );

  const similarBatches = (similarData?.data || [])
    .filter((b: any) => b.batchId !== currentBatchId)
    .slice(0, 10);

  const parseWeightQuotations = (weight_quotations: any) => {
    if (!weight_quotations) return null;
    try {
      return typeof weight_quotations === "string"
        ? JSON.parse(weight_quotations)
        : weight_quotations;
    } catch (e) {
      console.error("Invalid weight_quotations JSON", e);
      return null;
    }
  };

  const [registerCompany, { isLoading: isRegistering }] = useRegisterCompanyForInspectionMutation();
  const [updateCompany] = useUpdateCompanyRegistrationMutation();
  const [checkInspectionStatus, { isLoading: isCheckingInspectionStatus }] = useCheckInspectionMutation();

  const [placeBid, { isLoading: isPlacingBid }] = usePlaceBidMutation();
  const [submitOffer, { isLoading: isSubmittingOffer }] = useSubmitOfferMutation();
  const [checkBidStatus, { isLoading: isCheckingBidStatus }] = useCheckBidStatusMutation();

  const [products, setProducts] = useState<any[]>([]);
  const [batchStatus, setBatchStatus] = useState<string | null>(null);
  const [batchStep, setBatchStep] = useState(0);
  const [inspectionSchedule, setInspectionSchedule] = useState<any>(null);
  const [userInspectionRegistration, setUserInspectionRegistration] = useState<any>(null);
  const [showBidDialog, setShowBidDialog] = useState(false);
  const [bidDialogMode, setBidDialogMode] = useState<"place_bid" | "make_offer" | "buy_now">("place_bid");
  const [makeOfferStep, setMakeOfferStep] = useState<"form" | "review">("form");
  const [openTerm, setOpenTerm] = useState<string | null>(null);
  const [offerQuantity, setOfferQuantity] = useState<number>(1);
  // ── NEW: confirmation step for place bid ──
  const [placeBidStep, setPlaceBidStep] = useState<"form" | "review">("form");
  const [showBidSuccessDialog, setShowBidSuccessDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showInspectionDialog, setShowInspectionDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [userBid, setUserBid] = useState<any>(null);

  const [bidCompanyName, setBidCompanyName] = useState("");
  const [bidContactPerson, setBidContactPerson] = useState("");
  const [bidCountry, setBidCountry] = useState("Taiwan");
  const [bidAmount, setBidAmount] = useState<string>("");
  const [bidNotes, setBidNotes] = useState("");
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);

  const [message, setMessage] = useState("");
  const [selectedInspectionDate, setSelectedInspectionDate] = useState<Date | undefined>(undefined);
  const [selectedInspectionSlot, setSelectedInspectionSlot] = useState<string>("");
  const [companyName, setCompanyName] = useState("");

  const companyBuyerName = localStorage.getItem("companyName");
  const contactPerson = localStorage.getItem("userName");

  const [sellerData, setSellerData] = useState();
  const [bidDetail, setBidDetail] = useState();
  const [batchCountry, setBatchCountry] = useState<string | null>(null);

  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editAmount, setEditAmount] = useState(userBid?.amount || "");
  const [updateBuyerBid, { isLoading: isBuyerBidDetail }] = useUpdateBuyerBidMutation();
  const [selectedBid, setSelectedBid] = useState(null);
  const [wishlistMap, setWishlistMap] = useState<Record<number, boolean>>({});
  const [wishlistLoading, setWishlistLoading] = useState<Record<number, boolean>>({});

  const [useWholePrice, setUseWholePrice] = useState(true);
  const [useWeightPrice, setUseWeightPrice] = useState(false);

  const WEIGHT_ITEMS = [
    { key: "scrap_iron", label: t("buyerDashboard.material.scrapIron") },
    { key: "special_materials", label: t("buyerDashboard.material.specialMaterial") },
    { key: "waste_disposal_fee", label: t("buyerDashboard.material.wasteDisposalFee") },
    { key: "others", label: t("buyerDashboard.material.others") },
  ];

  const [weightPrices, setWeightPrices] = useState<Record<string, string>>({});

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showAllBids, setShowAllBids] = useState(false);

  const bidTypeMap = {
    fixed_price: "biddingStep.fixedPrice",
    make_offer: "biddingStep.makeOffer"
  };

  const ASIA_COUNTRIES = [
    "Taiwan", "India", "China", "Japan", "South Korea", "Singapore",
    "Malaysia", "Thailand", "Vietnam", "Indonesia", "Philippines",
    "Bangladesh", "Sri Lanka", "Nepal", "Pakistan", "Hong Kong", "Macau",
  ];

  // ---------------- Wishlist helpers ----------------
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId || !products.length) return;
    products.forEach((p) => {
      axiosInstance
        .get(`/wishlist/${userId}/${p.id}`)
        .then((res) => {
          if (res.data?.data?.inWishlist !== undefined)
            setWishlistMap((prev) => ({ ...prev, [p.id]: res.data.data.inWishlist }));
        })
        .catch(() => {});
    });
  }, [userId, products]);

  const handleWishlistToggle = useCallback(
    async (productId: number, productTitle?: string) => {
      if (!userId) { toast.error("Please login to add to wishlist"); return; }
      if (wishlistLoading[productId]) return;
      const prev = wishlistMap[productId] ?? false;
      setWishlistMap((m) => ({ ...m, [productId]: !prev }));
      setWishlistLoading((m) => ({ ...m, [productId]: true }));
      try {
        const res = await axiosInstance.post(`/wishlist/${userId}/toggle`, { productId });
        const action = res.data?.data?.action;
        if (action === "added") {
          setWishlistMap((m) => ({ ...m, [productId]: true }));
          toast.success("Added to wishlist");
          try { pushAddToWishlistEvent({ listing_id: productId, listing_title: productTitle ?? "" }); } catch { }
        } else if (action === "removed") {
          setWishlistMap((m) => ({ ...m, [productId]: false }));
          toast.success("Removed from wishlist");
        }
        window.dispatchEvent(new Event("wishlist-changed"));
      } catch {
        setWishlistMap((m) => ({ ...m, [productId]: prev }));
        toast.error("Failed to update wishlist");
      } finally {
        setWishlistLoading((m) => ({ ...m, [productId]: false }));
      }
    },
    [userId, wishlistMap, wishlistLoading]
  );

  // ---------------- Helper refresh functions ----------------
  const refreshBidStatus = async () => {
    const buyerId = user?.id || Number(localStorage.getItem("userId"));
    const batchId = Number(id);
    if (!buyerId || !batchId) { setUserBid(null); return; }

    try {
      const response = await checkBidStatus({ batch_id: batchId, buyer_id: buyerId }).unwrap();
      if (response?.success && response?.data?.hasBid) {
        setUserBid(response.data.buyerBid);
      } else {
        setUserBid(null);
      }
    } catch (error) {
      console.error("Failed to refresh bid status:", error);
      setUserBid(null);
    }
  };

  const refreshInspectionStatus = async () => {
    const buyerId = user?.id || Number(localStorage.getItem("userId"));
    const batchId = Number(id);
    if (!buyerId || !batchId) { setUserInspectionRegistration(null); return; }

    try {
      const response = await checkInspectionStatus({ batchId, buyerId }).unwrap();
      const companies = response?.inspection?.companies || [];
      const joinedCompany = companies.find((c: any) => c.buyer_id === buyerId);
      const selectedCompany = companies.find((c: any) => c.buyer_id === buyerId && c.status === "selected");
      setUserInspectionRegistration({
        inspectionDetails: response?.inspection,
        joined: !!joinedCompany,
        selected: !!selectedCompany,
        companyData: joinedCompany || null
      });
    } catch (error) {
      console.error("Failed to refresh inspection status:", error);
      setUserInspectionRegistration(null);
    }
  };

  const truncateText = (text: string, charLimit: number = 4) => {
    if (!text) return "";
    return text.length > charLimit ? text.slice(0, charLimit) + " ..." : text;
  };

  const handleUpdate = async () => {
    try {
      const res = await updateBuyerBid({ buyer_bid_id: userBid.buyer_bid_id, amount: editAmount }).unwrap();
      toast.success(res.message || "Bid updated successfully");
      setEditOpen(false);
    } catch (err) {
      console.error("Error:", err);
      toast.error(err?.data?.message || "Failed to update bid");
    }
  };

  const handleUpdateBid = async () => {
    if (!selectedBid) return;
    try {
      const payload = {
        buyer_bid_id: selectedBid.buyer_bid_id,
        amount: useWholePrice ? bidAmount : null,
        weight_quotations: useWeightPrice ? weightPrices : null,
        quotation_types: [
          ...(useWholePrice ? ["whole_item"] : []),
          ...(useWeightPrice ? ["weight_based"] : [])
        ],
        notes: bidNotes
      };
      const res = await updateBuyerBid(payload).unwrap();
      toast.success(res.message || "Bid updated successfully");
      setShowBidDialog(false);
      setSelectedBid(null);
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || "Failed to update bid");
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  useEffect(() => {
    const unsub = subscribeBuyerEvents(() => {
      refetch();
      refetchBids();
    });
    return unsub;
  }, []);

  useEffect(() => {
    const endDateStr = data?.data?.biddingDetails?.end_date;
    if (!endDateStr) return;
    const bidEndDate = new Date(endDateStr);
    const calculate = () => {
      const diff = bidEndDate.getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };
    setTimeLeft(calculate());
    const timer = setInterval(() => setTimeLeft(calculate()), 1000);
    return () => clearInterval(timer);
  }, [data?.data?.biddingDetails?.end_date]);

  useEffect(() => {
    const batchId = Number(id);
    if (!batchId) return;
    const socket = getSocket();
    socket.emit("join", `batch_${batchId}`);
    const onNewBid = () => { refetch(); refetchBids(); };
    socket.on("new-bid", onNewBid);
    socket.on("bid-placed", onNewBid);
    socket.on("bid_update", onNewBid);
    socket.on("bid_created", onNewBid);
    return () => {
      socket.off("new-bid", onNewBid);
      socket.off("bid-placed", onNewBid);
      socket.off("bid_update", onNewBid);
      socket.off("bid_created", onNewBid);
    };
  }, [id]);

  useEffect(() => {
    if (user || localStorage.getItem("userId")) {
      refreshBidStatus();
      refreshInspectionStatus();
    } else {
      setUserBid(null);
      setUserInspectionRegistration(null);
    }
  }, [user, id]);

  useEffect(() => {
    if (data?.success) {
      const responseData = data.data as any;
      if (responseData.batch?.status) setBatchStatus(responseData.batch.status);
      if (responseData?.batch?.step) setBatchStep(responseData?.batch?.step);
      if (responseData.products) setProducts(responseData.products.map((p: any) => mapApiProductToUI(p)));
      if (responseData?.sellerData) setSellerData(responseData?.sellerData);
      if (responseData?.batch?.country) setBatchCountry(responseData.batch.country);
      if (responseData?.biddingDetails) setBidDetail(responseData?.biddingDetails);
      const schedule = responseData.insepction || responseData.inspection;
      if (schedule?.schedule) {
        setInspectionSchedule(schedule);
      } else {
        setInspectionSchedule(null);
      }
    }
  }, [data]);

  useEffect(() => {
    if (!bidDetail) return;
    if (bidDetail?.type === "fixed_price") {
      setBidAmount(bidDetail?.target_price?.toString() || "");
    } else {
      setBidAmount("");
    }
  }, [bidDetail]);

  const openDialogFor = (product: any, type: "bid" | "inspect" | "message" | "bidding", mode?: "place_bid" | "make_offer" | "buy_now") => {
    setSelectedProduct(product);

    if (type === "bid" || type === "bidding") {
      setBidCompanyName(user?.company_name || user?.company || product?.seller?.company || "");
      setBidContactPerson(user?.name || user?.fullName || "");
      setBidCountry(user?.country || "");
      setIsTaxInclusive(bidDetail.taxInclusive ?? true);
      setBidNotes("");
      setBidDialogMode(mode || "place_bid");
      if (mode === "make_offer") setMakeOfferStep("form");
      // ── Reset bid confirmation step ──
      setPlaceBidStep("form");
      setShowBidDialog(true);
      return;
    }

    if (type === "inspect") {
      setShowInspectionDialog(true);
      setSelectedInspectionDate(undefined);
      setSelectedInspectionSlot("");
      setCompanyName(user?.company_name || user?.company || product?.seller?.company || "");
      return;
    }

    if (type === "message") {
      setShowMessageDialog(true);
      return;
    }
  };

  const [editDialogData, setEditDialogData] = useState<{
    company_name?: string;
    date?: string;
    slot?: string;
    [key: string]: any;
  } | null>(null);

  function extractUrls(serializedString) {
    const urls = [...serializedString.matchAll(/"(https?:\/\/[^"]+)"/g)];
    return urls.map(u => u[1]);
  }

  const handleJoinInspection = async () => {
    if (!selectedInspectionDate) { toast.error(t("listingDetail.pleaseSelectDate") || "Please select a date"); return; }
    if (!selectedInspectionSlot) { toast.error(t("listingDetail.pleaseSelectSlot") || "Please select a time slot"); return; }
    if (!companyName.trim()) { toast.error(t("listingDetail.pleaseEnterCompanyName") || "Please enter your company name"); return; }

    const buyerId = user?.id || Number(localStorage.getItem("userId"));
    if (!buyerId) { toast.error("Please login to register for inspection"); return; }

    const batchId = Number(id);
    if (!batchId) { toast.error("Invalid batch ID"); return; }

    const formattedDate = format(selectedInspectionDate, "yyyy-MM-dd");

    const payload: any = {
      batch_id: batchId,
      buyer_id: buyerId,
      company_name: companyBuyerName.trim(),
      date: formattedDate,
      slot: selectedInspectionSlot,
      selected: editDialogData?.selected || false,
      skipped: editDialogData?.skipped || false,
    };

    try {
      let result;
      if (editDialogData?.registration_id) {
        payload.registration_id = editDialogData.registration_id;
        result = await updateCompany(payload).unwrap();
      } else {
        result = await registerCompany(payload).unwrap();
      }

      if (result?.success) {
        toast.success(result.message || t("buyer.inspectionSuccess"));
        setShowInspectionDialog(false);
        setSelectedInspectionDate(undefined);
        setSelectedInspectionSlot("");
        setCompanyName("");
        setEditDialogData(null);
        await refreshInspectionStatus();
      } else {
        toast.error(result?.message || "Operation failed");
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Failed to process registration";
      toast.error(errorMessage);
    }
  };

  const getAvailableSlots = () => {
    if (!selectedInspectionDate || !inspectionSchedule?.schedule) return [];
    const dateStr = format(selectedInspectionDate, "yyyy-MM-dd");
    const scheduleItem = inspectionSchedule.schedule.find((item: any) => item.date === dateStr);
    return scheduleItem?.slots || [];
  };

  const handleSendMessage = () => {
    if (!message.trim()) { toast.error(t("listingDetail.pleaseEnterMessage")); return; }
    toast.success(t("buyer.messageSuccess"));
    setShowMessageDialog(false);
    setMessage("");
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: data?.data?.batch?.title || "GreenBidz Listing", url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const now = new Date();
  const bidStartDate = bidDetail?.start_date ? new Date(bidDetail.start_date) : null;
  const bidEndDate = bidDetail?.end_date ? new Date(bidDetail.end_date) : null;

  const isLiveBidding = !!(bidStartDate && bidEndDate && now >= bidStartDate && now <= bidEndDate);
  const isBidScheduled = !!(bidStartDate && now < bidStartDate);
  const isBidEnded = !!(bidEndDate && now > bidEndDate);

  const dynamicBidStatus = isLiveBidding ? "live_for_bids" : isBidScheduled ? "bid_scheduled" : isBidEnded ? "bid_closed" : "no_bid";
  const isAuctionLive = isLiveBidding;

  const { data: bidsData, refetch: refetchBids } = useGetBuyerBidsQuery(String(id), {
    pollingInterval: isAuctionLive ? 10000 : 0,
  });
  const allBids: any[] = bidsData?.data?.buyer_bids ?? [];
  const sortedBids = [...allBids].sort((a, b) => Number(b.amount) - Number(a.amount));
  const currentBid = sortedBids.length > 0 ? Number(sortedBids[0].amount) : 0;
  const totalBids = allBids.length;

  const handlePlaceBid = async () => {
    const buyerId = user?.id || Number(localStorage.getItem("userId"));
    const batchId = Number(id);
    if (!buyerId) { toast.error("Please login to place a bid"); return; }
    if (!batchId) { toast.error("Invalid batch ID"); return; }

    const hasWholeBid = useWholePrice && bidAmount && Number(bidAmount) > 0;
    const hasWeightBid = useWeightPrice && Object.values(weightPrices).some((v) => Number(v) > 0);

    if (!hasWholeBid && !hasWeightBid) { toast.error("Please provide at least one quotation"); return; }

    const quotation_types: string[] = [];
    if (hasWholeBid) quotation_types.push("whole_item");
    if (hasWeightBid) quotation_types.push("weight_based");

    const formData = new FormData();
    formData.append("batch_id", String(batchId));
    formData.append("buyer_id", String(buyerId));
    formData.append("company_name", companyBuyerName?.trim() || "");
    formData.append("contact_person", contactPerson?.trim() || "");
    formData.append("country", bidCountry?.trim() || "");
    formData.append("notes", bidNotes ?? "");
    quotation_types.forEach((type) => formData.append("quotation_types[]", type));
    if (hasWholeBid) formData.append("amount", String(Number(bidAmount)));
    if (hasWeightBid) {
      formData.append("weight_quotations", JSON.stringify({
        scrap_iron: Number(weightPrices.scrap_iron) || 0,
        special_materials: Number(weightPrices.special_materials) || 0,
        waste_disposal_fee: Number(weightPrices.waste_disposal_fee) || 0,
        others: Number(weightPrices.others) || 0,
      }));
    }
    if (documentFile) formData.append("document_image", documentFile);

    try {
      const result = await placeBid(formData).unwrap();
      if (result.success) {
        setShowBidDialog(false);
        setShowBidSuccessDialog(true);
        setBidCountry("");
        setBidAmount("");
        setBidNotes("");
        setUseWholePrice(true);
        setUseWeightPrice(false);
        setWeightPrices({});
        setDocumentFile(null);
        setPlaceBidStep("form");
        await refreshBidStatus();
      } else {
        toast.error(result?.message || "Failed to place bid");
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Failed to place bid";
      toast.error(errorMessage);
    }
  };

  const handleMakeOffer = async () => {
    const buyerId = user?.id || Number(localStorage.getItem("userId"));
    const batchId = Number(id);
    if (!buyerId) { toast.error("Please login to make an offer"); return; }
    if (!batchId) { toast.error("Invalid batch ID"); return; }

    const sellerId = data?.data?.batch?.seller_id;

    const formData = new FormData();
    formData.append("batch_id", String(batchId));
    formData.append("seller_id", String(sellerId));
    formData.append("buyer_id", String(buyerId));
    formData.append("company_name", companyBuyerName?.trim() || "");
    formData.append("contact_person", contactPerson?.trim() || "");
    formData.append("country", bidCountry?.trim() || "");
    formData.append("notes", bidNotes ?? "");
    formData.append("offer_quantity", String(offerQuantity || 1));
    if (bidAmount && Number(bidAmount) > 0) formData.append("amount", String(Number(bidAmount)));
    if (documentFile) formData.append("document_image", documentFile);

    try {
      const result: any = await submitOffer(formData).unwrap();
      if (result?.success) {
        toast.success("Offer submitted successfully!");
        setShowBidDialog(false);
        setBidAmount("");
        setBidNotes("");
        setDocumentFile(null);
        setShowBidSuccessDialog(true);
      } else {
        toast.error(result?.message || "Failed to submit offer");
      }
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || "Failed to submit offer");
    }
  };


  // Add this helper function near your other masking functions (around line ~97)
  const maskBidderName = (name: string): string => {
    if (!name) return "Anonymous";
    if (name === "Anonymous") return name;

    // If it's the current user's bid, show "You" instead of masking
    // (handled separately in the JSX)

    // For other bidders: show first letter + *** + last letter (if length > 2)
    if (name.length <= 2) {
      return name[0] + "*";
    }
    return name[0] + "*".repeat(Math.min(name.length - 2, 6)) + name[name.length - 1];
  };

  const updateWeightPrice = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    if (e.target.checked) {
      setWeightPrices((prev) => ({ ...prev, [key]: "" }));
    } else {
      setWeightPrices((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleOpenEditDialog = (bid) => {
    setSelectedBid(bid);
    setBidAmount(bid.amount || "");
    setUseWholePrice(bid.quotation_types?.includes("whole_item"));
    setUseWeightPrice(bid.quotation_types?.includes("weight_based"));
    const initialWeightPrices = {};
    if (bid.weight_quotations) {
      Object.entries(bid.weight_quotations).forEach(([key, value]) => {
        initialWeightPrices[key] = value;
      });
    }
    setWeightPrices(initialWeightPrices);
    setBidNotes(bid.notes || "");
    setPlaceBidStep("form");
    setShowBidDialog(true);
  };

  const MATERIAL_LABEL_MAP: Record<string, string> = {
    scrap_iron: "buyer.material.scrapIron",
    special_materials: "buyer.material.specialMaterial",
    waste_disposal_fee: "buyer.material.wasteDisposalFee",
    others: "buyer.material.others",
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );

  if (isError)
    return <p className="text-center py-10">{t("errorLoadingListing")}</p>;

  const parsePhpArray = (meta: string | undefined): string[] => {
    if (!meta) return [];
    try {
      const matches = [...meta.matchAll(/"([^"]+)"/g)];
      return matches.map(m => m[1]);
    } catch (e) {
      return [];
    }
  };

  const getTranslatedField = (product: any, fieldName: string) => {
    const key = `${fieldName}_${i18n.language}`;
    return product[key] || product[`${fieldName}_en`] || product[fieldName] || '';
  };

  const allowWholePrice = bidDetail?.allowWholePrice ?? false;
  const allowWeightPrice = bidDetail?.allowWeightPrice ?? false;

  const MAX_BIDS_ALLOWED = 4;
  const userBidList = Array.isArray(userBid) ? userBid : [];
  const canPlaceBid = userBidList.length <= MAX_BIDS_ALLOWED;

  const Wrapper = hideLayout ? React.Fragment : DashboardLayout;

  return (
    <Wrapper>
      <div className="min-h-screen bg-background">

        <div className="container mx-auto px-4 py-6 ">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
            <button onClick={() => navigate(hideLayout ? '/buyer-marketplace' : '/dashboard/marketplace')} className="hover:text-primary transition-colors">
              {t("buyer.home") || "Home"}
            </button>
            <span>/</span>
            <button onClick={() => navigate(-1)} className="hover:text-primary transition-colors">
              {t("buyer.marketplace") || "Marketplace"}
            </button>
            {products[0]?.title && (
              <>
                <span>/</span>
                <span className="text-foreground font-medium truncate max-w-[300px]">{products[0].title}</span>
              </>
            )}
          </nav>

          {/* Render Products */}
          <div className="space-y-12">
            {products.map((product, index) => (
              <div key={product.id}>

                {/* === TOP SECTION: Gallery + Action Panel === */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* Left: Image Gallery (2/3 width) */}
                  <div className="lg:col-span-2">
                    <ProductMedia product={product} getTranslatedField={getTranslatedField} />
                  </div>

                  {/* Right: Action Panel — 101Lab design */}
                  {index === 0 && (
                    <div className="lg:col-span-1 space-y-0  ">

                      {/* Title */}
                      <h1 className="text-2xl font-bold text-foreground leading-tight mb-3">
                        {getTranslatedField(product, 'title')}
                      </h1>

                      {/* Sales / Lot Type */}
                      <div className="flex items-baseline gap-1.5 text-sm mb-2 py-2">
                        <span className="text-muted-foreground font-medium">{t("buyer.bidType")}:</span>
                        <span className="font-medium text-foreground flex items-center gap-1">
                          {bidDetail ? t(bidTypeMap[bidDetail?.type]) : (product.lot_type || "—")}
                          <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-1.5 text-sm mb-2 ">
                        <span className="text-muted-foreground font-medium">{t("buyer.location")}:</span>
                        <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="text-primary font-medium">
                          {parsePhpArray(product.location)}{batchCountry ? `, ${batchCountry}` : ""}
                        </span>
                      </div>

                      {/* Removal & Shipping */}
                      <div className="flex items-baseline gap-1.5 text-sm mb-6 py-4">
                        <span className="text-muted-foreground font-medium">Removal &amp; Shipping:</span>
                        <span className="text-foreground">
                          {product.removal_shipping || "Buyer Must Arrange."}
                          {" "}
                          <button
                            onClick={() => {
                              const el = document.getElementById("logistics-section");
                              if (el) el.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="text-primary hover:underline text-xs font-medium"
                          >
                            See details.
                          </button>
                        </span>
                      </div>

                      {/* Countdown / Bid Status */}
                      {bidDetail && isLiveBidding && batchStep > 4 && (
                        <div className="flex items-center justify-between bg-green-50 border border-green-300 rounded-md px-4 py-2.5 mb-3">
                          <span className="text-sm font-semibold text-green-800">{t("buyer.endsIn")}:</span>
                          <span className="text-sm font-bold text-green-900 tabular-nums">
                            {timeLeft.days}D : {String(timeLeft.hours).padStart(2, "0")}H : {String(timeLeft.minutes).padStart(2, "0")}M : {String(timeLeft.seconds).padStart(2, "00")}S
                          </span>
                        </div>
                      )}
                      {bidDetail && isBidEnded && batchStep > 4 && (
                        <div className="flex items-center gap-2 py-2.5 px-3 bg-muted/60 rounded border border-border/50 mb-3">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-semibold text-muted-foreground">{t("buyer.bidClosed") || "Bidding Ended"}</span>
                        </div>
                      )}
                      {isBidScheduled && bidStartDate && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs mb-3">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>
                            {t("buyer.opensOn") || "Opens on"}:{" "}
                            <span className="font-semibold">
                              {new Intl.DateTimeFormat(i18n.language === "zh" ? "zh-TW" : "en-US", {
                                year: "numeric", month: "short", day: "numeric",
                                hour: "2-digit", minute: "2-digit", timeZoneName: "short",
                              }).format(bidStartDate)}
                            </span>
                          </span>
                        </div>
                      )}

                      {/* YOUR OFFER AMOUNT box */}
                      {isLiveBidding && bidDetail?.type === "make_offer" && batchStep < 6 && (
                        <div className="border border-border rounded-lg p-4 mb-3 bg-background">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                            YOUR OFFER AMOUNT
                          </p>
                          <div className="relative mb-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground text-sm select-none">
                              <Tag className="w-3.5 h-3.5" /> {bidDetail?.currency || "USD"}
                            </span>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                              placeholder="Enter amount"
                              className="w-full border border-border rounded-md pl-24 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                            />
                          </div>
                          {bidDetail?.target_price && Number(bidDetail.target_price) > 0 && (
                            <p className="text-[11px] text-muted-foreground">
                              Suggested starting offer:{" "}
                              <span className="font-semibold text-foreground">
                                {bidDetail.currency || "USD"} {Number(bidDetail.target_price).toLocaleString()}
                              </span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Primary Action Button */}
                      {products.length > 0 && batchStep < 6 && (
                        <div className="space-y-2 mb-3">
                          {isLiveBidding && (
                            <>
                              {bidDetail?.isAuction ? (
                                <Button
                                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base py-5 rounded-lg"
                                  onClick={() => {
                                    if (!localStorage.getItem("userId")) {
                                      openLoginModal({ portalType: "buyer", onSuccess: () => openDialogFor(products[0], "bidding", "place_bid") });
                                      return;
                                    }
                                    if (!canPlaceBid) {
                                      toast.error(t("toastError.maxBidLimit", { count: MAX_BIDS_ALLOWED }));
                                      return;
                                    }
                                    openDialogFor(products[0], "bidding", "place_bid");
                                  }}
                                >
                                  {t("buyer.placeBid")}
                                </Button>
                              ) : bidDetail?.type === "make_offer" ? (
                                <Button
                                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base py-5 rounded-lg"
                                  onClick={() => {
                                    if (!localStorage.getItem("userId")) {
                                      openLoginModal({ portalType: "buyer", onSuccess: () => openDialogFor(products[0], "bidding", "make_offer") });
                                      return;
                                    }
                                    openDialogFor(products[0], "bidding", "make_offer");
                                  }}
                                >
                                  {t("buyer.makeOffer") || "Make Offer"}
                                </Button>
                              ) : bidDetail?.type === "fixed_price" ? (
                                <Button
                                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base py-5 rounded-lg"
                                  onClick={() => {
                                    if (!localStorage.getItem("userId")) {
                                      openLoginModal({ portalType: "buyer", onSuccess: () => openDialogFor(products[0], "bidding", "buy_now") });
                                      return;
                                    }
                                    openDialogFor(products[0], "bidding", "buy_now");
                                  }}
                                >
                                  {t("buyer.buyNow") || "Buy Now"}
                                </Button>
                              ) : null}
                            </>
                          )}
                          {!isLiveBidding && !isBidScheduled && !isBidEnded && batchStatus?.includes("inspection") && !userInspectionRegistration?.joined && !userInspectionRegistration?.selected && (
                            <Button
                              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base py-5 rounded-lg"
                              onClick={() => openDialogFor(products[0], "inspect")}
                            >
                              {t("buyer.joinInspection")}
                            </Button>
                          )}
                          {isBidEnded && batchStep < 6 && (
                            <Button disabled className="w-full bg-muted text-muted-foreground py-5 font-semibold rounded-lg">
                              {t("buyer.bidClosed") || "Bidding Ended"}
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Inspection badges */}
                      {batchStatus?.includes("inspection") && (
                        <div className="mb-3">
                          {userInspectionRegistration?.selected ? (
                            <Badge className="w-full justify-center py-2 font-semibold text-sm bg-green-100 text-green-700">
                              Selected for Inspection
                            </Badge>
                          ) : userInspectionRegistration?.joined ? (
                            <Badge className="w-full justify-center py-2 font-semibold text-sm bg-yellow-100 text-yellow-700">
                              Inspection Joined
                            </Badge>
                          ) : null}
                        </div>
                      )}

                      {/* Add to Wishlist */}
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full font-semibold text-base py-5 rounded-lg border-2 mb-3 py-4",
                          wishlistMap[product.id] ? "border-primary text-primary bg-primary/5" : "border-border text-foreground"
                        )}
                        disabled={!!wishlistLoading[product.id]}
                        onClick={() => handleWishlistToggle(product.id, product.title)}
                      >
                        <Heart className={cn("w-4 h-4 mr-2", wishlistMap[product.id] && "fill-primary text-primary")} />
                        {wishlistMap[product.id] ? "Saved to Wishlist" : "Add to Wishlist"}
                      </Button>

                      {/* Watchers / Visitors stats */}
                      {/* <div className="grid grid-cols-2 gap-3 mb-4 py-4">
                        <div className="flex items-center gap-3 border border-border rounded-lg px-4 py-3 bg-background">
                          <Eye className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">WATCHERS</p>
                            <p className="text-lg font-bold text-foreground leading-none">
                              {product.watchers_count || data?.data?.batch?.watchers_count || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 border border-border rounded-lg px-4 py-3 bg-background">
                          <Users className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">VISITORS</p>
                            <p className="text-lg font-bold text-foreground leading-none">
                              {product.visitors_count || data?.data?.batch?.visitors_count || "—"}
                            </p>
                          </div>
                        </div>
                      </div> */}

                      {/* Meta rows: Taxes, Buyer's Premium, Seller's Terms, Seller's Other Items, Event */}
                      <div className="divide-y divide-border border border-border rounded-lg overflow-hidden mb-4">
                        <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                          <span className="text-foreground font-medium">Taxes</span>
                          <span className="text-primary text-xs font-medium">To be added at payment</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                          <span className="text-foreground font-medium">Buyer's Premium</span>
                          <span className="text-foreground font-semibold">
                            {product.buyer_premium || data?.data?.batch?.buyer_premium
                              ? `${product.buyer_premium || data?.data?.batch?.buyer_premium}%`
                              : "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                          <span className="text-foreground font-medium">Seller's Terms &amp; Conditions</span>
                          <button
                            onClick={() => {
                              const el = document.getElementById("sale-terms-section");
                              if (el) el.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="text-primary hover:underline text-xs font-medium"
                          >
                            View
                          </button>
                        </div>
                        <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                          <span className="text-foreground font-medium">Seller's Other Items</span>
                          <button
                            onClick={() => navigate(hideLayout ? '/buyer-marketplace' : '/dashboard/marketplace')}
                            className="text-primary hover:underline text-xs font-medium"
                          >
                            View
                          </button>
                        </div>
                        <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                          <span className="text-foreground font-medium">Event</span>
                          <span className="text-primary font-medium text-xs">
                            {product.event_id || data?.data?.batch?.batch_number
                              ? `Event-${product.event_id || data?.data?.batch?.batch_number}`
                              : "—"}
                          </span>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                          onClick={() => {
                            if (!localStorage.getItem("userId")) {
                              openLoginModal({ portalType: "buyer", onSuccess: () => setShowMessageDialog(true) });
                              return;
                            }
                            setShowMessageDialog(true);
                          }}
                          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors font-medium text-sm"
                        >
                          <MessageCircle className="w-4 h-4 flex-shrink-0" />
                          {t("buyer.messageSeller")}
                        </button>
                        <button
                          onClick={handleShare}
                          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded border border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium text-sm"
                        >
                          {copied ? <Check className="w-4 h-4 text-green-600 flex-shrink-0" /> : <Share2 className="w-4 h-4 flex-shrink-0" />}
                          {copied ? (t("buyer.linkCopied") || "Copied!") : (t("buyer.share") || "Share")}
                        </button>
                      </div>

                      {/* Bid History (Live Auction) */}
                      {bidDetail && bidDetail?.isAuction && isLiveBidding && batchStep > 4 && sortedBids.length > 0 && (
                        <div className="border border-border rounded overflow-hidden mb-3">
                          <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border">
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                              {t("buyer.bidHistory") || "Bid History"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{totalBids} {t("buyer.total") || "total"}</p>
                          </div>
                          <div className="divide-y divide-border max-h-52 overflow-y-auto">
                            {(showAllBids ? sortedBids : sortedBids.slice(0, 5)).map((bid: any, idx: number) => {
                              const userId = user?.id || Number(localStorage.getItem("userId"));
                              const isMyBid = String(bid.buyer_id) === String(userId);
                              const isAccepted = bid.status === "accepted";
                              const bidderName = bid.company_name || bid.contact_person || "Anonymous";
                              return (
                                <div
                                  key={bid.buyer_bid_id ?? idx}
                                  className={`flex items-center justify-between px-3 py-2 text-xs ${isMyBid ? "bg-primary/10 border-l-2 border-l-primary" : "bg-background"}`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${isMyBid ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                      {bidderName[0]?.toUpperCase() || "?"}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-foreground flex items-center gap-1">
                                        {isMyBid ? (
                                          <span className="text-primary">{t("buyer.you") || "You"}</span>
                                        ) : (
                                          <span className="text-foreground">{maskBidderName(bidderName)}</span>
                                        )}
                                        {isMyBid && <span className="text-[8px] bg-primary/15 text-primary px-1 rounded">YOUR BID</span>}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground">
                                        {new Date(bid.submitted_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-2">
                                    <p className="font-bold text-foreground">
                                      {Number(bid.amount).toLocaleString()} {bidDetail?.currency || ""}
                                    </p>
                                    {isAccepted && (
                                      <span className="text-[8px] bg-green-100 text-green-700 px-1 py-0.5 rounded font-semibold">ACCEPTED</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {sortedBids.length > 5 && (
                            <button
                              onClick={() => setShowAllBids((v) => !v)}
                              className="w-full py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/5 transition-colors border-t border-border"
                            >
                              {showAllBids ? `Show less ↑` : `View more (${sortedBids.length - 5} more) ↓`}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Inspection Registration Details */}
                      {batchStatus?.includes("inspection") && userInspectionRegistration?.joined && (
                        <Card className="border border-border/50 bg-muted/30 mb-3">
                          <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-semibold">
                              {t("buyer.registrationDetails") || "Your Registration Details"}
                            </CardTitle>
                            <button
                              onClick={() => {
                                setEditDialogData(userInspectionRegistration.companyData);
                                setCompanyName(userInspectionRegistration.companyData.company_name);
                                setSelectedInspectionDate(new Date(userInspectionRegistration.companyData.date + "T00:00:00"));
                                setSelectedInspectionSlot(userInspectionRegistration.companyData.slot);
                                setShowInspectionDialog(true);
                              }}
                              className="text-primary hover:text-primary/80"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("buyerDashboard.companyName")}</p>
                              <p className="font-semibold text-foreground">{userInspectionRegistration.companyData.company_name}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("buyer.scheduledDate") || "Scheduled Date"}</p>
                              <p className="font-semibold text-foreground">{formatDate(userInspectionRegistration.companyData.date, i18n.language)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("buyer.scheduledTimeSlot") || "Time Slot"}</p>
                              <p className="font-semibold text-foreground">{userInspectionRegistration.companyData.slot}</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* User Bid Cards */}
                      {userBid && userBid.length > 0 && userBid.map((bid) => (
                        <Card key={bid.buyer_bid_id} className="border border-border/50 bg-muted/30 mb-3">
                          <CardHeader className="pb-1">
                            <CardTitle className="text-sm font-semibold">{t('buyer.bidDetails')}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('buyerDashboard.companyName')}</p>
                              <p className="font-semibold text-foreground">{maskBidderName(bid.company_name)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('buyerDashboard.amount')} ({bidDetail && bidDetail?.currency})</p>
                              {bid.quotation_types?.includes("whole_item") && bid.amount && (
                                <p className="font-semibold text-foreground">{t('buyerDashboard.wholePrice')}: {Number(bid.amount).toLocaleString()}</p>
                              )}
                              {bid.quotation_types?.includes("weight_based") && bid.weight_quotations && (
                                <div className="font-semibold text-foreground space-y-0.5">
                                  <p>{t('buyerDashboard.priceByWeight')}:</p>
                                  <ul className="list-disc list-inside text-xs">
                                    {WEIGHT_ITEMS.map(({ key, label }) => {
                                      const value = bid.weight_quotations[key];
                                      return value ? <li key={key}>{label}: {Number(value).toLocaleString()}</li> : null;
                                    })}
                                  </ul>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('buyer.table.Status')}</p>
                              <p className="font-semibold text-foreground">
                                {bid.status === "pending" && t('buyerDashboard.bidStatusPending')}
                                {bid.status === "accepted" && t('buyerDashboard.bidStatusAccepted')}
                                {bid.status === "rejected" && t('buyerDashboard.bidStatusRejected')}
                                {bid.status === "counter_offer" && t('buyerDashboard.bidStatusCounterOffer')}
                              </p>
                            </div>
                            {bid.notes && (
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('buyerDashboard.notes')}</p>
                                <p className="font-semibold text-foreground">{bid.notes}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}

                      {/* Edit Bid Modal */}
                      {editOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                          <div className="bg-card rounded-lg p-4 w-80 border border-border">
                            <h3 className="font-semibold text-lg mb-3 text-foreground">Edit Your Bid</h3>
                            <input
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="border border-border bg-background text-foreground p-2 w-full mb-4 rounded"
                              placeholder="Enter new bid amount"
                            />
                            <div className="flex justify-end gap-2">
                              <button className="px-3 py-1 bg-muted text-muted-foreground rounded" onClick={() => setEditOpen(false)}>Cancel</button>
                              <button className="px-3 py-1 bg-primary text-primary-foreground rounded" onClick={handleUpdate} disabled={isLoading}>
                                {isLoading ? "Updating..." : "Save"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {products.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          {t("buyer.noProductsAvailable") || "No products available"}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* === BOTTOM SECTION: Details === */}
                <div className="mt-10 space-y-10 max-w-4xl">

                  {/* Core Specifications */}
                  <section>
                    <h2 className="text-xl font-bold text-foreground mb-5">Core Specifications</h2>
                    <div className="border border-border rounded-xl overflow-hidden">
                      {/* Description rich content covers full spec info */}
                      {(() => {
                        const desc = getTranslatedField(product, 'description') || "";
                        const hasHtml = /<[a-z][\s\S]*>/i.test(desc);
                        return (
                          <div className="p-5">
                            {/* Structured meta fields if populated */}
                            {(product.manufacturer || product.model || product.serial_number || product.dimensions || product.weight || product.condition !== "N/A" || product.category !== "N/A") && (
                              <div className="space-y-3 mb-5">
                                {product.manufacturer && (
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <Wrench className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div className="text-sm space-y-0.5">
                                      <p className="text-foreground"><span className="font-semibold">Manufacturer:</span> {product.manufacturer}</p>
                                      {product.model && <p className="text-foreground"><span className="font-semibold">Model:</span>{" "}<span className="text-primary">{product.model}</span></p>}
                                      {product.serial_number && <p className="text-foreground"><span className="font-semibold">Serial Number / VIN:</span> {product.serial_number}</p>}
                                    </div>
                                  </div>
                                )}
                                {(product.dimensions || product.weight) && (
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <Layers className="w-4 h-4 text-teal-600" />
                                    </div>
                                    <div className="text-sm space-y-0.5">
                                      {product.dimensions && <p className="text-foreground"><span className="font-semibold">Dimensions:</span>{" "}<span className="text-primary">{product.dimensions}</span></p>}
                                      {product.weight && <p className="text-foreground"><span className="font-semibold">Weight:</span> {product.weight}</p>}
                                    </div>
                                  </div>
                                )}
                                {product.condition && product.condition !== "N/A" && (
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div className="text-sm">
                                      <p className="text-foreground">
                                        <span className="font-semibold">Condition:</span>{" "}
                                        <span className="text-primary capitalize">{product.condition}</span>
                                        {" "}\u2014 Item functions as originally intended, shows signs of normal wear.
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {product.category && product.category !== "N/A" && (
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <Layers className="w-4 h-4 text-orange-600" />
                                    </div>
                                    <div className="text-sm">
                                      <p className="text-foreground">
                                        <span className="font-semibold">{t("buyer.category")}:</span>{" "}
                                        <span className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">{product.category}</span>
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Rich HTML description */}
                            {desc && (
                              hasHtml
                                ? <div className="rich-content text-sm text-muted-foreground max-w-none" dangerouslySetInnerHTML={{ __html: desc }} />
                                : <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </section>

                  {/* Logistics */}
                  {(() => {
                    const extra = getTranslatedField(product, 'extra_content') || "";
                    const hasLogisticsMeta = product.rigging_responsibility || product.loading_responsibility || product.shipping_responsibility || product.packaging_type;
                    if (!extra && !hasLogisticsMeta) return null;
                    return (
                      <section id="logistics-section">
                        <h2 className="text-xl font-bold text-foreground mb-5">Logistics</h2>
                        <div className="border border-border rounded-xl overflow-hidden">
                          <div className="p-5">
                            <div className="flex items-start gap-3 mb-4">
                              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Truck className="w-4 h-4 text-orange-600" />
                              </div>
                              <div className="text-sm space-y-2 flex-1">
                                {product.rigging_responsibility && (
                                  <p className="text-foreground">
                                    <span className="font-semibold">Rigging Responsibility:</span>{" "}
                                    <span className={cn(
                                      "inline-block px-2 py-0.5 rounded border text-xs font-semibold",
                                      product.rigging_responsibility.toLowerCase() === "included"
                                        ? "border-green-500 text-green-700 bg-green-50"
                                        : "border-border text-foreground bg-muted/40"
                                    )}>
                                      {product.rigging_responsibility}
                                    </span>
                                  </p>
                                )}
                                {product.loading_responsibility && (
                                  <p className="text-foreground">
                                    <span className="font-semibold">Loading Responsibility:</span>{" "}
                                    <span className={cn(
                                      "inline-block px-2 py-0.5 rounded border text-xs font-semibold",
                                      product.loading_responsibility.toLowerCase() === "included"
                                        ? "border-green-500 text-green-700 bg-green-50"
                                        : "border-border text-foreground bg-muted/40"
                                    )}>
                                      {product.loading_responsibility}
                                    </span>
                                  </p>
                                )}
                                {product.shipping_responsibility && (
                                  <p className="text-foreground">
                                    <span className="font-semibold">Shipping Responsibility:</span>{" "}
                                    <span className="text-foreground">{product.shipping_responsibility}</span>
                                    {" "}Or{" "}
                                    <span className="inline-flex items-center gap-1 border border-primary text-primary text-xs px-2 py-0.5 rounded font-semibold">
                                      101Lab Delivery!{" "}
                                      <button className="underline hover:no-underline text-primary">Get a Quote!</button>
                                    </span>
                                  </p>
                                )}
                                {product.packaging_type && (
                                  <p className="text-foreground">
                                    <span className="font-semibold">Packaging Type:</span> {product.packaging_type}
                                  </p>
                                )}
                              </div>
                            </div>
                            {/* Rich HTML extra content */}
                            {extra && (
                              <div className="rich-content text-sm text-muted-foreground max-w-none mt-3 pt-3 border-t border-border/50" dangerouslySetInnerHTML={{ __html: extra }} />
                            )}
                          </div>
                        </div>
                      </section>
                    );
                  })()}

                  {/* Documents */}
                  {product.documents.length > 0 && (
                    <section>
                      <h2 className="text-xl font-bold text-foreground mb-4">Documents</h2>
                      <ul className="space-y-2">
                        {product.documents.map((doc) => {
                          const urls = extractUrls(doc.url);
                          return urls.map((fileUrl, idx) => {
                            const rawFileName = fileUrl.split("/").pop() || `Document ${idx + 1}`;
                            let fileName;
                            try {
                              fileName = decodeURIComponent(rawFileName);
                              fileName = fileName.replace(/[^\w\u4E00-\u9FFF\.\-]/g, "_");
                              if (!fileName || fileName === "_") fileName = `Document ${idx + 1}`;
                            } catch (e) {
                              fileName = `Document ${idx + 1}`;
                            }
                            return (
                              <li key={fileName} className="flex items-center justify-between bg-muted/20 px-4 py-3 rounded-lg border border-border text-sm">
                                <span className="text-foreground truncate">{fileName}</span>
                                <a href={fileUrl} target="_blank" download={fileName} className="text-primary text-xs font-medium hover:underline ml-4 flex-shrink-0">
                                  Download
                                </a>
                              </li>
                            );
                          });
                        })}
                      </ul>
                    </section>
                  )}

                  {/* Inspection Details */}
                  {product.phase === "inspection" && (product.inspectionDate || product.inspectionTime) && (
                    <section>
                      <h2 className="text-xl font-bold text-foreground mb-4">{t("buyer.inspectionDetails")}</h2>
                      <div className="border border-border rounded-xl p-5 space-y-2">
                        {product.inspectionDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <p className="text-foreground">{product.inspectionDate}</p>
                          </div>
                        )}
                        {product.inspectionTime && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <p className="text-foreground">{product.inspectionTime}</p>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Sale Terms & Conditions */}
                  <section id="sale-terms-section">
                    <h2 className="text-xl font-bold text-foreground mb-4">Sale Terms &amp; Conditions</h2>
                    <div className="rounded-xl border border-border divide-y divide-border">
                      {[
                        {
                          key: "inspection",
                          label: "Inspection Terms",
                          content: "All items are sold as-is, where-is. Buyers are encouraged to inspect items prior to bidding. Inspection appointments must be scheduled in advance. The seller makes no warranty, expressed or implied, regarding the condition, fitness for use, or merchantability of any item.",
                        },
                        {
                          key: "seller",
                          label: "Seller Terms",
                          content: "Payment is due within 3 business days of award notification. Accepted payment methods include bank transfer, escrow, and approved digital payment methods. Items not paid for within the specified timeframe may be forfeited without refund of any deposit.",
                        },
                        {
                          key: "removal",
                          label: "Removal Terms",
                          content: "All purchased items must be removed within 10 business days of payment confirmation. Buyer is responsible for all rigging, loading, and transportation costs unless otherwise stated. Items not removed by the deadline may be subject to storage fees or forfeiture.",
                        },
                      ].map(({ key, label, content }) => (
                        <div key={key}>
                          <button
                            type="button"
                            onClick={() => setOpenTerm(openTerm === key ? null : key)}
                            className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors text-left"
                          >
                            <span>{label}</span>
                            <ChevronDown
                              className={cn(
                                "w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0",
                                openTerm === key && "rotate-180"
                              )}
                            />
                          </button>
                          {openTerm === key && (
                            <div className="px-5 pb-4 text-sm text-muted-foreground">
                              {content}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* 101Lab Terms and Conditions */}
                  <section>
                    <h2 className="text-xl font-bold text-foreground mb-4">101Lab Terms and Conditions</h2>
                    <div className="rounded-xl border border-border divide-y divide-border">
                      {[
                        {
                          key: "terms-of-use",
                          label: "Terms of Use",
                          content: (
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold text-foreground mb-1">Acceptance of Terms</h4>
                                <p>By accessing and using GIH Co. Ltd, you agree to comply with and be bound by these Terms of Use. If you do not agree, please refrain from using the Site.</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground mb-1">Intellectual Property</h4>
                                <p>All content, including text, graphics, logos, and code, is the property of GIH Co. Ltd or its content suppliers and is protected by international copyright laws. You may not reproduce, distribute, or create derivative works without express written permission.</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground mb-1">User Conduct</h4>
                                <p className="mb-1">Users agree not to:</p>
                                <ul className="list-disc list-inside space-y-1 pl-2">
                                  <li>Use the Site for any unlawful purpose.</li>
                                  <li>Attempt to interfere with the proper working of the Site or bypass security measures.</li>
                                  <li>Post or transmit any software viruses or malicious code.</li>
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground mb-1">Disclaimer of Warranties</h4>
                                <p>The Site and its contents are provided on an "as-is" basis. GIH Co. Ltd makes no representations or warranties of any kind, express or implied, regarding the accuracy or availability of the Site.</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground mb-1">Limitation of Liability</h4>
                                <p>In no event shall GIH Co. Ltd be liable for any damages (including, without limitation, damages for loss of data or profit) arising out of the use or inability to use the materials on the Site.</p>
                              </div>
                            </div>
                          ),
                        },
                        {
                          key: "privacy-policy",
                          label: "Privacy Policy",
                          content: (
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold text-foreground mb-1">Information We Collect</h4>
                                <p className="mb-1">We collect information to provide better services to our users. This may include:</p>
                                <ul className="list-disc list-inside space-y-1 pl-2">
                                  <li><span className="font-medium text-foreground">Personal Information:</span> Name, email address, or contact details provided voluntarily via forms.</li>
                                  <li><span className="font-medium text-foreground">Usage Data:</span> IP addresses, browser types, and pages visited, collected automatically via cookies to improve site performance.</li>
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground mb-1">How We Use Your Information</h4>
                                <p className="mb-1">We use the collected data to:</p>
                                <ul className="list-disc list-inside space-y-1 pl-2">
                                  <li>Operate and maintain the Site.</li>
                                  <li>Respond to inquiries or provide customer support.</li>
                                  <li>Monitor usage patterns to enhance user experience.</li>
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground mb-1">Cookies</h4>
                                <p>We use cookies to track activity on our Site. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, some portions of the Site may not function properly without them.</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground mb-1">Data Security</h4>
                                <p>The security of your data is important to us, but remember that no method of transmission over the Internet is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground mb-1">Third-Party Links</h4>
                                <p>Our Site may contain links to other sites that are not operated by us. We strongly advise you to review the Privacy Policy of every site you visit.</p>
                              </div>
                            </div>
                          ),
                        },
                      ].map(({ key, label, content }) => (
                        <div key={key}>
                          <button
                            type="button"
                            onClick={() => setOpenTerm(openTerm === key ? null : key)}
                            className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors text-left"
                          >
                            <span>{label}</span>
                            <ChevronDown
                              className={cn(
                                "w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0",
                                openTerm === key && "rotate-180"
                              )}
                            />
                          </button>
                          {openTerm === key && (
                            <div className="px-5 pb-5 text-sm text-muted-foreground">
                              {content}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Buy with Confidence on 101Lab */}
                  <section className="pb-6">
                    <h2 className="text-xl font-bold text-foreground mb-2">Buy with Confidence on 101Lab</h2>
                    <p className="text-sm text-primary mb-5">Built for industrial buyers across Asia-Pacific.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3">
                      {[
                        "Verified sellers across India, China, Japan, Korea & SEA",
                        "GST, VAT & customs documentation handled",
                        "Escrow-secured payments via UPI, Alipay & bank transfer",
                        "Port-to-port & door-to-door freight across APAC",
                        "On-site inspection available in 50+ Asian cities",
                        "Multi-currency pricing \u2014 INR, CNY, JPY, SGD, USD",
                        "WhatsApp, WeChat & LINE seller chat support",
                        "Local-language support: English, Hindi, Mandarin, Japanese",
                        "Trusted logistics partners \u2014 DHL, Maersk, ONE Line",
                        "Compliance with India BIS, China CCC & Japan PSE standards",
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-2 text-sm text-foreground">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                </div>

              </div>
            ))}
          </div>
        </div>

        {/* ------------- Dialogs ------------- */}

        {/* Place Bid / Make Offer Dialog */}
        <Dialog open={showBidDialog} onOpenChange={(open) => { setShowBidDialog(open); if (!open) setPlaceBidStep("form"); }}>
          <DialogContent className="max-h-[90vh] overflow-hidden">

            {bidDialogMode === "make_offer" ? (
              /* ── Make Offer: 2-step flow ── */
              <>
                <DialogHeader>
                  <DialogTitle>
                    {makeOfferStep === "review" ? "Confirm Your Offer" : (t("buyer.makeOfferTitle") || "Make Offer")}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {makeOfferStep === "review"
                      ? "Please double-check before submitting. This action cannot be undone."
                      : "Submit your price for this item."}
                  </p>
                </DialogHeader>

                {makeOfferStep === "form" ? (
                  <div className="space-y-4 py-2">
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                        {t("buyer.company") || "Company"}
                      </Label>
                      <Input value={companyBuyerName} disabled className="bg-muted/40" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                        {t("buyer.contactPerson") || "Contact Person"}
                      </Label>
                      <Input value={contactPerson} disabled className="bg-muted/40" />
                    </div>
                    <div>
                      {/* <Label className="text-sm font-semibold text-foreground mb-2 block">
                        {t("makeOfferModal.offerQuantity") || "Offer Quantity"}
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max={products[0]?.quantity !== "N/A" ? Number(products[0]?.quantity) : undefined}
                        step="1"
                        value={offerQuantity}
                        onChange={(e) => setOfferQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        placeholder={t("makeOfferModal.offerQuantityPlaceholder") || "Enter quantity"}
                      /> */}
                      {/* {products[0]?.quantity && products[0].quantity !== "N/A" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("auctionPage.maximumUnits", { count: products[0].quantity })}
                        </p>
                      )} */}
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-foreground mb-2 block">
                        Offer Price ({bidDetail?.currency || "USD"})
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium select-none">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder="Enter your offer"
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setShowBidDialog(false)}>
                        {t("common.cancel") || "Cancel"}
                      </Button>
                      <Button
                        type="button"
                        className="flex-1 bg-[#1a3c2a] hover:bg-[#152e21] text-white"
                        onClick={() => {
                          if (!bidAmount || Number(bidAmount) <= 0) {
                            toast.error("Please enter a valid offer amount");
                            return;
                          }
                          setMakeOfferStep("review");
                        }}
                      >
                        Review Offer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 py-2">
                    <div className="border border-border rounded-lg overflow-hidden text-sm">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                        <span className="text-muted-foreground">Company</span>
                        <span className="font-semibold text-foreground text-right max-w-[60%] break-words">{companyBuyerName}</span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                        <span className="text-muted-foreground">Contact</span>
                        <span className="font-semibold text-foreground text-right max-w-[60%] break-words">{contactPerson}</span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-muted-foreground">{t("makeOfferModal.quantity") || "Quantity"}</span>
                        <span className="font-semibold text-foreground">{offerQuantity}</span>
                      </div>
                    </div>

                    <div className="border border-amber-200 bg-amber-50/60 rounded-lg p-5 text-center">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Your Offer</p>
                      <p className="text-3xl font-bold text-foreground">
                        {bidDetail?.currency || "USD"} {Number(bidAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    <p className="text-sm text-center text-muted-foreground">Are you sure you want to submit this offer?</p>

                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setMakeOfferStep("form")}>
                        Go Back
                      </Button>
                      <Button
                        type="button"
                        className="flex-1 bg-[#1a3c2a] hover:bg-[#152e21] text-white"
                        disabled={isSubmittingOffer}
                        onClick={handleMakeOffer}
                      >
                        {isSubmittingOffer ? t("buyer.submitting") : "Yes, Submit Offer"}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* ── Place Bid / Buy Now: 2-step flow ── */
              <>
                <DialogHeader>
                  <DialogTitle>
                    {placeBidStep === "review"
                      ? bidDialogMode === "buy_now"
                        ? (t("buyer.confirmBuyNow") || "Confirm your purchase")
                        : (t("buyer.confirmBid") || "Confirm your bid")
                      : bidDialogMode === "buy_now"
                        ? (t("buyer.buyNowTitle") || "Buy Now")
                        : t("buyer.placeBidTitle")}
                  </DialogTitle>
                  {placeBidStep === "review" && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Please double-check before submitting. This action cannot be undone.
                    </p>
                  )}
                </DialogHeader>

                {placeBidStep === "form" ? (
                  /* ── Bid Form ── */
                  <div className="overflow-y-auto max-h-[calc(90vh-80px)] pr-2">
                    <div className="space-y-4 py-4">

                      <div>
                        <Label>{t("buyer.company")}</Label>
                        <Input value={companyBuyerName} disabled />
                      </div>

                      <div>
                        <Label>{t("buyer.contactPerson")}</Label>
                        <Input value={contactPerson} disabled />
                      </div>

                      <div>
                        <Label>{t("buyer.country")}</Label>
                        <select
                          value={bidCountry}
                          onChange={(e) => setBidCountry(e.target.value)}
                          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {ASIA_COUNTRIES.map((country) => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>

                      {/* Bid Amount */}
                      <div>
                        <Label>{t("buyer.wholeItemPrice") || "Bid Amount"} ({bidDetail?.currency})</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={bidAmount}
                          onChange={(e) => { if (bidDialogMode !== "buy_now") setBidAmount(e.target.value); }}
                          placeholder={t("biddingStep.enterTotalPrice") || "Enter amount"}
                          readOnly={bidDialogMode === "buy_now"}
                          className={bidDialogMode === "buy_now" ? "bg-muted cursor-not-allowed" : ""}
                        />
                      </div>

                      {/* Weight-based quotation type */}
                      {allowWeightPrice && (
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={useWeightPrice} onChange={(e) => setUseWeightPrice(e.target.checked)} />
                          <span>{t("buyer.priceByWeight")}</span>
                        </div>
                      )}

                      {useWeightPrice && (
                        <div className="space-y-3 border rounded-md p-3">
                          <Label>{t("buyer.pricePerKg")}</Label>
                          {WEIGHT_ITEMS.map((item) => (
                            <div key={item.key} className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={weightPrices[item.key] !== undefined}
                                onChange={(e) => updateWeightPrice(e, item.key)}
                              />
                              <span className="w-40">{item.label}</span>
                              {weightPrices[item.key] !== undefined && (
                                <Input
                                  type="number"
                                  placeholder={t("buyer.pricePerKg")}
                                  value={weightPrices[item.key]}
                                  onChange={(e) => setWeightPrices((prev) => ({ ...prev, [item.key]: e.target.value }))}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div>
                        <Label>{t("buyer.notes")}</Label>
                        <Textarea rows={3} value={bidNotes} onChange={(e) => setBidNotes(e.target.value)} />
                      </div>

                      {bidDialogMode === "buy_now" && bidDetail?.target_price && Number(bidDetail.target_price) > 0 && (
                        <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded border border-border text-sm">
                          <span className="text-muted-foreground">{t("buyer.price") || "Price"}</span>
                          <span className="font-bold text-primary text-base">
                            {bidDetail.currency || "TWD"} {Number(bidDetail.target_price).toLocaleString()}
                          </span>
                        </div>
                      )}

                      <Button
                        className="w-full"
                        onClick={() => {
                          if (selectedBid) {
                            handleUpdateBid();
                            return;
                          }
                          // Validate before showing review
                          const hasWholeBid = useWholePrice && bidAmount && Number(bidAmount) > 0;
                          const hasWeightBid = useWeightPrice && Object.values(weightPrices).some((v) => Number(v) > 0);
                          if (!hasWholeBid && !hasWeightBid) {
                            toast.error("Please provide at least one quotation");
                            return;
                          }
                          setPlaceBidStep("review");
                        }}
                      >
                        {bidDialogMode === "buy_now"
                          ? (t("buyer.buyNow") || "Buy Now")
                          : selectedBid
                            ? t("buyer.updateBid")
                            : "Review bid"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* ── Bid Review / Confirm ── */
                  <div className="space-y-5 py-2">
                    <div className="border border-border rounded-lg overflow-hidden text-sm">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                        <span className="text-muted-foreground">Company</span>
                        <span className="font-semibold text-foreground text-right max-w-[60%] break-words">{companyBuyerName}</span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                        <span className="text-muted-foreground">Contact</span>
                        <span className="font-semibold text-foreground text-right max-w-[60%] break-words">{contactPerson}</span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-muted-foreground">Country</span>
                        <span className="font-semibold text-foreground">{bidCountry}</span>
                      </div>
                    </div>

                    <div className="border border-amber-200 bg-amber-50/60 rounded-lg p-5 text-center">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                        {bidDialogMode === "buy_now" ? (t("buyer.yourPrice") || "Your Price") : (t("buyer.yourBid") || "Your Bid")}
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {bidDetail?.currency || "TWD"} {Number(bidAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      {useWeightPrice && Object.keys(weightPrices).length > 0 && (
                        <div className="mt-3 text-left border-t border-amber-200 pt-3 space-y-1">
                          <p className="text-xs text-muted-foreground font-semibold">Weight-based quotation:</p>
                          {WEIGHT_ITEMS.map(({ key, label }) => {
                            const val = weightPrices[key];
                            return val ? (
                              <div key={key} className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{label}</span>
                                <span className="font-semibold text-foreground">{Number(val).toLocaleString()} {bidDetail?.currency || ""}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-center text-muted-foreground">
                      {bidDialogMode === "buy_now"
                        ? (t("buyer.confirmBuyNowDesc") || "Are you sure you want to buy this?")
                        : (t("buyer.confirmBidDesc") || "Are you sure you want to place this bid?")}
                    </p>

                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setPlaceBidStep("form")}>
                        {t("buyer.goBack") || "Go back"}
                      </Button>
                      <Button
                        type="button"
                        className="flex-1 bg-[#1a3c2a] hover:bg-[#152e21] text-white"
                        disabled={isPlacingBid}
                        onClick={handlePlaceBid}
                      >
                        {isPlacingBid
                          ? t("buyer.submitting")
                          : bidDialogMode === "buy_now"
                            ? (t("buyer.yesBuyNow") || "Yes, buy now")
                            : (t("buyer.yesPlaceBid") || "Yes, place bid")}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Bid Success Dialog */}
        <Dialog open={showBidSuccessDialog} onOpenChange={setShowBidSuccessDialog}>
          <DialogContent className="max-w-sm text-center">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-green-600" />
              </div>
              <DialogHeader className="items-center">
                <DialogTitle className="text-xl font-bold text-foreground">
                  {bidDialogMode === "make_offer"
                    ? t("buyer.offerSuccessTitle", "Offer Submitted Successfully!")
                    : bidDialogMode === "buy_now"
                    ? t("buyer.buyNowSuccessTitle", "Purchase Confirmed!")
                    : t("buyer.bidSuccessTitle", "Bid Placed Successfully!")}
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {bidDialogMode === "make_offer"
                  ? t("buyer.offerSuccessMessage", "Your offer has been submitted. The seller will review it and you will be notified of any updates.")
                  : bidDialogMode === "buy_now"
                  ? t("buyer.buyNowSuccessMessage", "Your purchase has been confirmed. The seller will be in touch to arrange the next steps.")
                  : t("buyer.bidSuccessMessage", "Your bid has been submitted. The seller will review it and you will be notified of any updates.")}
              </p>
              <div className="flex flex-col w-full gap-2 pt-2">
                <Button
                  onClick={() => {
                    setShowBidSuccessDialog(false);
                    setShowMessageDialog(true);
                  }}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {t("buyer.messageSellerBtn", "Message Seller")}
                </Button>
                <Button variant="outline" onClick={() => setShowBidSuccessDialog(false)} className="w-full">
                  {t("buyer.closeBtn", "Close")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <ChatSidebarWrapper
          isOpen={showMessageDialog}
          onClose={() => setShowMessageDialog(false)}
          batchId={data?.data?.batch?.batch_id}
          sellerId={data?.data?.batch?.seller_id}
          embedded={false}
        />

        {/* Inspection Dialog */}
        <Dialog
          open={showInspectionDialog}
          onOpenChange={(open) => {
            setShowInspectionDialog(open);
            if (!open) {
              setSelectedInspectionDate(undefined);
              setSelectedInspectionSlot("");
              setCompanyName("");
              setBidNotes("");
              setDocumentFile(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("buyer.confirmInspection")}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Date Selection */}
              <div className="space-y-2">
                <Label>{t("buyer.inspectionDate")}</Label>
                {inspectionSchedule?.schedule && inspectionSchedule.schedule.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {inspectionSchedule.schedule.map((scheduleItem: any, index: number) => {
                      const dateObj = new Date(scheduleItem.date + "T00:00:00");
                      const dateStr = scheduleItem.date;
                      const isSelected = selectedInspectionDate &&
                        format(selectedInspectionDate, "yyyy-MM-dd") === dateStr;

                      return (
                        <Button
                          key={index}
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => {
                            setSelectedInspectionDate(dateObj);
                            setSelectedInspectionSlot("");
                          }}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            isSelected && "bg-primary text-primary-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(dateObj, "PPP")}
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("listingDetail.noInspectionSchedule") || "No inspection schedule available"}
                  </p>
                )}
              </div>

              {/* Slot Selection */}
              {selectedInspectionDate && (
                <div className="space-y-2">
                  <Label>{t("buyer.inspectionTime")}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {getAvailableSlots().map((slot: any, index: number) => {
                      const slotTime = convertUTCToLocalRange(slot.start_utc, slot.end_utc);
                      return (
                        <Button
                          key={index}
                          variant={selectedInspectionSlot === slotTime ? "default" : "outline"}
                          onClick={() => setSelectedInspectionSlot(slotTime)}
                          className="text-sm"
                          size="sm"
                        >
                          {slotTime}
                        </Button>
                      );
                    })}
                  </div>
                  {getAvailableSlots().length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {t("listingDetail.noSlotsAvailable") || "No time slots available for this date"}
                    </p>
                  )}
                </div>
              )}

              {/* Company Name Input */}
              <div className="space-y-2">
                <Label htmlFor="company-name">
                  {t("buyer.companyName") || "Company Name"} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="company-name"
                  type="text"
                  placeholder={t("buyer.enterCompanyName") || "Enter your company name"}
                  value={companyBuyerName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleJoinInspection}
                disabled={!selectedInspectionDate || !selectedInspectionSlot || !companyName.trim() || isRegistering}
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editDialogData
                      ? t("buyer.updating") || "Updating..."
                      : t("buyer.registering") || "Registering..."}
                  </>
                ) : (
                  editDialogData
                    ? t("buyer.updateRegistration") || "Update Registration"
                    : t("buyer.confirmRegistration") || "Confirm Registration"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Similar Batches ─────────────────────────────────────── */}
        {similarBatches.length > 0 && (
          <div className="container mx-auto px-4 pb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">{t("buyer.moreFromCategory") || "More from this category"}</h2>
              {categorySlug && (
                <button
                  onClick={() => navigate(`/buyer-marketplace?category=${categorySlug}`)}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  {t("buyer.viewAll") || "View all"} →
                </button>
              )}
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: "thin" }}>
              {similarBatches.map((batch: any) => (
                <SimilarBatchCard
                  key={batch.batchId}
                  batch={batch}
                  lang={i18n.language}
                  onClick={() => navigate(`/buyer-marketplace/${batch.batchId}`)}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </Wrapper>
  );
};


const isVideo = (url: string) =>
  /\.(mp4|mov|webm|avi|mkv)$/i.test(url);

type ProductMediaProps = {
  product: {
    title: string;
    images: string[];
  };
  getTranslatedField: (product: any, fieldName: string) => string;
};

function ProductMedia({ product, getTranslatedField }: ProductMediaProps) {
  const media = product?.images || [];
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const activeMedia = media[activeIndex];

  return (
    <div className="w-full">
      {/* MAIN VIEW */}
      <div className="w-full aspect-[4/3] bg-muted rounded overflow-hidden flex items-center justify-center relative">
        {activeMedia ? (
          isVideo(activeMedia) ? (
            <video
              src={activeMedia}
              autoPlay
              muted
              loop
              playsInline
              controls
              className="w-full h-full object-contain bg-muted"
            />
          ) : (
            <img
              src={activeMedia}
              alt={getTranslatedField(product, 'title')}
              className="w-full h-full object-contain"
            />
          )
        ) : (
          <div className="text-center p-8">
            <p className="text-muted-foreground text-lg">{getTranslatedField(product, 'title')}</p>
          </div>
        )}
        {media.length > 1 && (
          <div className="absolute top-2 left-2 bg-foreground/70 text-background text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
            📷 {media.length}
          </div>
        )}
      </div>

      {/* THUMBNAILS */}
      {media.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {media.map((url, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "w-16 h-16 rounded overflow-hidden border-2 flex-shrink-0 transition-all",
                activeIndex === index ? "border-primary ring-1 ring-primary" : "border-border hover:border-muted-foreground"
              )}
            >
              {isVideo(url) ? (
                <video src={url} muted className="w-full h-full object-cover" />
              ) : (
                <img src={url} className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SellerListingDetail;