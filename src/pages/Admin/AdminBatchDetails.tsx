import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGetBatchDetailsQuery } from "@/rtk/slices/adminApiSlice";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Loader2,
  Package,
  User,
  Mail,
  Phone,
  Building2,
  Globe,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Percent,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  Users,
  Award,
  CreditCard,
  Receipt,
  Truck,
  FileText,
} from "lucide-react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

// ---------------- Status Badge Helper ----------------
const getStatusBadge = (status: string, t: any) => {
  const statusMap: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }
  > = {
    sold: { label: t('admin.status.sold'), variant: "secondary", color: "bg-gray-500" },
    published: { label: t('admin.status.published'), variant: "default", color: "bg-blue-500" },
    live_for_bids: { label: t('admin.status.liveForBids'), variant: "default", color: "bg-green-500" },
    inspection_schedule: { label: t('admin.status.inspectionScheduled'), variant: "secondary", color: "bg-yellow-500" },
    closed: { label: t('admin.status.closed'), variant: "destructive", color: "bg-red-500" },
    active: { label: t('admin.status.active'), variant: "default", color: "bg-green-500" },
    paid: { label: t('admin.status.paid'), variant: "default", color: "bg-green-500" },
    accepted: { label: t('admin.status.accepted'), variant: "default", color: "bg-green-500" },
    rejected: { label: t('admin.status.rejected'), variant: "destructive", color: "bg-red-500" },
  };

  return statusMap[status] || { label: status, variant: "secondary", color: "bg-gray-500" };
};

// ---------------- Loading Skeleton ----------------
const DetailsSkeleton = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  </div>
);

const AdminBatchDetails = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useAdminSidebar();
  const { data, isLoading, isError } = useGetBatchDetailsQuery(Number(batchId), {
    skip: !batchId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-background via-background to-muted/20">
        <AdminSidebar activePath="/admin/listings" />
        <div
          className={cn(
            "transition-all duration-300 min-h-screen overflow-y-auto",
            sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
            "ml-0"
          )}
        >
          <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            <Skeleton className="h-10 w-64" />
            <DetailsSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data?.success) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-background">
        <AdminSidebar activePath="/admin/listings" />
        <div
          className={cn(
            "transition-all duration-300 min-h-screen flex justify-center items-center",
            sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
            "ml-0"
          )}
        >
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">{t('admin.common.error')}</CardTitle>
              <CardDescription>{t('admin.batchDetails.failedToLoad')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate(-1)} variant="outline">
                {t('admin.batchDetails.backToListings')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const batchData = data.data;
  const batchStatus = getStatusBadge(batchData.batch.status, t);
  const biddingStatus = getStatusBadge(batchData.bidding.status, t);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <AdminSidebar activePath="/admin/listings" />

      <div
        className={cn(
          "transition-all duration-300 min-h-screen overflow-y-auto",
          // Desktop: margin based on sidebar collapsed state
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
          // Mobile: no margin (sidebar is overlay)
          "ml-0"
        )}
      >
        {/* Mobile header with menu button */}
        <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm -mx-4 -mt-4 px-4 py-3 mb-6 lg:hidden">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-foreground"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex-1 text-center">
              <span className="text-lg font-semibold">{t('admin.batchDetails.title')}</span>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        <div className="p-4 lg:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
          {/* ---------------- HEADER ---------------- */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold tracking-tight">Batch #{batchData.batch.batch_id}</h1>
                <Badge
                  variant={batchStatus.variant}
                  className={`${batchStatus.color} text-white border-0 shadow-sm px-3 py-1`}
                >
                  {batchStatus.label}
                </Badge>
                {batchData.batch.commission_percent != null && (
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 border-primary/30 bg-primary/10 shadow-sm">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/20">
                      <Percent className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide">{t('admin.listings.commission')}</span>
                      <span className="text-lg font-bold text-foreground">{Number(batchData.batch.commission_percent)}%</span>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-muted-foreground mt-1">{t('admin.batchDetails.subtitle')}</p>
            </div>
          </div>

          {/* ---------------- SELLER INFORMATION ---------------- */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{t('admin.batchDetails.sellerInformation')}</CardTitle>
                  <CardDescription>{t('admin.batchDetails.contactDetails')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <User className="h-4 w-4 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.batchDetails.name')}</p>
                    <p className="text-sm font-semibold">{batchData.seller.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Mail className="h-4 w-4 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.batchDetails.email')}</p>
                    <p className="text-sm font-semibold">{batchData.seller.email}</p>
                  </div>
                </div>
                {batchData.seller.phone && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <Phone className="h-4 w-4 text-primary mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.batchDetails.phone')}</p>
                      <p className="text-sm font-semibold">{batchData.seller.phone}</p>
                    </div>
                  </div>
                )}
                {batchData.seller.company && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <Building2 className="h-4 w-4 text-primary mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.batchDetails.company')}</p>
                      <p className="text-sm font-semibold">{batchData.seller.company}</p>
                    </div>
                  </div>
                )}
                {batchData.seller.country && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <Globe className="h-4 w-4 text-primary mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.batchDetails.country')}</p>
                      <p className="text-sm font-semibold">{batchData.seller.country}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ---------------- PRODUCTS SECTION ---------------- */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Products: {batchData.products_total}</CardTitle>
                    <CardDescription>{t('admin.batchDetails.allProducts')}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {batchData.products.map((product) => (
                  <Card
                    key={product.product_id}
                    className="overflow-hidden border-2 hover:border-primary/50 transition-all hover:shadow-lg bg-gradient-to-br from-card to-muted/10"
                  >
                    {product.images && product.images.length > 0 ? (
                      <div className="relative overflow-hidden">
                        <img
                          src={product.images[0].url}
                          className="h-48 w-full object-cover transition-transform duration-300 hover:scale-110"
                          alt={product.title}
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                    ) : (
                      <div className="h-48 w-full bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2 hover:text-primary transition-colors">
                        {product.title}
                      </h3>
                      {product.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ---------------- INSPECTION SECTION ---------------- */}
          {batchData.inspection && (
            <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{t('admin.batchDetails.inspectionDetails')}</CardTitle>
                      <CardDescription>{t('admin.batchDetails.scheduleAndRegistrations')}</CardDescription>
                    </div>
                  </div>
                  {/* <Badge
                    variant={inspectionStatus.variant}
                    className={`${inspectionStatus.color} text-white border-0`}
                  >
                    {inspectionStatus.label}
                  </Badge> */}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Inspection Schedule */}
                {batchData.inspection.schedule && batchData.inspection.schedule.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {t('admin.batchDetails.schedule')}
                    </h4>
                    <div className="space-y-3">
                      {batchData.inspection.schedule.map((schedule, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-lg bg-muted/30 border border-border/50"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="font-semibold">
                              {format(new Date(schedule.date), "EEEE, MMMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {schedule.slots.map((slot, slotIdx) => (
                              <Badge key={slotIdx} variant="outline" className="gap-1">
                                <Clock className="h-3 w-3" />
                                {slot.time}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inspection Registrations */}
                {batchData.inspection.inspectionRegistration &&
                  batchData.inspection.inspectionRegistration.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Registered Companies: {batchData.inspection.inspectionRegistration.length}
                      </h4>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t('admin.batchDetails.company')}</TableHead>
                              <TableHead>{t('admin.batchDetails.buyer')}</TableHead>
                              <TableHead>{t('admin.batchDetails.dateTime')}</TableHead>
                              <TableHead>{t('admin.batchDetails.status')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {batchData.inspection.inspectionRegistration.map((registration) => (
                              <TableRow key={registration.registration_id}>
                                <TableCell className="font-medium">{registration.company_name}</TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{registration.buyer.name}</p>
                                    <p className="text-xs text-muted-foreground">{registration.buyer.email}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="text-sm">{format(new Date(registration.date), "MMM d, yyyy")}</p>
                                    <p className="text-xs text-muted-foreground">{registration.slot}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    {registration.selected && (
                                      <Badge variant="default" className="w-fit bg-green-500">
                                        {t('admin.status.selected')}
                                      </Badge>
                                    )}
                                    {registration.skipped && (
                                      <Badge variant="destructive" className="w-fit">
                                        {t('admin.status.skipped')}
                                      </Badge>
                                    )}
                                    {!registration.selected && !registration.skipped && (
                                      <Badge variant="outline" className="w-fit">
                                        {t('admin.status.registered')}
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          {/* ---------------- BIDDING SECTION ---------------- */}
          {batchData.bidding && (
            <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{t('admin.batchDetails.biddingInformation')}</CardTitle>
                      <CardDescription>{t('admin.batchDetails.bidDetails')}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={biddingStatus.variant}
                    className={`${biddingStatus.color} text-white border-0`}
                  >
                    {biddingStatus.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Bidding Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.batchDetails.type')}</p>
                     <p className="text-sm font-semibold capitalize">
           {batchData?.bidding?.type?.replace?.("_", " ") || "N/A"}

                      
                      </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.batchDetails.targetPrice')}</p>
                    <p className="text-sm font-semibold">
                      {batchData.bidding.currency} {parseFloat(batchData.bidding.target_price).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.batchDetails.currentPrice')}</p>
                    <p className="text-sm font-semibold">
                      {batchData.bidding.currency} {parseFloat(batchData.bidding.current_price).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.batchDetails.totalBids')}</p>
                    <p className="text-sm font-semibold">{batchData.bidding.total_biddings}</p>
                  </div>
                </div>

                {/* Bidding Period & Location */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <p className="text-xs text-muted-foreground font-medium">{t('admin.batchDetails.startDate')}</p>
                    </div>
                    <p className="text-sm font-semibold">
                 {batchData?.bidding?.start_date
  ? format(new Date(batchData.bidding.start_date), "MMM d, yyyy")
  : "N/A"}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <p className="text-xs text-muted-foreground font-medium">{t('admin.batchDetails.endDate')}</p>
                    </div>
                    <p className="text-sm font-semibold">
                 {batchData?.bidding?.end_date
  ? format(new Date(batchData.bidding.end_date), "MMM d, yyyy")
  : "N/A"}
                    </p>
                  </div>
                  {batchData.bidding.location && (
                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <p className="text-xs text-muted-foreground font-medium">{t('admin.batchDetails.location')}</p>
                      </div>
                      <p className="text-sm font-semibold">{batchData.bidding.location}</p>
                    </div>
                  )}
                </div>

                {/* Buyer Bids Table */}
                {batchData.bidding.buyer_bids && batchData.bidding.buyer_bids.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Buyer Bids: {batchData.bidding.buyer_bids.length}
                    </h4>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('admin.batchDetails.buyer')}</TableHead>
                            <TableHead>{t('admin.batchDetails.amount')}</TableHead>
                            <TableHead>{t('admin.batchDetails.status')}</TableHead>
                            <TableHead>{t('admin.batchDetails.submitted')}</TableHead>
                            <TableHead>{t('admin.batchDetails.payment')}</TableHead>
                            <TableHead>{t('admin.batchDetails.notes')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {batchData.bidding.buyer_bids.map((bid, idx) => {
                            const bidStatus = getStatusBadge(bid.status, t);
                            const paymentStatus = bid.payment
                              ? getStatusBadge(bid.payment.status, t)
                              : { label: "N/A", variant: "outline" as const, color: "bg-gray-500" };
                            return (
                              <TableRow key={idx}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{bid.buyer.name}</p>
                                    <p className="text-xs text-muted-foreground">{bid.buyer.email}</p>
                                    {bid.buyer.phone && (
                                      <p className="text-xs text-muted-foreground">{bid.buyer.phone}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-semibold">
                                  {batchData.bidding.currency} {parseFloat(bid.amount).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={bidStatus.variant}
                                    className={`${bidStatus.color} text-white border-0`}
                                  >
                                    {bidStatus.label}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <p className="text-sm">
                                    {format(new Date(bid.submitted_at), "MMM d, yyyy HH:mm")}
                                  </p>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={paymentStatus.variant}
                                    className={`${paymentStatus.color} text-white border-0`}
                                  >
                                    {paymentStatus.label}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <p className="text-sm text-muted-foreground">
                                    {bid.notes || <span className="italic">{t('admin.batchDetails.noNotes')}</span>}
                                  </p>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ---------------- WINNER SECTION ---------------- */}
          {batchData.winners && batchData.winners.buyer && (
            <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{t('admin.batchDetails.winner')}</CardTitle>
                    <CardDescription>{t('admin.batchDetails.awardedBid')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.batchDetails.winningAmount')}</p>
                      <p className="text-2xl font-bold text-primary">
                        {batchData.bidding.currency} {parseFloat(batchData.winners.amount).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground font-medium mb-2">{t('admin.batchDetails.buyerInformation')}</p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">{t('admin.batchDetails.name')}</p>
                          <p className="text-sm font-semibold">{batchData.winners.buyer.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t('admin.batchDetails.email')}</p>
                          <p className="text-sm font-semibold">{batchData.winners.buyer.email}</p>
                        </div>
                        {batchData.winners.buyer.company && (
                          <div>
                            <p className="text-xs text-muted-foreground">{t('admin.batchDetails.company')}</p>
                            <p className="text-sm font-semibold">{batchData.winners.buyer.company}</p>
                          </div>
                        )}
                        {batchData.winners.buyer.phone && (
                          <div>
                            <p className="text-xs text-muted-foreground">{t('admin.batchDetails.phone')}</p>
                            <p className="text-sm font-semibold">{batchData.winners.buyer.phone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="p-6 rounded-full bg-primary/10 w-24 h-24 flex items-center justify-center mx-auto">
                        {batchData.winners.payment_status === "paid" ? (
                          <CheckCircle2 className="h-12 w-12 text-green-500" />
                        ) : (
                          <CreditCard className="h-12 w-12 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-2">{t('admin.batchDetails.paymentStatus')}</p>
                        <Badge
                          variant={getStatusBadge(batchData.winners.payment_status, t).variant}
                          className={`${getStatusBadge(batchData.winners.payment_status, t).color} text-white border-0 text-lg px-4 py-2`}
                        >
                          {getStatusBadge(batchData.winners.payment_status, t).label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ---------------- PAYMENT DETAIL SECTION ---------------- */}
          {batchData.paymentDetail && (
            <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{t('admin.batchDetails.paymentDetails')}</CardTitle>
                      <CardDescription>{t('admin.batchDetails.transactionInfo')}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={getStatusBadge(batchData.paymentDetail.payment_status, t).variant}
                    className={`${getStatusBadge(batchData.paymentDetail.payment_status, t).color} text-white border-0`}
                  >
                    {getStatusBadge(batchData.paymentDetail.payment_status, t).label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.batchDetails.paymentAmount')}</p>
                    <p className="text-lg font-bold text-primary">
                      {batchData.bidding.currency} {parseFloat(batchData.paymentDetail.amount).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.batchDetails.paymentMethod')}</p>
                    <p className="text-sm font-semibold">{batchData.paymentDetail.payment_method}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.batchDetails.transactionNumber')}</p>
                    <p className="text-sm font-semibold font-mono">{batchData.paymentDetail.transaction_number}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.batchDetails.deliveryType')}</p>
                    <div className="flex items-center gap-2">
                      {batchData.paymentDetail.is_delivery ? (
                        <>
                          <Truck className="h-4 w-4 text-primary" />
                          <p className="text-sm font-semibold">{t('admin.batchDetails.delivery')}</p>
                        </>
                      ) : (
                        <>
                          <Package className="h-4 w-4 text-primary" />
                          <p className="text-sm font-semibold">{t('admin.batchDetails.pickup')}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Date & Pickup Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <p className="text-xs text-muted-foreground font-medium">{t('admin.batchDetails.paidAt')}</p>
                    </div>
                    <p className="text-sm font-semibold">
                      {format(new Date(batchData.paymentDetail.paid_at), "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                  {batchData.paymentDetail.pickup_date && (
                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <p className="text-xs text-muted-foreground font-medium">{t('admin.batchDetails.pickupDate')}</p>
                      </div>
                      <p className="text-sm font-semibold">
                        {format(new Date(batchData.paymentDetail.pickup_date), "MMM d, yyyy")}
                      </p>
                    </div>
                  )}
                  {batchData.paymentDetail.pickup_time && (
                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <p className="text-xs text-muted-foreground font-medium">{t('admin.batchDetails.pickupTime')}</p>
                      </div>
                      <p className="text-sm font-semibold">{batchData.paymentDetail.pickup_time}</p>
                    </div>
                  )}
                </div>

                {/* Buyer Information */}
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('admin.batchDetails.buyerInformation')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.batchDetails.name')}</p>
                      <p className="text-sm font-semibold">{batchData.paymentDetail.buyer.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.batchDetails.email')}</p>
                      <p className="text-sm font-semibold">{batchData.paymentDetail.buyer.email}</p>
                    </div>
                    {batchData.paymentDetail.buyer.company && (
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.batchDetails.company')}</p>
                        <p className="text-sm font-semibold">{batchData.paymentDetail.buyer.company}</p>
                      </div>
                    )}
                    {batchData.paymentDetail.buyer.phone && (
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1">{t('admin.batchDetails.phone')}</p>
                        <p className="text-sm font-semibold">{batchData.paymentDetail.buyer.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBatchDetails;
