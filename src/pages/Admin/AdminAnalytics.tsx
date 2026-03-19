import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { Menu } from "lucide-react";
import { useGetCategoryStatsQuery, useGetMonthlyStatsQuery, useGetUserGrowthStatsQuery } from "@/rtk/slices/adminStatsApiSlice";
import { useState } from "react";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import NotificationBell from "./AdminNotification";


const colors = [
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--info))",
  "hsl(var(--muted))",
  "hsl(var(--destructive))",
  "hsl(var(--secondary))",
  "hsl(var(--primary))",
  "hsl(var(--foreground))"
];


const AdminAnalytics = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useAdminSidebar();

  // date range
  const today = new Date();
  const currentYear = today.getFullYear();
  const endMonth = today.getMonth() + 1; // 1–12
  const startMonth = Math.max(1, endMonth - 5);

  const [currency, setCurrency] = useState<"USD" | "TWD">("USD");
  const [dropdownOpen, setDropdownOpen] = useState(false);


  const { data: growthRes, isFetching } = useGetUserGrowthStatsQuery({
    year: currentYear,
    startMonth,
    endMonth,
  });

  const { data: categoryRes, isFetching: isCatLoading } = useGetCategoryStatsQuery();


  const { data: monthlyStatsRes, isFetching: isMonthlyStatsLoading } = useGetMonthlyStatsQuery({
    year: currentYear,
    startMonth,
    endMonth,
  })

  // const userGrowth = [
  //   { month: "Jan", buyers: 120, sellers: 45 },
  //   { month: "Feb", buyers: 145, sellers: 52 },
  //   { month: "Mar", buyers: 178, sellers: 61 },
  //   { month: "Apr", buyers: 210, sellers: 73 },
  //   { month: "May", buyers: 245, sellers: 82 },
  //   { month: "Jun", buyers: 289, sellers: 95 },
  // ];

  const userGrowth =
    growthRes?.data?.monthly_data?.map((m: any) => ({
      month: m.month_name || `${m.month}`,
      buyers: m.buyers || 0,
      sellers: m.sellers || 0,
    })) ??
    [

      { month: "M1", buyers: 0, sellers: 0 },
      { month: "M2", buyers: 0, sellers: 0 },
      { month: "M3", buyers: 0, sellers: 0 },
      { month: "M4", buyers: 0, sellers: 0 },
      { month: "M5", buyers: 0, sellers: 0 },
      { month: "M6", buyers: 0, sellers: 0 },
    ];

  // const categoryData = [
  //   { name: "Industrial Equipment", value: 35, color: "hsl(var(--accent))" },
  //   { name: "Construction", value: 25, color: "hsl(var(--success))" },
  //   { name: "Manufacturing", value: 20, color: "hsl(var(--warning))" },
  //   { name: "Automotive", value: 15, color: "hsl(var(--info))" },
  //   { name: "Others", value: 5, color: "hsl(var(--muted))" },
  // ];





  const categoryData =
    (categoryRes as any)?.categories?.map((c: any, index: number) => ({
      name: c.category.replace(/&amp;/g, "&"),
      value: c.percentage,
      count: c.count,
      color: colors[index % colors.length], // loop through colors if more categories
    })) || [];


  const revenueData =
    monthlyStatsRes?.months?.map((m: any) => {
      const monthName = new Date(m.year, m.month - 1).toLocaleString("en", {
        month: "short",
      });

      return {
        month: monthName,
        USD: m.currencies?.USD?.total_amount || 0,
        TWD: m.currencies?.TWD?.total_amount || 0,
      };
    }) ?? [];



  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background">
      <AdminSidebar activePath="/admin/analytics" />

      <div
        className={cn(
          "transition-all duration-300 min-h-screen flex flex-col overflow-hidden",
          // Desktop: margin based on sidebar collapsed state
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
          // Mobile: no margin (sidebar is overlay)
          "ml-0"
        )}
      >
        {/* Mobile header with menu button */}
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
              <span className="text-lg font-semibold">{t('admin.analytics.title')}</span>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Desktop header */}
        <header className="hidden lg:flex bg-card border-b px-6 py-4 items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{t('admin.analytics.titleFull')}</h1>
          <div className="flex gap-2">

          <NotificationBell/>
          <LanguageSwitcher/>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.analytics.totalRevenue')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">${(monthlyStatsRes as any)?.totalRevenueByCurrency?.USD?.toLocaleString() || 0}
                  <span className="text-xs text-gray-400 font-normal">(USD Revenue)</span>
                </div>
                <div className="text-2xl font-bold text-accent"> NT${(monthlyStatsRes as any)?.totalRevenueByCurrency?.TWD?.toLocaleString() || 0}
                  <span className="text-xs text-gray-400 font-normal">(TWD Revenue)</span>
                </div>
                {/* <span>
          ${monthlyStatsRes?.totalRevenueByCurrency?.USD?.toLocaleString() || 0}
        </span> */}
                {/* <div className="flex items-center gap-1 text-sm text-success mt-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>{t('admin.analytics.vsLastMonth', { percent: '12.5' })}</span>
                </div> */}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.analytics.activeUsers')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">   {(growthRes?.data as any)?.total_active_buyers || 0}</div>
                {/* <div className="flex items-center gap-1 text-sm text-success mt-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>{t('admin.analytics.vsLastMonth', { percent: '8.2' })}</span>
                </div> */}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium  text-muted-foreground">{t('admin.analytics.conversionRate')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-info">{(growthRes?.data as any)?.total_active_sellers || 0}</div>
                {/* <div className="flex items-center gap-1 text-sm text-destructive mt-1">
                  <TrendingDown className="h-4 w-4" />
                  <span>{t('admin.analytics.vsLastMonthNegative', { percent: '2.1' })}</span>
                </div> */}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.analytics.userGrowth')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userGrowth}>
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
                    <Line type="monotone" dataKey="buyers" stroke="hsl(var(--accent))" strokeWidth={2} />
                    <Line type="monotone" dataKey="sellers" stroke="hsl(var(--success))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.analytics.categoryDistribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={120} // slightly bigger radius for clarity
                      innerRadius={50}  // optional: makes it a donut chart for space
                      label={({ name, value }) =>
                        `${name.length > 27 ? name.slice(0, 12) + "…" : name} ${value}%`
                      }
                      labelLine={false}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value}%`, name]} // full name in tooltip
                    />
                  </PieChart>

                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
                <CardTitle>{t('admin.analytics.revenueTrend')}</CardTitle>
            </CardHeader>

            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />

                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === "USD") return [`$${value.toLocaleString()}`, "USD Revenue"];
                      if (name === "TWD") return [`NT$${value.toLocaleString()}`, "TWD Revenue"];
                      return [value, name];
                    }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />

                  {/* USD BAR */}
                  <Bar
                    dataKey="USD"
                    name="USD Revenue"
                    fill="hsl(var(--accent))"
                    radius={[6, 6, 0, 0]}
                  />

                  {/* TWD BAR */}
                  <Bar
                    dataKey="TWD"
                    name="TWD Revenue"
                    fill="hsl(var(--success))"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>


          </Card>



        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
