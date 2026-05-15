// @ts-nocheck
import { useParams, useNavigate } from "react-router-dom";
import { useGetBatchDetailsQuery } from "@/rtk/slices/adminApiSlice";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Package, User, Mail, Phone, Building2, Globe,
  Calendar, Clock, DollarSign, MapPin, Percent, TrendingUp,
  CheckCircle2, XCircle, Image as ImageIcon, Users, Award,
  Receipt, Truck, AlertCircle, Gavel, Eye,
} from "lucide-react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AdminHeader from "./AdminHeader";
import { format } from "date-fns";

const fmtDate = (d, withTime = false) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    });
  } catch { return d; }
};

const fmtCurrency = (v, cur = "USD") => {
  const n = parseFloat(v) || 0;
  if (!n) return "—";
  return `${cur} ${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
};

const BatchStatusBadge = ({ status }) => {
  const s = String(status || "").toLowerCase();
  if (s === "sold") return <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1"><CheckCircle2 className="h-3 w-3" />Sold</span>;
  if (s === "publish" || s === "published") return <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1"><Eye className="h-3 w-3" />Published</span>;
  if (s === "live_for_bids") return <span className="inline-flex items-center gap-1 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2.5 py-1"><Gavel className="h-3 w-3" />Live for Bids</span>;
  if (s === "inspection_schedule") return <span className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-1"><Calendar className="h-3 w-3" />Inspection</span>;
  if (s === "under_review") return <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-1"><Clock className="h-3 w-3" />Under Review</span>;
  if (s === "deactive") return <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200 rounded-full px-2.5 py-1"><XCircle className="h-3 w-3" />Inactive</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 rounded-full px-2.5 py-1">{String(status || "").replace(/_/g, " ") || "—"}</span>;
};

const BidStatusBadge = ({ status }) => {
  const s = String(status || "").toLowerCase();
  if (s === "accepted") return <span className="text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5">Accepted</span>;
  if (s === "pending") return <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5">Pending</span>;
  if (s === "rejected") return <span className="text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-full px-2.5 py-0.5">Rejected</span>;
  if (s === "counter_offer") return <span className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5">Counter Offer</span>;
  return <span className="text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 rounded-full px-2.5 py-0.5 capitalize">{status || "—"}</span>;
};

const PaymentBadge = ({ status }) => {
  const s = String(status || "").toLowerCase();
  if (s === "paid") return <span className="text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5">Paid</span>;
  if (s === "pending") return <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5">Pending</span>;
  if (!status) return <span className="text-xs text-gray-400">—</span>;
  return <span className="text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 rounded-full px-2.5 py-0.5 capitalize">{status}</span>;
};

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${color}/10`}>
      <Icon className={`h-5 w-5 ${color}`} />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 mt-0.5">
      <Icon className="h-3.5 w-3.5 text-gray-400" />
    </div>
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value || "—"}</p>
    </div>
  </div>
);

const SectionHeader = ({ icon: Icon, title, sub, right }) => (
  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-green-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
    {right}
  </div>
);

const AdminBatchDetails = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetBatchDetailsQuery(Number(batchId), { skip: !batchId });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <AdminSidebar activePath="/admin/listings" />
        <div className="lg:pl-56">
          <AdminHeader />
          <div className="p-4 md:p-6 space-y-5">
            <Skeleton className="h-8 w-40 rounded-xl" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
            {[1,2,3].map(i => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data?.success) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <AdminSidebar activePath="/admin/listings" />
        <div className="lg:pl-56">
          <AdminHeader />
          <div className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[60vh]">
            <AlertCircle className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">Batch not found</p>
            <button onClick={() => navigate(-1)} className="mt-3 text-sm text-green-600 hover:underline">Go back</button>
          </div>
        </div>
      </div>
    );
  }

  const d = data.data;
  const bidding = d.bidding;
  const buyerBids = bidding?.buyer_bids ?? [];
  const totalBids = buyerBids.length;
  const acceptedBids = buyerBids.filter(b => b.status === "accepted").length;
  const highestBid = buyerBids.reduce((max, b) => Math.max(max, parseFloat(b.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AdminSidebar activePath="/admin/listings" />
      <div className="lg:pl-56">
        <AdminHeader />
        <main className="p-4 md:p-6 space-y-5">

          {/* Page Header */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">Batch #{d.batch.batch_id}</h1>
                <BatchStatusBadge status={d.batch.status} />
                {d.batch.commission_percent != null && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1">
                    <Percent className="h-3 w-3" />{Number(d.batch.commission_percent)}% commission
                  </span>
                )}
                {bidding?.type && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-1 capitalize">
                    <Gavel className="h-3 w-3" />{bidding.type.replace(/_/g, " ")}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-0.5">Full listing details, bids, and activity</p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Bids"   value={totalBids}                                             icon={Gavel}        color="text-indigo-600"  />
            <StatCard label="Accepted"     value={acceptedBids}                                          icon={CheckCircle2} color="text-green-600"   />
            <StatCard label="Highest Bid"  value={fmtCurrency(highestBid, bidding?.currency)}            icon={TrendingUp}   color="text-blue-600"    />
            <StatCard label="Target Price" value={fmtCurrency(bidding?.target_price, bidding?.currency)} icon={DollarSign}   color="text-emerald-600" />
          </div>

          {/* Seller */}
          {d.seller && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <SectionHeader icon={User} title="Seller" sub="Listing owner" />
              <div className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                    {String(d.seller.name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <button onClick={() => d.seller?.id && navigate(`/admin/users/${d.seller.id}`)} className="text-base font-bold text-green-600 hover:underline text-left block">
                      {d.seller.name || "—"}
                    </button>
                    <p className="text-xs text-gray-400">Seller ID #{d.batch.seller_id}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <InfoItem icon={Mail} label="Email" value={d.seller.email} />
                  {d.seller.phone   && <InfoItem icon={Phone}     label="Phone"   value={d.seller.phone} />}
                  {d.seller.company && <InfoItem icon={Building2} label="Company" value={d.seller.company} />}
                  {d.seller.country && <InfoItem icon={Globe}     label="Country" value={d.seller.country} />}
                </div>
              </div>
            </div>
          )}

          {/* Bidding Info */}
          {bidding && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <SectionHeader
                icon={Gavel}
                title="Bidding Details"
                sub={`${String(bidding.type || "").replace(/_/g, " ") || "—"} · ${fmtDate(bidding.start_date)} to ${fmtDate(bidding.end_date)}`}
                right={<BatchStatusBadge status={bidding.status} />}
              />
              <div className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-400 mb-1">Target Price</p>
                    <p className="text-lg font-bold text-gray-900">{fmtCurrency(bidding.target_price, bidding.currency)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-400 mb-1">Current Price</p>
                    <p className="text-lg font-bold text-gray-900">{fmtCurrency(bidding.current_price, bidding.currency)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-400 mb-1">Start Date</p>
                    <p className="text-sm font-semibold text-gray-800">{fmtDate(bidding.start_date)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-400 mb-1">End Date</p>
                    <p className="text-sm font-semibold text-gray-800">{fmtDate(bidding.end_date)}</p>
                  </div>
                  {bidding.location && (
                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 col-span-2">
                      <p className="text-xs text-gray-400 mb-1">Location</p>
                      <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />{bidding.location}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Buyer Bids */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <SectionHeader icon={Users} title={`Buyer Bids (${totalBids})`} sub="All bids placed on this batch — click buyer name to view full profile" />
            {buyerBids.length === 0 ? (
              <div className="text-center py-16">
                <Gavel className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No bids placed yet</p>
              </div>
            ) : (
              <>
                <div className="hidden md:grid grid-cols-[1fr_130px_110px_140px_110px] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50/60">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Buyer</span>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bid Amount</span>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</span>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted</span>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {buyerBids.map((bid, idx) => (
                    <div key={idx} className="px-5 py-4 hover:bg-gray-50/60 transition-colors">
                      <div className="flex flex-col md:grid md:grid-cols-[1fr_130px_110px_140px_110px] gap-3 md:gap-4 md:items-center">
                        <div className="space-y-0.5">
                          <button onClick={() => bid.buyer?.id && navigate(`/admin/users/${bid.buyer.id}`)} className="text-sm font-semibold text-green-600 hover:underline text-left">
                            {bid.buyer?.display_name || bid.buyer?.name || "Unknown"}
                          </button>
                          <p className="text-xs text-gray-400">{bid.buyer?.email || "—"}</p>
                          {bid.buyer?.phone  && <p className="text-xs text-gray-400">{bid.buyer.phone}</p>}
                          {bid.company_name  && <p className="text-xs text-gray-500 font-medium">{bid.company_name}</p>}
                        </div>
                        <p className="text-sm font-bold text-gray-900">{fmtCurrency(bid.amount, bidding?.currency)}</p>
                        <div><BidStatusBadge status={bid.status} /></div>
                        <p className="text-xs text-gray-500">{fmtDate(bid.submitted_at, true)}</p>
                        <div><PaymentBadge status={bid.payment?.status} /></div>
                      </div>
                      {bid.notes && <p className="mt-2 text-xs text-gray-400 italic">Note: {bid.notes}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Products */}
          {d.products && d.products.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <SectionHeader icon={Package} title={`Products (${d.products_total})`} sub="Items in this batch" />
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {d.products.map((product) => (
                    <div key={product.product_id} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors">
                      {product.images && product.images.length > 0 ? (
                        <img src={product.images[0].url} className="h-44 w-full object-cover" alt={product.title} onError={e => { e.target.src = "/placeholder.svg"; }} />
                      ) : (
                        <div className="h-44 w-full bg-gray-100 flex items-center justify-center">
                          <ImageIcon className="h-10 w-10 text-gray-300" />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-sm font-semibold text-gray-800 line-clamp-2">{product.title}</p>
                        {product.category && <span className="mt-1.5 inline-block text-xs text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-0.5">{product.category}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Inspection */}
          {d.inspection && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <SectionHeader icon={Calendar} title="Inspection" sub={`${d.inspection.inspectionRegistration?.length ?? 0} companies registered`} />
              <div className="p-5 space-y-5">
                {d.inspection.schedule && d.inspection.schedule.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Schedule</p>
                    <div className="space-y-2">
                      {d.inspection.schedule.map((s, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                          <p className="text-sm font-semibold text-gray-800 mb-2">{format(new Date(s.date), "EEEE, MMMM d, yyyy")}</p>
                          <div className="flex flex-wrap gap-2">
                            {s.slots?.map((slot, si) => (
                              <span key={si} className="inline-flex items-center gap-1 text-xs font-medium bg-white border border-gray-200 rounded-full px-2.5 py-1">
                                <Clock className="h-3 w-3 text-gray-400" />{slot.time}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {d.inspection.inspectionRegistration && d.inspection.inspectionRegistration.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Registered Companies ({d.inspection.inspectionRegistration.length})</p>
                    <div className="hidden md:grid grid-cols-[1fr_1fr_120px_100px] gap-4 px-4 py-2 bg-gray-50/60 rounded-t-xl border border-b-0 border-gray-100">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company / Buyer</span>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date & Slot</span>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</span>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</span>
                    </div>
                    <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                      {d.inspection.inspectionRegistration.map((reg) => (
                        <div key={reg.registration_id} className="px-4 py-3 hover:bg-gray-50/60 transition-colors">
                          <div className="flex flex-col md:grid md:grid-cols-[1fr_1fr_120px_100px] gap-3 md:gap-4 md:items-center">
                            <div>
                              <p className="text-xs text-gray-400 mb-0.5">{reg.company_name || "—"}</p>
                              <button onClick={() => reg.buyer?.id && navigate(`/admin/users/${reg.buyer.id}`)} className="text-sm font-semibold text-green-600 hover:underline text-left">
                                {reg.buyer?.name || reg.buyer?.display_name || "—"}
                              </button>
                              <p className="text-xs text-gray-400">{reg.buyer?.email || ""}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-700">{fmtDate(reg.date)}</p>
                              <p className="text-xs text-gray-400">{reg.slot || "—"}</p>
                            </div>
                            <div>{reg.buyer?.phone && <p className="text-xs text-gray-500">{reg.buyer.phone}</p>}</div>
                            <div>
                              {reg.selected  && <span className="text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5">Selected</span>}
                              {reg.skipped   && <span className="text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-full px-2.5 py-0.5">Skipped</span>}
                              {!reg.selected && !reg.skipped && <span className="text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 rounded-full px-2.5 py-0.5">Registered</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Winner */}
          {d.winners && d.winners.buyer && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <SectionHeader icon={Award} title="Winner" sub="Accepted bid — batch awarded" right={<PaymentBadge status={d.winners.payment_status} />} />
              <div className="p-5">
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                    {String(d.winners.buyer.name || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-gray-900">{d.winners.buyer.name || "—"}</p>
                    <p className="text-xs text-gray-400 mb-3">{d.winners.buyer.email || ""}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-400 mb-1">Winning Amount</p>
                        <p className="text-lg font-bold text-green-600">{fmtCurrency(d.winners.amount, bidding?.currency)}</p>
                      </div>
                      {d.winners.buyer.company && (
                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                          <p className="text-xs text-gray-400 mb-1">Company</p>
                          <p className="text-sm font-semibold text-gray-800">{d.winners.buyer.company}</p>
                        </div>
                      )}
                      {d.winners.buyer.phone && (
                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                          <p className="text-xs text-gray-400 mb-1">Phone</p>
                          <p className="text-sm font-semibold text-gray-800">{d.winners.buyer.phone}</p>
                        </div>
                      )}
                      <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-400 mb-1">Payment</p>
                        <PaymentBadge status={d.winners.payment_status} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Detail */}
          {d.paymentDetail && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <SectionHeader icon={Receipt} title="Payment Details" sub={`Transaction · ${fmtDate(d.paymentDetail.paid_at, true)}`} right={<PaymentBadge status={d.paymentDetail.payment_status} />} />
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-400 mb-1">Amount Paid</p>
                    <p className="text-lg font-bold text-green-600">{fmtCurrency(d.paymentDetail.amount, bidding?.currency)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-400 mb-1">Method</p>
                    <p className="text-sm font-semibold text-gray-800 capitalize">{d.paymentDetail.payment_method || "—"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-400 mb-1">Transaction #</p>
                    <p className="text-sm font-mono font-semibold text-gray-800">{d.paymentDetail.transaction_number || "—"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-400 mb-1">Delivery</p>
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                      {d.paymentDetail.is_delivery ? <><Truck className="h-3.5 w-3.5 text-gray-400 shrink-0" />Delivery</> : <><Package className="h-3.5 w-3.5 text-gray-400 shrink-0" />Pickup</>}
                    </p>
                  </div>
                  {d.paymentDetail.pickup_date && (
                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                      <p className="text-xs text-gray-400 mb-1">Pickup Date</p>
                      <p className="text-sm font-semibold text-gray-800">{fmtDate(d.paymentDetail.pickup_date)}</p>
                    </div>
                  )}
                  {d.paymentDetail.pickup_time && (
                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                      <p className="text-xs text-gray-400 mb-1">Pickup Time</p>
                      <p className="text-sm font-semibold text-gray-800">{d.paymentDetail.pickup_time}</p>
                    </div>
                  )}
                </div>
                {d.paymentDetail.buyer && (
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Buyer</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <InfoItem icon={User}      label="Name"    value={d.paymentDetail.buyer.name} />
                      <InfoItem icon={Mail}      label="Email"   value={d.paymentDetail.buyer.email} />
                      {d.paymentDetail.buyer.company && <InfoItem icon={Building2} label="Company" value={d.paymentDetail.buyer.company} />}
                      {d.paymentDetail.buyer.phone   && <InfoItem icon={Phone}     label="Phone"   value={d.paymentDetail.buyer.phone} />}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default AdminBatchDetails;
