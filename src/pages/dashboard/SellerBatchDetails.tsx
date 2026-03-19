import React from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Calendar,
  Clock,
  AlertCircle,
  Gavel,
  MapPin,
  FileText,
  CheckCircle2,
  User,
  Info,
  Layers,
  Tag,
  TrendingUp,
  Building2,
  CreditCard,
  Award,
  Truck,
} from "lucide-react";
import { useGetBatchByIdQuery } from "@/rtk/slices/batchApiSlice";
import { useGetWinnerForBatchQuery, useGetPaymentsByBatchQuery } from "@/rtk/slices/bidApiSlice";
import { extractValuesFromPhpSerialized } from "@/utils/parsePhpSerializedUrl";
import Header from "../product-listing/Header";

export default function SellerBatchDetails() {
  const { batchId } = useParams<{ batchId: string }>();
  const { t, i18n } = useTranslation();

  const { data, isLoading, isError } = useGetBatchByIdQuery(Number(batchId), {
    skip: !batchId,
  });

  const { data: winnerData } = useGetWinnerForBatchQuery(Number(batchId), {
    skip: !batchId,
  });

  const { data: paymentData } = useGetPaymentsByBatchQuery(Number(batchId), {
    skip: !batchId,
  });

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      const locale = i18n.language === "zh" ? "zh-TW" : "en-US";
      return date.toLocaleDateString(locale, {
        year: "numeric",
        month: i18n.language === "zh" ? "numeric" : "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      const locale = i18n.language === "zh" ? "zh-TW" : "en-US";
      return date.toLocaleString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTimeSlot = (timeStr?: string | null) => {
    if (!timeStr) return "N/A";
    if (i18n.language === "zh") {
      return timeStr.replace(/\bAM\b/g, "上午").replace(/\bPM\b/g, "下午");
    }
    return timeStr;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-5xl space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !data?.success) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Card>
            <CardContent className="p-8 flex flex-col items-center gap-3">
              <AlertCircle className="w-10 h-10 text-destructive" />
              <p className="text-lg font-semibold">Failed to load batch details</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const batchData = (data as any)?.data;
  const batch = batchData?.batch;
  const products: any[] = batchData?.products || [];
  const inspection = batchData?.insepction;
  const bidding = batchData?.biddingDetails;
  const winnerPayment = batchData?.winnerPayment;

  const winner = (winnerData as any)?.data?.winner || null;
  const payment = (paymentData as any)?.data?.[0] || null;

  const isWeightBased = winner?.quotation_types?.includes("weight_based");
  const isWholeItem = winner?.quotation_types?.includes("whole_item");
  const currency = winner?.currency || bidding?.currency || "USD";
  const formatCurrency = (amount: number, curr: string) =>
    curr === "TWD" ? `NT$${Number(amount).toLocaleString()}` : `$${Number(amount).toLocaleString()}`;

  const approvalColor =
    batch?.approval_status === "approved"
      ? "bg-green-100 text-green-800 border-green-200"
      : batch?.approval_status === "rejected"
      ? "bg-red-100 text-red-800 border-red-200"
      : "bg-yellow-100 text-yellow-800 border-yellow-200";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        {/* Page title */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Batch #{batch?.batch_number || batchId}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("factories.tracking.batchId")}: {batchId}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {batch?.status && (
              <Badge variant="outline" className="text-sm px-3 py-1">
                {batch.status}
              </Badge>
            )}
            {batch?.approval_status && (
              <Badge className={`text-sm px-3 py-1 border ${approvalColor}`}>
                {batch.approval_status === "approved" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <Clock className="w-3.5 h-3.5 mr-1" />
                )}
                {batch.approval_status}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Products + Bidding */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products */}
            <Card className="shadow-sm border overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    <CardTitle>Products in Batch</CardTitle>
                  </div>
                  <Badge variant="secondary">{products.length} item{products.length !== 1 ? "s" : ""}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {products.length > 0 ? (
                  <div className="space-y-4">
                    {products.map((product: any) => {
                      const condition =
                        extractValuesFromPhpSerialized(
                          product.meta?.find(
                            (m: any) => m.meta_key === "condition"
                          )?.meta_value
                        )[0] || null;
                      const operationStatus =
                        extractValuesFromPhpSerialized(
                          product.meta?.find(
                            (m: any) => m.meta_key === "operation_status"
                          )?.meta_value
                        )[0] || null;
                      const sellerName = product.meta?.find(
                        (m: any) => m.meta_key === "seller_name"
                      )?.meta_value;
                      const brand = product.meta?.find(
                        (m: any) => m.meta_key === "brand"
                      )?.meta_value;
                      const model = product.meta?.find(
                        (m: any) => m.meta_key === "model"
                      )?.meta_value;
                      const year = product.meta?.find(
                        (m: any) => m.meta_key === "year_of_manufacture"
                      )?.meta_value;
                      const weight = product.meta?.find(
                        (m: any) => m.meta_key === "weight"
                      )?.meta_value;
                      const category = product.categories?.[0]?.term || null;
                      const images: any[] = product.attachments?.filter(
                        (a: any) => a.type !== "pdf"
                      ) || [];
                      const docs: any[] = product.attachments?.filter(
                        (a: any) => a.type === "pdf"
                      ) || [];

                      return (
                        <Card
                          key={product.product_id}
                          className="overflow-hidden border hover:shadow-md transition-shadow"
                        >
                          <div className="flex gap-4 p-4">
                            {/* Image */}
                            {images[0]?.url ? (
                              <img
                                src={images[0].url}
                                alt={product.title}
                                className="w-28 h-28 object-cover rounded-lg border flex-shrink-0"
                              />
                            ) : (
                              <div className="w-28 h-28 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}

                            {/* Details */}
                            <div className="flex-1 min-w-0 space-y-2">
                              <h3 className="font-semibold text-base line-clamp-1">
                                {product.title}
                              </h3>
                              {product.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {product.description}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-2 text-sm">
                                {category && (
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Tag className="w-3.5 h-3.5" />
                                    {category}
                                  </span>
                                )}
                                {condition && (
                                  <Badge variant="outline" className="text-xs">
                                    {condition}
                                  </Badge>
                                )}
                                {operationStatus && (
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Info className="w-3.5 h-3.5" />
                                    {operationStatus}
                                  </span>
                                )}
                                {sellerName && (
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <User className="w-3.5 h-3.5" />
                                    {sellerName}
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                {brand && <span><span className="font-medium">Brand:</span> {brand}</span>}
                                {model && <span><span className="font-medium">Model:</span> {model}</span>}
                                {year && <span><span className="font-medium">Year:</span> {year}</span>}
                                {weight && <span><span className="font-medium">Weight:</span> {weight}</span>}
                              </div>

                              {/* Extra images */}
                              {images.length > 1 && (
                                <div className="flex gap-2 mt-2 flex-wrap">
                                  {images.slice(1, 5).map((img: any, i: number) => (
                                    <img
                                      key={i}
                                      src={img.url}
                                      alt=""
                                      className="w-14 h-14 object-cover rounded border"
                                    />
                                  ))}
                                  {images.length > 5 && (
                                    <div className="w-14 h-14 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">
                                      +{images.length - 5}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Documents */}
                              {docs.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {docs.map((doc: any, i: number) => (
                                    <a
                                      key={i}
                                      href={doc.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs text-primary underline"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      Document {i + 1}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No products found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bidding Details */}
            {bidding && (
              <Card className="shadow-sm border overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-500/5 to-purple-500/10 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gavel className="w-5 h-5 text-purple-600" />
                      <CardTitle>Bidding Details</CardTitle>
                    </div>
                    <Badge
                      variant={
                        bidding.status === "active"
                          ? "default"
                          : bidding.status === "closed"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      {bidding.status || "Pending"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow
                      icon={<Calendar className="w-4 h-4 text-purple-600" />}
                      label="Start Date"
                      value={formatDateTime(bidding.start_date)}
                    />
                    <InfoRow
                      icon={<Calendar className="w-4 h-4 text-purple-600" />}
                      label="End Date"
                      value={formatDateTime(bidding.end_date)}
                    />
                    <InfoRow
                      icon={<Layers className="w-4 h-4 text-purple-600" />}
                      label="Type"
                      value={bidding.type === "make_offer" ? "Make Offer" : "Fixed Price"}
                    />
                    {bidding.target_price != null && (
                      <InfoRow
                        icon={<TrendingUp className="w-4 h-4 text-purple-600" />}
                        label="Target Price"
                        value={`${bidding.currency === "TWD" ? "NT$" : "$"}${Number(bidding.target_price).toLocaleString()} ${bidding.currency || ""}`}
                      />
                    )}
                    {bidding.location && (
                      <InfoRow
                        icon={<MapPin className="w-4 h-4 text-purple-600" />}
                        label="Location"
                        value={bidding.location}
                      />
                    )}
                    <InfoRow
                      icon={<Layers className="w-4 h-4 text-purple-600" />}
                      label="Bid Types Allowed"
                      value={[
                        bidding.allowWholePrice && "Whole Price",
                        bidding.allowWeightPrice && "Weight-Based",
                      ]
                        .filter(Boolean)
                        .join(", ") || "N/A"}
                    />
                    {bidding.buyer_bids?.length > 0 && (
                      <InfoRow
                        icon={<Gavel className="w-4 h-4 text-purple-600" />}
                        label="Total Bids"
                        value={String(bidding.buyer_bids.length)}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT: Batch info + Inspection + Winner Payment */}
          <div className="space-y-6">
            {/* Batch Info */}
            <Card className="shadow-sm border overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-accent/5 to-accent/10 border-b">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-accent" />
                  <CardTitle>Batch Info</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <InfoRow label="Batch #" value={batch?.batch_number || batchId} />
                <InfoRow label="Status" value={batch?.status || "N/A"} />
                <InfoRow label="Approval" value={batch?.approval_status || "pending"} />
                <InfoRow label="Step" value={batch?.step ? `Step ${batch.step}` : "N/A"} />
                {batch?.commission_percent != null && (
                  <InfoRow label="Commission" value={`${batch.commission_percent}%`} />
                )}
                <InfoRow label="Created" value={formatDate(batch?.createdAt)} />
              </CardContent>
            </Card>

            {/* Inspection */}
            <Card className="shadow-sm border overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500/5 to-blue-500/10 border-b">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <CardTitle>Inspection</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {inspection ? (
                  <div className="space-y-3">
                    {inspection.schedule?.map((slot: any, idx: number) => (
                      <div key={idx} className="space-y-1 border-b pb-3 last:border-0 last:pb-0">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Date {idx + 1}</p>
                        <p className="text-sm font-semibold flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          {formatDate(slot.date)}
                        </p>
                        {slot.slots?.map((s: any, si: number) => (
                          <p key={si} className="text-sm flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTimeSlot(s.time)}
                          </p>
                        ))}
                      </div>
                    ))}
                    {inspection.companies?.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Registered Companies</p>
                        {inspection.companies.map((c: any, i: number) => (
                          <div key={i} className="flex items-center gap-1.5 text-sm">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>{c.company_name || `Company ${i + 1}`}</span>
                            <Badge
                              variant="outline"
                              className={`text-xs ml-auto ${
                                c.skipped
                                  ? "text-muted-foreground"
                                  : c.status === "completed"
                                  ? "text-green-700"
                                  : ""
                              }`}
                            >
                              {c.skipped ? "Skipped" : c.status || "Registered"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No inspection scheduled</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Winner Details */}
            {winner && (
              <Card className="shadow-sm border overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-yellow-500/5 to-yellow-500/10 border-b">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-600" />
                    <CardTitle>Winner</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {winner.company_name && (
                    <InfoRow icon={<Building2 className="w-4 h-4 text-yellow-600" />} label="Company" value={winner.company_name} />
                  )}
                  {winner.contact_person && (
                    <InfoRow icon={<User className="w-4 h-4 text-yellow-600" />} label="Contact" value={winner.contact_person} />
                  )}
                  <InfoRow
                    label="Status"
                    value={
                      winner.status === "accepted" ? "Accepted" :
                      winner.status === "rejected" ? "Rejected" :
                      winner.status === "counter_offer" ? "Counter Offer" : "Pending"
                    }
                  />
                  {isWholeItem && winner.amount != null && (
                    <InfoRow
                      icon={<TrendingUp className="w-4 h-4 text-yellow-600" />}
                      label="Winning Bid"
                      value={formatCurrency(Number(winner.amount), currency)}
                    />
                  )}
                  {isWeightBased && winner.weight_quotations && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Weight Quotations</p>
                      {Object.entries(winner.weight_quotations).map(([key, val]: [string, any]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{key.replace(/_/g, " ")}</span>
                          <span className="font-semibold">NTD {Number(val).toLocaleString()}/kg</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Buyer Payment */}
            {payment && (
              <Card className="shadow-sm border overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-500/5 to-green-500/10 border-b">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <CardTitle>Payment</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {payment.payment_method && (
                    <InfoRow label="Method" value={payment.payment_method} />
                  )}
                  {payment.transaction_number && (
                    <InfoRow label="Transaction ID" value={payment.transaction_number} />
                  )}
                  {payment.createdAt && (
                    <InfoRow label="Confirmed At" value={formatDate(payment.createdAt)} />
                  )}
                  {payment.payment_proof_url && (
                    <div className="pt-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Payment Proof</p>
                      <a href={payment.payment_proof_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={payment.payment_proof_url}
                          alt="Payment Proof"
                          className="w-full max-w-[200px] h-auto rounded-md border cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Pickup Details */}
            {winnerPayment && (
              <Card className="shadow-sm border overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-accent/5 to-accent/10 border-b">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-accent" />
                    <CardTitle>Pickup Details</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {winnerPayment.pickup_date && (
                    <InfoRow icon={<Calendar className="w-4 h-4 text-accent" />} label="Pickup Date" value={formatDate(winnerPayment.pickup_date)} />
                  )}
                  {winnerPayment.pickup_time && (
                    <InfoRow icon={<Clock className="w-4 h-4 text-accent" />} label="Pickup Time" value={formatTimeSlot(winnerPayment.pickup_time)} />
                  )}
                  <InfoRow
                    label="Delivery"
                    value={winnerPayment.is_delivery ? "Yes" : "No"}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="mt-0.5 flex-shrink-0">{icon}</span>}
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-semibold">{value || "N/A"}</p>
      </div>
    </div>
  );
}
