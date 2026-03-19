import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  History,
  Package,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  PartyPopper,
  Gavel,
  Search,
  X,
  Truck,
} from "lucide-react";
import { useGetBuyerBidsQuery } from "@/rtk/slices/buyerApiSlice";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";


const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB");
};

/* ─── Status config ──────────────────────────────────────────── */
const STATUS_CONFIG: Record<number, { labelKey: string; color: string; dotColor: string; icon: any }> = {
  8: {
    labelKey: "buyerDashboard.completed",
    color: "bg-green-100 text-green-800 border-green-200",
    dotColor: "bg-green-500",
    icon: CheckCircle,
  },
  9: {
    labelKey: "buyerDashboard.dealDone",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    dotColor: "bg-purple-500",
    icon: PartyPopper,
  },
};

/* ─── Pagination ─────────────────────────────────────────────── */
const Pagination = ({ page, totalPages, onPageChange }: {
  page: number; totalPages: number; onPageChange: (p: number) => void;
}) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button variant="outline" size="sm" disabled={page === 1}
        onClick={() => onPageChange(page - 1)} className="h-9 w-9 p-0">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
        <Button key={p} variant={p === page ? "default" : "outline"}
          size="sm" className="h-9 min-w-9" onClick={() => onPageChange(p)}>{p}</Button>
      ))}
      <Button variant="outline" size="sm" disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)} className="h-9 w-9 p-0">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
const OrderHistory: React.FC = () => {
  const { t } = useTranslation();
  const navigate  = useNavigate();
  const buyerId   = Number(localStorage.getItem("userId") || 0);

  const FILTER_TABS = [
    { key: null, label: t("buyerDashboard.allHistory")  || "All History" },
    { key: 8,    label: t("buyerDashboard.completed")   || "Completed"   },
    // { key: 9,    label: t("buyerDashboard.dealDone")    || "Deal Done"   },
  ] as const;

  const [stepFilter, setStepFilter] = useState<number | null>(null);
  const [search, setSearch]         = useState("");
  const [dateFrom, setDateFrom]     = useState("");
  const [dateTo, setDateTo]         = useState("");
  const [page, setPage]             = useState(1);
  const PAGE_SIZE = 10;

  const { data: bidsData, isLoading } = useGetBuyerBidsQuery({
    buyerId,
    page: 1,
    limit: 200,
    status: "accepted",
  });

  const allWonBids = Array.isArray(bidsData?.data?.data) ? bidsData.data.data : [];

  // Base: only completed/done history (step 8 or 9)
  let history = allWonBids.filter((bid: any) => Number(bid.batch_step) >= 8);

  // Step filter
  if (stepFilter !== null)
    history = history.filter((bid: any) => Number(bid.batch_step) === stepFilter);

  // Search by product title or batch id
  if (search.trim()) {
    const q = search.toLowerCase();
    history = history.filter((bid: any) => {
      const title = bid.products?.[0]?.title?.toLowerCase() ?? "";
      return title.includes(q) || String(bid.batch_id).includes(q);
    });
  }

  // Date range filter (by bid_date)
  if (dateFrom)
    history = history.filter((bid: any) => bid.bid_date && bid.bid_date >= dateFrom);
  if (dateTo)
    history = history.filter((bid: any) => bid.bid_date && bid.bid_date <= dateTo + "T23:59:59");

  // Client-side pagination
  const totalPages   = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const safePage     = Math.min(page, totalPages);
  const paginatedRows = history.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const clearFilters = () => {
    setStepFilter(null);
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasFilters = stepFilter !== null || search || dateFrom || dateTo;

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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center">
            <History className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("buyerDashboard.orderHistory") || "Order History"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {history.length} {history.length !== 1
                ? t("buyerDashboard.pastOrdersPlural") || "past orders"
                : t("buyerDashboard.pastOrder") || "past order"}
            </p>
          </div>
        </div>
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
            <X className="w-3.5 h-3.5" />
            {t("buyerDashboard.clearFilters") || "Clear filters"}
          </Button>
        )}
      </div>

      {/* ── Filters ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">

        {/* Row 1: tabs + search */}
        <div className="flex gap-2 flex-wrap items-center">
          {FILTER_TABS.map((tab) => (
            <button
              key={String(tab.key)}
              onClick={() => { setStepFilter(tab.key); setPage(1); }}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium border transition-all",
                stepFilter === tab.key
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-white text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}

          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t("buyerDashboard.searchOrderPlaceholder") || "Search by product or batch…"}
              className="pl-8 h-9 text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: date range */}
        <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs font-medium">{t("buyerDashboard.dateRange") || "Date range"}:</span>
          <Input type="date" value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="h-8 w-36 text-xs" />
          <span className="text-xs">{t("common.to") || "to"}</span>
          <Input type="date" value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="h-8 w-36 text-xs" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Cards ───────────────────────────────────────────── */}
      {paginatedRows.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
            <History className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground text-lg font-medium">
            {t("buyerDashboard.noOrderHistory") || "No order history found"}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            {hasFilters
              ? t("buyerDashboard.tryAdjustingFilters") || "Try adjusting your filters"
              : t("buyerDashboard.noOrderHistoryDesc") || "Completed orders will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedRows.map((bid: any) => {
            const products    = Array.isArray(bid?.products) ? bid.products : [];
            const firstProduct = products[0];
            const step        = Number(bid.batch_step);
            const cfg         = STATUS_CONFIG[step] ?? STATUS_CONFIG[8];
            const StatusIcon  = cfg.icon;

            return (
              <Card
                key={bid.buyer_bid_id ?? `${bid.batch_id}-${bid.bid_date}`}
                className="border border-border hover:shadow-md transition-all duration-200"
              >
                <CardContent className="p-0">
                  {/* Top bar */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">
                        Batch #{bid.batch_id}
                      </span>
                      <Badge variant="outline" className={cn("text-xs font-semibold gap-1", cfg.color)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full inline-block", cfg.dotColor)} />
                        <StatusIcon className="w-3 h-3" />
                        {t(cfg.labelKey)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {t("buyerDashboard.bidDate") || "Bid"}: {formatDate(bid.bid_date)}
                      </span>
                      {bid.end_date && (
                        <span className="flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {t("buyerDashboard.pickupDate") || "Pickup"}: {formatDate(bid.end_date)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-5 py-4 flex items-center gap-4">
                    {firstProduct?.images?.[0] ? (
                      <img
                        src={firstProduct.images[0]}
                        alt={firstProduct.title}
                        className="w-14 h-14 object-cover rounded border border-border flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded border border-border bg-muted flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {firstProduct?.title || "—"}
                      </p>
                      {products.length > 1 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          +{products.length - 1} more item{products.length > 2 ? "s" : ""}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-1.5 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Gavel className="w-3.5 h-3.5" />
                          {t("buyerDashboard.bidAmount") || "Amount"}:{" "}
                          <span className="font-semibold text-foreground ml-0.5">
                            {bid.bid_amount ?? "—"}
                          </span>
                        </span>
                        {products.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {products.length} product{products.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0"
                      onClick={() => navigate(`/buyer-dashboard/batch/${bid.batch_id}`)}
                    >
                      {t("buyerDashboard.viewDetails") || "View Details"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default OrderHistory;
