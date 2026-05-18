// @ts-nocheck
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Package,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Hash,
  Globe,
  BadgeCheck,
  Crown,
  Loader2,
} from "lucide-react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AdminHeader from "./AdminHeader";
import {
  useGetAdminUserDetailsQuery,
  useUpdateUserStatusMutation,
} from "@/rtk/slices/adminApiSlice";
import { useSetSellerPowerStatusMutation } from "@/rtk/slices/apiSlice";
import {
  useGetBuyerFullDetailsQuery,
  useGetBuyerBidsQuery,
  useGetBuyerInspectionsQuery,
} from "@/rtk/slices/buyerApiSlice";
import { useGetBatchesBySellerQuery } from "@/rtk/slices/productSlice";
import { extractValuesFromPhpSerialized } from "@/utils/parsePhpSerializedUrl";

// ── helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
};

const fmtCurrency = (v: number | string | null | undefined, cur = "USD") => {
  const n = Number(v) || 0;
  if (cur === "TWD") return `NT$${n.toLocaleString()}`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
};

const getInitials = (name?: string | null) => {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
};

// ── Status & Type Badges ──────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status?: string | null }) => {
  const s = String(status || "").toLowerCase();
  if (s === "approved" || s === "active")
    return <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1"><CheckCircle2 className="h-3 w-3" />Approved</span>;
  if (s === "pending")
    return <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-1"><Clock className="h-3 w-3" />Pending</span>;
  if (s === "deactive" || s === "suspended" || s === "inactive")
    return <span className="inline-flex items-center gap-1 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-full px-2.5 py-1"><XCircle className="h-3 w-3" />Inactive</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 rounded-full px-2.5 py-1"><AlertCircle className="h-3 w-3" />{status || "Unknown"}</span>;
};

const UserTypeBadge = ({ type }: { type?: string | null }) => {
  const t = String(type || "").toLowerCase();
  if (t === "seller")
    return <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1"><Package className="h-3 w-3" />Seller</span>;
  if (t === "buyer")
    return <span className="inline-flex items-center gap-1 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2.5 py-1"><ShoppingCart className="h-3 w-3" />Buyer</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 rounded-full px-2.5 py-1"><User className="h-3 w-3" />{type || "User"}</span>;
};

const BidStatusBadge = ({ status }: { status: string }) => {
  const s = status?.toLowerCase();
  if (s === "accepted") return <span className="text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5">Accepted</span>;
  if (s === "pending")  return <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5">Pending</span>;
  if (s === "rejected") return <span className="text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-full px-2.5 py-0.5">Rejected</span>;
  if (s === "counter_offer") return <span className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5">Counter Offer</span>;
  return <span className="text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 rounded-full px-2.5 py-0.5 capitalize">{status || "—"}</span>;
};

const BatchStatusBadge = ({ status }: { status: string }) => {
  const s = status?.toLowerCase();
  if (s === "sold")                  return <span className="text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5">Sold</span>;
  if (s === "publish")               return <span className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5">Published</span>;
  if (s === "live_for_bids")         return <span className="text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2.5 py-0.5">Live for Bids</span>;
  if (s === "inspection_schedule")   return <span className="text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-0.5">Inspection</span>;
  if (s === "deactive")              return <span className="text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200 rounded-full px-2.5 py-0.5">Inactive</span>;
  if (s === "under_review")          return <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5">Under Review</span>;
  return <span className="text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 rounded-full px-2.5 py-0.5 capitalize">{status?.replace(/_/g, " ") || "—"}</span>;
};

// ── Stat Card (matches seller-upgrade page style) ─────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, sub }: { label: string; value: number | string; icon: React.ElementType; color: string; sub?: string }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${color}/10`}>
      <Icon className={`h-5 w-5 ${color}`} />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  </div>
);

// ── Info Row ──────────────────────────────────────────────────────────────────
const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="h-3.5 w-3.5 text-gray-400" />
    </div>
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-0.5 break-all">{value || "—"}</p>
    </div>
  </div>
);

// ── Pagination ────────────────────────────────────────────────────────────────
const Pager = ({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) => {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <Button variant="outline" size="sm" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm text-gray-600">{page} / {total}</span>
      <Button variant="outline" size="sm" onClick={() => onChange(page + 1)} disabled={page >= total}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const AdminUserDetails = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const id = Number(userId);

  const [tab, setTab] = useState<"overview" | "bids" | "listings" | "inspections">("overview");
  const [bidPage, setBidPage] = useState(1);
  const [listingPage, setListingPage] = useState(1);
  const [inspectionPage, setInspectionPage] = useState(1);

  // ── API calls ──────────────────────────────────────────────────────────────
  const { data: userResp, isLoading: userLoading, refetch } = useGetAdminUserDetailsQuery(id, { skip: !id });
  const { data: buyerResp, isLoading: buyerLoading } = useGetBuyerFullDetailsQuery(id, { skip: !id });
  const { data: bidsResp,  isLoading: bidsLoading }  = useGetBuyerBidsQuery({ buyerId: id, page: bidPage, limit: 10 }, { skip: !id || tab !== "bids" });
  const { data: inspResp,  isLoading: inspLoading }  = useGetBuyerInspectionsQuery({ buyerId: id, page: inspectionPage, limit: 10 }, { skip: !id || tab !== "inspections" });
  const { data: batchResp, isLoading: batchLoading } = useGetBatchesBySellerQuery({ sellerId: String(id), page: listingPage }, { skip: !id || tab !== "listings" });

  const [updateStatus, { isLoading: statusUpdating }] = useUpdateUserStatusMutation();
  const [setPowerStatus, { isLoading: isSavingPower }] = useSetSellerPowerStatusMutation();

  // ── Derived ────────────────────────────────────────────────────────────────
  const user       = userResp?.data;
  const meta       = user?.meta || {};
  const buyerRaw   = buyerResp?.data;
  const buyerInfo  = Array.isArray(buyerRaw?.buyer) ? buyerRaw.buyer[0] : buyerRaw?.buyer;
  const buyerStats = buyerRaw?.stats;

  const rawBatchData: any = batchResp?.data;
  const sellerStats = {
    total_listings: rawBatchData?.stats?.total_listings ?? 0,
    total_sold:     rawBatchData?.stats?.total_sold     ?? 0,
    total_live:     rawBatchData?.stats?.total_live     ?? 0,
  };

  const company = user?.company || meta.greenbidz_company || null;
  const country = user?.country || meta.greenbidz_address_country || null;
  const platform = meta.site_id || meta.platform || meta.greenbidz_platform || null;

  const documentLinks = useMemo(() => {
    const docs = user?.documents || {};
    const items: { label: string; urls: string[] }[] = [];
    const add = (label: string, raw?: string | null) => {
      if (!raw) return;
      const urls = extractValuesFromPhpSerialized(raw);
      if (urls.length) items.push({ label, urls });
    };
    add("Waste Disposal Permit", docs.waste_disposal_permit ?? null);
    add("Business Registration Certificate", docs.business_reg_certificate ?? null);
    return items;
  }, [user?.documents]);

  const rawBatches: any[] = (() => {
    if (Array.isArray(rawBatchData?.batches)) return rawBatchData.batches;
    if (Array.isArray(rawBatchData?.data))    return rawBatchData.data;
    return [];
  })();

  const handleStatusChange = async (newStatus: "approved" | "pending") => {
    if (!user) return;
    try {
      await updateStatus({ userId: id, status: newStatus }).unwrap();
      toast.success(`Status updated to ${newStatus}`);
      refetch();
    } catch {
      toast.error("Failed to update status");
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <AdminSidebar />
        <div className="lg:pl-[280px]">
          <AdminHeader />
          <div className="p-4 md:p-6 space-y-5">
            <Skeleton className="h-8 w-40 rounded-xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <AdminSidebar />
        <div className="lg:pl-[280px]">
          <AdminHeader />
          <div className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[60vh]">
            <AlertCircle className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">User not found</p>
            <button onClick={() => navigate(-1)} className="mt-3 text-sm text-green-600 hover:underline">← Go back</button>
          </div>
        </div>
      </div>
    );
  }

  const currentStatus = String(user.status || "").toLowerCase();
  const isSeller = String(user.user_type || "").toLowerCase() === "seller";
  // Power Seller status is stored in jos_usermeta — see docs/POWER_SELLER.md.
  // Backend serializes meta as a flat object on `user.meta` (e.g. `meta.is_power_seller`).
  const isPowerSeller = String(meta?.is_power_seller ?? user.is_power_seller ?? "0") === "1";
  const tabs = [
    { key: "overview",     label: "Overview" },
    { key: "bids",         label: "Bids" },
    { key: "listings",     label: "Listings" },
    { key: "inspections",  label: "Inspections" },
  ] as const;

  // ── Power Seller toggle (admin-only, sellers only) ──────────────────────────
  // NOTE: `setPowerStatus` is destructured from the mutation hook hoisted to
  // the top of the component (see near the userLoading checks) to keep hook
  // order stable across renders. Do not move this hook back down here.
  const handleTogglePowerSeller = async () => {
    if (!id) return;
    const next = !isPowerSeller;
    const confirm = window.confirm(
      next
        ? "Grant Power Seller status to this seller?"
        : "Revoke Power Seller status from this seller?"
    );
    if (!confirm) return;
    try {
      await setPowerStatus({ sellerId: id, is_power_seller: next }).unwrap();
      toast.success(next ? "Power Seller status granted" : "Power Seller status revoked");
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update Power Seller status");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AdminSidebar />
      <div className="lg:pl-[280px]">
        <AdminHeader />

        <main className="p-4 md:p-6 space-y-5">

          {/* ── Page Header ── */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
              <p className="text-sm text-gray-500 mt-0.5">Full profile, activity and history</p>
            </div>
          </div>

          {/* ── Identity Card ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">

              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 select-none">
                {getInitials(user.name)}
              </div>

              {/* Name + Badges + Info grid */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-gray-900">{user.name || "—"}</h2>
                  <StatusBadge status={user.status} />
                  <UserTypeBadge type={user.user_type} />
                  {isSeller && isPowerSeller && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-1">
                      <Crown className="h-3 w-3" />Power Seller
                    </span>
                  )}
                  {platform && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 rounded-full px-2.5 py-1">
                      <Globe className="h-3 w-3" />{platform}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mb-5">ID #{id} · Member since {fmtDate(user.registered_at)}</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                  <InfoItem icon={Mail}      label="Email"      value={user.email} />
                  <InfoItem icon={Phone}     label="Phone"      value={user.phone} />
                  <InfoItem icon={Building2} label="Company"    value={company} />
                  <InfoItem icon={MapPin}    label="Country"    value={country} />
                  <InfoItem icon={Calendar}  label="Registered" value={fmtDate(user.registered_at)} />
                  {user.companyTaxIdNumber && (
                    <InfoItem icon={Hash} label="Tax ID" value={user.companyTaxIdNumber} />
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex sm:flex-col gap-2 flex-shrink-0">
                {currentStatus !== "approved" && (
                  <button
                    onClick={() => handleStatusChange("approved")}
                    disabled={statusUpdating}
                    className="text-xs font-semibold bg-green-500 hover:bg-green-600 text-white rounded-xl px-4 py-2 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    Approve
                  </button>
                )}
                {currentStatus === "approved" && (
                  <button
                    onClick={() => handleStatusChange("pending")}
                    disabled={statusUpdating}
                    className="text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl px-4 py-2 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    Set Pending
                  </button>
                )}
                {isSeller && (
                  <button
                    onClick={handleTogglePowerSeller}
                    disabled={isSavingPower}
                    className={
                      isPowerSeller
                        ? "text-xs font-semibold bg-white border border-amber-200 hover:bg-amber-50 text-amber-700 rounded-xl px-4 py-2 transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5 justify-center"
                        : "text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-4 py-2 transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5 justify-center"
                    }
                    title={isPowerSeller ? "Revoke Power Seller status" : "Grant Power Seller status"}
                  >
                    {isSavingPower
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <Crown className="h-3 w-3" />}
                    {isPowerSeller ? "Revoke Power" : "Make Power Seller"}
                  </button>
                )}
                <button
                  onClick={() => refetch()}
                  className="text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl px-4 py-2 transition-colors flex items-center gap-1.5 justify-center"
                >
                  <RefreshCw className="h-3 w-3" /> Refresh
                </button>
              </div>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          {buyerLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard label="Bids Placed"     value={buyerStats?.total_bids    ?? 0} icon={TrendingUp}    color="text-blue-600" />
              <StatCard label="Bids Won"         value={buyerStats?.accepted_bids ?? 0} icon={CheckCircle2}  color="text-green-600" />
              <StatCard label="Total Bid Value"   value={fmtCurrency(buyerStats?.total_amount_bid)} icon={DollarSign} color="text-emerald-600" />
              <StatCard label="Total Listings"   value={sellerStats.total_listings}          icon={Package}     color="text-indigo-600" />
              <StatCard label="Sold"             value={sellerStats.total_sold}              icon={BadgeCheck}  color="text-purple-600" />
              <StatCard label="Live Now"         value={sellerStats.total_live}              icon={ShoppingCart} color="text-orange-500" />
            </div>
          )}

          {/* ── Tabs ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Tab bar */}
            <div className="flex border-b border-gray-100 px-5">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                    tab === t.key
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-5">

              {/* ── Overview ── */}
              {tab === "overview" && (
                <div className="space-y-6">

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Buyer Activity</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Total Bids",   value: buyerStats?.total_bids    ?? 0 },
                        { label: "Accepted",     value: buyerStats?.accepted_bids ?? 0 },
                        { label: "Rejected",     value: buyerStats?.rejected_bids ?? 0 },
                        { label: "Total Wins",   value: buyerStats?.total_wins    ?? 0 },
                      ].map(s => (
                        <div key={s.label} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                          <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                          <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Seller Activity</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { label: "Total Listings",  value: sellerStats.total_listings },
                        { label: "Sold",            value: sellerStats.total_sold },
                        { label: "Currently Live",  value: sellerStats.total_live },
                      ].map(s => (
                        <div key={s.label} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                          <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                          <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Account Info */}
                  {(user.member_id || user.user_login || meta.timezone || meta.currency) && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Account Info</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {user.member_id  && <InfoItem icon={Hash}     label="Member ID" value={user.member_id} />}
                        {user.user_login && <InfoItem icon={User}     label="Username"  value={user.user_login} />}
                        {meta.timezone   && <InfoItem icon={Calendar} label="Timezone"  value={meta.timezone} />}
                        {meta.currency   && <InfoItem icon={DollarSign} label="Currency" value={meta.currency} />}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {documentLinks.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Documents</p>
                      <div className="space-y-2">
                        {documentLinks.map(d => (
                          <div key={d.label} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                            <p className="text-xs font-medium text-gray-600 mb-2">{d.label}</p>
                            <div className="flex flex-wrap gap-2">
                              {d.urls.map(u => (
                                <a key={u} href={u} target="_blank" rel="noreferrer" className="text-xs text-green-600 hover:underline break-all">{u}</a>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Bids ── */}
              {tab === "bids" && (
                <div>
                  {bidsLoading ? (
                    <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
                  ) : (() => {
                    const items: any[] = bidsResp?.data?.data ?? [];
                    if (!items.length)
                      return (
                        <div className="text-center py-16">
                          <ShoppingCart className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                          <p className="text-sm text-gray-400">No bids found</p>
                        </div>
                      );
                    return (
                      <>
                        <div className="space-y-3">
                          {items.map((bid: any, i: number) => (
                            <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                              <img
                                src={bid.products?.[0]?.images?.[0] || "/placeholder.svg"}
                                alt=""
                                className="w-14 h-14 rounded-xl object-cover border border-gray-200 flex-shrink-0 bg-white"
                                onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                                    {bid.products?.[0]?.title || `Batch #${bid.batch_id}`}
                                  </p>
                                  <BidStatusBadge status={bid.status} />
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                  {bid.bid_amount && (
                                    <span className="font-bold text-green-600 text-sm">{fmtCurrency(bid.bid_amount, bid.currency)}</span>
                                  )}
                                  {bid.bid_date && <span>{fmtDate(bid.bid_date)}</span>}
                                  {bid.products?.[0]?.category && <span>{bid.products[0].category}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Pager page={bidPage} total={bidsResp?.data?.pagination?.totalPages ?? 1} onChange={setBidPage} />
                      </>
                    );
                  })()}
                </div>
              )}

              {/* ── Listings ── */}
              {tab === "listings" && (
                <div>
                  {batchLoading ? (
                    <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
                  ) : rawBatches.length === 0 ? (
                    <div className="text-center py-16">
                      <Package className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">No listings found</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {rawBatches.map((b: any) => {
                          const batchId = b.batchId ?? b.batch_id;
                          const bidsCount = typeof b.bids === "number" ? b.bids : Array.isArray(b.bids) ? b.bids.length : 0;
                          return (
                            <div key={batchId} className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                                  <Package className="h-4 w-4 text-gray-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-800">Batch #{batchId}</p>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    {b.status && <BatchStatusBadge status={b.status} />}
                                    {b.category && <span className="text-xs text-gray-400">{b.category}</span>}
                                    {(b.postDate ?? b.post_date ?? b.createdAt) && (
                                      <span className="text-xs text-gray-400">{fmtDate(b.postDate ?? b.post_date ?? b.createdAt)}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-5 flex-shrink-0">
                                <div className="text-center hidden sm:block">
                                  <p className="text-xs text-gray-400">Items</p>
                                  <p className="text-sm font-bold text-gray-800">{b.itemsCount ?? b.items_count ?? 0}</p>
                                </div>
                                <div className="text-center hidden sm:block">
                                  <p className="text-xs text-gray-400">Bids</p>
                                  <p className="text-sm font-bold text-green-600">{bidsCount}</p>
                                </div>
                                <button
                                  onClick={() => navigate(`/admin/listings/${batchId}`)}
                                  className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                  <Eye className="h-3.5 w-3.5 text-gray-500" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <Pager page={listingPage} total={rawBatchData?.totalPages ?? 1} onChange={setListingPage} />
                    </>
                  )}
                </div>
              )}

              {/* ── Inspections ── */}
              {tab === "inspections" && (
                <div>
                  {inspLoading ? (
                    <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
                  ) : (() => {
                    const items: any[] = inspResp?.data?.data ?? [];
                    if (!items.length)
                      return (
                        <div className="text-center py-16">
                          <FileText className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                          <p className="text-sm text-gray-400">No inspections found</p>
                        </div>
                      );
                    return (
                      <>
                        <div className="space-y-3">
                          {items.map((insp: any, i: number) => (
                            <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                              <img
                                src={insp.products?.[0]?.images?.[0] || "/placeholder.svg"}
                                alt=""
                                className="w-14 h-14 rounded-xl object-cover border border-gray-200 flex-shrink-0 bg-white"
                                onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                                    {insp.products?.[0]?.title || `Batch #${insp.batch_id}`}
                                  </p>
                                  <BidStatusBadge status={insp.status} />
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                  {insp.inspection_number && <span>#{insp.inspection_number}</span>}
                                  {insp.inspection_date && <span>{fmtDate(insp.inspection_date)}</span>}
                                  {insp.products?.[0]?.category && <span>{insp.products[0].category}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Pager page={inspectionPage} total={inspResp?.data?.pagination?.totalPages ?? 1} onChange={setInspectionPage} />
                      </>
                    );
                  })()}
                </div>
              )}

            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default AdminUserDetails;
