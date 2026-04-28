"use client";

import { useState, useEffect } from "react";
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
  Mail,
  Phone,
  Loader2,
  Store,
  Users,
  TrendingUp,
  Package,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Calendar,
  Trash2,
} from "lucide-react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { useGetSellersQuery, useLazyGetSellersQuery, useDeleteUsersMutation } from "@/rtk/slices/adminApiSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { exportToExcel } from "@/utils/exportToExcel";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import AdminHeader from "./AdminHeader";
import { subscribeAdminEvents } from '@/socket/adminEvent'

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
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="h-9 w-9 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {pages.map((p, idx) => (
        <Button
          key={idx}
          variant={p === page ? "default" : "outline"}
          size="sm"
          className={`h-9 min-w-9 ${p === "..." ? "cursor-default hover:bg-transparent" : ""}`}
          disabled={p === "..."}
          onClick={() => typeof p === "number" && onPageChange(p)}
        >
          {p}
        </Button>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="h-9 w-9 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

// ---------------- Stat Card Component ----------------
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  trend?: string;
}) => (
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
        {trend && (
          <span className="text-xs text-muted-foreground font-medium">{trend}</span>
        )}
      </div>
    </CardContent>
  </Card>
);

const AdminSellers = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ ids: number[]; label: string } | null>(null);
  const limit = 10;

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: response, isLoading, isFetching, isError, refetch } = useGetSellersQuery({ page, limit, search: debouncedSearch || undefined });
  const [deleteUsers, { isLoading: deleting }] = useDeleteUsersMutation();
  const [fetchAllSellers, { isLoading: exporting }] = useLazyGetSellersQuery();

  const handleExport = async () => {
    try {
      const result = await fetchAllSellers({ page: 1, limit: 9999 }).unwrap();
      const allSellers = (result as any)?.data?.data || (result as any)?.data || [];
      const rows = allSellers.map((s: any, i: number) => ({
        "#": i + 1,
        "Company": s.company_name || "",
        "Email": s.email || "",
        "Phone": s.phone || "",
        "Total Listings": s.total_listings ?? 0,
        "Total Sold": s.total_sold ?? 0,
        "Total Live": s.total_live ?? 0,
        "Total Sales": s.total_sales_amount ?? 0,
        "Currency": s.currency || "",
      }));
      exportToExcel(rows, "sellers");
    } catch {
      toast.error("Export failed");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUsers({ userIds: deleteTarget.ids }).unwrap();
      toast.success(`${deleteTarget.ids.length} seller(s) deleted`);
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

  // Extract the nested data structure (always call hooks before early returns)
  const data = response as any;
  const totalPages = data?.pagination?.totalPages || data?.data?.pagination?.totalPages || 1;
  const sellers = data?.data?.data || data?.data || [];
  const stats = data?.stats || data?.data?.stats || {};
  const verifiedCount = sellers.filter((seller: any) => seller.total_sold > 0 || seller.total_live > 0).length;

  const filteredSellers = sellers;

 

    useEffect(() => {
    const unsub = subscribeAdminEvents(() => {
      refetch();
    });

    return unsub;
  }, []);
  


  const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useAdminSidebar();

  // ---------------- Loading States ----------------
  if (isLoading) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-background via-background to-muted/20">
        <AdminSidebar activePath="/admin/sellers" />
        <div
          className={cn(
            "transition-all duration-300 min-h-screen overflow-y-auto",
            sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
            "ml-0"
          )}
        >
          <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="space-y-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-5 w-96" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="shadow-sm border-0">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !response?.data) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-background">
        <AdminSidebar activePath="/admin/sellers" />
        <div
          className={cn(
            "transition-all duration-300 min-h-screen flex justify-center items-center",
            sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
            "ml-0"
          )}
        >
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">{t('admin.common.error')}</CardTitle>
              <CardDescription>{t('admin.sellers.failedToFetch')}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: string | number, currency: string) => {
    const num = Number(value) || 0;

    switch (currency?.toUpperCase()) {
      case "USD":
        return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

      case "TWD":
        return `NT$${num.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}`;

      default:
        // fallback for unknown currencies
        return `${currency?.toUpperCase()} ${num}`;
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <AdminSidebar activePath="/admin/sellers" />

      <div
        className={cn(
          "transition-all duration-300 min-h-screen overflow-y-auto",
          // Desktop: margin based on sidebar collapsed state
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
          // Mobile: no margin (sidebar is overlay)
          "ml-0"
        )}
      >
        {/* Mobile header with menu button */}
        {false &&
          <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm lg:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="text-foreground"
              >
                <Menu className="h-6 w-6" />
              </Button>
              <div className="flex-1 text-center">
                <span className="text-lg font-semibold">{t('admin.sellers.title')}</span>
              </div>
              <div className="w-10" /> {/* Spacer for centering */}
            </div>
          </header>
        }

         <AdminHeader/>

        <div className="p-4 lg:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
          {/* ---------------- HEADER ---------------- */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t('admin.sellers.titleFull')}</h1>
              <p className="text-muted-foreground mt-1">{t('admin.sellers.subtitle')}</p>
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

          {/* ---------------- SUMMARY CARDS ---------------- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard
              title={t('admin.sellers.totalSellers')}
              value={stats.total_sellers || 0}
              icon={Store}
              color="bg-blue-500"
            />
            <StatCard
              title={t('admin.sellers.verifiedSellers')}
              value={verifiedCount}
              icon={CheckCircle2}
              color="bg-green-500"
              trend={`${stats.total_sellers ? Math.round((verifiedCount / stats.total_sellers) * 100) : 0}%`}
            />
            <StatCard
              title={t('admin.sellers.newThisMonth')}
              value={stats.new_this_month || 0}
              icon={Calendar}
              color="bg-purple-500"
            />
            <StatCard
              title={t('admin.sellers.totalListings')}
              value={stats.total_listings || 0}
              icon={Package}
              color="bg-amber-500"
            />
          </div>

          {/* ---------------- SEARCH ---------------- */}
          <Card className="shadow-sm border-0 bg-gradient-to-r from-background to-muted/30">
            <CardContent className="p-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('admin.sellers.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-2 focus:border-primary/50"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ---------------- SELLERS TABLE ---------------- */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl font-bold">{t('admin.sellers.allSellers')}</CardTitle>
                    {filteredSellers.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {filteredSellers.length}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-2 flex items-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    {t('admin.sellers.sellersFound', { count: filteredSellers.length })}
                    {searchQuery && ` • ${t('admin.sellers.filteredBySearch')}`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {selectedIds.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget({ ids: selectedIds, label: `${selectedIds.length} seller(s)` })}
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
              {filteredSellers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <div className="p-4 rounded-full bg-muted/50 mb-4">
                    <Store className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t('admin.sellers.noSellersFound')}</h3>
                  <p className="text-muted-foreground max-w-md">
                    {searchQuery
                      ? t('admin.sellers.tryAdjustingSearch')
                      : t('admin.sellers.noSellersAvailable')}
                  </p>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setSearchQuery("")}
                    >
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
                            checked={filteredSellers.length > 0 && filteredSellers.every((s: any) => selectedIds.includes(s.seller_id))}
                            onChange={() => toggleSelectAll(filteredSellers.map((s: any) => s.seller_id))}
                          />
                        </TableHead>
                        <TableHead className="font-semibold">#</TableHead>
                        <TableHead className="font-semibold">{t('admin.sellers.company')}</TableHead>
                        <TableHead className="font-semibold">{t('admin.sellers.contact')}</TableHead>
                        <TableHead className="font-semibold">{t('admin.sellers.listings')}</TableHead>
                        <TableHead className="font-semibold">{t('admin.sellers.sold')}</TableHead>
                        <TableHead className="font-semibold">{t('admin.sellers.live')}</TableHead>
                        <TableHead className="font-semibold">{t('admin.sellers.totalSales')}</TableHead>
                        <TableHead className="font-semibold">{t('admin.common.status')}</TableHead>
                        <TableHead className="font-semibold">{t('admin.common.action', 'Action')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSellers.map((seller: any, idx) => (
                        <TableRow
                          key={seller.seller_id}
                          className={`hover:bg-muted/30 transition-colors cursor-pointer ${selectedIds.includes(seller.seller_id) ? "bg-red-50/40" : ""}`}
                          onClick={() => navigate(`/admin/sellers/${seller.seller_id}`)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="rounded"
                              checked={selectedIds.includes(seller.seller_id)}
                              onChange={() => toggleSelect(seller.seller_id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-muted-foreground">
                            {(page - 1) * limit + idx + 1}
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-foreground">{seller.company_name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-sm">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (seller.email) window.location.href = `mailto:${seller.email}`;
                                  }}
                                  className="inline-flex items-center gap-2 text-foreground hover:text-primary"
                                >
                                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="break-all">
                                    {seller.email || t("admin.common.notAvailable", "N/A")}
                                  </span>
                                </button>
                              </div>
                              {seller.phone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-3.5 w-3.5" />
                                  <span>{seller.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <Badge variant="outline" className="font-semibold">
                                {seller.total_listings}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-semibold bg-green-100 text-green-700 hover:bg-green-100">
                              {seller.total_sold}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-semibold bg-blue-100 text-blue-700 hover:bg-blue-100">
                              {seller.total_live}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-green-600">
                              {formatCurrency(seller.total_sales_amount, seller.currency)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">
                              {t('admin.sellers.verified')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/admin/sellers/${seller.seller_id}`)}
                              >
                                {t('admin.common.details', 'Details')}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteTarget({ ids: [seller.seller_id], label: seller.company_name })}
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
                  This action cannot be undone. The seller(s) and all associated data will be permanently removed.
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

          {/* ---------------- PAGINATION ---------------- */}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
};

export default AdminSellers;