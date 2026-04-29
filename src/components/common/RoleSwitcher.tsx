// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store, Building2, Loader2, Lock, Crown, CheckCircle2,
  ArrowLeftRight, Clock, XCircle, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSocket } from "@/services/socket";
import { useTranslation } from "react-i18next";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSubmitSellerUpgradeRequestMutation, useGetMySellerUpgradeStatusQuery } from "@/rtk/slices/apiSlice";
import { toastSuccess, toastError } from "@/helper/toasterNotification";
import { CountrySelect } from "@/components/common/CountrySelect";

interface RoleSwitcherProps {
  variant?: "default" | "segmented";
}

const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-muted-foreground/60";

function UpgradeModal({
  open,
  onClose,
  isZh,
  existingRequest,
  isSubmitting,
  form,
  setForm,
  onSubmit,
}: any) {
  const statusMap = {
    pending: {
      icon: <Clock className="w-5 h-5 text-amber-500" />,
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-800",
      title: isZh ? "申請審核中" : "Request Under Review",
      body: isZh
        ? "您的賣家申請正在等待管理員審核，審核結果將寄送至您的信箱。"
        : "Your seller request is being reviewed. You'll be notified by email once processed.",
    },
    approved: {
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      bg: "bg-green-50 border-green-200",
      text: "text-green-800",
      title: isZh ? "申請已通過" : "Request Approved",
      body: isZh
        ? "您已通過審核，現在可以直接切換至賣家模式。"
        : "You've been approved! You can now switch to Seller mode directly.",
    },
    rejected: {
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      bg: "bg-red-50 border-red-200",
      text: "text-red-800",
      title: isZh ? "申請未通過" : "Request Not Approved",
      body: null,
    },
  };

  const showForm = !existingRequest || existingRequest.status === "rejected";
  const statusInfo = existingRequest ? statusMap[existingRequest.status] : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 border border-border bg-background overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Crown className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest">
                {isZh ? "賣家申請" : "Seller Access"}
              </p>
              <DialogTitle className="text-base font-bold text-foreground leading-tight">
                {isZh ? "申請成為賣家" : "Become a Seller"}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {isZh
              ? "填寫以下資料，管理員審核通過後即可使用賣家功能。"
              : "Fill in your details below. Once approved you'll get full seller access."}
          </DialogDescription>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Status banner */}
          {statusInfo && (
            <div className={cn("flex items-start gap-3 p-4 rounded-xl border", statusInfo.bg)}>
              <div className="shrink-0 mt-0.5">{statusInfo.icon}</div>
              <div>
                <p className={cn("text-sm font-semibold", statusInfo.text)}>{statusInfo.title}</p>
                {statusInfo.body && (
                  <p className={cn("text-xs mt-0.5 leading-relaxed", statusInfo.text, "opacity-80")}>{statusInfo.body}</p>
                )}
                {existingRequest?.status === "rejected" && existingRequest.admin_notes && (
                  <p className={cn("text-xs mt-1 leading-relaxed font-medium", statusInfo.text)}>
                    {isZh ? "原因：" : "Reason: "}{existingRequest.admin_notes}
                  </p>
                )}
                {existingRequest?.status === "rejected" && (
                  <p className="text-xs mt-2 text-muted-foreground">
                    {isZh ? "您可以重新填寫申請表格。" : "You may re-apply using the form below."}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          {showForm && (
            <form id="seller-upgrade-form" onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  {isZh ? "公司名稱" : "Company Name"} <span className="text-destructive normal-case font-normal">*</span>
                </Label>
                <input
                  type="text" autoComplete="off" required
                  value={form.company_name}
                  onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))}
                  placeholder={isZh ? "輸入公司名稱" : "Enter your company name"}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    {isZh ? "稅務編號" : "Tax ID"}
                  </Label>
                  <input
                    type="text" autoComplete="off"
                    value={form.company_tax_id}
                    onChange={(e) => setForm((p) => ({ ...p, company_tax_id: e.target.value }))}
                    placeholder={isZh ? "統一編號" : "e.g. 12345678"}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    {isZh ? "業務類型" : "Business Type"}
                  </Label>
                  <input
                    type="text" autoComplete="off"
                    value={form.business_type}
                    onChange={(e) => setForm((p) => ({ ...p, business_type: e.target.value }))}
                    placeholder={isZh ? "製造商、回收商..." : "Manufacturer, Recycler..."}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    {isZh ? "聯絡電話" : "Phone"}
                  </Label>
                  <input
                    type="tel" autoComplete="off"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+886 ..."
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    {isZh ? "國家" : "Country"}
                  </Label>
                  <CountrySelect
                    value={form.country}
                    onChange={(v) => setForm((p) => ({ ...p, country: v }))}
                    placeholder={isZh ? "選擇國家" : "Select country"}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  {isZh ? "申請原因" : "Why do you want to sell?"}
                </Label>
                <textarea
                  autoComplete="off" rows={3}
                  value={form.reason}
                  onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                  placeholder={isZh ? "請說明您的業務需求與背景..." : "Tell us about your business and what you'd like to sell..."}
                  className={cn(inputClass, "resize-none")}
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex flex-col gap-2">
          {showForm && (
            <Button
              type="submit"
              form="seller-upgrade-form"
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />{isZh ? "送出中..." : "Submitting..."}</>
                : <>{isZh ? "送出申請" : "Submit Request"} <ChevronRight className="w-4 h-4" /></>
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

  const [form, setForm] = useState({
    company_name: "", company_tax_id: "", business_type: "",
    phone: "", country: "", reason: "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim()) {
      toastError(isZh ? "請填寫公司名稱" : "Company name is required");
      return;
    }
    try {
      await submitRequest(form).unwrap();
      toastSuccess(isZh ? "申請已送出，等待管理員審核" : "Request submitted! Admin will review shortly.");
      setShowUpgradeModal(false);
      refetchStatus();
      setForm({ company_name: "", company_tax_id: "", business_type: "", phone: "", country: "", reason: "" });
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
      form={form}
      setForm={setForm}
      onSubmit={handleSubmit}
    />
  );

  // ── Segmented toggle variant ──────────────────────────────────────────────
  if (variant === "segmented") {
    return (
      <>
        <div className="flex rounded-lg bg-sidebar-foreground/10 p-0.5 gap-0.5">
          {/* Seller tab */}
          <button
            onClick={() => handleSwitch("seller")}
            disabled={switching}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200 relative",
              currentRole === "seller"
                ? "bg-sidebar-foreground/15 text-sidebar-foreground shadow-sm"
                : isVerifiedSeller
                  ? "text-sidebar-foreground/50 hover:text-sidebar-foreground/70 hover:bg-sidebar-foreground/5"
                  : "text-sidebar-foreground/35 hover:text-sidebar-foreground/50 cursor-pointer"
            )}
          >
            <Building2 className="w-3 h-3 shrink-0" />
            {t("dashboard.roleSwitcher.seller", "Seller")}
            {!isVerifiedSeller && (
              <Lock className="w-2.5 h-2.5 ml-0.5 opacity-50" />
            )}
          </button>

          {/* Buyer tab */}
          <button
            onClick={() => handleSwitch("buyer")}
            disabled={switching}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200",
              currentRole === "buyer"
                ? "bg-sidebar-foreground/15 text-sidebar-foreground shadow-sm"
                : "text-sidebar-foreground/50 hover:text-sidebar-foreground/70 hover:bg-sidebar-foreground/5"
            )}
          >
            <Store className="w-3 h-3 shrink-0" />
            {t("dashboard.roleSwitcher.buyer", "Buyer")}
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
