import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/layouts/DashboardLayout";

type SalesType = "all" | "direct-sales" | "sell-with-greenbidz";

interface SalesRecord {
  id: string;
  name: string;
  owner?: string;
  contact?: string;
  phoneCode?: string;
  email?: string;
  salesOwner?: string;
  meetingDate?: string;
  meetingAttendee?: string;
  city?: string;
  comment?: string;
  companyName?: string;
  fullName?: string;
  phone?: string;
  postCode?: string;
  country?: string;
  industry?: string;
  offer?: string;
  type: "direct-sales" | "sell-with-greenbidz";
  createdAt?: string;
}

const MondaySalesSync = () => {
  const [salesType, setSalesType] = useState<SalesType>("all");
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const MONDAY_API_TOKEN = import.meta.env.VITE_MONDAY_API_TOKEN;
  const DIRECT_SALES_BOARD_ID = import.meta.env.VITE_MONDAY_DIRECT_SALES_BOARD_ID;
  const GREENBIDZ_BOARD_ID = import.meta.env.VITE_MONDAY_GREENBIDZ_BOARD_ID;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["mondaySalesData"],
    queryFn: async () => {
      if (!MONDAY_API_TOKEN) {
        throw new Error("Monday.com API token not configured");
      }

      const boardIds = [];
      if (DIRECT_SALES_BOARD_ID) boardIds.push(DIRECT_SALES_BOARD_ID);
      if (GREENBIDZ_BOARD_ID) boardIds.push(GREENBIDZ_BOARD_ID);

      if (boardIds.length === 0) {
        throw new Error("No board IDs configured");
      }

      const query = `
        query {
          boards(ids: [${boardIds.join(",")}]) {
            id
            name
            groups {
              id
              title
            }
            columns {
              id
              title
              type
            }
            items_page(limit: 500) {
              items {
                id
                name
                group {
                  id
                  title
                }
                column_values {
                  id
                  text
                  value
                }
              }
            }
          }
        }
      `;

      const response = await fetch("https://api.monday.com/v2", {
        method: "POST",
        headers: {
          Authorization: MONDAY_API_TOKEN,
          "Content-Type": "application/json",
          "API-Version": "2024-01",
        },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Failed to fetch from Monday");
      }

      const boards = result.data?.boards || [];
      if (!boards.length) {
        throw new Error("No boards found");
      }

      const parsed: SalesRecord[] = [];

      boards.forEach((board: any) => {
        const isDirectSalesBoard = board.id === DIRECT_SALES_BOARD_ID;
        const boardType = isDirectSalesBoard ? "direct-sales" : "sell-with-greenbidz";

        const columnMap: Record<string, string> = {};
        board.columns?.forEach((col: any) => {
          columnMap[col.id] = col.title?.toLowerCase().trim() || "";
        });

        let targetGroupId: string | null = null;
        if (isDirectSalesBoard) {
          const powerSellerGroup = board.groups?.find((g: any) =>
            g.title?.toLowerCase().includes("power seller") ||
            g.title?.toLowerCase().includes("direct-sales")
          );
          targetGroupId = powerSellerGroup?.id || null;
          console.log(`[${boardType}] Target group: ${powerSellerGroup?.title} (${targetGroupId})`);
        } else {
          const wtsGroup = board.groups?.find((g: any) =>
            g.title?.toLowerCase().includes("wts") ||
            g.title?.toLowerCase().includes("apply to wts")
          );
          targetGroupId = wtsGroup?.id || null;
          console.log(`[${boardType}] Target group: ${wtsGroup?.title} (${targetGroupId})`);
        }

        console.log(`[${boardType}] Board columns:`, columnMap);

        let items = board.items_page?.items || [];

        if (targetGroupId) {
          const itemsBefore = items.length;
          items = items.filter((item: any) => item.group?.id === targetGroupId);
          console.log(`[${boardType}] Filtered from ${itemsBefore} to ${items.length} items in target group`);
        }

        items.forEach((item: any) => {
          const record: SalesRecord = {
            id: item.id,
            name: item.name,
            type: boardType,
          };

          item.column_values?.forEach((col: any) => {
            const title = columnMap[col.id] || "";
            const value = col.text || col.value || "";

            if (!value) return;

            const titleLower = title.toLowerCase();

            if (titleLower.includes("contact") && !titleLower.includes("email")) record.owner = value;
            if (titleLower.includes("sales") && titleLower.includes("owner")) record.salesOwner = value;
            if (titleLower.includes("email") || titleLower === "email 电邮") record.email = value;
            if (titleLower.includes("phone")) record.phone = value;
            if (titleLower.includes("code")) record.phoneCode = value;
            if (titleLower.includes("city") || titleLower === "city 城市") record.city = value;
            if (titleLower.includes("meeting") && titleLower.includes("date")) record.meetingDate = value;
            if (titleLower.includes("meeting") && titleLower.includes("attendee")) record.meetingAttendee = value;
            if (titleLower.includes("comment") || titleLower === "comment 備註") record.comment = value;

            if (titleLower.includes("deal") && titleLower.includes("name")) record.companyName = value;
            if (titleLower.includes("company")) record.companyName = value;
            if (titleLower.includes("contact") && (titleLower.includes("person") || titleLower.includes("name"))) record.fullName = value;
            if (titleLower.includes("postcode") || titleLower.includes("post code")) record.postCode = value;
            if (titleLower.includes("country")) record.country = value;
            if (titleLower.includes("industri")) record.industry = value;
            if (titleLower.includes("offer") || titleLower.includes("description")) record.comment = value;
          });

          parsed.push(record);
        });
      });

      return parsed;
    },
    enabled: !!MONDAY_API_TOKEN && (!!DIRECT_SALES_BOARD_ID || !!GREENBIDZ_BOARD_ID),
    staleTime: 0,
  });

  useEffect(() => {
    if (data) {
      setRecords(data);
    }
  }, [data]);

  const filteredRecords =
    salesType === "all"
      ? records
      : records.filter((r) => r.type === salesType);

  const handleRefresh = async () => {
    toast.loading("Refreshing data...", { id: "refresh" });
    await refetch();
    toast.dismiss("refresh");
    toast.success("Data refreshed!");
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="bg-destructive/5 border border-destructive/30 rounded-lg p-6">
              <h2 className="text-destructive font-semibold mb-2">Error Loading Data</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Sales Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredRecords.length} record{filteredRecords.length !== 1 ? "s" : ""} • Synced from Monday.com
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Select value={salesType} onValueChange={(val) => setSalesType(val as SalesType)}>
                <SelectTrigger className="w-full sm:w-72 bg-background border-border">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sales ({records.length})</SelectItem>
                  <SelectItem value="direct-sales">
                    Direct Sales ({records.filter(r => r.type === "direct-sales").length})
                  </SelectItem>
                  <SelectItem value="sell-with-greenbidz">
                    Sell with GreenBidz ({records.filter(r => r.type === "sell-with-greenbidz").length})
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleRefresh}
                disabled={isLoading}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Table Section */}
          {isLoading && !records.length ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">Loading data from Monday.com...</p>
              </div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="bg-white dark:bg-slate-950 rounded-lg border border-border p-12 text-center">
              <p className="text-muted-foreground">No records found</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-950 rounded-xl border border-border shadow-sm overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wider">Details</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-foreground/70 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="hover:bg-muted/40 transition-colors duration-200 group"
                      >
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            record.type === "direct-sales"
                              ? "bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              : "bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          }`}>
                            {record.type === "direct-sales" ? "Direct Sales" : "GreenBidz"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-foreground text-sm">{record.name}</div>
                          {record.owner && <div className="text-xs text-muted-foreground mt-1">{record.owner}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={`mailto:${record.email}`}
                            className="text-sm text-primary hover:underline"
                          >
                            {record.email || "—"}
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-foreground">
                            {record.phoneCode && record.contact
                              ? `${record.phoneCode} ${record.contact}`
                              : record.phone || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-foreground">
                            {record.city || record.postCode ? (
                              <>
                                {record.city && <div>{record.city}</div>}
                                {record.country && <div className="text-xs text-muted-foreground">{record.country}</div>}
                              </>
                            ) : (
                              "—"
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {record.comment || record.industry || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() =>
                              setExpandedRow(expandedRow === record.id ? null : record.id)
                            }
                            className="inline-flex items-center justify-center p-2 hover:bg-muted rounded-lg transition-colors"
                          >
                            <ChevronDown
                              className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
                                expandedRow === record.id ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3 p-4">
                {filteredRecords.map((record) => (
                  <div
                    key={record.id}
                    className="border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <button
                      onClick={() =>
                        setExpandedRow(expandedRow === record.id ? null : record.id)
                      }
                      className="w-full p-4 flex items-center justify-between hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          record.type === "direct-sales"
                            ? "bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            : "bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        }`}>
                          {record.type === "direct-sales" ? "Sales" : "GreenBidz"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-foreground text-sm truncate">{record.name}</div>
                          <div className="text-xs text-muted-foreground">{record.email || record.phone || "No contact"}</div>
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground flex-shrink-0 ml-2 transition-transform duration-300 ${
                          expandedRow === record.id ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {expandedRow === record.id && (
                      <div className="border-t border-border bg-muted/30 p-4 space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                        {record.owner && (
                          <div>
                            <p className="text-xs text-muted-foreground font-semibold">Owner</p>
                            <p className="text-sm text-foreground">{record.owner}</p>
                          </div>
                        )}
                        {record.email && (
                          <div>
                            <p className="text-xs text-muted-foreground font-semibold">Email</p>
                            <a href={`mailto:${record.email}`} className="text-sm text-primary hover:underline">
                              {record.email}
                            </a>
                          </div>
                        )}
                        {(record.phoneCode || record.contact || record.phone) && (
                          <div>
                            <p className="text-xs text-muted-foreground font-semibold">Phone</p>
                            <p className="text-sm text-foreground">
                              {record.phoneCode && record.contact
                                ? `${record.phoneCode} ${record.contact}`
                                : record.phone}
                            </p>
                          </div>
                        )}
                        {(record.city || record.country || record.postCode) && (
                          <div>
                            <p className="text-xs text-muted-foreground font-semibold">Location</p>
                            <p className="text-sm text-foreground">
                              {[record.city, record.postCode, record.country].filter(Boolean).join(", ")}
                            </p>
                          </div>
                        )}
                        {record.comment && (
                          <div>
                            <p className="text-xs text-muted-foreground font-semibold">Comment</p>
                            <p className="text-sm text-foreground line-clamp-3">{record.comment}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Expanded Row Details (Desktop) */}
              {expandedRow && (
                <div className="hidden md:block bg-muted/30 border-t border-border p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {(() => {
                      const record = filteredRecords.find(r => r.id === expandedRow);
                      if (!record) return null;

                      return (
                        <>
                          {record.type === "direct-sales" ? (
                            <>
                              {record.owner && (
                                <div>
                                  <p className="text-xs text-muted-foreground font-semibold mb-1">Owner</p>
                                  <p className="text-sm text-foreground">{record.owner}</p>
                                </div>
                              )}
                              {record.salesOwner && (
                                <div>
                                  <p className="text-xs text-muted-foreground font-semibold mb-1">Sales Owner</p>
                                  <p className="text-sm text-foreground">{record.salesOwner}</p>
                                </div>
                              )}
                              {record.meetingDate && (
                                <div>
                                  <p className="text-xs text-muted-foreground font-semibold mb-1">Meeting Date</p>
                                  <p className="text-sm text-foreground">{record.meetingDate}</p>
                                </div>
                              )}
                              {record.meetingAttendee && (
                                <div>
                                  <p className="text-xs text-muted-foreground font-semibold mb-1">Meeting Attendee</p>
                                  <p className="text-sm text-foreground">{record.meetingAttendee}</p>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              {record.companyName && (
                                <div>
                                  <p className="text-xs text-muted-foreground font-semibold mb-1">Company</p>
                                  <p className="text-sm text-foreground">{record.companyName}</p>
                                </div>
                              )}
                              {record.fullName && (
                                <div>
                                  <p className="text-xs text-muted-foreground font-semibold mb-1">Contact Person</p>
                                  <p className="text-sm text-foreground">{record.fullName}</p>
                                </div>
                              )}
                              {record.industry && (
                                <div>
                                  <p className="text-xs text-muted-foreground font-semibold mb-1">Industry</p>
                                  <p className="text-sm text-foreground">{record.industry}</p>
                                </div>
                              )}
                            </>
                          )}
                          {record.comment && (
                            <div className="col-span-2 md:col-span-4">
                              <p className="text-xs text-muted-foreground font-semibold mb-1">Details</p>
                              <p className="text-sm text-foreground line-clamp-3">{record.comment}</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Stats */}
          {filteredRecords.length > 0 && (
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Records",
                  value: filteredRecords.length,
                  color: "text-blue-600 dark:text-blue-400",
                },
                {
                  label: "Direct Sales",
                  value: filteredRecords.filter(r => r.type === "direct-sales").length,
                  color: "text-blue-600 dark:text-blue-400",
                },
                {
                  label: "GreenBidz Sales",
                  value: filteredRecords.filter(r => r.type === "sell-with-greenbidz").length,
                  color: "text-green-600 dark:text-green-400",
                },
                {
                  label: "Last Synced",
                  value: new Date().toLocaleTimeString(),
                  color: "text-gray-600 dark:text-gray-400",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-950 rounded-lg border border-border p-4 text-center hover:shadow-md transition-shadow"
                >
                  <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MondaySalesSync;
