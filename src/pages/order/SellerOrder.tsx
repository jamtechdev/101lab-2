// @ts-nocheck
import { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {
  useGetSellerCheckoutsQuery,
  useUpdateCheckoutStatusMutation,
} from "@/rtk/slices/checkoutApiSlice";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ChatSidebarWrapper from "@/components/common/ChatSidebarWrapper";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { ChevronDown, ChevronUp } from "lucide-react";
import OrderStatusTrackerimport from "@/components/common/OrderStatusTracker";

// Allowed order statuses
type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled";

type PaymentStatus = "pending" | "manual_received" | "success" | "failed";

// Status labels
const statusLabels: Record<OrderStatus, string> = {
  pending: "Order Received",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

// Status colors
const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-50 text-yellow-700 border border-yellow-300",
  confirmed: "bg-blue-50 text-blue-700 border border-blue-200",
  shipped: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  delivered: "bg-teal-50 text-teal-700 border border-teal-200",
  completed: "bg-green-100 text-green-800 border border-green-300 font-semibold",
  cancelled: "bg-red-50 text-red-700 border border-red-200",
};

// Payment labels
const paymentLabels: Record<PaymentStatus, string> = {
  pending: "Payment Pending",
  manual_received: "Manual Payment Received",
  success: "Payment Successful",
  failed: "Payment Failed",
};

const SellerOrder = () => {
  const sellerId = Number(localStorage.getItem("userId"));

  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [actionOrder, setActionOrder] = useState<any>(null);
  const [actionType, setActionType] = useState<
    "accept" | "ship" | "deliver" | "complete" | "cancel" | null
  >(null);
  const [notes, setNotes] = useState("");


  const [showChat, setShowChat] = useState(false);
  const [chatBatchId, setChatBatchId] = useState<number | null>(null);
  const [chatBuyerId, setChatBuyerId] = useState<number | null>(null);

  const { data: orders = [], isLoading, error, refetch } = useGetSellerCheckoutsQuery({ sellerId });
  const [updateStatus] = useUpdateCheckoutStatusMutation();

  const toggleExpanded = (id: number) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openModal = (order: any, type: any) => {
    setActionOrder(order);
    setActionType(type);
  };

  const closeModal = () => {
    setActionOrder(null);
    setActionType(null);
    setNotes("");
  };

  const confirmAction = async () => {
    if (!actionOrder || !actionType) return;

    const statusMap: Record<string, OrderStatus> = {
      accept: "confirmed",
      ship: "shipped",
      deliver: "delivered",
      complete: "completed",
      cancel: "cancelled",
    };

    try {
      await updateStatus({
        checkoutId: actionOrder.checkout_id,
        status: statusMap[actionType],
        notes, // optional notes field
      }).unwrap();

      closeModal();
      refetch();
    } catch (err) {
      console.error(err);
    }
  };



  const handleOpenChat = (batchId: number, buyerId: number) => {
    setChatBatchId(batchId);
    setChatBuyerId(buyerId);
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setChatBatchId(null);
    setChatBuyerId(null);
    setShowChat(false);
  };

  console.log("orders is",orders)

  const ordersList = orders?.orders || [];

  console.log("ordersList is",ordersList)

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6">Order Management</h1>

        <div className="bg-white border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">Loading…</div>
          ) : error ? (
            <div className="h-64 flex items-center justify-center">Failed to load orders</div>
          ) : ordersList.length === 0 ? (
            <div className="h-64 flex items-center justify-center">No orders found</div>
          ) : (
            ordersList.map((order: any) => {
              const isExpanded = expandedOrders.has(order.checkout_id);
              const product = order.batch?.products?.[0];

              return (
                <div key={order.checkout_id} className="border-b">
                  <div className="flex justify-between items-center p-6">
                    <div>
                      <p className="font-medium">Order #{order.checkout_id}</p>
                      <p className="text-sm text-slate-500">
                        Buyer #{order.buyer_id} • Qty {order.quantity} • ${order.total_price}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">
                          {paymentLabels[order.payment_status]}
                        </span>


                      </div>
                      <OrderStatusTrackerimport status={order.status as OrderStatus} />
                      <Button size="sm" variant="secondary" onClick={() => openModal(order, "view")}>
                        View Details
                      </Button>

                    </div>

                    <div className="flex gap-2">
                      {/* ACTION BUTTONS BASED ON CURRENT STATUS */}
                      {order.status !== "completed" && order.status !== "cancelled" && (
                        <div className="flex gap-2">
                          {order.status === "pending" && (
                            <>
                              <Button size="sm" onClick={() => openModal(order, "accept")}>Accept Order</Button>
                              <Button size="sm" variant="destructive" onClick={() => openModal(order, "cancel")}>Cancel Order</Button>
                            </>
                          )}

                          {order.status === "confirmed" && (
                            <>
                              <Button size="sm" onClick={() => openModal(order, "ship")}>Mark Shipped</Button>
                              <Button size="sm" variant="destructive" onClick={() => openModal(order, "cancel")}>Cancel Order</Button>
                            </>
                          )}

                          {order.status === "shipped" && (
                            <Button size="sm" onClick={() => openModal(order, "deliver")}>Mark Delivered</Button>
                          )}

                          {order.status === "delivered" && (
                            <Button size="sm" onClick={() => openModal(order, "complete")}>Complete Order</Button>
                          )}
                        </div>
                      )}

                      {order.status === "cancelled" && (
                        <span className="text-red-600 font-semibold">Cancelled</span>
                      )}


                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenChat(order.batch?.batch_id, order.buyer_id)}
                      >
                        Chat
                      </Button>

                      <Button size="sm" variant="ghost" onClick={() => toggleExpanded(order.checkout_id)}>
                        {isExpanded ? <ChevronUp /> : <ChevronDown />}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && product && (
                    <div className="bg-slate-50 p-6 flex gap-4">
                      <img src={product.image1} className="w-24 h-24 rounded object-cover" />
                      <div>
                        <h4 className="font-semibold">{product.title}</h4>
                        <p className="text-sm text-slate-600">{product.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <ChatSidebarWrapper
          isOpen={showChat}
          onClose={handleCloseChat}
          batchId={chatBatchId}
          sellerId={sellerId}
          buyerId={chatBuyerId}
          embedded={false}
        />


      </div>

      {/* MODAL */}
      <Dialog open={!!actionType} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
          </DialogHeader>
          <Label>Notes (optional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={confirmAction}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}

      <Dialog open={!!actionType} onOpenChange={closeModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {actionType === "view"
                ? `Order #${actionOrder?.checkout_id} Details`
                : "Confirm Action"}
            </DialogTitle>
          </DialogHeader>

          {actionType === "view" && actionOrder && (
            <div className="space-y-4">
              {/* Buyer Info */}
              <div className="border p-4 rounded">
                <h3 className="font-semibold mb-2">Buyer Information</h3>
                <p><strong>Name:</strong> {actionOrder.buyer.display_name}</p>
                <p><strong>Email:</strong> {actionOrder.buyer.user_email}</p>
              </div>

              {/* Shipping Info */}
              <div className="border p-4 rounded">
                <h3 className="font-semibold mb-2">Shipping Information</h3>
                <p>{actionOrder.shipping_address}</p>
              </div>

              {/* Product Info */}
              <div className="border p-4 rounded">
                <h3 className="font-semibold mb-2">Product</h3>
                {actionOrder.batch?.products?.map((product: any) => (
                  <div key={product.product_id} className="flex gap-4 mb-2">
                    <img
                      src={product.image1}
                      className="w-24 h-24 rounded object-cover"
                    />
                    <div>
                      <p className="font-semibold">{product.title}</p>
                      <p className="text-sm text-slate-600">{product.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Batch Info */}
              <div className="border p-4 rounded">
                <h3 className="font-semibold mb-2">Batch Information</h3>
                <p><strong>Batch Number:</strong> {actionOrder.batch?.batch_number}</p>
                <p><strong>Status:</strong> {actionOrder.batch?.status}</p>
              </div>

              {/* Payment Info */}
              <div className="border p-4 rounded">
                <h3 className="font-semibold mb-2">Payment Information</h3>
                {/* <p><strong>Method:</strong> {actionOrder.payment_method || "N/A"}</p> */}
                <p><strong>Status:</strong> {paymentLabels[actionOrder.payment_status as PaymentStatus]}</p>
                {/* <p><strong>Reference:</strong> {actionOrder.payment_reference || "N/A"}</p> */}
              </div>

              {/* Message */}
              {actionOrder.message && (
                <div className="border p-4 rounded">
                  <h3 className="font-semibold mb-2">Message</h3>
                  <p>{actionOrder.message}</p>
                </div>
              )}
            </div>
          )}

          {actionType && actionType !== "view" && (
            <>
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Close</Button>
            {actionType && actionType !== "view" && <Button onClick={confirmAction}>Confirm</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
};

export default SellerOrder;
