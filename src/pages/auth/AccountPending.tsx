// @ts-nocheck
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowLeft, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";

const AccountPending = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const email = localStorage.getItem("userEmail") || "";

  const FEATURES = [
    t("auth.features.verifiedMarketplace"),
    t("auth.features.secureBidding"),
    t("auth.features.realTimeNotifications"),
    t("auth.features.businessVerification"),
  ];

  return (
    <div className="min-h-screen flex bg-background">

      {/* ── Left branding panel — same as Auth.tsx ── */}
      <div className="hidden lg:flex lg:w-[380px] xl:w-[440px] flex-col justify-between p-10 text-primary-foreground relative overflow-hidden bg-gradient-primary shrink-0">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M20 20h20v20H20zM0 0h20v20H0z\'/%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative z-10">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity mb-10">
            <ArrowLeft className="w-4 h-4" />{t("auth.backToHome")}
          </button>
          <div className="mb-1"><span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">{t("auth.welcomeTo")}</span></div>
          <h1 className="text-3xl font-bold mb-3 tracking-tight">101Lab</h1>
          <p className="text-sm opacity-70 leading-relaxed max-w-[300px]">{t("landing.subtitle")}</p>
        </div>
        <div className="relative z-10 space-y-4 mt-auto">
          <div className="w-10 h-[2px] opacity-30 bg-warning" />
          {FEATURES.map((item, i) => (
            <div key={i} className="flex items-start gap-3 text-sm opacity-70">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-warning" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border lg:border-none lg:px-10 lg:pt-6 lg:pb-0">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground lg:hidden">
            <ArrowLeft className="w-4 h-4" />{t("auth.backToHome")}
          </button>
          <span className="text-sm font-semibold text-primary lg:hidden">101Lab</span>
          <div className="ml-auto"><LanguageSwitcher /></div>
        </div>

        <div className="flex-1 flex items-center justify-center py-10 px-4 lg:px-8">
          <div className="w-full max-w-md animate-fade-in">

            {/* Icon */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 rounded-full bg-blue-50 border-4 border-blue-100 flex items-center justify-center mb-5">
                <Clock className="w-9 h-9 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
                {t("auth.accountPendingApprovalTitle")}
              </h2>
              <p className="text-sm text-muted-foreground text-center leading-relaxed max-w-sm">
                {t("auth.accountPendingApprovalBody")}
              </p>
            </div>

            {/* Email card */}
            {email && (
              <div className="flex items-center gap-3 bg-muted/40 border border-border rounded-xl px-4 py-3 mb-5">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Registered email</p>
                  <p className="text-sm font-semibold text-foreground">{email}</p>
                </div>
              </div>
            )}

            {/* Info box */}
            <div className="rounded-xl border border-border bg-background overflow-hidden mb-6">
              <div className="border-b border-border bg-muted/30 px-5 py-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What happens next</p>
              </div>
              <div className="px-5 py-4 space-y-3">
                {[
                  t("auth.verifyStep2"),
                  t("auth.verifyStep3"),
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                      {i + 1}
                    </div>
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* Help text */}
            <div className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 mb-6">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("auth.accountPendingApprovalHelp")}
              </p>
            </div>

            {/* Buttons */}
            <Button
              type="button"
              className="w-full h-12 font-semibold bg-primary hover:bg-primary/90 gap-2 mb-3"
              onClick={() => navigate("/marketplace")}
            >
              {t("auth.browseWhileWaiting")}
            </Button>

            <button
              type="button"
              className="w-full text-xs text-muted-foreground hover:text-foreground underline flex items-center justify-center gap-1 py-2"
              onClick={() => {
                localStorage.clear();
                navigate("/auth?mode=signin");
              }}
            >
              <ArrowLeft className="w-3 h-3" />
              Sign in with a different account
            </button>

          </div>
        </div>
      </div>

    </div>
  );
};

export default AccountPending;
