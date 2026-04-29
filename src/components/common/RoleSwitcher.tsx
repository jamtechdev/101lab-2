// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Building2, ArrowLeftRight, Loader2, Lock, Crown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSocket } from "@/services/socket";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSubmitSellerUpgradeRequestMutation, useGetMySellerUpgradeStatusQuery } from "@/rtk/slices/apiSlice";
import { toastSuccess, toastError } from "@/helper/toasterNotification";
import { CountrySelect } from "@/components/common/CountrySelect";

interface RoleSwitcherProps {
  variant?: "default" | "segmented";
}

export default function RoleSwitcher({ variant = "default" }: RoleSwitcherProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const [switching, setSwitching] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const userId = localStorage.getItem("userId");
  const jwtRole = localStorage.getItem("jwtRole") || localStorage.getItem("userRole") || "buyer";

  const [submitRequest, { isLoading: isSubmitting }] = useSubmitSellerUpgradeRequestMutation();

  const { data: statusData, refetch: refetchStatus } = useGetMySellerUpgradeStatusQuery(undefined, {
    skip: !userId || jwtRole === "seller",
  });
  const existingRequest = statusData?.data;

  // If jwtRole is seller OR admin approved the upgrade request → treat as verified seller
  const isVerifiedSeller = jwtRole === "seller" || existingRequest?.status === "approved";

  const storedView = localStorage.getItem("activeView");
  const currentPath = window.location.pathname;
  const isBuyerDashboard = currentPath.startsWith("/buyer-dashboard") || currentPath.startsWith("/buyer/");
  const currentRole = isVerifiedSeller
    ? (storedView === "buyer" || isBuyerDashboard ? "buyer" : "seller")
    : "buyer";

  const [form, setForm] = useState({
    company_name: "",
    company_tax_id: "",
    business_type: "",
    phone: "",
    country: "",
    reason: "",
  });

  const handleSwitch = (targetRole: string) => {
    if (targetRole === currentRole || switching) return;

    if (targetRole === "seller" && !isVerifiedSeller) {
      setShowUpgradeModal(true);
      return;
    }

    // If approved buyer switching to seller — upgrade localStorage so app treats them as seller
    if (targetRole === "seller" && existingRequest?.status === "approved") {
      localStorage.setItem("userRole", "seller");
      localStorage.setItem("jwtRole", "seller");
    }

    setSwitching(true);
    const targetPath = targetRole === "buyer" ? "/buyer-dashboard" : "/dashboard";
    localStorage.setItem("activeView", targetRole);

    try {
      const socket = getSocket();
      if (userId) {
        socket.emit("joinRooms", { user_id: userId, role: targetRole });
      }
    } catch (_) {}

    setTimeout(() => {
      window.location.href = targetPath;
    }, 300);
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

  // ── Segmented toggle variant ──────────────────────────────────────────────
  if (variant === "segmented") {
    return (
      <>
        <div className="flex rounded bg-sidebar-foreground/10 p-0.5">
          <button
            onClick={() => handleSwitch("seller")}
            disabled={switching}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-sm text-[11px] font-medium transition-all duration-200",
              currentRole === "seller"
                ? "bg-sidebar-foreground/15 text-sidebar-foreground shadow-sm"
                : !isVerifiedSeller
                  ? "text-sidebar-foreground/35 hover:text-sidebar-foreground/50 opacity-70"
                  : "text-sidebar-foreground/40 hover:text-sidebar-foreground/60"
            )}
          >
            <Building2 className="w-3 h-3" />
            {t("dashboard.roleSwitcher.seller", "Seller")}
            {!isVerifiedSeller && currentRole !== "seller" && (
              <Lock className="w-2.5 h-2.5 ml-0.5 opacity-60" />
            )}
          </button>
          <button
            onClick={() => handleSwitch("buyer")}
            disabled={switching}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-sm text-[11px] font-medium transition-all duration-200",
              currentRole === "buyer"
                ? "bg-sidebar-foreground/15 text-sidebar-foreground shadow-sm"
                : "text-sidebar-foreground/40 hover:text-sidebar-foreground/60"
            )}
          >
            <Store className="w-3 h-3" />
            {t("dashboard.roleSwitcher.buyer", "Buyer")}
          </button>
        </div>

        {/* Seller Upgrade Modal — inline, not a nested component */}
        <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
          <DialogContent className="sm:max-w-lg border border-border bg-card max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-left space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-[11px] font-semibold px-2.5 py-1 rounded w-fit uppercase tracking-wide">
                <Crown className="w-3 h-3" />
                {isZh ? "升級賣家" : "Become a Seller"}
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                {isZh ? "申請成為賣家" : "Seller Access Request"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {isZh
                  ? "填寫以下資料，管理員審核通過後即可使用賣家功能。"
                  : "Fill in the details below. Once approved by admin, you'll get full seller access."}
              </DialogDescription>
            </DialogHeader>

            {existingRequest ? (
              <div className="mt-4 space-y-4">
                {existingRequest.status === "pending" && (
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    <p className="font-semibold mb-1">{isZh ? "⏳ 申請審核中" : "⏳ Request Under Review"}</p>
                    <p className="text-xs">
                      {isZh
                        ? "您的賣家申請正在等待管理員審核，審核結果將寄送至您的信箱。"
                        : "Your seller request is being reviewed. You'll receive an email once it's processed."}
                    </p>
                  </div>
                )}
                {existingRequest.status === "rejected" && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                      <p className="font-semibold mb-1">{isZh ? "❌ 申請未通過" : "❌ Request Not Approved"}</p>
                      {existingRequest.admin_notes && (
                        <p className="text-xs">{isZh ? "原因：" : "Reason: "}{existingRequest.admin_notes}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isZh ? "您可以重新送出申請。" : "You may re-apply below."}
                    </p>
                  </div>
                )}
                {existingRequest.status === "approved" && (
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <p>{isZh ? "已通過審核，您現在可以直接切換至賣家模式。" : "Approved! You can now switch to Seller mode directly."}</p>
                  </div>
                )}
                {existingRequest.status !== "pending" && existingRequest.status !== "approved" && (
                  <form onSubmit={handleSubmit} className="space-y-3 mt-2">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">{isZh ? "公司名稱" : "Company Name"} <span className="text-destructive">*</span></Label>
                      <input type="text" autoComplete="off" value={form.company_name} onChange={(e) => setForm(p => ({ ...p, company_name: e.target.value }))} placeholder={isZh ? "輸入公司名稱" : "Enter company name"} required className="w-full px-3 py-2 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">{isZh ? "統一編號 / 稅務編號" : "Company Tax ID"}</Label>
                      <input type="text" autoComplete="off" value={form.company_tax_id} onChange={(e) => setForm(p => ({ ...p, company_tax_id: e.target.value }))} placeholder={isZh ? "輸入稅務編號" : "Enter tax ID"} className="w-full px-3 py-2 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">{isZh ? "業務類型" : "Business Type"}</Label>
                      <input type="text" autoComplete="off" value={form.business_type} onChange={(e) => setForm(p => ({ ...p, business_type: e.target.value }))} placeholder={isZh ? "例：製造商、回收商、貿易商" : "e.g. Manufacturer, Recycler, Trader"} className="w-full px-3 py-2 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">{isZh ? "聯絡電話" : "Phone"}</Label>
                        <input type="tel" autoComplete="off" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+886..." className="w-full px-3 py-2 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">{isZh ? "國家" : "Country"}</Label>
                        <CountrySelect value={form.country} onChange={(v) => setForm(p => ({ ...p, country: v }))} placeholder={isZh ? "選擇國家" : "Select country"} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">{isZh ? "申請原因" : "Why do you want to become a seller?"}</Label>
                      <textarea autoComplete="off" value={form.reason} onChange={(e) => setForm(p => ({ ...p, reason: e.target.value }))} placeholder={isZh ? "請說明您的業務需求..." : "Tell us about your business needs..."} className="w-full h-20 px-3 py-2 rounded-md border border-border bg-muted/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                    </div>
                    <div className="flex flex-col gap-2 pt-1">
                      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
                        {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{isZh ? "送出中..." : "Submitting..."}</> : isZh ? "送出申請" : "Submit Request"}
                      </Button>
                    </div>
                  </form>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowUpgradeModal(false)} className="w-full text-xs text-muted-foreground">
                  {isZh ? "稍後再說" : "Maybe later"}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{isZh ? "公司名稱" : "Company Name"} <span className="text-destructive">*</span></Label>
                  <input type="text" autoComplete="off" value={form.company_name} onChange={(e) => setForm(p => ({ ...p, company_name: e.target.value }))} placeholder={isZh ? "輸入公司名稱" : "Enter company name"} required className="w-full px-3 py-2 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{isZh ? "統一編號 / 稅務編號" : "Company Tax ID"}</Label>
                  <input type="text" autoComplete="off" value={form.company_tax_id} onChange={(e) => setForm(p => ({ ...p, company_tax_id: e.target.value }))} placeholder={isZh ? "輸入稅務編號" : "Enter tax ID"} className="w-full px-3 py-2 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{isZh ? "業務類型" : "Business Type"}</Label>
                  <input type="text" autoComplete="off" value={form.business_type} onChange={(e) => setForm(p => ({ ...p, business_type: e.target.value }))} placeholder={isZh ? "例：製造商、回收商、貿易商" : "e.g. Manufacturer, Recycler, Trader"} className="w-full px-3 py-2 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{isZh ? "聯絡電話" : "Phone"}</Label>
                    <input type="tel" autoComplete="off" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+886..." className="w-full px-3 py-2 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{isZh ? "國家" : "Country"}</Label>
                    <input type="text" autoComplete="off" value={form.country} onChange={(e) => setForm(p => ({ ...p, country: e.target.value }))} placeholder={isZh ? "台灣" : "Taiwan"} className="w-full px-3 py-2 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{isZh ? "申請原因" : "Why do you want to become a seller?"}</Label>
                  <textarea autoComplete="off" value={form.reason} onChange={(e) => setForm(p => ({ ...p, reason: e.target.value }))} placeholder={isZh ? "請說明您的業務需求..." : "Tell us about your business needs..."} className="w-full h-20 px-3 py-2 rounded-md border border-border bg-muted/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{isZh ? "送出中..." : "Submitting..."}</> : isZh ? "送出申請" : "Submit Request"}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowUpgradeModal(false)} className="text-xs text-muted-foreground">
                    {isZh ? "稍後再說" : "Maybe later"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // ── Default variant ───────────────────────────────────────────────────────
  const targetRole = currentRole === "buyer" ? "seller" : "buyer";
  const targetLabel = currentRole === "buyer"
    ? t("dashboard.roleSwitcher.sellerDashboard")
    : t("dashboard.roleSwitcher.buyerDashboard");
  const TargetIcon = currentRole === "buyer" ? Building2 : Store;

  return (
    <>
      <div className="mx-4 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-foreground/5 border border-sidebar-border mb-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-sidebar-foreground/40 uppercase tracking-wider font-semibold">
              {t("dashboard.roleSwitcher.currentMode")}
            </p>
            <p className="text-sm font-semibold text-sidebar-foreground capitalize truncate">
              {currentRole === "buyer"
                ? t("dashboard.roleSwitcher.buyerDashboard")
                : t("dashboard.roleSwitcher.sellerDashboard")}
            </p>
          </div>
        </div>

        <button
          onClick={() => handleSwitch(targetRole)}
          disabled={switching}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border",
            targetRole === "seller" && !isVerifiedSeller
              ? "border-sidebar-border bg-sidebar-foreground/5 text-sidebar-foreground/60 hover:bg-sidebar-foreground/10 opacity-70"
              : "border-accent/30 bg-accent/5 text-accent hover:bg-accent/15 hover:border-accent/50",
            "disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          {switching ? (
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
          ) : targetRole === "seller" && !isVerifiedSeller ? (
            <Lock className="w-4 h-4 flex-shrink-0" />
          ) : (
            <ArrowLeftRight className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="flex-1 text-left">
            {switching
              ? t("dashboard.roleSwitcher.switching")
              : t("dashboard.roleSwitcher.switchTo", { role: targetRole })}
          </span>
          <TargetIcon className="w-4 h-4 flex-shrink-0 opacity-60" />
        </button>
      </div>

      {/* Seller Upgrade Modal — inline, not a nested component */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-lg border border-border bg-card max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-left space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-[11px] font-semibold px-2.5 py-1 rounded w-fit uppercase tracking-wide">
              <Crown className="w-3 h-3" />
              {isZh ? "升級賣家" : "Become a Seller"}
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              {isZh ? "申請成為賣家" : "Seller Access Request"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {isZh
                ? "填寫以下資料，管理員審核通過後即可使用賣家功能。"
                : "Fill in the details below. Once approved by admin, you'll get full seller access."}
            </DialogDescription>
          </DialogHeader>

          {existingRequest ? (
            <div className="mt-4 space-y-4">
              {existingRequest.status === "pending" && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                  <p className="font-semibold mb-1">{isZh ? "⏳ 申請審核中" : "⏳ Request Under Review"}</p>
                  <p className="text-xs">
                    {isZh
                      ? "您的賣家申請正在等待管理員審核，審核結果將寄送至您的信箱。"
                      : "Your seller request is being reviewed. You'll receive an email once it's processed."}
                  </p>
                </div>
              )}
              {existingRequest.status === "rejected" && (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                    <p className="font-semibold mb-1">{isZh ? "❌ 申請未通過" : "❌ Request Not Approved"}</p>
                    {existingRequest.admin_notes && (
                      <p className="text-xs">{isZh ? "原因：" : "Reason: "}{existingRequest.admin_notes}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isZh ? "您可以重新送出申請。" : "You may re-apply below."}
                  </p>
                </div>
              )}
              {existingRequest.status === "approved" && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <p>{isZh ? "已通過審核，您現在可以直接切換至賣家模式。" : "Approved! You can now switch to Seller mode directly."}</p>
                </div>
              )}
              {existingRequest.status !== "pending" && existingRequest.status !== "approved" && (
                <form onSubmit={handleSubmit} className="space-y-3 mt-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{isZh ? "公司名稱" : "Company Name"} <span className="text-destructive">*</span></Label>
                    <input type="text" autoComplete="off" value={form.company_name} onChange={(e) => setForm(p => ({ ...p, company_name: e.target.value }))} placeholder={isZh ? "輸入公司名稱" : "Enter company name"} required className="w-full px-3 py-2 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{isZh ? "統一編號 / 稅務編號" : "Company Tax ID"}</Label>
                    <input type="text" autoComplete="off" value={form.company_tax_id} onChange={(e) => setForm(p => ({ ...p, company_tax_id: e.target.value }))} placeholder={isZh ? "輸入稅務編號" : "Enter tax ID"} className="w-full px-3 py-2 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{isZh ? "業務類型" : "Business Type"}</Label>
                    <input type="text" autoComplete="off" value={form.business_type} onChange={(e) => setForm(p => ({ ...p, business_type: e.target.value }))} placeholder={isZh ? "例：製造商、回收商、貿易商" : "e.g. Manufacturer, Recycler, Trader"} className="w-full px-3 py-2 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">{isZh ? "聯絡電話" : "Phone"}</Label>
                      <input type="tel" autoComplete="off" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+886..." className="w-full px-3 py-2 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">{isZh ? "國家" : "Country"}</Label>
                      <input type="text" autoComplete="off" value={form.country} onChange={(e) => setForm(p => ({ ...p, country: e.target.value }))} placeholder={isZh ? "台灣" : "Taiwan"} className="w-full px-3 py-2 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{isZh ? "申請原因" : "Why do you want to become a seller?"}</Label>
                    <textarea autoComplete="off" value={form.reason} onChange={(e) => setForm(p => ({ ...p, reason: e.target.value }))} placeholder={isZh ? "請說明您的業務需求..." : "Tell us about your business needs..."} className="w-full h-20 px-3 py-2 rounded-md border border-border bg-muted/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                  </div>
                  <div className="flex flex-col gap-2 pt-1">
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
                      {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{isZh ? "送出中..." : "Submitting..."}</> : isZh ? "送出申請" : "Submit Request"}
                    </Button>
                  </div>
                </form>
              )}
              <Button variant="ghost" size="sm" onClick={() => setShowUpgradeModal(false)} className="w-full text-xs text-muted-foreground">
                {isZh ? "稍後再說" : "Maybe later"}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{isZh ? "公司名稱" : "Company Name"} <span className="text-destructive">*</span></Label>
                <input type="text" autoComplete="off" value={form.company_name} onChange={(e) => setForm(p => ({ ...p, company_name: e.target.value }))} placeholder={isZh ? "輸入公司名稱" : "Enter company name"} required className="w-full px-3 py-2 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{isZh ? "統一編號 / 稅務編號" : "Company Tax ID"}</Label>
                <input type="text" autoComplete="off" value={form.company_tax_id} onChange={(e) => setForm(p => ({ ...p, company_tax_id: e.target.value }))} placeholder={isZh ? "輸入稅務編號" : "Enter tax ID"} className="w-full px-3 py-2 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{isZh ? "業務類型" : "Business Type"}</Label>
                <input type="text" autoComplete="off" value={form.business_type} onChange={(e) => setForm(p => ({ ...p, business_type: e.target.value }))} placeholder={isZh ? "例：製造商、回收商、貿易商" : "e.g. Manufacturer, Recycler, Trader"} className="w-full px-3 py-2 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{isZh ? "聯絡電話" : "Phone"}</Label>
                  <input type="tel" autoComplete="off" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+886..." className="w-full px-3 py-2 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{isZh ? "國家" : "Country"}</Label>
                  <input type="text" autoComplete="off" value={form.country} onChange={(e) => setForm(p => ({ ...p, country: e.target.value }))} placeholder={isZh ? "台灣" : "Taiwan"} className="w-full px-3 py-2 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{isZh ? "申請原因" : "Why do you want to become a seller?"}</Label>
                <textarea autoComplete="off" value={form.reason} onChange={(e) => setForm(p => ({ ...p, reason: e.target.value }))} placeholder={isZh ? "請說明您的業務需求..." : "Tell us about your business needs..."} className="w-full h-20 px-3 py-2 rounded-md border border-border bg-muted/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{isZh ? "送出中..." : "Submitting..."}</> : isZh ? "送出申請" : "Submit Request"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowUpgradeModal(false)} className="text-xs text-muted-foreground">
                  {isZh ? "稍後再說" : "Maybe later"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
