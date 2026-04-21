import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/lablogo.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toastError, toastSuccess } from "@/helper/toasterNotification";
import { useLogoutMutation } from "@/rtk/slices/apiSlice";
import { useLoginModal } from "@/context/LoginModalContext";
import { useLanguageAwareCategories, LabCategory } from "@/hooks/useLanguageAwareCategories";
import {
  Menu, X, ChevronDown, Search, Headphones, LogIn, User, Store, Globe, UserPlus, Heart, ChevronRight,
} from "lucide-react";
import i18n from "@/i18n/config";
import SellLeadModal from "@/components/common/SellLeadModal";
import { SITE_NAME } from "@/config/branding";
import { normalizeStoredLanguage } from "@/utils/languageUtils";
import { pushLogoutEvent, pushSearchEvent } from "@/utils/gtm";

        
 

const MONDAY_FORM_URL = "https://forms.monday.com/"; 



const formatCategoryName = (name: string) => {
  return name.replace(/\s*\(.*?\)\s*/g, "");
};
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
  const [hoveredParent, setHoveredParent] = useState<string | null>(null);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [searchVal, setSearchVal] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("search") || "";
  });

  // Sync search input with URL ?search= param on navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("search") || "";
    setSearchVal(q);
  }, [location.search]);
  const [visibleCatCount, setVisibleCatCount] = useState(3);
  // mobile: which parent is expanded
  const [mobileExpandedParent, setMobileExpandedParent] = useState<string | null>(null);

  const [userId, setUserId] = useState(localStorage.getItem("userId"));
  const { openLoginModal } = useLoginModal();

  useEffect(() => {
    const syncAuth = () => setUserId(localStorage.getItem("userId"));
    window.addEventListener("auth-changed", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("auth-changed", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  const lang = i18n.language || "en";
  const { data: categoriesData } = useLanguageAwareCategories();
  const categories: LabCategory[] = Array.isArray(categoriesData) ? categoriesData : [];

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

  const categorySlugKey = useMemo(
    () => categories.map((c) => c.slug).join("\0"),
    [categories]
  );

  // Keep hover target valid when category tree reloads (e.g. language / data refresh)
  useEffect(() => {
    if (categories.length === 0) {
      setHoveredParent(null);
      return;
    }
    const exists = categories.some((c) => c.slug === hoveredParent);
    if (!exists) {
      const withSubs = categories.find((c) => (c.subcategories?.length ?? 0) > 0);
      setHoveredParent(withSubs?.slug ?? categories[0].slug);
    }
  }, [categorySlugKey]); // eslint-disable-line react-hooks/exhaustive-deps -- sync when tree identity changes

  // When dropdown opens, pre-highlight the first parent that has subcategories (or first row)
  const handleCategoryMouseEnter = () => {
    setIsCategoryOpen(true);
    if (categories.length === 0) return;
    const match = categories.find((c) => c.slug === hoveredParent);
    if (!match) {
      const preferred =
        categories.find((c) => (c.subcategories?.length ?? 0) > 0) ?? categories[0];
      setHoveredParent(preferred.slug);
    } else if (!hoveredParent) {
      const preferred =
        categories.find((c) => (c.subcategories?.length ?? 0) > 0) ?? categories[0];
      setHoveredParent(preferred.slug);
    }
  };

  const hoveredParentData = categories.find((c) => c.slug === hoveredParent) ?? null;

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  const changeLanguage = (lng: string) => {
    const canonical = normalizeStoredLanguage(lng);
    i18n.changeLanguage(canonical);
    localStorage.setItem("language", canonical);
    setIsLangOpen(false);
  };

  const handleLogout = async () => {
    try {
      const confirmLogout = window.confirm(
        t("common.confirmLogout") || "Are you sure you want to logout?"
      );
      if (!confirmLogout) return;

      try { pushLogoutEvent(); } catch {}
      await logout().unwrap();

      document.cookie = "accessToken=; Max-Age=0; path=/; domain=.101recycle.greenbidz.com; secure; SameSite=None";
      document.cookie = "refreshToken=; Max-Age=0; path=/; domain=.101recycle.greenbidz.com; secure; SameSite=None";

      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      toastSuccess(t("common.logoutSuccess") || "Logged out successfully");
      window.dispatchEvent(new Event("auth-changed"));
      window.location.href = "/";
    } catch (error: any) {
      console.error("Logout failed:", error);
      toastError(error?.data?.message || t("common.logoutFailed") || "Logout failed");
    }
  };

  const handleSearch = () => {
    const term = searchVal.trim();
    if (term) {
      // results_count=0 placeholder — actual count reported by destination page (debounced search)
      try { pushSearchEvent(term, 0); } catch {}
      navigate(`/marketplace?search=${encodeURIComponent(term)}`);
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
                {t("publicHeader.faq")}
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
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${lang === l.code
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
                alt={SITE_NAME}
                className="w-[8rem]  h-auto object-contain"
              />
   
            </div>

            {/* Search */}
            <div className="hidden sm:flex flex-1 max-w-2xl mx-auto relative">
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder={t("publicHeader.searchPlaceholder")}
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
              <button
                onClick={() => {
                  if (!userId) { toastError(t("publicHeader.loginForFavourites")); return; }
                  navigate("/my-lots");
                }}
                className="flex items-center gap-1.5 text-xs text-foreground hover:text-primary transition-colors px-2 py-1.5"
              >
                <Heart className="h-4 w-4" />
                {t("publicHeader.favourites")}
              </button>

              {userId ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-foreground hover:bg-secondary text-xs h-9 gap-1.5"
                    onClick={() => window.open("/dashboard", "_blank")}
                  >
                    <User className="h-3.5 w-3.5" />
                    {t("publicHeader.dashboard")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground text-xs h-9"
                    onClick={handleLogout}
                  >
                    {t("publicHeader.logout")}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive-foreground hover:bg-destructive text-xs h-9 gap-1.5 font-medium"
                    onClick={() => window.open("/auth?type=buyer&mode=signup", "_blank")}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {t("publicHeader.createAccount")}
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
                      {t("publicHeader.signIn")}
                    </Button>
                    {isSignInOpen && (
                      <div className="absolute right-0 top-full pt-0.5 z-50">
                        <div className="bg-popover border border-border rounded shadow-lg min-w-[160px] py-0.5">
                          <button
                            onClick={() => window.open("/auth?type=buyer&mode=signin", "_blank")}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-secondary transition-colors"
                          >
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            {t("publicHeader.buyerPortal")}
                          </button>
                          <button
                            onClick={() => window.open("/auth?type=seller&mode=signin", "_blank")}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-secondary transition-colors"
                          >
                            <Store className="h-3.5 w-3.5 text-muted-foreground" />
                            {t("publicHeader.sellerPortal")}
                          </button>
                          <button
                            onClick={() => window.open("/auth?type=admin&mode=signin", "_blank")}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-secondary transition-colors"
                          >
                            <Store className="h-3.5 w-3.5 text-muted-foreground" />
                            {t("publicHeader.adminPortal")}
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
              aria-label={t("publicHeader.toggleMenu")}
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
              {t("publicHeader.allAuctions")}
            </Link>

            {/* All categories — Surplex-style mega menu */}
            <div
              className="relative flex-shrink-0 h-full"
              onMouseEnter={handleCategoryMouseEnter}
              onMouseLeave={() => { setIsCategoryOpen(false); setHoveredParent(null); }}
            >
              <button className="flex items-center gap-1 px-3 h-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t("publicHeader.allCategories")}
                <ChevronDown className={`h-3 w-3 transition-transform ${isCategoryOpen ? "rotate-180" : ""}`} />
              </button>

              {isCategoryOpen && (
                <div
                  className="absolute left-0 top-full z-50 flex bg-popover border border-border shadow-xl rounded-b-md"
                  style={{ marginTop: "1px", minWidth: "680px" }}
                >
                  {/* Left panel — parent categories */}
                  <div className="w-[240px] border-r border-border/60 py-1 flex-shrink-0">
                    {categories.map((cat) => (
                      <button
                        key={cat.slug}
                        onMouseEnter={() => setHoveredParent(cat.slug)}
                        onClick={() => {
                          navigate(`/buyer-marketplace?category=${cat.slug}`);
                          setIsCategoryOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                          hoveredParent === cat.slug
                            ? "bg-secondary text-foreground font-medium"
                            : "text-popover-foreground hover:bg-secondary/60"
                        }`}
                      >
                        <span className="truncate text-left">
                          {formatCategoryName(cat.name)}
                        </span>
                        {cat.subcategories?.length > 0 && (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 ml-2" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Right panel — subcategories of hovered parent (header always; grid if any) */}
                  {hoveredParentData && (
                    <div className="flex-1 p-4 min-w-[400px]">
                      <div className="mb-3 pb-2 border-b border-border/60">
                        <h3 className="text-sm font-bold text-foreground">
                          {/* {hoveredParentData.name} */}
                            {formatCategoryName(hoveredParentData.name)}
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            navigate(`/buyer-marketplace?category=${encodeURIComponent(hoveredParentData.slug)}`);
                            setIsCategoryOpen(false);
                          }}
                          className="text-xs text-primary hover:underline font-semibold uppercase tracking-wide mt-0.5"
                        >
                          {t("publicHeader.showAll")}
                        </button>
                      </div>

                      {(hoveredParentData.subcategories?.length ?? 0) > 0 && (
                        <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                          {hoveredParentData.subcategories!.map((sub) => (
                            <button
                              type="button"
                              key={sub.slug}
                              onClick={() => {
                                navigate(`/buyer-marketplace?category=${encodeURIComponent(sub.slug)}`);
                                setIsCategoryOpen(false);
                              }}
                              className="text-left px-0 py-1.5 text-sm text-popover-foreground hover:text-primary transition-colors truncate"
                            >
                              {sub.name}
                              
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />

            {/* Quick category tabs — parent categories, responsive count */}
            <div className="flex items-center flex-1 h-full min-w-0">
              {visibleCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/buyer-marketplace?category=${cat.slug}`}
                  className="px-3 h-full flex items-center text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors whitespace-nowrap flex-shrink-0"
                >
                     {formatCategoryName(cat.name)}
                </Link>
              ))}
              {categories.length > visibleCatCount && (
                <button
                  onMouseEnter={handleCategoryMouseEnter}
                  className="px-3 h-full flex items-center text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors whitespace-nowrap flex-shrink-0"
                >
                  {t("publicHeader.moreCategories")}
                </button>
              )}
            </div>

            {/* Right-side action buttons */}
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-7 rounded px-3"
                onClick={() => navigate("/sell-with-greenbidz")}
              >
                {t("publicHeader.sellWithGreenBidz")}
              </Button>
              <Link to="/direct-sales">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border text-foreground hover:bg-secondary text-xs h-7 rounded px-3"
                >
                  {t("publicHeader.directSales")}
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
                  placeholder={t("publicHeader.searchPlaceholderMobile")}
                  className="w-full h-10 pl-10 pr-4 rounded border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        try { pushSearchEvent(val, 0); } catch {}
                        navigate(`/marketplace?search=${encodeURIComponent(val)}`);
                        (e.target as HTMLInputElement).value = "";
                        setOpenMenu(false);
                      }
                    }
                  }}
                />
              </div>

              {/* Language */}
              <div className="pb-3 border-b border-border">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("publicHeader.language")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => changeLanguage(l.code)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded border transition-colors ${lang === l.code
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

              {/* Categories — parent with collapsible subcategories */}
              <div className="pb-3 border-b border-border">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("publicHeader.categories")}</p>
                <Link
                  to="/buyer-marketplace"
                  onClick={() => setOpenMenu(false)}
                  className="block px-2 py-1.5 text-sm font-medium text-foreground hover:bg-secondary rounded mb-1"
                >
                  {t("publicHeader.allAuctions")}
                </Link>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <div key={cat.slug}>
                      <button
                        className="w-full flex items-center justify-between px-2 py-1.5 text-sm font-medium text-foreground hover:bg-secondary rounded"
                        onClick={() => {
                          if (cat.subcategories?.length > 0) {
                            setMobileExpandedParent(mobileExpandedParent === cat.slug ? null : cat.slug);
                          } else {
                            navigate(`/buyer-marketplace?category=${cat.slug}`);
                            setOpenMenu(false);
                          }
                        }}
                      >
                        <span className="truncate text-left">
                          {formatCategoryName(cat.name)}
                        </span>
                        {cat.subcategories?.length > 0 && (
                          <ChevronDown
                            className={`h-3.5 w-3.5 text-muted-foreground flex-shrink-0 ml-1 transition-transform ${mobileExpandedParent === cat.slug ? "rotate-180" : ""}`}
                          />
                        )}
                      </button>
                      {mobileExpandedParent === cat.slug && cat.subcategories?.length > 0 && (
                        <div className="ml-3 mt-1 space-y-0.5 border-l-2 border-border pl-3">
                          <Link
                            to={`/buyer-marketplace?category=${cat.slug}`}
                            onClick={() => setOpenMenu(false)}
                            className="block px-1 py-1 text-xs font-semibold text-primary hover:underline uppercase tracking-wide"
                          >
                            {t("publicHeader.showAllMobile")}
                          </Link>
                          {cat.subcategories.map((sub) => (
                            <Link
                              key={sub.slug}
                              to={`/buyer-marketplace?category=${sub.slug}`}
                              onClick={() => setOpenMenu(false)}
                              className="block px-1 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded truncate"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
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
                  {t("publicHeader.sellWithGreenBidz")}
                </Button>

                {userId ? (
                  <>
                    <Button variant="outline" size="sm" className="w-full border-border text-foreground h-9"
                      onClick={() => { window.open("/dashboard", "_blank"); setOpenMenu(false); }}>
                      {t("publicHeader.dashboard")}
                    </Button>
                    <Button size="sm" variant="ghost" className="w-full text-muted-foreground h-9"
                      onClick={handleLogout}>
                      {t("publicHeader.logout")}
                    </Button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="border-border text-foreground h-9 text-xs"
                      onClick={() => { navigate("/auth?type=buyer&mode=signup"); setOpenMenu(false); }}>
                      {t("publicHeader.createAccount")}
                    </Button>
                    <Button size="sm" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground h-9 text-xs"
                      onClick={() => { navigate("/auth?type=buyer&mode=signin"); setOpenMenu(false); }}>
                      {t("publicHeader.signIn")}
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
