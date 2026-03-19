import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Clock,
  CheckCircle2,
  Zap,
  ArrowLeft,
  Info,
} from "lucide-react";

const AutoApprovalPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 -ml-2"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back", "Back")}
            </Button>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-amber-500" />
              {t("productListing.approvalPending.learnMore", "Auto-approval")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("autoApproval.subtitle", "Get your listings published automatically during selected periods—no admin approval needed.")}
            </p>
          </div>
        </div>

        {/* How it works */}
        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              {t("autoApproval.howItWorks", "How it works")}
            </CardTitle>
            <CardDescription>
              {t("autoApproval.howItWorksDesc", "When auto-approval is active for a date range, any new listing you submit in that period is approved immediately. Steps 2–8 unlock right away.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="font-bold text-amber-600 dark:text-amber-400">1</span>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("autoApproval.step1Title", "Admin sets a time window")}</p>
                <p className="text-sm text-muted-foreground">{t("autoApproval.step1Desc", "Start date and end date. During this window, new batches are auto-approved.")}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">2</span>
              </div>
              <div>
                <p className="font-medium text-foreground">{t("autoApproval.step2Title", "You list as usual")}</p>
                <p className="text-sm text-muted-foreground">{t("autoApproval.step2Desc", "Submit your listing in step 1. If the window is active, it is approved instantly.")}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{t("autoApproval.step3Title", "Steps 2–8 unlock")}</p>
                <p className="text-sm text-muted-foreground">{t("autoApproval.step3Desc", "Continue to inspection, bidding, and the rest of the flow without waiting.")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info: Managed by admin */}
        <Card className="border-muted">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 p-2 rounded-full bg-muted">
                <Info className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">{t("autoApproval.managedByAdmin", "Managed by admin")}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("autoApproval.managedByAdminDesc", "Auto-approval windows are set by platform administrators. If you don't see an active window, your listings will follow the usual approval flow and unlock after admin approval.")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* When no auto-approval */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              {t("autoApproval.whenPending", "When your listing is pending")}
            </CardTitle>
            <CardDescription>
              {t("autoApproval.whenPendingDesc", "Thank you for listing. Your submission is waiting for admin approval. Steps 2–8 will open once it is approved. You can keep editing step 1 until then.")}
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate("/upload")}>
            {t("autoApproval.goToUpload", "Go to upload")}
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard/submissions")}>
            {t("autoApproval.viewSubmissions", "View submissions")}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AutoApprovalPage;
