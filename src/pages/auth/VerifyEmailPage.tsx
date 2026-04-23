// @ts-nocheck
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, ShoppingBag, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVerifyEmailByTokenMutation } from "@/rtk/slices/apiSlice";

type Status = "loading" | "success" | "error";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  const [verifyEmailByToken] = useVerifyEmailByTokenMutation();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in this link. Please check your email and try again.");
      return;
    }

    verifyEmailByToken({ token })
      .unwrap()
      .then(() => {
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        const msg = err?.data?.message || "This verification link is invalid or has expired.";
        setMessage(msg);
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f5f2] to-[#e8f4ee] px-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-border overflow-hidden">

          {/* Header stripe */}
          <div className="h-2 bg-gradient-to-r from-[#0f4c2a] to-[#1a7a45]" />

          <div className="p-8 text-center">

            {/* Loading */}
            {status === "loading" && (
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mx-auto">
                  <Loader2 className="w-7 h-7 text-primary animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Verifying your email…</h2>
                <p className="text-sm text-muted-foreground">Please wait a moment.</p>
              </div>
            )}

            {/* Success */}
            {status === "success" && (
              <div className="space-y-5">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Email Verified!</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your email address has been confirmed successfully.
                  </p>
                </div>

                {/* Status info box */}
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-left space-y-2">
                  <p className="text-sm font-semibold text-amber-800">Account under review</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Our team will review your account shortly. You'll be able to sign in once approved.
                    In the meantime, you can freely browse the marketplace.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 pt-1">
                  <Button
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold"
                    onClick={() => navigate("/marketplace")}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Browse Marketplace
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-11 border-primary text-primary hover:bg-primary hover:text-primary-foreground gap-2 font-semibold"
                    onClick={() => navigate("/auth?mode=signin&type=buyer")}
                  >
                    <LogIn className="w-4 h-4" />
                    Go to Sign In
                  </Button>
                </div>
              </div>
            )}

            {/* Error */}
            {status === "error" && (
              <div className="space-y-5">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 border border-red-200 mx-auto">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Verification Failed</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {message}
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 pt-1">
                  <Button
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold"
                    onClick={() => navigate("/auth?mode=signup&type=buyer")}
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-11 gap-2"
                    onClick={() => navigate("/marketplace")}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Browse Marketplace
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          © {new Date().getFullYear()} GreenBidz · All rights reserved
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
