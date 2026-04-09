import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  Package,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Activity,
  FileText,
  Zap,
  Sparkles,
  Trash2,
  Bell,
  CreditCard,
  Truck,
  Gavel,
  ArrowRight,
  CircleCheck,
  BarChart3,
  TableProperties,
} from "lucide-react";
import {
  useGetSellerDashboardQuery,
  useGetSellerBidsQuery,
} from "@/rtk/slices/batchApiSlice";
import {
  useGetPendingInvitationsQuery,
  useAcceptNetworkInvitationMutation,
} from "@/rtk/slices/sellerNetworkSlice";
import { cn } from "@/lib/utils";
import { subscribeSellerEvents } from "@/socket/sellerEvents";
import DashboardLayout from "@/components/layouts/DashboardLayout.js";
import toast from "react-hot-toast";
import axios from "axios";
import TransactionCharts from "../Seller/TransactionCharts";
import CategoryAndRevenueCharts from "../Seller/CategoryAndRevenueCharts";
import { getSocket } from "@/services/socket";

const statusColors: Record<string, string> = {
  live_for_bids: "bg-accent/10 text-accent border-accent/20",
  inspection_schedule: "bg-info/10 text-info border-info/20",
  under_review: "bg-warning/10 text-warning border-warning/20",
  sold: "bg-success/10 text-success border-success/20",
  publish: "bg-info/10 text-info border-info/20",
};

/* ─── Action Required (Seller) ──────────────────────────────────── */
const SellerActionRequired = ({
  recentActivity,
  sellerBids,
  navigate,
}: {
  recentActivity: any[];
  sellerBids: any[];
  navigate: ReturnType<typeof useNavigate>;
}) => {
  // Batches with active bidding that have bids to review
  const liveWithBids = sellerBids.filter(
    (b: any) =>
      b.status === "live_for_bids" && (b.summary?.total ?? 0) > 0
  );

  // Batches at step 6 → winner selected, awaiting buyer payment
  const awaitingPayment = recentActivity.filter((item: any) => item.step === 6);

  // Batches at step 7 → payment confirmed, seller must enter pickup details
  const pickupDetails = recentActivity.filter((item: any) => item.step === 7);

  // Batches at step 8 → pickup scheduled, seller can mark complete
  const readyToComplete = recentActivity.filter((item: any) => item.step === 8);

  const total =
    liveWithBids.length +
    awaitingPayment.length +
    pickupDetails.length +
    readyToComplete.length;

  if (total === 0) return null;

  return (
    <div className="rounded border border-amber-200 bg-amber-50/50 px-3 py-2.5">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="w-3.5 h-3.5 text-amber-600" />
        <h2 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
          Action Required
        </h2>
        <Badge className="bg-amber-500 text-white border-0 text-[10px] h-4 px-1.5">{total}</Badge>
      </div>

      <div className="space-y-1">
        {/* New bids to review */}
        {liveWithBids.map((batch: any) => (
          <div
            key={batch.batch_id}
            onClick={() => navigate("/dashboard/bids")}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 cursor-pointer hover:bg-amber-100/60 transition-colors group"
          >
            <Gavel className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
            <span className="text-xs font-medium text-foreground flex-1 truncate">
              Review bids — Batch #{batch.batch_id} ({batch.summary?.total ?? 0} bid{(batch.summary?.total ?? 0) !== 1 ? "s" : ""})
            </span>
            <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        ))}

        {/* Awaiting payment verification */}
        {awaitingPayment.map((item: any) => (
          <div
            key={item.batchId}
            onClick={() => navigate(`/upload?step=6&batchId=${item.batchId}`)}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 cursor-pointer hover:bg-amber-100/60 transition-colors group"
          >
            <CreditCard className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
            <span className="text-xs font-medium text-foreground flex-1 truncate">
              Verify payment — {item.first_product_title || `Batch #${item.batchId}`}
            </span>
            <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        ))}

        {/* Enter pickup details */}
        {pickupDetails.map((item: any) => (
          <div
            key={item.batchId}
            onClick={() => navigate(`/upload?step=7&batchId=${item.batchId}`)}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 cursor-pointer hover:bg-amber-100/60 transition-colors group"
          >
            <Truck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span className="text-xs font-medium text-foreground flex-1 truncate">
              Enter pickup details — {item.first_product_title || `Batch #${item.batchId}`}
            </span>
            <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        ))}

        {/* Mark pickup complete */}
        {readyToComplete.map((item: any) => (
          <div
            key={item.batchId}
            onClick={() => navigate(`/upload?step=8&batchId=${item.batchId}`)}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 cursor-pointer hover:bg-amber-100/60 transition-colors group"
          >
            <CircleCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span className="text-xs font-medium text-foreground flex-1 truncate">
              Mark complete — {item.first_product_title || `Batch #${item.batchId}`}
            </span>
            <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Deal Pipeline ──────────────────────────────────────────────── */
const PipelineSummary = ({
  counts,
  recentActivity,
  navigate,
}: {
  counts: any;
  recentActivity: any[];
  navigate: ReturnType<typeof useNavigate>;
}) => {
  const winnerSelected = recentActivity.filter(
    (item: any) => item.step >= 6 && item.step <= 8
  ).length;
  const awaitingPayment = recentActivity.filter(
    (item: any) => item.step === 6
  ).length;
  const pickupStage = recentActivity.filter(
    (item: any) => item.step === 7 || item.step === 8
  ).length;

  const stages = [
    {
      label: "Active Listings",
      count: counts.totalCurrentLiveBids ?? 0,
      icon: Gavel,
      bg: "bg-violet-100",
      text: "text-violet-700",
      border: "border-violet-200",
      onClick: () => navigate("/dashboard/submissions?type=live"),
    },
    {
      label: "Total Bids",
      count: counts.totalBuyerBids ?? 0,
      icon: TrendingUp,
      bg: "bg-blue-100",
      text: "text-blue-700",
      border: "border-blue-200",
      onClick: () => navigate("/dashboard/bids"),
    },
    {
      label: "Winner Selected",
      count: winnerSelected,
      icon: CheckCircle2,
      bg: "bg-amber-100",
      text: "text-amber-700",
      border: "border-amber-200",
      onClick: () => navigate("/dashboard/bids"),
    },
    {
      label: "Awaiting Payment",
      count: awaitingPayment,
      icon: CreditCard,
      bg: "bg-orange-100",
      text: "text-orange-700",
      border: "border-orange-200",
      onClick: () => navigate("/dashboard/bids"),
    },
    {
      label: "Pickup Stage",
      count: pickupStage,
      icon: Truck,
      bg: "bg-sky-100",
      text: "text-sky-700",
      border: "border-sky-200",
      onClick: () => navigate("/dashboard/bids"),
    },
    {
      label: "Deals Closed",
      count: counts.closedBids ?? 0,
      icon: CircleCheck,
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      border: "border-emerald-200",
      onClick: () => navigate("/dashboard/submissions?type=completed"),
    },
  ];

  return (
    <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="border-b border-border/50 pb-3 px-4 pt-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-accent/10 text-accent">
            <BarChart3 className="w-4 h-4" />
          </div>
          <CardTitle className="text-lg font-bold text-foreground">
            Deal Pipeline
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {stages.map((stage, i) => {
            const Icon = stage.icon;
            return (
              <button
                key={i}
                onClick={stage.onClick}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all hover:shadow-sm hover:-translate-y-0.5 group",
                  stage.border,
                  "bg-white hover:bg-muted/20"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                    stage.bg
                  )}
                >
                  <Icon className={cn("w-5 h-5", stage.text)} />
                </div>
                <p className="text-2xl font-bold text-foreground leading-none">
                  {stage.count}
                </p>
                <p className="text-xs text-muted-foreground text-center leading-tight">
                  {stage.label}
                </p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

/* ─── Recent Bids Feed ───────────────────────────────────────────── */
const RecentBidsFeed = ({
  sellerBids,
  navigate,
}: {
  sellerBids: any[];
  navigate: ReturnType<typeof useNavigate>;
}) => {
  const recent = sellerBids.slice(0, 5);

  if (recent.length === 0) return null;

  return (
    <Card className="border-border/50 hover:border-border transition-colors shadow-sm">
      <CardHeader className="border-b border-border/50 pb-2 px-3 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-muted text-foreground/70">
              <Gavel className="w-3.5 h-3.5" />
            </div>
            <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wide">
              Recent Bids Received
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard/bids")}
            className="text-[11px] text-muted-foreground hover:text-foreground h-7 px-2"
          >
            View All
            <ArrowUpRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {recent.map((batch: any) => {
            const firstProduct = batch.products?.[0];
            const firstImage = firstProduct?.images?.[0];
            const totalBids = batch.summary?.total ?? 0;
            const pendingBids = batch.summary?.pending ?? 0;
            const acceptedBids = batch.summary?.accepted ?? 0;

            return (
              <div
                key={batch.batch_id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-secondary/50 transition-all duration-200 cursor-pointer group"
                onClick={() => navigate("/dashboard/bids")}
              >
                {/* Thumbnail */}
                <div className="w-8 h-8 rounded border border-border overflow-hidden flex-shrink-0 bg-muted">
                  {firstImage ? (
                    <img
                      src={firstImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-muted-foreground opacity-40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {firstProduct?.title ?? `Batch #${batch.batch_id}`}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground font-mono">
                      Batch #{batch.batch_id}
                    </span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0 border",
                        statusColors[batch.status] ?? "bg-secondary"
                      )}
                    >
                      {batch.status?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>

                {/* Bid counts */}
                <div className="flex items-center gap-3 flex-shrink-0 text-right">
                  <div>
                    <p className="text-base font-bold text-accent">{totalBids}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {totalBids === 1 ? "bid" : "bids"}
                    </p>
                  </div>
                  {pendingBids > 0 && (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                      {pendingBids} pending
                    </Badge>
                  )}
                  {acceptedBids > 0 && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                      Winner selected
                    </Badge>
                  )}
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
const DashboardHome = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Make sellerId reactive to localStorage changes (for company switching)
  const [companySellerIdStr, setCompanySellerIdStr] = useState(
    localStorage.getItem("companySellerId") || localStorage.getItem("userId")
  );
  const sellerId = companySellerIdStr ? Number(companySellerIdStr) : 0;

  const { data, isLoading, isError, refetch } =
    useGetSellerDashboardQuery(sellerId);

  // Fetch bids for pipeline + recent bids feed + action required
  const { data: sellerBidsData, refetch: refetchSellerBids } =
    useGetSellerBidsQuery(
      { userId: companySellerIdStr || "", page: 1, limit: 50 },
      { skip: !companySellerIdStr }
    );
  const sellerBids: any[] = sellerBidsData?.data ?? [];

  // Fetch pending invitations for the seller
  const { data: pendingInvitationsData, refetch: refetchInvitations } =
    useGetPendingInvitationsQuery();
  const [acceptInvitation, { isLoading: accepting }] =
    useAcceptNetworkInvitationMutation();

  // Listen for company switches to update sellerId
  useEffect(() => {
    const handleCompanySwitch = () => {
      const newCompanySellerId =
        localStorage.getItem("companySellerId") ||
        localStorage.getItem("userId");
      setCompanySellerIdStr(newCompanySellerId);
    };

    window.addEventListener("companySwitched", handleCompanySwitch);
    window.addEventListener("storage", handleCompanySwitch);

    return () => {
      window.removeEventListener("companySwitched", handleCompanySwitch);
      window.removeEventListener("storage", handleCompanySwitch);
    };
  }, []);

  // Refetch dashboard data when sellerId changes (company switch)
  useEffect(() => {
    if (sellerId) {
      refetch();
      refetchSellerBids();
    }
  }, [sellerId, refetch, refetchSellerBids]);

  useEffect(() => {
    const unsub = subscribeSellerEvents(() => {
      refetch();
      refetchInvitations();
      refetchSellerBids();
    });

    return unsub;
  }, [refetch, refetchInvitations, refetchSellerBids]);

  useEffect(() => {
    const socket = getSocket();

    const handleInvitationUpdate = () => {
      refetchInvitations();
    };

    socket.on("network_invitation_sent", handleInvitationUpdate);
    socket.on("network_invitation_accepted", handleInvitationUpdate);
    socket.on("seller_added_to_network", handleInvitationUpdate);

    return () => {
      socket.off("network_invitation_sent", handleInvitationUpdate);
      socket.off("network_invitation_accepted", handleInvitationUpdate);
      socket.off("seller_added_to_network", handleInvitationUpdate);
    };
  }, [refetchInvitations]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
          <div
            className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-accent-light rounded-full animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          ></div>
        </div>
      </div>
    );

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Activity className="w-8 h-8 text-destructive" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {t("errors.dashboardLoadError", "Error loading dashboard")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("errors.tryRefresh", "Please try refreshing the page")}
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          {t("common.retry", "Retry")}
        </Button>
      </div>
    );
  }

  const { counts, recentActivity } = data;

  const stats = [
    {
      key: "totalSubmissions",
      name: "totalSubmissions",
      value: counts.totalSubmissions,
      currentValue: "totalSubmissions",
      currentData: counts.totalSubmissions,
      icon: Package,
      iconBg: "bg-muted",
      iconColor: "text-foreground/70",
      queryType: "all",
    },
    {
      key: "totalInspections",
      name: "totalInspections",
      value: counts.totalInspectionRegistrations,
      currentValue: "totalCurrentInspectionBids",
      currentData: counts.totalCurrentInspectionBids,
      icon: Clock,
      iconBg: "bg-muted",
      iconColor: "text-foreground/70",
      queryType: "inspection",
    },
    {
      key: "activeBids",
      name: "activeBids",
      value: counts.totalBuyerBids,
      currentData: counts.totalCurrentLiveBids,
      currentValue: "totalCurrentLiveBids",
      icon: TrendingUp,
      iconBg: "bg-muted",
      iconColor: "text-foreground/70",
      queryType: "live",
    },
    {
      key: "closedBids",
      name: "closedBids",
      value: counts.closedBids,
      currentValue: "totalCurrentClosedBids",
      currentData: counts.totalCurrentClosedBids,
      icon: CheckCircle2,
      iconBg: "bg-muted",
      iconColor: "text-foreground/70",
      queryType: "completed",
    },
  ];

  const quickActions = [
    {
      label: t("sellerDashboard.actions.submitScrap"),
      icon: Package,
      onClick: () => navigate("/upload?type=scrap"),
      color: "hover:bg-info/5 hover:text-info hover:border-info/20",
    },
    {
      label: t("sellerDashboard.actions.sourceEquipment"),
      icon: Zap,
      onClick: () => navigate("/dashboard/submissions"),
      color: "hover:bg-accent/5 hover:text-accent hover:border-accent/20",
    },
    {
      label: t("sellerDashboard.actions.viewReports"),
      icon: FileText,
      onClick: () => navigate("/dashboard/reports"),
      color: "hover:bg-success/5 hover:text-success hover:border-success/20",
    },
  ];

  const handleDeactivate = async (batchId: any) => {
    const confirmAction = window.confirm(
      "Are you sure you want to deactivate this batch?"
    );
    if (!confirmAction) return;

    try {
      await axios.patch(
        `https://api.101recycle.greenbidz.com/api/v1/batch/deactivate/${batchId}`
      );

      toast.success("Batch deactivated!");
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      const msg =
        error.response?.data?.message || "Failed to deactivate batch";
      toast.error(msg);
    }
  };

  return (
    <DashboardLayout onNewBid={() => { refetch(); refetchSellerBids(); }}>
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-7 bg-gradient-to-b from-accent to-accent-light rounded-full"></div>
              <h1 className="text-3xl font-bold text-foreground">
                {t("sellerDashboard.title")}
              </h1>
            </div>
          </div>

          <Button
            onClick={() => navigate("/upload?step=1")}
            size="lg"
            className="group relative overflow-hidden bg-gradient-to-r from-accent to-accent-light text-white shadow-[0_0_20px_-5px_hsl(var(--accent)/0.4)] hover:shadow-[0_0_28px_-4px_hsl(var(--accent)/0.55)] transition-all duration-300 hover:scale-[1.03]"
          >
            <Sparkles className="w-4 h-4 mr-2 group-hover:animate-pulse" />
            {t("sellerDashboard.newSubmission")}
          </Button>
        </div>

        {/* Pending Invitations Notification */}
        {pendingInvitationsData?.success &&
          pendingInvitationsData?.data?.length > 0 && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-orange-900">
                        {t(
                          "dashboard.pendingInvitations",
                          "You have pending organization invitations"
                        )}
                      </p>
                      <p className="text-sm text-orange-700">
                        {pendingInvitationsData.data.length}{" "}
                        {pendingInvitationsData.data.length === 1
                          ? t("dashboard.invitation", "invitation")
                          : t("dashboard.invitations", "invitations")}{" "}
                        {t(
                          "dashboard.waitingApproval",
                          "waiting for your approval"
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {pendingInvitationsData.data
                      .slice(0, 2)
                      .map((invitation: any) => (
                        <div
                          key={invitation.network_id}
                          className="flex items-center gap-2"
                        >
                          <span className="text-sm text-orange-800">
                            {invitation.mainSeller?.display_name ||
                              invitation.mainSeller?.user_email}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                await acceptInvitation({
                                  networkId: invitation.network_id,
                                }).unwrap();
                                toast.success(
                                  t(
                                    "dashboard.invitationAccepted",
                                    "Invitation accepted successfully"
                                  )
                                );
                                refetchInvitations();
                              } catch (error: any) {
                                toast.error(
                                  error?.data?.message ||
                                  t(
                                    "dashboard.invitationAcceptError",
                                    "Failed to accept invitation"
                                  )
                                );
                              }
                            }}
                            disabled={accepting}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            {t("dashboard.accept", "Accept")}
                          </Button>
                        </div>
                      ))}
                    {pendingInvitationsData.data.length > 2 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate("/organization")}
                        className="text-orange-600 border-orange-200 hover:bg-orange-50"
                      >
                        {t("dashboard.viewAll", "View All")}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        {/* ── Action Required ─────────────────────────────────── */}
        <SellerActionRequired
          recentActivity={recentActivity ?? []}
          sellerBids={sellerBids}
          navigate={navigate}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.key}
                className="group border-border/50 hover:border-border transition-all duration-200 hover:shadow-sm cursor-pointer bg-card"
                onClick={() =>
                  navigate(`/dashboard/submissions?type=${stat.queryType}`)
                }
              >
                <CardContent className="flex items-center gap-3 p-2.5">
                  <div
                    className={`p-1.5 rounded ${stat.iconBg} flex-shrink-0`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${stat.iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-xl font-bold text-accent leading-none tabular-nums">
                        {stat.value}
                      </h3>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5 font-mono">
                      {t(stat.name)} · {t(`sellerDashboard.stats.${stat.currentValue}`)}{" "}
                      {stat?.currentData}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Deal Pipeline ─────────────────────────────────────── */}
        {/* <PipelineSummary
          counts={counts}
          recentActivity={recentActivity ?? []}
          navigate={navigate}
        /> */}

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Recent Activity */}
          <Card className="lg:col-span-2 border-border/50 hover:border-border transition-colors shadow-sm">
            <CardHeader className="border-b border-border/50 pb-2 px-3 pt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-muted text-foreground/70">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wide">
                    {t("sellerDashboard.recentActivity")}
                  </CardTitle>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/dashboard/submissions")}
                  className="text-[11px] text-muted-foreground hover:text-foreground h-7 px-2"
                >
                  {t("sellerDashboard.viewAll")}
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {recentActivity && recentActivity.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {recentActivity.map((item: any) => {
                    return (
                      <div
                        key={item.batch_number}
                        className="group px-3 py-2 hover:bg-secondary/50 transition-all duration-200 cursor-pointer"
                        onClick={() =>
                          navigate(
                            `/upload?step=${item.step}&batchId=${item.batchId}`
                          )
                        }
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0"></div>

                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="font-semibold text-foreground text-xs truncate font-mono">
                                {item.batch_number}
                              </span>

                              <span className="font-medium text-foreground text-xs truncate">
                                {item?.first_product_title}
                              </span>

                              <Badge
                                variant="outline"
                                className={`${statusColors[item.status] ?? "bg-secondary"
                                  } border text-[10px] px-1.5 py-0`}
                              >
                                {t(`${item.status}`)}
                              </Badge>
                              {item.approval_status === "pending" ? (
                                <Badge
                                  variant="outline"
                                  className="text-amber-600 border-amber-500/30 text-xs px-2 py-0"
                                >
                                  {t("sellerDashboard.notApproved", "Not approved")}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-emerald-600 border-emerald-500/30 text-xs px-2 py-0"
                                >
                                  {t("sellerDashboard.approved", "Approved")}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end space-y-1">
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.updated_at).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" }
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.updated_at).toLocaleTimeString(
                                "en-US",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </p>
                            <Button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleDeactivate(item.batchId);
                               }}
                               className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                               size="sm"
                             >
                               <Trash2 size={14} />
                             </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("sellerDashboard.noRecentActivity")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border/50 hover:border-border transition-colors shadow-sm">
            <CardHeader className="border-b border-border/50 pb-2 px-3 pt-3">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-muted text-foreground/70">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wide">
                  {t("sellerDashboard.quickActions")}
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-2.5 space-y-1.5">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className={`w-full justify-start h-auto py-2.5 px-3 group transition-all duration-200 ${action.color} border-border/50 hover:border-current text-sm`}
                    onClick={action.onClick}
                  >
                    <Icon className="w-4 h-4 mr-2.5" />
                    <span className="font-medium">{action.label}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100" />
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* ── Recent Bids Feed ───────────────────────────────────── */}
        {sellerBids.length > 0 && (
          <RecentBidsFeed sellerBids={sellerBids} navigate={navigate} />
        )}

        <TransactionCharts />
        <CategoryAndRevenueCharts />
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;