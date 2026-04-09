// @ts-nocheck
import { useCallback, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, Search, Home, Store, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useGetBatchesQuery } from "@/rtk/slices/batchApiSlice";
import { SITE_TYPE } from "@/config/site";
import Header from "@/components/common/Header";
import CategoryBar from "@/components/common/CategoryBar";
import BuyerMarketplaceFilters from "@/components/common/BuyerMarketplaceFilters";
import MarketplaceCardGrid from "@/components/common/MarketplaceCardGrid";
import { useCategoryCache } from "@/hooks/useCategoryCache";
import SEOMeta from "@/components/common/SEOMeta";
import { useLanguageAwareCategories } from "@/hooks/useLanguageAwareCategories";

// ✨ Smoothness - skeleton loaders
import { ProductCardSkeleton } from "@/components/common/Skeletons";

const Marketplace = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const navigate = useNavigate();
  const categoryCache = useCategoryCache();
  const { data: labCategories } = useLanguageAwareCategories();

  // URL-synced state
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");

  const selectedCategory = searchParams.get("category") || "";
  const selectedCountry = searchParams.get("country") || "";
  const selectedCondition = searchParams.get("condition") || "";
  const selectedBidFilter = searchParams.get("bidFilter") || "";
  const selectedBidDate = searchParams.get("bidDate") || "";
  const selectedStatus = searchParams.get("status") || undefined;
  const selectedHighlighted = searchParams.get("highlighted") === "true" ? true : undefined;
  const selectedGroup = searchParams.get("group") || "";

  // Sync searchQuery and debouncedSearch when URL search parameter changes
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    setSearchQuery(urlSearch);
    setDebouncedSearch(urlSearch);
  }, [searchParams.get("search")]);

  // Debounce search and sync to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== debouncedSearch) {
        setDebouncedSearch(searchQuery);
        const newParams = new URLSearchParams(searchParams);
        if (searchQuery) newParams.set("search", searchQuery);
        else newParams.delete("search");
        newParams.delete("page");
        setSearchParams(newParams);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearch, searchParams, setSearchParams]);

  const handleCategoryChange = (slug: string) => {
    const p = new URLSearchParams(searchParams);
    if (slug) p.set("category", slug); else p.delete("category");
    p.delete("page");
    setSearchParams(p);
  };

  const handleCountryChange = (country: string) => {
    const p = new URLSearchParams(searchParams);
    if (country) p.set("country", country); else p.delete("country");
    p.delete("page");
    setSearchParams(p);
  };

  const handleConditionChange = (condition: string) => {
    const p = new URLSearchParams(searchParams);
    if (condition) p.set("condition", condition); else p.delete("condition");
    p.delete("page");
    setSearchParams(p);
  };

  const handleBidFilterChange = (filter: string) => {
    const p = new URLSearchParams(searchParams);
    if (filter) {
      p.set("bidFilter", filter);
      if (filter !== "custom") p.delete("bidDate");
    } else {
      p.delete("bidFilter");
      p.delete("bidDate");
    }
    p.delete("page");
    setSearchParams(p);
  };

  const handleBidDateChange = (date: string) => {
    const p = new URLSearchParams(searchParams);
    if (date) p.set("bidDate", date); else p.delete("bidDate");
    p.delete("page");
    setSearchParams(p);
  };

  const handleGroupChange = (group: string) => {
    const p = new URLSearchParams(searchParams);
    if (group) p.set("group", group); else p.delete("group");
    p.delete("page");
    setSearchParams(p);
  };

  const handleClearAllFilters = () => {
    const p = new URLSearchParams(searchParams);
    p.delete("category");
    p.delete("country");
    p.delete("condition");
    p.delete("bidFilter");
    p.delete("bidDate");
    p.delete("search");
    p.delete("group");
    p.delete("page");
    setSearchParams(p);
    setSearchQuery("");
    setDebouncedSearch("");
  };

  const handlePageChange = useCallback((page: number) => {
    const p = new URLSearchParams(searchParams);
    if (page === 1) p.delete("page"); else p.set("page", String(page));
    setSearchParams(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [searchParams, setSearchParams]);

  // Detect pure numeric batch ID
  const searchAsBatchId = debouncedSearch && /^\d+$/.test(debouncedSearch.trim())
    ? parseInt(debouncedSearch.trim(), 10)
    : undefined;

  /**
   * Resolve the URL category slug → the value(s) the backend understands.
   *
   * Products are stored by term_id in the backend. Some products may be stored
   * with the PARENT term_id, others with the SUBCATEGORY term_id. To cover both:
   *  - Subcategory selected → send subcategory slug + subcategory id + parent id
   *  - Parent selected → send parent slug + parent id (backend does hierarchical WP lookup)
   *
   * We pass the numeric id as the primary `category` param, and the parent id
   * as `parentCategoryId` so the backend can OR-match either level.
   */
  const resolvedCategory = useMemo(() => {
    if (!selectedCategory) return { category: undefined, parentCategoryId: undefined };
    const cats = Array.isArray(labCategories) ? labCategories : [];

    // Check parent categories
    const parentMatch = cats.find((c) => c.slug === selectedCategory);
    if (parentMatch) {
      return {
        category: String(parentMatch.id),   // numeric id — more reliable than slug
        parentCategoryId: undefined,
      };
    }

    // Check subcategories
    for (const parent of cats) {
      const subMatch = (parent.subcategories ?? []).find((s) => s.slug === selectedCategory);
      if (subMatch) {
        return {
          category: String(subMatch.id),          // subcategory numeric id
          parentCategoryId: String(parent.id),    // parent id — for products stored at parent level
        };
      }
    }

    // Not found — pass the slug as-is (legacy/fallback)
    return { category: selectedCategory, parentCategoryId: undefined };
  }, [selectedCategory, labCategories]);

  // Fetch batches
  const { data: batchData, isLoading, isFetching, isError, refetch } = useGetBatchesQuery({
    page: currentPage,
    limit: 12,
    search: searchAsBatchId ? undefined : (debouncedSearch || undefined),
    batchId: searchAsBatchId,
    category: resolvedCategory.category,
    parentCategoryId: resolvedCategory.parentCategoryId,
    status: selectedStatus,
    highlighted: selectedHighlighted,
    bidFilter: (selectedBidFilter as any) || undefined,
    bidDate: (selectedBidFilter === "custom" && selectedBidDate) ? selectedBidDate : undefined,
    lang: currentLang,
    type: SITE_TYPE,
    country: selectedCountry || undefined,
    condition: selectedCondition || undefined,
    auctionGroup: selectedGroup && selectedGroup !== '' ? selectedGroup : undefined,
  });

  // Ensure data is fetched when page loads with URL search parameters OR when they change
  useEffect(() => {
    const hasSearchParams = searchParams.get("search") || searchParams.get("category") ||
                            searchParams.get("country") || searchParams.get("condition") ||
                            searchParams.get("bidFilter") || searchParams.get("group");
    if (hasSearchParams) {
      refetch();
    }
  }, [searchParams, refetch]);

  const pagination = batchData?.pagination;
  const totalItems = pagination?.totalItems ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const hasNextPage = pagination?.hasNextPage ?? false;
  const hasPrevPage = pagination?.hasPrevPage ?? false;

  // Compute dynamic bid status from dates (same logic as details page)
  const computeDynamicStatus = (batch: any): string => {
    const now = Date.now();
    if (batch.bid_start_date && batch.bid_end_date) {
      const start = new Date(batch.bid_start_date).getTime();
      const end = new Date(batch.bid_end_date).getTime();
      if (now >= start && now <= end) return "live";
      if (now < start) return "upcoming";
      if (now > end) return "ended";
    }
    return batch.status || "none";
  };

  // Transform API data for MarketplaceCardGrid
  const listings = useMemo(
    () =>
      batchData?.data?.map((batch: any) => {
        const dynamicStatus = computeDynamicStatus(batch);
        return {
          id: batch.batchId,
          batch_id: batch.batchId,
          title: batch.title,
          description: batch.description,
          title_en: batch.title_en,
          title_zh: batch.title_zh,
          title_ja: batch.title_ja,
          title_th: batch.title_th,
          description_en: batch.description_en,
          description_zh: batch.description_zh,
          description_ja: batch.description_ja,
          description_th: batch.description_th,
          category: batch.category,
          askingPrice: `$${batch.value}`,
          status: batch.status,
          dynamicStatus,
          bid_start_date: batch.bid_start_date || null,
          bid_end_date: batch.bid_end_date || null,
          bids: batch.bids ?? 0,
          productCount: batch.itemsCount,
          city: "N/A",
          image: batch.firstProductImages?.[0] || null,
          images: batch.firstProductImages || [],
          firstProductId: batch.firstProductId || null,
          country: batch.country || null,
          condition: batch.condition || null,
          bid_type: batch.bid_type || null,
          target_price: batch.target_price || null,
          currency: batch.currency || null,
        };
      }) || [],
    [batchData?.data]
  );

  const handleItemClick = (item: any) => {
    navigate(`/buyer-marketplace/${item.id}`);
  };

  // Pagination page numbers
  const generatePageNumbers = useCallback(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  }, [totalPages, currentPage]);

  const hasActiveFilter = selectedCategory || selectedCountry || selectedCondition || selectedBidFilter || selectedGroup;

  const pageTitle = searchQuery
    ? `Buy ${searchQuery} - GreenBidz Marketplace`
    : "Industrial Equipment Marketplace - GreenBidz";
  const pageDescription = searchQuery
    ? `Browse and buy quality ${searchQuery} on GreenBidz. Connect with trusted sellers of industrial equipment and machinery.`
    : "Discover industrial equipment, machinery, and recyclable materials from verified sellers worldwide on GreenBidz.";

  return (
    <div className="min-h-screen bg-background">
      <SEOMeta
        title={pageTitle}
        description={pageDescription}
        keywords="buy equipment, marketplace, industrial equipment, machinery, sellers, equipment for sale"
        type="website"
      />
      <Header />

      {/* <CategoryBar
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
      /> */}

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 pt-3 pb-0">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Home className="w-3.5 h-3.5 text-muted-foreground/70" />
          <span className="text-muted-foreground/40">/</span>
          <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => handleCategoryChange("")}>
            Categories
          </span>
          {selectedCategory && (
            <>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-primary font-medium capitalize">{selectedCategory.replace(/-/g, " ")}</span>
            </>
          )}
        </nav>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search row */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <div className="flex-1 relative group max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder={t("buyer.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-card border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
            {!isLoading && (
              <span className="text-sm text-muted-foreground font-medium flex-shrink-0">
                {totalItems} {t("buyer.results")}
              </span>
            )}
          </div>

          {/* Active filters strip */}
          {hasActiveFilter && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-xs text-muted-foreground">{t("buyer.active")}:</span>
              {selectedCategory && (
                <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors rounded-full px-3" onClick={() => handleCategoryChange("")}>
                  {selectedCategory} ×
                </Badge>
              )}
              {selectedCountry && (
                <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors rounded-full px-3" onClick={() => handleCountryChange("")}>
                  {selectedCountry} ×
                </Badge>
              )}
              {selectedCondition && (
                <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors rounded-full px-3" onClick={() => handleConditionChange("")}>
                  {selectedCondition} ×
                </Badge>
              )}
              {selectedBidFilter && (
                <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors rounded-full px-3" onClick={() => handleBidFilterChange("")}>
                  {selectedBidFilter === "closing_soon" ? t("browseListings.closingSoon") : selectedBidFilter === "upcoming" ? t("browseListings.upcoming") : selectedBidFilter === "ended" ? t("browseListings.ended") : selectedBidDate ? selectedBidDate : t("browseListings.customDate")} ×
                </Badge>
              )}
              {selectedGroup && (
                <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors rounded-full px-3" onClick={() => handleGroupChange("")}>
                  Auction Group ×
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Sidebar + content */}
        <div className="flex gap-6">
          <BuyerMarketplaceFilters
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            selectedCountry={selectedCountry}
            onCountryChange={handleCountryChange}
            selectedCondition={selectedCondition}
            onConditionChange={handleConditionChange}
            selectedBidFilter={selectedBidFilter}
            onBidFilterChange={handleBidFilterChange}
            selectedBidDate={selectedBidDate}
            onBidDateChange={handleBidDateChange}
            selectedSearch={debouncedSearch}
            onClearAll={handleClearAllFilters}
          />

          <div className="flex-1 min-w-0">
            {/* Auction Group Details Header */}
            {selectedGroup && batchData?.auctionGroup && (
              <div className="mb-6 p-4 border border-border rounded-lg bg-card">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {batchData.auctionGroup.title}
                </h1>
                <p className="text-muted-foreground mb-4">
                  {batchData.auctionGroup.description}
                </p>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <span className="text-primary">{totalItems} {totalItems === 1 ? 'lot' : 'lots'}</span>
                </div>
              </div>
            )}

            {/* Loading - Skeleton */}
            {isLoading && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Store className="w-4 h-4 text-primary" />
                    Loading listings...
                  </h2>
                </div>
                <ProductCardSkeleton count={12} />
              </div>
            )}

            {/* Error */}
            {isError && (
              <Card className="border-destructive/20 bg-destructive/5">
                <div className="p-8 text-center space-y-4">
                  <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                  <p className="text-destructive font-medium text-lg">Failed to load marketplace listings.</p>
                </div>
              </Card>
            )}

            {/* Grid */}
            {!isLoading && !isError && (
              <div className="relative">
                {isFetching && !isLoading && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10 rounded">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Store className="w-4 h-4 text-primary" />
                    {t("buyer.available")}
                  </h2>
                  <span className="text-sm text-muted-foreground font-medium">{totalItems} results</span>
                </div>

                <MarketplaceCardGrid
                  listings={listings}
                  onItemClick={handleItemClick}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between py-6 mt-4">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages} ({totalItems} items)
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled={!hasPrevPage || isFetching} onClick={() => handlePageChange(currentPage - 1)} className="h-9 w-9 p-0">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {generatePageNumbers().map((p, i) =>
                        p === "..." ? (
                          <span key={i} className="px-3 py-2 text-muted-foreground">...</span>
                        ) : (
                          <Button key={p} variant={currentPage === p ? "default" : "outline"} size="sm" disabled={isFetching} onClick={() => handlePageChange(p as number)} className="h-9 min-w-9">
                            {p}
                          </Button>
                        )
                      )}
                      <Button variant="outline" size="sm" disabled={!hasNextPage || isFetching} onClick={() => handlePageChange(currentPage + 1)} className="h-9 w-9 p-0">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* No results */}
                {listings.length === 0 && (
                  <Card className="border-0 shadow-medium">
                    <div className="text-center py-16 space-y-4">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                        <Store className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">No listings found</h3>
                      <p className="text-muted-foreground">
                        {searchQuery || selectedCategory ? "Try adjusting your search or filter criteria" : "There are currently no batches available"}
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
