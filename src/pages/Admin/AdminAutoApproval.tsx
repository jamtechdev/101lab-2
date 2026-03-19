import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DatePicker, Tabs, Table, Modal, Form } from "antd";
import dayjs from "dayjs";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import {
  useGetAutoApprovalRulesQuery,
  useCreateAutoApprovalRuleMutation,
  useUpdateAutoApprovalRuleMutation,
  useDeleteAutoApprovalRuleMutation,
  useGetSellerAutoApprovalRequestsQuery,
  useApproveSellerAutoApprovalRequestMutation,
  useRejectSellerAutoApprovalRequestMutation,
  useUpdateSellerAutoApprovalExpiryMutation,
  useRevokeSellerAutoApprovalRequestMutation,
  AutoApprovalRuleItem,
  SellerAutoApprovalRequestItem,
} from "@/rtk/slices/adminApiSlice";
import { Zap, Calendar, Trash2, Edit2, Plus, Loader2, UserCheck, Users, PowerOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toastSuccess, toastError } from "@/helper/toasterNotification";
import { confirmDelete } from "@/helper/sweetAlertNotification";

const AdminAutoApproval = () => {
  const { t } = useTranslation();
  const { sidebarCollapsed } = useAdminSidebar();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("global");
  const [approveModal, setApproveModal] = useState<{ open: boolean; request: SellerAutoApprovalRequestItem | null; start: string; end: string }>({
    open: false,
    request: null,
    start: "",
    end: "",
  });
  const [expiryModal, setExpiryModal] = useState<{ open: boolean; request: SellerAutoApprovalRequestItem | null; end: string }>({
    open: false,
    request: null,
    end: "",
  });

  const { data, isLoading, refetch } = useGetAutoApprovalRulesQuery();
  const [createRule, { isLoading: creating }] = useCreateAutoApprovalRuleMutation();
  const [updateRule, { isLoading: updating }] = useUpdateAutoApprovalRuleMutation();
  const [deleteRule] = useDeleteAutoApprovalRuleMutation();

  const { data: sellerRequestsData, isLoading: loadingSellerRequests, refetch: refetchSellerRequests } = useGetSellerAutoApprovalRequestsQuery();
  const [approveRequest, { isLoading: approving }] = useApproveSellerAutoApprovalRequestMutation();
  const [rejectRequest, { isLoading: rejecting }] = useRejectSellerAutoApprovalRequestMutation();
  const [updateExpiry, { isLoading: updatingExpiry }] = useUpdateSellerAutoApprovalExpiryMutation();
  const [revokeRequest, { isLoading: revoking }] = useRevokeSellerAutoApprovalRequestMutation();

  const rules: AutoApprovalRuleItem[] = data?.data ?? [];
  const sellerRequests: SellerAutoApprovalRequestItem[] = sellerRequestsData?.data ?? [];

  const resetForm = () => {
    setStartDate("");
    setEndDate("");
    setIsActive(true);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toastError(t("admin.autoApproval.enterDates", "Please enter start and expiry date"));
      return;
    }
    const start = dayjs(startDate).startOf("day").toISOString();
    const end = dayjs(endDate).endOf("day").toISOString();
    if (dayjs(start).isAfter(dayjs(end))) {
      toastError(t("admin.autoApproval.invalidRange", "Expiry date must be after start date"));
      return;
    }
    try {
      if (editingId) {
        await updateRule({ id: editingId, start_date: start, end_date: end, is_active: isActive }).unwrap();
        toastSuccess(t("admin.autoApproval.updated", "Rule updated"));
      } else {
        await createRule({ start_date: start, end_date: end, is_active: isActive }).unwrap();
        toastSuccess(t("admin.autoApproval.created", "Auto-approval enabled until expiry date"));
      }
      resetForm();
      refetch();
    } catch (err: any) {
      toastError(err?.data?.message || t("admin.autoApproval.failed", "Failed to save rule"));
    }
  };

  const handleEdit = (rule: AutoApprovalRuleItem) => {
    setStartDate(dayjs(rule.start_date).format("YYYY-MM-DD"));
    setEndDate(dayjs(rule.end_date).format("YYYY-MM-DD"));
    setIsActive(rule.is_active);
    setEditingId(rule.id);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDelete(t("admin.autoApproval.rule", "Auto-approval rule"));
    if (!confirmed) return;
    try {
      await deleteRule(id).unwrap();
      toastSuccess(t("admin.autoApproval.deleted", "Rule deleted"));
      if (editingId === id) resetForm();
      refetch();
    } catch (err: any) {
      toastError(err?.data?.message || t("admin.autoApproval.deleteFailed", "Failed to delete"));
    }
  };

  const openApproveModal = (req: SellerAutoApprovalRequestItem) => {
    const start = req.requested_start_date ? dayjs(req.requested_start_date).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
    const end = req.requested_end_date ? dayjs(req.requested_end_date).format("YYYY-MM-DD") : dayjs().add(1, "month").format("YYYY-MM-DD");
    setApproveModal({
      open: true,
      request: req,
      start,
      end,
    });
  };
  const closeApproveModal = () => setApproveModal({ open: false, request: null, start: "", end: "" });
  const handleApproveSubmit = async () => {
    if (!approveModal.request || !approveModal.start || !approveModal.end) return;
    const start = dayjs(approveModal.start).startOf("day").toISOString();
    const end = dayjs(approveModal.end).endOf("day").toISOString();
    if (dayjs(start).isAfter(dayjs(end))) {
      toastError(t("admin.autoApproval.invalidRange", "Expiry date must be after start date"));
      return;
    }
    try {
      await approveRequest({ id: approveModal.request.id, start_date: start, end_date: end }).unwrap();
      toastSuccess(t("admin.autoApproval.sellerApproved", "Seller auto-approval approved. They can list without approval until expiry."));
      closeApproveModal();
      refetchSellerRequests();
    } catch (err: any) {
      toastError(err?.data?.message || t("admin.autoApproval.approveFailed", "Failed to approve"));
    }
  };

  const handleReject = async (req: SellerAutoApprovalRequestItem) => {
    const confirmed = await confirmDelete(
      t("admin.autoApproval.rejectConfirm", "Reject this seller's auto-approval request?")
    );
    if (!confirmed) return;
    try {
      await rejectRequest(req.id).unwrap();
      toastSuccess(t("admin.autoApproval.sellerRejected", "Request rejected"));
      refetchSellerRequests();
    } catch (err: any) {
      toastError(err?.data?.message || t("admin.autoApproval.rejectFailed", "Failed to reject"));
    }
  };

  const openExpiryModal = (req: SellerAutoApprovalRequestItem) => {
    setExpiryModal({
      open: true,
      request: req,
      end: req.end_date ? dayjs(req.end_date).format("YYYY-MM-DD") : dayjs().add(1, "month").format("YYYY-MM-DD"),
    });
  };
  const closeExpiryModal = () => setExpiryModal({ open: false, request: null, end: "" });
  const handleExpirySubmit = async () => {
    if (!expiryModal.request || !expiryModal.end) return;
    const end = dayjs(expiryModal.end).endOf("day").toISOString();
    try {
      await updateExpiry({ id: expiryModal.request.id, end_date: end }).unwrap();
      toastSuccess(t("admin.autoApproval.expiryUpdated", "Expiry date updated"));
      closeExpiryModal();
      refetchSellerRequests();
    } catch (err: any) {
      toastError(err?.data?.message || t("admin.autoApproval.expiryUpdateFailed", "Failed to update expiry"));
    }
  };

  const handleRevoke = async (req: SellerAutoApprovalRequestItem) => {
    const confirmed = await confirmDelete(
      t("admin.autoApproval.revokeConfirm", "Turn off auto-approval for this seller? They will need approval again for new listings.")
    );
    if (!confirmed) return;
    try {
      await revokeRequest(req.id).unwrap();
      toastSuccess(t("admin.autoApproval.turnedOff", "Auto-approval turned off for this seller."));
      refetchSellerRequests();
    } catch (err: any) {
      toastError(err?.data?.message || t("admin.autoApproval.revokeFailed", "Failed to turn off"));
    }
  };

  const now = dayjs();
  const isRuleActive = (r: AutoApprovalRuleItem) =>
    r.is_active && now.isBefore(dayjs(r.end_date)) && now.isAfter(dayjs(r.start_date));

  return (
    <div className={cn("min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50")}>
      <AdminSidebar activePath="/admin/auto-approval" />
      <div className={sidebarCollapsed ? "lg:ml-16 transition-all duration-300" : "lg:ml-64 transition-all duration-300"}>
        <AdminHeader />
        <div className="p-4 lg:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Zap className="h-8 w-8 text-amber-500" />
              {t("admin.autoApproval.title", "Auto-approval (expiry date)")}
            </h1>
            <p className="text-gray-600 mt-1">
              {t("admin.autoApproval.subtitle", "When enabled, any listing submitted before the expiry date is approved automatically—no admin approval needed.")}
            </p>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "global",
                label: (
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t("admin.autoApproval.globalRules", "Global rules")}
                  </span>
                ),
                children: (
                  <div className="space-y-6">
          {/* Form: enable auto-approval with expiry date */}
          <Card className="shadow-md border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {editingId ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {editingId ? t("admin.autoApproval.editRule", "Edit rule") : t("admin.autoApproval.addRule", "Enable auto-approval until expiry date")}
              </CardTitle>
              <CardDescription>
                {t("admin.autoApproval.formDesc", "Set start and expiry date. Between these dates, all new listings from any page will be auto-approved.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("admin.autoApproval.startDate", "Start date")}</Label>
                    <DatePicker
                      value={startDate ? dayjs(startDate) : null}
                      onChange={(_, dateStr) => setStartDate(dateStr as string)}
                      format="YYYY-MM-DD"
                      className="w-full rounded-lg"
                      size="large"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("admin.autoApproval.expiryDate", "Expiry date")}</Label>
                    <DatePicker
                      value={endDate ? dayjs(endDate) : null}
                      onChange={(_, dateStr) => setEndDate(dateStr as string)}
                      format="YYYY-MM-DD"
                      className="w-full rounded-lg"
                      size="large"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                  <Label htmlFor="active">{t("admin.autoApproval.active", "Active (listings auto-approved in this period)")}</Label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={creating || updating}>
                    {(creating || updating) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {editingId ? t("admin.common.save", "Save") : t("admin.autoApproval.enable", "Enable auto-approval")}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      {t("admin.common.cancel", "Cancel")}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* List of rules */}
          <Card className="shadow-md border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t("admin.autoApproval.rules", "Auto-approval rules")}
              </CardTitle>
              <CardDescription>
                {t("admin.autoApproval.rulesDesc", "Rules that allow listing without admin approval until the expiry date.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : rules.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t("admin.autoApproval.noRules", "No auto-approval rules. Add one above.")}</p>
              ) : (
                <ul className="space-y-3">
                  {rules.map((rule) => {
                    const active = isRuleActive(rule);
                    return (
                      <li
                        key={rule.id}
                        className={cn(
                          "flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border",
                          active ? "bg-green-50 border-green-200" : "bg-muted/30 border-border"
                        )}
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-medium">
                            {dayjs(rule.start_date).format("MMM D, YYYY")} – {dayjs(rule.end_date).format("MMM D, YYYY")}
                          </span>
                          {active && (
                            <Badge className="bg-green-500 text-white">{t("admin.autoApproval.currentlyActive", "Currently active")}</Badge>
                          )}
                          {rule.is_active && !active && dayjs(rule.end_date).isBefore(now) && (
                            <Badge variant="secondary">{t("admin.autoApproval.expired", "Expired")}</Badge>
                          )}
                          {!rule.is_active && <Badge variant="outline">{t("admin.autoApproval.inactive", "Inactive")}</Badge>}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(rule)}>
                            <Edit2 className="h-4 w-4 mr-1" />
                            {t("admin.common.edit", "Edit")}
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(rule.id)}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            {t("admin.common.delete", "Delete")}
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
                  </div>
                ),
              },
              {
                key: "seller",
                label: (
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {t("admin.autoApproval.sellerRequests", "Seller requests")}
                  </span>
                ),
                children: (
                  <Card className="shadow-md border-0 rounded-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5" />
                        {t("admin.autoApproval.sellerRequestsTitle", "Seller auto-approval requests")}
                      </CardTitle>
                      <CardDescription>
                        {t("admin.autoApproval.sellerRequestsDesc", "Sellers request to list without admin approval. Approve with a date range (start–expiry) or reject. You can update expiry anytime.")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingSellerRequests ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : sellerRequests.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">{t("admin.autoApproval.noSellerRequests", "No seller auto-approval requests.")}</p>
                      ) : (
                        <Table
                          rowKey="id"
                          dataSource={sellerRequests}
                          columns={[
                            {
                              title: t("admin.autoApproval.seller", "Seller"),
                              dataIndex: ["seller", "display_name"],
                              key: "seller",
                              render: (_: unknown, r: SellerAutoApprovalRequestItem) =>
                                r.seller
                                  ? `${r.seller.display_name || r.seller.user_nicename || ""} (${r.seller.user_email || ""})`
                                  : `#${r.seller_id}`,
                            },
                            {
                              title: t("admin.autoApproval.requestedPeriod", "Requested period"),
                              key: "requested",
                              render: (_: unknown, r: SellerAutoApprovalRequestItem) =>
                                r.requested_start_date && r.requested_end_date
                                  ? `${dayjs(r.requested_start_date).format("MMM D, YYYY")} – ${dayjs(r.requested_end_date).format("MMM D, YYYY")}`
                                  : "–",
                            },
                            {
                              title: t("admin.autoApproval.status", "Status"),
                              dataIndex: "status",
                              key: "status",
                              render: (status: string, r: SellerAutoApprovalRequestItem) => (
                                <span className="flex flex-wrap items-center gap-1">
                                  <Badge
                                    className={cn(
                                      status === "approved" && "bg-green-500 text-white",
                                      status === "rejected" && "bg-red-500 text-white",
                                      status === "pending" && "bg-amber-500 text-white"
                                    )}
                                  >
                                    {status}
                                  </Badge>
                                  {status === "approved" && r.revoked_at && (
                                    <Badge variant="secondary">{t("admin.autoApproval.turnedOff", "Turned off")}</Badge>
                                  )}
                                </span>
                              ),
                            },
                            {
                              title: t("admin.autoApproval.startDate", "Start date"),
                              dataIndex: "start_date",
                              key: "start_date",
                              render: (v: string | null) => (v ? dayjs(v).format("MMM D, YYYY") : "–"),
                            },
                            {
                              title: t("admin.autoApproval.expiryDate", "Expiry date"),
                              dataIndex: "end_date",
                              key: "end_date",
                              render: (v: string | null) => (v ? dayjs(v).format("MMM D, YYYY") : "–"),
                            },
                            {
                              title: t("admin.common.actions", "Actions"),
                              key: "actions",
                              render: (_: unknown, r: SellerAutoApprovalRequestItem) => (
                                <div className="flex gap-2">
                                  {r.status === "pending" && (
                                    <>
                                      <Button size="sm" onClick={() => openApproveModal(r)}>
                                        {t("admin.autoApproval.approve", "Approve")}
                                      </Button>
                                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleReject(r)} disabled={rejecting}>
                                        {t("admin.autoApproval.reject", "Reject")}
                                      </Button>
                                    </>
                                  )}
                                  {r.status === "approved" && (
                                    <>
                                      {r.end_date && (
                                        <Button size="sm" variant="outline" onClick={() => openExpiryModal(r)} disabled={updatingExpiry}>
                                          {t("admin.autoApproval.updateExpiry", "Update expiry")}
                                        </Button>
                                      )}
                                      {!r.revoked_at && (
                                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleRevoke(r)} disabled={revoking}>
                                          <PowerOff className="h-4 w-4 mr-1" />
                                          {t("admin.autoApproval.turnOff", "Turn off")}
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              ),
                            },
                          ]}
                          pagination={false}
                        />
                      )}
                    </CardContent>
                  </Card>
                ),
              },
            ]}
          />

          <Modal
            title={t("admin.autoApproval.approveWithDates", "Approve with date range")}
            open={approveModal.open}
            onCancel={closeApproveModal}
            onOk={handleApproveSubmit}
            confirmLoading={approving}
            okText={t("admin.autoApproval.approve", "Approve")}
          >
            {approveModal.request && (
              <div className="space-y-4 pt-2">
                <p className="text-muted-foreground">
                  {t("admin.autoApproval.sellerLabel", "Seller")}: {approveModal.request.seller?.display_name || approveModal.request.seller?.user_email || `#${approveModal.request.seller_id}`}
                </p>
                {approveModal.request.requested_start_date && approveModal.request.requested_end_date && (
                  <p className="text-sm text-muted-foreground">
                    {t("admin.autoApproval.sellerRequested", "Seller requested")}: {dayjs(approveModal.request.requested_start_date).format("MMM D, YYYY")} – {dayjs(approveModal.request.requested_end_date).format("MMM D, YYYY")}. {t("admin.autoApproval.editAndSave", "You can edit below and save.")}
                  </p>
                )}
                <Form layout="vertical">
                  <Form.Item label={t("admin.autoApproval.startDate", "Start date")} required>
                    <DatePicker
                      value={approveModal.start ? dayjs(approveModal.start) : null}
                      onChange={(_, dateStr) => setApproveModal((p) => ({ ...p, start: dateStr as string }))}
                      format="YYYY-MM-DD"
                      className="w-full"
                    />
                  </Form.Item>
                  <Form.Item label={t("admin.autoApproval.expiryDate", "Expiry date")} required>
                    <DatePicker
                      value={approveModal.end ? dayjs(approveModal.end) : null}
                      onChange={(_, dateStr) => setApproveModal((p) => ({ ...p, end: dateStr as string }))}
                      format="YYYY-MM-DD"
                      className="w-full"
                    />
                  </Form.Item>
                </Form>
              </div>
            )}
          </Modal>

          <Modal
            title={t("admin.autoApproval.updateExpiryTitle", "Update expiry date")}
            open={expiryModal.open}
            onCancel={closeExpiryModal}
            onOk={handleExpirySubmit}
            confirmLoading={updatingExpiry}
            okText={t("admin.common.save", "Save")}
          >
            {expiryModal.request && (
              <div className="space-y-4 pt-2">
                <p className="text-muted-foreground">
                  {t("admin.autoApproval.sellerLabel", "Seller")}: {expiryModal.request.seller?.display_name || expiryModal.request.seller?.user_email || `#${expiryModal.request.seller_id}`}
                </p>
                <Form layout="vertical">
                  <Form.Item label={t("admin.autoApproval.expiryDate", "Expiry date")} required>
                    <DatePicker
                      value={expiryModal.end ? dayjs(expiryModal.end) : null}
                      onChange={(_, dateStr) => setExpiryModal((p) => ({ ...p, end: dateStr as string }))}
                      format="YYYY-MM-DD"
                      className="w-full"
                    />
                  </Form.Item>
                </Form>
              </div>
            )}
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default AdminAutoApproval;
