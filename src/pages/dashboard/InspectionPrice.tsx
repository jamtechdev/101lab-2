// @ts-nocheck
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import logo from "@/assets/greenbidz_logo.png";
import { Badge } from "@/components/ui/badge";
import ChatBox from "@/pages/chat/ChatBox";
import { useCreateInspectionMutation } from "@/rtk/slices/productSlice";
import { useSkipFullInspectionForCompanyMutation, useSkipInspectionForCompanyMutation } from "@/rtk/slices/batchApiSlice";

interface InspectionPriceProps {
  batchId: number;
  onNext?: (id: number) => void;
  onJumpNext?: (id?: number, jump?: number) => void;
  onBack?: () => void;
  data: any;
}



interface TimeInfo {
  hour: string;
  minute: string;
  period: "AM" | "PM";
}

const getDefaultStartEndTime = (): { start: TimeInfo; end: TimeInfo } => {
  const now = new Date();

  // --- Start Time ---
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + 20); // 20 days ahead
  let startHour24 = startDate.getHours() + 1; // next full hour
  if (startHour24 >= 24) startHour24 -= 24;

  const startPeriod = startHour24 >= 12 ? "PM" : "AM";
  const startHour12 = startHour24 % 12 === 0 ? 12 : startHour24 % 12;

  const start: TimeInfo = {
    hour: startHour12.toString(),
    minute: "00",
    period: startPeriod as "AM" | "PM",
  };

  // --- End Time (1 hour after start) ---
  let endHour24 = startHour24 + 1;
  if (endHour24 >= 24) endHour24 -= 24;
  const endPeriod = endHour24 >= 12 ? "PM" : "AM";
  const endHour12 = endHour24 % 12 === 0 ? 12 : endHour24 % 12;

  const end: TimeInfo = {
    hour: endHour12.toString(),
    minute: "00",
    period: endPeriod as "AM" | "PM",
  };

  return { start, end };
};


const formatTimeSlot = (slot: string, t: any) => {
  return slot
    .replace(/\bAM\b/g, t("time.AM"))
    .replace(/\bPM\b/g, t("time.PM"));
};


const InspectionPrice: React.FC<InspectionPriceProps> = ({ batchId, onNext, onJumpNext, onBack, data }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const type = searchParams.get("type") || "surplus";
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const urlFinalStep = searchParams.get("finalStep");


  const [inspectionDates, setInspectionDates] = useState<Date[]>([]);


  const [customTimeSlots, setCustomTimeSlots] = useState<string[]>([
    "9:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "1:00 PM - 2:00 PM",
    "2:00 PM - 3:00 PM",
    "3:00 PM - 4:00 PM",
  ]);
  



  const [newTimeSlot, setNewTimeSlot] = useState("");
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [createInspection, { isLoading }] = useCreateInspectionMutation();

  const [skipInspection] = useSkipFullInspectionForCompanyMutation()

  const { start, end } = getDefaultStartEndTime();

  const [startHour, setStartHour] = useState(start.hour);
  const [startMinute, setStartMinute] = useState(start.minute);
  const [startPeriod, setStartPeriod] = useState(start.period);

  const [endHour, setEndHour] = useState(end.hour);
  const [endMinute, setEndMinute] = useState(end.minute);
  const [endPeriod, setEndPeriod] = useState(end.period);

  const [isInspection, setIsInspection] = useState(false)


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

    // Clear inputs
    setStartHour("");
    setStartMinute("");
    setStartPeriod("AM");
    setEndHour("");
    setEndMinute("");
    setEndPeriod("AM");
  };


  const removeTimeSlot = (slot: string) => {
    setCustomTimeSlots(customTimeSlots.filter((s) => s !== slot));
    setSelectedTimeSlots(selectedTimeSlots.filter((s) => s !== slot));
  };

  const toggleTimeSlot = (slot: string) => {
    if (selectedTimeSlots.includes(slot)) {
      setSelectedTimeSlots(selectedTimeSlots.filter((s) => s !== slot));
    } else {
      setSelectedTimeSlots([...selectedTimeSlots, slot]);
    }
  };

  const handleSubmit = async () => {
    if (inspectionDates.length === 0 || selectedTimeSlots.length === 0) {
      toast.error(t('inspectionPrice.selectDateAndTimeSlot'));
      return;
    }

    const schedule = inspectionDates.map((date) => ({
      date: format(date, "yyyy-MM-dd"),
      slots: selectedTimeSlots.map((time) => ({ time })),
      timezone: userTimeZone
    }));

    try {
      await createInspection({ batch_id: batchId, schedule }).unwrap();
      toast.success(t('inspectionPrice.scheduleSuccess'));
      if (onNext) onNext(batchId);
    } catch (err) {
      console.error(err);
      toast.error(t('inspectionPrice.failedToCreate'));
    }
  };

  const handleSkipInspection = () => {
    toast(t('inspectionPrice.inspectionSkipped'));
    if (onNext) onNext(batchId);
  };



  const isTimeSlotDisabled = (slot: string) => {
    if (inspectionDates.length === 0) return false;

    const today = new Date();
    const hasTodaySelected = inspectionDates.some(
      (d) => d.toDateString() === today.toDateString()
    );

    if (!hasTodaySelected) return false;

    // Parse slot text e.g. "3:00 PM - 4:00 PM"
    const [startTime] = slot.split(" - ");
    const [time, period] = startTime.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    // Convert 12-hour to 24-hour
    if (period.toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (period.toUpperCase() === "AM" && hours === 12) hours = 0;

    const slotDate = new Date();
    slotDate.setHours(hours, minutes, 0, 0);

    const now = new Date();

    return slotDate < now; // disable if slot start time is already past
  };


  const handleSkip = async () => {
    try {
      setIsInspection(true)
      const inspection = true
      const res = await skipInspection({ batchId, inspection }).unwrap();
      setIsInspection(false)
      toast.success(res.message || t('inspectionReport.inspectionSkipped'));

      if (onJumpNext) onJumpNext(batchId, 2);
    } catch (err: any) {
      toast.error(err?.message || t('inspectionReport.failedToSkip'));
    }
  };



  React.useEffect(() => {
    if (!data?.schedule) return;

    const schedule = data?.schedule;

    // Prefill dates
    const datesArray = schedule.map((item: any) => new Date(item.date));
    setInspectionDates(datesArray);

    // Prefill time slots (first day slots)
    const slots = schedule[0]?.slots?.map((s: any) => s.time) || [];
    setCustomTimeSlots(slots);
    setSelectedTimeSlots(slots);

  }, [data]);




  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {/* <header className="border-b border-border bg-card sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <img src={logo} alt="GreenBidz" className="h-8 cursor-pointer" />
        </div>
      </header> */}



      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        {onBack && (
          <Button variant="ghost" className="mb-6" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('inspectionPrice.back')}
          </Button>
        )}

        <Card className="shadow-medium">
          <CardContent className="pt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {t('inspectionPrice.title')}
              </h2>
              <p className="text-muted-foreground">
                {t('inspectionPrice.subtitle')}
              </p>
            </div>

            <div className="space-y-6">
              {/* Inspection Dates */}
              <div className="space-y-2">
                <Label>{t('inspectionPrice.datesAvailable')} {t('inspectionPrice.selectMultipleDatesHint')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        inspectionDates.length === 0 && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {inspectionDates.length > 0
                        ? t('inspectionPrice.datesSelected', { count: inspectionDates.length })
                        : t('inspectionPrice.selectMultipleDates')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="multiple"
                      selected={inspectionDates}
                      onSelect={(dates) => setInspectionDates(dates || [])}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>

                {inspectionDates.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {inspectionDates.map((date, idx) => (
                      <Badge key={idx} variant="secondary" className="text-sm">
                        {format(date, "MMM d, yyyy")}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Time Slots */}
              <div className="space-y-2">
                <Label>{t('inspectionPrice.timeSlotsAvailable')}</Label>

                <div className="space-y-2">
                  {/* <Label className="text-sm">Add Custom Time Slot</Label> */}

                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">

                    {/* Start Label */}
                    <Label className="text-sm font-semibold col-span-6 md:col-span-6">
                      Start Time
                    </Label>

                    {/* Start Hour */}
                    <Input
                      placeholder="Hour"
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      className="col-span-2"
                    />

                    {/* Start Minute */}
                    <Input
                      placeholder="Minute "
                      value={startMinute}
                      onChange={(e) => setStartMinute(e.target.value)}
                      className="col-span-2"
                    />

                    {/* Start AM/PM */}
                    <select
                      className="border rounded px-2 py-2 col-span-2"
                      value={startPeriod}
                      onChange={(e) => setStartPeriod(e.target.value)}
                    >
                      <option value="AM">{t("time.AM")}</option>
                      <option value="PM">{t("time.PM")}</option>
                    </select>

                    {/* End Label */}
                    <Label className="text-sm font-semibold col-span-6 md:col-span-6 mt-3">
                      End Time
                    </Label>

                    {/* End Hour */}
                    <Input
                      placeholder="Hour"
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                      className="col-span-2"
                    />

                    {/* End Minute */}
                    <Input
                      placeholder="Minute "
                      value={endMinute}
                      onChange={(e) => setEndMinute(e.target.value)}
                      className="col-span-2"
                    />

                    {/* End AM/PM */}
                    <select
                      className="border rounded px-2 py-2 col-span-2"
                      value={endPeriod}
                      onChange={(e) => setEndPeriod(e.target.value)}
                    >
                      <option value="AM">{t("time.AM")}</option>
                      <option value="PM">{t("time.PM")}</option>
                    </select>

                    {/* Add Button */}
                    <Button
                      variant="outline"
                      onClick={addTimeSlot}
                      className="col-span-6 md:col-span-6 mt-3"
                    >
                      {t('inspectionPrice.addTimeSlot')}
                    </Button>
                  </div>
                </div>


                {/* <Button onClick={addTimeSlot} variant="outline" className="mt-2">
                  Add
                </Button> */}


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
            </div>
          </CardContent>
        </Card>

        <ChatBox listingId="LISTING-001" userType="seller" userName="Seller Demo" />

        {/* Action Buttons */}
        {Number(urlFinalStep) < 4 &&
          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
            {/* <Button onClick={handleSkipInspection} size="lg" variant="outline" className="order-2 sm:order-1">
            Skip Inspection
          </Button> */}
            <Button
              onClick={handleSubmit}
              size="lg"
              className="bg-accent hover:bg-accent/90 flex items-center justify-center"
              disabled={isLoading} // disable while loading
            >
              {isLoading && (
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
              )}
              {isLoading ? "Scheduling..." : t('inspectionPrice.scheduleInspection')}
            </Button>


            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={isInspection}
            >
              {isInspection ? t('inspectionReport.skipping') : t('inspectionReport.skipInspection')}
            </Button>

          </div>
        }



      </div>



    </div>
  );
};

export default InspectionPrice;
