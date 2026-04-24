// @ts-nocheck
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, ShoppingBag, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVerifyEmailByTokenMutation } from "@/rtk/slices/apiSlice";
import Header from "@/components/common/Header";
import { useTranslation } from "react-i18next";

type Status = "loading" | "success" | "error";

const VerifyEmailPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  const [verifyEmailByToken] = useVerifyEmailByTokenMutation();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage(t("auth.verifyPage.noTokenMessage"));
      return;
    }

    verifyEmailByToken({ token })
      .unwrap()
      .then(() => {
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        const msg = err?.data?.message || t("auth.verifyPage.invalidLinkMessage");
        setMessage(msg);
      });
  }, [searchParams, t, verifyEmailByToken]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f5f2] to-[#e8f4ee]">
      <Header />
      <div className="px-4 py-10 sm:py-14 flex items-center justify-center">
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
                <h2 className="text-xl font-bold text-foreground">{t("auth.verifyPage.verifyingTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("auth.verifyPage.pleaseWait")}</p>
              </div>
            )}

            {/* Success */}
            {status === "success" && (
              <div className="space-y-5">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">{t("auth.verifyPage.verifiedTitle")}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("auth.verifyPage.verifiedDescription")}
                  </p>
                </div>

                {/* Status info box */}
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-left space-y-2">
                  <p className="text-sm font-semibold text-amber-800">{t("auth.verifyPage.underReviewTitle")}</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    {t("auth.verifyPage.underReviewDescription")}
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 pt-1">
                  <Button
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold"
                    onClick={() => navigate("/marketplace")}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {t("auth.verifyPage.browseMarketplace")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-11 border-primary text-primary hover:bg-primary hover:text-primary-foreground gap-2 font-semibold"
                    onClick={() => navigate("/auth?mode=signin&type=buyer")}
                  >
                    <LogIn className="w-4 h-4" />
                    {t("auth.verifyPage.goToSignIn")}
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
                  <h2 className="text-2xl font-bold text-foreground">{t("auth.verifyPage.failedTitle")}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {message}
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 pt-1">
                  <Button
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold"
                    onClick={() => navigate("/auth?mode=signup&type=buyer")}
                  >
                    {t("auth.verifyPage.tryAgain")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-11 gap-2"
                    onClick={() => navigate("/marketplace")}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {t("auth.verifyPage.browseMarketplace")}
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
    </div>
  );
};

export default VerifyEmailPage;
