import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  Gavel,
  Eye,
  Loader2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Truck,
  CircleCheck,
  XCircle,
  Calendar,
  Trophy,
  ShoppingCart,
  ArrowRight,
  Store,
  TrendingUp,
  Bell,
  Zap,
  MapPin,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useGetBuyerInspectionsQuery,
  useGetBuyerBidsQuery,
} from "@/rtk/slices/buyerApiSlice";
import { subscribeBuyerEvents } from "@/socket/buyerEvents";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────── */
type TabValue = "inspections" | "bids";

/* ─── Helpers ────────────────────────────────────────────────── */
const PLACEHOLDER_IMG = "/placeholder.png";

const safeArray = <T,>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

const fmt = (dateStr?: string | null) => {
  if (!dateStr) return "–";
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? "–" : d.toLocaleDateString("en-GB");
};

const getRelativeDate = (dateStr?: string | null): { label: string; urgent: boolean } => {
  if (!dateStr) return { label: "–", urgent: false };
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { label: "–", urgent: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return { label: "Today", urgent: true };
  if (diff === 1) return { label: "Tomorrow", urgent: true };
  if (diff > 1 && diff <= 7) return { label: `In ${diff} days`, urgent: diff <= 3 };
  if (diff < 0) return { label: fmt(dateStr), urgent: false };
  return { label: fmt(dateStr), urgent: false };
};

const getImagesFromAttachments = (attachments: any[] = []) =>
  attachments
    .filter((a) => a?.post_mime_type?.startsWith("image/"))
    .map((a) => a.guid);

/* ─── Pagination ─────────────────────────────────────────────── */
const Pagination = ({
  page, totalPages, onPageChange,
}: {
  page: number; totalPages: number; onPageChange: (p: number) => void;
}) => {
  if (totalPages <= 1) return null;
  const pages: (number | string)[] = [];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  pages.push(1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("…");
  if (totalPages > 1) pages.push(totalPages);

  return (
    <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border">
      <Button variant="outline" size="sm" className="h-9 w-9 p-0"
        disabled={page === 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {pages.map((p, i) => (
        <Button key={i} size="sm"
          variant={p === page ? "default" : "outline"}
          className={cn("h-9 min-w-9", p === "…" && "cursor-default pointer-events-none")}
          disabled={p === "…"}
          onClick={() => typeof p === "number" && onPageChange(p)}>
          {p}
        </Button>
      ))}
      <Button variant="outline" size="sm" className="h-9 w-9 p-0"
        disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

/* ─── Process stepper ────────────────────────────────────────── */
const ProcessStepper = ({ batchStep }: { batchStep: number }) => {
  const step = batchStep;
  const steps = [
    { label: "Bidding", stepNum: 5, icon: Gavel },
    { label: "Payment", stepNum: 6, icon: CreditCard },
    { label: "Pickup", stepNum: 7, icon: Truck },
    { label: "Done", stepNum: 8, icon: CircleCheck },
    { label: "Closed", stepNum: 9, icon: XCircle },
  ];

  return (
    <div className="flex items-center w-full max-w-md mt-3">
      {steps.map((s, i) => {
        const done = step > s.stepNum;
        const active = step === s.stepNum;
        const Icon = s.icon;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                done ? "bg-emerald-500 border-emerald-500 shadow-sm" :
                  active ? "bg-accent border-accent shadow ring-2 ring-accent/20" :
                    "bg-muted/60 border-border"
              )}>
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-white" />
                  : <Icon className={cn("w-3.5 h-3.5", active ? "text-white" : "text-muted-foreground/40")} />
                }
              </div>
              <span className={cn(
                "text-[10px] font-medium whitespace-nowrap",
                done || active ? "text-foreground" : "text-muted-foreground/50"
              )}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("h-0.5 flex-1 mx-1 mb-4", done ? "bg-emerald-400" : "bg-border")} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ─── Stat card ──────────────────────────────────────────────── */
const StatCard = ({
  value, label, icon: Icon, colorClass, onClick, suffix,
}: {
  value: number | string; label: string; icon: any; colorClass: string; onClick?: () => void; suffix?: string;
}) => (
  <Card
    onClick={onClick}
    className="group cursor-pointer border-border/50 hover:border-border transition-all duration-200 hover:shadow-sm bg-card"
  >
    <CardContent className="flex items-center gap-3 p-2.5">
      <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 bg-muted">
        <Icon className="w-3.5 h-3.5 text-foreground/70" />
      </div>
      <div className="min-w-0">
        <h3 className="text-xl font-bold text-accent leading-none tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
          {suffix && <span className="text-sm text-muted-foreground ml-0.5">{suffix}</span>}
        </h3>
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate font-mono">{label}</p>
      </div>
    </CardContent>
  </Card>
);

/* ─── Quick nav card ─────────────────────────────────────────── */
const NavCard = ({
  icon: Icon, label, sub, href, colorClass, badge,
}: {
  icon: any; label: string; sub: string; href: string; colorClass: string; badge?: number;
}) => {
  const navigate = useNavigate();
  return (
    <Card
      onClick={() => navigate(href)}
      className="group cursor-pointer border border-border hover:border-accent/40 shadow-sm hover:shadow-md transition-all duration-200"
    >
      <CardContent className="p-3 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 relative bg-muted">
          <Icon className="w-4 h-4 text-foreground/70" />
          {badge != null && badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] bg-destructive text-white text-[9px] font-bold flex items-center justify-center rounded-full ring-2 ring-background">
              {badge}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">{label}</p>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5 font-mono">{sub}</p>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-accent group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </CardContent>
    </Card>
  );
};

/* ─── Status badge ───────────────────────────────────────────── */
const StatusBadge = ({ type, status }: { type: "inspection" | "bid"; status?: string | null }) => {
  const key = (status ?? "").toLowerCase();
  if (type === "inspection") {
    if (key === "attended")
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1 font-medium"><CheckCircle2 className="w-3 h-3" />Completed</Badge>;
    return <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1 font-medium"><Clock className="w-3 h-3" />Scheduled</Badge>;
  }
  if (key === "accepted")
    return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1 font-medium"><CheckCircle2 className="w-3 h-3" />Won</Badge>;
  if (key === "rejected")
    return <Badge className="bg-red-100 text-red-700 border-red-200 gap-1 font-medium"><AlertCircle className="w-3 h-3" />Lost</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1 font-medium"><Clock className="w-3 h-3" />Pending</Badge>;
};

/* ─── Payment Status Banner ──────────────────────────────────── */
const PaymentStatusBanner = ({ batchStep }: { batchStep: number }) => {
  if (batchStep === 6) {
    const steps = [
      { label: "Won", done: true },
      { label: "Payment Submitted", done: false, active: true },
      { label: "Under Review", done: false },
      { label: "Confirmed", done: false },
    ];
    return (
      <div className="mt-2 flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
        <CreditCard className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
        <span className="text-xs font-medium text-orange-700 mr-2">Payment:</span>
        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                s.done
                  ? "bg-emerald-100 text-emerald-700"
                  : s.active
                  ? "bg-orange-200 text-orange-800 ring-1 ring-orange-400"
                  : "bg-muted text-muted-foreground/50"
              }`}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <span className="text-muted-foreground/30 text-[10px]">›</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (batchStep === 7) {
    const steps = [
      { label: "Won", done: true },
      { label: "Payment Submitted", done: true },
      { label: "Under Review", done: true },
      { label: "Confirmed ✓", done: true },
    ];
    return (
      <div className="mt-2 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
        <span className="text-xs font-medium text-emerald-700 mr-2">Payment:</span>
        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <span className="text-muted-foreground/30 text-[10px]">›</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

/* ─── Step-based action button ───────────────────────────────── */
const StepAction = ({ batchStep, batchId, navigate }: { batchStep: number; batchId: number; navigate: ReturnType<typeof useNavigate> }) => {
  const { t } = useTranslation();
  const url = `/buyer-dashboard/batch/${batchId}`;
  // Step 6 = Won, payment not yet confirmed by admin (buyer needs to pay or awaiting confirmation)
  if (batchStep === 6)
    return (
      <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white gap-1.5 shadow-sm animate-pulse-slow" onClick={() => navigate(url)}>
        <CreditCard className="w-3.5 h-3.5" /> {t("buyerDashboard.payNow")}
      </Button>
    );
  // Step 7 = Payment confirmed by admin → Pickup phase
  if (batchStep === 7)
    return (
      <Button size="sm" variant="outline" className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50" onClick={() => navigate(url)}>
        <MapPin className="w-3.5 h-3.5" /> {t("buyerDashboard.pickupInfoBtn")}
      </Button>
    );
  return null;
};

/* ─── Action Required section ───────────────────────────────── */
const ActionRequired = ({
  wonBids, inspections, navigate,
}: {
  wonBids: any[]; inspections: any[]; navigate: ReturnType<typeof useNavigate>;
}) => {
  const { t } = useTranslation();
  const paymentDue = wonBids.filter((b) => b.batch_step === 6);
  const pickupReady = wonBids.filter((b) => b.batch_step === 7);

  const upcomingInspections = inspections.filter((i) => {
    if (!i.inspection_date || (i.status ?? "").toLowerCase() === "attended") return false;
    const diff = (new Date(i.inspection_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  const total = paymentDue.length + pickupReady.length + upcomingInspections.length;
  if (total === 0) return null;

  return (
    <div className="rounded border border-amber-200 bg-amber-50/50 px-3 py-2.5">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="w-3.5 h-3.5 text-amber-600" />
        <h2 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
          {t("buyerDashboard.actionRequired")}
        </h2>
        <Badge className="bg-amber-500 text-white border-0 text-[10px] h-4 px-1.5">{total}</Badge>
      </div>

      <div className="space-y-1">
        {paymentDue.map((bid) => (
          <div
            key={bid.batch_id}
            onClick={() => navigate(`/buyer-dashboard/batch/${bid.batch_id}`)}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 cursor-pointer hover:bg-amber-100/60 transition-colors group"
          >
            <CreditCard className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            <span className="text-xs font-medium text-foreground flex-1 truncate">
              {t("buyerDashboard.paymentRequired")} — {t("buyerDashboard.batchLabel")} #{bid.batch_id}
            </span>
            <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        ))}

        {pickupReady.map((bid) => (
          <div
            key={bid.batch_id}
            onClick={() => navigate(`/buyer-dashboard/batch/${bid.batch_id}`)}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 cursor-pointer hover:bg-amber-100/60 transition-colors group"
          >
            <Truck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span className="text-xs font-medium text-foreground flex-1 truncate">
              {t("buyerDashboard.readyForPickup")} — {t("buyerDashboard.batchLabel")} #{bid.batch_id}
            </span>
            <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        ))}

        {upcomingInspections.map((insp) => {
          const { label, urgent } = getRelativeDate(insp.inspection_date);
          return (
            <div
              key={insp.batch_id}
              onClick={() => navigate(`/buyer-dashboard/batch/${insp.batch_id}`)}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 cursor-pointer hover:bg-amber-100/60 transition-colors group"
            >
              <Calendar className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
              <span className="text-xs font-medium text-foreground flex-1 truncate">
                {t("buyerDashboard.upcomingInspection", { date: label })} — {t("buyerDashboard.batchLabel")} #{insp.batch_id}
              </span>
              <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
const BuyerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const buyerId = Number(localStorage.getItem("userId") || 0);

  /* ── state ── */
  const [activeTab, setActiveTab] = useState<TabValue>("inspections");
  const [bidFilter, setBidFilter] = useState<string | null>(null);
  const [inspectionFilter, setInspectionFilter] = useState<string | null>(null);
  const [inspectionPage, setInspectionPage] = useState(1);
  const [bidPage, setBidPage] = useState(1);
  const [expandedInsp, setExpandedInsp] = useState<Set<number>>(new Set());
  const [expandedBids, setExpandedBids] = useState<Set<number>>(new Set());
  const [carouselIdx, setCarouselIdx] = useState<Record<string, number>>({});

  /* ── queries ── */
  const { data: inspectionsData, isLoading: l2, refetch: refetchInspections } =
    useGetBuyerInspectionsQuery({
      buyerId, page: inspectionPage, limit: 10,
      status: inspectionFilter === "completed" ? "Attended" : undefined,
    });

  const { data: inspTotalData } = useGetBuyerInspectionsQuery({ buyerId, page: 1, limit: 1 });
  // Accurate completed inspections count from the same API used to list them
  const { data: completedInspTotalData } = useGetBuyerInspectionsQuery({ buyerId, page: 1, limit: 1, status: "Attended" });

  const apiStatus = bidFilter === "won" ? "accepted" : undefined;
  const { data: bidsData, isLoading: l3, refetch: refetchBids } =
    useGetBuyerBidsQuery({ buyerId, page: bidPage, limit: 10, status: apiStatus });

  const { data: bidsTotalData } = useGetBuyerBidsQuery({ buyerId, page: 1, limit: 1 });

  // Fetch won bids for "Action Required" section + accurate won bids count
  const { data: wonBidsActionData } = useGetBuyerBidsQuery({ buyerId, page: 1, limit: 10, status: "accepted" });

  /* ── derived ── */
  const inspections = useMemo(() => safeArray<any>(inspectionsData?.data?.data ?? []), [inspectionsData]);
  const bids = useMemo(() => safeArray<any>(bidsData?.data?.data ?? []), [bidsData]);
  const wonBidsForAction = useMemo(() => safeArray<any>(wonBidsActionData?.data?.data ?? []), [wonBidsActionData]);
  const isLoading = l2 || l3;

  const inspCount = inspTotalData?.data?.pagination?.total ?? 0;
  const completedInspCount = completedInspTotalData?.data?.pagination?.total ?? 0;
  const bidsCount = bidsTotalData?.data?.pagination?.total ?? 0;
  const wonCount = wonBidsActionData?.data?.pagination?.total ?? 0;
  const winRate = bidsCount > 0 ? Math.round((wonCount / bidsCount) * 100) : 0;

  const filteredInspections = inspectionFilter
    ? inspections.filter((i) => (i?.status ?? "").toLowerCase() === inspectionFilter)
    : inspections;

  /* ── socket ── */
  useEffect(() => {
    const unsub = subscribeBuyerEvents(() => {
      refetchInspections();
      refetchBids();
    });
    return unsub;
  }, []);

  /* ── helpers ── */
  const toggleSet = (set: React.Dispatch<React.SetStateAction<Set<number>>>, id: number) =>
    set((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const carKey = (batchId: number, idx: number) => `${batchId}-${idx}`;

  /* ── loading ── */
  if (isLoading)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">{t("buyerDashboard.loadingDashboard")}</p>
      </div>
    );

  // Pending action counts for nav card badges
  const paymentDueCount = wonBidsForAction.filter((b) => b.batch_step === 6).length;
  const pickupReadyCount = wonBidsForAction.filter((b) => b.batch_step === 7).length;

  /* ════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6 container px-4 mx-auto pb-10">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap pt-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("buyerDashboard.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("buyerDashboard.subtitle")}</p>
        </div>
        <Button
          onClick={() => window.open("/buyer-marketplace", "_blank")}
          className="gap-2 bg-gradient-to-r from-accent to-accent-light text-white shadow-[0_0_20px_-5px_hsl(var(--accent)/0.4)] hover:shadow-[0_0_28px_-4px_hsl(var(--accent)/0.55)] transition-all duration-300 hover:scale-[1.03]"
        >
          <Store className="w-4 h-4" />
          {t("buyerDashboard.browseMarketplace")}
        </Button>
      </div>

      {/* ── Action Required ─────────────────────────────────── */}
      <ActionRequired
        wonBids={wonBidsForAction}
        inspections={inspections}
        navigate={navigate}
      />

      {/* ── Stats ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          value={inspCount}
          label={t("buyerDashboard.totalInspections")}
          icon={Eye}
          colorClass="bg-blue-500"
          onClick={() => { setActiveTab("inspections"); setInspectionFilter(null); }}
        />
        <StatCard
          value={completedInspCount}
          label={t("buyerDashboard.completedInspections")}
          icon={CheckCircle2}
          colorClass="bg-emerald-500"
          onClick={() => {
            setActiveTab("inspections");
            setInspectionFilter("attended");
            setInspectionPage(1);
          }}
        />
        <StatCard
          value={bidsCount}
          label={t("buyerDashboard.totalBids")}
          icon={Gavel}
          colorClass="bg-violet-500"
          onClick={() => { setActiveTab("bids"); setBidFilter(null); }}
        />
        <StatCard
          value={wonCount}
          label={t("buyerDashboard.wonBids")}
          icon={Trophy}
          colorClass="bg-amber-500"
          onClick={() => { setActiveTab("bids"); setBidFilter("won"); }}
        />
      </div>

      {/* ── Activity Summary Strip ──────────────────────────── */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 bg-card rounded-xl border border-border px-4 py-3 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4.5 h-4.5 text-violet-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{winRate}%</p>
            <p className="text-xs text-muted-foreground">{t("buyerDashboard.winRate")}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-card rounded-xl border border-border px-4 py-3 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Eye className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{completedInspCount}</p>
            <p className="text-xs text-muted-foreground">{t("buyerDashboard.sitesVisited")}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-card rounded-xl border border-border px-4 py-3 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{paymentDueCount > 0 ? paymentDueCount : wonCount}</p>
            <p className="text-xs text-muted-foreground">{paymentDueCount > 0 ? t("buyerDashboard.paymentsDue") : t("buyerDashboard.dealsWon")}</p>
          </div>
        </div>
      </div> */}

      {/* ── Quick access ───────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t("buyerDashboard.quickAccess")}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <NavCard href="/buyer/inspections" icon={Eye} label={t("buyerDashboard.myInspectionsNav")} sub={t("buyerDashboard.myInspectionsNavSub")} colorClass="bg-blue-500" />
          <NavCard href="/buyer/bids" icon={Gavel} label={t("buyerDashboard.myBidsNav")} sub={t("buyerDashboard.myBidsNavSub")} colorClass="bg-violet-500" />
          <NavCard href="/buyer/winning-bids" icon={Trophy} label={t("buyerDashboard.winningBidsNav")} sub={t("buyerDashboard.winningBidsNavSub")} colorClass="bg-amber-500" badge={paymentDueCount} />
          <NavCard href="/buyer/orders" icon={ShoppingCart} label={t("buyerDashboard.myOrdersNav")} sub={t("buyerDashboard.myOrdersNavSub")} colorClass="bg-emerald-500" badge={pickupReadyCount} />
        </div>
      </div>

      {/* ── Recent Activity ────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t("buyerDashboard.recentActivity")}
        </h2>

        <Card className="border shadow-sm overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v as TabValue);
            setBidFilter(null);
            setInspectionFilter(null);
          }}>
            {/* ── Tab bar ── */}
            <div className="bg-muted/30 border-b border-border">
              <TabsList className="h-auto bg-transparent p-0 px-4 gap-1">
                <TabsTrigger
                  value="inspections"
                  className={cn(
                    "rounded-none border-b-2 border-transparent px-6 py-4 text-sm font-medium gap-2 bg-transparent",
                    "data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                    "data-[state=inactive]:text-muted-foreground hover:text-foreground transition-colors"
                  )}
                >
                  <Eye className="w-4 h-4" />
                  {t("buyerDashboard.inspections")}
                  <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 border-0 font-semibold">
                    {inspCount}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="bids"
                  className={cn(
                    "rounded-none border-b-2 border-transparent px-6 py-4 text-sm font-medium gap-2 bg-transparent",
                    "data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                    "data-[state=inactive]:text-muted-foreground hover:text-foreground transition-colors"
                  )}
                >
                  <Gavel className="w-4 h-4" />
                  {t("buyerDashboard.bids")}
                  <Badge variant="secondary" className="ml-1 bg-violet-100 text-violet-700 border-0 font-semibold">
                    {bidsCount}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ════════════════════════════════════════════════
                INSPECTIONS TAB
            ════════════════════════════════════════════════ */}
            <TabsContent value="inspections" className="mt-0">
              {/* Sub-filter pills */}
              <div className="flex gap-2 px-6 py-3 border-b border-border/50 bg-background">
                {[
                  { key: null, label: t("buyerDashboard.allFilter") },
                  { key: "attended", label: t("buyerDashboard.completedFilter") },
                ].map((f) => (
                  <button
                    key={String(f.key)}
                    onClick={() => { setInspectionFilter(f.key); setInspectionPage(1); }}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                      inspectionFilter === f.key
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {filteredInspections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Eye className="w-8 h-8 opacity-30" />
                  </div>
                  <p className="text-base">{t("buyerDashboard.noInspections")}</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {filteredInspections.map((insp: any) => {
                    const products = safeArray<any>(insp?.products ?? []);
                    const fp = products[0];
                    const isExp = expandedInsp.has(insp.batch_id);
                    const { label: relDate, urgent } = getRelativeDate(insp.inspection_date);
                    const isAttended = (insp.status ?? "").toLowerCase() === "attended";

                    return (
                      <div key={insp.batch_id} className="hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-4 px-6 py-4">
                          {/* Batch block */}
                          <div className="flex-shrink-0 text-center w-14">
                            <p className="text-[10px] text-muted-foreground font-medium font-mono">{t("buyerDashboard.batchLabel")}</p>
                            <p className="text-sm font-bold text-foreground font-mono">#{insp.batch_id}</p>
                          </div>

                          <div className="w-px h-12 bg-border flex-shrink-0" />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="text-base font-semibold text-foreground truncate">
                                {fp?.title ?? "—"}
                              </p>
                              <StatusBadge type="inspection" status={insp.status} />
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className={cn("flex items-center gap-1.5", urgent && !isAttended && "text-violet-600 font-medium")}>
                                <Calendar className="w-3.5 h-3.5" />
                                {isAttended ? `${t("buyerDashboard.visitedLabel")}: ${fmt(insp.inspection_date)}` : `${t("buyerDashboard.siteVisitLabel")}: ${relDate}`}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {t("buyerDashboard.registeredLabel")}: {fmt(insp.registered_date)}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {products.length > 0 && (
                              <button
                                onClick={() => toggleSet(setExpandedInsp, insp.batch_id)}
                                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
                              >
                                {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                {products.length} {products.length !== 1 ? t("buyerDashboard.items") : t("buyerDashboard.item")}
                              </button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/buyer-dashboard/batch/${insp.batch_id}`)}
                            >
                              {t("buyerDashboard.viewBatch")}
                            </Button>
                          </div>
                        </div>

                        {/* Expanded products */}
                        {isExp && products.length > 0 && (
                          <div className="px-6 pb-4 bg-muted/10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {products.map((prod: any, pIdx: number) => {
                                const key = carKey(insp.batch_id, pIdx);
                                const idx = carouselIdx[key] ?? 0;
                                const imgs = safeArray<string>(
                                  prod?.attachments?.length
                                    ? getImagesFromAttachments(prod.attachments)
                                    : prod?.images
                                );
                                return (
                                  <div key={pIdx} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                                    <div className="relative flex-shrink-0">
                                      {imgs.length > 0 ? (
                                        <>
                                          <img src={imgs[idx]} alt="" className="w-14 h-14 object-cover rounded-lg border border-border" />
                                          {imgs.length > 1 && (
                                            <div className="absolute inset-0 flex items-center justify-between px-0.5">
                                              <button onClick={(e) => { e.stopPropagation(); setCarouselIdx((p) => ({ ...p, [key]: (idx - 1 + imgs.length) % imgs.length })); }}
                                                className="bg-black/50 rounded-full p-0.5"><ChevronLeft className="w-2.5 h-2.5 text-white" /></button>
                                              <button onClick={(e) => { e.stopPropagation(); setCarouselIdx((p) => ({ ...p, [key]: (idx + 1) % imgs.length })); }}
                                                className="bg-black/50 rounded-full p-0.5"><ChevronRight className="w-2.5 h-2.5 text-white" /></button>
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <div className="w-14 h-14 rounded-lg border border-border bg-muted flex items-center justify-center">
                                          <Package className="w-6 h-6 text-muted-foreground opacity-30" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">{prod.title ?? "—"}</p>
                                      <p className="text-xs text-muted-foreground truncate mt-0.5" dangerouslySetInnerHTML={{ __html: prod.category ?? "" }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="px-6 pb-4">
                <Pagination
                  page={inspectionPage}
                  totalPages={inspectionsData?.data?.pagination?.totalPages ?? 1}
                  onPageChange={setInspectionPage}
                />
              </div>
            </TabsContent>

            {/* ════════════════════════════════════════════════
                BIDS TAB
            ════════════════════════════════════════════════ */}
            <TabsContent value="bids" className="mt-0">
              {/* Sub-filter pills */}
              <div className="flex gap-2 px-6 py-3 border-b border-border/50 bg-background">
                {[
                  { key: null, label: t("buyerDashboard.allFilter") },
                  { key: "won", label: t("buyerDashboard.wonOnly") },
                ].map((f) => (
                  <button
                    key={String(f.key)}
                    onClick={() => { setBidFilter(f.key); setBidPage(1); }}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                      bidFilter === f.key
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {bids.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Gavel className="w-8 h-8 opacity-30" />
                  </div>
                  <p className="text-base">{t("buyerDashboard.noBids")}</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {bids.map((bid: any) => {
                    const products = safeArray<any>(bid?.products ?? []);
                    const fp = products[0];
                    const isExp = expandedBids.has(bid.batch_id);
                    const isWon = (bid.status ?? "").toLowerCase() === "accepted";

                    return (
                      <div key={bid.batch_id} className={cn(
                        "hover:bg-muted/20 transition-colors",
                        isWon && bid.batch_step === 6 && "bg-red-50/40 hover:bg-red-50/60"
                      )}>
                        {/* Row */}
                        <div className="flex items-start gap-4 px-6 py-4">
                          {/* Batch block */}
                          <div className="flex-shrink-0 text-center w-14 pt-0.5">
                            <p className="text-[10px] text-muted-foreground font-medium font-mono">{t("buyerDashboard.batchLabel")}</p>
                            <p className="text-sm font-bold text-foreground font-mono">#{bid.batch_id}</p>
                          </div>

                          <div className="w-px bg-border flex-shrink-0 self-stretch" />

                          {/* Info + stepper */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="text-base font-semibold text-foreground truncate">
                                {fp?.title ?? "—"}
                              </p>
                              <StatusBadge type="bid" status={bid.status} />
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <Gavel className="w-3.5 h-3.5" />
                                {t("buyerDashboard.bidLabel")}: {bid.bid_amount ?? "–"}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {fmt(bid.bid_date)}
                              </span>
                            </div>

                            {bid.status !== "rejected" && (
                              <ProcessStepper batchStep={bid.batch_step ?? 0} />
                            )}

                            {/* Payment status tracker for won bids */}
                            {isWon && (bid.batch_step === 6 || bid.batch_step === 7) && (
                              <PaymentStatusBanner batchStep={bid.batch_step} />
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                            {/* Step-aware action button */}
                            {isWon && (
                              <StepAction
                                batchStep={bid.batch_step ?? 0}
                                batchId={bid.batch_id}
                                navigate={navigate}
                              />
                            )}

                            {products.length > 0 && (
                              <button
                                onClick={() => toggleSet(setExpandedBids, bid.batch_id)}
                                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
                              >
                                {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                {products.length} {products.length !== 1 ? t("buyerDashboard.items") : t("buyerDashboard.item")}
                              </button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/buyer-dashboard/batch/${bid.batch_id}`)}
                            >
                              {t("buyerDashboard.viewBatch")}
                            </Button>
                          </div>
                        </div>

                        {/* Expanded products */}
                        {isExp && products.length > 0 && (
                          <div className="px-6 pb-4 bg-muted/10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {products.map((prod: any, pIdx: number) => {
                                const img = safeArray<string>(prod?.images ?? [])[0] ?? PLACEHOLDER_IMG;
                                return (
                                  <div key={pIdx} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                                    <img src={img} alt="" className="w-14 h-14 object-cover rounded-lg border border-border flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">{prod.title ?? "—"}</p>
                                      <p className="text-xs text-muted-foreground truncate mt-0.5" dangerouslySetInnerHTML={{ __html: prod.category ?? "" }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="px-6 pb-4">
                <Pagination
                  page={bidPage}
                  totalPages={bidsData?.data?.pagination?.totalPages ?? 1}
                  onPageChange={setBidPage}
                />
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default BuyerDashboard;
