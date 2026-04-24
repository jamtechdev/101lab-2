// @ts-nocheck
import { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useGetOwnerOffersQuery, useUpdateOfferStatusMutation } from "@/rtk/slices/bidApiSlice";
import { useGetSellerCheckoutsQuery, useUpdateCheckoutStatusMutation } from "@/rtk/slices/checkoutApiSlice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Search, ShoppingBag, Tag } from "lucide-react";
import ChatSidebarWrapper from "@/components/common/ChatSidebarWrapper";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SITE_TYPE } from "@/config/site";

const OFFER_STATUS_COLORS: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-800 border-yellow-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  shipped:   "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered: "bg-teal-100 text-teal-800 border-teal-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const PAYMENT_COLORS: Record<string, string> = {
  pending:         "bg-gray-100 text-gray-600",
  manual_received: "bg-blue-100 text-blue-700",
  success:         "bg-green-100 text-green-700",
  failed:          "bg-red-100 text-red-700",
};

// ─── Pagination bar ──────────────────────────────────────────────────────────
const Pagination = ({ pagination, page, onPageChange }: any) => {
  if (!pagination || pagination.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
      <p className="text-xs text-slate-500">
        {pagination.totalItems} total · Page {pagination.currentPage} of {pagination.totalPages}
      </p>
      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="outline" className="h-8 w-8 p-0" disabled={!pagination.hasPrevPage} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
          .reduce((acc: any[], p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "..." ? (
              <span key={i} className="px-1 text-slate-400 text-xs">…</span>
            ) : (
              <Button key={p} size="sm" variant={p === page ? "default" : "outline"} className="h-8 w-8 p-0 text-xs" onClick={() => onPageChange(p)}>
                {p}
              </Button>
            )
          )}
        <Button size="sm" variant="outline" className="h-8 w-8 p-0" disabled={!pagination.hasNextPage} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// ─── Make Offer tab ──────────────────────────────────────────────────────────
const OffersTab = ({ sellerId }: { sellerId: string }) => {
  const [page, setPage]           = useState(1);
  const [statusFilter, setStatus] = useState("all");
  const [expanded, setExpanded]   = useState<Set<number>>(new Set());
  const [chat, setChat]           = useState<{ batchId: number; buyerId: number } | null>(null);

  const [updateOffer] = useUpdateOfferStatusMutation();

  const { data, isLoading, isFetching, refetch } = useGetOwnerOffersQuery({
    sellerID: sellerId,
    page,
    limit: 10,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const offers = data?.data ?? [];
  const pagination = data?.pagination;

  const toggle = (id: number) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleAction = async (offer_id: number, status: "accepted" | "rejected") => {
    if (!confirm(`Are you sure you want to ${status} this offer?`)) return;
    await updateOffer({ offer_id, status, lang: localStorage.getItem("language") || "en" }).unwrap().catch(console.error);
    refetch();
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-200 bg-slate-50">
        <Select value={statusFilter} onValueChange={v => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        {data?.stats && (
          <div className="flex gap-3 ml-auto text-xs text-slate-500">
            <span>Total: <strong>{data.stats.total}</strong></span>
            <span className="text-yellow-600">Pending: <strong>{data.stats.pending}</strong></span>
            <span className="text-green-600">Accepted: <strong>{data.stats.accepted}</strong></span>
          </div>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin h-6 w-6 text-slate-400" /></div>
      ) : offers.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-slate-500 text-sm">No offers found.</div>
      ) : (
        <div className={`divide-y divide-slate-100 ${isFetching ? "opacity-60" : ""}`}>
          {offers.map((offer: any) => {
            const isOpen = expanded.has(offer.offer_id);
            const product = offer.batch?.products?.[0];
            return (
              <div key={offer.offer_id}>
                <div className="flex items-start justify-between px-5 py-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">Offer #{offer.offer_id}</span>
                      <Badge className={`text-[10px] px-2 py-0.5 border ${OFFER_STATUS_COLORS[offer.status] ?? ""}`} variant="outline">
                        {offer.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      Batch #{offer.batch_id} · Qty: {offer.offer_quantity} · <strong>${Number(offer.offer_price).toFixed(2)}</strong>
                    </p>
                    {offer.buyer && (
                      <p className="text-xs text-slate-400">
                        Buyer: {offer.buyer.display_name || offer.buyer.user_email}
                      </p>
                    )}
                    {offer.message && <p className="text-xs text-slate-400 italic">"{offer.message}"</p>}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {offer.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" className="h-8 text-xs text-green-700 border-green-300 hover:bg-green-50" onClick={() => handleAction(offer.offer_id, "accepted")}>Accept</Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs text-red-700 border-red-300 hover:bg-red-50" onClick={() => handleAction(offer.offer_id, "rejected")}>Reject</Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => toggle(offer.offer_id)}>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setChat({ batchId: offer.batch_id, buyerId: offer.user_id })}>
                      Chat
                    </Button>
                  </div>
                </div>

                {isOpen && product && (
                  <div className="bg-slate-50 px-5 py-4 border-t border-slate-100 flex gap-4">
                    {product.image1 && <img src={product.image1} className="w-20 h-20 rounded object-cover flex-shrink-0" alt="" />}
                    <div className="text-xs text-slate-600 space-y-1">
                      <p className="font-medium text-slate-800">{product.title}</p>
                      <p>{product.description}</p>
                      {offer.buyer && <><p>Name: {offer.buyer.display_name}</p><p>Email: {offer.buyer.user_email}</p></>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Pagination pagination={pagination} page={page} onPageChange={setPage} />

      <ChatSidebarWrapper
        isOpen={!!chat}
        onClose={() => setChat(null)}
        batchId={chat?.batchId ?? null}
        sellerId={Number(chat?.buyerId)}
        embedded={false}
      />
    </div>
  );
};

// ─── Buy Now tab ─────────────────────────────────────────────────────────────
const OrdersTab = ({ sellerId }: { sellerId: number }) => {
  const [page, setPage]           = useState(1);
  const [statusFilter, setStatus] = useState("all");
  const [expanded, setExpanded]   = useState<Set<number>>(new Set());
  const [modal, setModal]         = useState<{ order: any; action: string } | null>(null);
  const [notes, setNotes]         = useState("");
  const [chat, setChat]           = useState<{ batchId: number; buyerId: number } | null>(null);

  const [updateStatus] = useUpdateCheckoutStatusMutation();

  const { data, isLoading, isFetching, refetch } = useGetSellerCheckoutsQuery({
    sellerId,
    page,
    limit: 10,
    status: statusFilter === "all" ? undefined : (statusFilter as any),
  });

  const orders = data?.orders ?? [];
  const pagination = data?.pagination;

  const toggle = (id: number) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const ACTION_STATUS: Record<string, string> = {
    accept: "confirmed", ship: "shipped", deliver: "delivered", complete: "completed", cancel: "cancelled",
  };

  const confirmAction = async () => {
    if (!modal) return;
    try {
      await updateStatus({ checkoutId: modal.order.checkout_id, status: ACTION_STATUS[modal.action] as any, notes }).unwrap();
      setModal(null); setNotes("");
      refetch();
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-200 bg-slate-50">
        <Select value={statusFilter} onValueChange={v => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        {pagination && (
          <span className="ml-auto text-xs text-slate-500">Total: <strong>{pagination.totalItems}</strong></span>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin h-6 w-6 text-slate-400" /></div>
      ) : orders.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-slate-500 text-sm">No orders found.</div>
      ) : (
        <div className={`divide-y divide-slate-100 ${isFetching ? "opacity-60" : ""}`}>
          {orders.map((order: any) => {
            const isOpen = expanded.has(order.checkout_id);
            const product = order.batch?.products?.[0];
            return (
              <div key={order.checkout_id}>
                <div className="flex items-start justify-between px-5 py-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">Order #{order.checkout_id}</span>
                      <Badge className={`text-[10px] px-2 py-0.5 border ${ORDER_STATUS_COLORS[order.status] ?? ""}`} variant="outline">
                        {order.status}
                      </Badge>
                      <Badge className={`text-[10px] px-2 py-0.5 ${PAYMENT_COLORS[order.payment_status] ?? ""}`} variant="outline">
                        {order.payment_status?.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      Batch #{order.batch_id} · Qty: {order.quantity} · <strong>${order.total_price}</strong> {order.currency}
                    </p>
                    {order.buyer && (
                      <p className="text-xs text-slate-400">
                        Buyer: {order.buyer.display_name || order.buyer.user_email}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {order.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" className="h-8 text-xs text-green-700 border-green-300 hover:bg-green-50" onClick={() => setModal({ order, action: "accept" })}>Accept</Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs text-red-700 border-red-300 hover:bg-red-50" onClick={() => setModal({ order, action: "cancel" })}>Cancel</Button>
                      </>
                    )}
                    {order.status === "confirmed" && (
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setModal({ order, action: "ship" })}>Mark Shipped</Button>
                    )}
                    {order.status === "shipped" && (
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setModal({ order, action: "deliver" })}>Mark Delivered</Button>
                    )}
                    {order.status === "delivered" && (
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setModal({ order, action: "complete" })}>Complete</Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => toggle(order.checkout_id)}>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setChat({ batchId: order.batch?.batch_id, buyerId: order.buyer_id })}>
                      Chat
                    </Button>
                  </div>
                </div>

                {isOpen && (
                  <div className="bg-slate-50 px-5 py-4 border-t border-slate-100 flex gap-4">
                    {product?.image1 && <img src={product.image1} className="w-20 h-20 rounded object-cover flex-shrink-0" alt="" />}
                    <div className="text-xs text-slate-600 space-y-1">
                      {product && <p className="font-medium text-slate-800">{product.title}</p>}
                      {order.shipping_address && <p>Ship to: {order.shipping_address}</p>}
                      {order.message && <p className="italic">"{order.message}"</p>}
                      {order.buyer && <><p>Name: {order.buyer.display_name}</p><p>Email: {order.buyer.user_email}</p></>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Pagination pagination={pagination} page={page} onPageChange={setPage} />

      {/* Action modal */}
      <Dialog open={!!modal} onOpenChange={() => { setModal(null); setNotes(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm: {modal?.action?.replace(/^\w/, c => c.toUpperCase())} Order #{modal?.order?.checkout_id}</DialogTitle>
          </DialogHeader>
          <Label>Notes (optional)</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={confirmAction}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChatSidebarWrapper
        isOpen={!!chat}
        onClose={() => setChat(null)}
        batchId={chat?.batchId ?? null}
        sellerId={sellerId}
        buyerId={chat?.buyerId ?? null}
        embedded={false}
      />
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const SellerOffersOrders = () => {
  const sellerId   = localStorage.getItem("userId") || "";
  const [tab, setTab] = useState<"offers" | "orders">("offers");

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Offers &amp; Orders</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all make-offer and buy-now requests from buyers</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-0 border-b border-slate-200">
          <button
            onClick={() => setTab("offers")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "offers"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Tag className="h-4 w-4" />
            Make Offer
          </button>
          <button
            onClick={() => setTab("orders")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "orders"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            Buy Now
          </button>
        </div>

        {/* Panel */}
        <div className="bg-white border border-slate-200 rounded-b-lg rounded-tr-lg overflow-hidden">
          {tab === "offers" ? (
            <OffersTab sellerId={sellerId} />
          ) : (
            <OrdersTab sellerId={Number(sellerId)} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SellerOffersOrders;
