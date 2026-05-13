// @ts-nocheck
import { useEffect, useState, useCallback } from "react";
import { Clock, ShieldCheck, Store, Heart, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import axiosInstance from "@/rtk/api/axiosInstance";
import { toastSuccess, toastError } from "@/helper/toasterNotification";
import { useCategoryCache } from "@/hooks/useCategoryCache";
import { pushAddToWishlistEvent } from "@/utils/gtm";
import { cn } from "@/lib/utils";

// ── Country ISO lookup ────────────────────────────────────────────────────────
const COUNTRY_TO_ISO: Record<string, string> = {
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
const getCountryIso = (name: string) => COUNTRY_TO_ISO[name] || "";

// ── Currency formatter ────────────────────────────────────────────────────────
const formatPrice = (amount: string | number, currency: string | null) => {
  const num = Number(amount);
  if (isNaN(num)) return "";
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

// ── Live countdown ────────────────────────────────────────────────────────────
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
        setTimeLeft(`${d} ${d === 1 ? "day" : "days"}`);
      } else {
        setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      }
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endDate]);
  return (
    <span className="inline-flex items-center gap-1 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-medium text-foreground">
      <Clock className="h-3 w-3" />
      {timeLeft}
    </span>
  );
};

// ── Opens-in badge ────────────────────────────────────────────────────────────
const OpensInBadge = ({ startDate }: { startDate: string }) => {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const start = new Date(startDate);
      const diff = start.getTime() - now.getTime();
      if (diff <= 0) { setLabel(""); return; }
      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startDay  = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const daysDiff  = Math.round((startDay.getTime() - todayDate.getTime()) / 86400000);
      if (daysDiff >= 1) {
        const formatted = start.toLocaleDateString(undefined, { day: "numeric", month: "short" });
        setLabel(`Opens ${formatted}`);
      } else {
        const h = Math.floor(diff / 3600000);
        setLabel(h >= 1 ? `Opens in ${h}h` : `Opens in ${Math.floor(diff / 60000)}m`);
      }
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [startDate]);
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-medium text-foreground">
      <Clock className="h-3 w-3" />
      {label}
    </span>
  );
};

// ── Bid status ────────────────────────────────────────────────────────────────
const getBidStatus = (item: any) => {
  const now = Date.now();
  if (item.bid_start_date && item.bid_end_date) {
    const start = new Date(item.bid_start_date).getTime();
    const end   = new Date(item.bid_end_date).getTime();
    if (now >= start && now <= end) return "live";
    if (now < start) return "upcoming";
    if (now > end) return "ended";
  }
  return "none";
};

// ── Wishlist button ───────────────────────────────────────────────────────────
const WishlistButton = ({
  productId,
  trackingTitle,
  trackingCategory,
  trackingPrice,
  trackingCurrency,
}: {
  productId: number;
  trackingTitle?: string;
  trackingCategory?: string;
  trackingPrice?: number;
  trackingCurrency?: string;
}) => {
  const [userId, setUserId] = useState(localStorage.getItem("userId"));
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sync = () => setUserId(localStorage.getItem("userId"));
    window.addEventListener("auth-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("auth-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!userId || !productId) return;
    axiosInstance.get(`/wishlist/${userId}/${productId}`)
      .then((res) => {
        if (res.data?.data?.inWishlist !== undefined) setInWishlist(res.data.data.inWishlist);
      })
      .catch(() => {});
  }, [userId, productId]);

  const handleToggle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) { toastError("Please login to add to wishlist"); return; }
    if (loading) return;
    const prev = inWishlist;
    setInWishlist(!prev);
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/wishlist/${userId}/toggle`, { productId });
      const action = res.data?.data?.action;
      if (action === "added") { setInWishlist(true); toastSuccess("Added to wishlist"); }
      else if (action === "removed") { setInWishlist(false); toastSuccess("Removed from wishlist"); }
      if (action === "added") {
        try {
          pushAddToWishlistEvent({
            listing_id:       productId,
            listing_title:    trackingTitle ?? "",
            listing_category: trackingCategory ?? "",
            price:            trackingPrice,
            currency:         trackingCurrency,
          });
        } catch { /* tracking errors must never affect UX */ }
      }
      window.dispatchEvent(new Event("wishlist-changed"));
    } catch {
      setInWishlist(prev);
      toastError("Failed to update wishlist");
    } finally {
      setLoading(false);
    }
  }, [userId, productId, loading, inWishlist]);

  return (
    <button
      onClick={handleToggle}
      aria-label="Add to favourites"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-background/90 backdrop-blur-md shadow-sm transition-all hover:scale-110 hover:bg-background"
    >
      <Heart className={cn("h-4 w-4 transition-colors", inWishlist ? "fill-primary text-primary" : "text-foreground/70")} />
    </button>
  );
};

// ── Single image or placeholder ───────────────────────────────────────────────
const CardImage = ({ images }: { images: string[] }) => {
  const src = images[0];
  if (!src) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted">
        <Store className="w-10 h-10 text-muted-foreground/40" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt="Product"
      loading="lazy"
      decoding="async"
      width={800}
      height={640}
      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
    />
  );
};

// ── Marketplace Card (Lovable 101LAB style) ───────────────────────────────────
const MarketplaceCard = ({ item, onClick }: { item: any; onClick: () => void }) => {
  const { i18n, t } = useTranslation();
  const currentLang = (i18n.language as "en" | "zh" | "ja" | "th") || "en";
  const { getTranslatedCategory } = useCategoryCache();

  const images: string[] = item.images || (item.image ? [item.image] : []);
  const bidStatus = item.dynamicStatus || getBidStatus(item);

  const translatedTitle = item[`title_${currentLang}`] || item.title || `Batch #${item.id}`;
  const translatedCategory = currentLang === "zh"
    ? getTranslatedCategory(item.category, "zh")
    : item.category || "";

  const priceLabel = (() => {
    if (item.bid_type === "fixed_price" && item.target_price && Number(item.target_price) > 0)
      return formatPrice(item.target_price, item.currency);
    if (item.bid_type === "make_offer") return "Make Offer";
    if (item.askingPrice && item.askingPrice !== "$0") return item.askingPrice;
    return "Make Offer";
  })();

  const daysLeft = (() => {
    if (!item.bid_end_date) return null;
    const diff = new Date(item.bid_end_date).getTime() - Date.now();
    if (diff <= 0) return null;
    return Math.ceil(diff / 86400000);
  })();

  return (
    <article
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-primary/20 cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-[5/3] overflow-hidden bg-muted">
        <CardImage images={images} />

        {/* Gradient overlay on hover */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Top row: wishlist left, LIVE badge right */}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between z-10">
          {item.firstProductId && (
            <WishlistButton
              productId={item.firstProductId}
              trackingTitle={translatedTitle}
              trackingCategory={translatedCategory}
            />
          )}
          {bidStatus === "live" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground shadow-md ml-auto">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-foreground opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary-foreground" />
              </span>
              Live
            </span>
          )}
          {bidStatus === "upcoming" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent-foreground shadow-md ml-auto">
              Upcoming
            </span>
          )}
          {bidStatus === "ended" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground shadow-md ml-auto border border-border">
              Ended
            </span>
          )}
        </div>

        {/* Bottom: countdown / days left */}
        <div className="absolute bottom-3 left-3 z-10">
          {bidStatus === "live" && item.bid_end_date && (
            <CountdownTimer endDate={item.bid_end_date} />
          )}
          {bidStatus === "upcoming" && item.bid_start_date && (
            <OpensInBadge startDate={item.bid_start_date} />
          )}
          {bidStatus !== "live" && bidStatus !== "upcoming" && daysLeft !== null && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur-md px-2.5 py-1 text-xs font-medium text-foreground">
              <Clock className="h-3 w-3" />
              {daysLeft} {daysLeft === 1 ? "day" : "days"}
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        {/* Batch ID + category */}
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>#{item.id}</span>
          <div className="flex items-center gap-1.5">
            {item.country && getCountryIso(item.country) && (
              <img
                src={`https://flagcdn.com/20x15/${getCountryIso(item.country)}.png`}
                alt={item.country}
                title={item.country}
                className="w-5 h-[15px] object-cover rounded-[2px] flex-shrink-0"
                loading="lazy"
                width={20}
                height={15}
              />
            )}
            {translatedCategory && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground truncate max-w-[110px]">
                {translatedCategory}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {translatedTitle}
        </h3>

        {/* CTA row */}
        <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
          <button
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {priceLabel}
          </button>
          <button className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:gap-1.5 hover:opacity-90">
            {t("products.view")}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};

// ── Grid wrapper ──────────────────────────────────────────────────────────────
interface MarketplaceCardGridProps {
  listings: any[];
  onItemClick: (item: any) => void;
}

const MarketplaceCardGrid = ({ listings, onItemClick }: MarketplaceCardGridProps) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  if (listings.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {listings.map((item) => (
        <MarketplaceCard
          key={`${item.batchId || item.id}-${currentLang}`}
          item={item}
          onClick={() => onItemClick(item)}
        />
      ))}
    </div>
  );
};

export default MarketplaceCardGrid;
