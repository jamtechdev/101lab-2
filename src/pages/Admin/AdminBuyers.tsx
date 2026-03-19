"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Mail,
  Phone,
  ShoppingCart,
  Users,
  TrendingUp,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Sparkles,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { useGetBuyersQuery, useLazyGetBuyersQuery, useDeleteUsersMutation } from "@/rtk/slices/adminApiSlice";
import { useNavigate } from "react-router-dom";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { exportToExcel } from "@/utils/exportToExcel";

import { cn } from "@/lib/utils";
import AdminHeader from "./AdminHeader";
import { subscribeAdminEvents } from '@/socket/adminEvent'
import toast from "react-hot-toast";

// ---------------- Pagination Component ----------------
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

  const pages: (number | string)[] = [];
  const startPage = Math.max(2, page - 1);
  const endPage = Math.min(totalPages - 1, page + 1);

  pages.push(1);
  if (startPage > 2) pages.push("...");
  for (let i = startPage; i <= endPage; i++) pages.push(i);
  if (endPage < totalPages - 1) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="h-9 w-9 p-0">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {pages.map((p, idx) => (
        <Button key={idx} variant={p === page ? "default" : "outline"} size="sm" className={`h-9 min-w-9 ${p === "..." ? "cursor-default hover:bg-transparent" : ""}`} disabled={p === "..."} onClick={() => typeof p === "number" && onPageChange(p)}>
          {p}
        </Button>
      ))}
      <Button variant="outline" size="sm" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="h-9 w-9 p-0">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

// ---------------- Stat Card Component ----------------
const StatCard = ({ title, value, icon: Icon, color, trend }: { title: string; value: number; icon: React.ElementType; color: string; trend?: string }) => (
  <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-background to-muted/30">
    <div className={`absolute top-0 right-0 w-40 h-40 ${color} opacity-5 rounded-full -mr-20 -mt-20 group-hover:opacity-10 transition-opacity`} />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`p-2.5 rounded-xl ${color} bg-opacity-15 group-hover:bg-opacity-20 transition-all`}>
        <Icon className={`h-5 w-5 ${color.replace("bg-", "text-")}`} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex items-baseline gap-2">
        <div className={`text-4xl font-bold ${color.replace("bg-", "text-")}`}>{value}</div>
        {trend && <span className="text-xs text-muted-foreground font-medium">{trend}</span>}
      </div>
    </CardContent>
  </Card>
);

const AdminBuyers = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ ids: number[]; label: string } | null>(null);
  const limit = 10;
  const navigate = useNavigate();

  const { data, isLoading, isFetching, isError, refetch } = useGetBuyersQuery({ page, limit });
  const [deleteUsers, { isLoading: deleting }] = useDeleteUsersMutation();
  const [fetchAllBuyers, { isLoading: exporting }] = useLazyGetBuyersQuery();

  const handleExport = async () => {
    try {
      const result = await fetchAllBuyers({ page: 1, limit: 9999 }).unwrap();
      const allBuyers = result?.data || [];
      const rows = allBuyers.map((b: any, i: number) => ({
        "#": i + 1,
        "Company": b.company_name || "",
        "Email": b.email || "",
        "Phone": b.phone || "",
        "Address": b.address || "",
        "Total Purchases": b.total_purchases ?? 0,
        "Total Bids": b.total_bids ?? 0,
        "Accepted Bids": b.accepted_bids ?? 0,
        "Total Spent": b.total_amount_purchases ?? 0,
        "Currency": b.currency || "",
      }));
      exportToExcel(rows, "buyers");
    } catch {
      toast.error("Export failed");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUsers({ userIds: deleteTarget.ids }).unwrap();
      toast.success(`${deleteTarget.ids.length} buyer(s) deleted`);
      setSelectedIds([]);
      setDeleteTarget(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Delete failed");
      setDeleteTarget(null);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = (ids: number[]) => {
    const allCurrentSelected = ids.every((id) => selectedIds.includes(id));
    if (allCurrentSelected) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const formatCurrency = (value: string | number, currency: string) => {
    const num = Number(value) || 0;
    switch (currency?.toUpperCase()) {
      case "USD": return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
      case "TWD": return `NT$${num.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}`;
      default: return `${currency?.toUpperCase()} ${num.toLocaleString()}`;
    }
  };

  const filteredBuyers = useMemo(() => {
    if (!data?.data) return [];
    if (!searchQuery.trim()) return data.data;
    const query = searchQuery.toLowerCase();
    return data.data.filter(
      (buyer) =>
        buyer.company_name.toLowerCase().includes(query) ||
        buyer.email.toLowerCase().includes(query) ||
        buyer.phone?.toLowerCase().includes(query) ||
        buyer.address?.toLowerCase().includes(query)
    );
  }, [data?.data, searchQuery]);

  useEffect(() => {
    const unsub = subscribeAdminEvents(() => { refetch(); });
    return unsub;
  }, []);

  const { sidebarCollapsed } = useAdminSidebar();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-background via-background to-muted/20">
        <AdminSidebar activePath="/admin/buyers" />
        <div className={cn("transition-all duration-300 min-h-screen overflow-y-auto", sidebarCollapsed ? "lg:ml-16" : "lg:ml-64", "ml-0")}>
          <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="space-y-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-5 w-96" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-0 shadow-lg">
                  <CardHeader className="pb-3"><Skeleton className="h-4 w-24" /></CardHeader>
                  <CardContent><Skeleton className="h-10 w-16" /></CardContent>
                </Card>
              ))}
            </div>
            <Card className="shadow-sm border-0">
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent>
                <div className="space-y-4">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-background">
        <AdminSidebar activePath="/admin/buyers" />
        <div className={cn("transition-all duration-300 min-h-screen flex justify-center items-center", sidebarCollapsed ? "lg:ml-16" : "lg:ml-64", "ml-0")}>
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">{t('admin.common.error')}</CardTitle>
              <CardDescription>{t('admin.buyers.failedToFetch')}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(data.pagination.total / limit);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <AdminSidebar activePath="/admin/buyers" />

      <div className={cn("transition-all duration-300 min-h-screen overflow-y-auto", sidebarCollapsed ? "lg:ml-16" : "lg:ml-64", "ml-0")}>
        <AdminHeader />

        <div className="p-4 lg:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t('admin.buyers.titleFull')}</h1>
              <p className="text-muted-foreground mt-1">{t('admin.buyers.subtitle')}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={exporting}
              onClick={handleExport}
              className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50 hover:border-green-500"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-base">⬇</span>}
              {exporting ? "Exporting..." : "Export Excel"}
            </Button>
          </div>

          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard title={t('admin.buyers.totalBuyers')} value={data.stats.total_buyers} icon={Users} color="bg-blue-500" />
            <StatCard title={t('admin.buyers.activeBuyers')} value={data.stats.total_buyers} icon={CheckCircle2} color="bg-green-500" trend="100%" />
            <StatCard title={t('admin.buyers.newThisMonth')} value={data.stats.new_this_month} icon={TrendingUp} color="bg-purple-500" />
            <StatCard title={t('admin.buyers.totalPurchases')} value={data.stats.total_purchases} icon={ShoppingCart} color="bg-amber-500" />
          </div>

          {/* SEARCH */}
          <Card className="shadow-sm border-0 bg-gradient-to-r from-background to-muted/30">
            <CardContent className="p-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="text" placeholder={t('admin.buyers.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11 border-2 focus:border-primary/50" />
                {searchQuery && (
                  <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7" onClick={() => setSearchQuery("")}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* BUYERS TABLE */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl font-bold">{t('admin.buyers.allBuyers')}</CardTitle>
                    {filteredBuyers.length > 0 && <Badge variant="secondary" className="ml-2">{filteredBuyers.length}</Badge>}
                  </div>
                  <CardDescription className="mt-2 flex items-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    {t('admin.buyers.buyersFound', { count: filteredBuyers.length })}
                    {searchQuery && ` • ${t('admin.buyers.filteredBySearch')}`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {selectedIds.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget({ ids: selectedIds, label: `${selectedIds.length} buyer(s)` })}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete {selectedIds.length} selected
                    </Button>
                  )}
                  {isFetching && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">{t('admin.common.updating')}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filteredBuyers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <div className="p-4 rounded-full bg-muted/50 mb-4">
                    <Users className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t('admin.buyers.noBuyersFound')}</h3>
                  <p className="text-muted-foreground max-w-md">
                    {searchQuery ? t('admin.buyers.tryAdjustingSearch') : t('admin.buyers.noBuyersAvailable')}
                  </p>
                  {searchQuery && (
                    <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                      {t('admin.common.clearFilters')}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-10">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={selectedIds.length === filteredBuyers.length && filteredBuyers.length > 0}
                            onChange={() => toggleSelectAll(filteredBuyers.map((b) => b.buyer_id))}
                          />
                        </TableHead>
                        <TableHead className="font-semibold">#</TableHead>
                        <TableHead className="font-semibold">{t('admin.buyers.company')}</TableHead>
                        <TableHead className="font-semibold">{t('admin.buyers.contact')}</TableHead>
                        <TableHead className="font-semibold">{t('admin.buyers.purchases')}</TableHead>
                        <TableHead className="font-semibold">{t('admin.buyers.totalBids')}</TableHead>
                        <TableHead className="font-semibold">{t('admin.buyers.totalSpent')}</TableHead>
                        <TableHead className="font-semibold">{t('admin.common.status')}</TableHead>
                        <TableHead className="font-semibold">{t('admin.common.action', 'Action')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBuyers.map((buyer, idx) => (
                        <TableRow
                          key={buyer.buyer_id}
                          className={`hover:bg-muted/30 transition-colors cursor-pointer ${selectedIds.includes(buyer.buyer_id) ? "bg-red-50/40" : ""}`}
                          onClick={() => navigate(`/admin/buyers/${buyer.buyer_id}`)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="rounded"
                              checked={selectedIds.includes(buyer.buyer_id)}
                              onChange={() => toggleSelect(buyer.buyer_id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-muted-foreground">
                            {(page - 1) * limit + idx + 1}
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-foreground">{buyer.company_name}</div>
                            {buyer.address && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate max-w-[200px]">{buyer.address}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-sm">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); if (buyer.email) window.location.href = `mailto:${buyer.email}`; }}
                                  className="inline-flex items-center gap-2 text-foreground hover:text-primary"
                                >
                                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="break-all">{buyer.email || t("admin.common.notAvailable", "N/A")}</span>
                                </button>
                              </div>
                              {buyer.phone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-3.5 w-3.5" />
                                  <span>{buyer.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-semibold">{buyer.total_purchases}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{buyer.total_bids}</span>
                            </div>
                            {buyer.accepted_bids > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {buyer.accepted_bids} {t('admin.buyers.accepted')}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-green-600">
                              {formatCurrency(buyer.total_amount_purchases, buyer.currency)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">
                              {t('admin.status.active')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/admin/buyers/${buyer.buyer_id}`)}
                              >
                                {t('admin.common.details', 'Details')}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteTarget({ ids: [buyer.buyer_id], label: buyer.company_name })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete Confirm Dialog */}
          <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {deleteTarget?.label}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The buyer(s) and all associated data will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleting}
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* PAGINATION */}
          {!searchQuery && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
        </div>
      </div>
    </div>
  );
};

export default AdminBuyers;
