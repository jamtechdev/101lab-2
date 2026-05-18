// @ts-nocheck
import { useState } from "react";
import {
  Search, X, ChevronLeft, ChevronRight, Loader2,
  CheckCircle2, XCircle, Clock, Building2,
  Phone, MapPin, Briefcase, FileText, UserCheck,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AdminHeader from "./AdminHeader";
import { cn } from "@/lib/utils";
import {
  useGetSellerUpgradeRequestsQuery,
  useApproveSellerUpgradeRequestMutation,
  useRejectSellerUpgradeRequestMutation,
} from "@/rtk/slices/apiSlice";
import { toastSuccess, toastError } from "@/helper/toasterNotification";

const fmt = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const STATUS_STYLE: Record<string, string> = {
  pending:  "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  pending:  <Clock className="w-3 h-3" />,
  approved: <CheckCircle2 className="w-3 h-3" />,
  rejected: <XCircle className="w-3 h-3" />,
};

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
          : <p className="text-2xl font-bold text-gray-900">{value}</p>
        }
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }: {
  page: number; totalPages: number; onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm text-gray-600">{page} / {totalPages}</span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

const LIMIT = 15;

export default function AdminSellerUpgradeRequests() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput]   = useState("");
  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(1);
  const [noteInputs, setNoteInputs]     = useState<Record<number, string>>({});
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [expandedId, setExpandedId]     = useState<number | null>(null);

  const { data, isLoading, isFetching, refetch } = useGetSellerUpgradeRequestsQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: search || undefined,
    page,
    limit: LIMIT,
  });

  const [approve] = useApproveSellerUpgradeRequestMutation();
  const [reject]  = useRejectSellerUpgradeRequestMutation();

  const loading  = isLoading || isFetching;
  const rows     = data?.data        ?? [];
  const total    = data?.total       ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleSearch = () => { setSearch(searchInput.trim()); setPage(1); };
  const clearSearch  = () => { setSearchInput(""); setSearch(""); setPage(1); };

  const handleStatusChange = (val: string) => { setStatusFilter(val); setPage(1); };

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await approve({ id, admin_notes: noteInputs[id] || "" }).unwrap();
      toastSuccess("Request approved! User is now a seller.");
      refetch();
    } catch (err: any) {
      toastError(err?.data?.message || "Failed to approve");
    } finally { setActionLoading(null); }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await reject({ id, admin_notes: noteInputs[id] || "" }).unwrap();
      toastSuccess("Request rejected.");
      refetch();
    } catch (err: any) {
      toastError(err?.data?.message || "Failed to reject");
    } finally { setActionLoading(null); }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AdminSidebar />

      <div className="lg:pl-[280px]">
        <AdminHeader />

        <main className="p-4 md:p-6 space-y-5">

          {/* Page title */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-primary" />
              Seller Upgrade Requests
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Review buyers applying to become sellers — approve or reject their applications.
            </p>
          </div>

          {/* Stat Cards — always show total from current filter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total (this filter)" value={total}  icon={UserCheck}     color="text-primary"    loading={loading} />
            <StatCard label="Pending"  value={data?.pendingCount  ?? 0} icon={Clock}        color="text-amber-600"  loading={loading} />
            <StatCard label="Approved" value={data?.approvedCount ?? 0} icon={CheckCircle2} color="text-green-600"  loading={loading} />
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search name, email, company, country..."
                  className="pl-9 pr-8"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                {searchInput && (
                  <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button onClick={handleSearch} className="shrink-0">Search</Button>
            </div>

            <Tabs value={statusFilter} onValueChange={handleStatusChange}>
              <TabsList className="h-9">
                <TabsTrigger value="all"      className="text-xs px-3">All</TabsTrigger>
                <TabsTrigger value="pending"  className="text-xs px-3">Pending</TabsTrigger>
                <TabsTrigger value="approved" className="text-xs px-3">Approved</TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs px-3">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Column header */}
            <div className="hidden md:grid grid-cols-[1fr_160px_120px_130px_120px] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50/60">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Applicant</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Business Type</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Actions</span>
            </div>

            {/* Loading skeletons */}
            {loading && (
              <div className="divide-y divide-gray-50">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="px-5 py-4 flex gap-4 animate-pulse">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                    </div>
                    <div className="h-6 w-20 bg-gray-100 rounded-full" />
                    <div className="h-8 w-24 bg-gray-100 rounded-lg" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && rows.length === 0 && (
              <div className="text-center py-20">
                <UserCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-medium">No requests found</p>
                <p className="text-xs text-gray-300 mt-1">Try adjusting your filters or search</p>
              </div>
            )}

            {/* Rows */}
            {!loading && rows.length > 0 && (
              <div className="divide-y divide-gray-50">
                {rows.map((req: any) => (
                  <div key={req.id}>
                    {/* Main row */}
                    <div
                      className="px-5 py-4 hover:bg-gray-50/60 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                    >
                      <div className="flex flex-col md:grid md:grid-cols-[1fr_160px_120px_130px_120px] gap-3 md:gap-4 md:items-center">

                        {/* Applicant */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">#{req.id}</span>
                            <span className="text-xs text-gray-400">{fmt(req.createdAt)}</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {req.requester?.display_name || req.requester?.user_nicename || `User #${req.user_id}`}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{req.requester?.user_email}</p>
                        </div>

                        {/* Company */}
                        <div>
                          {req.company_name ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 truncate max-w-[150px]">
                              <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              {req.company_name}
                            </span>
                          ) : <span className="text-xs text-gray-300">—</span>}
                        </div>

                        {/* Business Type */}
                        <div>
                          {req.business_type ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                              <Briefcase className="w-3 h-3" />
                              {req.business_type}
                            </span>
                          ) : <span className="text-xs text-gray-300">—</span>}
                        </div>

                        {/* Status */}
                        <div>
                          <span className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full border",
                            STATUS_STYLE[req.status] ?? STATUS_STYLE.pending
                          )}>
                            {STATUS_ICON[req.status]}
                            {req.status?.charAt(0).toUpperCase() + req.status?.slice(1)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
                          {req.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                className="h-8 text-xs gap-1 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleApprove(req.id)}
                                disabled={actionLoading === req.id}
                              >
                                {actionLoading === req.id
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <><CheckCircle2 className="w-3 h-3" />Approve</>}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-1 border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => handleReject(req.id)}
                                disabled={actionLoading === req.id}
                              >
                                {actionLoading === req.id
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <><XCircle className="w-3 h-3" />Reject</>}
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700">
                            {expandedId === req.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded panel */}
                    {expandedId === req.id && (
                      <div className="mx-5 mb-4 rounded-xl border border-gray-100 bg-gray-50/70 overflow-hidden">
                        {/* Detail fields */}
                        {(req.phone || req.country || req.company_tax_id) && (
                          <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-gray-100">
                            {req.phone && (
                              <div className="flex items-start gap-2">
                                <Phone className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Phone</p>
                                  <p className="text-xs font-medium text-gray-800">{req.phone}</p>
                                </div>
                              </div>
                            )}
                            {req.country && (
                              <div className="flex items-start gap-2">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Country</p>
                                  <p className="text-xs font-medium text-gray-800">{req.country}</p>
                                </div>
                              </div>
                            )}
                            {req.company_tax_id && (
                              <div className="flex items-start gap-2">
                                <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Tax ID</p>
                                  <p className="text-xs font-medium text-gray-800">{req.company_tax_id}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Reason */}
                        {req.reason && (
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Reason</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{req.reason}</p>
                          </div>
                        )}

                        {/* Admin notes (resolved) */}
                        {req.admin_notes && req.status !== "pending" && (
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Admin Notes</p>
                            <p className="text-xs text-gray-600 bg-white border border-gray-100 rounded-lg px-3 py-2">{req.admin_notes}</p>
                          </div>
                        )}

                        {/* Note + action for pending */}
                        {req.status === "pending" && (
                          <div className="px-4 py-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Admin Note (optional)</p>
                            <div className="flex flex-wrap gap-3 items-start">
                              <div className="flex-1 min-w-[180px]">
                                <textarea
                                  value={noteInputs[req.id] || ""}
                                  onChange={(e) => setNoteInputs((p) => ({ ...p, [req.id]: e.target.value }))}
                                  placeholder="Add a note for the applicant..."
                                  rows={2}
                                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                                />
                              </div>
                              <div className="flex gap-2 pt-0.5">
                                <Button
                                  size="sm"
                                  className="h-8 text-xs gap-1 bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleApprove(req.id)}
                                  disabled={actionLoading === req.id}
                                >
                                  {actionLoading === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle2 className="w-3 h-3" />Approve with note</>}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs gap-1 border-red-200 text-red-600 hover:bg-red-50"
                                  onClick={() => handleReject(req.id)}
                                  disabled={actionLoading === req.id}
                                >
                                  {actionLoading === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><XCircle className="w-3 h-3" />Reject with note</>}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-100">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
