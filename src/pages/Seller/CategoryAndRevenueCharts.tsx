import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { useTranslation } from "react-i18next";
import { useGetCategoryStatsQuery, useGetMonthlyStatsQuery } from "@/rtk/slices/adminStatsApiSlice";

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

interface CategoryAndRevenueChartsProps {
    year?: number;
    startMonth?: number;
    endMonth?: number;
}

const CategoryAndRevenueCharts: React.FC<CategoryAndRevenueChartsProps> = ({
    year,
    startMonth,
    endMonth,
}) => {
    const { t } = useTranslation();


    const sellerId = Number(localStorage.getItem("userId") || 0);

    // Fetch category stats
    const { data: categoryRes } = useGetCategoryStatsQuery({ sellerId: 574 });




    // Fetch monthly revenue stats
    //   const { data: monthlyStatsRes } = useGetMonthlyStatsQuery({
    //     year,
    //     startMonth,
    //     endMonth,
    //   });


    const { data: monthlyStatsRes, isError: monthlyError } = useGetMonthlyStatsQuery(
        { year, startMonth, endMonth, sellerId },
        { skip: !sellerId }
    );

    // Transform category data for PieChart
    const categoryData = useMemo(() => {
        return (categoryRes as any)?.categories?.map((c: any, index: number) => ({
            name: c.category.replace(/&amp;/g, "&"),
            value: c.percentage,
            count: c.count,
            color: colors[index % colors.length],
        })) || [];
    }, [categoryRes]);

    // Transform monthly revenue data for BarChart
    const revenueData = useMemo(() => {
        return monthlyStatsRes?.months?.map((m: any) => {
            const monthName = new Date(m.year, m.month - 1).toLocaleString("en", {
                month: "short",
            });

            return {
                month: monthName,
                USD: m.currencies?.USD?.total_amount || 0,
                TWD: m.currencies?.TWD?.total_amount || 0,
            };
        }) || [];
    }, [monthlyStatsRes]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution Pie Chart */}
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
                                outerRadius={120}
                                innerRadius={50} // donut chart
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
                                formatter={(value, name) => [`${value}%`, name]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Revenue Trend Bar Chart */}
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
                            <Bar dataKey="USD" name="USD Revenue" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="TWD" name="TWD Revenue" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

export default CategoryAndRevenueCharts;
