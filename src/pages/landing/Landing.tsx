import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { useGetBatchesQuery } from "@/rtk/slices/batchApiSlice";
import { SITE_TYPE } from "@/config/site";
import { useLanguageAwareCategories, useLanguageAwareCategorySummary } from "@/hooks/useLanguageAwareCategories";
import { useTranslation } from "react-i18next";
import {
  ArrowRight, Clock, ShieldCheck, ChevronRight, ChevronLeft,
  TrendingUp, Leaf, BarChart3, Gavel, Sparkles, Tag, Star,
  Cog, CircleDot, Wrench, Drill, Disc3, Scissors, SquareStack,
  Hammer, Zap, Flame, Trash2, Heart,
} from "lucide-react";

// ─── Currency formatter ───────────────────────────────────────────────────────
const formatPrice = (amount: string | number, currency: string | null) => {
  const num = Number(amount);
  if (isNaN(num) || num === 0) return "";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    return `${currency || "USD"} ${num.toLocaleString()}`;
  }
};

// ─── Country name → ISO code map ─────────────────────────────────────────────
const COUNTRY_ISO_MAP: Record<string, string> = {
  "Afghanistan": "af", "Albania": "al", "Algeria": "dz", "Argentina": "ar", "Australia": "au",
  "Austria": "at", "Bangladesh": "bd", "Belgium": "be", "Brazil": "br", "Canada": "ca",
  "Chile": "cl", "China": "cn", "Colombia": "co", "Croatia": "hr", "Czech Republic": "cz",
  "Denmark": "dk", "Egypt": "eg", "Finland": "fi", "France": "fr", "Germany": "de",
  "Ghana": "gh", "Greece": "gr", "Hong Kong": "hk", "Hungary": "hu", "India": "in",
  "Indonesia": "id", "Iran": "ir", "Iraq": "iq", "Ireland": "ie", "Israel": "il",
  "Italy": "it", "Japan": "jp", "Jordan": "jo", "Kenya": "ke", "South Korea": "kr",
  "Kuwait": "kw", "Lebanon": "lb", "Malaysia": "my", "Mexico": "mx", "Morocco": "ma",
  "Netherlands": "nl", "New Zealand": "nz", "Nigeria": "ng", "Norway": "no", "Oman": "om",
  "Pakistan": "pk", "Peru": "pe", "Philippines": "ph", "Poland": "pl", "Portugal": "pt",
  "Qatar": "qa", "Romania": "ro", "Russia": "ru", "Saudi Arabia": "sa", "Singapore": "sg",
  "South Africa": "za", "Spain": "es", "Sri Lanka": "lk", "Sweden": "se", "Switzerland": "ch",
  "Taiwan": "tw", "Thailand": "th", "Turkey": "tr", "UAE": "ae", "United Arab Emirates": "ae",
  "United Kingdom": "gb", "UK": "gb", "United States": "us", "USA": "us", "Vietnam": "vn",
};

// ─── Slug → Icon map ─────────────────────────────────────────────────────────
const categoryIconMap: Record<string, React.ElementType> = {
  "machining-centers": Cog,
  "lathes": CircleDot,
  "milling-machines": Wrench,
  "boring-drilling": Drill,
  "grinding-finishing": Disc3,
  "sawing-machines": Scissors,
  "press-brakes-shears": SquareStack,
  "punching-forging": Hammer,
  "laser-plasma": Zap,
  "laser-plasma-cutting": Zap,
  "welding": Flame,
  "welding-equipment": Flame,
  "scrap": Trash2,
};
import SellLeadModal from "@/components/common/SellLeadModal";
import axiosInstance from "@/rtk/api/axiosInstance";
import { toastSuccess, toastError } from "@/helper/toasterNotification";
import i18n from "@/i18n/config";
import { useGetCategoriesQuery } from "@/rtk/slices/apiSlice";
import { useGetAuctionGroupsHomeQuery } from "@/rtk/slices/auctionGroupApiSlice";
import type { AuctionGroupHomeItem } from "@/rtk/slices/auctionGroupApiSlice";

// ─── Brand Trust Bar ─────────────────────────────────────────────────────────
const trustedBrands = [
  { name: "Haas Automation", abbr: "HAAS" },
  { name: "Mazak", abbr: "MAZAK" },
  { name: "DMG Mori", abbr: "DMG" },
  { name: "Okuma", abbr: "OKUMA" },
  { name: "Amada", abbr: "AMADA" },
  { name: "Trumpf", abbr: "TRUMPF" },
  { name: "Makino", abbr: "MAKINO" },
];

// ─── Stats (labels resolved via t() inside Landing) ──────────────────────────
const statValues = ["$50M+", "3,000+", "98%", "12"] as const;
const statKeys = [
  "landing.stats.machineryTraded",
  "landing.stats.activeMachines",
  "landing.stats.inspectionVerified",
  "landing.stats.countriesServed",
] as const;

// ─── Market Insights (resolved via t() inside Landing) ────────────────────────
const insightIcons = [Leaf, BarChart3, TrendingUp] as const;
const insightKeys = [
  { tagKey: "landing.insights.esg.tag", titleKey: "landing.insights.esg.title", descKey: "landing.insights.esg.desc" },
  { tagKey: "landing.insights.market.tag", titleKey: "landing.insights.market.title", descKey: "landing.insights.market.desc" },
  { tagKey: "landing.insights.trends.tag", titleKey: "landing.insights.trends.title", descKey: "landing.insights.trends.desc" },
];

// ─── Wishlist Heart Button ────────────────────────────────────────────────────
const WishlistHeartButton = ({ batchId }: { batchId: string | number }) => {
  const userId = localStorage.getItem("userId");
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !batchId) return;
    axiosInstance
      .get(`/wishlist/${userId}/${batchId}`)
      .then((res) => {
        if (res.data?.data?.inWishlist !== undefined) setInWishlist(res.data.data.inWishlist);
      })
      .catch(() => {});
  }, [userId, batchId]);

  const handleToggle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) {
      toastError("Please login to save items");
      return;
    }
    if (loading) return;
    const prev = inWishlist;
    setInWishlist(!prev);
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/wishlist/${userId}/toggle`, { productId: batchId });
      const action = res.data?.data?.action;
      if (action === "added") { setInWishlist(true); toastSuccess("Added to wishlist"); }
      else if (action === "removed") { setInWishlist(false); toastSuccess("Removed from wishlist"); }
    } catch {
      setInWishlist(prev);
      toastError("Failed to update wishlist");
    } finally {
      setLoading(false);
    }
  }, [userId, batchId, loading, inWishlist]);

  return (
    <button onClick={handleToggle} className="p-1.5 rounded-full bg-card/80 backdrop-blur-sm shadow-sm hover:bg-card transition-colors">
      <Heart className={`h-4 w-4 transition-colors ${inWishlist ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
    </button>
  );
};

// ─── Live Countdown Timer ─────────────────────────────────────────────────────
const CountdownTimer = ({ endDate }: { endDate: string }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Ended"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h >= 24) {
        const d = Math.floor(h / 24);
        setTimeLeft(`${d}d ${h % 24}h`);
      } else {
        setTimeLeft(
          `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        );
      }
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return (
    <span className="inline-flex items-center gap-1 bg-destructive/90 text-destructive-foreground text-[11px] font-bold px-2 py-0.5 rounded-sm">
      <Clock className="h-3 w-3" />
      {timeLeft}
    </span>
  );
};

// ─── Image Carousel (hover arrows + dots) ────────────────────────────────────
const ImageCarousel = ({ images, batchId }: { images: string[]; batchId: string }) => {
  const allImages = images.length > 0 ? images : ["/placeholder.svg"];
  const [current, setCurrent] = useState(0);

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((c) => (c === 0 ? allImages.length - 1 : c - 1));
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((c) => (c === allImages.length - 1 ? 0 : c + 1));
  };

  return (
    <div className="relative w-full h-full group/carousel">
      <img
        src={allImages[current]}
        alt=""
        className="w-full h-full object-cover transition-opacity duration-200"
      />

      {/* ID badge — top left */}
      {/* <div className="absolute top-1.5 left-1.5">
        <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
          ID #{batchId}
        </span>
      </div> */}

      {/* Heart — top right */}
      {/* <div className="absolute top-1.5 right-1.5">
        <span className="inline-flex items-center justify-center w-7 h-7 bg-card/80 rounded-full shadow-sm">
          <Heart className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
      </div> */}

      {/* Arrows — only on hover, only if multiple images */}
      {allImages.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-card/80 shadow flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-card"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          <button
            onClick={next}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-card/80 shadow flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-card"
          >
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>
        </>
      )}

      {/* Dots — bottom center */}
      {allImages.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
          {allImages.slice(0, 5).map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === current ? "bg-card" : "bg-card/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Auction Card (Surplex style — clean with "View now" button) ──────────────
const AuctionMosaicCard = ({
  batch,
  onClick,
}: {
  batch: any;
  onClick: () => void;
}) => {
  const { t } = useTranslation();
  const images: string[] = (batch.firstProductImages as string[]) || [];
  const mainImg = images[0] || "/placeholder.svg";
  const sideImgs = images.slice(1, 3);
  const isLive = batch.status === "live_for_bids";
  const bids: number = batch.bids ?? 0;
  const location: string = batch.location || batch.city || batch.country || "";

  return (
    <div
      onClick={onClick}
      className="cursor-pointer group border border-border rounded-lg overflow-hidden bg-card hover:shadow-medium transition-shadow"
    >
      {/* Image area */}
      <div className="relative">
        {sideImgs.length > 0 ? (
          <div className="flex h-[200px] gap-[2px]">
            <div className="flex-[3] min-w-0 overflow-hidden">
              <img src={mainImg} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
            </div>
            <div className="flex-[1] min-w-0 flex flex-col gap-[2px]">
              {sideImgs.map((img, i) => (
                <div key={i} className="flex-1 min-h-0 overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[200px] overflow-hidden">
            <img src={mainImg} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
          </div>
        )}

        {/* Wishlist heart — top right */}
        {batch.firstProductId && (
          <div className="absolute top-2 right-2 z-10">
            <WishlistHeartButton batchId={batch.firstProductId} />
          </div>
        )}

        {/* LIVE badge — top right below heart */}
        {isLive && (
          <div className="absolute top-2 left-2 z-10">
            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">
              {t("landing.live")}
            </span>
          </div>
        )}

        {/* Countdown — bottom left */}
        <div className="absolute bottom-2 left-2 z-10">
          {isLive && batch.bid_end_date ? (
            <CountdownTimer endDate={batch.bid_end_date} />
          ) : batch.status === "bid_schedule" ? (
            <span className="inline-flex items-center gap-1 bg-foreground/80 text-card text-[11px] font-bold px-2 py-0.5 rounded-sm">
              <Clock className="h-3 w-3" />
              {t("landing.upcoming")}
            </span>
          ) : null}
        </div>
      </div>

      {/* Details */}
      <div className="px-3 pt-3 pb-3">
        {/* Product ID */}
        <p className="text-[11px] text-muted-foreground font-mono mb-1">
          {t("landing.batchId")} #{batch.batchId}
        </p>

        {/* Title */}
        <h3 className="font-bold text-[13px] text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {batch.title || `${batch.category || "Industrial"} Equipment`}
        </h3>

        {/* Location */}
        <p className="flex items-center gap-1 mt-1.5 text-[12px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3 text-primary flex-shrink-0" />
          {location || t("landing.verifiedSeller")}
        </p>

        {/* Price */}
        <div className="mt-2">
          {batch.value ? (
            <span className="text-base font-bold text-foreground">${Number(batch.value).toLocaleString()}</span>
          ) : (
            <span className="text-[12px] text-muted-foreground italic">{t("landing.priceOnRequest")}</span>
          )}
        </div>

        {/* View now button */}
        <button className="w-full mt-3 py-2 border border-primary text-primary text-sm font-medium rounded-md hover:bg-primary hover:text-primary-foreground transition-colors">
          View now
        </button>
      </div>
    </div>
  );
};

// ─── Highlight Card (same style as AuctionMosaicCard) ─────────────────────────
const HighlightCard = ({
  batch,
  onClick,
}: {
  batch: any;
  onClick: () => void;
}) => {
  const { t } = useTranslation();
  const images: string[] = (batch.firstProductImages as string[]) || [];
  const mainImg = images[0] || "/placeholder.svg";
  const sideImgs = images.slice(1, 3);
  const isLive = batch.status === "live_for_bids";
  const bids: number = batch.bids ?? 0;
  const location: string = batch.location || batch.city || batch.country || "";

  return (
    <div
      onClick={onClick}
      className="cursor-pointer group border border-border rounded-lg overflow-hidden bg-card hover:shadow-medium transition-shadow"
    >
      <div className="relative">
        {sideImgs.length > 0 ? (
          <div className="flex h-[200px] gap-[2px]">
            <div className="flex-[3] min-w-0 overflow-hidden">
              <img src={mainImg} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
            </div>
            <div className="flex-[1] min-w-0 flex flex-col gap-[2px]">
              {sideImgs.map((img, i) => (
                <div key={i} className="flex-1 min-h-0 overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[200px] overflow-hidden">
            <img src={mainImg} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
          </div>
        )}

        {batch.firstProductId && (
          <div className="absolute top-2 right-2 z-10">
            <WishlistHeartButton batchId={batch.firstProductId} />
          </div>
        )}

        {isLive && (
          <div className="absolute top-2 left-2 z-10">
            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">
              {t("landing.live")}
            </span>
          </div>
        )}

        <div className="absolute bottom-2 left-2 z-10">
          {isLive && batch.bid_end_date ? (
            <CountdownTimer endDate={batch.bid_end_date} />
          ) : batch.status === "bid_schedule" ? (
            <span className="inline-flex items-center gap-1 bg-foreground/80 text-card text-[11px] font-bold px-2 py-0.5 rounded-sm">
              <Clock className="h-3 w-3" />
              {t("landing.upcoming")}
            </span>
          ) : null}
        </div>
      </div>

      <div className="px-3 pt-3 pb-3">
        <p className="text-[11px] text-muted-foreground font-mono mb-1">
          {t("landing.batchId")} #{batch.batchId}
        </p>
        <h3 className="font-bold text-[13px] text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {batch.title || `${batch.category || "Industrial"} Equipment`}
        </h3>
        <p className="flex items-center gap-1 mt-1.5 text-[12px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3 text-primary flex-shrink-0" />
          {location || t("landing.verifiedSeller")}
        </p>
        <div className="mt-2">
          {batch.value ? (
            <span className="text-base font-bold text-foreground">${Number(batch.value).toLocaleString()}</span>
          ) : (
            <span className="text-[12px] text-muted-foreground italic">{t("landing.priceOnRequest")}</span>
          )}
        </div>
        <button className="w-full mt-3 py-2 border border-primary text-primary text-sm font-medium rounded-md hover:bg-primary hover:text-primary-foreground transition-colors">
          View now
        </button>
      </div>
    </div>
  );
};

// ─── Category Card — Surplex mosaic style (1 large + 3 stacked) ──────────────
const CategoryCard = ({
  item,
  status,
  highlighted,
}: {
  item: { slug: string; name: string; count: number; previewImages: string[]; earliestBidStartDate?: string | null; earliestBidEndDate?: string | null; hasActiveBid?: boolean };
  status?: string;
  highlighted?: boolean;
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const imgs = item.previewImages;
  const mainImg = imgs[0] || "/placeholder.svg";
  const sideImgs = [imgs[1] || "/placeholder.svg", imgs[2] || "/placeholder.svg", imgs[3] || "/placeholder.svg"];

  // Compute bid status label + countdown from dates (all math is UTC-safe via Date.getTime())
  type BidStatus = "ended" | "upcoming" | "live";
  const [bidStatus, setBidStatus] = useState<BidStatus>(item.hasActiveBid === false ? "ended" : "live");
  const [timeLeft, setTimeLeft] = useState("");

  // Format a UTC date string into the user's local time with timezone abbreviation
  const formatLocalTime = (utcStr: string) => {
    return new Intl.DateTimeFormat(undefined, {
      month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(utcStr));
  };

  useEffect(() => {
    const calc = () => {
      const now = Date.now();
      const endMs = item.earliestBidEndDate ? new Date(item.earliestBidEndDate).getTime() : null;
      const startMs = item.earliestBidStartDate ? new Date(item.earliestBidStartDate).getTime() : null;

      if (endMs && now > endMs) {
        setBidStatus("ended");
        setTimeLeft("");
        return;
      }
      if (startMs && now < startMs) {
        setBidStatus("upcoming");
        const diff = startMs - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        setTimeLeft(h >= 24 ? `Opens in ${Math.floor(h / 24)}d ${h % 24}h` : `Opens in ${h}h ${m}m`);
        return;
      }
      setBidStatus("live");
      if (!endMs) { setTimeLeft(""); return; }
      const diff = endMs - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [item.earliestBidStartDate, item.earliestBidEndDate]);

  return (
    <div
      onClick={() => {
        const params = new URLSearchParams({ category: item.slug });
        if (status) params.set("status", status);
        if (highlighted) params.set("highlighted", "true");
        navigate(`/buyer-marketplace?${params.toString()}`);
      }}
      className="cursor-pointer group flex-shrink-0 w-[calc(85vw-2rem)] sm:w-[380px] md:w-[420px] lg:w-[460px] border border-border rounded overflow-hidden bg-card hover:shadow-md transition-shadow"
    >
      {/* ── Mosaic image area ── */}
      <div className="relative flex h-[220px] gap-[2px]">
        {/* Main large image */}
        <div className="flex-[3] min-w-0 overflow-hidden">
          <img
            src={mainImg}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        </div>

        {/* 3 stacked side images */}
        <div className="flex-[1] min-w-0 flex flex-col gap-[2px]">
          {sideImgs.map((src, i) => (
            <div key={i} className="flex-1 min-h-0 overflow-hidden">
              <img src={src} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* Bottom-left: bid status badge — only shown if bid dates exist */}
        {(item.earliestBidEndDate || item.earliestBidStartDate) && (
          <div className="absolute bottom-2 left-2 z-10">
            {bidStatus === "ended" ? (
              <span className="inline-flex items-center gap-1 bg-muted/90 text-muted-foreground text-[11px] font-bold px-2 py-0.5 rounded-sm">
                <Clock className="h-3 w-3" />
                {t("landing.bidEnded")}
              </span>
            ) : bidStatus === "upcoming" ? (
              <span className="inline-flex items-center gap-1 bg-foreground/80 text-card text-[11px] font-bold px-2 py-0.5 rounded-sm">
                <Clock className="h-3 w-3" />
                {item.earliestBidStartDate ? formatLocalTime(item.earliestBidStartDate) : t("landing.upcoming")}
              </span>
            ) : timeLeft ? (
              <span className="inline-flex items-center gap-1 bg-destructive/90 text-destructive-foreground text-[11px] font-bold px-2 py-0.5 rounded-sm">
                <Clock className="h-3 w-3" />
                {timeLeft}
              </span>
            ) : null}
          </div>
        )}

        {/* Bottom-right: lot count badge */}
        <div className="absolute bottom-0 right-0 z-10">
          <span className="inline-flex items-center gap-1 bg-foreground/85 text-card text-[12px] font-semibold pl-3 pr-3 py-2 rounded-tl-lg">
            <Gavel className="h-3.5 w-3.5" /> {item.count}
          </span>
        </div>
      </div>

      {/* ── Category name below ── */}
      <div className="px-3 pt-2.5 pb-2.5">
        <h3 className="font-bold text-[14px] text-foreground leading-snug uppercase group-hover:text-primary transition-colors line-clamp-1">
          {item.name}
        </h3>
        <p className="text-[12px] text-muted-foreground mt-0.5">{item.count} {t("landing.lotsInCategory")}</p>
        {/* {bidStatus === "live" && item.earliestBidEndDate && (
          <p className="text-[11px] text-destructive mt-0.5 font-medium">
            Closes {formatLocalTime(item.earliestBidEndDate)}
          </p>
        )} */}
      </div>
    </div>
  );
};

// ─── Category Section — ONE API call for the whole section ────────────────────
const CategorySection = ({
  title,
  icon: Icon,
  iconClass = "text-destructive",
  viewAllLink,
  status,
  highlighted,
  sort,
  emptyMessage,
}: {
  title: string;
  icon: React.ElementType;
  iconClass?: string;
  viewAllLink: string;
  status?: string;
  highlighted?: boolean;
  sort?: string;
  emptyMessage?: string;
}) => {
  const { t } = useTranslation();
  const { data, isLoading } = useLanguageAwareCategorySummary({ status, highlighted, sort });
  const rawCategories = data?.data ?? [];
  // For closing_soon: exclude categories where the bid has already ended
  const categories = sort === "closing_soon"
    ? rawCategories.filter((cat) => {
        if (cat.hasActiveBid === false) return false;
        if (cat.earliestBidEndDate && new Date(cat.earliestBidEndDate).getTime() < Date.now()) return false;
        return true;
      })
    : rawCategories;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 10);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  useEffect(() => {
    if (!isLoading && categories.length > 0) setTimeout(checkScroll, 200);
  }, [categories, isLoading, checkScroll]);

  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "left" ? -480 : 480, behavior: "smooth" });

  return (
    <section className="py-6 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Icon className={`h-4 w-4 ${iconClass}`} />
            {title}
          </h2>
          <Link
            to={viewAllLink}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            {t("landing.viewAll")} <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading && (
          <div className="flex gap-4 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[calc(85vw-2rem)] sm:w-[380px] md:w-[420px] lg:w-[460px] animate-pulse rounded overflow-hidden border border-border">
                <div className="h-[220px] bg-secondary" />
                <div className="px-3 py-2.5 space-y-1.5">
                  <div className="h-3.5 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && categories.length > 0 && (
          <div className="relative">
            {showLeft && (
              <button
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 rounded-full bg-foreground text-card shadow-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex gap-4 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {categories.map((cat) => (
                <CategoryCard key={cat.slug} item={cat} status={status} highlighted={highlighted} />
              ))}
            </div>
            {showRight && (
              <button
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 rounded-full bg-foreground text-card shadow-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {!isLoading && categories.length === 0 && emptyMessage && (
          <p className="text-sm text-muted-foreground py-4">{emptyMessage}</p>
        )}
      </div>
    </section>
  );
};

// ─── Browse by Category Section ──────────────────────────────────────────────
const BrowseByCategorySection = () => {
  const { t } = useTranslation();
  const { data: categoriesData, isLoading } = useLanguageAwareCategories();
  const categories: { slug: string; name: string }[] = Array.isArray(categoriesData)
    ? categoriesData
    : (categoriesData as any)?.data ?? [];

  return (
    <section className="py-10 bg-secondary/30 border-b border-border">
      <div className="container mx-auto px-4 text-center">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">TOP PICKS</p>
        <h2 className="text-lg font-bold text-foreground mb-6">{t("landing.browseByCat") || "Popular Categories"}</h2>

        {isLoading && (
          <div className="flex flex-wrap justify-center gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 w-32 bg-secondary animate-pulse rounded-md" />
            ))}
          </div>
        )}

        {!isLoading && categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3">
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.slug}
                to={`/buyer-marketplace?category=${cat.slug}`}
                className="px-5 py-2.5 border border-primary/30 rounded-md text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              >
                {cat.name}
              </Link>
            ))}
            <Link
              to="/buyer-marketplace"
              className="px-5 py-2.5 border border-primary/30 rounded-md text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-all"
            >
              More industrial categories
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

// ─── Category Product Card (Surplex style) ──────────────────────────────────
const CategoryProductCard = ({ batch, onClick }: { batch: any; onClick: () => void }) => {
  const { t } = useTranslation();
  const isLive = batch.status === "live_for_bids";
  const images: string[] = (batch.firstProductImages as string[]) || [];
  const bids: number = batch.bids ?? 0;
  const location: string = batch.location || batch.city || batch.country || "";

  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-[70vw] sm:w-[220px] md:w-[230px] lg:w-[240px] cursor-pointer group border border-border rounded-lg overflow-hidden bg-card hover:shadow-medium transition-shadow"
    >
      {/* Image */}
      <div className="relative h-[160px] overflow-hidden">
        <ImageCarousel images={images} batchId={batch.batchId} />

        {batch.firstProductId && (
          <div className="absolute top-2 right-2 z-10">
            <WishlistHeartButton batchId={batch.firstProductId} />
          </div>
        )}

        {/* Countdown */}
        <div className="absolute bottom-2 left-2 z-10">
          {isLive && batch.bid_end_date ? (
            <CountdownTimer endDate={batch.bid_end_date} />
          ) : isLive ? (
            <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
              {t("landing.live")}
            </span>
          ) : null}
        </div>
      </div>

      {/* Details */}
      <div className="px-3 pt-2.5 pb-3">
        <p className="text-[10px] text-muted-foreground font-mono mb-1">
          {t("landing.batchId")} #{batch.batchId}
        </p>
        <h4 className="font-bold text-[12px] text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {batch.title || `${batch.category || "Industrial"} Lot #${batch.batchId}`}
        </h4>
        <div className="flex items-center gap-1.5 mt-1">
          <ShieldCheck className="h-3 w-3 text-primary flex-shrink-0" />
          <span className="text-[11px] text-muted-foreground truncate">{location || t("landing.verifiedSeller")}</span>
          {batch.country && COUNTRY_ISO_MAP[batch.country] && (
            <img
              src={`https://flagcdn.com/20x15/${COUNTRY_ISO_MAP[batch.country]}.png`}
              alt={batch.country}
              title={batch.country}
              className="w-5 h-[15px] object-cover rounded-[2px] flex-shrink-0"
            />
          )}
        </div>
        <div className="mt-1.5">
          {batch.bid_type === "fixed_price" && batch.target_price && Number(batch.target_price) > 0 ? (
            <span className="text-sm font-bold text-foreground">
              {formatPrice(batch.target_price, batch.currency)}
            </span>
          ) : batch.bid_type === "make_offer" ? null : batch.value ? (
            <span className="text-sm font-bold text-foreground">{formatPrice(batch.value, "USD")}</span>
          ) : null}
        </div>
        <button className="w-full mt-2.5 py-1.5 border border-primary text-primary text-xs font-medium rounded-md hover:bg-primary hover:text-primary-foreground transition-colors">
          View now
        </button>
      </div>
    </div>
  );
};

// ─── Single Category Row (horizontal scroll + arrows) ─────────────────────────
const CategoryProductRow = ({ category }: { category: { slug: string; name: string } }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const { data, isLoading } = useGetBatchesQuery({
    category: category.slug,
    page: 1,
    limit: 10,
    type: SITE_TYPE,
  });
  const batches: any[] = data?.data ?? [];

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 10);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  useEffect(() => {
    if (!isLoading && batches.length > 0) setTimeout(checkScroll, 150);
  }, [batches, isLoading, checkScroll]);

  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "left" ? -460 : 460, behavior: "smooth" });

  if (!isLoading && batches.length === 0) return null;

  return (
    <div className="py-6 border-b border-border last:border-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-foreground">{category.name}</h3>
        <Link
          to={`/buyer-marketplace?category=${category.slug}`}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
        >
          {t("landing.viewAll")} <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Skeleton */}
      {isLoading && (
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[45vw] sm:w-[200px] md:w-[210px] lg:w-[220px] animate-pulse">
              <div className="aspect-[4/3] bg-secondary" />
              <div className="pt-2 space-y-1.5">
                <div className="h-2 bg-secondary rounded w-1/3" />
                <div className="h-3 bg-secondary rounded w-4/5" />
                <div className="h-3 bg-secondary rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scrollable cards */}
      {!isLoading && batches.length > 0 && (
        <div className="relative">
          {showLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-[90px] -translate-x-4 z-10 w-9 h-9 rounded-full bg-foreground text-card shadow-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-4 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {batches.map((batch) => (
              <CategoryProductCard
                key={batch.batchId}
                batch={batch}
                onClick={() => navigate(`/buyer-marketplace/${batch.batchId}`)}
              />
            ))}
          </div>

          {showRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-[90px] translate-x-4 z-10 w-9 h-9 rounded-full bg-foreground text-card shadow-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Category Product Rows (all categories) ───────────────────────────────────
const CategoryProductRows = () => {
  const { data, isLoading } = useLanguageAwareCategorySummary();
  const categories: { slug: string; name: string }[] = data?.data ?? [];

  if (isLoading) return null;
  if (categories.length === 0) return null;

  return (
    <section className="bg-background">
      <div className="container mx-auto px-4">
        {categories.slice(0, 3).map((cat) => (
          <CategoryProductRow key={cat.slug} category={cat} />
        ))}
      </div>
    </section>
  );
};

// ─── Auction Group Card — same mosaic style as CategoryCard ──────────────────
const AuctionGroupCard = ({ group }: { group: AuctionGroupHomeItem }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const imgs = group.previewImages;
  const mainImg = imgs[0] || "/placeholder.svg";
  const sideImgs = [
    imgs[1] || "/placeholder.svg",
    imgs[2] || "/placeholder.svg",
    imgs[3] || "/placeholder.svg",
  ];

  type BidStatus = "ended" | "upcoming" | "live";
  const [bidStatus, setBidStatus] = useState<BidStatus>(
    group.hasActiveBid === false ? "ended" : "live"
  );
  const [timeLeft, setTimeLeft] = useState("");

  const formatLocalTime = (utcStr: string) =>
    new Intl.DateTimeFormat(undefined, {
      month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(utcStr));

  useEffect(() => {
    const calc = () => {
      const now = Date.now();
      const endMs = group.earliestBidEndDate ? new Date(group.earliestBidEndDate).getTime() : null;
      const startMs = group.earliestBidStartDate ? new Date(group.earliestBidStartDate).getTime() : null;

      if (endMs && now > endMs) { setBidStatus("ended"); setTimeLeft(""); return; }
      if (startMs && now < startMs) {
        setBidStatus("upcoming");
        const diff = startMs - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        setTimeLeft(h >= 24 ? `Opens in ${Math.floor(h / 24)}d ${h % 24}h` : `Opens in ${h}h ${m}m`);
        return;
      }
      setBidStatus("live");
      if (!endMs) { setTimeLeft(""); return; }
      const diff = endMs - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        h >= 24
          ? `${Math.floor(h / 24)}d ${h % 24}h`
          : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [group.earliestBidStartDate, group.earliestBidEndDate]);

  return (
    <div
      onClick={() => navigate(`/buyer-marketplace?category=scrap&auction_group=${group.group_id}`)}
      className="cursor-pointer group flex-shrink-0 w-[calc(85vw-2rem)] sm:w-[380px] md:w-[420px] lg:w-[460px] border border-border rounded overflow-hidden bg-card hover:shadow-md transition-shadow"
    >
      {/* Mosaic image area */}
      <div className="relative flex h-[220px] gap-[2px]">
        <div className="flex-[3] min-w-0 overflow-hidden">
          <img
            src={mainImg}
            alt={group.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        </div>
        <div className="flex-[1] min-w-0 flex flex-col gap-[2px]">
          {sideImgs.map((src, i) => (
            <div key={i} className="flex-1 min-h-0 overflow-hidden">
              <img src={src} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* Bid status badge — bottom left */}
        {(group.earliestBidEndDate || group.earliestBidStartDate) && (
          <div className="absolute bottom-2 left-2 z-10">
            {bidStatus === "ended" ? (
              <span className="inline-flex items-center gap-1 bg-muted/90 text-muted-foreground text-[11px] font-bold px-2 py-0.5 rounded-sm">
                <Clock className="h-3 w-3" />{t("landing.bidEnded")}
              </span>
            ) : bidStatus === "upcoming" ? (
              <span className="inline-flex items-center gap-1 bg-foreground/80 text-card text-[11px] font-bold px-2 py-0.5 rounded-sm">
                <Clock className="h-3 w-3" />
                {group.earliestBidStartDate ? formatLocalTime(group.earliestBidStartDate) : t("landing.upcoming")}
              </span>
            ) : timeLeft ? (
              <span className="inline-flex items-center gap-1 bg-destructive/90 text-destructive-foreground text-[11px] font-bold px-2 py-0.5 rounded-sm">
                <Clock className="h-3 w-3" />{timeLeft}
              </span>
            ) : null}
          </div>
        )}

        {/* Batch count — bottom right */}
        <div className="absolute bottom-0 right-0 z-10">
          <span className="inline-flex items-center gap-1 bg-foreground/85 text-card text-[12px] font-semibold pl-3 pr-3 py-2 rounded-tl-lg">
            <Gavel className="h-3.5 w-3.5" /> {group.batchCount}
          </span>
        </div>
      </div>

      {/* Details below image */}
      <div className="px-3 pt-2.5 pb-2.5">
        <h3 className="font-bold text-[14px] text-foreground leading-snug uppercase group-hover:text-primary transition-colors line-clamp-1">
          {group.title}
        </h3>
        <p className="text-[12px] text-muted-foreground mt-0.5 flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-primary flex-shrink-0" />
          {group.location || t("landing.verifiedSeller")}
          {" · "}
          {group.batchCount} {t("landing.lotsInCategory")}
        </p>
      </div>
    </div>
  );
};

// ─── Auction Group Section — horizontal scroll, same layout as CategorySection ─
const AuctionGroupSection = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useGetAuctionGroupsHomeQuery({ site_id: "LabGreenbidz" });
  const groups = (data?.data ?? []).filter(
    (g) =>
      !(g.earliestBidEndDate && new Date(g.earliestBidEndDate).getTime() < Date.now())
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 10);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  useEffect(() => {
    if (!isLoading && groups.length > 0) setTimeout(checkScroll, 200);
  }, [groups, isLoading, checkScroll]);

  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "left" ? -480 : 480, behavior: "smooth" });

  return (
    <section className="py-6 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-destructive" />
            {t("landing.auctionsClosingSoon")}
          </h2>
          <Link
            to="/buyer-marketplace?bidFilter=closing_soon"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            {t("landing.viewAll")} <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading && (
          <div className="flex gap-4 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[calc(85vw-2rem)] sm:w-[380px] md:w-[420px] lg:w-[460px] animate-pulse rounded overflow-hidden border border-border">
                <div className="h-[220px] bg-secondary" />
                <div className="px-3 py-2.5 space-y-1.5">
                  <div className="h-3.5 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && groups.length > 0 && (
          <div className="relative">
            {showLeft && (
              <button
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 rounded-full bg-foreground text-card shadow-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex gap-4 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {groups.map((group) => (
                <AuctionGroupCard key={group.group_id} group={group} />
              ))}
            </div>
            {showRight && (
              <button
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 rounded-full bg-foreground text-card shadow-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {!isLoading && groups.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">{t("landing.noUpcomingAuctions")}</p>
        )}
      </div>
    </section>
  );
};

// ─── Landing Page ─────────────────────────────────────────────────────────────
const Landing = () => {
  const { t } = useTranslation();
  const [sellModalOpen, setSellModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />


      {/* ── Auctions Closing Soon — Auction Groups ───────────────── */}
      <AuctionGroupSection />

      {/* ── Highlighted Lots — by Category ───────────────────────── */}
      <CategorySection
        title={t("landing.highlightLots")}
        icon={Star}
        iconClass="text-amber-500"
        viewAllLink="/buyer-marketplace"
        highlighted={true}
      />

      {/* ── New Auctions — by Category ────────────────────────────── */}
      <CategorySection
        title={t("landing.newAuctions")}
        icon={Sparkles}
        iconClass="text-primary"
        viewAllLink="/buyer-marketplace?bidFilter=upcoming"
        sort="upcoming"
        emptyMessage={t("landing.noUpcomingAuctions")}
      />

      {/* ── Brand Trust Bar ───────────────────────────────────────── */}
      <section className="py-5 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest text-center mb-4 font-medium">
            {t("landing.trustedBrands")}
          </p>
          <div className="flex items-center justify-center gap-6 md:gap-10 flex-wrap">
            {trustedBrands.map((brand) => (
              <div
                key={brand.abbr}
                className="flex items-center justify-center px-4 py-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-default"
                title={brand.name}
              >
                <span className="text-sm md:text-base font-bold tracking-wider text-muted-foreground">
                  {brand.abbr}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Browse by Category ────────────────────────────────────── */}
      <BrowseByCategorySection />

      {/* ── Category Product Rows ─────────────────────────────────── */}
      <CategoryProductRows />

      {/* ── Stats Bar ────────────────────────────────────────────── */}
      <div className="bg-card border-y border-border">
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-wrap items-center justify-center divide-x divide-border">
            {statValues.map((value, i) => (
              <div key={statKeys[i]} className="text-center px-6 sm:px-10 py-1">
                <div className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  {value}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                  {t(statKeys[i])}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Find Deals In (country pills) ─────────────────────────── */}
      <section className="bg-muted/40 border-b border-border">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Expand Your Search</p>
          <h2 className="text-lg font-bold text-foreground mb-5">Find deals in:</h2>
          <div className="flex flex-wrap justify-center gap-2.5">
            {[
              { code: "tw", name: "Taiwan" },
              { code: "jp", name: "Japan" },
              { code: "cn", name: "China" },
              { code: "kr", name: "South Korea" },
              { code: "in", name: "India" },
              { code: "th", name: "Thailand" },
              { code: "vn", name: "Vietnam" },
              { code: "de", name: "Germany" },
              { code: "us", name: "USA" },
              { code: "gb", name: "UK" },
            ].map((country) => (
              <Link
                key={country.name}
                to={`/buyer-marketplace?country=${encodeURIComponent(country.name)}`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded bg-card text-sm text-foreground hover:border-primary hover:shadow-sm transition-all"
              >
                <img src={`https://flagcdn.com/20x15/${country.code}.png`} alt={country.name} className="w-5 h-[15px] object-cover rounded-[2px]" />
                {country.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sell & Direct Sales Section (Surplex style) ─────────── */}
      <section className="bg-muted/50 border-y border-border">
        <div className="container mx-auto px-4 py-10">
          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Expand Your Reach</p>
            <h2 className="text-xl font-bold text-foreground">Sell Your Industrial Assets with 101Machines</h2>
          </div>

          {/* Two cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Sell with GreenBidz */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-base text-foreground">Sell with GreenBidz</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Turn your used machinery, tools, and surplus inventory into capital. From individual items to entire production plants, 101machines ensures you get maximum value through expert auctions and strategic marketing.
              </p>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded"
                onClick={() => setSellModalOpen(true)}
              >
                Sell with GreenBidz <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Direct Sales */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-base text-foreground">Direct Sales</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Premium machines at fixed prices. Explore our direct sales for high-quality equipment, available immediately for your business.
              </p>
              <Link
                to="/buyer-marketplace?type=direct"
                className="flex items-center justify-center w-full py-2 border border-primary text-primary text-sm font-semibold rounded hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Direct Sale <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Market Insights ───────────────────────────────────────── */}
      <section className="py-10 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-base font-bold text-foreground mb-5">
            {t("landing.marketInsights")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insightKeys.map((item, i) => {
              const Icon = insightIcons[i];
              return (
                <div
                  key={item.titleKey}
                  className="bg-background border border-border p-5 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-primary/5 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
                      {t(item.tagKey)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1.5">
                    {t(item.titleKey)}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t(item.descKey)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
      <SellLeadModal open={sellModalOpen} onOpenChange={setSellModalOpen} />
    </div>
  );
};

export default Landing;
