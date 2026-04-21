import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import ChatBox from "@/pages/chat/ChatBox";
import { useStartBidMutation, useUpdateBidMutation, type StartBidRequest } from "@/rtk/slices/bidApiSlice";
import { useCreateInspectionMutation, useUpdateInspectionMutation } from "@/rtk/slices/productSlice";
import { useSkipFullInspectionForCompanyMutation } from "@/rtk/slices/batchApiSlice";
import { useGetBatchByIdQuery } from "@/rtk/slices/batchApiSlice";
import { Loader2 } from "lucide-react";
import { pushListingCreatedEvent } from "@/utils/gtm";

const biddingSchema = z.object({
  price: z.string().trim()
    .refine((val) => val === "" || !isNaN(Number(val)), { message: "Must be a valid number" })
    .refine((val) => val === "" || Number(val) >= 0, { message: "Must be a positive number" }),
  location: z.string().trim().min(1, { message: "Location is required" }).max(200),
});

interface TimeInfo {
  hour: string;
  minute: string;
  period: "AM" | "PM";
}

const getDefaultStartEndTime = (): { start: TimeInfo; end: TimeInfo } => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + 20);
  let startHour24 = startDate.getHours() + 1;
  if (startHour24 >= 24) startHour24 -= 24;
  const startPeriod = startHour24 >= 12 ? "PM" : "AM";
  const startHour12 = startHour24 % 12 === 0 ? 12 : startHour24 % 12;
  const start: TimeInfo = { hour: startHour12.toString(), minute: "00", period: startPeriod as "AM" | "PM" };
  let endHour24 = startHour24 + 1;
  if (endHour24 >= 24) endHour24 -= 24;
  const endPeriod = endHour24 >= 12 ? "PM" : "AM";
  const endHour12 = endHour24 % 12 === 0 ? 12 : endHour24 % 12;
  const end: TimeInfo = { hour: endHour12.toString(), minute: "00", period: endPeriod as "AM" | "PM" };
  return { start, end };
};

const formatTimeSlot = (slot: string, t: (k: string) => string) => {
  return slot
    .replace(/\bAM\b/g, t("time.AM"))
    .replace(/\bPM\b/g, t("time.PM"));
};

const combineDateAndTime = (date: Date, hour: string, minute: string, period: "AM" | "PM"): Date => {
  const d = new Date(date);
  let h = parseInt(hour) || 0;
  const m = parseInt(minute) || 0;
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  d.setHours(h, m, 0, 0);
  return d;
};

interface BiddingAndInspectionStepProps {
  batchId: number;
  onMergedNext: (id: number) => void;
  onBack: () => void;
  data: any;
}

const BiddingAndInspectionStep = ({ batchId, onMergedNext, onBack, data }: BiddingAndInspectionStepProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { start, end } = getDefaultStartEndTime();

  // Bidding state (same as BiddingConfig)
  const [biddingStartDate, setBiddingStartDate] = useState<Date>(new Date());
  const [biddingEndDate, setBiddingEndDate] = useState<Date>(new Date());
  const [pricingMode, setPricingMode] = useState<"make-offer" | "fixed-price">("make-offer");
  const [targetPrice, setTargetPrice] = useState<string>("");
  const [fixedPrice, setFixedPrice] = useState<string>("");
  const [showPriceToBidders, setShowPriceToBidders] = useState<boolean>(false);
  const [currency, setCurrency] = useState<string>("TWD");
  const [location, setLocation] = useState<string>("台北市");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [isTaxInclusive, setIsTaxInclusive] = useState<boolean>(true);
  const [allowWholePrice, setAllowWholePrice] = useState<boolean>(true);
  const [allowWeightPrice, setAllowWeightPrice] = useState<boolean>(false);

  // Bidding time pickers
  const [biddingStartHour, setBiddingStartHour] = useState("9");
  const [biddingStartMinute, setBiddingStartMinute] = useState("00");
  const [biddingStartPeriod, setBiddingStartPeriod] = useState<"AM" | "PM">("AM");
  const [biddingEndHour, setBiddingEndHour] = useState("5");
  const [biddingEndMinute, setBiddingEndMinute] = useState("00");
  const [biddingEndPeriod, setBiddingEndPeriod] = useState<"AM" | "PM">("PM");

  // Inspection state (same as InspectionPrice)
  const [inspectionEnabled, setInspectionEnabled] = useState(false);
  const [inspectionDates, setInspectionDates] = useState<Date[]>([]);
  const [customTimeSlots, setCustomTimeSlots] = useState<string[]>([
    "9:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "1:00 PM - 2:00 PM",
    "2:00 PM - 3:00 PM",
    "3:00 PM - 4:00 PM",
  ]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [startHour, setStartHour] = useState(start.hour);
  const [startMinute, setStartMinute] = useState(start.minute);
  const [startPeriod, setStartPeriod] = useState(start.period);
  const [endHour, setEndHour] = useState(end.hour);
  const [endMinute, setEndMinute] = useState(end.minute);
  const [endPeriod, setEndPeriod] = useState(end.period);
  const [skipInspectionLoading, setSkipInspectionLoading] = useState(false);

  const { data: batchData } = useGetBatchByIdQuery(batchId, { skip: !batchId });
  const [createBid, { isLoading: isBidLoading }] = useStartBidMutation();
  const [updateBid, { isLoading: isUpdateBidLoading }] = useUpdateBidMutation();
  const [createInspection, { isLoading: isInspectionLoading }] = useCreateInspectionMutation();
  const [updateInspection, { isLoading: isUpdateInspectionLoading }] = useUpdateInspectionMutation();
  const [skipInspection] = useSkipFullInspectionForCompanyMutation();

  const [searchParams] = useSearchParams();

  // Prefill bidding from batch (API returns batch + biddingDetails; typed as Product[] in slice)
  useEffect(() => {
    const details = (batchData?.data as any)?.biddingDetails;
    if (!details) return;
    setPricingMode(details.type === "make_offer" ? "make-offer" : "fixed-price");
    const startD = new Date(details.start_date);
    const endD = new Date(details.end_date);
    setBiddingStartDate(startD);
    setBiddingEndDate(endD);
    const sh = startD.getHours();
    setBiddingStartHour(sh % 12 === 0 ? "12" : (sh % 12).toString());
    setBiddingStartMinute(startD.getMinutes().toString().padStart(2, "0"));
    setBiddingStartPeriod(sh >= 12 ? "PM" : "AM");
    const eh = endD.getHours();
    setBiddingEndHour(eh % 12 === 0 ? "12" : (eh % 12).toString());
    setBiddingEndMinute(endD.getMinutes().toString().padStart(2, "0"));
    setBiddingEndPeriod(eh >= 12 ? "PM" : "AM");
    setTargetPrice(details.type === "make_offer" ? details.target_price?.toString() || "" : "");
    setFixedPrice(details.type === "fixed_price" ? details.target_price?.toString() || "" : "");
    setLocation(details.location || "");
    setCurrency(details.currency || "USD");
    setShowPriceToBidders(details.isHidden !== undefined ? !details.isHidden : false);
    setAllowWholePrice(details.allowWholePrice ?? true);
    setAllowWeightPrice(details.allowWeightPrice ?? false);
    setIsTaxInclusive(details.taxInclusive ?? true);
  }, [batchData]);

  // Prefill inspection from data
  useEffect(() => {
    if (!data?.schedule) return;
    const schedule = data.schedule;
    const datesArray = schedule.map((item: any) => new Date(item.date));
    setInspectionDates(datesArray);
    const slots = schedule[0]?.slots?.map((s: any) => s.time) || [];
    setCustomTimeSlots(slots);
    setSelectedTimeSlots(slots);
    if (schedule.length > 0) setInspectionEnabled(true);
  }, [data]);

  const addTimeSlot = () => {
    if (!startHour || !startMinute || !endHour || !endMinute) {
      toast.error("Please enter full time range");
      return;
    }
    const formattedStart = `${startHour}:${startMinute} ${startPeriod}`;
    const formattedEnd = `${endHour}:${endMinute} ${endPeriod}`;
    const slot = `${formattedStart} - ${formattedEnd}`;
    if (customTimeSlots.includes(slot)) {
      toast.error("This time slot already exists");
      return;
    }
    setCustomTimeSlots([...customTimeSlots, slot]);
    setStartHour(""); setStartMinute(""); setStartPeriod("AM");
    setEndHour(""); setEndMinute(""); setEndPeriod("AM");
  };

  const removeTimeSlot = (slot: string) => {
    setCustomTimeSlots((s) => s.filter((x) => x !== slot));
    setSelectedTimeSlots((s) => s.filter((x) => x !== slot));
  };

  const toggleTimeSlot = (slot: string) => {
    if (selectedTimeSlots.includes(slot)) {
      setSelectedTimeSlots(selectedTimeSlots.filter((s) => s !== slot));
    } else {
      setSelectedTimeSlots([...selectedTimeSlots, slot]);
    }
  };

  const isTimeSlotDisabled = (slot: string) => {
    if (inspectionDates.length === 0) return false;
    const now = new Date();
    const hasTodaySelected = inspectionDates.some((d) => d.toDateString() === now.toDateString());
    if (!hasTodaySelected) return false; // only future dates → always open

    // If any selected date is strictly in the future, the slot is valid for that date
    const todayMidnight = new Date(now); todayMidnight.setHours(0, 0, 0, 0);
    const hasFutureDate = inspectionDates.some((d) => {
      const dMidnight = new Date(d); dMidnight.setHours(0, 0, 0, 0);
      return dMidnight > todayMidnight;
    });
    if (hasFutureDate) return false; // today + future date(s) selected → slot valid for future dates

    // Only today is selected — disable if the slot's end time has already passed
    const parts = slot.split(" - ");
    const endTime = parts[1] ?? parts[0];
    const [time, period] = endTime.trim().split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (period?.toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (period?.toUpperCase() === "AM" && hours === 12) hours = 0;
    const slotEnd = new Date();
    slotEnd.setHours(hours, minutes, 0, 0);
    return slotEnd <= now;
  };

  const validateBiddingTime = () => {
    const parsePart = (val: string) => Number(val.trim());

    if (
      !biddingStartHour.trim() ||
      !biddingStartMinute.trim() ||
      !biddingEndHour.trim() ||
      !biddingEndMinute.trim()
    ) {
      toast.error(t("biddingStep.biddingTimeRequired", "Please enter bidding start and end time"));
      return false;
    }

    const sh = parsePart(biddingStartHour);
    const sm = parsePart(biddingStartMinute);
    const eh = parsePart(biddingEndHour);
    const em = parsePart(biddingEndMinute);

    const inRange = (h: number, m: number) =>
      Number.isFinite(h) && Number.isFinite(m) && h >= 1 && h <= 12 && m >= 0 && m <= 59;

    if (!inRange(sh, sm) || !inRange(eh, em)) {
      toast.error(t("biddingStep.biddingTimeInvalid", "Please enter a valid bidding time (hour 1–12, minute 00–59)"));
      return false;
    }

    const startDateTime = combineDateAndTime(
      biddingStartDate,
      biddingStartHour,
      biddingStartMinute,
      biddingStartPeriod
    );
    const endDateTime = combineDateAndTime(
      biddingEndDate,
      biddingEndHour,
      biddingEndMinute,
      biddingEndPeriod
    );

    if (endDateTime <= startDateTime) {
      toast.error(t("biddingStep.biddingTimeOrderError", "Bidding end time must be after start time"));
      return false;
    }

    return true;
  };

  const handleSetBiddingAndInspection = async () => {
    try {
      if (!biddingStartDate) {
        toast.error("Please select a start date");
        return;
      }
      if (!biddingEndDate) {
        toast.error("Please select an end date");
        return;
      }
      if (biddingEndDate < biddingStartDate) {
        toast.error(t("biddingStep.startError"));
        return;
      }
      if (!validateBiddingTime()) {
        return;
      }
      if (pricingMode === "fixed-price" && (fixedPrice === null || fixedPrice === "")) {
        toast.error(t("biddingStep.priceError"));
        return;
      }
      const priceValue = pricingMode === "make-offer" ? targetPrice : fixedPrice;
      biddingSchema.parse({ price: priceValue, location });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: { [key: string]: string } = {};
        err.errors.forEach((e) => {
          if (e.path[0]) newErrors[e.path[0] as string] = e.message;
        });
        setErrors(newErrors);
        toast.error("Please check your inputs");
      }
      return;
    }

    if (inspectionEnabled && (inspectionDates.length === 0 || selectedTimeSlots.length === 0)) {
      toast.error(t("inspectionPrice.selectDateAndTimeSlot"));
      return;
    }

    setLoading(true);
    try {
      const priceValue = pricingMode === "make-offer" ? targetPrice : fixedPrice;
      const payload = {
        batch_id: batchId,
        type: pricingMode === "make-offer" ? "make_offer" : "fixed_price",
        start_date: format(combineDateAndTime(biddingStartDate, biddingStartHour, biddingStartMinute, biddingStartPeriod), "yyyy-MM-dd HH:mm:ss"),
        end_date: format(combineDateAndTime(biddingEndDate, biddingEndHour, biddingEndMinute, biddingEndPeriod), "yyyy-MM-dd HH:mm:ss"),
        target_price: Number(priceValue),
        location,
        timeZone: userTimeZone,
        notes: { required_docs: "ID proof, business license", inspection_needed: true },
        language: "en",
        currency,
        isHidden: !showPriceToBidders,
        allowWholePrice: allowWholePrice !== undefined ? allowWholePrice : true,
        allowWeightPrice: allowWeightPrice !== undefined ? allowWeightPrice : false,
        taxInclusive: isTaxInclusive,
      };
      const createBidResponse: any = await createBid(payload as StartBidRequest).unwrap();
      toast.success("Bid created successfully!");

      // GA4 tracking — listing_created (canonical moment: deal_type now known)
      try {
        const batch: any = (batchData?.data as any)?.batch;
        const products: any[] = (batchData?.data as any)?.products;
        const firstProduct: any = Array.isArray(products) ? products[0] : undefined;
        const dealType: "bidding" | "make_offer" =
          payload.type === "make_offer" ? "make_offer" : "bidding";
        pushListingCreatedEvent({
          listing_id:             batchId,
          listing_title:          batch?.title ?? firstProduct?.title ?? "",
          listing_category:
            firstProduct?.categories?.[0]?.term_slug
            ?? firstProduct?.categories?.[0]?.term
            ?? firstProduct?.category_name
            ?? "",
          listing_subcategory:    firstProduct?.categories?.[1]?.term_slug
                                  ?? firstProduct?.categories?.[1]?.term
                                  ?? undefined,
          asking_price:           Number(payload.target_price) || 0,
          deal_type:              dealType,
          is_first_listing:       createBidResponse?.data?.is_first_listing,
          sellers_listing_number: createBidResponse?.data?.sellers_listing_number,
          images_uploaded:        Array.isArray(firstProduct?.media)
                                    ? firstProduct.media.length
                                    : undefined,
          currency:               payload.currency,
        });
      } catch { /* tracking errors must never affect UX */ }

      if (inspectionEnabled) {
        const schedule = inspectionDates.map((date) => ({
          date: format(date, "yyyy-MM-dd"),
          slots: selectedTimeSlots.map((time) => ({ time })),
          timezone: userTimeZone,
        }));
        await createInspection({ batch_id: batchId, schedule }).unwrap();
        toast.success(t("inspectionPrice.scheduleSuccess"));
      } else {
        setSkipInspectionLoading(true);
        await skipInspection({ batchId, inspection: true }).unwrap();
        toast.success(t("inspectionReport.inspectionSkipped"));
        setSkipInspectionLoading(false);
      }

      onMergedNext(batchId);
    } catch (error: any) {
      if (error?.data?.message) toast.error(error.data.message);
      else toast.error("Failed to save. Please try again.");
    } finally {
      setLoading(false);
      setSkipInspectionLoading(false);
    }
  };

  const isSubmitting = loading || isBidLoading || isInspectionLoading || skipInspectionLoading || isUpdateBidLoading || isUpdateInspectionLoading;

  const urlFinalStep = searchParams.get("finalStep");
  // isUpdate: bid was already created (step >= 4); backend validates live status and rejects if needed
  const isUpdate = Number(urlFinalStep) >= 4;

  const handleUpdateBiddingAndInspection = async () => {
    try {
      if (!biddingStartDate) { toast.error("Please select a start date"); return; }
      if (!biddingEndDate) { toast.error("Please select an end date"); return; }
      if (biddingEndDate < biddingStartDate) { toast.error(t("biddingStep.startError")); return; }
      if (!validateBiddingTime()) { return; }
      if (pricingMode === "fixed-price" && (fixedPrice === null || fixedPrice === "")) {
        toast.error(t("biddingStep.priceError")); return;
      }
      const priceValue = pricingMode === "make-offer" ? targetPrice : fixedPrice;
      biddingSchema.parse({ price: priceValue, location });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: { [key: string]: string } = {};
        err.errors.forEach((e) => { if (e.path[0]) newErrors[e.path[0] as string] = e.message; });
        setErrors(newErrors);
        toast.error("Please check your inputs");
      }
      return;
    }

    if (inspectionEnabled && (inspectionDates.length === 0 || selectedTimeSlots.length === 0)) {
      toast.error(t("inspectionPrice.selectDateAndTimeSlot")); return;
    }

    setLoading(true);
    try {
      const priceValue = pricingMode === "make-offer" ? targetPrice : fixedPrice;
      const payload = {
        batch_id: batchId,
        type: pricingMode === "make-offer" ? "make_offer" : "fixed_price",
        start_date: format(combineDateAndTime(biddingStartDate, biddingStartHour, biddingStartMinute, biddingStartPeriod), "yyyy-MM-dd HH:mm:ss"),
        end_date: format(combineDateAndTime(biddingEndDate, biddingEndHour, biddingEndMinute, biddingEndPeriod), "yyyy-MM-dd HH:mm:ss"),
        target_price: Number(priceValue),
        location,
        timeZone: userTimeZone,
        notes: { required_docs: "ID proof, business license", inspection_needed: true },
        language: "en",
        currency,
        isHidden: !showPriceToBidders,
        allowWholePrice: allowWholePrice !== undefined ? allowWholePrice : true,
        allowWeightPrice: allowWeightPrice !== undefined ? allowWeightPrice : false,
        taxInclusive: isTaxInclusive,
      };
      await updateBid(payload as StartBidRequest).unwrap();
      toast.success("Bid updated successfully!");

      if (inspectionEnabled) {
        const schedule = inspectionDates.map((date) => ({
          date: format(date, "yyyy-MM-dd"),
          slots: selectedTimeSlots.map((time) => ({ time })),
          timezone: userTimeZone,
        }));
        await updateInspection({ batch_id: batchId, schedule }).unwrap();
        toast.success(t("inspectionPrice.scheduleSuccess"));
      }
      // NOTE: no onMergedNext — step stays the same on update
    } catch (error: any) {
      if (error?.data?.message) {
        const msgMap: Record<string, string> = {
          "Batch is approved and bid has started — cannot update bid settings.": t("biddingStep.bidApprovedStarted"),
          "Batch is approved and inspection date has started — cannot update inspection schedule.": t("biddingStep.inspectionApprovedStarted"),
          "Bidding is live — cannot update bid settings.": t("biddingStep.biddingLive"),
          "Inspection is live — cannot update inspection schedule.": t("biddingStep.inspectionLive"),
        };
        toast.error(msgMap[error.data.message] ?? error.data.message);
      } else {
        toast.error("Failed to update. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("biddingStep.back")}
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("biddingStep.title")}</h1>
          <p className="text-muted-foreground">{t("biddingStep.subtitle")}</p>
        </div>

        {/* Bidding Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("biddingStep.biddingSettings")}</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">{t("biddingStep.settingsDesc")}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>{t("biddingStep.pricingMode")}</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={pricingMode === "make-offer" ? "default" : "outline"}
                  className="h-auto py-4 flex-col items-start text-left"
                  onClick={() => setPricingMode("make-offer")}
                >
                  <span className="font-semibold text-base">{t("biddingStep.makeOffer")}</span>
                  <span className="text-xs opacity-80 mt-1">{t("biddingStep.makeOfferDesc")}</span>
                </Button>
                <Button
                  type="button"
                  variant={pricingMode === "fixed-price" ? "default" : "outline"}
                  className="h-auto py-4 flex-col items-start text-left"
                  onClick={() => setPricingMode("fixed-price")}
                >
                  <span className="font-semibold text-base">{t("biddingStep.fixedPrice")}</span>
                  <span className="text-xs opacity-80 mt-1">{t("biddingStep.fixedPriceDesc")}</span>
                </Button>
              </div>
            </div>

            {/* <div className="space-y-2 border rounded-lg p-4">
              <Label>{t("biddingStep.taxMode")}</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="taxMode"
                    checked={isTaxInclusive}
                    onChange={() => setIsTaxInclusive(true)}
                  />
                  {t("biddingStep.inclusiveTax")}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="taxMode"
                    checked={!isTaxInclusive}
                    onChange={() => setIsTaxInclusive(false)}
                  />
                  {t("biddingStep.exclusiveTax")}
                </label>
              </div>
            </div> */}

            {/* <div className="space-y-2 border rounded-lg p-4">
              <Label>{t("biddingStep.allowedBidTypes")}</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allowWholePrice}
                    onChange={(e) => setAllowWholePrice(e.target.checked)}
                  />
                  {t("biddingStep.wholePrice")}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allowWeightPrice}
                    onChange={(e) => setAllowWeightPrice(e.target.checked)}
                  />
                  {t("biddingStep.priceByWeight")}
                </label>
              </div>
            </div> */}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("biddingStep.biddingStartDate")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !biddingStartDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {biddingStartDate ? format(biddingStartDate, "PPP") : t("biddingStep.pickDate")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={biddingStartDate} onSelect={(date) => date && setBiddingStartDate(date)} initialFocus />
                  </PopoverContent>
                </Popover>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Input placeholder="Hour (1-12)" value={biddingStartHour} onChange={(e) => setBiddingStartHour(e.target.value)} />
                  <Input placeholder="Minute (00-59)" value={biddingStartMinute} onChange={(e) => setBiddingStartMinute(e.target.value)} />
                  <select className="border rounded px-2 py-2 text-sm" value={biddingStartPeriod} onChange={(e) => setBiddingStartPeriod(e.target.value as "AM" | "PM")}>
                    <option value="AM">{t("time.AM")}</option>
                    <option value="PM">{t("time.PM")}</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("biddingStep.biddingEndDate")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !biddingEndDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {biddingEndDate ? format(biddingEndDate, "PPP") : t("biddingStep.pickDate")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={biddingEndDate}
                      onSelect={(date) => date && setBiddingEndDate(date)}
                      disabled={biddingStartDate ? (date) => date < biddingStartDate : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Input placeholder="Hour (1-12)" value={biddingEndHour} onChange={(e) => setBiddingEndHour(e.target.value)} />
                  <Input placeholder="Minute (00-59)" value={biddingEndMinute} onChange={(e) => setBiddingEndMinute(e.target.value)} />
                  <select className="border rounded px-2 py-2 text-sm" value={biddingEndPeriod} onChange={(e) => setBiddingEndPeriod(e.target.value as "AM" | "PM")}>
                    <option value="AM">{t("time.AM")}</option>
                    <option value="PM">{t("time.PM")}</option>
                  </select>
                </div>
              </div>
            </div>

            {allowWholePrice && (pricingMode === "make-offer" ? (
              <div className="space-y-2">
                <Label htmlFor="target-price">{t("biddingStep.targetPrice")} <span className="text-muted-foreground">({t("biddingStep.optional")})</span></Label>
                <Input
                  id="target-price"
                  type="text"
                  placeholder={t("biddingStep.enterTargetPrice")}
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className={errors.price ? "border-destructive" : ""}
                />
                {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="fixed-price">{t("biddingStep.fixedPriceLabel")}</Label>
                <Input
                  id="fixed-price"
                  type="text"
                  placeholder={t("biddingStep.enterFixedPrice")}
                  value={fixedPrice}
                  onChange={(e) => setFixedPrice(e.target.value)}
                  className={errors.price ? "border-destructive" : ""}
                />
                {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
              </div>
            ))}

            <div className="space-y-2">
              <Label>{t("biddingStep.currency")}</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TWD">{t("settings.twd")}</SelectItem>
                  <SelectItem value="USD">{t("settings.usd")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
              <div className="space-y-1">
                <Label className="text-sm font-medium">{t("biddingStep.showTargetPrice")}</Label>
                <p className="text-xs text-muted-foreground">
                  {showPriceToBidders ? t("biddingStep.showTargetPriceDesc") : t("biddingStep.hideTargetPriceDesc")}
                </p>
              </div>
              <Button
                type="button"
                variant={showPriceToBidders ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPriceToBidders(!showPriceToBidders)}
              >
                {showPriceToBidders ? t("biddingStep.shown") : t("biddingStep.hidden")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Inspection (Optional) */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>{t("biddingStep.inspectionOptional", "Inspection (Optional)")}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {inspectionEnabled ? t("inspectionPrice.subtitle") : t("biddingStep.inspectionOptionalDesc", "Enable to add inspection dates and time slots.")}
              </p>
            </div>
            <Switch checked={inspectionEnabled} onCheckedChange={setInspectionEnabled} />
          </CardHeader>
          {inspectionEnabled && (
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label>{t("inspectionPrice.datesAvailable")} {t("inspectionPrice.selectMultipleDatesHint")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", inspectionDates.length === 0 && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {inspectionDates.length > 0 ? t("inspectionPrice.datesSelected", { count: inspectionDates.length }) : t("inspectionPrice.selectMultipleDates")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="multiple"
                      selected={inspectionDates}
                      onSelect={(dates) => setInspectionDates(dates || [])}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {inspectionDates.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {inspectionDates.map((date, idx) => (
                      <Badge key={idx} variant="secondary" className="text-sm">{format(date, "MMM d, yyyy")}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("inspectionPrice.timeSlotsAvailable")}</Label>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                  <Label className="text-sm font-semibold col-span-6">Start Time</Label>
                  <Input placeholder="Hour" value={startHour} onChange={(e) => setStartHour(e.target.value)} className="col-span-2" />
                  <Input placeholder="Minute" value={startMinute} onChange={(e) => setStartMinute(e.target.value)} className="col-span-2" />
                  <select className="border rounded px-2 py-2 col-span-2" value={startPeriod} onChange={(e) => setStartPeriod(e.target.value === "PM" ? "PM" : "AM")}>
                    <option value="AM">{t("time.AM")}</option>
                    <option value="PM">{t("time.PM")}</option>
                  </select>
                  <Label className="text-sm font-semibold col-span-6 mt-3">End Time</Label>
                  <Input placeholder="Hour" value={endHour} onChange={(e) => setEndHour(e.target.value)} className="col-span-2" />
                  <Input placeholder="Minute" value={endMinute} onChange={(e) => setEndMinute(e.target.value)} className="col-span-2" />
                  <select className="border rounded px-2 py-2 col-span-2" value={endPeriod} onChange={(e) => setEndPeriod(e.target.value === "PM" ? "PM" : "AM")}>
                    <option value="AM">{t("time.AM")}</option>
                    <option value="PM">{t("time.PM")}</option>
                  </select>
                  <Button variant="outline" onClick={addTimeSlot} className="col-span-6 mt-3">{t("inspectionPrice.addTimeSlot")}</Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                  {customTimeSlots.map((slot) => (
                    <div key={slot} className="relative group">
                      <Button
                        variant={selectedTimeSlots.includes(slot) ? "default" : "outline"}
                        onClick={() => !isTimeSlotDisabled(slot) && toggleTimeSlot(slot)}
                        disabled={isTimeSlotDisabled(slot)}
                        className="w-full"
                      >
                        {formatTimeSlot(slot, t)}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTimeSlot(slot)}
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>


        {Number(urlFinalStep) < 6 && (
          isUpdate ? (
            <Button
              onClick={handleUpdateBiddingAndInspection}
              size="lg"
              className="w-full bg-accent hover:bg-accent/90 flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("biddingStep.updateBiddingAndInspection", "Update Bidding & Inspection")}
            </Button>
          ) : (
            <Button
              onClick={handleSetBiddingAndInspection}
              size="lg"
              className="w-full bg-accent hover:bg-accent/90 flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("biddingStep.setBiddingAndInspection", "Set Bidding & Inspection")}
            </Button>
          )
        )}



      <ChatBox batchId={String(batchId)} userId="" role="seller" otherUserId="" />
    </div>
    </div >
  );
};

export default BiddingAndInspectionStep;
