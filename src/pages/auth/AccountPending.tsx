// @ts-nocheck
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const AccountPending = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const email = localStorage.getItem("userEmail") || "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border p-8 flex flex-col items-center text-center">

        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-5">
          <CheckCircle2 className="w-8 h-8 text-blue-500" />
        </div>

        <h3 className="text-xl font-bold text-foreground mb-2">
          {t("auth.accountPendingApprovalTitle")}
        </h3>

        <p className="text-sm text-muted-foreground leading-relaxed mb-1">
          {t("auth.accountPendingApprovalBody")}
        </p>
        {email && <p className="text-sm font-semibold text-foreground mb-4">{email}</p>}

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
          className="text-xs text-muted-foreground hover:text-foreground underline flex items-center gap-1"
          onClick={() => {
            localStorage.clear();
            navigate("/auth?mode=signin");
          }}
        >
          <ArrowLeft className="w-3 h-3" />
          {t("auth.close")}
        </button>
      </div>
    </div>
  );
};

export default AccountPending;
