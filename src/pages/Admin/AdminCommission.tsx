import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, Select, InputNumber, Table } from "antd";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import {
  useGetCommissionRulesQuery,
  useCreateCommissionRuleMutation,
  useUpdateCommissionRuleMutation,
  useGetSellersQuery,
  useGetAdminBatchesQuery,
  CommissionRuleItem,
} from "@/rtk/slices/adminApiSlice";
import { Percent, Globe, Store, Package, Loader2, Edit2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toastSuccess, toastError } from "@/helper/toasterNotification";

const AdminCommission = () => {
  const { t } = useTranslation();
  const { sidebarCollapsed } = useAdminSidebar();
  const [activeTab, setActiveTab] = useState<string>("global");
  const [globalPercent, setGlobalPercent] = useState<number>(20);
  const [sellerId, setSellerId] = useState<number | null>(null);
  const [sellerPercent, setSellerPercent] = useState<number>(15);
  const [batchId, setBatchId] = useState<number | null>(null);
  const [batchPercent, setBatchPercent] = useState<number>(10);
  const [editingRule, setEditingRule] = useState<CommissionRuleItem | null>(null);
  const [editPercent, setEditPercent] = useState<number>(0);

  const { data: rulesData, isLoading: loadingRules, refetch } = useGetCommissionRulesQuery();
  const [createRule, { isLoading: creating }] = useCreateCommissionRuleMutation();
  const [updateRule, { isLoading: updating }] = useUpdateCommissionRuleMutation();

  const { data: sellersData } = useGetSellersQuery({ page: 1, limit: 500 });
  const { data: batchesData } = useGetAdminBatchesQuery({ page: 1, limit: 200 });

  const rules: CommissionRuleItem[] = rulesData?.data ?? [];
  const globalRules = rules.filter((r) => r.scope === "global");
  const sellerRules = rules.filter((r) => r.scope === "seller");
  const batchRules = rules.filter((r) => r.scope === "batch");
  const activeGlobal = globalRules.find((r) => r.is_active);

  // Sellers API returns a nested object; mirror extraction used in AdminSellers
  const sellersContainer: any = sellersData?.data;
  const sellers = Array.isArray(sellersContainer?.data) ? sellersContainer.data : [];

  // Batches API returns AdminBatchResponse directly
  const batches = batchesData?.data ?? [];

  const handleSetGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = Number(globalPercent);
    if (isNaN(p) || p < 0 || p > 100) {
      toastError(t("admin.commission.invalidPercent", "Percent must be between 0 and 100"));
      return;
    }
    try {
      await createRule({ scope: "global", percent: p }).unwrap();
      toastSuccess(t("admin.commission.globalSet", "Global commission updated"));
      refetch();
    } catch (err: any) {
      toastError(err?.data?.message || t("admin.commission.failed", "Failed to save"));
    }
  };

  const handleAddSellerRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sellerId == null) {
      toastError(t("admin.commission.selectSeller", "Select a seller"));
      return;
    }
    const p = Number(sellerPercent);
    if (isNaN(p) || p < 0 || p > 100) {
      toastError(t("admin.commission.invalidPercent", "Percent must be between 0 and 100"));
      return;
    }
    try {
      await createRule({ scope: "seller", percent: p, seller_id: sellerId }).unwrap();
      toastSuccess(t("admin.commission.sellerRuleAdded", "Seller commission rule added"));
      setSellerId(null);
      setSellerPercent(15);
      refetch();
    } catch (err: any) {
      toastError(err?.data?.message || t("admin.commission.failed", "Failed to save"));
    }
  };

  const handleAddBatchRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchId == null) {
      toastError(t("admin.commission.selectBatch", "Select a batch"));
      return;
    }
    const p = Number(batchPercent);
    if (isNaN(p) || p < 0 || p > 100) {
      toastError(t("admin.commission.invalidPercent", "Percent must be between 0 and 100"));
      return;
    }
    try {
      await createRule({ scope: "batch", percent: p, batch_id: batchId }).unwrap();
      toastSuccess(t("admin.commission.batchRuleAdded", "Batch commission rule added"));
      setBatchId(null);
      setBatchPercent(10);
      refetch();
    } catch (err: any) {
      toastError(err?.data?.message || t("admin.commission.failed", "Failed to save"));
    }
  };

  const startEdit = (rule: CommissionRuleItem) => {
    setEditingRule(rule);
    setEditPercent(Number(rule.percent));
  };
  const cancelEdit = () => {
    setEditingRule(null);
    setEditPercent(0);
  };
  const handleUpdateRule = async () => {
    if (!editingRule) return;
    const p = Number(editPercent);
    if (isNaN(p) || p < 0 || p > 100) {
      toastError(t("admin.commission.invalidPercent", "Percent must be between 0 and 100"));
      return;
    }
    try {
      await updateRule({ id: editingRule.id, percent: p }).unwrap();
      toastSuccess(t("admin.commission.updated", "Commission rule updated"));
      cancelEdit();
      refetch();
    } catch (err: any) {
      toastError(err?.data?.message || t("admin.commission.failed", "Failed to update"));
    }
  };
  const handleToggleActive = async (rule: CommissionRuleItem) => {
    try {
      await updateRule({ id: rule.id, is_active: !rule.is_active }).unwrap();
      toastSuccess(rule.is_active ? t("admin.commission.deactivated", "Rule deactivated") : t("admin.commission.activated", "Rule activated"));
      refetch();
    } catch (err: any) {
      toastError(err?.data?.message || t("admin.commission.failed", "Failed to update"));
    }
  };

  const sellerColumns = [
    {
      title: t("admin.commission.seller", "Seller"),
      dataIndex: "seller_id",
      key: "seller",
      render: (_: unknown, r: CommissionRuleItem) =>
        r.seller ? `${r.seller.display_name || r.seller.user_nicename} (${r.seller.user_email})` : `ID ${r.seller_id}`,
    },
    {
      title: t("admin.commission.percent", "Commission %"),
      dataIndex: "percent",
      key: "percent",
      render: (val: number, r: CommissionRuleItem) =>
        editingRule?.id === r.id ? (
          <div className="flex items-center gap-2">
            <InputNumber
              min={0}
              max={100}
              step={0.5}
              value={editPercent}
              onChange={(v) => setEditPercent(v ?? 0)}
              className="w-24"
            />
            <Button size="sm" onClick={handleUpdateRule} disabled={updating}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save", "Save")}
            </Button>
            <Button size="sm" variant="outline" onClick={cancelEdit}>
              {t("common.cancel", "Cancel")}
            </Button>
          </div>
        ) : (
          <span>{Number(r.percent ?? val)}%</span>
        ),
    },
    {
      title: t("admin.commission.active", "Active"),
      dataIndex: "is_active",
      key: "is_active",
      render: (active: boolean, r: CommissionRuleItem) => (
        <Switch checked={active} onChange={() => handleToggleActive(r)} />
      ),
    },
    {
      title: "",
      key: "edit",
      render: (_: unknown, r: CommissionRuleItem) =>
        editingRule?.id === r.id ? null : (
          <Button size="sm" variant="ghost" onClick={() => startEdit(r)}>
            <Edit2 className="h-4 w-4" />
          </Button>
        ),
    },
  ];

  const batchColumns = [
    {
      title: t("admin.commission.batch", "Batch"),
      dataIndex: "batch_id",
      key: "batch",
      render: (_: unknown, r: CommissionRuleItem) =>
        r.batch ? `${r.batch.batch_name || "Batch"} #${(r.batch as any).batch_id || r.batch.id}` : `ID ${r.batch_id}`,
    },
    {
      title: t("admin.commission.percent", "Commission %"),
      dataIndex: "percent",
      key: "percent",
      render: (val: number, r: CommissionRuleItem) =>
        editingRule?.id === r.id ? (
          <div className="flex items-center gap-2">
            <InputNumber
              min={0}
              max={100}
              step={0.5}
              value={editPercent}
              onChange={(v) => setEditPercent(v ?? 0)}
              className="w-24"
            />
            <Button size="sm" onClick={handleUpdateRule} disabled={updating}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save", "Save")}
            </Button>
            <Button size="sm" variant="outline" onClick={cancelEdit}>
              {t("common.cancel", "Cancel")}
            </Button>
          </div>
        ) : (
          <span>{Number(r.percent ?? val)}%</span>
        ),
    },
    {
      title: t("admin.commission.active", "Active"),
      dataIndex: "is_active",
      key: "is_active",
      render: (active: boolean, r: CommissionRuleItem) => (
        <Switch checked={active} onChange={() => handleToggleActive(r)} />
      ),
    },
    {
      title: "",
      key: "edit",
      render: (_: unknown, r: CommissionRuleItem) =>
        editingRule?.id === r.id ? null : (
          <Button size="sm" variant="ghost" onClick={() => startEdit(r)}>
            <Edit2 className="h-4 w-4" />
          </Button>
        ),
    },
  ];

  return (
    <div className={cn("min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50")}>
      <AdminSidebar activePath="/admin/commission" />
      <div className={sidebarCollapsed ? "lg:ml-16 transition-all duration-300" : "lg:ml-64 transition-all duration-300"}>
        <AdminHeader />
        <div className="p-4 lg:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Percent className="h-8 w-8 text-emerald-600" />
              {t("admin.commission.title", "Commission rules")}
            </h1>
            <p className="text-gray-600 mt-1">
              {t("admin.commission.subtitle", "Set global default commission, or override by seller or by batch.")}
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
                    <Globe className="h-4 w-4" />
                    {t("admin.commission.global", "Global default")}
                  </span>
                ),
                children: (
                  <div className="space-y-6">
                    <Card className="shadow-md border-0 rounded-xl">
                      <CardHeader>
                        <CardTitle>{t("admin.commission.currentGlobal", "Current global commission")}</CardTitle>
                        <CardDescription>
                          {t("admin.commission.globalDesc", "This rate applies when no seller or batch override exists.")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {activeGlobal && (
                          <p className="text-lg">
                            <Badge variant="secondary" className="mr-2">
                              {Number(activeGlobal.percent)}%
                            </Badge>
                            {t("admin.commission.applied", "applied")}
                          </p>
                        )}
                        <form onSubmit={handleSetGlobal} className="flex flex-wrap items-end gap-4">
                          <div className="space-y-2">
                            <Label>{t("admin.commission.setPercent", "Set commission %")}</Label>
                            <InputNumber
                              min={0}
                              max={100}
                              step={0.5}
                              value={globalPercent}
                              onChange={(v) => setGlobalPercent(v ?? 20)}
                              className="w-32"
                            />
                          </div>
                          <Button type="submit" disabled={creating}>
                            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : t("admin.commission.updateGlobal", "Update global")}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </div>
                ),
              },
              {
                key: "seller",
                label: (
                  <span className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    {t("admin.commission.bySeller", "By seller")}
                    {sellerRules.length > 0 && (
                      <Badge variant="secondary">{sellerRules.length}</Badge>
                    )}
                  </span>
                ),
                children: (
                  <div className="space-y-6">
                    <Card className="shadow-md border-0 rounded-xl">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Plus className="h-5 w-5" />
                          {t("admin.commission.addSellerRule", "Add seller commission override")}
                        </CardTitle>
                        <CardDescription>
                          {t("admin.commission.sellerRuleDesc", "Override commission for a specific seller.")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleAddSellerRule} className="flex flex-wrap items-end gap-4">
                          <div className="space-y-2 min-w-[200px]">
                            <Label>{t("admin.commission.seller", "Seller")}</Label>
                            <Select
                              placeholder={t("admin.commission.selectSeller", "Select a seller")}
                              allowClear
                              showSearch
                              optionFilterProp="label"
                              value={sellerId ?? undefined}
                              onChange={(v) => setSellerId(v ?? null)}
                              options={sellers.map((s) => ({
                                value: s.seller_id,
                                label: `${s.company_name} (${s.email})`,
                              }))}
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t("admin.commission.percent", "Commission %")}</Label>
                            <InputNumber
                              min={0}
                              max={100}
                              step={0.5}
                              value={sellerPercent}
                              onChange={(v) => setSellerPercent(v ?? 15)}
                              className="w-28"
                            />
                          </div>
                          <Button type="submit" disabled={creating || sellerId == null}>
                            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.add", "Add")}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>{t("admin.commission.sellerRulesList", "Seller overrides")}</CardTitle>
                        <CardDescription>
                          {t("admin.commission.howMany", "How many commission rules apply by seller.")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loadingRules ? (
                          <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
                        ) : (
                          <Table
                            rowKey="id"
                            columns={sellerColumns}
                            dataSource={sellerRules}
                            pagination={false}
                            size="small"
                          />
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ),
              },
              {
                key: "batch",
                label: (
                  <span className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {t("admin.commission.byBatch", "By batch")}
                    {batchRules.length > 0 && (
                      <Badge variant="secondary">{batchRules.length}</Badge>
                    )}
                  </span>
                ),
                children: (
                  <div className="space-y-6">
                    <Card className="shadow-md border-0 rounded-xl">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Plus className="h-5 w-5" />
                          {t("admin.commission.addBatchRule", "Add batch commission override")}
                        </CardTitle>
                        <CardDescription>
                          {t("admin.commission.batchRuleDesc", "Override commission for a specific batch/listing.")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleAddBatchRule} className="flex flex-wrap items-end gap-4">
                          <div className="space-y-2 min-w-[200px]">
                            <Label>{t("admin.commission.batch", "Batch")}</Label>
                            <Select
                              placeholder={t("admin.commission.selectBatch", "Select a batch")}
                              allowClear
                              showSearch
                              optionFilterProp="label"
                              value={batchId ?? undefined}
                              onChange={(v) => setBatchId(v ?? null)}
                              options={batches.map((b) => ({
                                value: b.batch_id,
                                label: `#${b.batch_number ?? b.batch_id} ${b.seller?.display_name || ""}`.trim(),
                              }))}
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t("admin.commission.percent", "Commission %")}</Label>
                            <InputNumber
                              min={0}
                              max={100}
                              step={0.5}
                              value={batchPercent}
                              onChange={(v) => setBatchPercent(v ?? 10)}
                              className="w-28"
                            />
                          </div>
                          <Button type="submit" disabled={creating || batchId == null}>
                            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.add", "Add")}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>{t("admin.commission.batchRulesList", "Batch overrides")}</CardTitle>
                        <CardDescription>
                          {t("admin.commission.howManyBatch", "How many commission rules apply by batch.")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loadingRules ? (
                          <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
                        ) : (
                          <Table
                            rowKey="id"
                            columns={batchColumns}
                            dataSource={batchRules}
                            pagination={false}
                            size="small"
                          />
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminCommission;
