import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, X, ChevronLeft, ChevronRight, TrendingUp, Users, Handshake } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { cn } from "@/lib/utils";
import { useGetSalesLeadsQuery } from "@/rtk/slices/adminApiSlice";

const fmt = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const LEAD_TYPE_BADGE: Record<string, string> = {
  "direct-sales":        "bg-blue-50 text-blue-700 border-blue-200",
  "sell-with-greenbidz": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function StatCard({ label, value, icon: Icon, color, loading }: {
  label: string; value: number; icon: React.ElementType; color: string; loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", color + "/10")}>
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        {loading
          ? <div className="h-7 w-14 bg-gray-100 rounded animate-pulse mt-1" />
          : <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        }
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }: {
  page: number; totalPages: number; onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm text-gray-600">{page} / {totalPages}</span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function AdminSalesLeads() {
  const { t } = useTranslation();
  const { sidebarCollapsed } = useAdminSidebar();

  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [leadType, setLeadType]       = useState("all");
  const [sort, setSort]               = useState("newest");
  const [startDate, setStartDate]     = useState("");
  const [endDate, setEndDate]         = useState("");

  const { data, isLoading, isFetching } = useGetSalesLeadsQuery({
    page,
    limit: 20,
    ...(leadType !== "all" && { lead_type: leadType }),
    ...(search    && { search }),
    sort,
    ...(startDate && { start_date: startDate }),
    ...(endDate   && { end_date: endDate }),
  });

  const handleSearch = () => { setSearch(searchInput.trim()); setPage(1); };
  const clearSearch  = () => { setSearchInput(""); setSearch(""); setPage(1); };
  const loading      = isLoading || isFetching;

  return (
    <div className="flex h-screen bg-gray-50/50 overflow-hidden">
      <AdminSidebar activePath="/admin/sales-leads" />

      <div className={cn("flex-1 flex flex-col min-w-0 transition-all duration-300",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label={t("admin.salesLeads.totalLeads", "Total Leads")}                value={data?.total ?? 0}                        icon={TrendingUp} color="text-purple-600"  loading={loading} />
            <StatCard label={t("admin.salesLeads.directSales", "Direct Sales")}             value={data?.summary?.direct_sales ?? 0}        icon={Users}      color="text-blue-600"    loading={loading} />
            <StatCard label={t("admin.salesLeads.sellWithGreenbidz", "Sell with GreenBidz")} value={data?.summary?.sell_with_greenbidz ?? 0} icon={Handshake}  color="text-emerald-600" loading={loading} />
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("admin.salesLeads.searchPlaceholder", "Search name, company, email, phone...")}
                  className="pl-9 pr-8"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                {searchInput && (
                  <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button onClick={handleSearch} className="shrink-0">{t("admin.salesLeads.search", "Search")}</Button>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <Tabs value={leadType} onValueChange={(v) => { setLeadType(v); setPage(1); }}>
                <TabsList className="h-9">
                  <TabsTrigger value="all"                 className="text-xs px-3">{t("admin.salesLeads.all", "All")}</TabsTrigger>
                  <TabsTrigger value="direct-sales"        className="text-xs px-3">{t("admin.salesLeads.directSales", "Direct Sales")}</TabsTrigger>
                  <TabsTrigger value="sell-with-greenbidz" className="text-xs px-3">{t("admin.salesLeads.sellWithGreenbidz", "Sell with GreenBidz")}</TabsTrigger>
                </TabsList>
              </Tabs>

              <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t("admin.salesLeads.newestFirst", "Newest First")}</SelectItem>
                  <SelectItem value="oldest">{t("admin.salesLeads.oldestFirst", "Oldest First")}</SelectItem>
                </SelectContent>
              </Select>

              <input
                type="date"
                className="h-9 rounded-md border border-input px-3 text-sm bg-white"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              />
              <span className="text-gray-400 text-sm">{t("admin.salesLeads.to", "to")}</span>
              <input
                type="date"
                className="h-9 rounded-md border border-input px-3 text-sm bg-white"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("admin.salesLeads.table.no", "#")}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("admin.salesLeads.table.name", "Name")}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("admin.salesLeads.table.company", "Company")}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("admin.salesLeads.table.email", "Email")}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("admin.salesLeads.table.phone", "Phone")}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("admin.salesLeads.table.type", "Type")}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("admin.salesLeads.table.date", "Date")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : !data?.data?.length ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-gray-400">
                        {t("admin.salesLeads.noLeads", "No sales leads found")}
                      </td>
                    </tr>
                  ) : (
                    data.data.map((lead, i) => (
                      <tr key={lead.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * 20 + i + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{lead.full_name}</td>
                        <td className="px-4 py-3 text-gray-600">{lead.company_name}</td>
                        <td className="px-4 py-3 text-gray-600">{lead.email}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{lead.phone}</td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border",
                            LEAD_TYPE_BADGE[lead.lead_type] ?? "bg-gray-50 text-gray-600 border-gray-200"
                          )}>
                            {lead.lead_type === "direct-sales"
                              ? t("admin.salesLeads.directSales", "Direct Sales")
                              : t("admin.salesLeads.sellWithGreenbidz", "Sell with GreenBidz")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{fmt(lead.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-gray-100">
              <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
