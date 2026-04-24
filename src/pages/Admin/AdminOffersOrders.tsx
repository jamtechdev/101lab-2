import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, ChevronLeft, ChevronRight, X, ChevronDown, ChevronUp,
  ArrowUpRight, Tag, ShoppingBag, Clock, CheckCircle2, XCircle,
  BarChart3, User, Store, Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { cn } from "@/lib/utils";
import { SITE_TYPE } from "@/config/site";
import {
  useGetAdminAllOffersQuery, useGetAdminAllBidsQuery,
  AdminOfferRow, AdminBidRow,
} from "@/rtk/slices/adminApiSlice";
import AdminHeader from "./AdminHeader";

/* ── Constants ─────────────────────────────────────────── */
const OFFER_STATUSES = [
  { value: "all",      label: "All Statuses" },
  { value: "pending",  label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_BADGE: Record<string, string> = {
  pending:  "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  counter_offer: "bg-blue-50 text-blue-700 border-blue-200",
};
const STATUS_DOT: Record<string, string> = {
  pending: "bg-amber-400", accepted: "bg-emerald-500",
  rejected: "bg-red-500", counter_offer: "bg-blue-500",
};

const PLATFORMS = [
  { value: "recycle",      label: "Recycle" },
  { value: "greenbidz",    label: "GreenBidz" },
  { value: "LabGreenbidz", label: "Lab-GreenBidz" },
  { value: "machines",     label: "Machines" },
];

/* ── Helpers ───────────────────────────────────────────── */
const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function StatusBadge({ label, badge, dot }: { label: string; badge: string; dot: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", badge)}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dot)} />
      {label}
    </span>
  );
}

/* ── Stat Card ─────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color, loading }: {
  label: string; value: number; icon: React.ElementType; color: string; loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", color + "/10")}>
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        {loading
          ? <div className="h-7 w-14 bg-gray-100 rounded animate-pulse mt-1" />
          : <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        }
      </div>
    </div>
  );
}

/* ── Info Row ──────────────────────────────────────────── */
function InfoRow({ label, value }: { label: string; value?: string | null | number }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-400 shrink-0 w-28">{label}</span>
      <span className="text-gray-800 font-medium">{String(value)}</span>
    </div>
  );
}

/* ── Detail Card ───────────────────────────────────────── */
function DetailCard({ title, color, icon: Icon, onView, children }: {
  title: string; color: string; icon: React.ElementType;
  onView?: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={cn("flex items-center justify-between px-4 py-3 border-b", color)}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="text-sm font-semibold">{title}</span>
        </div>
        {onView && (
          <button onClick={onView} className="inline-flex items-center gap-1 text-xs font-semibold bg-white border rounded-lg px-2.5 py-1 transition-colors hover:bg-gray-50">
            View <ArrowUpRight className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="p-4 space-y-2">{children}</div>
    </div>
  );
}

/* ── Offer Row ─────────────────────────────────────────── */
function OfferRow({ row, navigate }: { row: AdminOfferRow; navigate: (p: string) => void }) {
  const [open, setOpen] = useState(false);
  const badge = STATUS_BADGE[row.status] ?? "bg-gray-100 text-gray-600 border-gray-200";
  const dot   = STATUS_DOT[row.status]   ?? "bg-gray-400";
  return (
    <>
      <tr
        className={cn("border-b border-gray-100 cursor-pointer transition-colors", open ? "bg-primary/5" : "hover:bg-gray-50/80")}
        onClick={() => setOpen(p => !p)}
      >
        <td className="px-5 py-4"><span className="text-xs font-mono font-semibold text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">#{row.offer_id}</span></td>
        <td className="px-5 py-4">
          <span className="text-sm font-semibold text-gray-900">#{row.batch_id}</span>
          {row.product_title && <p className="text-xs text-gray-400 mt-0.5 max-w-[170px] truncate">{row.product_title}</p>}
        </td>
        <td className="px-5 py-4">
          <p className="text-sm font-semibold text-gray-800">{row.buyer.company || row.buyer.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{row.buyer.email}</p>
        </td>
        <td className="px-5 py-4">
          <p className="text-sm font-semibold text-gray-800">{row.seller.company || row.seller.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{row.seller.email}</p>
        </td>
        <td className="px-5 py-4">
          <span className="text-sm font-bold text-emerald-700">
            {parseFloat(row.offer_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <p className="text-xs text-gray-400 mt-0.5">Qty: {row.offer_quantity}</p>
        </td>
        <td className="px-5 py-4"><StatusBadge label={row.status.charAt(0).toUpperCase() + row.status.slice(1)} badge={badge} dot={dot} /></td>
        <td className="px-5 py-4"><span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-1 font-medium">{row.platform}</span></td>
        <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">{fmt(row.submitted_at)}</td>
        <td className="px-5 py-4">
          <span className={cn("h-7 w-7 rounded-full flex items-center justify-center transition-colors", open ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400")}>
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={9} className="px-5 pb-5 pt-1 bg-primary/5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DetailCard title="Buyer" color="bg-blue-50 text-blue-800 border-blue-100" icon={User}
                onView={() => navigate(`/admin/buyers/${row.buyer.id}`)}>
                <InfoRow label="Name"    value={row.buyer.name} />
                <InfoRow label="Email"   value={row.buyer.email} />
                <InfoRow label="Phone"   value={row.buyer.phone} />
                <InfoRow label="Company" value={row.buyer.company} />
              </DetailCard>
              <DetailCard title="Seller" color="bg-purple-50 text-purple-800 border-purple-100" icon={Store}
                onView={() => navigate(`/admin/sellers/${row.seller.id}`)}>
                <InfoRow label="Name"    value={row.seller.name} />
                <InfoRow label="Email"   value={row.seller.email} />
                <InfoRow label="Phone"   value={row.seller.phone} />
                <InfoRow label="Company" value={row.seller.company} />
              </DetailCard>
              <DetailCard title="Offer Details" color="bg-emerald-50 text-emerald-800 border-emerald-100" icon={Package}
                onView={() => navigate(`/admin/listings/${row.batch_id}`)}>
                <InfoRow label="Batch ID"    value={row.batch_id} />
                <InfoRow label="Offer Price" value={parseFloat(row.offer_price).toLocaleString(undefined, { minimumFractionDigits: 2 })} />
                <InfoRow label="Quantity"    value={row.offer_quantity} />
                <InfoRow label="Round"       value={row.offer_round} />
                <InfoRow label="Message"     value={row.message} />
                <InfoRow label="Submitted"   value={fmt(row.submitted_at)} />
              </DetailCard>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Buy Now Row (bid with isAuction=false) ────────────── */
function BuyNowRow({ row, navigate }: { row: AdminBidRow; navigate: (p: string) => void }) {
  const [open, setOpen] = useState(false);
  const statusKey = row.bid_status;
  const badge = STATUS_BADGE[statusKey] ?? "bg-gray-100 text-gray-600 border-gray-200";
  const dot   = STATUS_DOT[statusKey]   ?? "bg-gray-400";
  const amountNum = row.amount ? Number(row.amount) : null;
  const targetNum = row.target_price ? Number(row.target_price) : null;
  return (
    <>
      <tr
        className={cn("border-b border-gray-100 cursor-pointer transition-colors", open ? "bg-primary/5" : "hover:bg-gray-50/80")}
        onClick={() => setOpen(p => !p)}
      >
        <td className="px-5 py-4"><span className="text-xs font-mono font-semibold text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">#{row.buyer_bid_id}</span></td>
        <td className="px-5 py-4">
          <span className="text-sm font-semibold text-gray-900">#{row.batch_id}</span>
          {row.product_title && <p className="text-xs text-gray-400 mt-0.5 max-w-[170px] truncate">{row.product_title}</p>}
        </td>
        <td className="px-5 py-4">
          <p className="text-sm font-semibold text-gray-800">{row.buyer.name || row.company_name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{row.buyer.email}</p>
        </td>
        <td className="px-5 py-4">
          <p className="text-sm font-semibold text-gray-800">{row.seller?.company || row.seller?.name || "—"}</p>
          <p className="text-xs text-gray-400 mt-0.5">{row.seller?.email}</p>
        </td>
        <td className="px-5 py-4">
          {amountNum !== null
            ? <span className="text-sm font-bold text-emerald-700">{row.currency} {amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            : targetNum !== null
            ? <span className="text-sm font-bold text-emerald-700">{row.currency} {targetNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            : <span className="text-sm text-gray-400">—</span>
          }
          {targetNum !== null && amountNum !== targetNum && (
            <p className="text-xs text-gray-400 mt-0.5">Listed: {targetNum.toLocaleString()}</p>
          )}
        </td>
        <td className="px-5 py-4"><StatusBadge label={statusKey.charAt(0).toUpperCase() + statusKey.slice(1).replace(/_/g, " ")} badge={badge} dot={dot} /></td>
        <td className="px-5 py-4"><span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-1 font-medium">{row.platform}</span></td>
        <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">{fmt(row.submitted_at)}</td>
        <td className="px-5 py-4">
          <span className={cn("h-7 w-7 rounded-full flex items-center justify-center transition-colors", open ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400")}>
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={9} className="px-5 pb-5 pt-1 bg-primary/5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DetailCard title="Buyer" color="bg-blue-50 text-blue-800 border-blue-100" icon={User}
                onView={() => navigate(`/admin/buyers/${row.buyer.id}`)}>
                <InfoRow label="Name"    value={row.buyer.name} />
                <InfoRow label="Company" value={row.company_name} />
                <InfoRow label="Contact" value={row.contact_person} />
                <InfoRow label="Email"   value={row.buyer.email} />
                <InfoRow label="Phone"   value={row.buyer.phone} />
                <InfoRow label="Country" value={row.country} />
              </DetailCard>
              <DetailCard title="Seller" color="bg-purple-50 text-purple-800 border-purple-100" icon={Store}
                onView={() => navigate(`/admin/sellers/${row.seller?.id}`)}>
                <InfoRow label="Name"    value={row.seller?.name} />
                <InfoRow label="Email"   value={row.seller?.email} />
                <InfoRow label="Phone"   value={row.seller?.phone} />
                <InfoRow label="Company" value={row.seller?.company} />
              </DetailCard>
              <DetailCard title="Order Details" color="bg-emerald-50 text-emerald-800 border-emerald-100" icon={Package}
                onView={() => navigate(`/admin/listings/${row.batch_id}`)}>
                <InfoRow label="Batch ID"     value={row.batch_id} />
                <InfoRow label="Bid ID"       value={row.bid_id} />
                <InfoRow label="Bid Amount"   value={amountNum ? `${row.currency} ${amountNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"} />
                <InfoRow label="Listed Price" value={targetNum ? `${row.currency} ${targetNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"} />
                <InfoRow label="Notes"        value={row.notes} />
                <InfoRow label="Submitted"    value={fmt(row.submitted_at)} />
              </DetailCard>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Filter bar ────────────────────────────────────────── */
function FilterBar({
  search, onSearch, statusOptions, status, onStatus,
  sort, onSort, activeFilters, clearAll,
}: {
  search: string; onSearch: (v: string) => void;
  statusOptions: { value: string; label: string }[];
  status: string; onStatus: (v: string) => void;
  sort: string; onSort: (v: string) => void;
  activeFilters: { key: string; label: string; clear: () => void }[];
  clearAll: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input className="pl-9 h-10 rounded-xl border-gray-200" placeholder="Search batch ID, order ID, buyer…" value={search} onChange={e => onSearch(e.target.value)} />
          {search && (
            <button onClick={() => onSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Select value={status} onValueChange={onStatus}>
            <SelectTrigger className="h-10 w-40 rounded-xl border-gray-200"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>{statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sort} onValueChange={onSort}>
            <SelectTrigger className="h-10 w-36 rounded-xl border-gray-200"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Active:</span>
          {activeFilters.map(f => (
            <span key={f.key} className="inline-flex items-center gap-1 text-xs font-medium bg-primary/8 text-primary border border-primary/20 rounded-full px-3 py-1">
              {f.label}
              <button onClick={f.clear} className="hover:text-red-500 ml-0.5"><X className="h-3 w-3" /></button>
            </span>
          ))}
          <button onClick={clearAll} className="text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2">Clear all</button>
        </div>
      )}
    </div>
  );
}

/* ── Pagination ────────────────────────────────────────── */
function Pagination({ page, total, totalPages, isFetching, onChange }: {
  page: number; total: number; totalPages: number; isFetching: boolean; onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
      <span className="text-sm text-gray-500">
        Page <b className="text-gray-700">{page}</b> of <b className="text-gray-700">{totalPages}</b>
        <span className="text-gray-400 ml-2">· {total.toLocaleString()} total</span>
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" disabled={page <= 1 || isFetching} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-gray-700 px-2">{page}</span>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" disabled={page >= totalPages || isFetching} onClick={() => onChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ── Skeleton ──────────────────────────────────────────── */
function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-gray-50">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded-full animate-pulse" /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ── Page ─────────────────────────────────────────────── */
export default function AdminOffersOrders() {
  const navigate = useNavigate();
  const { sidebarCollapsed } = useAdminSidebar();

  const [section, setSection] = useState<"offers" | "buynow">("offers");
  const [platform, setPlatform] = useState<string>(SITE_TYPE);

  // Offers state
  const [oPage, setOPage] = useState(1);
  const [oSearch, setOSearch] = useState(""); const [oSearchD, setOSearchD] = useState("");
  const [oStatus, setOStatus] = useState("all");
  const [oSort, setOSort] = useState("newest");

  // Buy Now state
  const [bPage, setBPage] = useState(1);
  const [bSearch, setBSearch] = useState(""); const [bSearchD, setBSearchD] = useState("");
  const [bStatus, setBStatus] = useState("all");
  const [bSort, setBSort] = useState("newest");

  // Debounce
  useEffect(() => { const t = setTimeout(() => setOSearchD(oSearch.trim()), 500); return () => clearTimeout(t); }, [oSearch]);
  useEffect(() => { const t = setTimeout(() => setBSearchD(bSearch.trim()), 500); return () => clearTimeout(t); }, [bSearch]);

  // Reset page on filter change
  useEffect(() => { setOPage(1); }, [oSearchD, oStatus, oSort, platform]);
  useEffect(() => { setBPage(1); }, [bSearchD, bStatus, bSort, platform]);

  const offersQ = useGetAdminAllOffersQuery({
    page: oPage, limit: 20, type: platform,
    search: oSearchD || undefined,
    status: oStatus !== "all" ? oStatus : undefined,
    sort: oSort,
  });

  // Buy Now = bids where Bidding.isAuction = false (fixed-price / buy-now bid)
  const buyNowQ = useGetAdminAllBidsQuery({
    page: bPage, limit: 20, type: platform,
    search: bSearchD || undefined,
    status: bStatus !== "all" ? bStatus : undefined,
    sort: bSort,
    isAuction: false,
  });

  const offerStats  = offersQ.data?.stats  ?? { total: 0, pending: 0, accepted: 0, rejected: 0 };
  const buyNowStats = buyNowQ.data?.stats   ?? { total: 0, pending: 0, accepted: 0, rejected: 0 };

  const oFilters = useMemo(() => {
    const c: { key: string; label: string; clear: () => void }[] = [];
    if (oSearchD) c.push({ key: "s",  label: `"${oSearchD}"`,  clear: () => setOSearch("") });
    if (oStatus !== "all") c.push({ key: "st", label: oStatus, clear: () => setOStatus("all") });
    if (oSort !== "newest") c.push({ key: "so", label: "Oldest first", clear: () => setOSort("newest") });
    return c;
  }, [oSearchD, oStatus, oSort]);

  const bFilters = useMemo(() => {
    const c: { key: string; label: string; clear: () => void }[] = [];
    if (bSearchD) c.push({ key: "s",  label: `"${bSearchD}"`,  clear: () => setBSearch("") });
    if (bStatus !== "all") c.push({ key: "st", label: bStatus, clear: () => setBStatus("all") });
    if (bSort !== "newest") c.push({ key: "so", label: "Oldest first", clear: () => setBSort("newest") });
    return c;
  }, [bSearchD, bStatus, bSort]);

  return (
    <div className="flex min-h-screen bg-gray-50/60">
      <AdminSidebar activePath="/admin/offers" />
      <main className={cn("flex-1 transition-all duration-300", sidebarCollapsed ? "lg:ml-16" : "lg:ml-64")}>
        <AdminHeader />
        <div className="p-6 max-w-[1700px] mx-auto space-y-5">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Offers & Orders</h1>
              <p className="text-xs text-gray-400">Manage all offers and buy-now orders across platforms</p>
            </div>
          </div>

          {/* Section tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setSection("offers")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all",
                section === "offers"
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-primary/40"
              )}
            >
              <Tag className="h-4 w-4" /> Make Offer
            </button>
            <button
              onClick={() => setSection("buynow")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all",
                section === "buynow"
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-primary/40"
              )}
            >
              <ShoppingBag className="h-4 w-4" /> Buy Now
            </button>
          </div>

          {/* Stat Cards */}
          {section === "offers" ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Offers" value={offerStats.total}    icon={BarChart3}    color="text-gray-600"    loading={offersQ.isLoading} />
              <StatCard label="Pending"       value={offerStats.pending}  icon={Clock}        color="text-amber-600"   loading={offersQ.isLoading} />
              <StatCard label="Accepted"      value={offerStats.accepted} icon={CheckCircle2} color="text-emerald-600" loading={offersQ.isLoading} />
              <StatCard label="Rejected"      value={offerStats.rejected} icon={XCircle}      color="text-red-500"     loading={offersQ.isLoading} />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Orders" value={buyNowStats.total}    icon={BarChart3}    color="text-gray-600"    loading={buyNowQ.isLoading} />
              <StatCard label="Pending"       value={buyNowStats.pending}  icon={Clock}        color="text-amber-600"   loading={buyNowQ.isLoading} />
              <StatCard label="Accepted"      value={buyNowStats.accepted} icon={CheckCircle2} color="text-emerald-600" loading={buyNowQ.isLoading} />
              <StatCard label="Rejected"      value={buyNowStats.rejected} icon={XCircle}      color="text-red-500"     loading={buyNowQ.isLoading} />
            </div>
          )}

          {/* Platform Tabs */}
          <div className="rounded-2xl border-2 border-primary/20 bg-white px-5 py-4 shadow-sm">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Platform</p>
            <Tabs value={platform} onValueChange={v => setPlatform(v)}>
              <TabsList className="h-10 bg-gray-100 border border-gray-200 gap-0.5">
                {PLATFORMS.map(p => (
                  <TabsTrigger key={p.value} value={p.value}
                    className="px-5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md">
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Offers section */}
          {section === "offers" && (
            <>
              <FilterBar
                search={oSearch} onSearch={setOSearch}
                statusOptions={OFFER_STATUSES} status={oStatus} onStatus={setOStatus}
                sort={oSort} onSort={setOSort}
                activeFilters={oFilters} clearAll={() => { setOSearch(""); setOStatus("all"); setOSort("newest"); }}
              />
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {offersQ.isError && <div className="py-16 text-center text-sm text-red-500">Failed to load offers.</div>}
                {!offersQ.isError && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {["Offer #", "Batch", "Buyer", "Seller", "Price / Qty", "Status", "Platform", "Date", ""].map((h, i) => (
                            <th key={i} className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {offersQ.isLoading || offersQ.isFetching
                          ? <TableSkeleton cols={9} />
                          : (offersQ.data?.data ?? []).length === 0
                          ? <tr><td colSpan={9} className="py-20 text-center"><div className="flex flex-col items-center gap-2 text-gray-400"><Tag className="h-8 w-8 opacity-30" /><p className="text-sm font-medium">No offers found</p></div></td></tr>
                          : (offersQ.data?.data ?? []).map(r => <OfferRow key={r.offer_id} row={r} navigate={navigate} />)
                        }
                      </tbody>
                    </table>
                  </div>
                )}
                <Pagination page={oPage} total={offersQ.data?.pagination?.total ?? 0} totalPages={offersQ.data?.pagination?.total_pages ?? 1} isFetching={offersQ.isFetching} onChange={setOPage} />
              </div>
            </>
          )}

          {/* Buy Now section */}
          {section === "buynow" && (
            <>
              <FilterBar
                search={bSearch} onSearch={setBSearch}
                statusOptions={OFFER_STATUSES} status={bStatus} onStatus={setBStatus}
                sort={bSort} onSort={setBSort}
                activeFilters={bFilters} clearAll={() => { setBSearch(""); setBStatus("all"); setBSort("newest"); }}
              />
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {buyNowQ.isError && <div className="py-16 text-center text-sm text-red-500">Failed to load buy-now orders.</div>}
                {!buyNowQ.isError && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {["Order #", "Batch", "Buyer", "Seller", "Amount", "Status", "Platform", "Date", ""].map((h, i) => (
                            <th key={i} className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {buyNowQ.isLoading || buyNowQ.isFetching
                          ? <TableSkeleton cols={9} />
                          : (buyNowQ.data?.data ?? []).length === 0
                          ? <tr><td colSpan={9} className="py-20 text-center"><div className="flex flex-col items-center gap-2 text-gray-400"><ShoppingBag className="h-8 w-8 opacity-30" /><p className="text-sm font-medium">No buy-now orders found</p></div></td></tr>
                          : (buyNowQ.data?.data ?? []).map(r => <BuyNowRow key={r.buyer_bid_id} row={r} navigate={navigate} />)
                        }
                      </tbody>
                    </table>
                  </div>
                )}
                <Pagination page={bPage} total={buyNowQ.data?.pagination?.total ?? 0} totalPages={buyNowQ.data?.pagination?.total_pages ?? 1} isFetching={buyNowQ.isFetching} onChange={setBPage} />
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
