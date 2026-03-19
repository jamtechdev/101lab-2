import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, Search, ChevronLeft, ChevronRight, AlertCircle, Store } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useGetBatchesQuery, useGetNetworkBatchesQuery } from "@/rtk/slices/batchApiSlice";
import { useGetMySellerNetworksQuery } from "@/rtk/slices/sellerNetworkSlice";
import { SITE_TYPE } from "@/config/site";
import { subscribeBuyerEvents } from "@/socket/buyerEvents";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import MarketplaceCardGrid from "@/components/common/MarketplaceCardGrid";

const SellerMarketplace = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedOrganization = searchParams.get("org") || "all";

  const { data: networkData } = useGetMySellerNetworksQuery({ status: "active" });
  const isNetworkQuery = selectedOrganization !== "all";

  const organizationOptions = [
    { id: "all", name: t("browseListings.allOrganizations"), sellerId: null },
    ...(networkData?.success
      ? networkData.data
          .filter((n: any) => n.status === "active")
          .map((n: any) => ({
            id: n.main_seller_id.toString(),
            name: n.mainSeller?.display_name || n.mainSeller?.user_email || "Unknown",
            sellerId: n.main_seller_id,
          }))
      : []),
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== debouncedSearch) {
        setDebouncedSearch(searchQuery);
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearch]);

  const { data: batchData, isLoading: isLoadingBatches, isFetching, isError, refetch } = useGetBatchesQuery({
    page: currentPage,
    limit: 12,
    search: debouncedSearch || undefined,
  });

  const pagination = batchData?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const hasNextPage = pagination?.hasNextPage ?? false;
  const hasPrevPage = pagination?.hasPrevPage ?? false;

  const handleOrganizationChange = (orgId: string) => {
    const params = new URLSearchParams(searchParams);
    orgId === "all" ? params.delete("org") : params.set("org", orgId);
    setSearchParams(params);
    setCurrentPage(1);
  };

  const networkQuery = useGetNetworkBatchesQuery(
    {
      type: SITE_TYPE,
      page: currentPage,
      limit: 12,
      user_id: localStorage.getItem("userId"),
      main_seller_id: selectedOrganization,
    },
    { skip: !isNetworkQuery }
  );

  const getMetaValue = (meta: any[], key: string) =>
    meta?.find((m) => m.meta_key === key)?.meta_value || "";

  const networkListings = useMemo(
    () =>
      networkQuery.data?.data?.products?.map((p: any) => ({
        id: p.product_id,
        slug: p.slug,
        date: new Date().toISOString(),
        productCount: 1,
        title: p.title,
        description: p.description,
        category: p.categories?.[0]?.term || "N/A",
        askingPrice: `$${getMetaValue(p.meta, "_price") || "0"}`,
        inspectionDate: null,
        status: p.status || "publish",
        bid_start_date: null,
        bid_end_date: null,
        city: getMetaValue(p.meta, "_location") || "N/A",
      })) || [],
    [networkQuery.data?.data?.products]
  );

  const listings = useMemo(
    () =>
      batchData?.data?.map((batch: any) => ({
        id: batch.batchId,
        date: batch.batchDate,
        productCount: batch.itemsCount,
        title: batch.title,
        description: batch.description,
        category: batch.category,
        askingPrice: `$${batch.value}`,
        inspectionDate: batch.inspectionBidDate,
        status: batch.status,
        bid_start_date: batch.bid_start_date,
        bid_end_date: batch.bid_end_date,
        city: "N/A",
        image: batch.firstProductImages?.[0] || null,
      })) || [],
    [batchData?.data]
  );

  const displayListings = isNetworkQuery ? networkListings : listings;
  const displayPagination = isNetworkQuery ? networkQuery.data?.data?.pagination : pagination;
  const displayTotalItems = displayPagination?.totalItems ?? 0;
  const displayTotalPages = displayPagination?.totalPages ?? 1;
  const displayHasNextPage = displayPagination?.hasNextPage ?? false;
  const displayHasPrevPage = displayPagination?.hasPrevPage ?? false;
  const displayIsLoading = isNetworkQuery ? networkQuery.isLoading : isLoadingBatches;
  const displayIsFetching = isNetworkQuery ? networkQuery.isFetching : isFetching;
  const displayIsError = isNetworkQuery ? networkQuery.isError : isError;

  const handleRowClick = (item: any) => {
    if (isNetworkQuery) {
      navigate(`/dashboard/marketplace/details/${item.slug}`);
    } else {
      navigate(`/dashboard/marketplace/${item.id}`);
    }
  };

  const getDynamicStatus = useCallback((item: any) => {
    if (item.bid_start_date === null || item?.status !== "live_for_bids") return item.status;
    const today = new Date();
    const startDate = new Date(item.bid_start_date);
    const endDate = new Date(item.bid_end_date);
    if (startDate <= today && today <= endDate) return "live_for_bids";
    else if (today <= startDate) return "bid_schedule";
    else if (today >= endDate) return "bid_end";
    return item.status;
  }, []);

  const generatePageNumbers = useCallback(() => {
    const pages: (number | string)[] = [];
    if (displayTotalPages <= 7) {
      for (let i = 1; i <= displayTotalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) pages.push(1, 2, 3, 4, "...", displayTotalPages);
      else if (currentPage >= displayTotalPages - 2)
        pages.push(1, "...", displayTotalPages - 3, displayTotalPages - 2, displayTotalPages - 1, displayTotalPages);
      else
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", displayTotalPages);
    }
    return pages;
  }, [displayTotalPages, currentPage]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const unsub = subscribeBuyerEvents(() => { refetch(); });
    return unsub;
  }, [refetch]);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">
            {t("buyer.marketplace")}
          </h1>
          <span className="text-sm text-muted-foreground">{displayTotalItems} lots</span>
        </div>

        {/* Search + Org filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder={t("buyer.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 h-10 text-sm border border-border rounded bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="org-select" className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              {t("browseListings.organizationLabel")}
            </Label>
            <Select value={selectedOrganization} onValueChange={handleOrganizationChange}>
              <SelectTrigger id="org-select" className="w-52 h-10 text-sm">
                <SelectValue placeholder={t("browseListings.selectOrganization")} />
              </SelectTrigger>
              <SelectContent>
                {organizationOptions.map((org) => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading */}
        {displayIsLoading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error */}
        {displayIsError && (
          <Card className="border-destructive/20 bg-destructive/5 p-8 text-center">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <p className="text-destructive font-medium">Failed to load marketplace listings.</p>
          </Card>
        )}

        {/* Card Grid */}
        {!displayIsLoading && !displayIsError && (
          <div className="relative">
            {displayIsFetching && !displayIsLoading && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10 rounded">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            <MarketplaceCardGrid
              listings={displayListings}
              onItemClick={handleRowClick}
              getDynamicStatus={getDynamicStatus}
            />

            {/* Pagination */}
            {displayTotalPages > 1 && (
              <div className="flex items-center justify-between py-4 mt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {displayTotalPages}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" disabled={!displayHasPrevPage || displayIsFetching} onClick={() => handlePageChange(currentPage - 1)} className="h-8 w-8 p-0">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {generatePageNumbers().map((p, i) =>
                    p === "..." ? (
                      <span key={`e-${i}`} className="px-2 text-muted-foreground text-sm">...</span>
                    ) : (
                      <Button key={`p-${i}`} variant={currentPage === p ? "default" : "outline"} size="sm" disabled={displayIsFetching} onClick={() => handlePageChange(p as number)} className="h-8 min-w-8 text-xs">
                        {p}
                      </Button>
                    )
                  )}
                  <Button variant="outline" size="sm" disabled={!displayHasNextPage || displayIsFetching} onClick={() => handlePageChange(currentPage + 1)} className="h-8 w-8 p-0">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty */}
        {displayListings.length === 0 && !displayIsLoading && !displayIsError && (
          <div className="text-center py-16">
            <Store className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground">No listings found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? "Try adjusting your search criteria" : "There are currently no batches available"}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SellerMarketplace;
