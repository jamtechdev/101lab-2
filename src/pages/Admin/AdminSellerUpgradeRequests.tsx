// @ts-nocheck
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import {
  useGetSellerUpgradeRequestsQuery,
  useApproveSellerUpgradeRequestMutation,
  useRejectSellerUpgradeRequestMutation,
} from "@/rtk/slices/apiSlice";
import { toastSuccess, toastError } from "@/helper/toasterNotification";
import { CheckCircle2, XCircle, Loader2, User, Building2, Clock } from "lucide-react";

const statusColor = (status: string) => {
  if (status === "approved") return "bg-green-100 text-green-700 border-green-200";
  if (status === "rejected") return "bg-red-100 text-red-700 border-red-200";
  return "bg-amber-100 text-amber-700 border-amber-200";
};

export default function AdminSellerUpgradeRequests() {
  const { isOpen } = useAdminSidebar();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const { data, isLoading, refetch } = useGetSellerUpgradeRequestsQuery({ status: statusFilter });
  const [approve] = useApproveSellerUpgradeRequestMutation();
  const [reject] = useRejectSellerUpgradeRequestMutation();

  const requests = data?.data || [];

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await approve({ id, admin_notes: noteInputs[id] || "" }).unwrap();
      toastSuccess("Request approved! User is now a seller.");
      refetch();
    } catch (err: any) {
      toastError(err?.data?.message || "Failed to approve");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await reject({ id, admin_notes: noteInputs[id] || "" }).unwrap();
      toastSuccess("Request rejected.");
      refetch();
    } catch (err: any) {
      toastError(err?.data?.message || "Failed to reject");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? "ml-64" : "ml-16"}`}>
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">Seller Upgrade Requests</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Buyers who want to become sellers — approve or reject their applications.
              </p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-5">
              {["", "pending", "approved", "rejected"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${
                    statusFilter === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
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
              <div className="space-y-4">
                {requests.map((req: any) => (
                  <div key={req.id} className="border border-border rounded-lg bg-card p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      {/* Left — user info */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${statusColor(req.status)}`}>
                            {req.status === "approved" && <CheckCircle2 className="w-3 h-3" />}
                            {req.status === "rejected" && <XCircle className="w-3 h-3" />}
                            {req.status === "pending" && <Clock className="w-3 h-3" />}
                            {req.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-muted-foreground">#{req.id}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {req.requester?.display_name || req.requester?.user_nicename || `User #${req.user_id}`}
                            </p>
                            <p className="text-xs text-muted-foreground">{req.requester?.user_email}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs mt-1">
                          {req.company_name && (
                            <p><span className="text-muted-foreground">Company:</span> <span className="font-medium">{req.company_name}</span></p>
                          )}
                          {req.company_tax_id && (
                            <p><span className="text-muted-foreground">Tax ID:</span> <span className="font-medium">{req.company_tax_id}</span></p>
                          )}
                          {req.business_type && (
                            <p><span className="text-muted-foreground">Business:</span> <span className="font-medium">{req.business_type}</span></p>
                          )}
                          {req.phone && (
                            <p><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{req.phone}</span></p>
                          )}
                          {req.country && (
                            <p><span className="text-muted-foreground">Country:</span> <span className="font-medium">{req.country}</span></p>
                          )}
                        </div>

                        {req.reason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium text-foreground">Reason:</span> {req.reason}
                          </p>
                        )}

                        {req.admin_notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium text-foreground">Admin Notes:</span> {req.admin_notes}
                          </p>
                        )}
                      </div>

                      {/* Right — actions (only for pending) */}
                      {req.status === "pending" && (
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <textarea
                            value={noteInputs[req.id] || ""}
                            onChange={(e) => setNoteInputs(p => ({ ...p, [req.id]: e.target.value }))}
                            placeholder="Admin notes (optional)..."
                            className="w-full h-16 px-2 py-1.5 text-xs rounded border border-border bg-muted/30 resize-none focus:outline-none focus:border-primary"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                              onClick={() => handleApprove(req.id)}
                              disabled={actionLoading === req.id}
                            >
                              {actionLoading === req.id
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <><CheckCircle2 className="w-3 h-3 mr-1" />Approve</>}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-red-300 text-red-600 hover:bg-red-50 text-xs"
                              onClick={() => handleReject(req.id)}
                              disabled={actionLoading === req.id}
                            >
                              {actionLoading === req.id
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <><XCircle className="w-3 h-3 mr-1" />Reject</>}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
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
