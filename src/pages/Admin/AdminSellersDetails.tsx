import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

import Pagination from "@/components/common/Pagination";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

import { useTranslation } from "react-i18next";

// RTK Query
import { useGetBatchesBySellerQuery } from "@/rtk/slices/productSlice";

import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Building2,
    Package,
    Calendar,
    FileText,
    TrendingUp,
    Eye,
    ArrowUpRight,
    Search,
    X,
    SlidersHorizontal,
    Store,
    ShoppingCart,
    DollarSign,
    Loader2,
} from "lucide-react";
import AdminHeader from "./AdminHeader";

// ---- STATUS COLORS ----
const statusColors = {
    publish: "bg-info/10 text-info border-info/20",
    inspection_schedule: "bg-info/10 text-info border-info/20",
    inspection_complete: "bg-accent/10 text-accent border-accent/20",
    live_for_bids: "bg-accent/10 text-accent border-accent/20",
    deactive_for_bids: "bg-muted text-muted-foreground border-border",
    sold: "bg-success/10 text-success border-success/20",
    deactive: "bg-destructive/10 text-destructive border-destructive/20",
    under_review: "bg-warning/10 text-warning border-warning/20",
};

// ---------------- Stat Card Component ----------------
const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
}: {
    title: string;
    value: number | string;
    icon: React.ElementType;
    color: string;
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
            </div>
        </CardContent>
    </Card>
);

// ---------------- Detail Item Component ----------------
const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="p-2 rounded-lg bg-muted/50">
            <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-sm font-semibold text-foreground mt-1 break-words">{value || "N/A"}</p>
        </div>
    </div>
);

const AdminSellersDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // seller id
    const { t } = useTranslation();

    const [page, setPage] = useState(1);
    const [platformType, setPlatformType] = useState<"all" | "greenbidz" | "LabGreenbidz">("greenbidz");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilterCount, setActiveFilterCount] = useState(0);

    const normalizedType = platformType === "all" ? undefined : platformType;

    // ---- API CALL FOR BATCHES (platform-aware via type) ----
    const {
        data: batchResponse,
        isLoading: batchLoading,
        error
    } = useGetBatchesBySellerQuery({ sellerId: id as string, page, type: normalizedType });

    // ---- SELLER INFO ----
    const seller = {
        name: batchResponse?.data?.seller?.name,
        company_name: batchResponse?.data?.seller?.company || "N/A",
        email: batchResponse?.data?.seller?.email,
        phone: batchResponse?.data?.seller?.phone || "N/A",
        country: batchResponse?.data?.seller?.country || "N/A",
        total_listings: batchResponse?.data?.stats?.total_listings || 0,
        total_sold: batchResponse?.data?.stats?.total_sold || 0,
        total_live: batchResponse?.data?.stats?.total_live || 0,
    };

    // ---- Extract & Normalize Batch Info (supports multiple backend shapes) ----
    const rawData: any = batchResponse?.data;
    const currentPage = rawData?.page ?? page;
    const totalPages = rawData?.totalPages ?? 1;

    const apiBatches: any[] = Array.isArray(rawData?.batches)
        ? rawData.batches
        : Array.isArray(rawData?.data)
        ? rawData.data
        : [];

    const batches = apiBatches.map((b) => ({
        id: b.batchId ?? b.batch_id ?? b.batch_number,
        category: b.category || "N/A",
        status: b.status ?? (b.bids && b.bids[0]?.status) ?? null,
        postDate: b.postDate ?? b.post_date ?? b.createdAt ?? null,
        itemsCount: b.itemsCount ?? b.items_count ?? b.total_bids ?? (Array.isArray(b.bids) ? b.bids.length : 0),
        bidsCount: typeof b.bids === "number" ? b.bids : Array.isArray(b.bids) ? b.bids.length : 0,
    }));

    // Calculate active filter count
    useEffect(() => {
        let count = 0;
        if (statusFilter !== "all") count++;
        if (searchTerm) count++;
        setActiveFilterCount(count);
    }, [statusFilter, searchTerm]);

    // Reset filters
    const resetFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setPage(1);
    };

    // Handle filter change
    const handleFilterChange = (key: string, value: string) => {
        if (key === "search") {
            setSearchTerm(value);
        } else if (key === "status") {
            setStatusFilter(value);
        }
        setPage(1);
    };

    // ---- Filter Batches ----
    const filteredBatches = batches.filter((batch) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
            batch.id?.toString().includes(search) ||
            batch.category?.toLowerCase().includes(search);

        const matchesStatus = statusFilter === "all" || batch.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Get seller initials for avatar
    const getInitials = (name: string | null | undefined) => {
        if (!name) return "?";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useAdminSidebar();

    // ---- Loading UI ----
    if (batchLoading) {
        return (
            <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-background via-background to-muted/20">
                <AdminSidebar activePath="/admin/sellers" />
                <div
                    className={cn(
                        "transition-all duration-300 min-h-screen flex justify-center items-center",
                        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
                        "ml-0"
                    )}
                >
                    <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-background via-background to-muted/20">
            <AdminSidebar activePath="/admin/sellers" />

            <div
                className={cn(
                    "transition-all duration-300 p-4 lg:p-6 space-y-6 animate-in fade-in-50 duration-500",
                    // Desktop: margin based on sidebar collapsed state
                    sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
                    // Mobile: no margin (sidebar is overlay)
                    "ml-0"
                )}
            >
                {/* Mobile header with menu button */}
                {false &&
                    <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm -mx-4 -mt-4 px-4 py-3 mb-6 lg:hidden">
                        <div className="flex items-center justify-between">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSidebarOpen(true)}
                                className="text-foreground"
                            >
                                <Menu className="h-6 w-6" />
                            </Button>
                            <div className="flex-1 text-center">
                                <span className="text-lg font-semibold">{t('admin.sellerDetails.title')}</span>
                            </div>
                            <div className="w-10" /> {/* Spacer for centering */}
                        </div>
                    </header>
                }

                <AdminHeader />


                {/* ---------------- PAGE HEADER ---------------- */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="hover:bg-muted"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="w-1 h-7 bg-gradient-to-b from-accent to-accent-light rounded-full"></div>
                        <h1 className="text-3xl font-bold text-foreground">{t('admin.sellerDetails.title')}</h1>
                    </div>
                    <p className="text-sm text-muted-foreground ml-12">
                        {t('admin.sellerDetails.subtitle')}
                    </p>
                </div>

                {/* ---------------- SELLER INFORMATION SECTION (Always Visible) ---------------- */}
                <div className="space-y-6">
                    {/* Seller Information Card */}
                    <Card className="border-border/50 shadow-lg">
                        <CardHeader>
                            <CardTitle>{t('admin.sellerDetails.sellerInformation')}</CardTitle>
                            <CardDescription>{t('admin.sellerDetails.personalDetails')}</CardDescription>
                        </CardHeader>

                        <CardContent>
                            {batchLoading ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-16 w-16 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-6 w-48" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <Skeleton key={i} className="h-20 w-full" />
                                        ))}
                                    </div>
                                </div>
                            ) : seller.name ? (
                                <>
                                    {/* Avatar and Name Section */}
                                    <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                            {getInitials(seller.name)}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-foreground">{seller.name}</h3>
                                            {seller.company_name && seller.company_name !== "N/A" && (
                                                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                                    <Building2 className="h-4 w-4" />
                                                    {seller.company_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contact Information Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <DetailItem icon={Mail} label={t('admin.sellerDetails.email')} value={seller.email} />
                                        <DetailItem icon={Phone} label={t('admin.sellerDetails.phone')} value={seller.phone} />
                                        <DetailItem icon={Building2} label={t('admin.sellerDetails.company')} value={seller.company_name} />
                                        <DetailItem icon={MapPin} label={t('admin.sellerDetails.country')} value={seller.country} />
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground">{t('admin.sellerDetails.noSellerInfo')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ---------------- ACTIVITY TABS (Stats & Batches) ---------------- */}
                <Tabs defaultValue="stats" className="w-full">
                    <div className="mb-6 border-b border-border/50">
                        <TabsList className="h-auto p-0 bg-transparent gap-2">
                            <TabsTrigger
                                value="stats"
                                className="relative px-8 py-4 text-base font-semibold rounded-t-lg rounded-b-none border-b-[3px] border-transparent data-[state=active]:border-accent data-[state=active]:bg-accent/5 data-[state=active]:text-accent transition-all duration-200 hover:bg-muted/50"
                            >
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="h-5 w-5" />
                                    <span>{t('admin.sellerDetails.stats')}</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="batches"
                                className="relative px-8 py-4 text-base font-semibold rounded-t-lg rounded-b-none border-b-[3px] border-transparent data-[state=active]:border-accent data-[state=active]:bg-accent/5 data-[state=active]:text-accent transition-all duration-200 hover:bg-muted/50"
                            >
                                <div className="flex items-center gap-3">
                                    <Package className="h-5 w-5" />
                                    <span>{t('admin.sellerDetails.batches')}</span>
                                    {batches.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-6 px-2 text-xs font-semibold">
                                            {batches.length}
                                        </Badge>
                                    )}
                                </div>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* ---------------- STATS TAB ---------------- */}
                    <TabsContent value="stats" className="space-y-4">
                        <Card className="border-border/50 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-accent" />
                                    {t('admin.sellerDetails.sellerStatistics')}
                                </CardTitle>
                                <CardDescription>
                                    {t('admin.sellerDetails.overview')}
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                {batchLoading ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {[1, 2, 3].map((i) => (
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
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <StatCard
                                            title={t('admin.sellerDetails.totalListings')}
                                            value={seller.total_listings}
                                            icon={Package}
                                            color="bg-blue-500 text-blue-500"
                                        />
                                        <StatCard
                                            title={t('admin.sellerDetails.totalSold')}
                                            value={seller.total_sold}
                                            icon={ShoppingCart}
                                            color="bg-green-500 text-green-500"
                                        />
                                        <StatCard
                                            title={t('admin.sellerDetails.totalLive')}
                                            value={seller.total_live}
                                            icon={TrendingUp}
                                            color="bg-amber-500 text-amber-500"
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ---------------- BATCHES TAB ---------------- */}
                    <TabsContent value="batches" className="space-y-4">
                        {/* Batches List Card with Filters */}
                        <Card className="border-border/50 shadow-lg">
                            <CardHeader>
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div>
                                        <CardTitle>{t('admin.sellerDetails.sellerBatches')}</CardTitle>
                                        <CardDescription>
                                            {t('admin.sellerDetails.batchesFound', { count: filteredBatches.length })}
                                            {activeFilterCount > 0 && ` • ${t('admin.sellerDetails.filtersActive', { count: activeFilterCount })}`}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                {t('admin.common.platform', 'Platform')}
                                            </span>
                                            <Select
                                                value={platformType}
                                                onValueChange={(val: "all" | "greenbidz" | "LabGreenbidz") => {
                                                    setPlatformType(val);
                                                    setPage(1);
                                                }}
                                            >
                                                <SelectTrigger className="h-8 w-[140px] text-xs">
                                                    <SelectValue placeholder="Platform" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All</SelectItem>
                                                    <SelectItem value="greenbidz">GreenBidz</SelectItem>
                                                    <SelectItem value="LabGreenbidz">Lab-GreenBidz</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {activeFilterCount > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={resetFilters}
                                                className="gap-2 text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="h-4 w-4" />
                                                {t('admin.common.clearAll')}
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowFilters(!showFilters)}
                                            className="gap-2"
                                        >
                                            <SlidersHorizontal className="h-4 w-4" />
                                            {t('admin.common.filters')}
                                            {activeFilterCount > 0 && (
                                                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                                    {activeFilterCount}
                                                </Badge>
                                            )}
                                        </Button>
                                        {batchLoading && (
                                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            {/* Filter Section - Inside the card */}
                            {showFilters && (
                                <CardContent className="border-b">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                                        {/* Search */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">{t('admin.common.search')}</label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder={t('admin.sellerDetails.searchPlaceholder')}
                                                    value={searchTerm}
                                                    onChange={(e) => handleFilterChange("search", e.target.value)}
                                                    className="pl-9"
                                                />
                                            </div>
                                        </div>

                                        {/* Status Filter */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">{t('admin.sellerDetails.status')}</label>
                                            <Select
                                                value={statusFilter}
                                                onValueChange={(value) => handleFilterChange("status", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('admin.sellerDetails.allStatus')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">{t('admin.sellerDetails.allStatus')}</SelectItem>
                                                    <SelectItem value="publish">{t('admin.sellerDetails.publish')}</SelectItem>
                                                    <SelectItem value="inspection_schedule">{t('admin.sellerDetails.inspectionScheduled')}</SelectItem>
                                                    <SelectItem value="inspection_complete">{t('admin.sellerDetails.inspectionCompleted')}</SelectItem>
                                                    <SelectItem value="live_for_bids">{t('admin.sellerDetails.liveForBids')}</SelectItem>
                                                    <SelectItem value="deactive_for_bids">{t('admin.sellerDetails.deactiveForBids')}</SelectItem>
                                                    <SelectItem value="sold">{t('admin.sellerDetails.sold')}</SelectItem>
                                                    <SelectItem value="deactive">{t('admin.sellerDetails.deactive')}</SelectItem>
                                                    <SelectItem value="under_review">{t('admin.sellerDetails.underReview')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            )}

                            <CardContent>
                                {batchLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                                                <Skeleton className="w-12 h-12 rounded-lg" />
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton className="h-6 w-3/4" />
                                                    <Skeleton className="h-4 w-1/2" />
                                                    <Skeleton className="h-4 w-1/3" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : filteredBatches.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                                        <div className="p-4 rounded-full bg-muted/50 mb-4">
                                            <Package className="h-12 w-12 text-muted-foreground/50" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2">{t('admin.sellerDetails.noBatchesFound')}</h3>
                                        <p className="text-muted-foreground max-w-md">
                                            {activeFilterCount > 0
                                                ? t('admin.sellerDetails.tryAdjustingFilters')
                                                : t('admin.sellerDetails.noBatchesYet')}
                                        </p>
                                        {activeFilterCount > 0 && (
                                            <Button
                                                variant="outline"
                                                className="mt-4"
                                                onClick={resetFilters}
                                            >
                                                {t('admin.common.clearFilters')}
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid gap-4">
                                            {filteredBatches.map((batch) => (
                                                <Card
                                                    key={batch.id}
                                                    className="border-border/50 hover:shadow-md transition-all duration-200 cursor-pointer"
                                                    onClick={() =>
                                                        navigate(`/admin/sellers/${id}/batches/${batch.id}`)
                                                    }
                                                >
                                                    <CardContent className="p-4 flex flex-col sm:flex-row justify-between gap-4">
                                                        <div className="flex items-start gap-4">
                                                            <div className="p-3 rounded-lg bg-accent/10">
                                                                <Package className="w-6 h-6 text-accent" />
                                                            </div>

                                                            <div className="space-y-2">
                                                                <h3 className="font-semibold text-lg text-foreground">Batch #{batch.id}</h3>

                                                                {batch.status && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={statusColors[batch.status as keyof typeof statusColors] || ""}
                                                                    >
                                                                        {batch.status?.replace(/_/g, " ") || "Unknown"}
                                                                    </Badge>
                                                                )}

                                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                                    {batch.category && (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <FileText className="w-4 h-4" />
                                                                            <span>{batch.category}</span>
                                                                        </div>
                                                                    )}

                                                                    {batch.postDate && (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <Calendar className="w-4 h-4" />
                                                                            <span>{new Date(batch.postDate).toLocaleDateString()}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-6 sm:gap-8">
                                                            <div className="text-center">
                                                                <p className="text-xs text-muted-foreground">{t('admin.sellerDetails.items')}</p>
                                                                <p className="font-semibold text-lg">{batch.itemsCount || 0}</p>
                                                            </div>

                                                            <div className="text-center">
                                                                <p className="text-xs text-muted-foreground">{t('admin.sellerDetails.bids')}</p>
                                                                <p className="font-semibold text-lg text-accent flex items-center gap-1">
                                                                    <TrendingUp className="w-4 h-4" />
                                                                    {batch.bidsCount || 0}
                                                                </p>
                                                            </div>

                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/admin/listings/${batch.id}`);
                                                                }}
                                                            >
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                {t('admin.sellerDetails.view')} <ArrowUpRight className="w-3 ml-1" />
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <Pagination
                                                currentPage={currentPage}
                                                totalPages={totalPages}
                                                onPageChange={(p) => setPage(p)}
                                            />
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default AdminSellersDetails;
