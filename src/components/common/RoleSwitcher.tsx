// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store, Building2, Loader2, Lock, Crown, CheckCircle2,
  ArrowLeftRight, Clock, XCircle, ChevronRight, ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSocket } from "@/services/socket";
import { useTranslation } from "react-i18next";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSubmitSellerUpgradeRequestMutation, useGetMySellerUpgradeStatusQuery } from "@/rtk/slices/apiSlice";
import { toastSuccess, toastError } from "@/helper/toasterNotification";

interface RoleSwitcherProps {
  variant?: "default" | "segmented";
}


function UpgradeModal({
  open,
  onClose,
  isZh,
  existingRequest,
  isSubmitting,
  onSubmit,
}: any) {
  const statusMap = {
    pending: {
      icon: <Clock className="w-6 h-6 text-amber-500" />,
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-800",
      title: isZh ? "申請審核中" : "Request Under Review",
      body: isZh
        ? "您的賣家申請正在等待管理員審核，審核結果將寄送至您的信箱。"
        : "Your seller request is being reviewed. You'll be notified by email once processed.",
    },
    approved: {
      icon: <CheckCircle2 className="w-6 h-6 text-green-500" />,
      bg: "bg-green-50 border-green-200",
      text: "text-green-800",
      title: isZh ? "申請已通過" : "Request Approved",
      body: isZh
        ? "您已通過審核，現在可以直接切換至賣家模式。"
        : "You've been approved! You can now switch to Seller mode directly.",
    },
    rejected: {
      icon: <XCircle className="w-6 h-6 text-red-500" />,
      bg: "bg-red-50 border-red-200",
      text: "text-red-800",
      title: isZh ? "申請未通過" : "Request Not Approved",
      body: isZh ? "您的申請未通過，您可以重新提交。" : "Your request was not approved. You can submit a new request.",
    },
  };

  const canApply = !existingRequest || existingRequest.status === "rejected";
  const statusInfo = existingRequest ? statusMap[existingRequest.status] : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 border border-border bg-background overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Crown className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            {isZh ? "申請成為賣家" : "Become a Seller"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1.5">
            {isZh
              ? "提交申請後，管理員將審核您的帳戶並授予賣家權限。"
              : "Submit a request and our team will review your account to grant seller access."}
          </DialogDescription>
        </div>

        {/* Status banner */}
        {statusInfo && (
          <div className={cn("mx-6 mb-4 flex items-start gap-3 p-4 rounded-xl border", statusInfo.bg)}>
            <div className="shrink-0">{statusInfo.icon}</div>
            <div>
              <p className={cn("text-sm font-semibold", statusInfo.text)}>{statusInfo.title}</p>
              {statusInfo.body && (
                <p className={cn("text-xs mt-1 leading-relaxed", statusInfo.text, "opacity-80")}>{statusInfo.body}</p>
              )}
              {existingRequest?.status === "rejected" && existingRequest.admin_notes && (
                <p className={cn("text-xs mt-1 font-medium", statusInfo.text)}>
                  {isZh ? "原因：" : "Reason: "}{existingRequest.admin_notes}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          {canApply && (
            <Button
              onClick={onSubmit}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />{isZh ? "送出中..." : "Submitting..."}</>
                : <><ChevronRight className="w-4 h-4" />{isZh ? "送出申請" : "Request to Become a Seller"}</>
              }
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            {isZh ? "稍後再說" : "Maybe later"}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}

export default function RoleSwitcher({ variant = "default" }: RoleSwitcherProps) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const [switching, setSwitching] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const userId  = localStorage.getItem("userId");
  const jwtRole = localStorage.getItem("jwtRole") || localStorage.getItem("userRole") || "buyer";

  const [submitRequest, { isLoading: isSubmitting }] = useSubmitSellerUpgradeRequestMutation();
  const { data: statusData, refetch: refetchStatus } = useGetMySellerUpgradeStatusQuery(undefined, {
    skip: !userId || jwtRole === "seller",
  });
  const existingRequest = statusData?.data;
  const isVerifiedSeller = jwtRole === "seller" || existingRequest?.status === "approved";

  const storedView      = localStorage.getItem("activeView");
  const currentPath     = window.location.pathname;
  const isBuyerDashboard = currentPath.startsWith("/buyer-dashboard") || currentPath.startsWith("/buyer/");
  const currentRole     = isVerifiedSeller
    ? (storedView === "buyer" || isBuyerDashboard ? "buyer" : "seller")
    : "buyer";

  const handleSwitch = (targetRole: string) => {
    if (targetRole === currentRole || switching) return;

    // Block — open modal instead
    if (targetRole === "seller" && !isVerifiedSeller) {
      setShowUpgradeModal(true);
      return;
    }

    if (targetRole === "seller" && existingRequest?.status === "approved") {
      localStorage.setItem("userRole", "seller");
      localStorage.setItem("jwtRole", "seller");
    }

    setSwitching(true);
    localStorage.setItem("activeView", targetRole);
    const targetPath = targetRole === "buyer" ? "/buyer-dashboard" : "/dashboard";

    try {
      const socket = getSocket();
      if (userId) socket.emit("joinRooms", { user_id: userId, role: targetRole });
    } catch (_) {}

    setTimeout(() => { window.location.href = targetPath; }, 300);
  };

  const handleSubmit = async () => {
    try {
      await submitRequest({}).unwrap();
      toastSuccess(isZh ? "申請已送出，等待管理員審核" : "Request submitted! Admin will review shortly.");
      setShowUpgradeModal(false);
      refetchStatus();
    } catch (err: any) {
      toastError(err?.data?.message || (isZh ? "送出失敗，請稍後再試" : "Failed to submit. Please try again."));
    }
  };

  const modal = (
    <UpgradeModal
      open={showUpgradeModal}
      onClose={() => setShowUpgradeModal(false)}
      isZh={isZh}
      existingRequest={existingRequest}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    />
  );

  // ── Segmented toggle variant ──────────────────────────────────────────────
  if (variant === "segmented") {
    const baseBtn =
      "flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold " +
      "transition-all duration-200 relative " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
      "focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar " +
      "disabled:opacity-60 disabled:cursor-not-allowed";

    return (
      <>
        <div className="flex gap-1 rounded-xl border border-white/[0.07] bg-black/25 p-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          {/* Seller tab */}
          <button
            onClick={() => handleSwitch("seller")}
            disabled={switching}
            aria-pressed={currentRole === "seller"}
            className={cn(
              baseBtn,
              currentRole === "seller"
                ? "bg-accent text-accent-foreground shadow-md shadow-accent/30"
                : "bg-transparent text-sidebar-foreground/70 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground"
            )}
          >
            <Store className="w-4 h-4 shrink-0" />
            <span>{t("dashboard.roleSwitcher.seller", "Seller")}</span>
            {!isVerifiedSeller && currentRole !== "seller" && (
              <Lock className="w-3 h-3 ml-0.5 opacity-60" />
            )}
          </button>

          {/* Buyer tab */}
          <button
            onClick={() => handleSwitch("buyer")}
            disabled={switching}
            aria-pressed={currentRole === "buyer"}
            className={cn(
              baseBtn,
              currentRole === "buyer"
                ? "bg-accent text-accent-foreground shadow-md shadow-accent/30"
                : "bg-transparent text-sidebar-foreground/70 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground"
            )}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span>{t("dashboard.roleSwitcher.buyer", "Buyer")}</span>
          </button>
        </div>
        {modal}
      </>
    );
  }

  // ── Default sidebar variant ───────────────────────────────────────────────
  const targetRole  = currentRole === "buyer" ? "seller" : "buyer";
  const TargetIcon  = currentRole === "buyer" ? Building2 : Store;
  const isLocked    = targetRole === "seller" && !isVerifiedSeller;
  const isPending   = existingRequest?.status === "pending";

  return (
    <>
      <div className="mx-4 mb-4 space-y-2">
        {/* Current mode indicator */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-foreground/5 border border-sidebar-border">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-sidebar-foreground/40 uppercase tracking-wider font-semibold">
              {t("dashboard.roleSwitcher.currentMode", "Current Mode")}
            </p>
            <p className="text-sm font-semibold text-sidebar-foreground capitalize truncate">
              {currentRole === "buyer"
                ? t("dashboard.roleSwitcher.buyerDashboard", "Buyer Dashboard")
                : t("dashboard.roleSwitcher.sellerDashboard", "Seller Dashboard")}
            </p>
          </div>
        </div>

        {/* Switch button */}
        <button
          onClick={() => handleSwitch(targetRole)}
          disabled={switching}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border",
            isLocked
              ? "border-sidebar-border/60 bg-sidebar-foreground/5 text-sidebar-foreground/50 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground/70"
              : "border-accent/30 bg-accent/5 text-accent hover:bg-accent/15 hover:border-accent/50",
            "disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          {switching ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          ) : isLocked ? (
            isPending
              ? <Clock className="w-4 h-4 shrink-0 text-amber-500" />
              : <Lock className="w-4 h-4 shrink-0" />
          ) : (
            <ArrowLeftRight className="w-4 h-4 shrink-0" />
          )}

          <span className="flex-1 text-left text-xs">
            {switching
              ? t("dashboard.roleSwitcher.switching", "Switching...")
              : isLocked
                ? isPending
                  ? (isZh ? "賣家申請審核中..." : "Seller request pending...")
                  : (isZh ? "申請成為賣家" : "Apply to become a seller")
                : t("dashboard.roleSwitcher.switchTo", { role: targetRole })
            }
          </span>

          <TargetIcon className="w-4 h-4 shrink-0 opacity-50" />
        </button>

        {/* Pending badge */}
        {isPending && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Clock className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="text-[11px] text-amber-700 font-medium">
              {isZh ? "申請審核中，請稍候" : "Application under review"}
            </span>
          </div>
        )}
      </div>

      {modal}
    </>
  );
}
