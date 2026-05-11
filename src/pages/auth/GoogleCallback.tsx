// @ts-nocheck
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toastError, toastSuccess } from "@/helper/toasterNotification";
import { getSocket } from "@/services/socket";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [pendingModal, setPendingModal] = useState<{ email: string } | null>(null);

  useEffect(() => {
    const token        = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");
    const userId       = searchParams.get("userId");
    const role         = searchParams.get("role");
    const name         = searchParams.get("name");
    const company      = searchParams.get("company");
    const email        = searchParams.get("email") || "";
    const error        = searchParams.get("error");
    const needsProfile = searchParams.get("needsProfile");
    const firstName    = searchParams.get("first_name") || "";
    const lastName     = searchParams.get("last_name") || "";

    if (error === "account_pending") {
      setPendingModal({ email });
      return;
    }

    if (error) {
      toastError("Google sign-in failed. Please try again or use email/password.");
      navigate("/auth?mode=signin");
      return;
    }

    if (!token || !userId || !role) {
      toastError("Google sign-in incomplete. Please try again.");
      navigate("/auth?mode=signin");
      return;
    }

    // Store tokens — same as email login flow in Auth.tsx
    localStorage.setItem("accessToken", token);
    localStorage.setItem("refreshToken", refreshToken || "");
    localStorage.setItem("userId", userId);
    localStorage.setItem("userRole", role);
    localStorage.setItem("jwtRole", role);
    localStorage.setItem("activeView", role);
    if (name) localStorage.setItem("userName", name);
    if (email) localStorage.setItem("userEmail", email);
    if (company && company !== "null") localStorage.setItem("companyName", company);
    else localStorage.removeItem("companyName");

    const socket = getSocket();
    socket.connect();
    socket.emit("joinRooms", { user_id: userId, role }, () => {});

    // New user or profile incomplete → go to complete profile
    if (needsProfile === "1") {
      navigate(
        `/complete-google-profile?email=${encodeURIComponent(email)}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}`
      );
      return;
    }

    // Existing approved user → dashboard
    toastSuccess(t("auth.validation.welcomeBackToast"));
    if (role === "buyer")       window.location.href = "/buyer-dashboard";
    else if (role === "seller") window.location.href = "/dashboard";
    else if (role === "admin")  window.location.href = "/admin";
    else                        window.location.href = "/forbidden";
  }, []);

  // Loading spinner
  if (!pendingModal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Signing you in with Google…</p>
        </div>
      </div>
    );
  }

  // Pending approval modal — same as Auth.tsx
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
        <div className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border p-8 flex flex-col items-center text-center">

          <button
            type="button"
            onClick={() => navigate("/auth?mode=signin")}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-8 h-8 text-blue-500" />
          </div>

          <h3 className="text-xl font-bold text-foreground mb-2">
            {t("auth.accountPendingApprovalTitle")}
          </h3>

          <p className="text-sm text-muted-foreground leading-relaxed mb-1">
            {t("auth.accountPendingApprovalBody")}
          </p>
          <p className="text-sm font-semibold text-foreground mb-4">{pendingModal.email}</p>

          <div className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 mb-5 text-left">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("auth.accountPendingApprovalHelp")}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-10 text-sm mb-3"
            onClick={() => navigate("/marketplace")}
          >
            {t("auth.browseWhileWaiting")}
          </Button>

          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground underline"
            onClick={() => navigate("/auth?mode=signin")}
          >
            {t("auth.close")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleCallback;
