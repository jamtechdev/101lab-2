import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart,
  Package,
  Calendar,
  Loader2,
  MessageCircle,
  CheckCircle,
  Truck,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  PartyPopper,
  X,
} from "lucide-react";
import { useGetBuyerBidsQuery } from "@/rtk/slices/buyerApiSlice";
import { useTranslation } from "react-i18next";
import ChatSidebarWrapper from "@/components/common/ChatSidebarWrapper";
import { cn } from "@/lib/utils";

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB");
};

/* ─── Step config ────────────────────────────────────────────── */
const STEP_CONFIG: Record<number, { label: string; color: string; icon: any }> = {
  6: { label: "Payment Processing", color: "bg-orange-100 text-orange-800 border-orange-300", icon: CreditCard },
  7: { label: "Pending Pickup",     color: "bg-blue-100 text-blue-800 border-blue-300",       icon: Truck },
  8: { label: "Completed",          color: "bg-green-100 text-green-800 border-green-300",    icon: CheckCircle },
  9: { label: "Deal Done",          color: "bg-purple-100 text-purple-800 border-purple-300", icon: PartyPopper },
};

/* ─── Filter tabs ────────────────────────────────────────────── */
const FILTER_TABS = [
  { key: null, label: "All Orders",       icon: ShoppingCart },
  { key: 7,    label: "Pending Pickup",   icon: Truck },
  { key: 8,    label: "Completed",        icon: CheckCircle },
  // { key: 9,    label: "Deal Done",        icon: PartyPopper },
] as const;

/* ─── Pagination ─────────────────────────────────────────────── */
const Pagination = ({ page, totalPages, onPageChange }: {
  page: number; totalPages: number; onPageChange: (p: number) => void;
}) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1} className="h-9 w-9 p-0">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Button key={p} variant={p === page ? "default" : "outline"} size="sm"
          className="h-9 min-w-9" onClick={() => onPageChange(p)}>{p}</Button>
      ))}
      <Button variant="outline" size="sm" onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages} className="h-9 w-9 p-0">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
const MyOrders: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const buyerId = Number(localStorage.getItem("userId") || 0);
  const [page, setPage] = useState(1);
  const [stepFilter, setStepFilter] = useState<number | null>(null);
  const [pickupDate, setPickupDate] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatBatchId, setChatBatchId] = useState<number | null>(null);

  const { data: bidsData, isLoading } = useGetBuyerBidsQuery({
    buyerId,
    page,
    limit: 50,
    status: "accepted",
  });

  const allWonBids = Array.isArray(bidsData?.data?.data) ? bidsData.data.data : [];

  // Base: all accepted bids at order stage (step >= 6)
  let orders = allWonBids.filter((bid: any) => Number(bid.batch_step) >= 6);

  // Apply step filter
  if (stepFilter !== null) {
    orders = orders.filter((bid: any) => Number(bid.batch_step) === stepFilter);
  }

  // Apply pickup date filter (matches end_date)
  if (pickupDate) {
    orders = orders.filter((bid: any) => {
      if (!bid.end_date) return false;
      return bid.end_date.startsWith(pickupDate);
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-10 bg-gradient-to-b from-primary to-accent rounded-full" />
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            {t("buyerDashboard.myOrders") || "My Orders"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {orders.length} order{orders.length !== 1 ? "s" : ""} found
          </p>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Step filter tabs */}
        <div className="flex gap-2 flex-wrap flex-1">
          {FILTER_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={String(tab.key)}
                onClick={() => { setStepFilter(tab.key); setPage(1); }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all",
                  stepFilter === tab.key
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-white text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Pickup date filter */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="date"
              value={pickupDate}
              onChange={(e) => { setPickupDate(e.target.value); setPage(1); }}
              className="pl-8 h-9 w-44 text-sm"
              placeholder="Pickup date"
            />
          </div>
          {pickupDate && (
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0"
              onClick={() => setPickupDate("")}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ── Order Cards ─────────────────────────────────────── */}
      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
            <ShoppingCart className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-lg font-medium">
            {t("buyerDashboard.noOrders") || "No orders found"}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            {stepFilter || pickupDate
              ? "Try changing your filters"
              : "Orders will appear here once you submit payment details for a won bid"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((bid: any) => {
            const products = Array.isArray(bid?.products) ? bid.products : [];
            const firstProduct = products[0];
            const step = Number(bid.batch_step);
            const cfg = STEP_CONFIG[step] ?? STEP_CONFIG[7];
            const StepIcon = cfg.icon;

            return (
              <Card
                key={bid.buyer_bid_id ?? `${bid.batch_id}-${bid.bid_date}`}
                className="border border-border hover:border-primary/30 transition-colors"
              >
                <CardContent className="p-0">
                  {/* Order Header */}
                  <div className="bg-muted/30 border-b border-border px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-foreground text-sm">
                        Batch #{bid.batch_id}
                      </span>
                      <Badge variant="outline" className={cn("text-xs font-medium", cfg.color)}>
                        <StepIcon className="w-3 h-3 mr-1" />
                        {cfg.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="px-5 py-2.5 border-b border-border/50 flex gap-6 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Bid Date: {formatDate(bid.bid_date)}
                    </span>
                    {bid.end_date && (
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" />
                        Pickup Date: {formatDate(bid.end_date)}
                      </span>
                    )}
                  </div>

                  {/* Product + Details */}
                  <div className="px-5 py-4 flex items-start gap-4">
                    {firstProduct?.images?.[0] ? (
                      <img src={firstProduct.images[0]} alt={firstProduct.title}
                        className="w-16 h-16 object-cover rounded border border-border flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded border border-border bg-muted flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {firstProduct?.title || "—"}
                      </p>
                      {products.length > 1 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          +{products.length - 1} more product{products.length > 2 ? "s" : ""}
                        </p>
                      )}
                      <div className="mt-1.5 flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>
                          Bid Amount:{" "}
                          <span className="font-semibold text-foreground">{bid.bid_amount ?? "—"}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline"
                        onClick={() => navigate(`/buyer-dashboard/batch/${bid.batch_id}`)}>
                        View Details
                      </Button>
                      <Button size="sm" variant="ghost"
                        onClick={() => { setChatBatchId(bid.batch_id); setChatOpen(true); }}>
                        <MessageCircle className="w-4 h-4 mr-1.5" />
                        Message
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={Math.ceil(orders.length / 10)} onPageChange={setPage} />

      {/* Chat Sidebar */}
      <ChatSidebarWrapper
        isOpen={chatOpen}
        onClose={() => { setChatOpen(false); setChatBatchId(null); }}
        batchId={chatBatchId}
        sellerId={null}
        embedded={false}
      />
    </div>
  );
};

export default MyOrders;
