// @ts-nocheck
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import {
  useGetAdminProductRequestsQuery,
  useUpdateProductRequestStatusMutation,
} from "@/rtk/slices/adminApiSlice";
import { toastSuccess, toastError } from "@/helper/toasterNotification";
import { Loader2, Mail, Tag, Search, MessageSquare, Clock, CheckCircle2, Reply } from "lucide-react";

const statusColor = (status: string) => {
  if (status === "read") return "bg-blue-100 text-blue-700 border-blue-200";
  if (status === "replied") return "bg-green-100 text-green-700 border-green-200";
  return "bg-amber-100 text-amber-700 border-amber-200";
};

const statusIcon = (status: string) => {
  if (status === "replied") return <CheckCircle2 className="w-3 h-3" />;
  if (status === "read") return <Reply className="w-3 h-3" />;
  return <Clock className="w-3 h-3" />;
};

export default function AdminProductRequests() {
  const { isOpen } = useAdminSidebar();
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const { data, isLoading, refetch } = useGetAdminProductRequestsQuery({
    status: statusFilter || undefined,
  });
  const [updateStatus] = useUpdateProductRequestStatusMutation();

  const requests = data?.data || [];

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

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar activePath="/admin/product-requests" />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? "ml-64" : "ml-16"}`}>
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                Product Requests
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Buyers & visitors who couldn't find what they needed.
              </p>
            </div>

            {/* Summary counts */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "All", value: "", count: data?.total },
                { label: "New", value: "new", count: requests.filter((r) => r.status === "new").length },
                { label: "Replied", value: "replied", count: requests.filter((r) => r.status === "replied").length },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(s.value)}
                  className={`px-3 py-2 rounded text-xs font-semibold border transition-colors text-left ${
                    statusFilter === s.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  {s.label}
                  {s.count !== undefined && (
                    <span className="ml-1.5 opacity-70">({s.count})</span>
                  )}
                </button>
              ))}
            </div>

            {/* List */}
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">No requests found.</div>
            ) : (
              <div className="space-y-3">
                {requests.map((req: any) => (
                  <div key={req.id} className="border border-border rounded-lg bg-card">
                    {/* Main row */}
                    <div
                      className="flex items-start justify-between gap-4 flex-wrap p-4 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${statusColor(req.status)}`}>
                            {statusIcon(req.status)}
                            {req.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-muted-foreground">#{req.id}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                          {req.user_id && (
                            <span className="text-[11px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded">
                              Logged-in user
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
                          <span className="font-semibold text-foreground">{req.name}</span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="w-3 h-3" />{req.email}
                          </span>
                          {req.phone && (
                            <span className="text-muted-foreground">📞 {req.phone}</span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {req.category && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" /> {req.category}
                            </span>
                          )}
                          {req.search_query && (
                            <span className="flex items-center gap-1">
                              <Search className="w-3 h-3" /> Searched: "{req.search_query}"
                            </span>
                          )}
                        </div>

                        {req.message && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {req.message}
                          </p>
                        )}
                      </div>

                      {/* Quick action */}
                      <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {req.status === "new" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8"
                            onClick={() => handleMarkStatus(req.id, "read")}
                            disabled={actionLoading === req.id}
                          >
                            Mark Read
                          </Button>
                        )}
                        {req.status !== "replied" && (
                          <Button
                            size="sm"
                            className="text-xs h-8 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleMarkStatus(req.id, "replied")}
                            disabled={actionLoading === req.id}
                          >
                            {actionLoading === req.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : "Mark Replied"}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded — admin notes */}
                    {expandedId === req.id && (
                      <div className="border-t border-border px-4 pb-4 pt-3 space-y-2 bg-muted/20">
                        {req.admin_notes && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Admin Notes:</span> {req.admin_notes}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <textarea
                            value={noteInputs[req.id] || ""}
                            onChange={(e) => setNoteInputs((p) => ({ ...p, [req.id]: e.target.value }))}
                            placeholder="Add admin notes..."
                            className="flex-1 h-14 px-2 py-1.5 text-xs rounded border border-border bg-background resize-none focus:outline-none focus:border-primary"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="self-end text-xs h-8"
                            onClick={() => handleMarkStatus(req.id, req.status)}
                            disabled={actionLoading === req.id}
                          >
                            Save Note
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
