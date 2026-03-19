// @ts-nocheck
import { useGetSellerReportQuery } from "@/rtk/slices/batchApiSlice";
import { SITE_TYPE } from "@/config/site";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Download, FileText, TrendingUp } from "lucide-react";
import { useLazyGetBatchExcelQuery } from "@/rtk/slices/bidApiSlice";
import { saveAs } from "file-saver";
import { useState } from "react";
import axios from "axios";

const Reports = () => {
  const { t } = useTranslation();

  // Use companySellerId for data (company-level), fallback to userId
  const companySellerId = localStorage.getItem("companySellerId") || localStorage.getItem("userId");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: reportData, isLoading, isFetching, isError } = useGetSellerReportQuery({
    page,
    limit,
    sellerId: companySellerId,
  });


  const downloadExcel = async (batchId: number) => {
    try {
      const baseUrl = import.meta.env.VITE_PRODUCTION_URL || "";
      const url = `${baseUrl}reports/batch/${batchId}/excel?type=${SITE_TYPE}`;

      const response = await axios.get(url, {
        responseType: "blob", // important: tells Axios to treat response as binary
      });

      // Save file using file-saver
      saveAs(response.data, `batch-${batchId}-report.xlsx`);

    } catch (err) {
      console.error("Error downloading Excel:", err);
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

  const completedReports = reports.filter(r => r.status === "Completed").length;
  const pendingReports = reports.filter(r => r.status === "Pending").length;

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
              <div className="text-sm text-muted-foreground">
                {completedReports} {t("reports.completed")}, {pendingReports} {t("reports.pending")}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b-2 border-border">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-foreground text-sm tracking-wide">
                      {t('reports.reportId')}
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground text-sm tracking-wide">
                      {t('submissions.batchId')}
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground text-sm tracking-wide">
                      {t('submissions.category')}
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
                  {reports.map((report, index) => (
                    <tr
                      key={report.id}
                      className="hover:bg-muted/20 transition-all duration-200 group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm">
                            {index + 1}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-sm font-medium text-foreground">
                          {report.batchId}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-muted-foreground">
                          {report.category || "N/A"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${report.status === "Completed"
                            ? "bg-accent/15 text-accent border border-accent/30"
                            : "bg-muted text-muted-foreground border border-border"
                            }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${report.status === "live_for_bids" ? "bg-accent" : "bg-muted-foreground"
                            }`}></span>
                          {report.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadExcel(report.batch_id)}
                          >
                            <Download className="w-4 h-4" />
                            {t('reports.download')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-muted-foreground font-medium">
                              {t('reports.noReports')}
                            </p>
                            <p className="text-sm text-muted-foreground/70 mt-1">
                              Reports will appear here once they are generated
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end items-center gap-2 mt-4">
              <Button
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next
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