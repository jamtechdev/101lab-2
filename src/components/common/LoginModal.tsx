import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginMutation } from "@/rtk/slices/apiSlice";
import { toastSuccess, toastError } from "@/helper/toasterNotification";
import { getSocket } from "@/services/socket"; 
import { Loader2, LogIn } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  portalType?: "buyer" | "seller" | "admin";
}

const LoginModal = ({ open, onClose, onSuccess, portalType = "buyer" }: LoginModalProps) => {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toastError("Please enter email and password"); return; }
    try {
      const result = await login({ email, password }).unwrap();
      if (result?.success) {
        const userId = result.data?.data?.user?.id;
        const role = result.data?.data?.role;
        const userName = result.data?.data?.user?.username;
        const companyName = result.data?.userDetail?.company;
        const accessToken = result?.data?.token;
        const refreshToken = result?.data?.refreshToken;

        if (userId) {
          localStorage.setItem("userId", userId.toString());
          localStorage.setItem("userRole", role);
          localStorage.setItem("userName", userName || "");
          localStorage.setItem("companyName", companyName || "");
        }
        if (accessToken) localStorage.setItem("accessToken", accessToken);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

        // Connect socket
        const socket = getSocket();
        socket.connect();
        socket.emit("joinRooms", { user_id: userId, role });

        // Notify all components listening for auth change
        window.dispatchEvent(new Event("auth-changed"));

        toastSuccess("Welcome back!");
        onClose();
        setEmail("");
        setPassword("");

        if (onSuccess) {
          onSuccess();
        } else {
          // Navigate to role dashboard
          if (role === "buyer") navigate("/buyer-dashboard");
          else if (role === "seller") navigate("/dashboard");
          else if (role === "admin") navigate("/admin");
        }
      }
    } catch (err: any) {
      toastError(err?.data?.message || "Login failed. Please check your credentials.");
    }
  };

  const goToRegister = () => {
    onClose();
    window.open(`/auth?type=${portalType}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Sign In</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
            Sign In
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <button
            onClick={goToRegister}
            className="text-primary hover:underline font-medium"
          >
            Create account
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={() => { onClose(); navigate("/forgot-password"); }}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Forgot password?
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
