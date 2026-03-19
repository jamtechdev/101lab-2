// @ts-nocheck
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StepIndicator from "@/components/common/StepIndicator";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowUpRight, Calendar as CalendarIcon, MapPin, MessageCircle, Trophy } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast"
import logo from "@/assets/greenbidz_logo.png";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import ChatBox from "@/pages/chat/ChatBox";
import { useGetBuyerBidsQuery, useMarkWinnerForBatchMutation, useStartBidMutation } from "@/rtk/slices/bidApiSlice";
import { Loader2 } from "lucide-react"; // spinner icon
import WaitingForBuyerAction from "@/components/common/WaitingForBid";
import { subscribeSellerEvents } from "@/socket/sellerEvents"
import BuyerDetailsModal from "../buyer/BuyerDetailsModal";
import { useSocketConnected } from "@/services/socket";
import ChatSidebarWrapper from "@/components/common/ChatSidebarWrapper";

// Validation schema
const biddingSchema = z.object({
  price: z.string().trim()
    .refine((val) => val === "" || !isNaN(Number(val)), {
      message: "Must be a valid number"
    })
    .refine((val) => val === "" || Number(val) >= 0, {
      message: "Must be a positive number"
    }),
  location: z.string().trim().min(1, { message: "Location is required" }).max(200),
});

// Mock bids data with currency
const mockBids = [
  {
    id: "BID-001",
    buyerName: "ABC Manufacturing Pte Ltd",
    contactName: "John Tan",
    country: "Singapore",
    amount: 48500,
    currency: "USD",
    submittedAt: "2025-01-28 10:30 AM",
    status: "active",
  },
  {
    id: "BID-002",
    buyerName: "Global Equipment Trading",
    contactName: "Sarah Wong",
    country: "Malaysia",
    amount: 47200,
    currency: "USD",
    submittedAt: "2025-01-28 09:15 AM",
    status: "active",
  },
  {
    id: "BID-003",
    buyerName: "Industrial Solutions Inc",
    contactName: "Mike Chen",
    country: "Taiwan",
    amount: 1450000,
    currency: "TWD",
    submittedAt: "2025-01-28 08:45 AM",
    status: "active",
  },
  {
    id: "BID-004",
    buyerName: "MetalWorks Asia",
    contactName: "David Lim",
    country: "Hong Kong",
    amount: 44000,
    currency: "USD",
    submittedAt: "2025-01-27 04:20 PM",
    status: "active",
  },
];


// Helper function for locale-aware date formatting
const formatDateTimeLocale = (date: Date, formatStr: string, language: string, t: any) => {
  const locale = language === "zh" ? zhTW : undefined;
  let formatted = format(date, formatStr, { locale });
  // Translate AM/PM
  return formatted
    .replace(/\bAM\b/g, t("time.AM"))
    .replace(/\bPM\b/g, t("time.PM"));
};

const BiddingStep = ({ batchId, onNext, onBack, step, data }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "surplus";
  const [selectedBid, setSelectedBid] = useState<string | null>(null);
  const stepParam = Number(searchParams.get("step") || 0);
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [biddingStartDate, setBiddingStartDate] = useState<Date>(new Date());
  const [biddingEndDate, setBiddingEndDate] = useState<Date>(new Date());

  const [pricingMode, setPricingMode] = useState<"make-offer" | "fixed-price">("make-offer");
  const [targetPrice, setTargetPrice] = useState<string>("");
  const [fixedPrice, setFixedPrice] = useState<string>("");
  const [showPriceToBidders, setShowPriceToBidders] = useState<boolean>(false);
  const [currency, setCurrency] = useState<string>("TWD");
  const [location, setLocation] = useState<string>("台北市");
  const [notes, setNotes] = useState<string>("");
  const [biddingStarted, setBiddingStarted] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const [openBuyerModal, setOpenBuyerModal] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const socketConnected = useSocketConnected();

  // Add these inside your BiddingStep component state initialization:
  const [allowWholePrice, setAllowWholePrice] = useState<boolean>(true); // default true
  const [allowWeightPrice, setAllowWeightPrice] = useState<boolean>(false); // default false



  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [selectedChatBid, setSelectedChatBid] = useState(null);

  // Optional: weight items if "Price by Weight" is enabled
  const WEIGHT_ITEMS = [
    { key: "item1", label: "100kg – 200kg" },
    { key: "item2", label: "201kg – 500kg" },
    { key: "item3", label: "501kg – 1000kg" },
  ];



  const WEIGHT_ITEMS1 = [
    { key: "scrap_iron", label: t("buyerDashboard.material.scrapIron") },
    { key: "special_materials", label: t("buyerDashboard.material.specialMaterial") },
    { key: "waste_disposal_fee", label: t("buyerDashboard.material.wasteDisposalFee") },
    { key: "others", label: t("buyerDashboard.material.others") },
  ];








  useEffect(() => {
    if (!data?.biddingDetails && (data?.batch?.step ?? stepParam) >= 5) {
      setBiddingStarted(true);
    } else if (!data?.biddingDetails) {
      setBiddingStarted(false);
    }
  }, [data, stepParam]);


  const {
    data: bids = [],
    isLoading: bidsLoading,
    refetch,
    error: bidsError
  } = useGetBuyerBidsQuery(
    batchId,
    {
      pollingInterval: socketConnected ? 0 : 5000,
    }

  );

  // Inside BiddingStep
  const [createBid, { isLoading }] = useStartBidMutation();


  const [markWinnerForBatch, { isLoading: isMarking }] = useMarkWinnerForBatchMutation();


  const formatCurrency = (amount: number, curr: string) => {
    return curr === "TWD"
      ? `NT$${amount.toLocaleString()}`
      : `$${amount.toLocaleString()}`;
  };

  const handleStartBidding = async () => {
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
        toast.error(t('biddingStep.startError'));
        return;
      }

      if (pricingMode === "fixed-price") {
        if (fixedPrice === null || fixedPrice === "") {
          // true when both are filled OR both are empty
          toast.error(t("biddingStep.priceError"));
          return;
        }
      }

      setLoading(true); // start spinner

      const priceValue = pricingMode === "make-offer" ? targetPrice : fixedPrice;

      // Validation
      biddingSchema.parse({ price: priceValue, location });

      const payload = {
        batch_id: batchId,
        type: pricingMode === "make-offer" ? "make_offer" : "fixed_price",
        start_date: format(biddingStartDate, "yyyy-MM-dd HH:mm:ss"),
        end_date: format(biddingEndDate, "yyyy-MM-dd HH:mm:ss"),
        target_price: Number(priceValue),
        location,
        timeZone: userTimeZone,
        notes: {
          required_docs: "ID proof, business license",
          inspection_needed: true,
        },
        language: "en",
        currency: currency,
        isHidden: !showPriceToBidders, // When showPriceToBidders is true (shown), isHidden is false,
        allowWholePrice: allowWholePrice !== undefined ? allowWholePrice : true,
        allowWeightPrice: allowWeightPrice !== undefined ? allowWeightPrice : false,
      };

      // Call API
      await createBid(payload).unwrap();

      //  Force UI update
      setBiddingStarted(true);
      toast.success("Bid created successfully!");
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) newErrors[err.path[0] as string] = err.message;
        });
        setErrors(newErrors);
        toast.error("Please check your inputs");
      } else {
        console.error("Bid creation error:", error);
        toast.error("Failed to create bid");

        // Optionally, still allow UI to show started state
        // setBiddingStarted(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBid = async () => {
    if (!selectedBid || isAccepting) return;

    const isConfirmed = window.confirm(
      `${t("biddingStep.confirmWinner.title")}\n\n${t(
        "biddingStep.confirmWinner.subtitle"
      )}`
    );

    if (!isConfirmed) return;

    try {

      setIsAccepting(true);

      const res = await markWinnerForBatch({
        batch_id: Number(batchId ?? 0),
        buyer_bid_id: Number(selectedBid ?? 0),
      }).unwrap();


      toast.success("Bid selected successfully!");

      setIsAccepting(false)


      // navigate(`/upload?step=6&batchId=${batchId}`);
      if (onNext && batchId) {
        onNext(batchId);
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to select winner");
    }
  };




  useEffect(() => {
    const unsub = subscribeSellerEvents(() => {
      refetch();
    });

    return unsub;
  }, []);


  useEffect(() => {

    if (!data?.biddingDetails) return;

    // Pricing mode
    setPricingMode(
      data?.biddingDetails.type === "make_offer" ? "make-offer" : "fixed-price"
    );

    // Dates
    setBiddingStartDate(new Date(data?.biddingDetails.start_date));
    setBiddingEndDate(new Date(data?.biddingDetails.end_date));

    // Prices
    if (data?.biddingDetails.type === "make_offer") {
      setTargetPrice(data?.biddingDetails.target_price?.toString() || "");
    } else {
      setFixedPrice(data?.biddingDetails.target_price?.toString() || "");
    }

    // Location
    setLocation(data?.biddingDetails.location || "");

    // Currency
    setCurrency(data?.biddingDetails.currency || "USD");

    // Notes (optional)
    setNotes(data?.biddingDetails.notes?.required_docs || "");

    // Show Price to Bidders - map isHidden to showPriceToBidders
    // isHidden: true means price is hidden, so showPriceToBidders should be false
    // isHidden: false means price is shown, so showPriceToBidders should be true
    // Default to false (hidden) if not provided
    if (data?.biddingDetails.isHidden !== undefined) {
      setShowPriceToBidders(!data.biddingDetails.isHidden);
    } else {
      setShowPriceToBidders(false); // Default to hidden
    }

    // Mark bidding already started (for UI lock)
    if (data?.biddingDetails.status === "active" ||
      data?.biddingDetails.status === "closed" ||
      data?.biddingDetails.status === "pending") {
      setBiddingStarted(true);
    } else {
      setBiddingStarted(false);
    }
  }, [data]);

  const biddingStatus = data?.biddingDetails?.status;
  const canSelect =
    biddingStatus === "active" || biddingStatus === "pending";


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

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('biddingStep.back')}
        </Button>

        {/* Step Indicator */}
        {/* <StepIndicator 
          currentStep={4} 
          totalSteps={5}
          steps={["Upload", "Inventory", "Inspection", "Bidding", "Report"]}
        /> */}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('biddingStep.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('biddingStep.subtitle')}
          </p>
        </div>




        {/* Bidding Configuration */}
        {false &&
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t('biddingStep.biddingSettings')}</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {t('biddingStep.settingsDesc')}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pricing Mode Selection */}
              <div className="space-y-3">
                <Label>{t('biddingStep.pricingMode')}</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={pricingMode === "make-offer" ? "default" : "outline"}
                    className="h-auto py-4 flex-col items-start text-left"
                    onClick={() => setPricingMode("make-offer")}
                    disabled={biddingStarted}
                  >
                    <span className="font-semibold text-base">{t('biddingStep.makeOffer')}</span>
                    <span className="text-xs opacity-80 mt-1">{t('biddingStep.makeOfferDesc')}</span>
                  </Button>
                  <Button
                    type="button"
                    variant={pricingMode === "fixed-price" ? "default" : "outline"}
                    className="h-auto py-4 flex-col items-start text-left"
                    onClick={() => setPricingMode("fixed-price")}
                    disabled={biddingStarted}
                  >
                    <span className="font-semibold text-base">{t('biddingStep.fixedPrice')}</span>
                    <span className="text-xs opacity-80 mt-1">{t('biddingStep.fixedPriceDesc')}</span>
                  </Button>
                </div>
              </div>

              {/* Seller Allowed Bid Types */}
              <div className="space-y-2 border rounded-lg p-4">
                <Label>{t('biddingStep.allowedBidTypes')}</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={allowWholePrice}
                      onChange={(e) => setAllowWholePrice(e.target.checked)}
                      disabled={biddingStarted}
                    />
                    {t('biddingStep.wholePrice')}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={allowWeightPrice}
                      onChange={(e) => setAllowWeightPrice(e.target.checked)}
                      disabled={biddingStarted}
                    />
                    {t('biddingStep.priceByWeight')}
                  </label>
                </div>

                {/* {allowWeightPrice && (
                <ul className="list-disc ml-5 text-sm text-muted-foreground mt-2">
                  {WEIGHT_ITEMS.map((i) => (
                    <li key={i.key}>{i.label}</li>
                  ))}
                </ul>
              )} */}
              </div>

              {/* Dates */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Start Date */}
                <div className="space-y-2">
                  <Label>{t('biddingStep.biddingStartDate')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !biddingStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {biddingStartDate ? formatDateTimeLocale(biddingStartDate, "PPP", i18n.language, t) : t('biddingStep.pickDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={biddingStartDate}
                        onSelect={(date) => date && setBiddingStartDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label>{t('biddingStep.biddingEndDate')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !biddingEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {biddingEndDate ? formatDateTimeLocale(biddingEndDate, "PPP", i18n.language, t) : t('biddingStep.pickDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={biddingEndDate}
                        onSelect={(date) => date && setBiddingEndDate(date)}
                        disabled={(date) => biddingStartDate ? date < biddingStartDate : false}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Price Input */}
              {allowWholePrice && (pricingMode === "make-offer" ? (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="target-price">
                    {t('biddingStep.targetPrice')} <span className="text-muted-foreground">({t('biddingStep.optional')})</span>
                  </Label>
                  <Input
                    id="target-price"
                    type="text"
                    placeholder={t('biddingStep.enterTargetPrice')}
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className={errors.price ? "border-destructive" : ""}
                    disabled={biddingStarted}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">{errors.price}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t('biddingStep.targetPriceDesc')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="fixed-price">{t('biddingStep.fixedPriceLabel')}</Label>
                  <Input
                    id="fixed-price"
                    type="text"
                    placeholder={t('biddingStep.enterFixedPrice')}
                    value={fixedPrice}
                    onChange={(e) => setFixedPrice(e.target.value)}
                    className={errors.price ? "border-destructive" : ""}
                    disabled={biddingStarted}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">{errors.price}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{t('biddingStep.fixedPriceDesc2')}</p>
                </div>
              ))}

              {/* Currency selector remains visible always */}
              <div className="space-y-2">
                <Label>{t('biddingStep.currency')}</Label>
                <Select value={currency} onValueChange={setCurrency} disabled={biddingStarted}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TWD">{t('settings.twd')}</SelectItem>
                    <SelectItem value="USD">{t('settings.usd')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!biddingStarted && (
                <div className="pt-4">
                  <Button
                    onClick={handleStartBidding}
                    size="lg"
                    className="w-full bg-accent hover:bg-accent/90 flex items-center justify-center gap-2"
                    disabled={loading} // prevent multiple clicks
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('biddingStep.startBidding')}
                  </Button>
                </div>
              )}

            </CardContent>
          </Card>
        }




        {/* Chat Box */}
        <ChatBox
          listingId="LISTING-001"
          userType="seller"
          userName="Seller Demo"
        />

        {/* Bidding Stats and Bids Table - Only show after bidding started */}
        {biddingStarted && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">{t('biddingStep.totalBids')}</p>
                  <p className="text-3xl font-bold text-foreground">
                    {bids?.data?.total}
                  </p>
                </CardContent>
              </Card>
              {/* <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">
                    {pricingMode === "make-offer" ? t('biddingStep.targetPriceLabel') : t('biddingStep.fixedPriceLabel2')}
                  </p>
                  <p className="text-3xl font-bold text-accent">
                    {pricingMode === "make-offer"
                      ? (targetPrice ? formatCurrency(Number(targetPrice), currency) : t('biddingStep.notSet'))
                      : (fixedPrice ? formatCurrency(Number(fixedPrice), currency) : t('biddingStep.notSet'))}
                  </p>
                  {pricingMode === "make-offer" && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {showPriceToBidders ? `✓ ${t('biddingStep.shownToBuyers')}` : `✗ ${t('biddingStep.hiddenFromBuyers')}`}
                    </p>
                  )}
                </CardContent>
              </Card> */}
            </div>

            {/* All Bids Table */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{t('biddingStep.allBids')}</CardTitle>
                {bids?.data?.buyer_bids.length === 0 && <WaitingForBuyerAction />}
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                          {t('biddingStep.select')}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                          {t("nav.chat")}
                        </th>
                        {/* <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                          Bid ID
                        </th> */}
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                          {t('biddingStep.company')}
                        </th>
                        {/* <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                          {t('biddingStep.contact')}
                        </th> */}
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                          {t('biddingStep.country')}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                          {t('biddingStep.amount')}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                          {t('biddingStep.submitted')}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                          {t('buyer.notes')}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                          {t("submissions.action")}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                          {t("submissions.file")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bids?.data?.buyer_bids.map((bid, index) => (
                        <tr
                          key={bid.buyer_bid_id}
                          className={cn(
                            "border-b border-border transition-colors",
                            canSelect ? "hover:bg-muted/50 cursor-pointer" : "opacity-60 cursor-not-allowed",
                            selectedBid === bid.buyer_bid_id && canSelect && "bg-accent/10"
                          )}
                          onClick={() => canSelect && setSelectedBid(bid.buyer_bid_id)}
                        >
                          <td className="py-3 px-4">
                            <input
                              type="radio"
                              name="selectedBid"
                              checked={selectedBid === bid.buyer_bid_id}
                              onChange={() => setSelectedBid(bid.buyer_bid_id)}
                              disabled={!canSelect}
                              className="cursor-pointer"
                            />
                          </td>

                          <td className="py-3 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-shrink-0 border-accent/20 hover:border-accent hover:bg-accent/5 group-hover:bg-accent/10"
                              // onClick={(e) => {
                              //   e.stopPropagation();
                              //   navigate(`/dashboard/submission/message?buyerId=${bid?.buyer_id}`);
                              // }}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Instead of navigate, open the chat sidebar
                                setSelectedChatBid(bid);
                                setShowMessageDialog(true);
                              }}
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              {t("nav.chat")}
                              <ArrowUpRight className="w-3.5 h-3.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                          </td>

                          {/* <td className="py-3 px-4 font-medium text-foreground">
                            {bid.buyer_bid_id}
                            {index === 0 && <Trophy className="inline-block ml-2 h-4 w-4 text-yellow-500" />}
                          </td> */}

                          <td className="py-3 px-4 text-foreground font-medium">{bid.company_name}</td>
                          <td className="py-3 px-4 text-muted-foreground">{bid.contact_person}</td>
                          {/* <td className="py-3 px-4 text-muted-foreground">{bid.country}</td> */}

                          {/* Amount / Weight Summary */}
                          <td className="py-3 px-4 text-foreground font-semibold">
                            {bid.quotation_types.includes("whole_item")
                              ? formatCurrency(Number(bid.amount), currency)
                              : bid.quotation_types.includes("weight_based")
                                ? WEIGHT_ITEMS1.map(({ key, label }) => {
                                  const value = bid.weight_quotations?.[key];
                                  return value ? `${label}: ${Number(value).toLocaleString()}` : null;
                                }).filter(Boolean).join(", ")
                                : "-"}
                          </td>


                          <td className="py-3 px-4 text-muted-foreground">
                            {bid.submitted_at ? formatDateTimeLocale(new Date(bid.submitted_at), "PPP p", i18n.language, t) : "-"}
                          </td>

                          <td className="py-3 px-4 text-muted-foreground">{bid?.notes}</td>

                          <td className="py-3 px-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBuyer(bid.buyer);
                                setOpenBuyerModal(true);
                              }}
                            >
                              {t("buyerDashboard.viewDetails")}
                            </Button>
                          </td>
                          <td>
                            {bid?.document_image_url && (
                              <>
                                {bid.document_image?.endsWith(".pdf") ? (
                                  <a
                                    href={bid.document_image_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline"
                                  >
                                    View PDF Document
                                  </a>
                                ) : (
                                  <a
                                    href={bid.document_image_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <img
                                      src={bid.document_image_url}
                                      alt="Document file"
                                      className="w-64 h-auto cursor-pointer border rounded-md"
                                    />
                                  </a>
                                )}
                              </>
                            )}
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedBid && (
                  <div className="mt-4 p-4 bg-accent/10 border border-accent rounded-lg">
                    <p className="text-sm text-foreground">
                      ✓ {t('biddingStep.selected')}: {selectedBid}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>


            {/* Action Buttons */}
            <div className="flex justify-end gap-4 flex-col sm:flex-row">
              {/* <Button
                variant="outline"
              // onClick={() => navigate("/dashboard")}
              >
                {t('biddingStep.saveContinueLater')}
              </Button> */}
              {data?.batch?.step <= 5 && (
                <Button
                  onClick={handleAcceptBid}
                  disabled={!selectedBid || isAccepting}
                  size="lg"
                  className="bg-accent hover:bg-accent/90 disabled:opacity-60"
                >
                  {isAccepting
                    ? t("....")
                    : t("biddingStep.acceptSelectedBid")}
                </Button>
              )}
            </div>
          </>
        )}
      </div>


      <ChatSidebarWrapper
        isOpen={showMessageDialog}
        onClose={() => setShowMessageDialog(false)}
        batchId={batchId}
        sellerId={selectedChatBid?.buyer_id}
        userRole="seller"
      />

      <BuyerDetailsModal
        open={openBuyerModal}
        onClose={() => setOpenBuyerModal(false)}
        buyer={selectedBuyer}
      />
    </div>
  );
};

export default BiddingStep;
