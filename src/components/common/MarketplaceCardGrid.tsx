// @ts-nocheck
import { useEffect, useState, useCallback } from "react";
import { Clock, ShieldCheck, Gavel, ChevronLeft, ChevronRight, Store, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translateCategoryName } from "@/utils/categoryTranslations";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/rtk/api/axiosInstance";
import { toastSuccess, toastError } from "@/helper/toasterNotification";

// ── Live countdown (ticks every second) ──────────────────────────────────────
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
        setTimeLeft(`${d}d ${h % 24}h ${String(m).padStart(2, "0")}m`);
      } else {
        setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      }
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return (
    <span className="inline-flex items-center gap-1 bg-primary/90 text-primary-foreground text-[11px] font-bold px-2 py-0.5 rounded-sm">
      <Clock className="h-3 w-3" />
      {timeLeft}
    </span>
  );
};

// ── "Opens in" for upcoming bids ──────────────────────────────────────────────
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
        // Tomorrow or later — show the actual date
        const formatted = start.toLocaleDateString(undefined, { day: "numeric", month: "short" });
        setLabel(`Opens in ${formatted}`);
      } else {
        const h = Math.floor(diff / 3600000);
        if (h >= 1) {
          setLabel(`Opens in ${h}h`);
        } else {
          const m = Math.floor(diff / 60000);
          setLabel(`Opens in ${m}m`);
        }
      }
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [startDate]);

  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1 bg-accent/90 text-accent-foreground text-[11px] font-bold px-2 py-0.5 rounded-sm">
      <Clock className="h-3 w-3" />
      {label}
    </span>
  );
};

// ── Mosaic image area (same style as landing page) ────────────────────────────
const MosaicImages = ({ images, itemId }: { images: string[]; itemId: any }) => {
  const allImages = images.length > 0 ? images : [];
  const mainImg = allImages[0];
  const sideImgs = allImages.slice(1, 4);

  if (!mainImg) {
    return (
      <div className="h-[260px] w-full flex items-center justify-center bg-muted">
        <Store className="w-12 h-12 text-muted-foreground/40" />
      </div>
    );
  }

  if (sideImgs.length > 0) {
    return (
      <div className="flex h-[260px]">
        <div className="flex-[3] min-w-0 overflow-hidden">
          <img src={mainImg} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
        </div>
        <div className="flex-[1] min-w-0 flex flex-col gap-[2px] ml-[2px]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 min-h-0 overflow-hidden">
              <img src={sideImgs[i] || mainImg} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[260px] overflow-hidden">
      <img src={mainImg} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
    </div>
  );
};

// ── Bid status logic ───────────────────────────────────────────────────────────
const getBidStatus = (item: any) => {
  const now = Date.now();
  if (item.bid_start_date && item.bid_end_date) {
    const start = new Date(item.bid_start_date).getTime();
    const end = new Date(item.bid_end_date).getTime();
    if (now >= start && now <= end) return "live";
    if (now < start) return "upcoming";
    if (now > end) return "ended";
  }
  return "none";
};

// ── Wishlist Heart Button ─────────────────────────────────────────────────────
const WishlistButton = ({ productId, userId }: { productId: number; userId: number }) => {
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axiosInstance
      .get(`/wishlist/${userId}/${productId}`)
      .then((res) => {
        if (res.data?.data?.inWishlist !== undefined) {
          setInWishlist(res.data.data.inWishlist);
        }
      })
      .catch(() => {});
  }, [userId, productId]);

  const handleToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (loading) return;
      // Optimistic update — toggle immediately
      const prev = inWishlist;
      setInWishlist(!prev);
      setLoading(true);
      try {
        const res = await axiosInstance.post(`/wishlist/${userId}/toggle`, { productId });
        const action = res.data?.data?.action;
        if (action === "added") {
          setInWishlist(true);
          toastSuccess("Added to wishlist");
        } else if (action === "removed") {
          setInWishlist(false);
          toastSuccess("Removed from wishlist");
        }
      } catch {
        // Revert on failure
        setInWishlist(prev);
        toastError("Failed to update wishlist");
      } finally {
        setLoading(false);
      }
    },
    [userId, productId, loading, inWishlist]
  );

  return (
    <button
      onClick={handleToggle}
      className={`absolute top-2 left-2 z-20 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow transition-all duration-150 ${loading ? "opacity-50 cursor-wait scale-95" : "hover:scale-110"}`}
      aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          inWishlist ? "fill-red-500 text-red-500" : "text-gray-500"
        }`}
      />
    </button>
  );
};

// ── Marketplace Card ──────────────────────────────────────────────────────────
const MarketplaceCard = ({ item, onClick }: { item: any; onClick: () => void }) => {
  const { i18n } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const currentLang = i18n.language as 'en' | 'zh';
  const images: string[] = item.images || (item.image ? [item.image] : []);
  const bidStatus = getBidStatus(item);
  const bids: number = item.bids ?? 0;
  const location: string = item.city && item.city !== "N/A" ? item.city : "";

  return (
    <div
      onClick={onClick}
      className="cursor-pointer group border border-border rounded overflow-hidden bg-card hover:shadow-lg transition-shadow duration-200"
    >
      {/* Image area */}
      <div className="relative overflow-hidden">
        <MosaicImages images={images} itemId={item.id} />

        {/* Wishlist heart — top left, only when logged in */}
        {isAuthenticated && user?.id && item.id && (
          <WishlistButton productId={item.id} userId={user.id} />
        )}

        {/* Bid status badge — bottom left */}
        <div className="absolute bottom-2 left-2 z-10">
          {bidStatus === "live" && item.bid_end_date && (
            <CountdownTimer endDate={item.bid_end_date} />
          )}
          {bidStatus === "upcoming" && item.bid_start_date && (
            <OpensInBadge startDate={item.bid_start_date} />
          )}
          {bidStatus === "ended" && (
            <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-[11px] font-bold px-2 py-0.5 rounded-sm border border-border">
              <Clock className="h-3 w-3" />
              Bid Ended
            </span>
          )}
        </div>


        {/* LIVE badge — top right */}
        {bidStatus === "live" && (
          <div className="absolute top-0 right-0 z-10">
            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-bl-lg uppercase tracking-wide">
              LIVE
            </span>
          </div>
        )}

      </div>

      {/* Details */}
      <div className="px-4 pt-3 pb-3">
        <h3 className="font-bold text-[15px] text-foreground leading-snug line-clamp-2 uppercase group-hover:text-primary transition-colors min-h-[2.5rem]">
          {item.title || `Batch #${item.id}`}
        </h3>
        <div className="mt-1 space-y-0.5 text-[12px] text-muted-foreground">
          {location && (
            <p className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-primary flex-shrink-0" />
              {location}
            </p>
          )}
          <p className="flex items-center gap-1">
            <span className="bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
              #{item.id}
            </span>
            {item.category && item.category !== "N/A" && (
              <span className="truncate">{translateCategoryName(item.category, currentLang)}</span>
            )}
          </p>
        </div>
        <div className="flex items-center justify-between mt-2">
          {item.askingPrice && item.askingPrice !== "$0" ? (
            <span className="text-sm font-bold text-foreground">{item.askingPrice}</span>
          ) : (
            <span className="text-[12px] text-muted-foreground italic">Price on request</span>
          )}
          <span className="text-[11px] font-semibold text-primary-foreground bg-primary px-3 py-1 rounded uppercase tracking-wide">
            View
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Grid wrapper ──────────────────────────────────────────────────────────────
interface MarketplaceCardGridProps {
  listings: any[];
  onItemClick: (item: any) => void;
  getDynamicStatus?: (item: any) => string;
}

const MarketplaceCardGrid = ({ listings, onItemClick }: MarketplaceCardGridProps) => {
  if (listings.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {listings.map((item) => (
        <MarketplaceCard key={item.id} item={item} onClick={() => onItemClick(item)} />
      ))}
    </div>
  );
};

export default MarketplaceCardGrid;
