import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const { RangePicker } = DatePicker;
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Package,
  CheckCircle2,
  Clock,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Building2,
  Users,
  DollarSign,
  Image as ImageIcon,
  Eye,
  Trash2,
  Filter,
  X,
  Sparkles,
  CheckCircle,
  Percent,
  MapPin,
} from "lucide-react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useGetAdminBatchesQuery,
  useDeleteBatchMutation,
  useApproveBatchMutation,
  BatchItem,
} from "@/rtk/slices/adminApiSlice";
import { SITE_TYPE } from "@/config/site";
import { confirmDelete } from "@/helper/sweetAlertNotification";
import { toastDeleted, toastError, toastSuccess } from "@/helper/toasterNotification";
import AdminHeader from "./AdminHeader";
import { subscribeAdminEvents } from '@/socket/adminEvent'

// ---------------- Pagination Component ----------------
const Pagination = ({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) => {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  const startPage = Math.max(2, page - 1);
  const endPage = Math.min(totalPages - 1, page + 1);

  pages.push(1);
  if (startPage > 2) pages.push("...");
  for (let i = startPage; i <= endPage; i++) pages.push(i);
  if (endPage < totalPages - 1) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="h-9 w-9 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {pages.map((p, idx) => (
        <Button
          key={idx}
          variant={p === page ? "default" : "outline"}
          size="sm"
          className={`h-9 min-w-9 ${p === "..." ? "cursor-default hover:bg-transparent" : ""}`}
          disabled={p === "..."}
          onClick={() => typeof p === "number" && onPageChange(p)}
        >
          {p}
        </Button>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="h-9 w-9 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

// ---------------- Dynamic Status Function ----------------
const getDynamicStatus = (item: BatchItem): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  color: string;
} => {
  if (item.status === "live_for_bids") {
    const bid = item.bid;
    if (!bid) return { label: "Live for Bids", variant: "default", color: "bg-green-500" };

    const today = new Date();
    const startDate = new Date(bid.start_date);
    const endDate = new Date(bid.end_date);

    if (today < startDate)
      return { label: "Scheduled", variant: "secondary", color: "bg-blue-500" };
    if (today >= startDate && today <= endDate)
      return { label: "Live for Bids", variant: "default", color: "bg-green-500" };
    if (today > endDate) return { label: "Ended", variant: "destructive", color: "bg-red-500" };
  }

  const statusMap: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }
  > = {
    sold: { label: "Sold", variant: "secondary", color: "bg-gray-500" },
    published: { label: "Published", variant: "default", color: "bg-blue-500" },
    inspection_schedule: { label: "Inspection Scheduled", variant: "secondary", color: "bg-yellow-500" },
  };

  return statusMap[item.status] || { label: item.status, variant: "secondary", color: "bg-gray-500" };
};

// ---------------- New Listing Helper (within last 24 hours) ----------------
const isNewListing = (item: BatchItem): boolean => {
  const dateStr = item.createdAt ?? item.products?.[0]?.post_date;
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;
};

// ---------------- Stat Card Component ----------------
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  trend?: string;
}) => (
  <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-background to-muted/30">
    <div className={`absolute top-0 right-0 w-40 h-40 ${color} opacity-5 rounded-full -mr-20 -mt-20 group-hover:opacity-10 transition-opacity`} />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`p-2.5 rounded-xl ${color} bg-opacity-15 group-hover:bg-opacity-20 transition-all`}>
        <Icon className={`h-5 w-5 ${color.replace("bg-", "text-")}`} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex items-baseline gap-2">
        <div className={`text-4xl font-bold ${color.replace("bg-", "text-")}`}>{value}</div>
        {trend && (
          <span className="text-xs text-muted-foreground font-medium">{trend}</span>
        )}
      </div>
    </CardContent>
  </Card>
);

// ---------------- Loading Skeleton Component ----------------
const ListingSkeleton = () => (
  <Card className="border-2">
    <CardContent className="p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <Skeleton className="w-32 h-32 md:w-36 md:h-36 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// ---------------- Main Component ----------------
const AdminListings = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformType, setPlatformType] = useState<string>(SITE_TYPE);
  const [dateRange, setDateRange] = useState<"all" | "today" | "thisMonth" | "custom">("all");
  const [customDateRange, setCustomDateRange] = useState<[string, string] | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Compute dateFrom/dateTo for API
  const { dateFrom, dateTo } = useMemo(() => {
    if (dateRange === "all") return { dateFrom: undefined, dateTo: undefined };
    if (dateRange === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
    }
    if (dateRange === "thisMonth") {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
    }
    if (dateRange === "custom" && customDateRange?.[0] && customDateRange?.[1]) {
      const start = dayjs(customDateRange[0]).startOf("day").toISOString();
      const end = dayjs(customDateRange[1]).endOf("day").toISOString();
      return { dateFrom: start, dateTo: end };
    }
    return { dateFrom: undefined, dateTo: undefined };
  }, [dateRange, customDateRange]);

  // Fetch batches (platform, date range, sort)
  const { data, isLoading, isFetching, isError, refetch } = useGetAdminBatchesQuery({
    page,
    limit: 10,
    type: platformType,
    dateFrom,
    dateTo,
    sort: sortOrder,
  });
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [deleteBatch, { isLoading: isDeleting }] = useDeleteBatchMutation();
  const [approveBatch] = useApproveBatchMutation();

  const toggleExpand = (id: number) => setExpanded(expanded === id ? null : id);

  const handleView = (batchId: number) => {
    navigate(`/admin/listings/${batchId}`);
  };

  const handleDelete = async (batchId: number, batchNumber: number) => {
    const confirmed = await confirmDelete(`Batch #${batchNumber}`);
    if (!confirmed) return;

    try {
      await deleteBatch(batchId).unwrap();
      toastDeleted(`Batch #${batchNumber}`);
      refetch();
    } catch (error: any) {
      toastError(error?.data?.message || t('admin.listings.failedToDelete'));
    }
  };

  const handleApprove = async (batchId: number, batchNumber: number) => {
    setApprovingId(batchId);
    try {
      await approveBatch(batchId).unwrap();
      toastSuccess(t('admin.listings.batchApproved', 'Batch approved'));
      refetch();
    } catch (error: any) {
      toastError(error?.data?.message || t('admin.listings.failedToApprove', 'Failed to approve batch'));
    } finally {
      setApprovingId(null);
    }
  };

  const listings = data?.data || [];
  const totalPages = data?.pagination.total_pages || 1;
  const stats = data?.stats;



  useEffect(() => {
    const unsub = subscribeAdminEvents(() => {
      refetch();
    });

    return unsub;
  }, []);

  // Filter listings based on search query and status
  const filteredListings = useMemo(() => {
    let filtered = listings;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => {
        const statusInfo = getDynamicStatus(item);
        const label = statusInfo?.label;
        return label && String(label).toLowerCase().replace(/\s+/g, "_") === statusFilter;
      });
    }

    // Apply search filter (guard against undefined seller/display_name/meta/company_name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const batchNum = item?.batch_number != null ? String(item.batch_number) : "";
        const title = item?.products?.[0]?.title;
        const displayName = item?.seller?.display_name;
        const companyName = item?.seller?.meta?.greenbidz_company;
        return (
          batchNum.includes(query) ||
          (typeof title === "string" && title.toLowerCase().includes(query)) ||
          (typeof displayName === "string" && displayName.toLowerCase().includes(query)) ||
          (typeof companyName === "string" && companyName.toLowerCase().includes(query))
        );
      });
    }

    return filtered;
  }, [listings, searchQuery, statusFilter]);

  // ---------------- Loading States ----------------
  const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useAdminSidebar();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-background via-background to-muted/20">
        <AdminSidebar activePath="/admin/listings" />
        <div
          className={cn(
            "transition-all duration-300 min-h-screen overflow-y-auto",
            sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
            "ml-0"
          )}
        >
          <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="space-y-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-5 w-96" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="shadow-sm border-0">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <ListingSkeleton key={i} />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-background">
        <AdminSidebar activePath="/admin/listings" />
        <div
          className={cn(
            "transition-all duration-300 min-h-screen flex justify-center items-center",
            sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
            "ml-0"
          )}
        >
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">{t('admin.common.error')}</CardTitle>
              <CardDescription>{t('admin.listings.failedToFetch')}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <AdminSidebar activePath="/admin/listings" />

      <div
        className={cn(
          "transition-all duration-300 min-h-screen overflow-y-auto",
          // Desktop: margin based on sidebar collapsed state
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
          // Mobile: no margin (sidebar is overlay)
          "ml-0"
        )}
      >
        {/* Mobile header with menu button */}
        {false &&
          <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm lg:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="text-foreground"
              >
                <Menu className="h-6 w-6" />
              </Button>
              <div className="flex-1 text-center">
                <span className="text-lg font-semibold">{t('admin.listings.title')}</span>
              </div>
              <div className="w-10" /> {/* Spacer for centering */}
            </div>
          </header>
        }

        <AdminHeader />

        <div className="p-4 lg:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
          {/* ---------------- HEADER ---------------- */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t('admin.listings.titleFull')}</h1>
              <p className="text-muted-foreground mt-1">{t('admin.listings.subtitle')}</p>
            </div>
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 px-4 py-3 shadow-sm">
              <span className="block text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                {t('admin.common.platform', 'Platform')}
              </span>
              <Tabs
                value={platformType}
                onValueChange={(val) => {
                  setPlatformType(val);
                  setPage(1);
                }}
                className="w-auto"
              >
                <TabsList className="h-10 bg-muted/80 border border-border">
                  <TabsTrigger value="greenbidz" className="px-4 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    GreenBidz
                  </TabsTrigger>
                  <TabsTrigger value="recycle" className="px-4 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Recycle
                  </TabsTrigger>
                  <TabsTrigger value="LabGreenbidz" className="px-4 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Lab-GreenBidz
                  </TabsTrigger>
                  <TabsTrigger value="machines" className="px-4 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Machines
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* ---------------- SUMMARY CARDS ---------------- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            <StatCard
              title={t('admin.listings.totalListings')}
              value={stats?.total_listings || 0}
              icon={Package}
              color="bg-blue-500"
              trend={t('admin.listings.allTime')}
            />
            <StatCard
              title={t('admin.listings.sold')}
              value={stats?.sold || 0}
              icon={CheckCircle2}
              color="bg-emerald-500"
              trend={`${stats?.total_listings ? Math.round((stats.sold / stats.total_listings) * 100) : 0}%`}
            />
            <StatCard
              title={t('admin.listings.liveForBids')}
              value={stats?.live_for_bids || 0}
              icon={TrendingUp}
              color="bg-green-500"
            />
            <StatCard
              title={t('admin.listings.inspectionSchedule')}
              value={stats?.inspection_schedule || 0}
              icon={Calendar}
              color="bg-amber-500"
            />
            <StatCard
              title={t('admin.listings.pendingApproval', 'Pending approval')}
              value={stats?.pending_approval_total ?? 0}
              icon={Clock}
              color="bg-red-500"
              trend={stats?.pending_approval_today != null ? `${stats.pending_approval_today} today` : undefined}
            />
          </div>

          {/* ---------------- SEARCH AND FILTERS ---------------- */}
          <Card className="shadow-sm border-0 bg-gradient-to-r from-background to-muted/30">
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t('admin.listings.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 border-2 focus:border-primary/50"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t('admin.listings.dateRange', 'Date')}
                  </span>
                  <Tabs
                    value={dateRange}
                    onValueChange={(val: "all" | "today" | "thisMonth" | "custom") => {
                      setDateRange(val);
                      setPage(1);
                    }}
                    className="w-auto"
                  >
                    <TabsList className="h-9">
                      <TabsTrigger value="all" className="px-3 text-xs">{t('admin.listings.allTime', 'All')}</TabsTrigger>
                      <TabsTrigger value="today" className="px-3 text-xs">{t('admin.listings.today', 'Today')}</TabsTrigger>
                      <TabsTrigger value="thisMonth" className="px-3 text-xs">{t('admin.listings.thisMonth', 'This month')}</TabsTrigger>
                      <TabsTrigger value="custom" className="px-3 text-xs">{t('admin.listings.custom', 'Custom')}</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {dateRange === "custom" && (
                    <RangePicker
                      value={customDateRange ? [dayjs(customDateRange[0]), dayjs(customDateRange[1])] : null}
                      onChange={(dates) => {
                        if (!dates || !dates[0] || !dates[1]) {
                          setCustomDateRange(null);
                          return;
                        }
                        setCustomDateRange([
                          dates[0].startOf("day").toISOString(),
                          dates[1].endOf("day").toISOString(),
                        ]);
                        setPage(1);
                      }}
                      size="large"
                      className="rounded-lg"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t('admin.listings.sort', 'Sort')}
                  </span>
                  <Tabs
                    value={sortOrder}
                    onValueChange={(val: "newest" | "oldest") => {
                      setSortOrder(val);
                      setPage(1);
                    }}
                    className="w-auto"
                  >
                    <TabsList className="h-9">
                      <TabsTrigger value="newest" className="px-3 text-xs">{t('admin.listings.newest', 'Newest')}</TabsTrigger>
                      <TabsTrigger value="oldest" className="px-3 text-xs">{t('admin.listings.oldest', 'Oldest')}</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ---------------- LISTINGS ---------------- */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl font-bold">{t('admin.listings.allListings')}</CardTitle>
                    {filteredListings.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {filteredListings.length}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-2 flex items-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    {t('admin.listings.listingsFound', { count: filteredListings.length })}
                    {statusFilter !== "all" && ` • ${t('admin.listings.filteredBy', { filter: statusFilter.replace(/_/g, " ") })}`}
                  </CardDescription>
                </div>
                {isFetching && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">{t('admin.common.updating')}</span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {isFetching && !isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <ListingSkeleton key={i} />
                  ))}
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="p-4 rounded-full bg-muted/50 mb-4">
                    <Package className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t('admin.listings.noListingsFound')}</h3>
                  <p className="text-muted-foreground max-w-md">
                    {searchQuery || statusFilter !== "all"
                      ? t('admin.listings.tryAdjusting')
                      : t('admin.listings.noListingsAvailable')}
                  </p>
                  {(searchQuery || statusFilter !== "all") && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                      }}
                    >
                      {t('admin.common.clearFilters')}
                    </Button>
                  )}
                </div>
              ) : (
                filteredListings.map((item) => {
                  const statusInfo = getDynamicStatus(item);
                  const isExpanded = expanded === item.batch_id;

                  const isNew = isNewListing(item);
                  return (
                    <Card
                      key={item.batch_id}
                      className="group border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl overflow-hidden bg-gradient-to-br from-card to-muted/20"
                    >
                      <CardContent className="p-0">
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row gap-6">
                            {/* Product Image */}
                            {/* <div className="relative flex-shrink-0">
                              {item.products[0]?.images[0] ? (
                                <div className="relative overflow-hidden rounded-xl border-2 shadow-lg group-hover:shadow-xl transition-shadow">
                                  <img
                                    src={item.products[0].images[0]}
                                    className="w-32 h-32 md:w-36 md:h-36 object-cover transition-transform duration-300 group-hover:scale-105"
                                    alt={item.products[0]?.title}
                                    onError={(e) => {
                                      e.currentTarget.src = "/placeholder.svg";
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              ) : (
                                <div className="w-32 h-32 md:w-36 md:h-36 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/50">
                                  <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                                </div>
                              )}
                            </div> */}

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                                    <h3 className="text-2xl font-bold text-foreground tracking-tight">
                                      {t('admin.listings.batch')}{` #${item.batch_number}`}
                                    </h3>
                                    {isNewListing(item) && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse shadow-md shadow-red-500/40 tracking-wide">
                                        <Sparkles className="w-3 h-3" />
                                        NEW
                                      </span>
                                    )}
                                    <Badge
                                      variant={statusInfo.variant}
                                      className={`${statusInfo.color} text-white border-0 shadow-sm px-3 py-1`}
                                    >
                                      {statusInfo.label}
                                    </Badge>
                                    {item.approval_status === "pending" ? (
                                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                                        {t('admin.listings.pendingApproval', 'Pending approval')}
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                                        {t('admin.listings.approved', 'Approved')}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-lg font-semibold text-foreground mb-1 line-clamp-2">
                                    {item.products[0]?.title || "No title"}
                                  </p>
                                  {item.products[0]?.category && (
                                    <Badge variant="outline" className="text-xs mt-2">
                                      {item.products[0].category}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                                  {item.approval_status === "pending" && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleApprove(item.batch_id, item.batch_number)}
                                      disabled={approvingId === item.batch_id}
                                      className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                                    >
                                      {approvingId === item.batch_id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4" />
                                      )}
                                      {t('admin.listings.approve', 'Approve')}
                                    </Button>
                                  )}
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleView(item.batch_id)}
                                    className="gap-2 shadow-sm hover:shadow-md transition-shadow"
                                  >
                                    <Eye className="h-4 w-4" />
                                    {t('admin.common.view')}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(item.batch_id, item.batch_number)}
                                    disabled={isDeleting}
                                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                  >
                                    {isDeleting ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                    {t('admin.common.delete')}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => toggleExpand(item.batch_id)}
                                    className="flex-shrink-0 hover:bg-primary/10 hover:border-primary/50 transition-all"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-5 w-5" />
                                    ) : (
                                      <ChevronDown className="h-5 w-5" />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                  <div className="p-1.5 rounded-md bg-background">
                                    <Users className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.listings.seller')}</p>
                                    <p className="text-sm font-semibold truncate">{item.seller.display_name}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                  <div className="p-1.5 rounded-md bg-background">
                                    <Building2 className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.listings.company')}</p>
                                    <p className="text-sm font-semibold truncate">{item.seller.meta.greenbidz_company || "N/A"}</p>
                                  </div>
                                </div>
                                {(item.seller.meta.greenbidz_address_city || item.seller.meta.greenbidz_address_country) && (
                                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <div className="p-1.5 rounded-md bg-background">
                                      <MapPin className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.listings.address', 'Address')}</p>
                                      <p className="text-sm font-semibold truncate">
                                        {[
                                          item.seller.meta.greenbidz_address_city,
                                          item.seller.meta.greenbidz_address_district,
                                          item.seller.meta.greenbidz_address_country,
                                        ].filter(Boolean).join(", ")}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                  <div className="p-1.5 rounded-md bg-background">
                                    <Package className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.listings.products')}</p>
                                    <p className="text-sm font-semibold">{item.total_products}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                  <div className="p-1.5 rounded-md bg-background">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.listings.totalBids')}</p>
                                    <p className="text-sm font-semibold">{item.total_bids}</p>
                                  </div>
                                </div>
                                {item.commission_percent != null && Number(item.commission_percent) >= 0 && (
                                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <div className="p-1.5 rounded-md bg-background">
                                      <Percent className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.listings.commission', 'Commission')}</p>
                                      <p className="text-sm font-semibold">{Number(item.commission_percent)}%</p>
                                    </div>
                                  </div>
                                )}
                                {item.bid && (
                                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <div className="p-1.5 rounded-md bg-background">
                                      {/* <DollarSign className="h-4 w-4 text-primary" /> */}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.listings.targetPrice')}</p>
                                      <p className="text-sm font-semibold truncate">
                                        {item.bid.currency} {item.bid.target_price} ({item.bid.type})
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {item.bid && (
                                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <div className="p-1.5 rounded-md bg-background">
                                      <Clock className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.listings.bidPeriod')}</p>
                                      <p className="text-sm font-semibold">
                                        {new Date(item.bid.start_date).toLocaleDateString()} -{" "}
                                        {new Date(item.bid.end_date).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Products Section */}
                        {isExpanded && (
                          <div className="border-t bg-gradient-to-br from-muted/40 to-muted/20 p-6 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Package className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="text-lg font-bold">
                                  {t('admin.listings.productsCount', { count: item.total_products })}
                                </h4>
                                <p className="text-sm text-muted-foreground">{t('admin.listings.viewAllProducts')}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {item.products.map((product, idx) => (
                                <Card
                                  key={idx}
                                  className="group/product overflow-hidden border-2 hover:border-primary/50 transition-all hover:shadow-lg bg-gradient-to-br from-card to-muted/10"
                                >
                                  {product.images[0] ? (
                                    <div className="relative overflow-hidden">
                                      <img
                                        src={product.images[0]}
                                        className="h-48 w-full object-cover transition-transform duration-300 group-hover/product:scale-110"
                                        alt={product.title}
                                        onError={(e) => {
                                          e.currentTarget.src = "/placeholder.svg";
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/product:opacity-100 transition-opacity" />
                                    </div>
                                  ) : (
                                    <div className="h-48 w-full bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center">
                                      <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                                    </div>
                                  )}
                                  <CardContent className="p-4">
                                    <p className="font-semibold text-sm mb-2 line-clamp-2 group-hover/product:text-primary transition-colors">
                                      {product.title}
                                    </p>
                                    <Badge variant="outline" className="text-xs">
                                      {product.category}
                                    </Badge>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* ---------------- PAGINATION ---------------- */}
          {!searchQuery && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
        </div>
      </div>
    </div>
  );
};

export default AdminListings;
