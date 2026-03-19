import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StepIndicator from "@/components/common/StepIndicator";
import { ArrowLeft, Calendar as CalendarIcon, MapPin, Trophy } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import logo from "@/assets/greenbidz_logo.png";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import ChatBox from "@/pages/chat/ChatBox";

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

const BiddingStep = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "surplus";
  const [selectedBid, setSelectedBid] = useState<string | null>(null);
  
  const [biddingStartDate, setBiddingStartDate] = useState<Date>(new Date("2025-01-27"));
  const [biddingEndDate, setBiddingEndDate] = useState<Date>(new Date("2025-02-05"));
  const [pricingMode, setPricingMode] = useState<"make-offer" | "fixed-price">("make-offer");
  const [targetPrice, setTargetPrice] = useState<string>("45000");
  const [fixedPrice, setFixedPrice] = useState<string>("50000");
  const [showPriceToBidders, setShowPriceToBidders] = useState<boolean>(false);
  const [currency, setCurrency] = useState<string>("USD");
  const [location, setLocation] = useState<string>("台北市");
  const [notes, setNotes] = useState<string>("");
  const [biddingStarted, setBiddingStarted] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const formatCurrency = (amount: number, curr: string) => {
    return curr === "TWD" 
      ? `NT$${amount.toLocaleString()}`
      : `$${amount.toLocaleString()}`;
  };

  const handleStartBidding = () => {
    try {
      const priceValue = pricingMode === "make-offer" ? targetPrice : fixedPrice;
      biddingSchema.parse({ price: priceValue, location });
      setErrors({});
      setBiddingStarted(true);
      toast.success("競標已開始！等待買家出價... (Bidding started! Waiting for bids...)");
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        toast.error("請檢查輸入 (Please check your inputs)");
      }
    }
  };

  const handleAcceptBid = () => {
    if (!selectedBid) {
      toast.error("請選擇一個得標者 (Please select a winning bid)");
      return;
    }
    const winner = mockBids.find(b => b.id === selectedBid);
    if (winner) {
      toast.success(`已接受 ${winner.buyerName} 的出價！(Bid from ${winner.buyerName} accepted!)`);
    }
    navigate(`/payment-step?type=${type}&winner=${selectedBid}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-soft sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <img 
            src={logo} 
            alt="GreenBidz" 
            className="h-8 w-auto cursor-pointer"
            onClick={() => navigate("/")}
          />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Step Indicator */}
        <StepIndicator 
          currentStep={4} 
          totalSteps={5}
          steps={["Upload", "Inventory", "Inspection", "Bidding", "Report"]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            競標資訊 Bidding Information
          </h1>
          <p className="text-muted-foreground">
            設定競標參數並審核買家的出價 Set your bidding parameters and review bids from interested buyers
          </p>
        </div>

        {/* Bidding Configuration */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Bidding Settings 競標設定</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              The following information is from your listing. You can edit them if needed.
              <br />
              以下資訊來自您的刊登。如需更改，您可以在此編輯。
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pricing Mode Selection */}
            <div className="space-y-3">
              <Label>銷售方式 (Pricing Mode) *</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={pricingMode === "make-offer" ? "default" : "outline"}
                  className="h-auto py-4 flex-col items-start text-left"
                  onClick={() => setPricingMode("make-offer")}
                  disabled={biddingStarted}
                >
                  <span className="font-semibold text-base">Make Offer</span>
                  <span className="text-xs opacity-80 mt-1">僅接受出價</span>
                </Button>
                <Button
                  type="button"
                  variant={pricingMode === "fixed-price" ? "default" : "outline"}
                  className="h-auto py-4 flex-col items-start text-left"
                  onClick={() => setPricingMode("fixed-price")}
                  disabled={biddingStarted}
                >
                  <span className="font-semibold text-base">Fixed Price</span>
                  <span className="text-xs opacity-80 mt-1">固定價格</span>
                </Button>
              </div>
            </div>

            {/* Dates */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bidding Start Date 競標開始日期 *</Label>
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
                      {biddingStartDate ? format(biddingStartDate, "PPP") : "Pick a date 選擇日期"}
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

              <div className="space-y-2">
                <Label>Bidding End Date 競標結束日期 *</Label>
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
                      {biddingEndDate ? format(biddingEndDate, "PPP") : "Pick a date 選擇日期"}
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
                      目標價格 (Target Price) <span className="text-muted-foreground">(Optional 可選)</span>
                    </Label>
                    <Input
                      id="target-price"
                      type="text"
                      placeholder="Enter your target price"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      className={errors.price ? "border-destructive" : ""}
                      disabled={biddingStarted}
                    />
                    {errors.price && (
                      <p className="text-sm text-destructive">{errors.price}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      您期望的售價 (Your expected selling price)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>幣別 (Currency) *</Label>
                    <Select value={currency} onValueChange={setCurrency} disabled={biddingStarted}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TWD">TWD (台幣)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Show Price to Bidders Toggle */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                  <div className="space-y-1">
                    <Label htmlFor="show-price" className="text-sm font-medium">
                      顯示目標價格給競標者 (Show Target Price to Bidders)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {showPriceToBidders 
                        ? "買家可以看到您的目標價格 (Buyers can see your target price)"
                        : "目標價格僅供您參考，買家看不到 (Target price is for your reference only, hidden from buyers)"}
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
                    {showPriceToBidders ? "顯示 (Shown)" : "隱藏 (Hidden)"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="fixed-price">
                    固定價格 (Fixed Price) *
                  </Label>
                  <Input
                    id="fixed-price"
                    type="text"
                    placeholder="Enter fixed selling price"
                    value={fixedPrice}
                    onChange={(e) => setFixedPrice(e.target.value)}
                    className={errors.price ? "border-destructive" : ""}
                    disabled={biddingStarted}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">{errors.price}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    買家將以此價格購買 (Buyers will purchase at this price)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>幣別 (Currency) *</Label>
                  <Select value={currency} onValueChange={setCurrency} disabled={biddingStarted}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TWD">TWD (台幣)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">設備地點 (Equipment Location) *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  type="text"
                  placeholder="Enter location 輸入地點"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={cn("pl-10", errors.location && "border-destructive")}
                  disabled={biddingStarted}
                />
              </div>
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location}</p>
              )}
            </div>

            {/* Notes for Bidders */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                備註給競標者 (Notes for Bidders) <span className="text-muted-foreground">(Optional 可選)</span>
              </Label>
              <textarea
                id="notes"
                placeholder="Add any additional information for bidders 輸入給競標者的額外資訊"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={biddingStarted}
                className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Default Terms */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <h4 className="font-semibold text-foreground mb-3">Default Terms 預設條款</h4>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Shipping 運送:</span> Handled by buyer 由買家處理
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Payment 付款:</span> Paid in advance before pick up 提貨前預付
                </p>
              </div>
            </div>

            {/* Start Bidding Button */}
            {!biddingStarted && (
              <div className="pt-4">
                <Button 
                  onClick={handleStartBidding}
                  size="lg"
                  className="w-full bg-accent hover:bg-accent/90"
                >
                  開始競標 (Start Bidding)
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

        {/* Bidding Stats and Bids Table - Only show after bidding started */}
        {biddingStarted && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">Total Bids (總出價數)</p>
                  <p className="text-3xl font-bold text-foreground">
                    {mockBids.length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">
                    {pricingMode === "make-offer" ? "目標價格 (Target Price)" : "固定價格 (Fixed Price)"}
                  </p>
                  <p className="text-3xl font-bold text-accent">
                    {pricingMode === "make-offer"
                      ? (targetPrice ? formatCurrency(Number(targetPrice), currency) : "未設定 (Not set)")
                      : (fixedPrice ? formatCurrency(Number(fixedPrice), currency) : "未設定 (Not set)")}
                  </p>
                  {pricingMode === "make-offer" && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {showPriceToBidders ? "✓ 顯示給買家 (Shown to buyers)" : "✗ 不顯示給買家 (Hidden from buyers)"}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* All Bids Table */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>所有出價 (All Bids)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">選擇 (Select)</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Bid ID</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">公司名稱 (Company)</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">聯絡人 (Contact)</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">國家 (Country)</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">出價 (Amount)</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">提交時間 (Submitted)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockBids
                        .sort((a, b) => b.amount - a.amount)
                        .map((bid, index) => (
                          <tr 
                            key={bid.id} 
                            className={cn(
                              "border-b border-border hover:bg-muted/50 transition-colors cursor-pointer",
                              selectedBid === bid.id && "bg-accent/10"
                            )}
                            onClick={() => setSelectedBid(bid.id)}
                          >
                            <td className="py-3 px-4">
                              <input
                                type="radio"
                                name="selectedBid"
                                checked={selectedBid === bid.id}
                                onChange={() => setSelectedBid(bid.id)}
                                className="cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-4 font-medium text-foreground">
                              {bid.id}
                              {index === 0 && (
                                <Trophy className="inline-block ml-2 h-4 w-4 text-yellow-500" />
                              )}
                            </td>
                            <td className="py-3 px-4 text-foreground font-medium">{bid.buyerName}</td>
                            <td className="py-3 px-4 text-muted-foreground">{bid.contactName}</td>
                            <td className="py-3 px-4 text-muted-foreground">{bid.country}</td>
                            <td className="py-3 px-4 text-foreground font-semibold">
                              {formatCurrency(bid.amount, bid.currency)}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">{bid.submittedAt}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {selectedBid && (
                  <div className="mt-4 p-4 bg-accent/10 border border-accent rounded-lg">
                    <p className="text-sm text-foreground">
                      ✓ 已選擇: <span className="font-semibold">
                        {mockBids.find(b => b.id === selectedBid)?.buyerName}
                      </span> - {formatCurrency(
                        mockBids.find(b => b.id === selectedBid)?.amount || 0,
                        mockBids.find(b => b.id === selectedBid)?.currency || currency
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
              >
                儲存並稍後繼續 (Save & Continue Later)
              </Button>
              <Button
                onClick={handleAcceptBid}
                disabled={!selectedBid}
                size="lg"
                className="bg-accent hover:bg-accent/90"
              >
                接受選定的出價 (Accept Selected Bid)
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BiddingStep;
