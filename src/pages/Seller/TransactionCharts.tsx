import { useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { TrendingUp, BarChart3 } from "lucide-react";
import { subMonths, format } from "date-fns";
import { useGetMonthlyStatsQuery } from "@/rtk/slices/adminStatsApiSlice";
import { toastError } from "@/helper/toasterNotification";

interface ChartData {
  month: string;
  transactions: number;
  amount: number;
}

interface TransactionChartsProps {
  dateRange?: "thisMonth" | "lastMonth" | "last3Months" | "last6Months" | "thisYear";
}

const TransactionCharts: React.FC<TransactionChartsProps> = ({ dateRange = "thisMonth" }) => {
  const { t } = useTranslation();

const sellerId = Number(localStorage.getItem("userId") || 0);
  // Helper to convert dateRange -> API params
  const getRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

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


  

  // RTK query
//   const { data: monthlyStats, isError: monthlyError } = useGetMonthlyStatsQuery({ year, startMonth, endMonth,sellerId });


  const { data: monthlyStats, isError: monthlyError } = useGetMonthlyStatsQuery(
  { year, startMonth, endMonth, sellerId },
  { skip: !sellerId } 
);

  if (monthlyError) {
    toastError(t("admin.common.failedToLoad") || "Failed to load monthly stats");
  }

  // Transform monthlyStats into ChartData[]
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
      const firstCurrencyKey = Object.keys(currencies)[0];
      const fallback = currencies[firstCurrencyKey];

      const transactions = usd?.transaction_count ?? fallback?.transaction_count ?? 0;
      const amount = usd?.total_amount ?? fallback?.total_amount ?? 0;

      return {
        month: format(new Date(m.year, m.month - 1, 1), "MMM"),
        transactions,
        amount,
      };
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Transactions Completed Line Chart */}
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
  );
};

export default TransactionCharts;
