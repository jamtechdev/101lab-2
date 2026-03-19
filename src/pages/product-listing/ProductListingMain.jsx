import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import UploadMethod from "../dashboard/UploadMethod";
import InspectionReport from "../dashboard/InspectionReport";
import BiddingStep from "../dashboard/BiddingStep";
import BiddingAndInspectionStep from "../dashboard/BiddingAndInspectionStep";
import PaymentStep from "../dashboard/PaymentStep";
import ReportStep from "../dashboard/ReportStep";
import Confirmation from "../dashboard/Confirmation";
import StepIndicator from "@/components/common/StepIndicator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

import Header from "./Header";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGetBatchByIdQuery } from "@/rtk/slices/batchApiSlice";
import { subscribeBuyerEvents } from "../../socket/buyerEvents";
import { subscribeSellerEvents } from "../../socket/sellerEvents";
import toast from "react-hot-toast";

const ProductListingMain = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const steps = [
    t("productListing.steps.upload"),       
    t("productListing.steps.bidding"),     
    t("productListing.steps.inspection"),   
    t("productListing.steps.bidding1"),     
    t("productListing.steps.payment"),      
    t("productListing.steps.report"),       
    t("productListing.steps.confirmation"), 
  ];
  const [searchParams, setSearchParams] = useSearchParams();
  const urlStep = searchParams.get("step");
  const urlBatch = searchParams.get("batchId");

  const parsedBatchId = urlBatch ? Number(urlBatch) : null;

  const [currentStep, setCurrentStep] = useState(urlStep ? Number(urlStep) : 1);
  const [batchId, setBatchId] = useState(parsedBatchId);
  const [finalStep, setFinalStep] = useState("");

  // Fetch batch from backend
  const { data: batchData, refetch } = useGetBatchByIdQuery(Number(batchId), {
    skip: !batchId,
  });

  // Track whether the approval toast has already been shown for this batch
  // to avoid re-firing on unrelated seller events (e.g. chat notifications)
  const approvalToastShown = useRef(false);

  // Reset the toast guard whenever the batchId changes
  useEffect(() => {
    approvalToastShown.current = false;
  }, [batchId]);


  // useEffect(() => {
  //   if (batchData?.data?.batch?.approval_status === "approved") {
  //     approvalToastShown.current = true;
  //   }
  // }, [batchData]);

  // const finalStep = batchData?.data?.batch?.step || steps.length;
  useEffect(() => {
    setFinalStep(batchData?.data?.batch?.step);
  }, [batchData]);

  useEffect(() => {
    const unsubBuyer = subscribeBuyerEvents(() => {
      refetch();
    });
    return unsubBuyer;
  }, [refetch]);

  // Socket.IO: when admin approves this batch, seller gets seller_batch_updated → refetch so step 2 unlocks
  useEffect(() => {
    const unsubSeller = subscribeSellerEvents(() => {
      refetch().then((result) => {
        const batch = result?.data?.data?.batch;
        if (batch?.approval_status === "approved" && !approvalToastShown.current) {
          approvalToastShown.current = true;
          toast.success(t("productListing.listingApprovedByAdmin"));
        }
      });
    });
    return unsubSeller;
  }, [refetch, t]);

  const navigateWithQuery = (step, batchId) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("step", String(step));
      if (batchId != null) params.set("batchId", String(batchId));
      return params;
    }, { replace: true });
  };

  const approvalStatus = batchData?.data?.batch?.approval_status || "pending";
  const batchStep = batchData?.data?.batch?.step || 1;
  // Steps 1-3 are always accessible; steps 4+ require admin approval
  let allowedStep = approvalStatus === "approved" ? batchStep : Math.min(batchStep, 3);

  // Visual step: internal step 3 is "Thank you / pending" screen shown at visual step 3
  // Internal steps 4+ subtract 1 to align with the 7-step visual indicator
  const visualStep = currentStep > 3 ? currentStep - 1 : currentStep;
  const visualAllowedStep = allowedStep > 3 ? allowedStep - 1 : allowedStep;

  useEffect(() => {
    if (batchId) localStorage.setItem("listing_batch", batchId);
  }, [batchId]);

  const resetFlow = () => {
    localStorage.removeItem("listing_step");
    localStorage.removeItem("listing_batch");
  };

  // NOTE: do NOT clear state on beforeunload — batchId in URL survives refresh

  useEffect(() => {
    if (urlStep) setCurrentStep(Number(urlStep));
    if (urlBatch) setBatchId(Number(urlBatch));
  }, [urlStep, urlBatch]);

  // When batch is pending approval, steps 1-3 are allowed — redirect if user is on step 4+
  // When batch is approved and user is still on step 3 (Thank you screen), auto-advance to step 4
  useEffect(() => {
    if (!batchId || !batchData?.data?.batch) return;
    if (approvalStatus !== "approved" && currentStep > 3) {
      setCurrentStep(3);
      navigateWithQuery(3, batchId);
    } else if (approvalStatus === "approved" && currentStep === 3) {
      setCurrentStep(batchStep);
      navigateWithQuery(batchStep, batchId);
    }
  }, [batchId, batchData?.data?.batch, approvalStatus]);


  useEffect(() => {
    if (urlBatch && Number(urlBatch) !== batchId) {
      setBatchId(Number(urlBatch));
    }
  }, [urlBatch]);

  const handleNext = async (id, options = {}) => {
    const newBatchId = id || batchId;
    const advanceBy = options?.advanceBy ?? 1;
    const nextStep = currentStep + advanceBy;

    if (newBatchId) setBatchId(newBatchId);
    setCurrentStep(nextStep);
    navigateWithQuery(nextStep, newBatchId);

    // REFRESH batch from backend immediately
    if (newBatchId) {
      await refetch();
    }
  };

  // When user completes step 1 (new batch created), advance to step 2 (bidding & inspection)
  const handleBatchCreated = async (newBatchId) => {
    if (newBatchId) {
      setBatchId(newBatchId);
      setCurrentStep(2);
      navigateWithQuery(2, newBatchId);
      await refetch();
    }
  };

  const handleBack = async () => {
    const prev = currentStep - 1;
    if (currentStep === 2) resetFlow();

    if (currentStep > 1) {
      setCurrentStep(prev);
      navigateWithQuery(prev, batchId);

      // REFRESH batch from backend
      if (batchId) {
        await refetch();
      }
    }
  };

  useEffect(() => {
    if (batchId) {
      refetch();
    }
  }, [batchId]);

  // useEffect(() => {
  //   if (urlStep && Number(urlStep) !== currentStep) {
  //     window.location.reload();
  //   }
  // }, [currentStep, urlStep]);

  useEffect(() => {
    if (batchData?.data?.batch?.step) {
      const batchStep = batchData.data.batch.step;
      setFinalStep(batchStep);

      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("finalStep", batchStep.toString());
        return newParams;
      }, { replace: true });
    }
  }, [batchData]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <StepIndicator
        currentStep={visualStep}
        totalSteps={steps.length}
        steps={steps}
        allowedStep={visualAllowedStep}
        onStepClick={(visualStepNum) => {
          // When allowedStep > 3 (batch approved), visual 3+ maps to internal step+1 (skipping the pending screen)
          // When allowedStep <= 3 (still pending), visual 3 maps to internal step 3 (the thank you / pending screen)
          const internalStep = (visualStepNum >= 3 && allowedStep > 3) ? visualStepNum + 1 : visualStepNum;
          if (internalStep <= allowedStep) {
            setCurrentStep(internalStep);
            navigateWithQuery(internalStep, batchId);
          }
        }}
        data={batchData?.data?.batch}
      />

      {batchId && currentStep > 1 && (
        <div className="w-full max-w-3xl mx-auto px-3 mt-1 flex justify-end">
          <a
            href={`/upload/batch/${batchId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full
              text-sm font-semibold bg-primary text-primary-foreground
              shadow-md border border-primary hover:opacity-90 transition-opacity cursor-pointer"
          >
            <span className="bg-white/20 px-1 rounded-md text-xs">
              {t("factories.tracking.batchId")}
            </span>
            <span>{batchId}</span>
          </a>
        </div>
      )}

      <div>
        {/* Step 1: Upload form (always the form, no thank-you here) */}
        {currentStep === 1 && (
          <UploadMethod
            onNext={handleNext}
            onBatchCreated={handleBatchCreated}
            batchId={batchId}
          />
        )}

        {/* Step 2: Bidding & Inspection */}
        {currentStep === 2 && batchId && (
          <BiddingAndInspectionStep
            batchId={batchId}
            onMergedNext={(id) => handleNext(id, { advanceBy: 1 })}
            onBack={handleBack}
            data={batchData?.data?.insepction}
          />
        )}

        {/* Step 3: Thank you / pending admin approval */}
        {currentStep === 3 && batchId && (
          <div className="w-full max-w-3xl mx-auto px-3 py-8">
            <Card>
              <CardContent className="p-8 flex flex-col gap-6">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-8 h-8 text-accent flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground">
                      {t("productListing.approvalPending.title")}
                    </h2>
                    <p className="mt-2 text-muted-foreground leading-relaxed">
                      {t("productListing.approvalPending.message")}
                    </p>
                    <p className="mt-3 text-sm font-medium text-foreground">
                      {t("productListing.approvalPending.afterApprovalLockOpen")}
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-muted/60 text-foreground border border-border/60 w-fit">
                  <span className="text-muted-foreground">{t("factories.tracking.batchId")}</span>
                  <span className="font-semibold tabular-nums">{batchId}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => { setCurrentStep(1); navigateWithQuery(1, batchId); }}
                  >
                    {t("productListing.approvalPending.editListing")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 4 && batchId && (
          <InspectionReport
            batchId={batchId}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 5 && batchId && (
          <BiddingStep
            batchId={batchId}
            onNext={handleNext}
            onBack={handleBack}
            data={batchData?.data}
            
          />
        )}

        {/* {currentStep === 5 && batchId && (
          <BiddingStep
            batchId={batchId}
            onNext={handleNext}
            onBack={handleBack}
            data={batchData?.data}
          />
        )} */}

        {currentStep === 6 && batchId && (
          <PaymentStep
            batchId={batchId}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 7 && batchId && (
          <ReportStep
            batchId={batchId}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {/* Final Step */}
        {currentStep > 7 && <Confirmation onFinish={resetFlow} />}
      </div>

      
    </div>
  );
};

export default ProductListingMain;
