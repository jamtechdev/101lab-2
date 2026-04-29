// @ts-nocheck
import { useState } from "react";
import {
  Search, X, ChevronLeft, ChevronRight, MessageSquare, Globe, EyeOff,
  Trash2, Plus, Send, Loader2, CheckCircle2, Reply, Clock, BadgeCheck,
  Tag, Mail, Phone, StickyNote, ChevronDown, ChevronUp, Users, ShieldCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { cn } from "@/lib/utils";
import {
  useGetAdminProductRequestsQuery,
  useUpdateProductRequestStatusMutation,
  useAdminPostWantedMutation,
  useTogglePublishProductRequestMutation,
  useDeleteProductRequestMutation,
} from "@/rtk/slices/adminApiSlice";
import { toastSuccess, toastError } from "@/helper/toasterNotification";

const fmt = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

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

const STATUS_STYLE: Record<string, string> = {
  new:     "bg-amber-50 text-amber-700 border-amber-200",
  read:    "bg-blue-50 text-blue-700 border-blue-200",
  replied: "bg-green-50 text-green-700 border-green-200",
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  new:     <Clock className="w-3 h-3" />,
  read:    <Reply className="w-3 h-3" />,
  replied: <CheckCircle2 className="w-3 h-3" />,
};

export default function AdminProductRequests() {
  const { sidebarCollapsed } = useAdminSidebar();

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [searchInput, setSearchInput]   = useState("");
  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(1);

  // UI state
  const [expandedId, setExpandedId]     = useState<number | null>(null);
  const [noteInputs, setNoteInputs]     = useState<Record<number, string>>({});
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postForm, setPostForm]         = useState({ category: "", search_query: "", message: "" });

  const { data, isLoading, isFetching, refetch } = useGetAdminProductRequestsQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    page,
    limit: 15,
  });

  const [updateStatus]  = useUpdateProductRequestStatusMutation();
  const [adminPostWanted, { isLoading: isPosting }] = useAdminPostWantedMutation();
  const [togglePublish] = useTogglePublishProductRequestMutation();
  const [deleteRequest] = useDeleteProductRequestMutation();

  const loading = isLoading || isFetching;

  // Client-side filter by source + search (server doesn't support these yet)
  const allRows: any[] = data?.data ?? [];
  const rows = allRows.filter((r) => {
    if (sourceFilter === "admin" && r.posted_by !== "admin") return false;
    if (sourceFilter === "user"  && r.posted_by === "admin") return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.search_query?.toLowerCase().includes(q) ||
        r.message?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSearch = () => { setSearch(searchInput.trim()); setPage(1); };
  const clearSearch  = () => { setSearchInput(""); setSearch(""); setPage(1); };

  const handleMarkStatus = async (id: number, status: string) => {
    setActionLoading(id);
    try {
      await updateStatus({ id, status, admin_notes: noteInputs[id] || undefined }).unwrap();
      toastSuccess(`Marked as ${status}`);
      refetch();
    } catch (err: any) {
      toastError(err?.data?.message || "Failed to update");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePublish = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await togglePublish(id).unwrap();
      toastSuccess(res.message);
    } catch (err: any) {
      toastError(err?.data?.message || "Failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this request permanently?")) return;
    setActionLoading(id);
    try {
      await deleteRequest(id).unwrap();
      toastSuccess("Deleted");
    } catch (err: any) {
      toastError(err?.data?.message || "Failed to delete");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePostWanted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postForm.search_query && !postForm.message) {
      toastError("Title or description is required");
      return;
    }
    try {
      await adminPostWanted({
        category:     postForm.category     || undefined,
        search_query: postForm.search_query || undefined,
        message:      postForm.message      || undefined,
      }).unwrap();
      toastSuccess("Published to public wanted board");
      setShowPostForm(false);
      setPostForm({ category: "", search_query: "", message: "" });
    } catch (err: any) {
      toastError(err?.data?.message || "Failed to post");
    }
  };

  // Counts for stat cards
  const totalNew      = allRows.filter((r) => r.status === "new").length;
  const totalPublished = allRows.filter((r) => r.is_published).length;
  const totalAdmin    = allRows.filter((r) => r.posted_by === "admin").length;

  return (
    <div className="flex h-screen bg-gray-50/50 overflow-hidden">
      <AdminSidebar activePath="/admin/product-requests" />

      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

          {/* Page title */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-primary" />
                Wanted Requests
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage buyer product requests and publish wanted posts to the public board.
              </p>
            </div>
            <Button
              onClick={() => setShowPostForm(true)}
              className="gap-2 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-4 h-4" />
              Post Wanted
            </Button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total Requests" value={data?.total ?? 0}  icon={MessageSquare} color="text-purple-600" loading={loading} />
            <StatCard label="New / Unread"   value={totalNew}           icon={Clock}         color="text-amber-600"  loading={loading} />
            <StatCard label="Live on Board"  value={totalPublished}     icon={Globe}         color="text-emerald-600" loading={loading} />
          </div>

          {/* ── Admin Post Wanted Modal ── */}
          <Dialog open={showPostForm} onOpenChange={setShowPostForm}>
            <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-gray-900 leading-tight">
                      Post Admin Wanted
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-500 mt-0.5">
                      Published immediately — visible to all visitors on the public board.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handlePostWanted} className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Title <span className="text-red-500 normal-case font-normal">*</span>
                    </label>
                    <Input
                      value={postForm.search_query}
                      onChange={(e) => setPostForm((p) => ({ ...p, search_query: e.target.value }))}
                      placeholder="e.g. CNC Machine Fanuc 0i..."
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Category</label>
                    <Input
                      value={postForm.category}
                      onChange={(e) => setPostForm((p) => ({ ...p, category: e.target.value }))}
                      placeholder="e.g. CNC Equipment..."
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Description</label>
                  <textarea
                    value={postForm.message}
                    onChange={(e) => setPostForm((p) => ({ ...p, message: e.target.value }))}
                    placeholder="Brand, model, quantity, condition, specs, budget range..."
                    rows={4}
                    className="w-full text-sm border border-input rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                  />
                </div>

                <div className="flex gap-3 pt-1 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-10"
                    onClick={() => setShowPostForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPosting}
                    className="flex-1 h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  >
                    {isPosting
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Publishing...</>
                      : <><Send className="w-3.5 h-3.5" /> Publish to Board</>
                    }
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* ── Filters ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            {/* Search row */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search name, email, category, keyword..."
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

            {/* Tab filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <TabsList className="h-9">
                  <TabsTrigger value="all"     className="text-xs px-3">All</TabsTrigger>
                  <TabsTrigger value="new"     className="text-xs px-3">New</TabsTrigger>
                  <TabsTrigger value="read"    className="text-xs px-3">Read</TabsTrigger>
                  <TabsTrigger value="replied" className="text-xs px-3">Replied</TabsTrigger>
                </TabsList>
              </Tabs>

              <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="user">User Submitted</SelectItem>
                  <SelectItem value="admin">Admin Posted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── List ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1fr_140px_110px_130px_160px] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50/60">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Request</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Visibility</span>
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
                <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-medium">No requests found</p>
                <p className="text-xs text-gray-300 mt-1">Try adjusting your filters</p>
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
                      <div className="flex flex-col md:grid md:grid-cols-[1fr_140px_110px_130px_160px] gap-3 md:gap-4 md:items-center">

                        {/* Request info */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {req.posted_by === "admin" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border bg-violet-50 text-violet-700 border-violet-200">
                                <ShieldCheck className="w-3 h-3" /> Admin Post
                              </span>
                            )}
                            <span className="text-xs text-gray-400">#{req.id}</span>
                            <span className="text-xs text-gray-400">{fmt(req.createdAt)}</span>
                            {req.user_id && req.posted_by !== "admin" && (
                              <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border bg-blue-50 text-blue-600 border-blue-200">
                                <BadgeCheck className="w-3 h-3" /> Verified buyer
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {req.search_query || (req.message ? req.message.substring(0, 70) : "—")}
                          </p>
                          {req.posted_by !== "admin" && (
                            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" /> {req.name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {req.email}
                              </span>
                              {req.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {req.phone}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Category */}
                        <div>
                          {req.category ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                              <Tag className="w-3 h-3" /> {req.category}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </div>

                        {/* Status */}
                        <div>
                          {req.posted_by === "admin" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-gray-50 text-gray-400 border-gray-200">
                              — Admin
                            </span>
                          ) : (
                            <span className={cn(
                              "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full border",
                              STATUS_STYLE[req.status] ?? STATUS_STYLE.new
                            )}>
                              {STATUS_ICON[req.status]}
                              {req.status?.toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Visibility */}
                        <div>
                          {req.is_published ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                              <Globe className="w-3 h-3" /> Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full border bg-gray-50 text-gray-400 border-gray-200">
                              <EyeOff className="w-3 h-3" /> Hidden
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 justify-end flex-wrap" onClick={(e) => e.stopPropagation()}>
                          {/* Publish toggle */}
                          <Button
                            size="sm"
                            variant="outline"
                            className={cn(
                              "h-8 text-xs gap-1 font-semibold",
                              req.is_published
                                ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                : "border-primary/30 text-primary hover:bg-primary/5"
                            )}
                            onClick={() => handleTogglePublish(req.id)}
                            disabled={actionLoading === req.id}
                          >
                            {actionLoading === req.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : req.is_published
                                ? <><EyeOff className="w-3 h-3" />Unpublish</>
                                : <><Globe className="w-3 h-3" />Publish</>
                            }
                          </Button>

                          {/* Expand toggle */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700"
                          >
                            {expandedId === req.id
                              ? <ChevronUp className="w-4 h-4" />
                              : <ChevronDown className="w-4 h-4" />
                            }
                          </Button>

                          {/* Delete */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-300 hover:text-red-500 hover:bg-red-50"
                            onClick={() => handleDelete(req.id)}
                            disabled={actionLoading === req.id}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                      </div>
                    </div>

                    {/* Expanded panel */}
                    {expandedId === req.id && (
                      <div className="mx-5 mb-4 rounded-xl border border-gray-100 bg-gray-50/70 overflow-hidden">
                        {/* Message */}
                        {req.message && (
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Message</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{req.message}</p>
                          </div>
                        )}

                        {/* Admin notes + status actions (user submissions only) */}
                        {req.posted_by !== "admin" && (
                          <div className="px-4 py-3 space-y-3">
                            {req.admin_notes && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Admin Notes</p>
                                <p className="text-xs text-gray-600 bg-white border border-gray-100 rounded-lg px-3 py-2">{req.admin_notes}</p>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-3 items-start">
                              <div className="flex-1 min-w-[180px]">
                                <textarea
                                  value={noteInputs[req.id] || ""}
                                  onChange={(e) => setNoteInputs((p) => ({ ...p, [req.id]: e.target.value }))}
                                  placeholder="Add admin note..."
                                  rows={2}
                                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                                />
                              </div>
                              <div className="flex gap-2 flex-wrap pt-0.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs gap-1"
                                  onClick={() => handleMarkStatus(req.id, req.status)}
                                  disabled={actionLoading === req.id}
                                >
                                  <StickyNote className="w-3 h-3" /> Save Note
                                </Button>
                                {req.status === "new" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                                    onClick={() => handleMarkStatus(req.id, "read")}
                                    disabled={actionLoading === req.id}
                                  >
                                    <Reply className="w-3 h-3" /> Mark Read
                                  </Button>
                                )}
                                {req.status !== "replied" && (
                                  <Button
                                    size="sm"
                                    className="h-8 text-xs gap-1 bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleMarkStatus(req.id, "replied")}
                                    disabled={actionLoading === req.id}
                                  >
                                    {actionLoading === req.id
                                      ? <Loader2 className="w-3 h-3 animate-spin" />
                                      : <><CheckCircle2 className="w-3 h-3" /> Mark Replied</>
                                    }
                                  </Button>
                                )}
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
            {!loading && (data?.totalPages ?? 1) > 1 && (
              <div className="px-5 py-4 border-t border-gray-100">
                <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
