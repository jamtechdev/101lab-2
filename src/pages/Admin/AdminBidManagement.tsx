import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, ChevronLeft, ChevronRight, X, ChevronDown, ChevronUp,
  ArrowUpRight, Gavel, Clock, CheckCircle2, XCircle, BarChart3,
  User, Store, Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { cn } from "@/lib/utils";
import { SITE_TYPE } from "@/config/site";
import { useGetAdminAllBidsQuery, AdminBidRow, AdminBidStats } from "@/rtk/slices/adminApiSlice";
import AdminHeader from "./AdminHeader";

const BID_STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "counter_offer", label: "Counter Offer" },
];

const STATUS_STYLE: Record<string, { badge: string; dot: string }> = {
  pending:       { badge: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-400" },
  accepted:      { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  rejected:      { badge: "bg-red-50 text-red-700 border-red-200",         dot: "bg-red-500" },
  counter_offer: { badge: "bg-blue-50 text-blue-700 border-blue-200",      dot: "bg-blue-500" },
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", accepted: "Accepted", rejected: "Rejected", counter_offer: "Counter Offer",
};

/* ── Stat Card ─────────────────────────────────────────── */
function StatCard({
  label, value, icon: Icon, accent, loading,
}: { label: string; value: number; icon: React.ElementType; accent: string; loading?: boolean }) {
  return (
    <div className={cn("bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4 overflow-hidden relative", accent)}>
      <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0", `${accent.split(" ")[0]}/10`)}>
        <Icon className={cn("h-6 w-6", accent.split(" ")[1])} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        {loading ? (
          <div className="h-7 w-16 bg-gray-100 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 leading-tight">{value.toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}

/* ── Detail Info Row ──────────────────────────────────── */
function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-400 shrink-0 w-24">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}

/* ── Bid Table Row ────────────────────────────────────── */
function BidRow({ row, navigate }: { row: AdminBidRow; navigate: (path: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const style = STATUS_STYLE[row.bid_status] ?? { badge: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };

  return (
    <>
      {/* Main row */}
      <tr
        className={cn(
          "border-b border-gray-100 transition-colors cursor-pointer select-none",
          expanded ? "bg-primary/5" : "hover:bg-gray-50/80"
        )}
        onClick={() => setExpanded((p) => !p)}
      >
        {/* Bid # */}
        <td className="px-5 py-4">
          <span className="text-xs font-mono font-semibold text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
            #{row.buyer_bid_id}
          </span>
        </td>

        {/* Batch */}
        <td className="px-5 py-4">
          <span className="text-sm font-semibold text-gray-900">#{row.batch_id}</span>
          {row.product_title && (
            <p className="text-xs text-gray-400 mt-0.5 max-w-[180px] truncate">{row.product_title}</p>
          )}
        </td>

        {/* Buyer */}
        <td className="px-5 py-4">
          <p className="text-sm font-semibold text-gray-800">{row.company_name || row.buyer.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{row.buyer.email}</p>
        </td>

        {/* Seller */}
        <td className="px-5 py-4">
          <p className="text-sm font-semibold text-gray-800">{row.seller.company || row.seller.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{row.seller.email}</p>
        </td>

        {/* Amount */}
        <td className="px-5 py-4">
          <span className="text-sm font-bold text-emerald-700">
            {row.currency} {parseFloat(row.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </td>

        {/* Status */}
        <td className="px-5 py-4">
          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", style.badge)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
            {STATUS_LABEL[row.bid_status] ?? row.bid_status}
          </span>
        </td>

        {/* Platform */}
        <td className="px-5 py-4">
          <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-1 font-medium">{row.platform}</span>
        </td>

        {/* Date */}
        <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">{fmt(row.submitted_at)}</td>

        {/* Expand toggle */}
        <td className="px-5 py-4">
          <span className={cn("h-7 w-7 rounded-full flex items-center justify-center transition-colors", expanded ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400")}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </td>
      </tr>

      {/* Expanded detail panel */}
      {expanded && (
        <tr>
          <td colSpan={9} className="px-5 pb-5 pt-1 bg-primary/5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Buyer card */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border-b border-blue-100">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-800">Buyer</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/admin/buyers/${row.buyer.id}`); }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg px-2.5 py-1 transition-colors"
                  >
                    View Profile <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="p-4 space-y-2">
                  <InfoRow label="Name" value={row.buyer.name} />
                  <InfoRow label="Email" value={row.buyer.email} />
                  <InfoRow label="Phone" value={row.buyer.phone} />
                  <InfoRow label="Company" value={row.company_name} />
                  <InfoRow label="Contact" value={row.contact_person} />
                  <InfoRow label="Country" value={row.country} />
                </div>
              </div>

              {/* Seller card */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-purple-50 border-b border-purple-100">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-800">Seller</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/admin/sellers/${row.seller.id}`); }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-white border border-purple-200 hover:bg-purple-50 rounded-lg px-2.5 py-1 transition-colors"
                  >
                    View Profile <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="p-4 space-y-2">
                  <InfoRow label="Name" value={row.seller.name} />
                  <InfoRow label="Email" value={row.seller.email} />
                  <InfoRow label="Phone" value={row.seller.phone} />
                  <InfoRow label="Company" value={row.seller.company} />
                </div>
              </div>

              {/* Batch / Bid card */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-emerald-700" />
                    <span className="text-sm font-semibold text-emerald-800">Batch & Bid</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/admin/listings/${row.batch_id}`); }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-lg px-2.5 py-1 transition-colors"
                  >
                    View Batch <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="p-4 space-y-2">
                  <InfoRow label="Batch ID" value={String(row.batch_id)} />
                  <InfoRow label="Bid ID" value={String(row.bid_id)} />
                  <InfoRow label="Type" value={row.bid_type} />
                  <InfoRow label="Target" value={row.target_price ? `${row.currency} ${parseFloat(row.target_price).toLocaleString()}` : null} />
                  <InfoRow label="Round" value={row.bidding_status} />
                  <InfoRow label="Start" value={fmt(row.bid_start_date)} />
                  <InfoRow label="End" value={fmt(row.bid_end_date)} />
                  <InfoRow label="Auction" value={row.is_auction ? "Yes" : "No"} />
                </div>
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Page ─────────────────────────────────────────────── */
export default function AdminBidManagement() {
  const navigate = useNavigate();
  const { sidebarCollapsed } = useAdminSidebar();

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [bidStatus, setBidStatus] = useState("all");
  const [platform, setPlatform] = useState<string>(SITE_TYPE);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => { setPage(1); }, [debouncedSearch, bidStatus, platform, sort]);

  const { data, isLoading, isFetching, isError } = useGetAdminAllBidsQuery({
    page, limit: 20,
    search: debouncedSearch || undefined,
    status: bidStatus !== "all" ? bidStatus : undefined,
    type: platform,
    sort,
  });

  const stats: AdminBidStats = data?.stats ?? { total: 0, pending: 0, accepted: 0, rejected: 0 };
  const rows: AdminBidRow[] = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.total_pages ?? 1;

  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (debouncedSearch) chips.push({ key: "search", label: `"${debouncedSearch}"`, clear: () => setSearchQuery("") });
    if (bidStatus !== "all") chips.push({ key: "status", label: STATUS_LABEL[bidStatus] ?? bidStatus, clear: () => setBidStatus("all") });
    if (sort !== "newest") chips.push({ key: "sort", label: "Oldest first", clear: () => setSort("newest") });
    return chips;
  }, [debouncedSearch, bidStatus, sort]);

  const clearAll = () => { setSearchQuery(""); setBidStatus("all"); setSort("newest"); };

  return (
    <div className="flex min-h-screen bg-gray-50/60">
      <AdminSidebar activePath="/admin/bids" />
      <main className={cn("flex-1 transition-all duration-300", sidebarCollapsed ? "lg:ml-16" : "lg:ml-64")}>
                <AdminHeader />
        <div className="p-6 max-w-[1600px] mx-auto space-y-5">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Gavel className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Bid Management</h1>
              <p className="text-xs text-gray-400">All buyer bids across all platforms</p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Bids"  value={stats.total}    icon={BarChart3}    accent="border-gray-200 text-gray-600"   loading={isLoading} />
            <StatCard label="Pending"     value={stats.pending}  icon={Clock}        accent="border-amber-200 text-amber-600"  loading={isLoading} />
            <StatCard label="Accepted"    value={stats.accepted} icon={CheckCircle2} accent="border-emerald-200 text-emerald-600" loading={isLoading} />
            <StatCard label="Rejected"    value={stats.rejected} icon={XCircle}      accent="border-red-200 text-red-500"     loading={isLoading} />
          </div>

          {/* Platform tabs */}
          <div className="rounded-2xl border-2 border-primary/20 bg-white px-5 py-4 shadow-sm">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Platform</p>
            <Tabs value={platform} onValueChange={(v) => { setPlatform(v); setPage(1); }}>
              <TabsList className="h-10 bg-gray-100 border border-gray-200 gap-0.5">
                {[
                  { value: "greenbidz",   label: "GreenBidz" },
                  { value: "recycle",     label: "Recycle" },
                  { value: "LabGreenbidz",label: "Lab-GreenBidz" },
                  { value: "machines",    label: "Machines" },
                ].map((p) => (
                  <TabsTrigger
                    key={p.value}
                    value={p.value}
                    className="px-5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
                  >
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Search + Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  className="pl-9 h-10 rounded-xl border-gray-200 focus:border-primary"
                  placeholder="Search batch ID, buyer, seller, company…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Select value={bidStatus} onValueChange={setBidStatus}>
                  <SelectTrigger className="h-10 w-40 rounded-xl border-gray-200">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {BID_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sort} onValueChange={(v) => setSort(v as "newest" | "oldest")}>
                  <SelectTrigger className="h-10 w-36 rounded-xl border-gray-200">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">Active filters:</span>
                {activeFilters.map((f) => (
                  <span key={f.key} className="inline-flex items-center gap-1 text-xs font-medium bg-primary/8 text-primary border border-primary/20 rounded-full px-3 py-1">
                    {f.label}
                    <button onClick={f.clear} className="hover:text-red-500 transition-colors ml-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <button onClick={clearAll} className="text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2">
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {isError && (
              <div className="py-16 text-center text-red-500 text-sm">Failed to load bids. Please try again.</div>
            )}

            {!isError && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["Bid #", "Batch", "Buyer", "Seller", "Amount", "Status", "Platform", "Date", ""].map((h, i) => (
                        <th key={i} className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading || isFetching ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          {Array.from({ length: 9 }).map((_, j) => (
                            <td key={j} className="px-5 py-4">
                              <div className="h-4 bg-gray-100 rounded-full animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-2 text-gray-400">
                            <Gavel className="h-8 w-8 opacity-30" />
                            <p className="text-sm font-medium">No bids found</p>
                            <p className="text-xs">Try adjusting your filters</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <BidRow key={row.buyer_bid_id} row={row} navigate={navigate} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
                <span className="text-sm text-gray-500">
                  Page <span className="font-semibold text-gray-700">{page}</span> of <span className="font-semibold text-gray-700">{totalPages}</span>
                  <span className="text-gray-400 ml-2">· {pagination?.total.toLocaleString()} bids total</span>
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium text-gray-700 px-2">{page}</span>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" disabled={page >= totalPages || isFetching} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
