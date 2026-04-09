// @ts-nocheck
import { useState, useEffect } from "react";
import { ChevronDown, Filter, X, Globe, Wrench, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguageAwareCategories } from "@/hooks/useLanguageAwareCategories";
import { useTranslation } from "react-i18next";

const INITIAL_VISIBLE_COUNT = 6;

const COUNTRIES = [
  { id: "china", name: "China" },
  { id: "indonesia", name: "Indonesia" },
  { id: "india", name: "India" },
  { id: "malaysia", name: "Malaysia" },
  { id: "taiwan", name: "Taiwan" },
  { id: "thailand", name: "Thailand" },
  { id: "japan", name: "Japan" },
  { id: "vietnam", name: "Vietnam" },
];

const CONDITIONS = [
  { id: "new",        nameKey: "browseListings.conditionNew" },
  { id: "like_new",   nameKey: "browseListings.conditionLikeNew" },
  { id: "good",       nameKey: "browseListings.conditionGood" },
  { id: "fair",       nameKey: "browseListings.conditionFair" },
  { id: "refurbished",nameKey: "browseListings.conditionRefurbished" },
  { id: "for_parts",  nameKey: "browseListings.conditionForParts" },
];

const BID_OPTIONS = [
  { id: "closing_soon", labelKey: "browseListings.closingSoon", activeBg: "bg-destructive/10 border-destructive/50 text-destructive" },
  { id: "upcoming",     labelKey: "browseListings.upcoming",     activeBg: "bg-primary/10 border-primary/50 text-primary" },
  { id: "ended",        labelKey: "browseListings.ended",        activeBg: "bg-muted border-border text-foreground font-semibold" },
  { id: "custom",       labelKey: "browseListings.customDate",  activeBg: "bg-accent/10 border-accent/50 text-accent" },
];

// FilterPanel is defined OUTSIDE BuyerMarketplaceFilters so React never remounts it on re-render
const FilterPanel = ({
  selectedCategory, onCategoryChange,
  selectedCountry, onCountryChange,
  selectedCondition, onConditionChange,
  selectedBidFilter, onBidFilterChange,
  selectedBidDate, onBidDateChange,
  selectedSearch,
  onClearAll,
}) => {
  const { t } = useTranslation();
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(true);
  const [isCountryExpanded, setIsCountryExpanded] = useState(true);
  const [isConditionExpanded, setIsConditionExpanded] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [expandedParents, setExpandedParents] = useState({});

  const { data: categoriesData, isLoading: categoriesLoading } = useLanguageAwareCategories();
  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.data ?? [];
  const visibleCategories = showAllCategories ? categories : categories.slice(0, INITIAL_VISIBLE_COUNT);

  // Expand first category by default on initial load
  useEffect(() => {
    if (categories.length > 0 && Object.keys(expandedParents).length === 0) {
      setExpandedParents({ [categories[0].slug]: true });
    }
  }, [categories.length]);

  const toggleParentExpand = (parentSlug) => {
    setExpandedParents(prev => ({
      ...prev,
      [parentSlug]: !prev[parentSlug]
    }));
  };

  const hasActiveFilter = !!selectedCategory || !!selectedCountry || !!selectedCondition || !!selectedBidFilter || !!selectedSearch;
  const activeCount = [selectedCategory, selectedCountry, selectedCondition, selectedBidFilter, selectedSearch].filter(Boolean).length;

  const handleBidClick = (id) => {
    onBidFilterChange(selectedBidFilter === id ? "" : id);
  };

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
          {t("browseListings.filters")}
          {activeCount > 0 && (
            <span className="ml-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </h3>
        {hasActiveFilter && (
          <button type="button" onClick={onClearAll} className="text-xs text-destructive hover:text-destructive/80 transition-colors font-medium">
            {t("browseListings.clearAll")}
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="py-3 border-b border-border/60">
        <button type="button" onClick={() => setIsCategoryExpanded(!isCategoryExpanded)} className="flex items-center justify-between w-full text-left py-1 group">
          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{t("browseListings.category")}</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isCategoryExpanded ? "rotate-180" : ""}`} />
        </button>
        {isCategoryExpanded && (
          <div className="mt-3 space-y-1">
            {categoriesLoading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-5 bg-muted rounded animate-pulse" />)}</div>
            ) : categories.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("browseListings.noCategories")}</p>
            ) : (
              <>
                {visibleCategories.map((cat) => (
                  <div key={cat.term_id}>
                    {/* Parent Category */}
                    <div className="flex items-center gap-2.5">
                      <label className={`flex items-center gap-2.5 cursor-pointer group py-1.5 px-2 rounded-md transition-colors flex-1 ${selectedCategory === cat.slug ? "bg-primary/8" : "hover:bg-muted/60"}`}>
                        <Checkbox checked={selectedCategory === cat.slug} onCheckedChange={() => onCategoryChange(selectedCategory === cat.slug ? "" : cat.slug)} className="h-3.5 w-3.5 rounded-sm" />
                        <span className={`text-xs transition-colors flex-1 ${selectedCategory === cat.slug ? "text-primary font-medium" : "text-foreground group-hover:text-primary"}`}>{cat.name}</span>
                      </label>
                      {cat.subcategories && cat.subcategories.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleParentExpand(cat.slug)}
                          className="pr-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expandedParents[cat.slug] ? "rotate-180" : ""}`} />
                        </button>
                      )}
                    </div>

                    {/* Subcategories */}
                    {cat.subcategories && cat.subcategories.length > 0 && expandedParents[cat.slug] && (
                      <div className="ml-4 mt-1 space-y-1 border-l border-border/40 pl-3">
                        {cat.subcategories.map((subcat) => (
                          <label key={subcat.slug} className={`flex items-center gap-2.5 cursor-pointer group py-1.5 px-2 rounded-md transition-colors ${selectedCategory === subcat.slug ? "bg-primary/8" : "hover:bg-muted/60"}`}>
                            <Checkbox checked={selectedCategory === subcat.slug} onCheckedChange={() => onCategoryChange(selectedCategory === subcat.slug ? "" : subcat.slug)} className="h-3.5 w-3.5 rounded-sm" />
                            <span className={`text-xs transition-colors flex-1 ${selectedCategory === subcat.slug ? "text-primary font-medium" : "text-foreground group-hover:text-primary"}`}>{subcat.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {categories.length > INITIAL_VISIBLE_COUNT && (
                  <button type="button" className="text-xs text-primary hover:text-primary/80 transition-colors font-medium mt-2 pl-2" onClick={() => setShowAllCategories(!showAllCategories)}>
                    {showAllCategories ? t("browseListings.showLess") : `+ ${categories.length - INITIAL_VISIBLE_COUNT} more`}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Bid Status */}
      <div className="py-3 border-b border-border/60">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-foreground">
            {t("browseListings.bidStatus")}
          </span>
          {selectedBidFilter && (
            <button type="button" onClick={() => onBidFilterChange("")} className="text-[10px] text-muted-foreground hover:text-destructive transition-colors">
              {t("browseListings.clear")}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {BID_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleBidClick(opt.id)}
              className={`text-xs font-medium px-2 py-2 rounded-md border transition-all text-center ${
                selectedBidFilter === opt.id ? opt.activeBg : "border-border bg-card hover:bg-muted text-foreground"
              }`}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
        {selectedBidFilter === "custom" && (
          <div className="mt-2.5">
            <input
              type="date"
              value={selectedBidDate}
              onChange={(e) => onBidDateChange(e.target.value)}
              className="w-full h-8 px-2 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary transition-colors"
            />
          </div>
        )}
      </div>

      {/* Country */}
      <div className="py-3 border-b border-border/60">
        <button type="button" onClick={() => setIsCountryExpanded(!isCountryExpanded)} className="flex items-center justify-between w-full text-left py-1 group">
          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {t("browseListings.country")}
          </span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isCountryExpanded ? "rotate-180" : ""}`} />
        </button>
        {isCountryExpanded && (
          <div className="mt-3 space-y-1">
            {COUNTRIES.map((country) => (
              <label key={country.id} className={`flex items-center gap-2.5 cursor-pointer group py-1.5 px-2 rounded-md transition-colors ${selectedCountry === country.id ? "bg-primary/8" : "hover:bg-muted/60"}`}>
                <Checkbox checked={selectedCountry === country.id} onCheckedChange={() => onCountryChange(selectedCountry === country.id ? "" : country.id)} className="h-3.5 w-3.5 rounded-sm" />
                <span className={`text-xs transition-colors flex-1 ${selectedCountry === country.id ? "text-primary font-medium" : "text-foreground group-hover:text-primary"}`}>{country.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Condition */}
      <div className="py-3">
        <button type="button" onClick={() => setIsConditionExpanded(!isConditionExpanded)} className="flex items-center justify-between w-full text-left py-1 group">
          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
            <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
            {t("browseListings.condition")}
          </span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isConditionExpanded ? "rotate-180" : ""}`} />
        </button>
        {isConditionExpanded && (
          <div className="mt-3 space-y-1">
            {CONDITIONS.map((condition) => (
              <label key={condition.id} className={`flex items-center gap-2.5 cursor-pointer group py-1.5 px-2 rounded-md transition-colors ${selectedCondition === condition.id ? "bg-primary/8" : "hover:bg-muted/60"}`}>
                <Checkbox checked={selectedCondition === condition.id} onCheckedChange={() => onConditionChange(selectedCondition === condition.id ? "" : condition.id)} className="h-3.5 w-3.5 rounded-sm" />
                <span className={`text-xs transition-colors flex-1 ${selectedCondition === condition.id ? "text-primary font-medium" : "text-foreground group-hover:text-primary"}`}>{t(condition.nameKey)}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Shell: layout + mobile drawer ───────────────────────────────────────────
const BuyerMarketplaceFilters = (props) => {
  const { t } = useTranslation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const activeCount = [props.selectedCategory, props.selectedCountry, props.selectedCondition, props.selectedBidFilter, props.selectedSearch].filter(Boolean).length;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 flex-shrink-0">
        <div className="sticky top-36 bg-card border border-border rounded-xl p-5 shadow-medium max-h-[calc(100vh-10rem)] overflow-y-auto">
          <FilterPanel {...props} />
        </div>
      </aside>

      {/* Mobile Filter Button */}
      <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
        <Button type="button" onClick={() => setIsMobileOpen(true)} variant="default" size="sm" className="shadow-colored rounded-full px-5">
          <Filter className="h-4 w-4 mr-1.5" />
          {t("browseListings.filters")}
          {activeCount > 0 && (
            <span className="ml-1.5 w-5 h-5 rounded-full bg-primary-foreground/20 text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto shadow-large">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">{t("browseListings.filters")}</h3>
              <button type="button" onClick={() => setIsMobileOpen(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <FilterPanel {...props} />
            <div className="mt-5 pt-4 border-t border-border">
              <Button onClick={() => setIsMobileOpen(false)} variant="default" className="w-full rounded-lg">{t("browseListings.applyFilters")}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BuyerMarketplaceFilters;
