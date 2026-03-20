// @ts-nocheck
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Loader2 } from "lucide-react";
import Header from "@/components/common/Header";
import MarketplaceCardGrid from "@/components/common/MarketplaceCardGrid";
import axiosInstance from "@/rtk/api/axiosInstance";
import { toastError } from "@/helper/toasterNotification";

const MyLots = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(localStorage.getItem("userId"));
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sync = () => setUserId(localStorage.getItem("userId"));
    window.addEventListener("auth-changed", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("auth-changed", sync); window.removeEventListener("storage", sync); };
  }, []);

  const fetchWishlist = () => {
    if (!userId) return;
    setLoading(true);
    axiosInstance.get(`/wishlist/${userId}`)
      .then((res) => setItems(res.data?.data?.wishlist || []))
      .catch(() => toastError("Failed to load favourites"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWishlist(); }, [userId]);

  useEffect(() => {
    window.addEventListener("wishlist-changed", fetchWishlist);
    return () => window.removeEventListener("wishlist-changed", fetchWishlist);
  }, [userId]);

  // Map wishlist product shape → MarketplaceCardGrid listing shape
  const listings = items
    .filter((i: any) => i.product)
    .map((i: any) => {
      const p = i.product;
      const images = p.attachments?.map((a: any) => a.url).filter(Boolean) || (p.image1 ? [p.image1] : []);
      return {
        id: p.batch_id || p.product_id,
        title: p.title,
        images,
        image: images[0] || null,
        category: p.categories?.[0]?.term?.replace(/&amp;/g, "&") || null,
        country: null,
        bid_type: null,
        target_price: null,
        currency: null,
        bid_start_date: null,
        bid_end_date: null,
        bids: 0,
        city: "N/A",
        firstProductId: p.product_id,
      };
    });

  if (!userId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Heart className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Sign in to view your favourites</h2>
          <p className="text-sm text-muted-foreground">Keep track of listings you love.</p>
          <button onClick={() => navigate("/auth")}
            className="mt-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-foreground mb-6">My Favourites</h1>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        )}

        {!loading && listings.length === 0 && (
          <div className="flex flex-col items-center py-20 gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <Heart className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-foreground">No saved listings</p>
            <p className="text-sm text-muted-foreground">Click the heart icon on any listing to save it here.</p>
            <button onClick={() => navigate("/buyer-marketplace")}
              className="mt-3 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              Browse listings
            </button>
          </div>
        )}

        {!loading && listings.length > 0 && (
          <MarketplaceCardGrid
            listings={listings}
            onItemClick={(item) => navigate(`/buyer-marketplace/${item.id}`)}
          />
        )}
      </div>
    </div>
  );
};

export default MyLots;
