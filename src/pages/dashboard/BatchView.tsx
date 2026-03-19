// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetBatchByIdQuery } from "@/rtk/slices/batchApiSlice";
import BiddingAndInspectionStep from "./BiddingAndInspectionStep";
import InspectionReport from "./InspectionReport";
import PaymentStep from "./PaymentStep";
import ReportStep from "./ReportStep";
import Confirmation from "./Confirmation";
import StepIndicator from "@/components/common/StepIndicator";
import Header from "../product-listing/Header";
import { useTranslation } from "react-i18next";
import { Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const BatchView = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(2); // Default to step 2 (Bidding & Inspection)

  const steps = [
    t("upload.steps.upload"),
    t("biddingStep.biddingAndInspection", "Bidding & Inspection"),
    t("upload.steps.inspection"),
    t("upload.steps.adminApproval", "Admin Approval"),
    t("upload.steps.payment"),
    t("upload.steps.report"),
    t("upload.steps.confirmation"),
  ];

  // Fetch products for the batch
  const { data, isLoading, error } = useGetBatchByIdQuery(
    Number(batchId),
    { skip: !batchId }
  );

  // Admin approval status — comes from batch-level API response
  const isAdminApproved =
    (data as any)?.approval_status === "approved" ||
    (data?.data as any)?.approval_status === "approved";

  // Steps 1–4 always accessible; steps 5–7 unlock after admin approval
  const allowedStep = isAdminApproved ? 7 : 4;

  // Determine step based on product status
  useEffect(() => {
    if (data?.success && data.data && data.data.length > 0) {
      const products = data.data;

      const hasInspectionScheduleStatus = products.some((product) => {
        const status = product.status?.toLowerCase() || "";
        return (
          status === "inspection schedule" ||
          status === "inspection_schedule" ||
          status === "inspection-schedule" ||
          status.includes("inspection_schedule") ||
          status.includes("inspection schedule")
        );
      });

      const isPublished = products.some((product) => {
        return product.status === "publish";
      });

      if (hasInspectionScheduleStatus) {
        setCurrentStep(3); // Inspection Report
      } else if (isPublished) {
        setCurrentStep(2); // Bidding & Inspection
      } else {
        setCurrentStep(2);
      }
    }
  }, [data]);

  // Next step handler
  const handleNext = (_id?: number) => {
    setCurrentStep((prev) => {
      const next = prev + 1;
      if (prev === 7) {
        navigate("/dashboard");
        return prev;
      }
      return next;
    });
  };

  // Back handler
  const handleBack = () => {
    if (currentStep > 2) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate("/dashboard");
    }
  };

  // Step click handler — step 1 navigates to the upload edit page
  const handleStepClick = (step: number) => {
    if (step === 1) {
      navigate(`/upload?step=1&batchId=${batchId}`);
      return;
    }
    setCurrentStep(step);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading batch products...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading batch products</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-accent hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!data.data || data.data.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No products found for this batch</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-accent hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <StepIndicator
        currentStep={currentStep}
        totalSteps={steps.length}
        steps={steps}
        allowedStep={allowedStep}
        onStepClick={handleStepClick}
        data={data}
      />

      <div>
        {/* Step 2 — Bidding & Inspection (merged) */}
        {currentStep === 2 && batchId && (
          <BiddingAndInspectionStep
            batchId={Number(batchId)}
            onMergedNext={handleNext}
            onBack={handleBack}
            data={(data?.data as any)}
          />
        )}

        {/* Step 3 — Inspection Report */}
        {currentStep === 3 && batchId && (
          <InspectionReport
            batchId={Number(batchId)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {/* Step 4 — Waiting for Admin Approval */}
        {currentStep === 4 && (
          <div className="container mx-auto px-4 py-16 max-w-2xl">
            <Card>
              <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
                {isAdminApproved ? (
                  <>
                    <CheckCircle2 className="w-16 h-16 text-green-500 mb-6" />
                    <h2 className="text-2xl font-bold text-foreground mb-3">
                      {t("batchView.approved", "Admin Approved!")}
                    </h2>
                    <p className="text-muted-foreground mb-8">
                      {t(
                        "batchView.approvedDesc",
                        "Your submission has been approved. You can now proceed to payment."
                      )}
                    </p>
                    <Button
                      size="lg"
                      className="bg-accent hover:bg-accent/90"
                      onClick={() => setCurrentStep(5)}
                    >
                      {t("batchView.proceedToPayment", "Proceed to Payment")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Clock className="w-16 h-16 text-amber-500 mb-6" />
                    <h2 className="text-2xl font-bold text-foreground mb-3">
                      {t("batchView.waitingApproval", "Waiting for Admin Approval")}
                    </h2>
                    <p className="text-muted-foreground">
                      {t(
                        "batchView.waitingApprovalDesc",
                        "Your submission is under review. Once the admin approves, you will be able to proceed to the payment step."
                      )}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 5 — Payment */}
        {currentStep === 5 && batchId && (
          <PaymentStep
            batchId={Number(batchId)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {/* Step 6 — Report */}
        {currentStep === 6 && batchId && (
          <ReportStep
            batchId={Number(batchId)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {/* Step 7 — Confirmation */}
        {currentStep === 7 && (
          <Confirmation onFinish={() => navigate("/dashboard")} />
        )}
      </div>
    </div>
  );
};

export default BatchView;
