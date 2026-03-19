// @ts-nocheck
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, Search, Filter, Download, Plus, Package, Calendar, FileText, TrendingUp, ArrowUpRight, Sparkles, ChartAreaIcon, MessageCircle, Delete, Percent, Star } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFetchBatchesQuery, useGetBatchesBySellerQuery } from "@/rtk/slices/productSlice";
import { useToggleHighlightMutation } from "@/rtk/slices/batchApiSlice";
import { useTranslation } from "react-i18next";
import Pagination from "@/components/common/Pagination";
import toast from "react-hot-toast";
import axios from "axios";
import { subscribeBuyerEvents } from "@/socket/buyerEvents"
import { Trash2 } from "lucide-react";
import { useSellerPermissions } from "@/hooks/useSellerPermissions";
import { SITE_TYPE } from "@/config/site";

const statusColors: Record<string, string> = {
  publish: "bg-info/10 text-info border-info/20",
  inspection_schedule: "bg-info/10 text-info border-info/20",
  inspection_complete: "bg-accent/10 text-accent border-accent/20",
  live_for_bids: "bg-accent/10 text-accent border-accent/20",
  deactive_for_bids: "bg-muted text-muted-foreground border-border",
  sold: "bg-success/10 text-success border-success/20",
  deactive: "bg-destructive/10 text-destructive border-destructive/20",
  under_review: "bg-warning/10 text-warning border-warning/20",
};




const Submissions = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { hasPermission } = useSellerPermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  // Use companySellerId for data (company-level), fallback to userId
  const companySellerId = localStorage.getItem("companySellerId") || localStorage.getItem("userId");
   const [searchParams] = useSearchParams();
  const typeFromUrl = searchParams.get("type") || "all";
  // API expects platform type (e.g. recycle), not "all" — use VITE_SITE_TYPE when filter is "all"
  const typeForApi = typeFromUrl === "all" ? SITE_TYPE : typeFromUrl;

  const [toggleHighlight] = useToggleHighlightMutation();

  const handleToggleHighlight = async (e, batchId) => {
    e.stopPropagation();
    try {
      await toggleHighlight(batchId).unwrap();
      refetch();
    } catch {
      toast.error("Failed to update highlight");
    }
  };

  const { data: response, isLoading, refetch, error, } = useGetBatchesBySellerQuery(
    { sellerId: companySellerId, page, type: typeForApi },
    // {
    //   pollingInterval: 1000,
    //   refetchOnFocus: true,
    //   refetchOnReconnect: true,
    // }
  )
  const currentPage = response?.data?.page || 1;
  const totalPages = response?.data?.totalPages || 1;



  // Safely access array
  const batches = Array.isArray(response?.data?.data) ? response.data.data : [];


  const handleDeactivate = async (batchId) => {
    const confirmAction = window.confirm("Are you sure you want to deactivate this batch?");
    if (!confirmAction) return; // ❌ Stop if user clicks Cancel

    try {
      const response = await axios.patch(
        `https://api.101recycle.greenbidz.com/api/v1/batch/deactivate/${batchId}`
      );

      console.log(response.data);

      toast.success("Batch deactivated!");
      window.location.reload(); // 🔄 Reload after success
    } catch (error) {
      console.error(error);

      const msg =
        error.response?.data?.message || "Failed to deactivate batch";

      toast.error(msg);
    }
  };



  useEffect(() => {
    const unsub = subscribeBuyerEvents(() => {
      refetch();
    });

    return unsub;
  }, []);



  // Filter batches
  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.batchId?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || batch.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading)
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-accent-light rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
        </div>
      </DashboardLayout>
    );
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <FileText className="w-8 h-8 text-destructive" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-1">Error loading submissions</h3>
            <p className="text-sm text-muted-foreground">{t("common.error")}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }



  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-7 bg-gradient-to-b from-accent to-accent-light rounded-full"></div>
              <h1 className="text-3xl font-bold text-foreground">{t("submissions.title")}</h1>
            </div>
            <p className="text-sm text-muted-foreground ml-3">
              {t("submissions.subtitle")}
            </p>
          </div>
          <Button
            onClick={() => navigate("/upload?type=surplus")}
            size="lg"
            className="h-12 min-h-12 px-6 group relative overflow-hidden bg-gradient-to-r from-accent to-accent-light text-white hover:shadow-accent transition-all duration-300 hover:scale-105"
          >
            <Sparkles className="w-4 h-4 mr-2 group-hover:animate-pulse" />
            {t("submissions.newSubmission")}
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("submissions.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-border/50 focus:border-accent"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 border-border/50 focus:border-accent">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={t("submissions.filterByStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="publish">Publish</SelectItem>
                  <SelectItem value="inspection_schedule">Inspection Scheduled</SelectItem>
                  <SelectItem value="inspection_complete">Inspection Completed</SelectItem>
                  <SelectItem value="live_for_bids">Live For Bids</SelectItem>
                  <SelectItem value="deactive_for_bids">Deactive For Bids</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="deactive">Deactive</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredBatches.length}</span> of <span className="font-semibold text-foreground">{batches.length}</span> {t("submissions.submissions")}
          </p>
        </div>

        {/* Submissions List */}
        {filteredBatches.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">No submissions found</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("common.noResults")}</p>
                <Button onClick={() => navigate("/upload?step=1")} variant="outline" className="h-11 min-h-11 px-5">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Submission
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredBatches.map((batch) => (
              <Card
                key={batch.batchId}
                className="border-border/50 hover:border-border transition-all duration-200 hover:shadow-md cursor-pointer group"
                onClick={() => navigate(`/upload?step=${batch.step}&batchId=${batch.batchId}`)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left Section */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-accent/10 text-accent flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-foreground text-base">
                            #{batch.batchId ?? "N/A"}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`${statusColors[batch.status] ?? "bg-muted text-muted-foreground border-border"} text-xs`}
                          >
                            {batch.status?.replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim() ?? t("common.status")}
                          </Badge>
                          {batch.approval_status === "pending" ? (
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 text-sm font-semibold px-2 py-2 min-h-[16px] inline-flex items-center">
                              {t("submissions.pendingApproval", "Pending approval")}
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 text-sm font-semibold px-2 py-2 min-h-[16px] inline-flex items-center">
                              {t("submissions.approved", "Approved")}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span>{batch?.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {Array.isArray(batch?.firstProductImages) && batch.firstProductImages[0] && (
                            <img
                              src={batch.firstProductImages[0]}
                              alt="Product"
                              className="w-20 h-20 object-cover rounded border border-gray-200"
                            />
                          )}
                        </div>

                        <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-4 h-4" />
                            <span>{batch.category ?? t("common.category")}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {batch.postDate ? new Date(batch.postDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              }) : t("submissions.tbd")}
                            </span>
                          </div>
                          {batch.commission_percent != null && Number(batch.commission_percent) >= 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50">
                              <Percent className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                              <span className="text-sm font-medium text-amber-900 dark:text-amber-100">{t("submissions.commission")}: {t("submissions.commissionPercent", { percent: Number(batch.commission_percent) })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-6 sm:gap-8">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">{t("submissions.items")}</div>
                        <div className="text-lg font-semibold text-foreground">{batch.itemsCount ?? 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">{t("submissions.bids")}</div>
                        <div className="text-lg font-semibold text-accent flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {batch.bids ?? 0}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 min-h-10 flex-shrink-0 border-accent/20 hover:border-accent hover:bg-accent/5 group-hover:bg-accent/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/submission/message?batchId=${batch.batchId}`);
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {t("nav.chat")}
                        <ArrowUpRight className="w-3.5 h-3.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 min-h-10 flex-shrink-0 border-accent/20 hover:border-accent hover:bg-accent/5 group-hover:bg-accent/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/upload?step=${batch.step}&batchId=${batch.batchId}`);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {t("submissions.view")}
                        <ArrowUpRight className="w-3.5 h-3.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Button>

                      <Button
                        onClick={(e) => handleToggleHighlight(e, batch.batchId)}
                        title={batch.is_highlighted ? "Remove from highlighted" : "Highlight this listing"}
                        className={`h-10 min-h-10 w-10 p-0 rounded-full flex items-center justify-center transition-colors duration-200 ${
                          batch.is_highlighted
                            ? "bg-amber-400 hover:bg-amber-500 text-white"
                            : "bg-amber-50 hover:bg-amber-100 text-amber-500 border border-amber-200"
                        }`}
                      >
                        <Star size={18} fill={batch.is_highlighted ? "currentColor" : "none"} />
                      </Button>

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeactivate(batch.batchId);
                        }}
                        className="h-10 min-h-10 w-10 p-0 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition-colors duration-200"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}


        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
        />



      </div>
    </DashboardLayout>
  );
};

export default Submissions;
