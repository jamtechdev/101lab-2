import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  Calendar,
  BarChart3,
  Store,
  Menu,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Package,
  CheckSquare,
  ShoppingCart,
  Activity,
} from "lucide-react";
import { format, subMonths } from "date-fns";
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
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { toastError } from "@/helper/toasterNotification";

import {
  useGetAdminDashboardStatsQuery,
  useGetMonthlyStatsQuery,
} from "@/rtk/slices/adminStatsApiSlice";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import NotificationBell from "./AdminNotification";

interface ChartData {
  month: string;
  transactions: number;
  amount: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState("thisMonth");
  const { setSidebarOpen } = useAdminSidebar();

  const getRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    switch (dateRange) {
      case "thisMonth":
        return { year, startMonth: month, endMonth: month };
      case "lastMonth": {
        const lastMonth = month === 1 ? 12 : month - 1;
        const lastMonthYear = month === 1 ? year - 1 : year;
        return { year: lastMonthYear, startMonth: lastMonth, endMonth: lastMonth };
      }
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

  const {
    data: dashboardStats,
    isLoading: statsLoading,
    isError: statsError,
  } = useGetAdminDashboardStatsQuery({ year, startMonth, endMonth });

  const {
    data: monthlyStats,
    isLoading: monthlyLoading,
    isError: monthlyError,
  } = useGetMonthlyStatsQuery({ year, startMonth, endMonth });

  const loading = statsLoading || monthlyLoading;

  useEffect(() => {
    if (statsError) toastError("Failed to load dashboard stats");
    if (monthlyError) toastError("Failed to load monthly stats");
  }, [statsError, monthlyError]);

  const chartData: ChartData[] = useMemo(() => {
    if (!monthlyStats?.months) {
      const months: ChartData[] = [];
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        months.push({ month: format(date, "MMM"), transactions: 0, amount: 0 });
      }
      return months;
    }

    const mapped = monthlyStats.months.map((m) => {
      const currencies = m.currencies || {};
      const usd = currencies["USD"];
      const firstKey = Object.keys(currencies)[0];
      const fallback = currencies[firstKey];
      const transactions = usd?.transaction_count ?? fallback?.transaction_count ?? 0;
      const amount = usd?.total_amount ?? fallback?.total_amount ?? 0;
      return { month: format(new Date(m.year, m.month - 1, 1), "MMM"), transactions, amount };
    });

    if (mapped.length >= 12) return mapped.slice(-12);

    const last12: ChartData[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const label = format(date, "MMM");
      const found = mapped.find((m) => m.month === label);
      last12.push(found ?? { month: label, transactions: 0, amount: 0 });
    }
    return last12;
  }, [monthlyStats]);

  const newSellers = dashboardStats?.data?.newSellers ?? 0;
  const newBuyers = dashboardStats?.data?.newBuyers ?? 0;
  const inspectionsScheduled = dashboardStats?.data?.inspectionsScheduled ?? 0;
  const transactionsCompleted = dashboardStats?.data?.transactionsCompleted ?? 0;
  const pendingListingApprovals = dashboardStats?.data?.pendingListingApprovals ?? 0;
  const pendingSellerUpgrades = dashboardStats?.data?.pendingSellerUpgrades ?? 0;
  const totalPendingActions = pendingListingApprovals + pendingSellerUpgrades;

  const dateRangeLabel =
    dateRange === "thisMonth"
      ? "This Month"
      : dateRange === "lastMonth"
        ? "Last Month"
        : dateRange === "last3Months"
          ? "Last 3 Months"
          : dateRange === "last6Months"
            ? "Last 6 Months"
            : "This Year";


  // Skeleton while loading - preserves original design exactly
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 lg:pl-[280px]">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading dashboard…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AdminSidebar />

      <div className="lg:pl-[280px]">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              <p className="text-xs text-gray-400 hidden sm:block">GreenBidz Admin — {format(new Date(), "EEEE, d MMM yyyy")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="last3Months">Last 3 Months</option>
              <option value="last6Months">Last 6 Months</option>
              <option value="thisYear">This Year</option>
            </select>
            <LanguageSwitcher />
          </div>
        </header>

        <div className="p-6 space-y-6">

          {/* ── Action Required Banner ── */}
          {totalPendingActions > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-amber-800">
                  Action Required — {totalPendingActions} item{totalPendingActions !== 1 ? "s" : ""} need your attention
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {pendingListingApprovals > 0 && (
                  <button
                    onClick={() => navigate("/admin/listings?approvalStatus=pending")}
                    className="flex items-center gap-2 bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm hover:bg-amber-50 transition-colors group"
                  >
                    <Package className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-gray-800">
                      <span className="text-amber-700 font-bold">{pendingListingApprovals}</span> listing{pendingListingApprovals !== 1 ? "s" : ""} awaiting approval
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-amber-600 transition-colors" />
                  </button>
                )}
                {pendingSellerUpgrades > 0 && (
                  <button
                    onClick={() => navigate("/admin/seller-upgrade-requests")}
                    className="flex items-center gap-2 bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm hover:bg-amber-50 transition-colors group"
                  >
                    <CheckSquare className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-gray-800">
                      <span className="text-amber-700 font-bold">{pendingSellerUpgrades}</span> seller upgrade{pendingSellerUpgrades !== 1 ? "s" : ""} to review
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-amber-600 transition-colors" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── KPI Cards ── */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">{dateRangeLabel}</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500">New Sellers</span>
                  <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center">
                    <Store className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">{newSellers}</div>
                <p className="text-xs text-gray-400 mt-1">Registered sellers</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500">New Buyers</span>
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                    <UserCheck className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">{newBuyers}</div>
                <p className="text-xs text-gray-400 mt-1">Registered buyers</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500">Inspections</span>
                  <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">{inspectionsScheduled}</div>
                <p className="text-xs text-gray-400 mt-1">Scheduled visits</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500">Transactions</span>
                  <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="h-4 w-4 text-orange-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">{transactionsCompleted}</div>
                <p className="text-xs text-gray-400 mt-1">Completed payments</p>
              </div>
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => navigate("/admin/listings")}
              className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-2 hover:shadow-md hover:border-green-200 transition-all text-left group"
            >
              <Package className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
              <span className="text-sm font-medium text-gray-700">All Listings</span>
              <span className="text-xs text-gray-400">View & approve</span>
            </button>
            <button
              onClick={() => navigate("/admin/sellers")}
              className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-2 hover:shadow-md hover:border-blue-200 transition-all text-left group"
            >
              <Store className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              <span className="text-sm font-medium text-gray-700">Sellers</span>
              <span className="text-xs text-gray-400">Manage accounts</span>
            </button>
            <button
              onClick={() => navigate("/admin/buyers")}
              className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-2 hover:shadow-md hover:border-purple-200 transition-all text-left group"
            >
              <Users className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              <span className="text-sm font-medium text-gray-700">Buyers</span>
              <span className="text-xs text-gray-400">Manage accounts</span>
            </button>
            <button
              onClick={() => navigate("/admin/offers")}
              className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-2 hover:shadow-md hover:border-orange-200 transition-all text-left group"
            >
              <Activity className="h-5 w-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
              <span className="text-sm font-medium text-gray-700">Offers & Orders</span>
              <span className="text-xs text-gray-400">View activity</span>
            </button>
          </div>

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <h3 className="text-sm font-semibold text-gray-800">Transactions Over Time</h3>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="transactions"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={{ fill: "#16a34a", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-800">Transaction Amount (USD)</h3>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: 12 }}
                    formatter={(value: number) => [`$${(value / 1000).toFixed(1)}K`, "Amount"]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Last updated: {format(new Date(), "PPpp")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
