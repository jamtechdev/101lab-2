import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  BarChart3,
  Store,
  Menu,
  Download,
  TrendingUp,
} from "lucide-react";
import { format, subMonths } from "date-fns";
import { toast } from "react-hot-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { toastError } from "@/helper/toasterNotification";
import { useTranslation } from "react-i18next";

import {
  useGetAdminDashboardStatsQuery,
  useGetMonthlyStatsQuery,
} from "@/rtk/slices/adminStatsApiSlice";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import NotificationBell from "./AdminNotification";

interface KPIData {
  newSellers: number;
  newBuyers: number;
  inspectionsScheduled: number;
  transactionsCompleted: number;
  transactionAmount?: number;
}

interface ChartData {
  month: string;
  transactions: number;
  amount: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dateRange, setDateRange] = useState("thisMonth");

  const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useAdminSidebar();

  // Helper to convert dateRange -> API params
  const getRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12

    switch (dateRange) {
      case "thisMonth":
        return { year, startMonth: month, endMonth: month };
      case "lastMonth":
        const lastMonth = month === 1 ? 12 : month - 1;
        const lastMonthYear = month === 1 ? year - 1 : year;
        return { year: lastMonthYear, startMonth: lastMonth, endMonth: lastMonth };
      case "last3Months":
        return { year, startMonth: Math.max(1, month - 2), endMonth: month };
      case "last6Months":
        return { year, startMonth: Math.max(1, month - 5), endMonth: month };
      case "thisYear":
        return { year, startMonth: 1, endMonth: 12 };
      default:
        return { year, startMonth: 1, endMonth: 12 };
    }
  };

  const { year, startMonth, endMonth } = getRange();

  // RTK Queries
  const {
    data: dashboardStats,
    isLoading: statsLoading,
    isFetching: statsFetching,
    isError: statsError,
  } = useGetAdminDashboardStatsQuery({ year, startMonth, endMonth });

  const {
    data: monthlyStats,
    isLoading: monthlyLoading,
    isFetching: monthlyFetching,
    isError: monthlyError,
  } = useGetMonthlyStatsQuery({ year, startMonth, endMonth });

  const loading = statsLoading || monthlyLoading || statsFetching || monthlyFetching;

  useEffect(() => {
    if (statsError) {
      toastError(t("admin.common.failedToLoad") || "Failed to load dashboard stats");
    }
    if (monthlyError) {
      toastError(t("admin.common.failedToLoad") || "Failed to load monthly stats");
    }
  }, [statsError, monthlyError, t]);

  // Transform monthlyStats into ChartData[]
  const chartData: ChartData[] = useMemo(() => {
    if (!monthlyStats?.months) {
      // fallback to 12 months of labels (keeps design consistent)
      const months: ChartData[] = [];
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        months.push({ month: format(date, "MMM"), transactions: 0, amount: 0 });
      }
      return months;
    }

    const mapped = monthlyStats.months.map((m) => {
      // Prefer currencies.USD if exists, otherwise try first currency available
      const currencies = m.currencies || {};
      const usd = currencies["USD"];
      const firstCurrencyKey = Object.keys(currencies)[0];
      const fallback = currencies[firstCurrencyKey];

      const transactions = usd?.transaction_count ?? fallback?.transaction_count ?? 0;
      const amount = usd?.total_amount ?? fallback?.total_amount ?? 0;

      return {
        month: format(new Date(m.year, m.month - 1, 1), "MMM"),
        transactions,
        amount,
      } as ChartData;
    });

    // If API returned fewer months than UI expects, pad with zeros for last months
    if (mapped.length >= 12) return mapped.slice(-12);

    // Build a last-12-months array and fill from mapped using month label match
    const last12 = [] as ChartData[];
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const label = format(date, "MMM");
      const found = mapped.find((m) => m.month === label);
      last12.push(found ?? { month: label, transactions: 0, amount: 0 });
    }

    return last12;
  }, [monthlyStats]);

  // KPI data from API
  const kpiData: KPIData = {
    newSellers: dashboardStats?.data?.newSellers ?? 0,
    newBuyers: dashboardStats?.data?.newBuyers ?? 0,
    inspectionsScheduled: dashboardStats?.data?.inspectionsScheduled ?? 0,
    transactionsCompleted: dashboardStats?.data?.transactionsCompleted ?? 0,
    transactionAmount: (dashboardStats?.data as any)?.transactionAmount ?? 0,
  };


  // Skeleton while loading - preserves original design exactly
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('admin.dashboard.loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar activePath="/admin" />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
        {/* Header */}
        <header className="bg-card border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">{t("admin.dashboard.title")}</h1>
          </div>


          <div className="flex items-center gap-4">

            <NotificationBell />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="thisMonth">{t("admin.dashboard.dateRange.thisMonth")}</option>
              <option value="lastMonth">{t("admin.dashboard.dateRange.lastMonth")}</option>
              <option value="last3Months">{t("admin.dashboard.dateRange.last3Months")}</option>
              <option value="last6Months">{t("admin.dashboard.dateRange.last6Months")}</option>
              <option value="thisYear">{t("admin.dashboard.dateRange.thisYear")}</option>
            </select>
            <LanguageSwitcher />
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6   ">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card className="hover:shadow-accent transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("admin.dashboard.newSellersRegistered")}
                </CardTitle>
                <Store className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">{kpiData.newSellers}</div>
                <p className="text-xs text-muted-foreground mt-1">{t("admin.dashboard.thisMonth")}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-accent transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("admin.dashboard.newBuyersRegistered")}
                </CardTitle>
                <UserCheck className="h-5 w-5 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">{kpiData.newBuyers}</div>
                <p className="text-xs text-muted-foreground mt-1">{t("admin.dashboard.thisMonth")}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-accent transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("admin.dashboard.inspectionsScheduled")}
                </CardTitle>
                <Calendar className="h-5 w-5 text-info" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-info">{kpiData.inspectionsScheduled}</div>
                <p className="text-xs text-muted-foreground mt-1">{t("admin.dashboard.thisMonth")}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-accent transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("admin.dashboard.transactionsCompleted")}
                </CardTitle>
                <DollarSign className="h-5 w-5 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-warning">{kpiData.transactionsCompleted}</div>
                {/* <p className="text-xs text-muted-foreground mt-1">
                  Total Amount: {(kpiData.transactionAmount / 1000).toFixed(0)}
                </p> */}
                <p className="text-xs text-muted-foreground mt-1">{t("admin.dashboard.thisMonth")}</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Transactions Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  {t("admin.dashboard.transactionsCompletedChart")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="transactions"
                      stroke="hsl(var(--accent))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--accent))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Transaction Amount Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-success" />
                  {t("admin.dashboard.transactionAmountChart")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => `$${(value / 1000).toFixed(0)}K`}
                    />
                    <Legend />
                    <Bar dataKey="amount" fill="hsl(var(--success))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {t("admin.common.lastUpdated")}: {format(new Date(), "PPpp")}
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {t("admin.common.exportCsv")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
