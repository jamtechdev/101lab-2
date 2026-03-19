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
import Header from "@/components/common/Header";
import CategoryBar from "@/components/common/CategoryBar";
import BuyerMarketplaceFilters from "@/components/common/BuyerMarketplaceFilters";
import MarketplaceCardGrid from "@/components/common/MarketplaceCardGrid";

const Marketplace = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const navigate = useNavigate();

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

  const handleClearAllFilters = () => {
    const p = new URLSearchParams(searchParams);
    p.delete("category");
    p.delete("country");
    p.delete("condition");
    p.delete("bidFilter");
    p.delete("bidDate");
    p.delete("search");
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

  // Fetch batches
  const { data: batchData, isLoading, isFetching, isError } = useGetBatchesQuery({
    page: currentPage,
    limit: 12,
    search: searchAsBatchId ? undefined : (debouncedSearch || undefined),
    batchId: searchAsBatchId,
    category: selectedCategory || undefined,
    status: selectedStatus,
    highlighted: selectedHighlighted,
    bidFilter: (selectedBidFilter as any) || undefined,
    bidDate: (selectedBidFilter === "custom" && selectedBidDate) ? selectedBidDate : undefined,
    lang: currentLang,
  });

  const pagination = batchData?.pagination;
  const totalItems = pagination?.totalItems ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const hasNextPage = pagination?.hasNextPage ?? false;
  const hasPrevPage = pagination?.hasPrevPage ?? false;

  // Transform API data for MarketplaceCardGrid
  const listings = useMemo(
    () =>
      batchData?.data?.map((batch: any) => ({
        id: batch.batchId,
        batch_id: batch.batchId,
        title: batch.title,
        description: batch.description,
        category: batch.category,
        askingPrice: `$${batch.value}`,
        status: batch.status,
        bid_start_date: batch.bid_start_date || null,
        bid_end_date: batch.bid_end_date || null,
        bids: batch.bids ?? 0,
        productCount: batch.itemsCount,
        city: "N/A",
        image: batch.firstProductImages?.[0] || null,
        images: batch.firstProductImages || [],
      })) || [],
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

  const hasActiveFilter = selectedCategory || selectedCountry || selectedCondition || selectedBidFilter;

  return (
    <div className="min-h-screen bg-background">
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
            {/* Loading */}
            {isLoading && (
              <div className="flex justify-center items-center py-20">
                <div className="text-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto" />
                  <p className="text-muted-foreground">Loading marketplace listings...</p>
                </div>
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
