// @ts-nocheck
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toastError, toastSuccess } from "@/helper/toasterNotification";
import { getSocket } from "@/services/socket";
import { useTranslation } from "react-i18next";

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();


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
    const userStatus   = searchParams.get("userStatus") || "approved";

    if (error === "account_pending") {
      if (email) localStorage.setItem("userEmail", email);
      navigate("/dashboard/settings", { replace: true });
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

    // New user or profile incomplete → go to dashboard based on role
    if (needsProfile === "1") {
      localStorage.setItem("googlePrefillEmail", email);
      localStorage.setItem("googlePrefillFirst", firstName);
      localStorage.setItem("googlePrefillLast", lastName);
      toastSuccess("Signed in with Google! Welcome to your dashboard.");
      window.location.href = role === "seller" ? "/dashboard" : "/buyer-dashboard";
      return;
    }

    toastSuccess(t("auth.validation.welcomeBackToast"));

    // Pending user → settings (restricted until approved)
    if (userStatus !== "approved") {
      window.location.href = "/dashboard/settings";
      return;
    }

    // Approved user → dashboard
    if (role === "buyer")       window.location.href = "/buyer-dashboard";
    else if (role === "seller") window.location.href = "/dashboard";
    else if (role === "admin")  window.location.href = "/admin";
    else                        window.location.href = "/forbidden";
  }, []);

  // Loading spinner while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Signing you in with Google…</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
