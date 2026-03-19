import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import Pagination from "@/components/common/Pagination";

import {
    useGetBuyerFullDetailsQuery,
    useGetBuyerBidsQuery,
    useGetBuyerInspectionsQuery,
} from "@/rtk/slices/buyerApiSlice";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Building2,
    Globe,
    ShoppingCart,
    TrendingUp,
    DollarSign,
    Calendar,
    FileText,
    Package,
    CheckCircle2,
    Clock,
    XCircle,
    Loader2,
    Filter,
    X,
    Search,
    SlidersHorizontal,
} from "lucide-react";
import AdminHeader from "./AdminHeader";

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

// ---------------- Status Badge Helper ----------------
const getStatusBadge = (status: string, t: any) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
        accepted: {
            label: t('admin.status.accepted'),
            className: "bg-green-500 hover:bg-green-600 text-white border-0",
        },
        pending: {
            label: t('admin.status.pending'),
            className: "bg-yellow-500 hover:bg-yellow-600 text-white border-0",
        },
        rejected: {
            label: t('admin.status.rejected'),
            className: "bg-red-500 hover:bg-red-600 text-white border-0",
        },
        completed: {
            label: t('admin.status.completed'),
            className: "bg-blue-500 hover:bg-blue-600 text-white border-0",
        },
        scheduled: {
            label: t('admin.status.scheduled'),
            className: "bg-purple-500 hover:bg-purple-600 text-white border-0",
        },
    };

    const config = statusConfig[status?.toLowerCase()] || {
        label: status || t('admin.status.unknown'),
        className: "bg-muted text-muted-foreground",
    };

    return <Badge className={config.className}>{config.label}</Badge>;
};

export default function BuyerDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // pagination states
    const [bidPage, setBidPage] = useState(1);
    const [inspectionPage, setInspectionPage] = useState(1);

    // Filter states for bids
    const [bidFilters, setBidFilters] = useState({
        status: "all",
        search: "",
    });
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilterCount, setActiveFilterCount] = useState(0);

    // Filter states for inspections
    const [inspectionFilters, setInspectionFilters] = useState({
        status: "all",
        search: "",
    });
    const [showInspectionFilters, setShowInspectionFilters] = useState(false);
    const [activeInspectionFilterCount, setActiveInspectionFilterCount] = useState(0);

    const buyerIdNum = Number(id);

    // Calculate active filter count for bids
    useEffect(() => {
        let count = 0;
        if (bidFilters.status !== "all") count++;
        if (bidFilters.search) count++;
        setActiveFilterCount(count);
    }, [bidFilters]);

    // Calculate active filter count for inspections
    useEffect(() => {
        let count = 0;
        if (inspectionFilters.status !== "all") count++;
        if (inspectionFilters.search) count++;
        setActiveInspectionFilterCount(count);
    }, [inspectionFilters]);

    // API 1 – FULL BUYER DETAILS
    const { data: buyerDetails, isLoading: buyerLoading } =
        useGetBuyerFullDetailsQuery(buyerIdNum);

    // API 2 – BIDS (with filters)
    const { data: bidsData, isLoading: bidsLoading } =
        useGetBuyerBidsQuery({
            buyerId: buyerIdNum,
            page: bidPage,
            limit: 10,
            status: bidFilters.status !== "all" ? bidFilters.status : undefined,
            search: bidFilters.search || undefined,
        });

    // API 3 – INSPECTIONS (with filters)
    const { data: inspectionsData, isLoading: inspectionsLoading } =
        useGetBuyerInspectionsQuery({
            buyerId: buyerIdNum,
            page: inspectionPage,
            limit: 10,
            status: inspectionFilters.status !== "all" ? inspectionFilters.status : undefined,
            search: inspectionFilters.search || undefined,
        });

    const buyer = Array.isArray(buyerDetails?.data?.buyer)
        ? buyerDetails.data.buyer[0]
        : buyerDetails?.data?.buyer;
    const stats = buyerDetails?.data?.stats;

    // Format currency helper
    const formatCurrency = (value: string | number, currency: string = "USD") => {
        const num = Number(value) || 0;
        switch (currency?.toUpperCase()) {
            case "USD":
                return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
            case "TWD":
                return `NT$${num.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}`;
            default:
                return `${currency?.toUpperCase()} ${num.toLocaleString()}`;
        }
    };

    // Format date helper
    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return dateString;
        }
    };

    // Get buyer initials for avatar
    const getInitials = (name: string | null | undefined) => {
        if (!name) return "?";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    // Reset filters for bids
    const resetBidFilters = () => {
        setBidFilters({
            status: "all",
            search: "",
        });
        setBidPage(1);
    };

    // Apply filters for bids (reset to page 1 when filters change)
    const handleFilterChange = (key: string, value: string) => {
        setBidFilters((prev) => ({ ...prev, [key]: value }));
        setBidPage(1);
    };

    // Reset filters for inspections
    const resetInspectionFilters = () => {
        setInspectionFilters({
            status: "all",
            search: "",
        });
        setInspectionPage(1);
    };

    // Apply filters for inspections (reset to page 1 when filters change)
    const handleInspectionFilterChange = (key: string, value: string) => {
        setInspectionFilters((prev) => ({ ...prev, [key]: value }));
        setInspectionPage(1);
    };

    const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useAdminSidebar();

    return (
        <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-background via-background to-muted/20">
            {/* --- SIDEBAR --- */}
            <AdminSidebar activePath="/admin/buyers" />

            {/* --- MAIN CONTENT --- */}
            <div
                className={cn(
                    "transition-all duration-300 p-4 lg:p-6 space-y-4 animate-in   fade-in-50 duration-500",
                    // Desktop: margin based on sidebar collapsed state
                    sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
                    // Mobile: no margin (sidebar is overlay)
                    "ml-0"
                )}
            >

                <AdminHeader />
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
                                <span className="text-lg font-semibold">{t('admin.buyerDetails.title')}</span>
                            </div>
                            <div className="w-10" /> {/* Spacer for centering */}
                        </div>
                    </header>
                }


                {/* ---------------- PAGE HEADER ---------------- */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate("/admin/buyers")}
                            className="hover:bg-muted"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="w-1 h-7 bg-gradient-to-b from-accent to-accent-light rounded-full"></div>
                        <h1 className="text-3xl font-bold text-foreground">{t('admin.buyerDetails.title')}</h1>
                    </div>
                    <p className="text-sm text-muted-foreground ml-12">
                        {t('admin.buyerDetails.subtitle')}
                    </p>
                </div>

                {/* ---------------- BUYER INFORMATION SECTION (Always Visible) ---------------- */}
                <div className="space-y-6">
                    {/* Buyer Information Card */}
                    <Card className="border-border/50 shadow-lg">
                        <CardHeader>
                            <CardTitle>{t('admin.buyerDetails.buyerInformation12')}</CardTitle>
                            <CardDescription>{t('admin.buyerDetails.personalDetails')}</CardDescription>
                        </CardHeader>

                        <CardContent>
                            {buyerLoading ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-16 w-16 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-6 w-48" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                            <Skeleton key={i} className="h-20 w-full" />
                                        ))}
                                    </div>
                                </div>
                            ) : buyer ? (
                                <>
                                    {/* Avatar and Name Section */}
                                    <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                            {getInitials(buyer.name)}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-foreground">{buyer.name}</h3>
                                            {buyer.company && (
                                                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                                    <Building2 className="h-4 w-4" />
                                                    {buyer.company}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contact Information Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <DetailItem icon={Mail} label={t('admin.buyerDetails.email')} value={buyer.email} />
                                        <DetailItem icon={Phone} label={t('admin.buyerDetails.phone')} value={buyer.phone} />
                                        <DetailItem icon={Building2} label={t('admin.buyerDetails.company')} value={buyer.company} />
                                        <DetailItem icon={MapPin} label={t('admin.buyerDetails.country')} value={buyer.country} />
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground">{t('admin.buyerDetails.noBuyerInfo')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ---------------- ACTIVITY TABS (Stats, Bids & Inspections) ---------------- */}
                <Tabs defaultValue="stats" className="w-full">
                    <div className="mb-6 border-b border-border/50">
                        <TabsList className="h-auto p-0 bg-transparent gap-2">
                            <TabsTrigger
                                value="stats"
                                className="relative px-5 sm:px-8 py-4 text-base font-semibold rounded-t-lg rounded-b-none border-b-[3px] border-transparent data-[state=active]:border-accent data-[state=active]:bg-accent/5 data-[state=active]:text-accent transition-all duration-200 hover:bg-muted/50"
                            >
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="h-5 w-5" />
                                    <span>{t('admin.buyerDetails.stats')}</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="bids"
                                className="relative px-5 sm:px-8 py-4 text-base font-semibold rounded-t-lg rounded-b-none border-b-[3px] border-transparent data-[state=active]:border-accent data-[state=active]:bg-accent/5 data-[state=active]:text-accent transition-all duration-200 hover:bg-muted/50"
                            >
                                <div className="flex items-center gap-3">
                                    <ShoppingCart className="h-5 w-5" />
                                    <span>{t('admin.buyerDetails.bids')}</span>
                                    {bidsData?.data?.data && bidsData.data.data.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-6 px-2 text-xs font-semibold">
                                            {bidsData.data.data.length}
                                        </Badge>
                                    )}
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="inspections"
                                className="relative px-5 sm:px-8 py-4 text-base font-semibold rounded-t-lg rounded-b-none border-b-[3px] border-transparent data-[state=active]:border-accent data-[state=active]:bg-accent/5 data-[state=active]:text-accent transition-all duration-200 hover:bg-muted/50"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5" />
                                    <span>{t('admin.buyerDetails.inspections')}</span>
                                    {inspectionsData?.data?.data && inspectionsData.data.data.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-6 px-2 text-xs font-semibold">
                                            {inspectionsData.data.data.length}
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
                                    {t('admin.buyerDetails.buyerStatistics')}
                                </CardTitle>
                                <CardDescription>
                                    {t('admin.buyerDetails.overview')}
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                {buyerLoading ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                ) : stats && Object.keys(stats).length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {Object.entries(stats).map(([key, value]) => {
                                            // Map stat keys to icons and colors
                                            const statConfig: Record<string, { icon: React.ElementType; color: string; title: string }> = {
                                                total_bids: { icon: TrendingUp, color: "bg-blue-500 text-blue-500", title: t('admin.buyerDetails.totalBids') },
                                                accepted_bids: { icon: CheckCircle2, color: "bg-green-500 text-green-500", title: t('admin.buyerDetails.acceptedBids') },
                                                total_purchases: { icon: ShoppingCart, color: "bg-amber-500 text-amber-500", title: t('admin.buyerDetails.totalPurchases') },
                                                total_spent: { icon: DollarSign, color: "bg-emerald-500 text-emerald-500", title: t('admin.buyerDetails.totalSpent') },
                                                total_inspections: { icon: FileText, color: "bg-purple-500 text-purple-500", title: t('admin.buyerDetails.totalInspections') },
                                            };

                                            const config = statConfig[key] || {
                                                icon: Package,
                                                color: "bg-gray-500 text-gray-500",
                                                title: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                                            };

                                            const displayValue = key.includes("spent") && typeof value === "number"
                                                ? formatCurrency(value, "USD")
                                                : typeof value === "number" ? value : String(value);

                                            return (
                                                <StatCard
                                                    key={key}
                                                    title={config.title}
                                                    value={displayValue}
                                                    icon={config.icon}
                                                    color={config.color}
                                                />
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                                        <div className="p-4 rounded-full bg-muted/50 mb-4">
                                            <TrendingUp className="h-12 w-12 text-muted-foreground/50" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2">{t('admin.buyerDetails.noStatistics')}</h3>
                                        <p className="text-muted-foreground max-w-md">
                                            {t('admin.buyerDetails.statisticsWillAppear')}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ---------------- BIDS TAB ---------------- */}
                    <TabsContent value="bids" className="space-y-4">
                        {/* Bids List Card with Filters */}
                        <Card className="border-border/50 shadow-lg">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>{t('admin.buyerDetails.buyerBids')}</CardTitle>
                                        <CardDescription>
                                            {t('admin.buyerDetails.bidsFound', { count: bidsData?.data?.data?.length || 0 })}
                                            {activeFilterCount > 0 && ` • ${t('admin.buyerDetails.filtersActive', { count: activeFilterCount })}`}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {activeFilterCount > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={resetBidFilters}
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
                                        {bidsLoading && (
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
                                                    placeholder={t('admin.buyerDetails.searchPlaceholder')}
                                                    value={bidFilters.search}
                                                    onChange={(e) => handleFilterChange("search", e.target.value)}
                                                    className="pl-9"
                                                />
                                            </div>
                                        </div>

                                        {/* Status Filter */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">{t('admin.buyerDetails.status')}</label>
                                            <Select
                                                value={bidFilters.status}
                                                onValueChange={(value) => handleFilterChange("status", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('admin.buyerDetails.allStatus')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">{t('admin.buyerDetails.allStatus')}</SelectItem>
                                                    <SelectItem value="pending">{t('admin.buyerDetails.pending')}</SelectItem>
                                                    <SelectItem value="accepted">{t('admin.buyerDetails.accepted')}</SelectItem>
                                                    <SelectItem value="rejected">{t('admin.buyerDetails.rejected')}</SelectItem>
                                                    <SelectItem value="expired">{t('admin.buyerDetails.expired')}</SelectItem>
                                                    <SelectItem value="withdrawn">{t('admin.buyerDetails.withdrawn')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            )}

                            <CardContent>
                                {bidsLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                                                <Skeleton className="w-24 h-24 rounded-lg" />
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton className="h-6 w-3/4" />
                                                    <Skeleton className="h-4 w-1/2" />
                                                    <Skeleton className="h-4 w-1/3" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : bidsData?.data?.data && bidsData.data.data.length > 0 ? (
                                    <>
                                        <div className="grid gap-4">
                                            {bidsData.data.data.map((item: any, index: number) => (
                                                <Card
                                                    key={index}
                                                    className="p-4 border-border/50 hover:shadow-md transition-all duration-200 cursor-pointer"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="relative">
                                                            <img
                                                                src={
                                                                    item.products?.[0]?.images?.[0] ||
                                                                    "/placeholder.svg"
                                                                }
                                                                alt={item.products?.[0]?.title || "Product"}
                                                                className="w-24 h-24 object-cover rounded-lg border-2 border-border"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                                                                }}
                                                            />
                                                            {item.status === "accepted" && (
                                                                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                                                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                                <h4 className="font-semibold text-lg text-foreground line-clamp-2">
                                                                    {item.products?.[0]?.title || "Untitled Product"}
                                                                </h4>
                                                                {getStatusBadge(item.status, t)}
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                                                                {item.products?.[0]?.category && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Package className="h-4 w-4" />
                                                                        <span>{item.products[0].category}</span>
                                                                    </div>
                                                                )}
                                                                {item.bid_date && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Calendar className="h-4 w-4" />
                                                                        <span>{formatDate(item.bid_date)}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <DollarSign className="h-5 w-5 text-green-600" />
                                                                <span className="text-lg font-bold text-green-600">
                                                                    {formatCurrency(item.bid_amount, item.currency || "USD")}
                                                                </span>
                                                                <span className="text-sm text-muted-foreground">{t('admin.buyerDetails.bidAmount')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>

                                        {/* Pagination */}
                                        {bidsData?.data?.pagination?.totalPages > 1 && (
                                            <Pagination
                                                currentPage={bidPage}
                                                totalPages={bidsData.data.pagination.totalPages}
                                                onPageChange={(p) => setBidPage(p)}
                                            />
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                                        <div className="p-4 rounded-full bg-muted/50 mb-4">
                                            <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2">{t('admin.buyerDetails.noBidsFound')}</h3>
                                        <p className="text-muted-foreground max-w-md">
                                            {t('admin.buyerDetails.noBidsYet')}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ---------------- INSPECTIONS TAB ---------------- */}
                    <TabsContent value="inspections" className="space-y-4">
                        {/* Inspections List Card with Filters */}
                        <Card className="border-border/50 shadow-lg">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>{t('admin.buyerDetails.buyerInspections')}</CardTitle>
                                        <CardDescription>
                                            {t('admin.buyerDetails.inspectionsFound', { count: inspectionsData?.data?.data?.length || 0 })}
                                            {activeInspectionFilterCount > 0 && ` • ${t('admin.buyerDetails.filtersActive', { count: activeInspectionFilterCount })}`}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {activeInspectionFilterCount > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={resetInspectionFilters}
                                                className="gap-2 text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="h-4 w-4" />
                                                {t('admin.common.clearAll')}
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowInspectionFilters(!showInspectionFilters)}
                                            className="gap-2"
                                        >
                                            <SlidersHorizontal className="h-4 w-4" />
                                            {t('admin.common.filters')}
                                            {activeInspectionFilterCount > 0 && (
                                                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                                    {activeInspectionFilterCount}
                                                </Badge>
                                            )}
                                        </Button>
                                        {inspectionsLoading && (
                                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            {/* Filter Section - Inside the card */}
                            {showInspectionFilters && (
                                <CardContent className="border-b">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                                        {/* Search */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">{t('admin.common.search')}</label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder={t('admin.buyerDetails.searchInspectionPlaceholder')}
                                                    value={inspectionFilters.search}
                                                    onChange={(e) => handleInspectionFilterChange("search", e.target.value)}
                                                    className="pl-9"
                                                />
                                            </div>
                                        </div>

                                        {/* Status Filter */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">{t('admin.buyerDetails.status')}</label>
                                            <Select
                                                value={inspectionFilters.status}
                                                onValueChange={(value) => handleInspectionFilterChange("status", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('admin.buyerDetails.allStatus')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">{t('admin.buyerDetails.allStatus')}</SelectItem>
                                                    <SelectItem value="scheduled">{t('admin.buyerDetails.scheduled')}</SelectItem>
                                                    <SelectItem value="completed">{t('admin.buyerDetails.completed')}</SelectItem>
                                                    <SelectItem value="cancelled">{t('admin.buyerDetails.cancelled')}</SelectItem>
                                                    <SelectItem value="pending">{t('admin.buyerDetails.pending')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            )}

                            <CardContent>
                                {inspectionsLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                                                <Skeleton className="w-24 h-24 rounded-lg" />
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton className="h-6 w-3/4" />
                                                    <Skeleton className="h-4 w-1/2" />
                                                    <Skeleton className="h-4 w-1/3" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : inspectionsData?.data?.data && inspectionsData.data.data.length > 0 ? (
                                    <>
                                        <div className="grid gap-4">
                                            {inspectionsData.data.data.map((item: any, index: number) => (
                                                <Card
                                                    key={index}
                                                    className="p-4 border-border/50 hover:shadow-md transition-all duration-200 cursor-pointer"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="relative">
                                                            <img
                                                                src={
                                                                    item.products?.[0]?.images?.[0] ||
                                                                    "/placeholder.svg"
                                                                }
                                                                alt={item.products?.[0]?.title || "Product"}
                                                                className="w-24 h-24 object-cover rounded-lg border-2 border-border"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                                                                }}
                                                            />
                                                            {item.status === "completed" && (
                                                                <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1">
                                                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                                <h4 className="font-semibold text-lg text-foreground line-clamp-2">
                                                                    {item.products?.[0]?.title || "Untitled Product"}
                                                                </h4>
                                                                {getStatusBadge(item.status, t)}
                                                            </div>

                                                            <div className="space-y-2 mb-3">
                                                                {item.inspection_number && (
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                                        <span className="font-medium text-foreground">{t('admin.buyerDetails.inspectionNumber')}</span>
                                                                        <span className="text-muted-foreground">{item.inspection_number}</span>
                                                                    </div>
                                                                )}
                                                                {item.inspection_date && (
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                                        <span className="font-medium text-foreground">{t('admin.buyerDetails.date')}</span>
                                                                        <span className="text-muted-foreground">{formatDate(item.inspection_date)}</span>
                                                                    </div>
                                                                )}
                                                                {item.products?.[0]?.category && (
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <Package className="h-4 w-4 text-muted-foreground" />
                                                                        <span className="font-medium text-foreground">{t('admin.buyerDetails.category')}</span>
                                                                        <span className="text-muted-foreground">{item.products[0].category}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>

                                        {/* Pagination */}
                                        {inspectionsData?.data?.pagination?.totalPages > 1 && (
                                            <Pagination
                                                currentPage={inspectionPage}
                                                totalPages={inspectionsData.data.pagination.totalPages}
                                                onPageChange={(p) => setInspectionPage(p)}
                                            />
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                                        <div className="p-4 rounded-full bg-muted/50 mb-4">
                                            <FileText className="h-12 w-12 text-muted-foreground/50" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2">{t('admin.buyerDetails.noInspectionsFound')}</h3>
                                        <p className="text-muted-foreground max-w-md">
                                            {t('admin.buyerDetails.noInspectionsYet')}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
