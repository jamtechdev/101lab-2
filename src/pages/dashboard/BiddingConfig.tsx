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
import { useGetBatchByIdQuery } from "@/rtk/slices/batchApiSlice";

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


const BiddingConfig = ({ batchId, onNext, onBack, step, data }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
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
    const [socketConnected, setSocketConnected] = useState(false);

    const [isTaxInclusive, setIsTaxInclusive] = useState<boolean>(true);

    const { data: batchData } = useGetBatchByIdQuery(batchId, {
        skip: !batchId,
    })


    const urlFinalStep = Number(searchParams.get("finalStep"));




    // Add these inside your BiddingStep component state initialization:
    const [allowWholePrice, setAllowWholePrice] = useState<boolean>(true); // default true
    const [allowWeightPrice, setAllowWeightPrice] = useState<boolean>(false); // default false

    // Optional: weight items if "Price by Weight" is enabled
    const WEIGHT_ITEMS = [
        { key: "item1", label: "100kg – 200kg" },
        { key: "item2", label: "201kg – 500kg" },
        { key: "item3", label: "501kg – 1000kg" },
    ];




    useEffect(() => {
        if (urlFinalStep >= 5) {
            setBiddingStarted(true);
        }
    }, [data, urlFinalStep]);


    const {
        data: bids = [],
        isLoading: bidsLoading,
        refetch,
        error: bidsError
    } = useGetBuyerBidsQuery(
        batchId
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
                taxInclusive: isTaxInclusive
            };

            // Call API
            await createBid(payload).unwrap();

            //  Force UI update
            setBiddingStarted(true);
            toast.success("Bid created successfully!");

            if (onNext && batchId) {
                onNext(batchId);
            }


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
        if (!selectedBid) return;

        try {
            const res = await markWinnerForBatch({
                batch_id: Number(batchId ?? 0),
                buyer_bid_id: Number(selectedBid ?? 0),
            }).unwrap();


            toast.success("Bid selected successfully!");


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
        }, () => setSocketConnected(true));


        const timeout = setTimeout(() => {
            setSocketConnected(false);
        }, 5000);

        return () => {
            unsub();
            clearTimeout(timeout);
        };
    }, []);

    useEffect(() => {
        if (!batchData?.data?.biddingDetails) return;

        const details = batchData.data.biddingDetails;

        setPricingMode(details.type === "make_offer" ? "make-offer" : "fixed-price");
        setBiddingStartDate(new Date(details.start_date));
        setBiddingEndDate(new Date(details.end_date));
        setTargetPrice(details.type === "make_offer" ? details.target_price?.toString() || "" : "");
        setFixedPrice(details.type === "fixed_price" ? details.target_price?.toString() || "" : "");
        setLocation(details.location || "");
        setCurrency(details.currency || "USD");
        setNotes(details.notes?.required_docs || "");
        setShowPriceToBidders(details.isHidden !== undefined ? !details.isHidden : false);


        setAllowWholePrice(details.allowWholePrice ?? true);
        setAllowWeightPrice(details.allowWeightPrice ?? false);

        setIsTaxInclusive(details.taxInclusive ?? true);

    }, [batchData]);


    const biddingStatus = data?.biddingDetails?.status;
    const canSelect = biddingStatus === "active" || biddingStatus === "pending";



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
                                                {biddingStartDate
                                                    ? format(biddingStartDate, t('biddingStep.dateFormat'))
                                                    : t('biddingStep.pickDate')}
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
                                                {biddingEndDate
                                                    ? format(biddingEndDate, t('biddingStep.dateFormat'))
                                                    : t('biddingStep.pickDate')}
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


                            {/* Price Input based on mode */}
                            {pricingMode === "make-offer" ? (
                                <>
                                    <div className="grid md:grid-cols-3 gap-4">
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
                                    </div>

                                    {/* Show Price to Bidders Toggle */}
                                    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                                        <div className="space-y-1">
                                            <Label htmlFor="show-price" className="text-sm font-medium">
                                                {t('biddingStep.showTargetPrice')}
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                {showPriceToBidders
                                                    ? t('biddingStep.showTargetPriceDesc')
                                                    : t('biddingStep.hideTargetPriceDesc')}
                                            </p>
                                        </div>
                                        <Button
                                            id="show-price"
                                            type="button"
                                            variant={showPriceToBidders ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setShowPriceToBidders(!showPriceToBidders)}
                                            disabled={biddingStarted}
                                            className="ml-4"
                                        >
                                            {showPriceToBidders ? t('biddingStep.shown') : t('biddingStep.hidden')}
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="fixed-price">
                                            {t('biddingStep.fixedPriceLabel')}
                                        </Label>
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
                                        <p className="text-xs text-muted-foreground">
                                            {t('biddingStep.fixedPriceDesc2')}
                                        </p>
                                    </div>
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
                                </div>
                            )}

                            {/* Location */}
                            {/* <div className="space-y-2">
              <Label htmlFor="location">{t('biddingStep.equipmentLocation')}</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  type="text"
                  placeholder={t('biddingStep.enterLocation')}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={cn("pl-10", errors.location && "border-destructive")}
                  disabled={biddingStarted}
                />
              </div>
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location}</p>
              )}
            </div> */}

                            {/* Notes for Bidders */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">
                                    {t('biddingStep.notesForBidders')} <span className="text-muted-foreground">({t('biddingStep.optional')})</span>
                                </Label>
                                <textarea
                                    id="notes"
                                    placeholder={t('biddingStep.notesPlaceholder')}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    disabled={biddingStarted}
                                    className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            {/* Default Terms */}
                            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                                <h4 className="font-semibold text-foreground mb-3">{t('biddingStep.defaultTerms')}</h4>
                                <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-medium text-foreground">{t('biddingStep.shipping')}:</span> {t('biddingStep.shippingDesc')}
                                    </p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-medium text-foreground">{t('biddingStep.payment')}:</span> {t('biddingStep.paymentDesc')}
                                    </p>
                                </div>
                            </div>

                            {/* Start Bidding Button */}
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



                {/* Bidding Configuration */}
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

                        <div className="space-y-2 border rounded-lg p-4">
                            <Label>{t('biddingStep.taxMode')}</Label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="taxMode"
                                        value="inclusive"
                                        checked={isTaxInclusive}
                                        onChange={() => setIsTaxInclusive(true)}
                                        disabled={biddingStarted}
                                    />
                                    {t('biddingStep.inclusiveTax')}
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="taxMode"
                                        value="exclusive"
                                        checked={!isTaxInclusive}
                                        onChange={() => setIsTaxInclusive(false)}
                                        disabled={biddingStarted}
                                    />
                                    {t('biddingStep.exclusiveTax')}
                                </label>
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
                                            {biddingStartDate ? format(biddingStartDate, "PPP") : t('biddingStep.pickDate')}
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
                                            {biddingEndDate ? format(biddingEndDate, "PPP") : t('biddingStep.pickDate')}
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

                        <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                            <div className="space-y-1">
                                <Label htmlFor="show-price" className="text-sm font-medium">
                                    {t('biddingStep.showTargetPrice')}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    {showPriceToBidders
                                        ? t('biddingStep.showTargetPriceDesc')
                                        : t('biddingStep.hideTargetPriceDesc')}
                                </p>
                            </div>
                            <Button
                                id="show-price"
                                type="button"
                                variant={showPriceToBidders ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowPriceToBidders(!showPriceToBidders)}
                                disabled={biddingStarted}
                                className="ml-4"
                            >
                                {showPriceToBidders ? t('biddingStep.shown') : t('biddingStep.hidden')}
                            </Button>
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
                                    {t('biddingStep.setBidding')}
                                </Button>
                            </div>
                        )}

                    </CardContent>
                </Card>

                {/* Chat Box */}
                <ChatBox
                    listingId="LISTING-001"
                    userType="seller"
                    userName="Seller Demo"
                />

            </div>

            <BuyerDetailsModal
                open={openBuyerModal}
                onClose={() => setOpenBuyerModal(false)}
                buyer={selectedBuyer}
            />
        </div>
    );
};

export default BiddingConfig;
