// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    Package,
    Calendar,
    CreditCard,
    CheckCircle2,
    Clock,
    AlertCircle,
    Building2,
    User,
    Loader2,
    LogOut,
    Info,
    DollarSign,
    XCircle,
    Gavel,
    MapPin,
    FileText,
    Target,
    TrendingUp,
    Home,
} from "lucide-react";
import { useGetBuyerBatchSummaryQuery, useCompletePaymentDetailsMutation } from "@/rtk/slices/buyerApiSlice";
import { useGetBatchByIdQuery } from "@/rtk/slices/batchApiSlice";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import logo from "@/assets/greenbidz_logo.png";
import { useLogoutMutation } from "@/rtk/slices/apiSlice";
import { toastError, toastSuccess } from "@/helper/toasterNotification";
import { subscribeBuyerEvents } from "@/socket/buyerEvents"
import BuyerDashboard from "../dashboard/BuyerDashboard";
import BuyerHeader from "../buyer/BuyerHeader";
import { extractValuesFromPhpSerialized } from "@/utils/parsePhpSerializedUrl";
import { useCategoryCache } from "@/hooks/useCategoryCache";
import { pushLogoutEvent, pushViewListingEvent } from "@/utils/gtm";

export default function BuyerBatchDetails() {
    const { batchId } = useParams<{ batchId: string }>();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const buyerId = Number(localStorage.getItem("userId"));
    const [logout] = useLogoutMutation();
    const { getTranslatedCategory } = useCategoryCache();
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [paymentData, setPaymentData] = useState({
        transaction_number: "",
        payment_method: ""
    });
    const [paymentProof, setPaymentProof] = useState<File | null>(null);

    // Fetch buyer-specific batch summary
    const { data: buyerData, isLoading: buyerLoading, error: buyerError, refetch } = useGetBuyerBatchSummaryQuery({ batch_id: Number(batchId), buyer_id: buyerId }, { skip: !batchId });

    // Fetch batch products
    const { data: productData, isLoading: productLoading, error: productError, refetch: refetchProduct } = useGetBatchByIdQuery(Number(batchId), { skip: !batchId });

    // Mutation to submit payment
    const [submitPayment, { isLoading: isSubmitting }] = useCompletePaymentDetailsMutation();

    const refetchAll = () => {
        refetchProduct()
        refetch()
    };;

    useEffect(() => {
        const unsub = subscribeBuyerEvents(() => {
            refetchAll();
        });

        return unsub;
    }, []);

    // Fire GA4 view_listing once buyer + product data loads
    useEffect(() => {
        try {
            if (!buyerData?.success || !productData?.success) return;
            const b = buyerData.data.batch;
            pushViewListingEvent({
                batch_id:       b.batch_id ?? Number(batchId),
                batch_number:   b.batch_number,
                batch_title:    b.title,
                batch_category: b.category,
                batch_status:   b.status,
                item_count:     productData.data.products?.length ?? 0,
                seller_id:      b.seller_id,
            });
        } catch {}
    }, [buyerData?.success, productData?.success]);

    const handleLogout = async () => {
        try {
            const confirmLogout = window.confirm(
                t("common.confirmLogout") || "Are you sure you want to logout?"
            );
            if (!confirmLogout) return;

            try { pushLogoutEvent(); } catch {}
            await logout().unwrap();

            document.cookie =
                "accessToken=; Max-Age=0; path=/; domain=.101recycle.greenbidz.com; secure; SameSite=None";
            document.cookie =
                "refreshToken=; Max-Age=0; path=/; domain=.101recycle.greenbidz.com; secure; SameSite=None";

            localStorage.removeItem("userId");
            localStorage.removeItem("userRole");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");


            localStorage.clear();

            toastSuccess(t("common.logoutSuccess"));
            window.location.href = "/";
        } catch (error: any) {
            toastError(error?.data?.message || t("common.logoutFailed"));
        }
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return "N/A";
        try {
            const date = new Date(dateStr);
            const locale = i18n.language === "zh" ? "zh-TW" : "en-US";
            return date.toLocaleDateString(locale, {
                year: "numeric",
                month: i18n.language === "zh" ? "numeric" : "long",
                day: "numeric",
            });
        } catch {
            return dateStr;
        }
    };

    // Helper function to translate AM/PM in time slots
    const formatTimeSlot = (timeStr?: string | null) => {
        if (!timeStr) return "N/A";
        if (i18n.language === "zh") {
            return timeStr
                .replace(/\bAM\b/g, "上午")
                .replace(/\bPM\b/g, "下午");
        }
        return timeStr;
    };

    const formatDateTime = (dateStr?: string | null, timeStr?: string | null) => {
        if (!dateStr) return "N/A";
        const formattedDate = formatDate(dateStr);
        if (timeStr) {
            const atWord = i18n.language === "zh" ? "" : " at ";
            return `${formattedDate}${atWord}${formatTimeSlot(timeStr)}`;
        }
        return formattedDate;
    };

    if (buyerLoading || productLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
                <BuyerDashboard />

                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">{t('buyerDashboard.loadingBatchDetails')}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (buyerError || productError || !buyerData?.success || !productData?.success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
                {/* Header */}
                <header className="border-b border-border bg-card/80 backdrop-blur-sm shadow-soft sticky top-0 z-50">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <img
                                    src={logo}
                                    alt="GreenBidz"
                                    className="h-8 w-auto cursor-pointer transition-transform hover:scale-105"
                                    onClick={() => navigate("/")}
                                />
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-7 bg-gradient-to-b from-accent to-accent-light rounded-full"></div>
                                    <h1 className="text-2xl font-bold text-foreground">{t("buyerDashboard.title")}</h1>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button variant="outline" onClick={() => navigate("/buyer-marketplace")} className="shadow-soft">
                                    {t("buyerDashboard.browseMarketplace")}
                                </Button>
                                <LanguageSwitcher />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleLogout}
                                    className="hover:bg-muted/50 transition-colors"
                                >
                                    <LogOut className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="container mx-auto px-4 py-8">
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-destructive flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                {t('common.error')}
                            </CardTitle>
                            <CardDescription>{t('buyerDashboard.failedToLoadBatchDetails')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => navigate("/buyer-dashboard")} variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {t('common.goBack') || "Go Back"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const batch = buyerData.data.batch;
    // const bid = buyerData.data.buyer_bids?.[0];

    const bid = buyerData.data.buyer_bids.find(b => b.status === 'accepted') || buyerData.data.buyer_bids?.[0];
    const wholeItemBid = buyerData.data.buyer_bids.find(b => b.quotation_types.includes("whole_item"));
    const weightBid = buyerData.data.buyer_bids.find(b => b.quotation_types.includes("weight_based"));

    const payment = buyerData.data.buyer_payment_details;
    const inspection = buyerData.data.inspection_attendance;
    const paymentDetail = productData?.data?.winnerPayment
    const bidStatus = bid?.status === 'accepted' ? 'accepted' : bid?.status === 'rejected' ? 'rejected' : 'pending';
    const bidStatusConfig = {
        accepted: { label: t("buyerDashboard.bidStatusAccepted"), color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
        rejected: { label: t("buyerDashboard.bidStatusRejected"), color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
        pending: { label: t("buyerDashboard.bidStatusPending"), color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
    };
    const StatusIcon = bidStatusConfig[bidStatus]?.icon || Clock;

    const products = productData.data.products || [];

    // Helper to extract meta value by key
    const getMetaValue = (meta: any[], key: string) => {
        return meta?.find((m: any) => m.meta_key === key)?.meta_value || null;
    };

    // Helper to get translated field from meta
    const getTranslatedMeta = (meta: any[], fieldName: string, currentLang: string) => {
        const key = `${fieldName}_${currentLang}`;
        return getMetaValue(meta, key) || getMetaValue(meta, `${fieldName}_en`) || null;
    };

    const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPaymentData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPaymentProof(e.target.files[0]);
        }
    };

    const handlePaymentSubmit = async () => {
        if (!paymentData.transaction_number || !paymentData.payment_method || !paymentProof) {
            toastError(t('buyerDashboard.fillAllFields'));
            return;
        }

        const formData = new FormData();
        formData.append('batch_id', String(batchId));
        formData.append('buyer_id', String(buyerId));
        formData.append('transaction_number', paymentData.transaction_number);
        formData.append('payment_method', paymentData.payment_method);
        if (paymentProof) {
            formData.append('payment_proof', paymentProof);
        }

        try {
            await submitPayment(formData).unwrap();
            setIsPaymentDialogOpen(false);
            setPaymentData({ transaction_number: "", payment_method: "" });
            setPaymentProof(null);
            toastSuccess(t('buyerDashboard.paymentSubmittedSuccess'));
            refetch();
        } catch (err: any) {
            console.error("Payment submission failed:", err);
            toastError(err?.data?.message || t('buyerDashboard.paymentSubmitFailed'));
        }
    };


    return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
                {/* Breadcrumb */}
                <div className="mx-auto px-4 pt-3 pb-0">
                    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Home className="w-3.5 h-3.5" />
                        <span className="text-muted-foreground/40">/</span>
                        <span
                            className="hover:text-primary cursor-pointer transition-colors hover:underline"
                            onClick={() => navigate("/buyer-marketplace")}
                        >
                            {t("publicHeader.allAuctions")}
                        </span>
                        {batch?.category && (
                            <>
                                <span className="text-muted-foreground/40">/</span>
                                <span
                                    className="hover:text-primary cursor-pointer transition-colors hover:underline capitalize"
                                    onClick={() => navigate(`/buyer-marketplace?category=${batch.category}`)}
                                >
                                    {i18n.language === 'zh'
                                        ? getTranslatedCategory(batch.category, 'zh')
                                        : batch.category.replace(/-/g, " ")}
                                </span>
                            </>
                        )}
                        <span className="text-muted-foreground/40">/</span>
                        <span className="text-foreground font-medium">
                            {(i18n.language === 'zh' && batch?.title_zh) ? batch.title_zh
                                : (i18n.language === 'ja' && batch?.title_ja) ? batch.title_ja
                                : (i18n.language === 'th' && batch?.title_th) ? batch.title_th
                                : batch?.title_en || batch?.title || `Batch #${batchId}`}
                        </span>
                    </nav>
                </div>

                {/* Main Content */}
                <div className="mx-auto px-4 py-2">
                    {/* Page Header Section */}
                    <div className="mb-8">
                        <div className="flex items-start justify-between flex-wrap gap-4">
                            <div>
                                <div className="flex items-center gap-3 flex-wrap mb-2">
                                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                        Batch #{batch.batch_number || batchId}
                                    </h1>
                                    <Badge
                                        className={`${bidStatusConfig[bidStatus]?.color} border flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold shadow-sm`}
                                    >
                                        <StatusIcon className="w-4 h-4" />
                                        {bidStatusConfig[bidStatus]?.label || "Pending"}
                                    </Badge>
                                </div>
                                <p className="text-muted-foreground text-lg">
                                    {t('buyerDashboard.batchDetails')}
                                </p>
                            </div>
                            <Badge variant="outline" className={`text-base px-4 py-2 ${batch.status === "sold" ? "bg-red-100 text-red-700 border-red-300" : ""}`}>
                                {t('buyerDashboard.status')}: {batch.status === "sold" ? (t('buyer.status.sold') || "Sold") : batch.status}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* Main Content Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Batch Information Card */}
                            <Card className="shadow-lg border-0 overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-accent/5 to-accent/10 border-b">
                                    <div className="flex items-center gap-2">
                                        <Package className="w-5 h-5 text-accent" />
                                        <CardTitle>{t('buyerDashboard.batchInformation')}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground font-medium">{t('buyerDashboard.batchNumber')}</p>
                                            <p className="text-lg font-semibold">{batch.batch_number || "N/A"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground font-medium">{t('buyerDashboard.batchStatus')}</p>
                                            <p className={`text-lg font-semibold ${batch.status === "sold" ? "text-red-600" : ""}`}>
                                                {batch.status === "sold" ? (t('buyer.status.sold') || "Sold") : (batch.status || "N/A")}
                                            </p>
                                        </div>
                                        {bid?.amount && (
                                            <div className="space-y-1">
                                                <p className="text-sm text-muted-foreground font-medium">{t('buyerDashboard.yourBidAmount')}</p>
                                                <p className="text-lg font-semibold flex items-center gap-1">
                                                    <DollarSign className="w-4 h-4" />
                                                    {bid?.Bidding?.currency === "TWD" ? "NT$" : "$"}
                                                    {Number(bid.amount).toLocaleString()}
                                                    {bid?.Bidding?.currency && (
                                                        <span className="text-sm text-muted-foreground ml-1">
                                                            ({bid.Bidding.currency === "TWD" ? t('biddingStep.twd') : t('biddingStep.usd')})
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Bidding Information Section */}
                            <Card className="shadow-lg border-0 overflow-hidden">
                                {bid?.Bidding && (
                                    <>
                                        {/* Header */}
                                        <CardHeader className="bg-gradient-to-r from-purple-500/5 to-purple-500/10 border-b">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Gavel className="w-5 h-5 text-purple-600" />
                                                    <CardTitle>{t('buyerDashboard.biddingInformation')}</CardTitle>
                                                </div>
                                                <Badge
                                                    variant={
                                                        bid.Bidding.status === "closed"
                                                            ? "secondary"
                                                            : bid.Bidding.status === "active"
                                                                ? "default"
                                                                : "outline"
                                                    }
                                                    className="text-xs"
                                                >
                                                    {bid.Bidding.status === "closed"
                                                        ? t('buyerDashboard.biddingStatusClosed')
                                                        : bid.Bidding.status === "active"
                                                            ? t('buyerDashboard.biddingStatusActive')
                                                            : t('buyerDashboard.biddingStatusPending')}
                                                </Badge>
                                            </div>
                                        </CardHeader>

                                        {/* Content */}
                                        <CardContent className="p-6 space-y-6">

                                            {/* Allowed Bid Types */}
                                            {(bid.Bidding.allowWholePrice || bid.Bidding.allowWeightPrice) && (
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                                        {t('biddingStep.allowedBidTypes')}
                                                    </p>
                                                    <div className="flex gap-2 mt-1">
                                                        {bid.Bidding.allowWholePrice && (
                                                            <Badge variant="outline">{t('biddingStep.wholePrice')}</Badge>
                                                        )}
                                                        {bid.Bidding.allowWeightPrice && (
                                                            <Badge variant="outline">{t('biddingStep.priceByWeight')}</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Buyer Bids Table */}
                                            <div className="overflow-x-auto mt-6">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-border">
                                                            <th className="py-2 px-4 text-sm font-semibold text-muted-foreground">{t('buyerDashboard.bidType')}</th>
                                                            <th className="py-2 px-4 text-sm font-semibold text-muted-foreground">{t('buyerDashboard.amount')}</th>
                                                            <th className="py-2 px-4 text-sm font-semibold text-muted-foreground">{t('buyerDashboard.status')}</th>
                                                            <th className="py-2 px-4 text-sm font-semibold text-muted-foreground">{t('buyerDashboard.notes')}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {wholeItemBid && (
                                                            <tr key={wholeItemBid.buyer_bid_id} className="border-b border-border">
                                                                <td className="py-2 px-4 text-sm">{t('biddingStep.wholePrice')}</td>
                                                                <td className="py-2 px-4 text-sm font-semibold">
                                                                    {wholeItemBid.amount
                                                                        ? `${bid.Bidding.currency === "TWD" ? "NT$" : "$"}${Number(wholeItemBid.amount).toLocaleString()}`
                                                                        : "-"}
                                                                </td>
                                                                <td className="py-2 px-4 text-sm font-medium">
                                                                    {wholeItemBid.status === "accepted"
                                                                        ? <span className="text-green-600">{t('admin.buyerDetails.accepted')}</span>
                                                                        : wholeItemBid.status === "rejected"
                                                                            ? <span className="text-red-600">{t('admin.buyerDetails.rejected')}</span>
                                                                            : <span className="text-gray-600">{t('admin.buyerDetails.pending')}</span>}
                                                                </td>
                                                                <td className="py-2 px-4 text-sm">{wholeItemBid.notes || "-"}</td>
                                                            </tr>
                                                        )}

                                                        {weightBid && (
                                                            <tr key={weightBid.buyer_bid_id} className="border-b border-border">
                                                                <td className="py-2 px-4 text-sm">{t('biddingStep.priceByWeight')}</td>
                                                                <td className="py-2 px-4 text-sm font-semibold">
                                                                    {weightBid.weight_quotations
                                                                        ? Object.entries(weightBid.weight_quotations)
                                                                            .map(([key, value]) => `${key}: ${value}`)
                                                                            .join(", ")
                                                                        : "-"}
                                                                </td>
                                                                <td className="py-2 px-4 text-sm font-medium">
                                                                    {weightBid.status === "accepted"
                                                                        ? <span className="text-green-600">{t('admin.buyerDetails.accepted')}</span>
                                                                        : weightBid.status === "rejected"
                                                                            ? <span className="text-red-600">{t('admin.buyerDetails.rejected')}</span>
                                                                            : <span className="text-gray-600">{t('admin.buyerDetails.pending')}</span>}
                                                                </td>
                                                                <td className="py-2 px-4 text-sm">{weightBid.notes || "-"}</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Keep existing content for required docs, inspection, additional notes... */}
                                        </CardContent>
                                    </>
                                )}
                            </Card>




                            {/* Products Section */}
                            <Card className="shadow-lg border-0 overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-5 h-5 text-primary" />
                                            <CardTitle>{t('buyerDashboard.productsInBatch') || "Products in Batch"}</CardTitle>
                                        </div>
                                        <Badge variant="secondary" className="text-sm">
                                            {products.length} {products.length === 1 ? t('buyerDashboard.itemSingular') : t('buyerDashboard.itemPlural')}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {products.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {products.map((product: any) => {
                                                const seller = product.meta?.find((m: any) => m.meta_key === "seller_name")?.meta_value;
                                                const conditionRaw = product.meta?.find(
                                                    (m: any) => m.meta_key === "condition"
                                                )?.meta_value;

                                                const operationStatusRaw = product.meta?.find(
                                                    (m: any) => m.meta_key === "operation_status"
                                                )?.meta_value;

                                                const condition = extractValuesFromPhpSerialized(conditionRaw)[0] || null;
                                                const operationStatus = extractValuesFromPhpSerialized(operationStatusRaw)[0] || null;

                                                const image = product.attachments?.[0]?.url;

                                                // Get translated title and description based on current language
                                                const translatedTitle = getTranslatedMeta(product.meta, 'title', i18n.language) || product.title || `Product #${product.product_id}`;
                                                const translatedDescription = getTranslatedMeta(product.meta, 'description', i18n.language) || product.description || null;

                                                return (
                                                    <Card
                                                        key={`${product.product_id}-${i18n.language}`}
                                                        className="overflow-hidden hover:shadow-md transition-shadow border"
                                                    >
                                                        <div className="flex gap-4 p-4">
                                                            {image ? (
                                                                <img
                                                                    src={image}
                                                                    alt={translatedTitle}
                                                                    className="w-24 h-24 object-cover rounded-lg border"
                                                                />
                                                            ) : (
                                                                <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                                                                    <Package className="w-8 h-8 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                                                                    {translatedTitle}
                                                                </h3>
                                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                                    {translatedDescription || t('buyerDashboard.noDescriptionAvailable')}
                                                                </p>
                                                                <div className="space-y-1 text-sm">
                                                                    {seller && (
                                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                                            <User className="w-3.5 h-3.5" />
                                                                            <span className="truncate">{seller}</span>
                                                                        </div>
                                                                    )}
                                                                    {condition && (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <Badge variant="outline" className="text-xs">
                                                                                {condition}
                                                                            </Badge>
                                                                        </div>
                                                                    )}
                                                                    {operationStatus && (
                                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                                            <Info className="w-3.5 h-3.5" />
                                                                            <span className="truncate">{operationStatus}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground">{t('buyerDashboard.noProductsFound')}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar Column */}
                        <div className="space-y-6">
                            {/* Inspection Details */}
                            <Card className="shadow-lg border-0 overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-blue-500/5 to-blue-500/10 border-b">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                        <CardTitle>{t('buyerDashboard.inspectionDetails') || "Inspection Details"}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {inspection ? (
                                        <div className="space-y-4">
                                            {inspection.schedule?.[0]?.date && (
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t('buyerDashboard.date')}</p>
                                                    <p className="text-sm font-semibold flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-blue-600" />
                                                        {formatDate(inspection.schedule[0].date)}
                                                    </p>
                                                </div>
                                            )}
                                            {inspection.schedule?.[0]?.slots?.[0]?.time && (
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t('buyerDashboard.time')}</p>
                                                    <p className="text-sm font-semibold flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-blue-600" />
                                                        {formatTimeSlot(inspection.schedule[0].slots[0].time)}
                                                    </p>
                                                </div>
                                            )}
                                            {inspection.registration?.company_name && (
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t('buyerDashboard.company')}</p>
                                                    <p className="text-sm font-semibold flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 text-blue-600" />
                                                        {inspection.registration.company_name}
                                                    </p>
                                                </div>
                                            )}
                                            {inspection.registration?.slot && (
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t('buyerDashboard.selectedSlot')}</p>
                                                    <Badge variant="outline" className="mt-1">
                                                        {formatTimeSlot(inspection.registration.slot)}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                            <p className="text-sm text-muted-foreground">{t('buyerDashboard.noInspectionScheduled')}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* payment details */}
                            <Card className="shadow-lg border-0 overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-green-500/5 to-green-500/10 border-b">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-5 h-5 text-green-600" />
                                            <CardTitle>{t('buyerDashboard.paymentDetails') || "Payment Details"}</CardTitle>
                                        </div>
                                        {bidStatus === 'accepted' && !payment && (
                                            <Badge variant="destructive" className="text-xs">{t('buyerDashboard.paymentPending')}</Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {payment ? (
                                        <div className="space-y-4">
                                            {payment.payment_id && (
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t('buyerDashboard.paymentId')}</p>
                                                    <p className="text-sm font-semibold font-mono">{payment.payment_id}</p>
                                                </div>
                                            )}
                                            {payment.payment_method && (
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t('buyerDashboard.paymentMethod')}</p>
                                                    <p className="text-sm font-semibold">{payment.payment_method}</p>
                                                </div>
                                            )}
                                            {payment.transaction_number && (
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t('buyerDashboard.transactionId')}</p>
                                                    <p className="text-sm font-semibold font-mono break-all">{payment.transaction_number}</p>
                                                </div>
                                            )}
                                            {payment.createdAt && (
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t('buyerDashboard.paymentDate')}</p>
                                                    <p className="text-sm font-semibold flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-green-600" />
                                                        {formatDate(payment.createdAt)}
                                                    </p>
                                                </div>
                                            )}
                                            {/* <a href={payment?.payment_proof_url} target="_blank" rel="noopener noreferrer">
                                            <img
                                                src={payment?.payment_proof_url}
                                                alt="Payment Proof"
                                                className="w-64 h-auto cursor-pointer"
                                            />
                                        </a> */}
                                            <div className="pt-2">
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                                    {t('buyerDashboard.paymentCompleted')}
                                                </Badge>
                                            </div>
                                        </div>
                                    ) : bidStatus === 'accepted' ? (
                                        <div className="space-y-4">
                                            <div className="text-center py-4">
                                                <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    {t('buyerDashboard.completePaymentMessage')}
                                                </p>
                                                <Button
                                                    className="w-full"
                                                    onClick={() => setIsPaymentDialogOpen(true)}
                                                    size="lg"
                                                >
                                                    <CreditCard className="w-4 h-4 mr-2" />
                                                    {t('buyerDashboard.completePayment')}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                            <p className="text-sm text-muted-foreground">
                                                {t('buyerDashboard.paymentNotRequired')}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>


                            {/* pickup Details */}
                            <Card className="shadow-lg border-0 overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-accent/5 to-accent/10 border-b">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-accent" />
                                        <CardTitle>
                                            {t('buyerDashboard.pickupDetails')}
                                        </CardTitle>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        {/* Pickup Date */}
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground font-medium">
                                                {t('buyerDashboard.pickupDate')}
                                            </p>
                                            <p className="text-lg font-semibold">
                                                {paymentDetail?.pickup_date
                                                    ? formatDate(paymentDetail.pickup_date)
                                                    : t('buyerDashboard.notAvailable')}
                                            </p>
                                        </div>

                                        {/* Pickup Time */}
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground font-medium">
                                                {t('buyerDashboard.pickupTime')}
                                            </p>
                                            <p className="text-lg font-semibold">
                                                {paymentDetail?.pickup_time ? formatTimeSlot(paymentDetail.pickup_time) : t('buyerDashboard.notAvailable')}
                                            </p>
                                        </div>

                                        {/* Delivery */}
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground font-medium">
                                                {t('buyerDashboard.delivery')}
                                            </p>
                                            <p className="text-lg font-semibold">
                                                {paymentDetail?.is_delivery
                                                    ? t('buyerDashboard.yes')
                                                    : t('buyerDashboard.no')}
                                            </p>
                                        </div>

                                    </div>
                                </CardContent>
                            </Card>



                        </div>
                    </div>
                </div>

                {/* Payment Dialog */}
                <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                {t('buyerDashboard.paymentDialogTitle')}
                            </DialogTitle>
                            <DialogDescription>
                                {t('buyerDashboard.paymentDialogDescription')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="transaction_number">{t('buyerDashboard.transactionNumber')} *</Label>
                                <Input
                                    id="transaction_number"
                                    name="transaction_number"
                                    value={paymentData.transaction_number}
                                    onChange={handlePaymentChange}
                                    placeholder={t('buyerDashboard.transactionNumberPlaceholder')}
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="payment_method">{t('buyerDashboard.paymentMethod')} *</Label>
                                <Input
                                    id="payment_method"
                                    name="payment_method"
                                    value={paymentData.payment_method}
                                    onChange={handlePaymentChange}
                                    placeholder={t('buyerDashboard.paymentMethodPlaceholder')}
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="payment_proof">{t('buyerDashboard.paymentProof') || "Payment Proof"} *</Label>
                                <Input
                                    id="payment_proof"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="h-11 pt-2"
                                />
                            </div>
                        </div>
                        <DialogFooter className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)} disabled={isSubmitting}>
                                {t('buyerDashboard.cancel')}
                            </Button>
                            <Button onClick={handlePaymentSubmit} disabled={isSubmitting} className="min-w-[120px]">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {t('buyerDashboard.submitting')}
                                    </>
                                ) : (
                                    t('buyerDashboard.submitPayment')
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
    );
}