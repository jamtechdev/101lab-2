// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import StepIndicator from "@/components/common/StepIndicator";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Award, CreditCard, CheckCircle2, DollarSign, AlertCircle, Edit, Mail, Phone, MapPin, User, Building2 } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { subscribeSellerEvents } from "@/socket/sellerEvents"
import logo from "@/assets/greenbidz_logo.png";
import { format, parseISO } from "date-fns";
import { useGetWinnerForBatchQuery, useGetPaymentsByBatchQuery, useAddPaymentForWinnerMutation, useUpdatePaymentMutation } from "@/rtk/slices/bidApiSlice";
import { formatDate } from "@/utils/formatDate";
import i18n from "@/i18n/config";
import { pushPurchaseEvent } from "@/utils/gtm";

type FormatOptions = {
  perKg?: boolean;
};


// Mock bids data
const mockBids = [
  {
    id: "BID-001",
    buyerName: "ABC Manufacturing Pte Ltd",
    contactName: "John Tan",
    country: "Singapore",
    amount: 48500,
    currency: "USD",
    email: "john.tan@abcmfg.com",
    phone: "+65 9123 4567",
  },
  {
    id: "BID-002",
    buyerName: "Global Equipment Trading",
    contactName: "Sarah Wong",
    country: "Malaysia",
    amount: 47200,
    currency: "USD",
    email: "sarah@globalequip.com",
    phone: "+60 12 345 6789",
  },
  {
    id: "BID-003",
    buyerName: "Industrial Solutions Inc",
    contactName: "Mike Chen",
    country: "Taiwan",
    amount: 1450000,
    currency: "TWD",
    email: "mike.chen@indsol.com",
    phone: "+886 912 345 678",
  },
];


const materialLabel = (key: string, t: any) => {
  const camelKey = key.replace(/_([a-z])/g, (_, char) =>
    char.toUpperCase()
  );

  return t(`buyerDashboard.material.${camelKey}`, key.replace(/_/g, " "));
};


const PaymentStep = ({ batchId, onNext, onBack }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "surplus";
  const winnerIdFromUrl = searchParams.get("winner");
  // Payment data is fetched from API, no need for local state
  // Keeping minimal state for compatibility

  const urlFinalStep = Number(searchParams.get("finalStep"))
  const formatCurrency = (
    amount: number,
    curr: string,
    options?: FormatOptions
  ) => {

    if (curr === "kg") {
      return `NTD ${amount.toLocaleString()} /kg`;
    }

    if (options?.perKg) {
      // return `${curr === "TWD" ? "NT$" : "$"}${amount.toLocaleString()}/kg`;
      return `${curr === "TWD" ? "NTD" : "NTD"}${amount.toLocaleString()}/kg`;
    }


    return curr === "TWD"
      ? `NT$${amount.toLocaleString()}`
      : `$${amount.toLocaleString()}`;
  };

  const {
    data: winnerData,
    isLoading,
    isError,

  } = useGetWinnerForBatchQuery(batchId) as any;

  // Fetch payment data from API
  const {
    data: paymentData,
    isLoading: isLoadingPayment,
    refetch: refetchPayment,
  } = useGetPaymentsByBatchQuery(batchId);

  const [addPaymentForWinner] = useAddPaymentForWinnerMutation();
  const [updatePayment, { isLoading: isUpdatingPayment }] = useUpdatePaymentMutation();

  // Based on actual API response structure:
  // winnerData.data.winner contains the winner info
  // paymentData.data is an array, get first element
  const winnerDataAny = winnerData as any;
  const winner = winnerDataAny?.data?.winner || null;
  const buyerDetails = winnerDataAny?.data?.buyerDetails || null;
  const payment = paymentData?.data?.[0] || null;

  // Edit payment state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editPaymentData, setEditPaymentData] = useState({
    payment_method: "",
    transaction_number: "",
  });




  // Payment data is directly used from API response, no need for useEffect




  // const winner = mockBids.find(b => b.id === winnerIdFromUrl);

  // if (isError || !winner) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <Card className="max-w-md">
  //         <CardContent className="pt-6">
  //           <div className="text-center">
  //             <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
  //             <h2 className="text-xl font-bold mb-2">{t("payment.winnerNotFound")}</h2>
  //             <p className="text-muted-foreground mb-4">
  //               {t("payment.cannotFindWinner")}
  //             </p>
  //             <Button onClick={() => navigate("/dashboard")}>
  //               {t("payment.backToDashboard")}
  //             </Button>
  //           </div>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   );
  // }


  const handleProceedToPickup = async () => {


    if (!payment) {
      toast.error(t("paymentLog.errorMissingInfo"));

    }

    // const isConfirmed = window.confirm(
    //   `${t("paymentLog.title")}\n\n${t("paymentLog.confirmMessage")}`
    // );

    // if (!isConfirmed) return;

    try {
      // Call /winner/create API to mark payment as confirmed (JSON body)
      const payload = {
        buyer_bid_id: Number(winner.buyer_bid_id),
        payment_method: payment.payment_method || "",
        transaction_number: payment.transaction_number || "",
        amount: payment.amount || winner.amount || 0,
        status: "paid",
      };

      const paymentResponse: any = await addPaymentForWinner(payload).unwrap();
      toast.success("Payment confirmed successfully!");

      try {
        const transaction_id =
          paymentResponse?.data?.transaction_id ||
          paymentResponse?.data?.id ||
          payment?.transaction_number ||
          `bid-${winner.buyer_bid_id}`;

        pushPurchaseEvent({
          transaction_id: String(transaction_id),
          transaction_type: "bid_won",
          offer_rounds: null,
          value: winner.amount,
          currency: winner.currency || "INR",
          items: [{
            item_id: batchId || winner.buyer_bid_id,
            item_name: "",
            item_category: "",
            price: winner.amount,
            quantity: 1,
          }],
        });
      } catch (gtmErr) {
        console.warn("[GTM] purchase event (bid_won) failed:", gtmErr);
      }

      // Navigate to next step after successful API call
      if (onNext) {
        onNext(batchId);
      }
    } catch (err: any) {
      console.error("Payment confirmation error:", err);
      toast.error(err?.data?.message || "Failed to confirm payment");
    }
  };



  const isWeightBased = winner?.quotation_types?.includes("weight_based");
  const isWholeItem = winner?.quotation_types?.includes("whole_item");

  const totalWeightAmount = isWeightBased
    ? Object.values(winner?.weight_quotations || {}).reduce(
      (sum, val) => sum + Number(val || 0),
      0
    )
    : 0;



  useEffect(() => {
    const unsub = subscribeSellerEvents(() => {
      refetchPayment();
    });

    return unsub;
  }, []);


  // Initialize edit form when payment data is loaded or dialog opens
  useEffect(() => {
    if (payment && isEditDialogOpen) {
      setEditPaymentData({
        payment_method: payment.payment_method || "",
        transaction_number: payment.transaction_number || "",
      });
    }
  }, [payment, isEditDialogOpen]);

  // Handle update payment
  const handleUpdatePayment = async () => {
    if (!payment || !payment.payment_id) {
      toast.error("Payment information not available");
      return;
    }

    if (!editPaymentData.payment_method || !editPaymentData.transaction_number) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        payment_method: editPaymentData.payment_method,
        transaction_number: editPaymentData.transaction_number,
      };

      await updatePayment({
        payment_id: payment.payment_id,
        data: payload,
      }).unwrap();

      toast.success("Payment updated successfully!");
      setIsEditDialogOpen(false);

      // Refetch payment data to get updated information
      refetchPayment();
    } catch (err: any) {
      console.error("Payment update error:", err);
      toast.error(err?.data?.message || "Failed to update payment");
    }
  };



  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {/* <header className="border-b border-border bg-card shadow-soft sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <img 
            src={logo} 
            alt="GreenBidz" 
            className="h-8 w-auto cursor-pointer"
            onClick={() => navigate("/")}
          />
        </div>
      </header> */}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('payment.back')}
        </Button>

        {/* Step Indicator */}
        {/* <StepIndicator 
          currentStep={5} 
          totalSteps={6}
          steps={["Upload", "Inventory", "Inspection", "Bidding", "Payment", "Report"]}
        /> */}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('payment.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('payment.subtitle')}
          </p>
        </div>

        {/* Winner Details */}
        <Card className="mb-8 border-accent">
          <CardHeader className="bg-accent/5">
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" />
              {t("payment.winnerInformation")}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company */}
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("buyer.company")}</p>
                  <p className="font-semibold">{winner?.company_name || "-"}</p>
                </div>
              </div>

              {/* Contact Person */}
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("payment.contactPerson")}</p>
                  <p className="font-semibold">{winner?.contact_person || buyerDetails?.display_name || "-"}</p>
                </div>
              </div>

              {/* Email */}
              {buyerDetails?.user_email && (
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("common.email") || "Email"}</p>
                    <p className="font-semibold break-all">{buyerDetails.user_email}</p>
                  </div>
                </div>
              )}

              {/* Phone */}
              {buyerDetails?.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("common.phone") || "Phone"}</p>
                    <p className="font-semibold">{buyerDetails.phone}</p>
                  </div>
                </div>
              )}

              {/* Country */}
              {buyerDetails?.country && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("common.country") || "Country"}</p>
                    <p className="font-semibold">{buyerDetails.country}</p>
                  </div>
                </div>
              )}

              {/* Address */}
              {buyerDetails?.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("common.address") || "Address"}</p>
                    <p className="font-semibold">{buyerDetails.address}</p>
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex items-start gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">{t("buyer.table.Status")}</p>
                  <p className="font-semibold text-sm">
                    {winner?.status === "pending" && t('buyerDashboard.bidStatusPending')}
                    {winner?.status === "accepted" && t('buyerDashboard.bidStatusAccepted')}
                    {winner?.status === "rejected" && t('buyerDashboard.bidStatusRejected')}
                    {winner?.status === "counter_offer" && t('buyerDashboard.bidStatusCounterOffer')}
                  </p>
                </div>
              </div>
            </div>

            {/* ================= WHOLE ITEM ================= */}
            {isWholeItem && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("payment.winningAmount")}
                </p>
                <p className="font-semibold text-accent text-3xl">
                  {formatCurrency(
                    Number(winner?.amount || 0),
                    winner?.currency || "USD"
                  )}
                </p>
              </div>
            )}

            {/* ================= WEIGHT BASED ================= */}
            {isWeightBased && winner?.weight_quotations && (
              <div className="space-y-3">
                <div className="border rounded-lg p-4 space-y-2">
                  {Object.entries(winner.weight_quotations).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between text-sm font-medium"
                    >
                      <span>
                        {materialLabel(key, t)}
                      </span>
                      <span>
                        {formatCurrency(Number(value), "kg")}
                      </span>
                    </div>
                  ))}

                  <div className="border-t pt-3 flex justify-between font-semibold text-lg text-accent">
                    <span>{t("common.total")}</span>
                    <span>{formatCurrency(totalWeightAmount, "kg")}</span>
                  </div>
                </div>
              </div>
            )}


          </CardContent>
        </Card>


        {/* Payment Confirmation Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-accent" />
              {t('payment.paymentConfirmation')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Instructions */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-foreground mb-3">{t('payment.paymentInstructions')}</h4>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{t('payment.paymentTerms')}:</span> {t('payment.paymentTermsDesc')}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{t('payment.dueDate')}:</span> {" "}
                  {formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), i18n.language)}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{t('payment.acceptedMethods')}:</span> {t('payment.acceptedMethodsDesc')}
                </p>
              </div>
            </div>

            {/* Payment Done Section - Always show fetched payment data */}
            <div className="space-y-4">
              {payment ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-foreground text-lg">
                          {t('payment.paymentDone')}
                        </h3>
                        {urlFinalStep <= 6 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditDialogOpen(true)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        {/* <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('common.amount')}:</span>
                          <span className="font-semibold text-foreground">
                            {formatCurrency(Number(payment?.amount || winner?.amount || 0), winner?.currency || "USD")}
                          </span>
                        </div> */}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('payment.method')}:</span>
                          <span className="font-semibold text-foreground">{payment?.payment_method || ""}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('payment.transactionId')}:</span>
                          <span className="font-semibold text-foreground">{payment?.transaction_number || ""}</span>
                        </div>
                        {payment?.createdAt && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('payment.confirmedAt')}:</span>
                            <span className="font-semibold text-foreground">
                              <p className="text-sm text-foreground">
                                {formatDate(payment.createdAt, i18n.language)}
                              </p>
                            </span>
                          </div>
                        )}
                        {/* Payment Proof Image */}
                        {payment?.payment_proof_url && (
                          <div className="pt-3">
                            <p className="text-muted-foreground mb-2">{t('payment.paymentProof') || "Payment Proof"}:</p>
                            <a
                              href={payment.payment_proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={payment.payment_proof_url}
                                alt="Payment Proof"
                                className="max-w-full w-64 h-auto cursor-pointer border rounded-md hover:opacity-90 transition-opacity"
                              />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/50 rounded-lg p-6 text-center">
                  <p className="text-muted-foreground">{t('payment.noPaymentFound') || "No payment information found"}</p>
                </div>
              )}

              {/* Confirm Payment Button - Just navigates to next step */}
              {urlFinalStep <= 6 && (
                <Button
                  onClick={handleProceedToPickup}
                  className="w-full bg-accent hover:bg-accent/90"
                  size="lg"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  {t('payment.confirmPayment')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save and Continue Later */}
        {/* {!paymentConfirmed && (
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
            >
              {t('payment.saveContinueLater')}
            </Button>
          </div>
        )} */}

        {/* Edit Payment Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t('payment.editPayment') || "Edit Payment Details"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="payment_method">{t('payment.method')} *</Label>
                <Input
                  id="payment_method"
                  value={editPaymentData.payment_method}
                  onChange={(e) =>
                    setEditPaymentData((prev) => ({ ...prev, payment_method: e.target.value }))
                  }
                  placeholder={t('payment.enterPaymentMethod') || "Enter payment method"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaction_number">{t('payment.transactionId')} *</Label>
                <Input
                  id="transaction_number"
                  value={editPaymentData.transaction_number}
                  onChange={(e) =>
                    setEditPaymentData((prev) => ({ ...prev, transaction_number: e.target.value }))
                  }
                  placeholder={t('payment.enterTransactionId') || "Enter transaction number"}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isUpdatingPayment}
              >
                {t('common.cancel') || "Cancel"}
              </Button>
              <Button
                onClick={handleUpdatePayment}
                disabled={isUpdatingPayment}
                className="bg-accent hover:bg-accent/90"
              >
                {isUpdatingPayment ? t('settings.saving') || "Saving..." : t('common.save') || "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PaymentStep;