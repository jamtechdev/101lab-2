// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  CheckCircle2,
  Clock,
  Globe,
  Loader2,
  Search,
  Gavel,
  Languages,
  Package,
  Users,
  Calendar,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
  Star,
  Layers,
} from "lucide-react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { cn } from "@/lib/utils";
import { toastError, toastSuccess } from "@/helper/toasterNotification";
import {
  useGetAdminAuctionGroupsQuery,
  useApproveAuctionGroupMutation,
  useSetAuctionGroupFeaturedMutation,
  AdminAuctionGroupItem,
} from "@/rtk/slices/adminApiSlice";

// ─── Platform options (same as AdminListings) ────────────────────────────────
const PLATFORMS = [
  { value: "greenbidz", label: "GreenBidz" },
  { value: "recycle", label: "Recycle" },
  { value: "LabGreenbidz", label: "Lab-GreenBidz" },
  { value: "machines", label: "Machines" },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  trend?: string;
}) => (
  <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-background to-muted/30">
    <div className={`absolute top-0 right-0 w-40 h-40 ${color} opacity-5 rounded-full -mr-20 -mt-20 group-hover:opacity-10 transition-opacity`} />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`p-2.5 rounded-xl ${color} bg-opacity-15 group-hover:bg-opacity-20 transition-all`}>
        <Icon className={`h-5 w-5 ${color.replace("bg-", "text-")}`} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex items-baseline gap-2">
        <div className={`text-4xl font-bold ${color.replace("bg-", "text-")}`}>{value}</div>
        {trend && <span className="text-xs text-muted-foreground font-medium">{trend}</span>}
      </div>
    </CardContent>
  </Card>
);

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const GroupSkeleton = () => (
  <Card className="border-2">
    <CardContent className="p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      </div>
    </CardContent>
  </Card>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminAuctionGroups = () => {
  const { sidebarCollapsed } = useAdminSidebar();
  const [platformType, setPlatformType] = useState("recycle");
  const [approvalFilter, setApprovalFilter] = useState<"all" | "pending" | "approved">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [featuringId, setFeaturingId] = useState<number | null>(null);

  const { data, isLoading, isFetching, isError, refetch } = useGetAdminAuctionGroupsQuery({
    approval_status: approvalFilter,
    site_id: platformType,
  });

  const [approveAuctionGroup] = useApproveAuctionGroupMutation();
  const [setAuctionGroupFeatured] = useSetAuctionGroupFeaturedMutation();

  const groups: AdminAuctionGroupItem[] = data?.data ?? [];

  // Derived stats
  const stats = useMemo(() => ({
    total: groups.length,
    pending: groups.filter((g) => g.approval_status === "pending").length,
    approved: groups.filter((g) => g.approval_status === "approved").length,
    featured: groups.filter((g) => g.featured_type !== "none").length,
  }), [groups]);

  // Client-side search + sort
  const filtered = useMemo(() => {
    let list = [...groups];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          String(g.group_id).includes(q) ||
          String(g.seller_id).includes(q) ||
          g.country?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? db - da : da - db;
    });

    return list;
  }, [groups, searchQuery, sortOrder]);

  const handleApprove = async (groupId: number) => {
    setApprovingId(groupId);
    try {
      await approveAuctionGroup(groupId).unwrap();
      toastSuccess("Auction group approved — seller notified by email");
      refetch();
    } catch (err: any) {
      toastError(err?.data?.message || "Failed to approve auction group");
    } finally {
      setApprovingId(null);
    }
  };

  const handleToggleFeatured = async (group: AdminAuctionGroupItem) => {
    const next = group.featured_type === "none" ? "featured" : "none";
    setFeaturingId(group.group_id);
    try {
      await setAuctionGroupFeatured({ groupId: group.group_id, featured_type: next }).unwrap();
      toastSuccess(next === "featured" ? "Group marked as featured" : "Group removed from featured");
      refetch();
    } catch (err: any) {
      toastError(err?.data?.message || "Failed to update featured status");
    } finally {
      setFeaturingId(null);
    }
  };

  const toggleExpand = (id: number) => setExpanded(expanded === id ? null : id);

  // ─── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-background via-background to-muted/20">
        <AdminSidebar activePath="/admin/auction-groups" />
        <div className={cn("transition-all duration-300 min-h-screen overflow-y-auto", sidebarCollapsed ? "lg:ml-16" : "lg:ml-64", "ml-0")}>
          <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-0 shadow-lg">
                  <CardHeader className="pb-3"><Skeleton className="h-4 w-24" /></CardHeader>
                  <CardContent><Skeleton className="h-10 w-16" /></CardContent>
                </Card>
              ))}
            </div>
            <Card className="shadow-sm border-0">
              <CardContent className="space-y-4 p-6">
                {[1, 2, 3].map((i) => <GroupSkeleton key={i} />)}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error state ────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-background">
        <AdminSidebar activePath="/admin/auction-groups" />
        <div className={cn("transition-all duration-300 min-h-screen flex justify-center items-center", sidebarCollapsed ? "lg:ml-16" : "lg:ml-64", "ml-0")}>
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
              <CardDescription>Failed to fetch auction groups.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <AdminSidebar activePath="/admin/auction-groups" />

      <div className={cn("transition-all duration-300 min-h-screen overflow-y-auto", sidebarCollapsed ? "lg:ml-16" : "lg:ml-64", "ml-0")}>
        <AdminHeader />

        <div className="p-4 lg:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">

          {/* ── HEADER + PLATFORM SWITCHER ────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Gavel className="h-7 w-7 text-primary" />
                Auction Groups
              </h1>
              <p className="text-muted-foreground mt-1">
                Review and approve seller auction groups before they go live on the website.
              </p>
            </div>

            {/* Platform switcher — same style as AdminListings */}
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 px-4 py-3 shadow-sm">
              <span className="block text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                Platform
              </span>
              <Tabs
                value={platformType}
                onValueChange={(val) => { setPlatformType(val); setExpanded(null); }}
                className="w-auto"
              >
                <TabsList className="h-10 bg-muted/80 border border-border">
                  {PLATFORMS.map((p) => (
                    <TabsTrigger
                      key={p.value}
                      value={p.value}
                      className="px-4 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      {p.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* ── STAT CARDS ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard title="Total Groups"    value={stats.total}    icon={Layers}        color="bg-blue-500"   />
            <StatCard title="Pending Approval" value={stats.pending}  icon={Clock}         color="bg-amber-500"  trend={stats.pending > 0 ? "needs review" : undefined} />
            <StatCard title="Approved"         value={stats.approved} icon={CheckCircle2}  color="bg-emerald-500" trend={`${stats.total ? Math.round((stats.approved / stats.total) * 100) : 0}%`} />
            <StatCard title="Featured"         value={stats.featured} icon={Star}          color="bg-violet-500" />
          </div>

          {/* ── SEARCH + FILTERS ─────────────────────────────────────────── */}
          <Card className="shadow-sm border-0 bg-gradient-to-r from-background to-muted/30">
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, group ID, seller ID, country…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 border-2 focus:border-primary/50"
                  />
                  {searchQuery && (
                    <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchQuery("")}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
                {/* Approval filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Approval</span>
                  <Tabs value={approvalFilter} onValueChange={(v) => setApprovalFilter(v as any)} className="w-auto">
                    <TabsList className="h-9">
                      <TabsTrigger value="all"      className="px-3 text-xs">All</TabsTrigger>
                      <TabsTrigger value="pending"  className="px-3 text-xs">Pending</TabsTrigger>
                      <TabsTrigger value="approved" className="px-3 text-xs">Approved</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sort</span>
                  <Tabs value={sortOrder} onValueChange={(v) => setSortOrder(v as any)} className="w-auto">
                    <TabsList className="h-9">
                      <TabsTrigger value="newest" className="px-3 text-xs">Newest</TabsTrigger>
                      <TabsTrigger value="oldest" className="px-3 text-xs">Oldest</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── GROUP LIST ───────────────────────────────────────────────── */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl font-bold">All Auction Groups</CardTitle>
                    {filtered.length > 0 && (
                      <Badge variant="secondary" className="ml-2">{filtered.length}</Badge>
                    )}
                  </div>
                  <CardDescription className="mt-2 flex items-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    {filtered.length} group{filtered.length !== 1 ? "s" : ""} found
                    {approvalFilter !== "all" && ` · filtered by ${approvalFilter}`}
                  </CardDescription>
                </div>
                {isFetching && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Updating…</span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {isFetching && !isLoading ? (
                <div className="space-y-4">{[1, 2].map((i) => <GroupSkeleton key={i} />)}</div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="p-4 rounded-full bg-muted/50 mb-4">
                    <Gavel className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No auction groups found</h3>
                  <p className="text-muted-foreground max-w-md">
                    {searchQuery || approvalFilter !== "all"
                      ? "Try adjusting your search or filters."
                      : "No auction groups have been created on this platform yet."}
                  </p>
                  {(searchQuery || approvalFilter !== "all") && (
                    <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(""); setApprovalFilter("all"); }}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                filtered.map((group) => {
                  const isExpanded = expanded === group.group_id;
                  const isPending = group.approval_status === "pending";

                  return (
                    <Card
                      key={group.group_id}
                      className="group border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl overflow-hidden bg-gradient-to-br from-card to-muted/20"
                    >
                      <CardContent className="p-0">
                        <div className="p-6">
                          {/* ── Row header ── */}
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-3 flex-wrap">
                                <h3 className="text-2xl font-bold text-foreground tracking-tight">
                                  Group #{group.group_id}
                                </h3>
                                {/* Approval badge */}
                                {isPending ? (
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                                    Pending approval
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                                    Approved
                                  </Badge>
                                )}
                                {/* Status badge */}
                                <Badge variant="secondary" className="capitalize">
                                  {group.status}
                                </Badge>
                                {/* Featured badge */}
                                {group.featured_type !== "none" && (
                                  <Badge className="bg-violet-100 text-violet-700 border-violet-200" variant="outline">
                                    <Star className="h-3 w-3 mr-1" />
                                    {group.featured_type}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-lg font-semibold text-foreground mb-1 line-clamp-1">
                                {group.title}
                              </p>
                              {group.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">{group.description}</p>
                              )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                              {isPending && (
                                <Button
                                  size="sm"
                                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => handleApprove(group.group_id)}
                                  disabled={approvingId === group.group_id}
                                >
                                  {approvingId === group.group_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                  Approve
                                </Button>
                              )}
                              {platformType === "LabGreenbidz" && (
                                <Button
                                  size="sm"
                                  variant={group.featured_type !== "none" ? "default" : "outline"}
                                  className={
                                    group.featured_type !== "none"
                                      ? "gap-2 bg-violet-600 hover:bg-violet-700 text-white border-0"
                                      : "gap-2 border-violet-400 text-violet-600 hover:bg-violet-50 hover:border-violet-600 dark:hover:bg-violet-950"
                                  }
                                  onClick={() => handleToggleFeatured(group)}
                                  disabled={featuringId === group.group_id}
                                >
                                  {featuringId === group.group_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Star className={`h-4 w-4 ${group.featured_type !== "none" ? "fill-white" : ""}`} />
                                  )}
                                  {group.featured_type !== "none" ? "Remove from Featured" : "Mark as Featured"}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => toggleExpand(group.group_id)}
                                className="flex-shrink-0 hover:bg-primary/10 hover:border-primary/50 transition-all"
                              >
                                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                              </Button>
                            </div>
                          </div>

                          {/* ── Details grid (always visible) ── */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t">
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                              <div className="p-1.5 rounded-md bg-background">
                                <Users className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground font-medium mb-0.5">Seller ID</p>
                                <p className="text-sm font-semibold">{group.seller_id}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                              <div className="p-1.5 rounded-md bg-background">
                                <Globe className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground font-medium mb-0.5">Country</p>
                                <p className="text-sm font-semibold">{group.country}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                              <div className="p-1.5 rounded-md bg-background">
                                <Package className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground font-medium mb-0.5">Auctions</p>
                                <p className="text-sm font-semibold">{group.auction_count ?? 0}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                              <div className="p-1.5 rounded-md bg-background">
                                <Calendar className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground font-medium mb-0.5">Created</p>
                                <p className="text-sm font-semibold">{new Date(group.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ── Expanded section ── */}
                        {isExpanded && (
                          <div className="border-t bg-gradient-to-br from-muted/40 to-muted/20 p-6 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Gavel className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="text-lg font-bold">Group Details</h4>
                                <p className="text-sm text-muted-foreground">Full information for this auction group</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Title (EN) */}
                              <div className="p-4 rounded-xl border bg-background/80 space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title (EN)</p>
                                <p className="text-sm font-semibold">{group.title_en || group.title || "—"}</p>
                              </div>
                              {/* Title (ZH) */}
                              {group.title_zh && (
                                <div className="p-4 rounded-xl border bg-background/80 space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title (ZH)</p>
                                  <p className="text-sm font-semibold">{group.title_zh}</p>
                                </div>
                              )}
                              {/* Title (JA) */}
                              {group.title_ja && (
                                <div className="p-4 rounded-xl border bg-background/80 space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title (JA)</p>
                                  <p className="text-sm font-semibold">{group.title_ja}</p>
                                </div>
                              )}
                              {/* Title (TH) */}
                              {group.title_th && (
                                <div className="p-4 rounded-xl border bg-background/80 space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title (TH)</p>
                                  <p className="text-sm font-semibold">{group.title_th}</p>
                                </div>
                              )}
                              {/* Languages */}
                              <div className="p-4 rounded-xl border bg-background/80 space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                  <Languages className="h-3 w-3" /> Languages
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Array.isArray(group.languages) && group.languages.length > 0
                                    ? group.languages.map((l: string, i: number) => (
                                        <Badge key={i} variant="secondary" className="text-xs">{l}</Badge>
                                      ))
                                    : <span className="text-sm text-muted-foreground">—</span>
                                  }
                                </div>
                              </div>
                              {/* Featured type */}
                              <div className="p-4 rounded-xl border bg-background/80 space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                  <Star className="h-3 w-3" /> Featured Type
                                </p>
                                <Badge
                                  variant="outline"
                                  className={group.featured_type !== "none"
                                    ? "bg-violet-100 text-violet-700 border-violet-200 mt-1"
                                    : "mt-1 capitalize"}
                                >
                                  {group.featured_type}
                                </Badge>
                              </div>
                              {/* Slug */}
                              {group.slug && (
                                <div className="p-4 rounded-xl border bg-background/80 space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Slug</p>
                                  <p className="text-sm font-mono text-primary">{group.slug}</p>
                                </div>
                              )}
                              {/* Description */}
                              {group.description && (
                                <div className="p-4 rounded-xl border bg-background/80 space-y-1 md:col-span-2 lg:col-span-3">
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</p>
                                  <p className="text-sm">{group.description}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminAuctionGroups;
