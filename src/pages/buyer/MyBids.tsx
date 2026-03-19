      import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Gavel,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Truck,
  CircleCheck,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { useGetBuyerBidsQuery } from "@/rtk/slices/buyerApiSlice";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "–";
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? "–" : d.toLocaleDateString("en-GB");
};

/* ─── Filter tabs ────────────────────────────────────────────── */
const FILTER_TABS = [
  { key: null,       label: "All Bids" },
  { key: "pending",  label: "Pending" },
  { key: "accepted", label: "Won" },
  { key: "rejected", label: "Lost" },
] as const;

/* ─── Status config ──────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; badgeCls: string; borderCls: string; icon: any }> = {
  accepted: {
    label: "Won",
    badgeCls: "bg-emerald-100 text-emerald-700 border-emerald-200",
    borderCls: "border-l-emerald-500",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Lost",
    badgeCls: "bg-red-100 text-red-700 border-red-200",
    borderCls: "border-l-red-400",
    icon: AlertCircle,
  },
  pending: {
    label: "Pending",
    badgeCls: "bg-amber-100 text-amber-700 border-amber-200",
    borderCls: "border-l-amber-400",
    icon: Clock,
  },
};

/* ─── Process stepper ────────────────────────────────────────── */
const ProcessStepper = ({ batchStep }: { batchStep: number }) => {
  const step = batchStep >= 8 && batchStep < 9 ? 9 : batchStep;

  const steps = [
    { label: "Bidding",   stepNum: 5, icon: Gavel,       color: "violet" },
    { label: "Payment",   stepNum: 6, icon: CreditCard,  color: "blue" },
    { label: "Pickup",    stepNum: 7, icon: Truck,       color: "orange" },
    { label: "Completed", stepNum: 8, icon: CircleCheck, color: "emerald" },
    { label: "Closed",    stepNum: 9, icon: XCircle,     color: "gray" },
  ];

  const colorMap: Record<string, { active: string; done: string; text: string }> = {
    violet:  { active: "bg-violet-500 border-violet-500 shadow-violet-200",  done: "bg-emerald-500 border-emerald-500", text: "text-violet-600" },
    blue:    { active: "bg-blue-500 border-blue-500 shadow-blue-200",        done: "bg-emerald-500 border-emerald-500", text: "text-blue-600" },
    orange:  { active: "bg-orange-500 border-orange-500 shadow-orange-200",  done: "bg-emerald-500 border-emerald-500", text: "text-orange-600" },
    emerald: { active: "bg-emerald-500 border-emerald-500 shadow-emerald-200", done: "bg-emerald-500 border-emerald-500", text: "text-emerald-600" },
    gray:    { active: "bg-slate-500 border-slate-500 shadow-slate-200",     done: "bg-emerald-500 border-emerald-500", text: "text-slate-600" },
  };

  return (
    <div className="flex items-start w-full mt-4 px-2">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const done   = step > s.stepNum;
        const active = step === s.stepNum;
        const cfg    = colorMap[s.color];
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-2 flex-shrink-0 min-w-[60px]">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                done   ? `${cfg.done} shadow-md` :
                active ? `${cfg.active} shadow-md ring-4 ring-offset-1 ring-opacity-30` :
                         "bg-white border-gray-200"
              )}>
                {done
                  ? <CheckCircle2 className="w-5 h-5 text-white" />
                  : <Icon className={cn("w-5 h-5", active ? "text-white" : "text-gray-300")} />
                }
              </div>
              <span className={cn(
                "text-xs font-semibold text-center leading-tight",
                done   ? "text-emerald-600" :
                active ? cfg.text :
                         "text-gray-300"
              )}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 flex items-center pb-6 px-1">
                <div className={cn(
                  "h-0.5 w-full rounded-full transition-all duration-300",
                  done ? "bg-emerald-400" : "bg-gray-200"
                )} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ─── Pagination ─────────────────────────────────────────────── */
const Pagination = ({ page, totalPages, onPageChange }: {
  page: number; totalPages: number; onPageChange: (p: number) => void;
}) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button variant="outline" size="sm" className="h-9 w-9 p-0"
        disabled={page === 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
        <Button key={p} variant={p === page ? "default" : "outline"} size="sm"
          className="h-9 min-w-9" onClick={() => onPageChange(p)}>{p}</Button>
      ))}
      <Button variant="outline" size="sm" className="h-9 w-9 p-0"
        disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
const MyBids: React.FC<{ batchBasePath?: string }> = ({ batchBasePath = "/buyer-dashboard" }) => {
  const navigate = useNavigate();
  const { t }    = useTranslation();
  const buyerId  = Number(localStorage.getItem("userId") || 0);
  const [page, setPage]                 = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: bidsData, isLoading, isFetching } = useGetBuyerBidsQuery({
    buyerId, page, limit: 10,
    status: statusFilter ?? undefined,
  });

  const bids       = Array.isArray(bidsData?.data?.data) ? bidsData.data.data : [];
  const totalPages = bidsData?.data?.pagination?.totalPages ?? 1;
  const total      = bidsData?.data?.pagination?.total ?? 0;

  if (isLoading)
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6 container px-6 mx-auto">

      {/* ── Page Header ───────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center">
            <Gavel className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("buyerDashboard.myBids") || "My Bids"}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              {total} bids placed in total
              {isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            </p>
          </div>
        </div>
      </div>

      {/* ── Filter Tabs ───────────────────────────────────── */}
      <div className={cn("flex gap-2 flex-wrap transition-opacity", isFetching && "opacity-60 pointer-events-none")}>
        {FILTER_TABS.map((tab) => (
          <button
            key={String(tab.key)}
            onClick={() => { setStatusFilter(tab.key); setPage(1); }}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium border transition-all",
              statusFilter === tab.key
                ? "bg-accent text-accent-foreground border-accent shadow-sm"
                : "bg-white text-muted-foreground border-border hover:border-accent/50 hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Bid Cards ─────────────────────────────────────── */}
      {bids.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Gavel className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <p className="text-lg font-medium text-muted-foreground">
            {t("buyerDashboard.noBids") || "No bids found"}
          </p>
          <p className="text-sm text-muted-foreground/60">
            {statusFilter ? `No ${statusFilter} bids` : "Your bids will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid: any) => {
            const products = Array.isArray(bid?.products) ? bid.products : [];
            const fp       = products[0];
            const img      = Array.isArray(fp?.images) ? fp.images[0] : fp?.image1;
            const cfg      = STATUS_CONFIG[(bid.status ?? "pending").toLowerCase()] ?? STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;

            return (
              <Card
                key={bid.buyer_bid_id ?? bid.batch_id}
                className={cn(
                  "border-l-4 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden",
                  cfg.borderCls
                )}
              >
                <CardContent className="p-0">

                  {/* ── Card Top: Image + Info + Button ── */}
                  <div className="flex items-start gap-0">

                    {/* Product image */}
                    {img ? (
                      <div className="flex-shrink-0 w-28 h-28 bg-muted overflow-hidden">
                        <img
                          src={img}
                          alt={fp?.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-28 h-28 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                        <Package className="w-10 h-10 text-muted-foreground/20" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0 p-4">
                      {/* Batch + Status row */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                          Batch #{bid.batch_id}
                        </span>
                        <Badge className={cn("gap-1 font-semibold text-xs", cfg.badgeCls)}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </Badge>
                      </div>

                      {/* Product title */}
                      <p className="text-base font-bold text-foreground truncate mb-2">
                        {fp?.title || "—"}
                      </p>

                      {/* Bid info row */}
                      <div className="flex items-center gap-5 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <Gavel className="w-4 h-4 text-violet-500" />
                          Bid: <span className="font-bold">{bid.bid_amount ?? "–"}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {formatDate(bid.bid_date)}
                        </span>
                        {products.length > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Package className="w-4 h-4" />
                            {products.length} item{products.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* View button */}
                    <div className="flex-shrink-0 p-4 self-start">
                      <Button
                        variant="outline"
                        className="gap-2 whitespace-nowrap"
                        onClick={() => navigate(`${batchBasePath}/batch/${bid.batch_id}`)}
                      >
                        {t("buyerDashboard.viewBatch") || "View details"}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* ── Process Stepper ── */}
                  {bid.status !== "rejected" && (
                    <div className="border-t border-border/50 px-6 pb-5 bg-muted/10">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-4 mb-1">
                        Progress
                      </p>
                      <ProcessStepper batchStep={bid.batch_step ?? 0} />
                    </div>
                  )}

                  {/* Lost banner */}
                  {bid.status === "rejected" && (
                    <div className="border-t border-red-100 bg-red-50 px-6 py-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-600">
                        This bid was not accepted. Browse the marketplace to find new listings.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default MyBids;
