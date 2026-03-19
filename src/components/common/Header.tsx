import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/greenbidz_logo.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toastError, toastSuccess } from "@/helper/toasterNotification";
import { useLogoutMutation } from "@/rtk/slices/apiSlice";
import { useLanguageAwareCategories } from "@/hooks/useLanguageAwareCategories";
import {
  Menu, X, ChevronDown, Search, Headphones, LogIn, User, Store, Globe, UserPlus, Heart, Loader2,
} from "lucide-react";
import axiosInstance from "@/rtk/api/axiosInstance";
import i18n from "@/i18n/config";
import SellLeadModal from "@/components/common/SellLeadModal";

const MONDAY_FORM_URL = "https://forms.monday.com/"; // Replace with actual Monday form URL

const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "zh", label: "繁體中文", flag: "🇹🇼" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "th", label: "ไทย", flag: "🇹🇭" },
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [logout] = useLogoutMutation();
  const [openMenu, setOpenMenu] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [hoveredCatIdx, setHoveredCatIdx] = useState(0);
  const [visibleCatCount, setVisibleCatCount] = useState(5);

  const userId = localStorage.getItem("userId");
  const [favOpen, setFavOpen] = useState(false);
  const [favItems, setFavItems] = useState<any[]>([]);
  const [favLoading, setFavLoading] = useState(false);
  const favRef = useRef<HTMLDivElement>(null);

  // Close favourites panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (favRef.current && !favRef.current.contains(e.target as Node)) setFavOpen(false);
    };
    if (favOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [favOpen]);

  const fetchFavourites = async () => {
    setFavLoading(true);
    try {
      const res = await axiosInstance.get(`/wishlist/${userId}`);
      setFavItems(res.data?.data?.wishlist || []);
    } catch {
      toastError("Failed to load favourites");
    } finally {
      setFavLoading(false);
    }
  };

  const openFavourites = () => {
    if (!userId) { toastError("Please login to view favourites"); return; }
    setFavOpen((prev) => {
      if (!prev) fetchFavourites();
      return !prev;
    });
  };

  const removeFavourite = async (productId: number) => {
    try {
      await axiosInstance.delete(`/wishlist/${userId}/${productId}`);
      setFavItems((prev) => prev.filter((item: any) => item.product?.product_id !== productId));
    } catch {
      toastError("Failed to remove");
    }
  };

  const lang = i18n.language || "en";
  const { data: categoriesData } = useLanguageAwareCategories();
  const categories: any[] = Array.isArray(categoriesData)
    ? categoriesData
    : (categoriesData as any)?.data ?? [];

  // Responsive: show fewer categories on smaller screens
  useEffect(() => {
    const updateCount = () => {
      const w = window.innerWidth;
      if (w < 1100) setVisibleCatCount(2);
      else if (w < 1280) setVisibleCatCount(3);
      else if (w < 1440) setVisibleCatCount(4);
      else setVisibleCatCount(5);
    };
    updateCount();
    window.addEventListener("resize", updateCount);
    return () => window.removeEventListener("resize", updateCount);
  }, []);

  const visibleCategories = categories.slice(0, visibleCatCount);

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("language", lng);
    setIsLangOpen(false);
  };

  const handleLogout = async () => {
    try {
      const confirmLogout = window.confirm(
        t("common.confirmLogout") || "Are you sure you want to logout?"
      );
      if (!confirmLogout) return;

      await logout().unwrap();

      document.cookie = "accessToken=; Max-Age=0; path=/; domain=.101recycle.greenbidz.com; secure; SameSite=None";
      document.cookie = "refreshToken=; Max-Age=0; path=/; domain=.101recycle.greenbidz.com; secure; SameSite=None";

      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      toastSuccess(t("common.logoutSuccess") || "Logged out successfully");
      window.location.href = "/";
    } catch (error: any) {
      console.error("Logout failed:", error);
      toastError(error?.data?.message || t("common.logoutFailed") || "Logout failed");
    }
  };

  const handleSearch = () => {
    if (searchVal.trim()) {
      const params = location.pathname === "/buyer-marketplace"
        ? new URLSearchParams(location.search)
        : new URLSearchParams();
      params.set("search", searchVal.trim());
      params.delete("page");
      navigate(`/buyer-marketplace?${params.toString()}`);
      setOpenMenu(false);
    }
  };

  return (
    <>
      <header className="relative z-50">
        {/* ── Row 1: Utility Bar ─────────────────────────────────── */}
        <div className="bg-muted/60 border-b border-border hidden md:block">
          <div className="container mx-auto px-4 flex items-center justify-between h-7">
            <div className="flex items-center gap-4">
              <a href="#" className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                <Headphones className="h-3 w-3" />
                FAQ
              </a>
            </div>
            <div className="flex items-center gap-3">
              {/* Language switcher */}
              <div
                className="relative"
                onMouseEnter={() => setIsLangOpen(true)}
                onMouseLeave={() => setIsLangOpen(false)}
              >
                <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                  <Globe className="h-3 w-3" />
                  <span>{currentLang.flag} {currentLang.code.toUpperCase()}</span>
                  <ChevronDown className={`h-2.5 w-2.5 transition-transform ${isLangOpen ? "rotate-180" : ""}`} />
                </button>
                {isLangOpen && (
                  <div className="absolute right-0 top-full pt-0.5 z-50">
                    <div className="bg-popover border border-border rounded shadow-lg min-w-[140px] py-0.5">
                      {languages.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => changeLanguage(l.code)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                            lang === l.code
                              ? "text-primary bg-primary/5 font-medium"
                              : "text-popover-foreground hover:bg-secondary"
                          }`}
                        >
                          <span>{l.flag}</span>
                          <span>{l.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 2: Main Header — Logo + Search + Actions ────────── */}
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 flex items-center gap-3 h-14 sm:h-16">
            {/* Logo + brand name */}
            <div
              className="flex items-center gap-2 cursor-pointer flex-shrink-0"
              onClick={() => navigate("/")}
            >
              <img
                src={logo}
                alt="GreenBidz"
                className="h-7 sm:h-8 w-auto"
              />
              <div className="hidden sm:block leading-tight">
                <span className="text-sm font-bold text-foreground">101machines</span>
                <span className="block text-[10px] text-muted-foreground -mt-0.5">by Greenbidz</span>
              </div>
            </div>

            {/* Search — hidden on mobile (shown in mobile menu) */}
            <div className="hidden sm:flex flex-1 max-w-2xl mx-auto relative">
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search for online Lots"
                className="w-full h-10 pl-4 pr-12 border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-l"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
              <button
                onClick={handleSearch}
                className="h-10 w-11 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground rounded-r flex-shrink-0 transition-colors"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>

            {/* Desktop right actions */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0 ml-auto">

              {/* ── Favourites button + dropdown ── */}
              <div className="relative" ref={favRef}>
                <button onClick={openFavourites} className="flex items-center gap-1.5 text-xs text-foreground hover:text-primary transition-colors px-2 py-1.5">
                  <Heart className="h-4 w-4" />
                  Favourites
                </button>

                {favOpen && (
                  <div className="absolute right-0 top-full mt-1 w-80 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <span className="text-sm font-semibold text-foreground">My Favourites</span>
                      <button onClick={() => setFavOpen(false)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {favLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : favItems.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-muted-foreground">
                        <Heart className="h-8 w-8 mb-2" />
                        <p className="text-sm">No favourites yet</p>
                      </div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto">
                        {favItems.map((item: any) => {
                          const p = item.product;
                          return (
                            <Link key={p?.product_id} to={`/buyer-marketplace/${p?.product_id}`} onClick={() => setFavOpen(false)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/50 transition-colors">
                              <img src={p?.thumbnail || "/placeholder.svg"} alt="" className="h-10 w-10 rounded object-cover bg-muted flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{p?.title || "Product"}</p>
                                <span className="text-xs text-primary">View listing →</span>
                              </div>
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFavourite(p?.product_id); }} className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1" title="Remove">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {userId ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-foreground hover:bg-secondary text-xs h-9 gap-1.5"
                    onClick={() => window.open("/dashboard", "_blank")}
                  >
                    <User className="h-3.5 w-3.5" />
                    Dashboard
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground text-xs h-9"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive-foreground hover:bg-destructive text-xs h-9 gap-1.5 font-medium"
                    onClick={() => window.open("/auth?type=buyer", "_blank")}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Create account
                  </Button>
                  <div
                    className="relative"
                    onMouseEnter={() => setIsSignInOpen(true)}
                    onMouseLeave={() => setIsSignInOpen(false)}
                  >
                    <Button
                      size="sm"
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-1.5 text-xs h-9 rounded"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      Sign in
                    </Button>
                    {isSignInOpen && (
                      <div className="absolute right-0 top-full pt-0.5 z-50">
                        <div className="bg-popover border border-border rounded shadow-lg min-w-[160px] py-0.5">
                          <button
                            onClick={() => window.open("/auth?type=buyer", "_blank")}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-secondary transition-colors"
                          >
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            Buyer Portal
                          </button>
                          <button
                            onClick={() => window.open("/auth", "_blank")}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-secondary transition-colors"
                          >
                            <Store className="h-3.5 w-3.5 text-muted-foreground" />
                            Seller Portal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden ml-auto p-1.5"
              onClick={() => setOpenMenu(!openMenu)}
              aria-label="Toggle menu"
            >
              {openMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* ── Row 3: Category Tab Bar (desktop only) ─────────────── */}
        <div className="hidden lg:block bg-card border-b border-border">
          <div className="container mx-auto px-4 flex items-center h-10">
            {/* All auctions */}
            <Link
              to="/buyer-marketplace"
              className="flex-shrink-0 px-3 h-full flex items-center text-sm font-semibold text-foreground border-b-2 border-foreground hover:bg-secondary/60 transition-colors"
            >
              All auctions
            </Link>

            {/* All categories mega-menu */}
            <div
              className="relative flex-shrink-0 h-full"
              onMouseEnter={() => setIsCategoryOpen(true)}
              onMouseLeave={() => setIsCategoryOpen(false)}
            >
              <button className="flex items-center gap-1 px-3 h-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                All categories
                <ChevronDown className={`h-3 w-3 transition-transform ${isCategoryOpen ? "rotate-180" : ""}`} />
              </button>
              {isCategoryOpen && <div className="absolute left-0 top-full w-full h-1 z-50" />}
              {isCategoryOpen && (
                <div className="fixed left-0 right-0 top-auto z-50 bg-popover border-t border-border shadow-xl" style={{ marginTop: '1px' }}>
                  <div className="container mx-auto px-4 flex min-h-[320px] max-h-[70vh]">
                    {/* Left sidebar — category list */}
                    <div className="w-[260px] border-r border-border overflow-y-auto py-2 flex-shrink-0">
                      {categories.map((cat, idx) => (
                        <button
                          key={cat.slug}
                          onMouseEnter={() => setHoveredCatIdx(idx)}
                          onClick={() => { navigate(`/buyer-marketplace?category=${cat.slug}`); setIsCategoryOpen(false); }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                            hoveredCatIdx === idx
                              ? "bg-secondary text-primary font-medium"
                              : "text-popover-foreground hover:bg-secondary/50"
                          }`}
                        >
                          <span>{cat.name}</span>
                          <ChevronDown className="h-3 w-3 -rotate-90 text-muted-foreground flex-shrink-0" />
                        </button>
                      ))}
                    </div>

                    {/* Right panel — category detail */}
                    <div className="flex-1 p-6 overflow-y-auto">
                      {categories[hoveredCatIdx] && (
                        <>
                          <h3 className="text-lg font-bold text-foreground mb-1">{categories[hoveredCatIdx].name}</h3>
                          <Link
                            to={`/buyer-marketplace?category=${categories[hoveredCatIdx].slug}`}
                            onClick={() => setIsCategoryOpen(false)}
                            className="text-sm font-semibold text-primary hover:underline inline-block mb-5"
                          >
                            SHOW ALL
                          </Link>

                          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                            Browse all available {categories[hoveredCatIdx].name.toLowerCase()} listings. Find auctions, direct sales, and verified equipment from trusted sellers worldwide.
                          </p>

                          <div className="border-t border-border pt-4">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3 font-medium">More categories</p>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
                              {categories.filter((_, i) => i !== hoveredCatIdx).slice(0, 10).map((cat) => (
                                <Link
                                  key={cat.slug}
                                  to={`/buyer-marketplace?category=${cat.slug}`}
                                  onClick={() => setIsCategoryOpen(false)}
                                  className="text-sm text-popover-foreground hover:text-primary transition-colors py-1 truncate"
                                >
                                  {cat.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />

            {/* Quick category tabs — responsive count */}
            <div className="flex items-center flex-1 h-full min-w-0">
              {visibleCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/buyer-marketplace?category=${cat.slug}`}
                  className="px-3 h-full flex items-center text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors whitespace-nowrap flex-shrink-0"
                >
                  {cat.name}
                </Link>
              ))}
            </div>

            {/* Right-side action buttons */}
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-7 rounded px-3"
                onClick={() => setSellModalOpen(true)}
              >
                Sell with GreenBidz
              </Button>
              <Link to="/buyer-marketplace">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border text-foreground hover:bg-secondary text-xs h-7 rounded px-3"
                >
                  Direct sales
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu ──────────────────────────────────────────── */}
        {openMenu && (
          <div className="lg:hidden bg-card border-t border-border shadow-lg max-h-[calc(100vh-56px)] overflow-y-auto">
            <div className="px-4 py-3 space-y-3">
              {/* Mobile search */}
              <div className="relative sm:hidden">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search machines..."
                  className="w-full h-10 pl-10 pr-4 rounded border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        const params = location.pathname === "/buyer-marketplace"
                          ? new URLSearchParams(location.search)
                          : new URLSearchParams();
                        params.set("search", val);
                        params.delete("page");
                        navigate(`/buyer-marketplace?${params.toString()}`);
                        setOpenMenu(false);
                      }
                    }
                  }}
                />
              </div>

              {/* Language */}
              <div className="pb-3 border-b border-border">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Language</p>
                <div className="flex flex-wrap gap-1.5">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => changeLanguage(l.code)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded border transition-colors ${
                        lang === l.code
                          ? "border-primary text-primary bg-primary/5 font-medium"
                          : "border-border text-foreground hover:bg-secondary"
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="pb-3 border-b border-border">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Categories</p>
                <div className="grid grid-cols-2 gap-1">
                  <Link
                    to="/buyer-marketplace"
                    onClick={() => setOpenMenu(false)}
                    className="px-2 py-1.5 text-sm text-foreground hover:bg-secondary rounded"
                  >
                    All
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      to={`/buyer-marketplace?category=${cat.slug}`}
                      onClick={() => setOpenMenu(false)}
                      className="px-2 py-1.5 text-sm text-foreground hover:bg-secondary rounded truncate"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  size="sm"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9"
                  onClick={() => { setSellModalOpen(true); setOpenMenu(false); }}
                >
                  Sell with GreenBidz
                </Button>

                {userId ? (
                  <>
                    <Button variant="outline" size="sm" className="w-full border-border text-foreground h-9"
                      onClick={() => { window.open("/dashboard", "_blank"); setOpenMenu(false); }}>
                      Dashboard
                    </Button>
                    <Button size="sm" variant="ghost" className="w-full text-muted-foreground h-9"
                      onClick={handleLogout}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="border-border text-foreground h-9 text-xs"
                      onClick={() => { window.open("/auth?type=buyer", "_blank"); setOpenMenu(false); }}>
                      Create account
                    </Button>
                    <Button size="sm" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground h-9 text-xs"
                      onClick={() => { window.open("/auth", "_blank"); setOpenMenu(false); }}>
                      Sign in
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <SellLeadModal open={sellModalOpen} onOpenChange={setSellModalOpen} />
    </>
  );
};

export default Header;
