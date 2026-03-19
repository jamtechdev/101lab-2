import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StepIndicator from "@/components/common/StepIndicator";
import { useTranslation } from "react-i18next";
import { Download, CheckCircle2, Award, Calendar as CalendarIcon, Truck, Package } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/greenbidz_logo.png";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import { useGetBatchReportQuery } from "@/rtk/slices/bidApiSlice";

// Validation schema
const pickupSchema = z.object({
  pickupDate: z.date({ required_error: "Pickup date is required" }),
  pickupTime: z.string().min(1, { message: "Pickup time is required" }),
});

// Mock inspection companies data
const inspectionCompanies = [
  {
    id: 1,
    name: "Global Recycling Co.",
    country: "Singapore",
    contactPerson: "John Lee",
    email: "john@globalrecycling.com",
    attended: true
  },
  {
    id: 2,
    name: "EcoTech Solutions",
    country: "Malaysia",
    contactPerson: "Sarah Chen",
    email: "sarah@ecotech.com",
    attended: true
  },
  {
    id: 3,
    name: "Green Industries Ltd",
    country: "Thailand",
    contactPerson: "Michael Wong",
    email: "m.wong@greenind.com",
    attended: false
  },
  {
    id: 4,
    name: "AsiaWaste Management",
    country: "Hong Kong",
    contactPerson: "David Tan",
    email: "david@asiawaste.com",
    attended: true
  },
];

// Mock bids data with currency
const mockBids = [
  {
    id: "BID-001",
    companyName: "ABC Manufacturing Pte Ltd",
    contactName: "John Tan",
    country: "Singapore",
    amount: 48500,
    currency: "USD",
  },
  {
    id: "BID-002",
    companyName: "Global Equipment Trading",
    contactName: "Sarah Wong",
    country: "Malaysia",
    amount: 47200,
    currency: "USD",
  },
  {
    id: "BID-003",
    companyName: "Industrial Solutions Inc",
    contactName: "Mike Chen",
    country: "Taiwan",
    amount: 1450000,
    currency: "TWD",
  },
  {
    id: "BID-004",
    companyName: "MetalWorks Asia",
    contactName: "David Lim",
    country: "Hong Kong",
    amount: 44000,
    currency: "USD",
  },
];

const ReportStep = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const winnerIdFromUrl = searchParams.get("winner");
   const [awardedBidId] = useState<string | null>(winnerIdFromUrl);
 
   const [pickupDate, setPickupDate] = useState<Date>();
   const [pickupTime, setPickupTime] = useState<string>("");
   const [pickupComplete, setPickupComplete] = useState<boolean>(false);
   const [errors, setErrors] = useState<{ [key: string]: string }>({});
 
   // Fetch API data
   const { data, isLoading, error } = useGetBatchReportQuery(46);
   const report = data?.report;
 
   // API mappings
   const inspectionCompaniesApi = report?.inspection_companies ?? [];
   const bidsApi = report?.bids ?? [];
   const winningBidApi = report?.winning_company ?? null;
 
   const companiesRegistered = report?.companies_registered ?? 0;
   const companiesAttended = report?.companies_attended ?? 0;
   const totalBids = report?.total_bids_received ?? 0;
   const winningAmount = report?.winning_amount ?? null;
 
   // Map inspection companies to UI format
   const inspectionCompanies = inspectionCompaniesApi.map((item, index) => ({
     id: item.inspection_id + "-" + index,
     name: item.inspector_name || "N/A",
     country: "N/A",
     contactPerson: item.inspector_name || "N/A",
     email: "N/A",
     attended: item.attended,
   }));
 
 

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
         country: "N/A",
         amount: Number(winningBidApi.amount),
         currency: "USD",
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
 
   // Handle pickup scheduling
   const handleSchedulePickup = () => {
     try {
       pickupSchema.parse({ pickupDate, pickupTime });
       setErrors({});
       toast.success(`取貨時間已安排：${format(pickupDate!, "PPP")} ${pickupTime}`);
     } catch (error) {
       if (error instanceof z.ZodError) {
         const newErrors: { [key: string]: string } = {};
         error.errors.forEach((err) => {
           if (err.path[0]) newErrors[err.path[0] as string] = err.message;
         });
         setErrors(newErrors);
         toast.error(t('steps.step5.completePickupSchedule'));
       }
     }
   };
 
   const handleDownloadReport = () => {
     toast.success(t('steps.step5.downloadingReport'));
   };
 
   const handleCompletePickup = () => {
     if (!pickupComplete) return toast.error(t('steps.step5.confirmPickupComplete'));
     if (!pickupDate || !pickupTime) return toast.error(t('steps.step5.schedulePickupFirst'));
     toast.success(t('steps.step5.transactionCompleted'));
     navigate("/confirmation");
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
        {/* Step Indicator */}
        <StepIndicator 
          currentStep={6} 
          totalSteps={6}
          steps={["Upload", "Inventory", "Inspection", "Bidding", "Payment", "Report"]}
        />

        {/* Success Banner */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {t('steps.step5.paymentConfirmedTitle')}
              </h2>
              <p className="text-muted-foreground mt-1">
                {t('reportStep.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Inspection Participants */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('reportStep.inspectionParticipants')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                {t('reportStep.companiesRegistered', { total: inspectionCompanies.length, attended: attendedCompanies.length })}
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reportStep.company')}</TableHead>
                  <TableHead>{t('steps.step3.country')}</TableHead>
                  <TableHead>{t('steps.step3.contactPerson')}</TableHead>
                  <TableHead>{t('steps.step3.email')}</TableHead>
                  <TableHead>{t('reportStep.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspectionCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.country}</TableCell>
                    <TableCell>{company.contactPerson}</TableCell>
                    <TableCell>{company.email}</TableCell>
                    <TableCell>
                      {company.attended ? (
                        <Badge className="bg-green-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {t('reportStep.attended')}
                        </Badge>
                      ) : (
                        <Badge variant="outline">{t('reportStep.notAttended')}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Bids Table */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('reportStep.allBidsReceived')}</CardTitle>
              <Button variant="outline" onClick={handleDownloadReport}>
                <Download className="w-4 h-4 mr-2" />
                {t('reportStep.download')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reportStep.bidId')}</TableHead>
                  <TableHead>{t('reportStep.company')}</TableHead>
                  <TableHead>{t('reportStep.contact')}</TableHead>
                  <TableHead>{t('steps.step3.country')}</TableHead>
                  <TableHead className="text-right">{t('reportStep.amount')}</TableHead>
                  <TableHead>{t('reportStep.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockBids
                  .sort((a, b) => b.amount - a.amount)
                  .map((bid) => {
                    const isAwarded = bid.id === awardedBidId;
                    return (
                      <TableRow key={bid.id} className={isAwarded ? "bg-accent/10" : ""}>
                        <TableCell className="font-medium">{bid.id}</TableCell>
                        <TableCell>{bid.companyName}</TableCell>
                        <TableCell>{bid.contactName}</TableCell>
                        <TableCell>{bid.country}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(bid.amount, bid.currency)}
                        </TableCell>
                        <TableCell>
                          {isAwarded ? (
                            <Badge className="bg-accent text-white">
                              <Award className="w-3 h-3 mr-1" />
                              {t('reportStep.winner')}
                            </Badge>
                          ) : (
                            <Badge variant="outline">{t('reportStep.notSelected')}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Winning Bid Details */}
        {winningBid && (
          <Card className="mb-8 border-accent">
            <CardHeader className="bg-accent/5">
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-accent" />
                {t('reportStep.winnerDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">{t('reportStep.company')}</p>
                  <p className="font-semibold text-foreground text-lg">
                    {winningBid.companyName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('steps.step3.contactPerson')}</p>
                  <p className="font-semibold text-foreground text-lg">
                    {winningBid.contactName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('steps.step3.country')}</p>
                  <p className="font-semibold text-foreground text-lg">
                    {winningBid.country}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('reportStep.winningAmount')}</p>
                  <p className="font-semibold text-accent text-2xl">
                    {formatCurrency(winningBid.amount, winningBid.currency)}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="font-semibold text-foreground mb-3">{t('reportStep.transactionTerms')}</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{t('reportStep.shipping')}</span> {t('reportStep.shippingDesc')}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{t('reportStep.payment')}</span> {t('reportStep.paymentDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pickup Schedule */}
        {winningBid && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-accent" />
                {t('reportStep.pickupSchedule')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('reportStep.pickupDate')}</Label>
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
                        {pickupDate ? format(pickupDate, "PPP") : t('reportStep.pickDate')}
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
                  <Label>{t('reportStep.pickupTime')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.slice(0, 4).map((slot) => (
                      <Button
                        key={slot}
                        variant={pickupTime === slot ? "default" : "outline"}
                        onClick={() => setPickupTime(slot)}
                        className="text-xs"
                        size="sm"
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                  {errors.pickupTime && (
                    <p className="text-sm text-destructive">{errors.pickupTime}</p>
                  )}
                </div>
              </div>

              <Button onClick={handleSchedulePickup} className="w-full">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {t('reportStep.confirmPickupSchedule')}
              </Button>

              {pickupDate && pickupTime && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-start gap-3 mb-4">
                    <Package className="w-5 h-5 text-accent mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">
                        {t('reportStep.scheduledPickup')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(pickupDate, "PPP")} - {pickupTime}
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
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {t('reportStep.pickupCompleteDesc')}
                    </Label>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Transaction Summary */}
        <Card className="mb-8 bg-muted/30">
          <CardHeader>
            <CardTitle>{t('reportStep.transactionSummary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">查驗參與數</p>
                <p className="text-2xl font-bold text-foreground">{attendedCompanies.length}</p>
                <p className="text-xs text-muted-foreground">{t('reportStep.companiesAttended')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">總出價數</p>
                <p className="text-2xl font-bold text-foreground">{mockBids.length}</p>
                <p className="text-xs text-muted-foreground">{t('reportStep.totalBidsReceived')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">成交金額</p>
                <p className="text-2xl font-bold text-accent">
                  {winningBid ? formatCurrency(winningBid.amount, winningBid.currency) : "-"}
                </p>
                <p className="text-xs text-muted-foreground">{t('reportStep.winningAmountLabel')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            {t('reportStep.returnDashboard')}
          </Button>
          <Button
            onClick={handleCompletePickup}
            disabled={!pickupComplete}
            size="lg"
            className="bg-accent hover:bg-accent/90"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {t('reportStep.completeTransaction')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportStep;
