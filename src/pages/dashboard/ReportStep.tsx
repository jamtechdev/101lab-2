import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, CheckCircle2, Award, Calendar as CalendarIcon, Truck, Package, PenLine } from "lucide-react";
import { toast } from "react-hot-toast"
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import { useGetBatchReportQuery, useUpdatePickupForWinnerMutation } from "@/rtk/slices/bidApiSlice";
import { t } from "i18next";
import { useTranslation } from "react-i18next";

// Validation schema
const pickupSchema = z.object({
  pickupDate: z.date({ required_error: "Pickup date is required" }),
  pickupTime: z.string().min(1, { message: "Pickup time is required" }),
});


const formatTimeSlot = (slot: string, t: any) => {
  return slot
    .replace(/\bAM\b/g, t("time.AM"))
    .replace(/\bPM\b/g, t("time.PM"));
};

const ReportStep = ({ batchId, onNext, onBack }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const winnerIdFromUrl = searchParams.get("winner");
  const [awardedBidId] = useState<string | null>(winnerIdFromUrl);

  const [pickupDate, setPickupDate] = useState<Date>();
  const [pickupTime, setPickupTime] = useState<string>("");
  const [pickupComplete, setPickupComplete] = useState<boolean>(false);
  const [isCustomSlot, setIsCustomSlot] = useState(false);
  const [customStart, setCustomStart] = useState({ hour: "9", minute: "00", period: "AM" });
  const [customEnd, setCustomEnd] = useState({ hour: "10", minute: "00", period: "AM" });
  const [savedCustomSlot, setSavedCustomSlot] = useState<string | null>(null);
  const { t } = useTranslation()
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Fetch API data - refetch on mount to ensure fresh data after payment confirmation
  const { data, isLoading, error, refetch } = useGetBatchReportQuery(batchId, {
    refetchOnMountOrArgChange: true,
  });


  const [updatePickupForWinner, { isLoading: isUpdating }] = useUpdatePickupForWinnerMutation();
  const report = data?.report;

  // API mappings - define winningBidApi before using it in useEffect
  const winningBidApi = report?.winning_company ?? null;

  // Refetch report on mount to ensure we have latest payment status after payment confirmation
  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]); // Only refetch when batchId changes

  // Sync pickup date/time from report to local state
  // Pickup date/time can be in report.pickup_date/pickup_time OR report.winning_company.pickup_date/pickup_time
  useEffect(() => {
    const pickupDateValue = report?.pickup_date || winningBidApi?.pickup_date;
    const pickupTimeValue = report?.pickup_time || winningBidApi?.pickup_time;

    if (pickupDateValue && pickupTimeValue) {
      try {
        const date = parseISO(pickupDateValue);
        setPickupDate(date);
        setPickupTime(pickupTimeValue);
      } catch (err) {
        console.error("Error parsing pickup date:", err);
      }
    } else if (pickupDateValue) {
      // If only date exists, still set it
      try {
        const date = parseISO(pickupDateValue);
        setPickupDate(date);
      } catch (err) {
        console.error("Error parsing pickup date:", err);
      }
    }
  }, [report?.pickup_date, report?.pickup_time, winningBidApi?.pickup_date, winningBidApi?.pickup_time]);

  // Helper values to get display date/time from report or local state
  // Check both report direct fields and winning_company fields
  const pickupDateFromReport = report?.pickup_date || winningBidApi?.pickup_date;
  const pickupTimeFromReport = report?.pickup_time || winningBidApi?.pickup_time;
  const displayPickupDate = pickupDate || (pickupDateFromReport ? parseISO(pickupDateFromReport) : null);
  const displayPickupTime = pickupTime || pickupTimeFromReport || null;

  const translatedPickupTime = displayPickupTime
    ?.replace("AM", t("time.AM"))
    ?.replace("PM", t("time.PM"));

  // API mappings
  const inspectionCompaniesApi = report?.inspection_companies ?? [];

  const buyerDetail = report?.buyerDetails ?? {}

  const bidsApi = report?.bids ?? [];
  // winningBidApi already defined above

  const companiesRegistered = report?.companies_registered ?? 0;
  const companiesAttended = report?.companies_attended ?? 0;
  const totalBids = report?.total_bids_received ?? 0;
  const winningAmount = report?.winning_amount ?? null;


  const urlFinalStep = searchParams.get("finalStep")

  // Map inspection companies to UI format
  const inspectionCompanies = inspectionCompaniesApi.map((item, index) => ({
    companyName: item.company_name,
    name: item.inspector_name || "N/A",
    country: "N/A",
    contactPerson: item?.buyer?.display_name || "N/A",
    email: item?.buyer?.user_email || "N/A",
    attended: item.attended,
  }));



  // Handle initial pickup scheduling (without confirmation)
  const handleSchedulePickup = async () => {
    try {
      // Validate
      pickupSchema.parse({ pickupDate, pickupTime });
      setErrors({});

      if (!winningBid?.winnerId) {
        return toast.error("No winner selected");
      }

      // Backend will validate payment exists - no need to pre-check here
      // If payment is not confirmed, backend will return appropriate error

      // Call PUT API to schedule pickup (without confirmation flags)
      await updatePickupForWinner({
        buyer_bid_id: Number(winningBid.winnerId),
        pickup_date: pickupDate!.toISOString().split("T")[0], // YYYY-MM-DD
        pickup_time: pickupTime,
        is_delivery: true,
        batchId: batchId,
        // No confirmSchedule or completePickup flags - just scheduling
      }).unwrap();

      toast.success(t('steps.step5.pickupScheduled', {
        date: format(pickupDate!, "PPP"),
        time: pickupTime
      }));

      // Refetch report to get updated pickup_status
      refetch();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const newErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) newErrors[err.path[0] as string] = err.message;
        });
        setErrors(newErrors);
        toast.error(t('steps.step5.completePickupSchedule'));
      } else {
        // Handle "Payment not found" error specifically
        const errorMessage = error?.data?.message || error?.message || "Failed to schedule pickup";
        if (errorMessage.includes("Payment not found") || errorMessage.includes("payment")) {
          toast.error(t('steps.step5.paymentRequiredForPickup'));
        } else {
          toast.error(errorMessage);
        }
      }
    }
  };

  // Handle confirming pickup schedule (BEFORE pickup)
  const handleConfirmPickupSchedule = async () => {
    if (!pickupDate || !pickupTime) {
      return toast.error(t('steps.step5.schedulePickupFirst'));
    }

    try {
      if (!winningBid?.winnerId) {
        return toast.error("No winner selected");
      }

      await updatePickupForWinner({
        buyer_bid_id: Number(winningBid.winnerId),
        pickup_date: pickupDate.toISOString().split("T")[0],
        pickup_time: pickupTime,
        is_delivery: true,
        batchId: batchId,
        confirmSchedule: true, // Confirm the schedule,
        confirmPickup: true

      }).unwrap();

      toast.success(t('steps.step5.pickupScheduleConfirmed'));

      // Refetch report to get updated pickup_status
      refetch();
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Failed to confirm pickup schedule";
      if (errorMessage.includes("Payment not found") || errorMessage.includes("payment")) {
        toast.error(t('steps.step5.paymentRequiredForPickup'));
      } else {
        toast.error(errorMessage);
      }
    }
  };

  // Handle confirming pickup completion (AFTER pickup)
  const handleConfirmPickupCompleted = async () => {
    if (!pickupComplete) {
      return toast.error(t('steps.step5.confirmPickupComplete'));
    }

    try {
      if (!winningBid?.winnerId) {
        return toast.error("No winner selected");
      }

      // Send existing pickup date/time when completing (backend keeps them)
      const existingPickupDate = pickupDate || (pickupDateFromReport ? parseISO(pickupDateFromReport) : null);
      const existingPickupTime = pickupTime || pickupTimeFromReport || null;
      await updatePickupForWinner({
        buyer_bid_id: Number(winningBid.winnerId),
        pickup_date: existingPickupDate ? existingPickupDate.toISOString().split("T")[0] : null,
        pickup_time: existingPickupTime,
        is_delivery: true,
        batchId: batchId,
        completePickup: true,

      }).unwrap();

      toast.success(t('steps.step5.pickupCompletedConfirmed'));

      // Refetch report to get updated pickup_status
      refetch();

      if (onNext) {
        onNext(batchId);
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Failed to confirm pickup completion";
      if (errorMessage.includes("Payment not found") || errorMessage.includes("payment")) {
        toast.error(t('steps.step5.paymentRequiredForPickup'));
      } else {
        toast.error(errorMessage);
      }
    }
  };

  // Handle confirming transaction completion (final step - notifies buyer, 101Recycle, and admin)
  const handleConfirmTransactionCompleted = async () => {
    try {
      if (!winningBid?.winnerId) {
        return toast.error("No winner selected");
      }

      // Call the same endpoint to mark transaction as completed
      // Backend will send notifications to buyer, 101Recycle, and administrators
      await updatePickupForWinner({
        buyer_bid_id: Number(winningBid.winnerId),
        pickup_date: pickupDate ? pickupDate.toISOString().split("T")[0] : report?.pickup_date || null,
        pickup_time: pickupTime || report?.pickup_time || null,
        is_delivery: true,
        batchId: batchId,
        completeTransaction: true,
        completePickup: true,
      }).unwrap();

      toast.success(t('steps.step5.transactionCompletedSuccess') || "Transaction completed successfully! All parties have been notified.");

      // Refetch report to get updated status
      refetch();

      if (onNext) {
        onNext(batchId);
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Failed to complete transaction";
      toast.error(errorMessage);
    }
  };

  // Handle confirming deal (Deal Done button)
  const handleConfirmDeal = async () => {
    // Set pickupComplete to true and call transaction completion
    setPickupComplete(true);
    await handleConfirmTransactionCompleted();
  };

  // Map bids
  const bids = bidsApi.map((b) => ({
    id: "BID-" + b.buyer_bid_id,
    companyName: b.company_name,
    contactName: b.company_name,
    country: "N/A",
    amount: Number(b.amount),
    currency: "USD",
    status: b.status,
  }));

  // Winner mapping
  const winningBid = winningBidApi
    ? {
      id: "BID-" + winningBidApi.buyer_bid_id,
      companyName: winningBidApi.company_name,
      contactName: winningBidApi.company_name,
      country: winningBidApi?.country,
      amount: Number(winningBidApi.amount),
      currency: "USD",
      winnerId: winningBidApi.buyer_bid_id,
      email: winningBidApi?.email
    }
    : null;

  const attendedCompanies = inspectionCompaniesApi.filter((c) => c.attended);

  const timeSlots = [
    "9:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "1:00 PM - 2:00 PM",
    "2:00 PM - 3:00 PM",
    "3:00 PM - 4:00 PM",
  ];

  const formatCurrency = (amount: number, currency: string) => {
    return currency === "TWD"
      ? `NT$${amount.toLocaleString()}`
      : `$${amount.toLocaleString()}`;
  };

  const handleDownloadReport = () => {
    toast.success(t('steps.step5.downloadingReport'));
  };

  // Determine pickup status for UI
  const pickupStatus = report?.pickup_status || (report?.pickup_scheduled ? "scheduled" : null);

  // Check if payment has been confirmed - backend will validate, but we check here for better UX
  // Payment is considered confirmed if:
  // 1. payment_status exists and is not "pending" or empty
  // 2. OR payment_amount is set and greater than 0
  // Note: Backend will ultimately validate, this is just for UI state
  const paymentStatus = winningBidApi?.payment_status?.toLowerCase()?.trim() || "";
  const hasPaymentAmount = winningBidApi?.payment_amount !== null &&
    winningBidApi?.payment_amount !== undefined &&
    Number(winningBidApi.payment_amount) > 0;



  const isPaymentConfirmed = (paymentStatus &&
    paymentStatus !== "pending" &&
    paymentStatus !== "" &&
    paymentStatus !== "unpaid") || hasPaymentAmount;


  const isDeliveryConfirmed =
    winningBidApi?.is_delivery === true &&
    winningBidApi?.pickup_status === "confirmed";




  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* ---------------------- SUCCESS BANNER --------------------------- */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">
                {t('steps.step5.paymentConfirmedTitle')}
              </h2>
              <p className="text-muted-foreground mt-1">
                付款已收到，現在可以安排取貨時間 (Payment received, you can now arrange pickup)
              </p>
            </div>
          </div>
        </div>

        {/* --------------------- INSPECTION TABLE -------------------------- */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>查驗參與公司 (Inspection Participants)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              ({companiesRegistered} companies registered, {companiesAttended} attended inspection)
              {/* 共 {companiesRegistered} 家公司註冊，{companiesAttended} 家完成查驗 */}
            </p>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>公司名稱 (Company)</TableHead>
                  {/* <TableHead>國家 (Country)</TableHead> */}
                  <TableHead>聯絡人 (Name)</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>狀態 (Status)</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {inspectionCompanies.map((company) => (
                  <TableRow key={company.companyName}>
                    <TableCell>{company.companyName}</TableCell>
                    {/* <TableCell>{company.country}</TableCell> */}
                    <TableCell>{company.contactPerson}</TableCell>
                    <TableCell>{company.email}</TableCell>
                    <TableCell>
                      {company.attended ? (
                        <Badge className="bg-green-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" />   已查驗 (Attended)
                        </Badge>
                      ) : (
                        <Badge variant="outline">未出席 (Not Attended)</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ------------------------- BIDS TABLE --------------------------- */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>所有出價紀錄 (All Bids Received)</CardTitle>
              {/* <Button variant="outline" onClick={handleDownloadReport}>
                <Download className="w-4 h-4 mr-2" />       下載報告 (Download)
              </Button> */}
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bid ID</TableHead>
                  <TableHead>公司名稱 (Company)</TableHead>
                  <TableHead>聯絡人 (Contact)</TableHead>
                  {/* <TableHead>國家 (Country)</TableHead> */}
                  <TableHead className="text-right">出價 (Amount)</TableHead>
                  <TableHead>狀態 (Status)</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {bids
                  .sort((a, b) => b.amount - a.amount)
                  .map((bid) => {
                    const isWinner = winningBid && bid.id === winningBid.id;

                    return (
                      <TableRow
                        key={bid.id}
                        className={isWinner ? "bg-accent/10" : ""}
                      >
                        <TableCell>{bid.id}</TableCell>
                        <TableCell>{bid.companyName}</TableCell>
                        <TableCell>{bid.contactName}</TableCell>
                        {/* <TableCell>{bid.country}</TableCell> */}
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(bid.amount, bid.currency)}
                        </TableCell>
                        <TableCell>
                          {isWinner ? (
                            <Badge className="bg-accent text-white">
                              <Award className="w-3 h-3 mr-1" />      得標 (Winner)
                            </Badge>
                          ) : (
                            <Badge variant="outline">未得標 (Not Selected)</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* --------------------- WINNER DETAILS --------------------------- */}
        {winningBid && (
          <Card className="mb-8 border-accent">
            <CardHeader className="bg-accent/5">
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-accent" />得標詳情 (Winner Details)
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">公司名稱 (Company Name)</p>
                  <p className="font-semibold text-lg">
                    {winningBid.companyName}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">聯絡人 (Contact Person)</p>
                  <p className="font-semibold text-lg">
                    {winningBid.contactName}
                  </p>
                </div>


                <div>
                  <p className="text-sm text-muted-foreground">電子郵件 (Email)</p>
                  <p className="font-semibold text-lg">
                    {winningBid.email}
                  </p>
                </div>


                <div>
                  <p className="text-sm text-muted-foreground">國家 (Country)</p>
                  <p className="font-semibold text-lg">
                    {winningBid.country}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">得標金額 (Winning Amount)</p>
                  <p className="font-semibold text-accent text-2xl">
                    {formatCurrency(winningBid.amount, winningBid.currency)}
                  </p>
                </div>
              </div>

              {/* <div className="pt-4 border-t">
                <h4 className="font-semibold text-foreground mb-3">交易條款 (Transaction Terms)</h4>
                <p className="text-sm text-muted-foreground">
                  • Shipping by buyer <br />• Payment already completed
                </p>
              </div> */}
            </CardContent>
          </Card>
        )}

        {/* ------------------------ PICKUP SCHEDULE SECTION ------------------------ */}
        {pickupStatus !== "completed" && Number(urlFinalStep) <= 7 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-accent" />
                {t('steps.step5.pickupSchedule')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Only show warning if we're confident payment isn't confirmed (status is explicitly pending/unpaid) */}
              {!isPaymentConfirmed && (paymentStatus === "pending" || paymentStatus === "unpaid") && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {t('steps.step5.paymentRequiredForPickup')}
                  </p>
                </div>
              )}
              {/* Step 1: Schedule pickup date/time (when not scheduled yet) */}
              {!pickupStatus && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('steps.step5.pickupDate')}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !pickupDate && "text-muted-foreground",
                              errors.pickupDate && "border-destructive"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {pickupDate ? format(pickupDate, "PPP") : t('steps.step5.pickDate')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={pickupDate}
                            onSelect={setPickupDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.pickupDate && (
                        <p className="text-sm text-destructive">{errors.pickupDate}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>{t('steps.step5.pickupTime')}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {timeSlots.map((slot) => (
                          <Button
                            key={slot}
                            variant={!isCustomSlot && pickupTime === slot ? "default" : "outline"}
                            onClick={() => {
                              setIsCustomSlot(false);
                              setPickupTime(slot);
                            }}
                            className="text-xs"
                            size="sm"
                          >
                            {formatTimeSlot(slot, t)}
                          </Button>
                        ))}
                        {/* Custom slot button */}
                        <Button
                          variant={isCustomSlot ? "default" : "outline"}
                          onClick={() => {
                            setIsCustomSlot(true);
                            const val = `${customStart.hour}:${customStart.minute} ${customStart.period} - ${customEnd.hour}:${customEnd.minute} ${customEnd.period}`;
                            setPickupTime(val);
                          }}
                          className="text-xs col-span-2"
                          size="sm"
                        >
                          <PenLine className="w-3 h-3 mr-1" />
                          {t('steps.step5.customSlot') || "Custom Time"}
                        </Button>
                      </div>
                      {/* Custom slot dropdowns */}
                      {isCustomSlot && (
                        <div className="mt-2 p-3 border border-input rounded-md bg-muted/30 space-y-2">
                          {/* Start time */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-10">From</span>
                            <select
                              value={customStart.hour}
                              onChange={(e) => setCustomStart(p => ({ ...p, hour: e.target.value }))}
                              className="flex-1 px-2 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              {["1","2","3","4","5","6","7","8","9","10","11","12"].map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                            <select
                              value={customStart.minute}
                              onChange={(e) => setCustomStart(p => ({ ...p, minute: e.target.value }))}
                              className="flex-1 px-2 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              {["00","15","30","45"].map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                            <select
                              value={customStart.period}
                              onChange={(e) => setCustomStart(p => ({ ...p, period: e.target.value }))}
                              className="flex-1 px-2 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                          {/* End time */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-10">To</span>
                            <select
                              value={customEnd.hour}
                              onChange={(e) => {
                                const updated = { ...customEnd, hour: e.target.value };
                                setCustomEnd(updated);
                              }}
                              className="flex-1 px-2 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              {["1","2","3","4","5","6","7","8","9","10","11","12"].map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                            <select
                              value={customEnd.minute}
                              onChange={(e) => {
                                const updated = { ...customEnd, minute: e.target.value };
                                setCustomEnd(updated);
                              }}
                              className="flex-1 px-2 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              {["00","15","30","45"].map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                            <select
                              value={customEnd.period}
                              onChange={(e) => {
                                const updated = { ...customEnd, period: e.target.value };
                                setCustomEnd(updated);
                              }}
                              className="flex-1 px-2 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                          {/* Save custom slot */}
                          <Button
                            size="sm"
                            className="w-full mt-1"
                            onClick={() => {
                              const val = `${customStart.hour}:${customStart.minute} ${customStart.period} - ${customEnd.hour}:${customEnd.minute} ${customEnd.period}`;
                              setSavedCustomSlot(val);
                              setPickupTime(val);
                              setIsCustomSlot(false);
                            }}
                          >
                            Use this time
                          </Button>
                        </div>
                      )}
                      {/* Saved custom slot appears as a selectable button */}
                      {savedCustomSlot && (
                        <Button
                          variant={pickupTime === savedCustomSlot ? "default" : "outline"}
                          onClick={() => {
                            setPickupTime(savedCustomSlot);
                            setIsCustomSlot(false);
                          }}
                          className="text-xs col-span-2 mt-1"
                          size="sm"
                        >
                          <PenLine className="w-3 h-3 mr-1" />
                          {savedCustomSlot}
                        </Button>
                      )}
                      {errors.pickupTime && (
                        <p className="text-sm text-destructive">{errors.pickupTime}</p>
                      )}
                    </div>
                  </div>

                  {pickupDate && pickupTime && (
                    <Button
                      onClick={handleSchedulePickup}
                      className="w-full"
                      disabled={isUpdating}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {isUpdating ? t('settings.saving') : t('steps.step5.schedulePickup')}
                    </Button>
                  )}
                </>
              )}

              {/* Step 2: Confirm pickup schedule (when scheduled but not confirmed) */}

              {pickupStatus === "scheduled" && displayPickupDate && displayPickupTime && (
                <div className="space-y-4">
                  {/* <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <Package className="w-5 h-5 text-accent mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {t('steps.step5.scheduledPickup')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {displayPickupDate ? format(displayPickupDate, "PPP") : (pickupDateFromReport ? format(parseISO(pickupDateFromReport), "PPP") : "")} - {displayPickupTime || pickupTimeFromReport || ""}
                      </p>
                    </div>
                  </div> */}

                  {/* If is_delivery is true, show badge instead of button */}

                  {pickupStatus === "scheduled" && displayPickupDate && displayPickupTime && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                        <Package className="w-5 h-5 text-accent mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            {t('steps.step5.scheduledPickup')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(displayPickupDate, "PPP")} - {translatedPickupTime}

                          </p>
                        </div>
                      </div>

                      {/* ALWAYS show confirm button when scheduled */}
                      {!isDeliveryConfirmed &&
                        <Button
                          onClick={handleConfirmPickupSchedule}
                          className="w-full"
                          disabled={isUpdating}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          {isUpdating ? t('settings.saving') : t('steps.step5.confirmPickup')}
                        </Button>
                      }
                    </div>
                  )}

                </div>
              )}

              {/* Step 3: Confirm pickup completion (when confirmed but not completed) */}
              {pickupStatus === "confirmed" && (displayPickupDate && displayPickupTime || (pickupDateFromReport && pickupTimeFromReport)) && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {t('steps.step5.scheduledPickup')} - {t('steps.step5.confirmed')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {displayPickupDate ? format(displayPickupDate, "PPP") : (pickupDateFromReport ? format(parseISO(pickupDateFromReport), "PPP") : "")} - {displayPickupTime || pickupTimeFromReport || ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('steps.step5.pickupScheduleConfirmedDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
                    <Checkbox
                      id="pickup-complete"
                      checked={pickupComplete}
                      onCheckedChange={(checked) => setPickupComplete(checked as boolean)}
                    />
                    <Label
                      htmlFor="pickup-complete"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {t('steps.step5.pickupComplete')} - {t('steps.step5.pickupCompleteDesc')}
                    </Label>
                  </div>

                  {pickupComplete && (
                    <Button
                      onClick={handleConfirmPickupSchedule}
                      className={`w-full ${isDeliveryConfirmed
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                        }`}
                      disabled={isDeliveryConfirmed}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {isUpdating
                        ? t("settings.saving")
                        : isDeliveryConfirmed
                          ? t("steps.step5.pickupConfirmed")
                          : t("steps.step5.confirmPickup")}
                    </Button>

                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Transaction completed - Show button to confirm transaction completion */}
        {pickupStatus === "completed" && (
          <Card className="mb-8 border-green-500">
            <CardHeader className="bg-green-50 dark:bg-green-900/20">
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                {t('steps.step5.pickupCompleted')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {t('steps.step5.pickupCompleted')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('steps.step5.pickupCompletedDesc')}
                  </p>
                  {/* Always show pickup schedule if it exists in report */}
                  {(displayPickupDate && displayPickupTime) || (pickupDateFromReport && pickupTimeFromReport) ? (
                    <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                      <p className="text-sm font-semibold text-foreground mb-1">
                        {t('steps.step5.pickupSchedule')}:
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {displayPickupDate ? format(displayPickupDate, "PPP") : (pickupDateFromReport ? format(parseISO(pickupDateFromReport), "PPP") : "")} - {displayPickupTime || pickupTimeFromReport || ""}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  {t('steps.step5.confirmTransactionCompletionDesc') || "Click the button below to confirm that the transaction is completed. This will notify the buyer, 101Recycle, and administrators."}
                </p>
                <Button
                  onClick={handleConfirmTransactionCompleted}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isUpdating}
                  size="lg"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {isUpdating ? t('settings.saving') : t('steps.step5.completeTransaction')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Transaction fully completed - Success message */}
        {report?.transaction_completed && (
          <Card className="mb-8 border-green-500">
            <CardHeader className="bg-green-50 dark:bg-green-900/20">
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                {t('steps.step5.transactionCompleted')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                {t('steps.step5.transactionCompletedDesc')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ------------------------ SUMMARY ------------------------ */}
        <Card className="mb-8 bg-muted/30">
          <CardHeader>
            <CardTitle>交易摘要 (Transaction Summary)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">查驗參與數</p>
                <p className="text-2xl font-bold">{companiesAttended}</p>
                <p className="text-xs text-muted-foreground">companies attended</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">總出價數</p>
                <p className="text-2xl font-bold">{totalBids}</p>
                <p className="text-xs text-muted-foreground">total bids received</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">成交金額</p>
                <p className="text-2xl font-bold text-accent">
                  {winningAmount ? formatCurrency(Number(winningAmount), "USD") : "-"}
                </p>
                <p className="text-xs text-muted-foreground">winning amount</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ------------------------ ACTIONS ------------------------ */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            {t('steps.step5.returnDashboard')}
          </Button>

          {/* {report?.pickup_scheduled && urlFinalStep && Number(urlFinalStep) <= 7 && (
            <Button
              onClick={handleConfirmDeal}
              size="lg"
              className="bg-accent"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {pickupComplete ? t('biddingStep.selected') : t('biddingStep.confirmSelected')}
            </Button>
          )} */}


          {isDeliveryConfirmed && urlFinalStep && Number(urlFinalStep) <= 7 && (
            <Button
              onClick={handleConfirmDeal}
              size="lg"
              className="bg-accent"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Deal Done
            </Button>
          )}

        </div>

      </div>
    </div>
  );
};

export default ReportStep;
