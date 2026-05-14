// @ts-nocheck
import { useGetSellerReportQuery } from "@/rtk/slices/batchApiSlice";
import { SITE_TYPE } from "@/config/site";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Download, FileText, TrendingUp, Loader2 } from "lucide-react";
import { useLazyGetBatchExcelQuery } from "@/rtk/slices/bidApiSlice";
import { saveAs } from "file-saver";
import { useState } from "react";
import axios from "axios";

// Map raw batch statuses → human label + on-brand color theme.
// Any unknown status falls back to the "default" entry below.
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string; border: string }> = {
  publish: {
    label: "Published",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
  published: {
    label: "Published",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
  live_for_bids: {
    label: "Live for Bids",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    border: "border-blue-200",
  },
  sold: {
    label: "Sold",
    bg: "bg-purple-50",
    text: "text-purple-700",
    dot: "bg-purple-500",
    border: "border-purple-200",
  },
  inspection_schedule: {
    label: "Inspection Scheduled",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    border: "border-amber-200",
  },
  deactivated: {
    label: "Deactivated",
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
    border: "border-gray-200",
  },
  pending: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    border: "border-amber-200",
  },
};
const DEFAULT_STATUS = {
  label: "Unknown",
  bg: "bg-gray-50",
  text: "text-gray-600",
  dot: "bg-gray-400",
  border: "border-gray-200",
};

const getStatusConfig = (status: string | undefined | null) => {
  if (!status) return DEFAULT_STATUS;
  return STATUS_CONFIG[String(status).toLowerCase()] || DEFAULT_STATUS;
};

const formatReportDate = (raw: string | undefined | null) => {
  if (!raw) return "—";
  const first = String(raw).split(",")[0]?.trim();
  if (!first) return "—";
  const d = new Date(first);
  if (isNaN(d.getTime())) return first;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const Reports = () => {
  const { t } = useTranslation();

  // Use companySellerId for data (company-level), fallback to userId
  const companySellerId = localStorage.getItem("companySellerId") || localStorage.getItem("userId");
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const limit = 10;

  const { data: reportData, isLoading, isFetching, isError } = useGetSellerReportQuery({
    page,
    limit,
    sellerId: companySellerId,
  });


  const downloadExcel = async (batchId: number) => {
    setDownloadingId(batchId);
    try {
      const baseUrl = import.meta.env.VITE_PRODUCTION_URL || "";
      const url = `${baseUrl}reports/batch/${batchId}/excel?type=${SITE_TYPE}`;
      const response = await axios.get(url, { responseType: "blob" });
      saveAs(response.data, `batch-${batchId}-report.xlsx`);
    } catch (err) {
      console.error("Error downloading Excel:", err);
    } finally {
      setDownloadingId(null);
    }
  };




  const [triggerExcel] = useLazyGetBatchExcelQuery();

  const reports = reportData?.data?.map((batch) => {
    const categories = batch.products?.map((p) => p.category) || [];
    const displayCategories =
      categories.length > 2
        ? categories.slice(0, 2).join(", ") + ", ..."
        : categories.join(", ");

    const postDates = batch.products?.map((p) => p.post_date).filter(Boolean) || [];
    const reportDates = batch.products?.map((p) => p.report_date).filter(Boolean) || [];

    return {
      id: `BATCH-${batch.batch_id}`,
      batchId: `BATCH-${batch.batch_id}`,
      batch_id: batch.batch_id,
      category: displayCategories,
      postDate: postDates.join(", "),
      reportDate: reportDates.join(", "),
      status: batch.status,
      downloadUrls: batch.products?.map((p) => p.images).flat() || [],
    };
  }) || [];

  if (isLoading || isFetching) {
    return (
      <DashboardLayout>
        <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-accent"></div>
          <p className="text-muted-foreground text-sm animate-pulse">Loading reports...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <Card className="max-w-md w-full border-destructive/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Error Loading Reports</h3>
                <p className="text-muted-foreground text-sm">{t('reports.errorLoading')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Real status breakdown across the current page (instead of the broken
  // "Completed / Pending" counters that never matched any actual status value).
  const statusBreakdown = reports.reduce<Record<string, number>>((acc, r) => {
    const key = String(r.status || "unknown").toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const totalPages = reportData?.pagination?.total_pages || 1;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('reports.recentReports')}</h1>
            <p className="text-muted-foreground mt-1">{t('reports.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-card border rounded-lg px-4 py-2 shadow-sm">
              <div className="text-xs text-muted-foreground">{t("reports.totalReports")}</div>

              <div className="text-2xl font-bold">{reports.length}</div>
            </div>
            {/* <div className="bg-accent/10 border border-accent/20 rounded-lg px-4 py-2 shadow-sm">
              <div className="text-xs text-accent/70">Completed</div>
              <div className="text-2xl font-bold text-accent">{completedReports}</div>
            </div> */}
          </div>
        </div>

        {/* Main Table Card */}
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                {t("reports.overview")}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-1.5">
                {Object.entries(statusBreakdown).length === 0 ? (
                  <span className="text-xs text-muted-foreground">{t("reports.noReports")}</span>
                ) : (
                  Object.entries(statusBreakdown).map(([statusKey, count]) => {
                    const cfg = getStatusConfig(statusKey);
                    return (
                      <span
                        key={statusKey}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {count} {cfg.label}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b-2 border-border">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-foreground text-sm tracking-wide w-14">#</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground text-sm tracking-wide">
                      {t('submissions.batchId')}
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground text-sm tracking-wide">
                      {t('submissions.category')}
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground text-sm tracking-wide">
                      {t('submissions.posted', 'Date')}
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground text-sm tracking-wide">
                      {t('submissions.status')}
                    </th>
                    <th className="text-center py-4 px-6 font-semibold text-foreground text-sm tracking-wide">
                      {t('submissions.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reports.map((report, index) => {
                    const cfg = getStatusConfig(report.status);
                    const rowNumber = (page - 1) * limit + index + 1;
                    const isDownloading = downloadingId === report.batch_id;
                    return (
                      <tr
                        key={report.id}
                        className="hover:bg-muted/20 transition-all duration-200 group"
                      >
                        <td className="py-4 px-6">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold text-xs">
                            {rowNumber}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-mono text-sm font-medium text-foreground">
                            {report.batchId}
                          </span>
                        </td>
                        <td className="py-4 px-6 max-w-[260px]">
                          <span className="text-sm text-muted-foreground block truncate" title={report.category || "N/A"}>
                            {report.category || "N/A"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-muted-foreground tabular-nums">
                            {formatReportDate(report.postDate)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isDownloading}
                              onClick={() => downloadExcel(report.batch_id)}
                            >
                              {isDownloading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  {t('reports.downloading', 'Downloading…')}
                                </>
                              ) : (
                                <>
                                  <Download className="w-4 h-4" />
                                  {t('reports.download')}
                                </>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-muted-foreground font-medium">
                              {t('reports.noReports')}
                            </p>
                            <p className="text-sm text-muted-foreground/70 mt-1">
                              {t('reports.noReportsHint', 'Reports will appear here once they are generated')}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end items-center gap-2 p-4 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
                {t('reports.prev', 'Prev')}
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums px-2">
                {t('reports.pageOf', { page, total: totalPages, defaultValue: 'Page {page} of {total}' })}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              >
                {t('reports.next', 'Next')}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>




          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reports;