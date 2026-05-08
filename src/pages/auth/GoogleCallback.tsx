// @ts-nocheck
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toastError, toastSuccess } from "@/helper/toasterNotification";
import { getSocket } from "@/services/socket";

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");
    const name = searchParams.get("name");
    const company = searchParams.get("company");
    const error = searchParams.get("error");

    if (error) {
      if (error === "account_pending") {
        toastError("Your account is pending admin approval. We'll notify you once approved.");
      } else {
        toastError("Google sign-in failed. Please try again or use email/password.");
      }
      navigate("/auth?mode=signin");
      return;
    }

    if (!token || !userId || !role) {
      toastError("Google sign-in incomplete. Please try again.");
      navigate("/auth?mode=signin");
      return;
    }

    // Store auth data exactly like the email login flow
    localStorage.setItem("accessToken", token);
    localStorage.setItem("refreshToken", refreshToken || "");
    localStorage.setItem("userId", userId);
    localStorage.setItem("userRole", role);
    localStorage.setItem("jwtRole", role);
    localStorage.setItem("activeView", role);
    if (name) localStorage.setItem("userName", name);
    if (company && company !== "null") localStorage.setItem("companyName", company);
    else localStorage.removeItem("companyName");

    const socket = getSocket();
    socket.connect();
    socket.emit("joinRooms", { user_id: userId, role }, () => {});

    toastSuccess("Welcome back!");

    if (role === "buyer") window.location.href = "/buyer-dashboard";
    else if (role === "seller") window.location.href = "/dashboard";
    else if (role === "admin") window.location.href = "/admin";
    else window.location.href = "/forbidden";
  }, []);

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
