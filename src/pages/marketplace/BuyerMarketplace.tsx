// @ts-nocheck
import { Home, Loader2, Search, ChevronLeft, ChevronRight, AlertCircle, Store } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/common/Header";
import CategoryBar from "@/components/common/CategoryBar";
import { subscribeBuyerEvents } from "@/socket/buyerEvents";
import MarketplaceCardGrid from "@/components/common/MarketplaceCardGrid";

// Batches API
import { useGetBatchesQuery, useGetNetworkBatchesQuery } from "@/rtk/slices/batchApiSlice";
import { SITE_TYPE } from "@/config/site";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useGetMySellerNetworksQuery } from "@/rtk/slices/sellerNetworkSlice";
import BuyerMarketplaceFilters from "@/components/common/BuyerMarketplaceFilters";

// Status colors using design system
const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  live_for_bids: { bg: "bg-success/10", text: "text-success", border: "border-success/20" },
  sold: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/20" },
  inspection_schedule: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20" },
  publish: { bg: "bg-info/10", text: "text-info", border: "border-info/20" },
  inspection_complete: { bg: "bg-success/10", text: "text-success", border: "border-success/20" },
  bid_schedule: { bg: "bg-accent/10", text: "text-accent", border: "border-accent/20" },
  bid_end: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" },
};

const BuyerMarketplace = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const navigate = useNavigate();

  // Pagination, search & filter state
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");

  const selectedOrganization = searchParams.get('org') || 'all';
  const selectedCategory = searchParams.get('category') || '';
  const selectedCountry = searchParams.get('country') || '';
  const selectedCondition = searchParams.get('condition') || '';
  const selectedBidFilter = searchParams.get('bidFilter') || '';
  const selectedBidDate = searchParams.get('bidDate') || '';

  const { data: networkData } = useGetMySellerNetworksQuery({
    status: "active"
  });
  const isNetworkQuery = selectedOrganization !== 'all';



  const organizationOptions = [
    { id: 'all', name: t('browseListings.allOrganizations'), sellerId: null },
    ...(networkData?.success ? networkData.data
      .filter((network: any) => network.status === 'active')
      .map((network: any) => ({
        id: network.main_seller_id.toString(),
        name: network.mainSeller?.display_name || network.mainSeller?.user_email || 'Unknown Organization',
        sellerId: network.main_seller_id
      })) : []
    )
  ];


  // Debounce search input and sync to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== debouncedSearch) {
        setDebouncedSearch(searchQuery);
        const newParams = new URLSearchParams(searchParams);
        if (searchQuery) {
          newParams.set("search", searchQuery);
        } else {
          newParams.delete("search");
        }
        newParams.delete("page");
        setSearchParams(newParams);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearch, searchParams, setSearchParams]);

  // Detect if the search is a pure numeric batch ID
  const searchAsBatchId = debouncedSearch && /^\d+$/.test(debouncedSearch.trim())
    ? parseInt(debouncedSearch.trim(), 10)
    : undefined;

  // Server-side paginated query
  const {
    data: batchData,
    isLoading: isLoadingBatches,
    isFetching,
    isError,
    refetch
  } = useGetBatchesQuery({
    page: currentPage,
    limit: 10,
    search: searchAsBatchId ? undefined : (debouncedSearch || undefined),
    batchId: searchAsBatchId,
    category: selectedCategory || undefined,
    bidFilter: (selectedBidFilter as any) || undefined,
    bidDate: (selectedBidFilter === 'custom' && selectedBidDate) ? selectedBidDate : undefined,
    lang: currentLang,
    type: SITE_TYPE,
  });

  

  // Get pagination info from API response
  const pagination = batchData?.pagination;
  const totalItems = pagination?.totalItems ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const hasNextPage = pagination?.hasNextPage ?? false;
  const hasPrevPage = pagination?.hasPrevPage ?? false;

  const handleOrganizationChange = (orgId: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (orgId === 'all') {
      newSearchParams.delete('org');
    } else {
      newSearchParams.set('org', orgId);
    }
    newSearchParams.delete('page');
    setSearchParams(newSearchParams);
  };

  const handleCategoryChange = (slug: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (slug) {
      newSearchParams.set('category', slug);
    } else {
      newSearchParams.delete('category');
    }
    newSearchParams.delete('page');
    setSearchParams(newSearchParams);
  };

  const handleCountryChange = (country: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (country) {
      newSearchParams.set('country', country);
    } else {
      newSearchParams.delete('country');
    }
    newSearchParams.delete('page');
    setSearchParams(newSearchParams);
  };

  const handleConditionChange = (condition: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (condition) {
      newSearchParams.set('condition', condition);
    } else {
      newSearchParams.delete('condition');
    }
    newSearchParams.delete('page');
    setSearchParams(newSearchParams);
  };

  const handleBidFilterChange = (filter: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (filter) {
      newSearchParams.set('bidFilter', filter);
      if (filter !== 'custom') newSearchParams.delete('bidDate');
    } else {
      newSearchParams.delete('bidFilter');
      newSearchParams.delete('bidDate');
    }
    newSearchParams.delete('page');
    setSearchParams(newSearchParams);
  };

  const handleBidDateChange = (date: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (date) {
      newSearchParams.set('bidDate', date);
    } else {
      newSearchParams.delete('bidDate');
    }
    newSearchParams.delete('page');
    setSearchParams(newSearchParams);
  };

  const handleClearAllFilters = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('category');
    newSearchParams.delete('country');
    newSearchParams.delete('condition');
    newSearchParams.delete('bidFilter');
    newSearchParams.delete('bidDate');
    newSearchParams.delete('search');
    newSearchParams.delete('page');
    setSearchParams(newSearchParams);
    setSearchQuery("");
    setDebouncedSearch("");
  };


  const networkQuery = useGetNetworkBatchesQuery({
    type: SITE_TYPE,
    page: currentPage,
    limit: 12,
    user_id: localStorage.getItem("userId"),
    main_seller_id: selectedOrganization,
    search: debouncedSearch || undefined,
    category: selectedCategory || undefined,
  }, { skip: !isNetworkQuery });





  // Helper function to get meta value
  const getMetaValue = (meta: any[], key: string) => {
    const metaItem = meta?.find(m => m.meta_key === key);
    return metaItem?.meta_value || "";
  };

  // Transform network data for display
  const networkListings = useMemo(() =>
    networkQuery.data?.data?.products?.map((product: any) => ({
      id: product.product_id,
      slug: product.slug, // Add slug for navigation
      date: new Date().toISOString(),
      productCount: 1,
      title: product.title,
      description: product.description,
      
      category: product.categories?.[0]?.term || "N/A",
      askingPrice: `$${getMetaValue(product.meta, "_price") || "0"}`,
      inspectionDate: null,
      status: product.status || "publish",
      bid_start_date: null,
      bid_end_date: null,
      city: getMetaValue(product.meta, "_location") || "N/A",
    })) || []
    , [networkQuery.data?.data?.products]);

  // Transform API → UI with useMemo for performance
  // Keep all batches, but we can control which statuses are visible to buyers in the UI
  const listings = useMemo(
    () =>
      batchData?.data?.map((batch: any) => ({
        id: batch.batchId,
        date: batch.batchDate,
        productCount: batch.itemsCount,
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
        inspectionDate: batch.inspectionBidDate,
        status: batch.status,
        bid_start_date: batch.bid_start_date,
        bid_end_date: batch.bid_end_date,
        city: "N/A",
        image: batch.firstProductImages?.[0] || null,
        images: batch.firstProductImages || [],
        firstProductId: batch.firstProductId || null,
        country: batch.country || null,
        bid_type: batch.bid_type || null,
        target_price: batch.target_price || null,
        currency: batch.currency || null,
      })) || [],
    [batchData?.data]
  );

  // Use network data when organization is selected, otherwise use batch data
  const displayListings = isNetworkQuery ? networkListings : listings;
  const displayPagination = isNetworkQuery ? networkQuery.data?.data?.pagination : pagination;
  const displayTotalItems = displayPagination?.totalItems ?? 0;
  const displayTotalPages = displayPagination?.totalPages ?? 1;
  const displayHasNextPage = displayPagination?.hasNextPage ?? false;
  const displayHasPrevPage = displayPagination?.hasPrevPage ?? false;
  const displayIsLoading = isNetworkQuery ? networkQuery.isLoading : isLoadingBatches;
  const displayIsFetching = isNetworkQuery ? networkQuery.isFetching : isFetching;
  const displayIsError = isNetworkQuery ? networkQuery.isError : isError;

  // Handle row click navigation
  const handleRowClick = (item: any) => {
    if (isNetworkQuery) {
      // For network listings, navigate to BrowserListingDetail with slug
      navigate(`/buyer-marketplace/details/${item.slug}`);
    } else {
      // For regular batch listings, navigate to ListingDetail with ID
      navigate(`/buyer-marketplace/${item.id}`);
    }
  };

  // Get dynamic status based on bid dates
  const getDynamicStatus = useCallback((item: any) => {
    if (item.bid_start_date === null || item?.status !== "live_for_bids")
      return item.status;
    const today = new Date();
    const startDate = new Date(item.bid_start_date);
    const endDate = new Date(item.bid_end_date);

    if (startDate <= today && today <= endDate) {
      return "live_for_bids"; // Currently live
    } else if (today <= startDate) {
      return "bid_schedule"; // Scheduled for future
    } else if (today >= endDate) {
      return "bid_end"; // Keep original status after end
    } else {
      return item.status;
    }
  }, []);

  // Generate page numbers for pagination UI
  const generatePageNumbers = useCallback(() => {
    const pages: (number | string)[] = [];
    const total = displayTotalPages;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", total);
      } else if (currentPage >= total - 2) {
        pages.push(1, "...", total - 3, total - 2, total - 1, total);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", total);
      }
    }

    return pages;
  }, [displayTotalPages, currentPage]);

  // Pagination handler with scroll to top
  const handlePageChange = useCallback((page: number) => {
    const newParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newParams.delete("page");
    } else {
      newParams.set("page", String(page));
    }
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, setSearchParams]);

  // // Socket listener with proper cleanup
  // useEffect(() => {
  //   const socket = getSocket();
  //   socket.on("notification_created", handleNotificationm);

  //   return () => {
  //     socket.off("notification_created", handleNotification);
  //   };
  // }, []);

  // Subscribe to buyer events
  useEffect(() => {
    const unsub = subscribeBuyerEvents(() => {
      refetch();
    });

    return unsub;
  }, [refetch]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Category Bar */}
      <CategoryBar
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
      />

      {/* Breadcrumb — Surplex style */}
      <div className="container mx-auto px-4 pt-3 pb-0">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Home className="w-3.5 h-3.5" />
          <span className="text-muted-foreground/40">/</span>
          <span
            className="hover:text-primary cursor-pointer transition-colors hover:underline"
            onClick={() => navigate("/buyer-marketplace")}
          >
            All auctions
          </span>
          {selectedCategory && (
            <>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-foreground font-medium capitalize">
                {selectedCategory.replace(/-/g, " ")}
              </span>
            </>
          )}
          {debouncedSearch && (
            <>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-foreground font-medium">
                "{debouncedSearch}"
              </span>
            </>
          )}
        </nav>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search + Organization row */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            {/* Search */}
            <div className="flex-1 relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder={t("buyer.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-card border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Organization filter */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Label htmlFor="organization-select" className="text-sm font-medium whitespace-nowrap text-muted-foreground">
                {t('browseListings.organizationLabel')}
              </Label>
              <Select value={selectedOrganization} onValueChange={handleOrganizationChange}>
                <SelectTrigger id="organization-select" className="w-52 h-11 rounded-lg">
                  <SelectValue placeholder={t('browseListings.selectOrganization')} />
                </SelectTrigger>
                <SelectContent>
                  {organizationOptions.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filters strip */}
          {(selectedCategory || selectedCountry || selectedCondition || selectedBidFilter) && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-xs text-muted-foreground">{t("buyer.active")}:</span>
              {selectedCategory && (
                <Badge
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors rounded-full px-3"
                  onClick={() => handleCategoryChange("")}
                >
                  {selectedCategory} ×
                </Badge>
              )}
              {selectedCountry && (
                <Badge
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors rounded-full px-3"
                  onClick={() => handleCountryChange("")}
                >
                  {selectedCountry} ×
                </Badge>
              )}
              {selectedCondition && (
                <Badge
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors rounded-full px-3"
                  onClick={() => handleConditionChange("")}
                >
                  {selectedCondition} ×
                </Badge>
              )}
              {selectedBidFilter && (
                <Badge
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors rounded-full px-3"
                  onClick={() => handleBidFilterChange("")}
                >
                  {selectedBidFilter === "closing_soon" ? t("browseListings.closingSoon") : selectedBidFilter === "upcoming" ? t("browseListings.upcoming") : selectedBidFilter === "ended" ? t("browseListings.ended") : selectedBidDate ? `${selectedBidDate}` : t("browseListings.customDate")} ×
                </Badge>
              )}
            </div>
          )}
        </div>
        {/* Main layout: sidebar + content */}
        <div className="flex gap-6">
          {/* Filter Sidebar */}
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

          {/* Right-side content */}
          <div className="flex-1 min-w-0">
            {/* Loading + Error */}
            {displayIsLoading && (
              <div className="flex justify-center items-center py-20">
                <div className="text-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto" />
                  <p className="text-muted-foreground">{t("buyer.loadingListings")}</p>
                </div>
              </div>
            )}

            {displayIsError && (
              <Card className="border-destructive/20 bg-destructive/5">
                <div className="p-8 text-center space-y-4">
                  <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                  <p className="text-destructive font-medium text-lg">{t("buyer.loadingError")}</p>
                  <p className="text-muted-foreground">{t("buyer.tryRefresh")}</p>
                </div>
              </Card>
            )}

        {/* Card Grid */}
        {!displayIsLoading && !displayIsError && (
          <div className="relative">
            {/* Loading overlay for pagination */}
            {displayIsFetching && !displayIsLoading && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10 rounded">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" />
                {t("buyer.available")}
              </h2>
              <span className="text-sm text-muted-foreground font-medium">{displayTotalItems} {t("buyer.results")}</span>
            </div>

            <MarketplaceCardGrid
              listings={displayListings}
              onItemClick={handleRowClick}
              getDynamicStatus={getDynamicStatus}
            />

            {/* Pagination */}
            {displayTotalPages > 1 && (
              <div className="flex items-center justify-between py-6 mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {displayTotalPages} ({displayTotalItems} items)
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!displayHasPrevPage || displayIsFetching}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="h-9 w-9 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {generatePageNumbers().map((p, i) =>
                    p === "..." ? (
                      <span key={i} className="px-3 py-2 text-muted-foreground">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={p}
                        variant={currentPage === p ? "default" : "outline"}
                        size="sm"
                        disabled={displayIsFetching}
                        onClick={() => handlePageChange(p as number)}
                        className="h-9 min-w-9"
                      >
                        {p}
                      </Button>
                    )
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!displayHasNextPage || displayIsFetching}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="h-9 w-9 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

            {/* No results */}
            {displayListings.length === 0 && !displayIsLoading && !displayIsError && (
              <Card className="border-0 shadow-medium">
                <div className="text-center py-16 space-y-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                    <Store className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{t("buyer.noListingsFound")}</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || selectedCategory
                      ? t("buyer.adjustFilters")
                      : t("buyer.noListingsAvailable")}
                  </p>
                </div>
              </Card>
            )}
          </div>{/* end flex-1 */}
        </div>{/* end flex gap-6 */}
      </div>



    </div>
  );
};

export default BuyerMarketplace;
