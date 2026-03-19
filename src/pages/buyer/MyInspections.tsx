import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  MapPin,
  ClipboardList,
} from "lucide-react";
import { useGetBuyerInspectionsQuery } from "@/rtk/slices/buyerApiSlice";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB");
};

/* ─── Filter tabs ─────────────────────────────────────────────── */
type FilterKey = string | null;

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: null,        label: "All" },
  { key: "Attended",  label: "Completed" },
];

/* ─── Status config ───────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, {
  label: string;
  badgeCls: string;
  borderCls: string;
  icon: React.ElementType;
}> = {
  attended: {
    label: "Completed",
    badgeCls: "bg-emerald-100 text-emerald-700 border-emerald-200",
    borderCls: "border-l-emerald-500",
    icon: CheckCircle2,
  },
  scheduled: {
    label: "Scheduled",
    badgeCls: "bg-blue-100 text-blue-700 border-blue-200",
    borderCls: "border-l-blue-400",
    icon: Clock,
  },
};

const getStatusConfig = (status?: string) => {
  const key = (status ?? "").toLowerCase();
  return STATUS_CONFIG[key] ?? STATUS_CONFIG.scheduled;
};

/* ─── Pagination ──────────────────────────────────────────────── */
const Pagination = ({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="h-9 w-9 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
        <Button
          key={p}
          variant={p === page ? "default" : "outline"}
          size="sm"
          className="h-9 min-w-9"
          onClick={() => onPageChange(p)}
        >
          {p}
        </Button>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="h-9 w-9 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
const MyInspections: React.FC = () => {
  const navigate   = useNavigate();
  const { t }      = useTranslation();
  const buyerId    = Number(localStorage.getItem("userId") || 0);
  const [page, setPage]                 = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: inspectionsData, isLoading, isFetching } = useGetBuyerInspectionsQuery(
    {
      buyerId,
      page,
      limit: 10,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    { refetchOnMountOrArgChange: true }
  );

  const inspections = Array.isArray(inspectionsData?.data?.data)
    ? inspectionsData.data.data
    : [];
  const totalPages  = inspectionsData?.data?.pagination?.totalPages ?? 1;
  const total       = inspectionsData?.data?.pagination?.total ?? 0;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 container px-6 mx-auto">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-100 flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("buyerDashboard.myInspections") || "My Inspections"}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              {total} inspection{total !== 1 ? "s" : ""} registered
              {isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            </p>
          </div>
        </div>
      </div>

      {/* ── Filter Tabs ─────────────────────────────────────── */}
      <div className={cn(
        "flex gap-2 flex-wrap transition-opacity",
        isFetching && "opacity-60 pointer-events-none"
      )}>
        {FILTER_TABS.map((tab) => (
          <button
            key={String(tab.key)}
            onClick={() => { setStatusFilter(tab.key); setPage(1); }}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium border transition-all",
              String(statusFilter) === String(tab.key)
                ? "bg-accent text-accent-foreground border-accent shadow-sm"
                : "bg-white text-muted-foreground border-border hover:border-accent/50 hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Inspection Cards ─────────────────────────────────── */}
      {inspections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Eye className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <p className="text-lg font-medium text-muted-foreground">
            {t("buyerDashboard.noInspections") || "No inspections found"}
          </p>
          <p className="text-sm text-muted-foreground/60">
            {statusFilter ? "No completed inspections" : "Your scheduled inspections will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {inspections.map((inspection: any) => {
            const products     = Array.isArray(inspection?.products) ? inspection.products : [];
            const fp           = products[0];
            const img          = Array.isArray(fp?.images) ? fp.images[0] : fp?.image1;
            const cfg          = getStatusConfig(inspection.status);
            const StatusIcon   = cfg.icon;

            return (
              <Card
                key={inspection.batch_id}
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
                      <div className="flex-shrink-0 w-28 h-28 bg-gradient-to-br from-teal-50 to-muted/50 flex items-center justify-center">
                        <MapPin className="w-10 h-10 text-teal-300" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0 p-4">
                      {/* Batch + Status row */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                          Batch #{inspection.batch_id}
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

                      {/* Date info row */}
                      <div className="flex items-center gap-5 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-teal-500" />
                          Site Visit: <span className="font-medium text-foreground">{formatDate(inspection.inspection_date)}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          Registered: {formatDate(inspection.registered_date)}
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
                        onClick={() => navigate(`/buyer-dashboard/batch/${inspection.batch_id}`)}
                      >
                        {t("buyerDashboard.viewBatch") || "View Batch"}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* ── Products grid ── */}
                  {products.length > 0 && (
                    <div className="border-t border-border/50 px-5 py-4 bg-muted/10">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Items in this batch
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {products.map((product: any, idx: number) => {
                          const pImg = Array.isArray(product?.images) ? product.images[0] : undefined;
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-3 rounded-md border border-border bg-card p-2"
                            >
                              {pImg ? (
                                <img
                                  src={pImg}
                                  alt=""
                                  className="w-10 h-10 object-cover rounded border border-border flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded border border-border bg-muted flex items-center justify-center flex-shrink-0">
                                  <Package className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}
                              <p className="text-sm font-medium text-foreground truncate">
                                {product.title || "—"}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Completed banner ── */}
                  {(inspection.status ?? "").toLowerCase() === "attended" && (
                    <div className="border-t border-emerald-100 bg-emerald-50 px-5 py-2.5 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <p className="text-sm text-emerald-700">
                        Inspection completed — you attended the site visit for this batch.
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

export default MyInspections;
