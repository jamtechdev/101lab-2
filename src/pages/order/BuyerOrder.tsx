// @ts-nocheck
import { useGetBuyerCheckoutsQuery } from "@/rtk/slices/checkoutApiSlice";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  X,
  Package,
  Check,
  Truck,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Loader2
} from "lucide-react";
import ChatSidebarWrapper from "@/components/common/ChatSidebarWrapper";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { se } from "date-fns/locale";

const formatDateDDMMYYYY = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB");
};

export default function BuyerAllOrders() {
  const { t } = useTranslation();
  const buyerId = Number(localStorage.getItem("userId"));
  const { data, isLoading } = useGetBuyerCheckoutsQuery({ buyerId });

  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [batchId, setBatchId] = useState<number | null>(null);
  const [sellerId, setSellerId] = useState<number | null>(null);

  const statuses = ["submitted", "accepted", "delivered", "completed", "cancelled"];

  const statusConfig: Record<string, any> = {
    submitted: { label: "Submitted", color: "bg-yellow-100 text-yellow-800", icon: Package },
    accepted: { label: "Accepted", color: "bg-blue-100 text-blue-800", icon: Check },
    delivered: { label: "Delivered", color: "bg-purple-100 text-purple-800", icon: Truck },
    completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle },
    cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: X },
  };

  const getStatusBadge = (status?: string | null) => {
    const key = (status ?? "").toLowerCase();
    const config = statusConfig[key];
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleMessage = (order: any) => {
    setBatchId(order.batch_id);
    setSellerId(order.seller_id);
    setShowMessageDialog(true);
  };

  const handleCloseChat = () => {
    setBatchId(null);
    setSellerId(null);
    setShowMessageDialog(false);
  };

  const toggleExpanded = (id: number) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getStatusSteps = (currentStatus: string) => {
    const steps = [
      { key: 'submitted', label: 'Submitted', icon: Package },
      { key: 'accepted', label: 'Accepted', icon: Check },
      { key: 'delivered', label: 'Delivered', icon: Truck },
      { key: 'completed', label: 'Completed', icon: CheckCircle }
    ];
    if (currentStatus === 'cancelled') return null;
    const currentIndex = steps.findIndex(s => s.key === currentStatus);
    return steps.map((step, index) => {
      const isCompleted = index <= currentIndex;
      const isCurrent = index === currentIndex;
      const Icon = step.icon;
      return { ...step, isCompleted, isCurrent, icon: Icon };
    });
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMessageDialog) handleCloseChat();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showMessageDialog]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  console.log("orders is", data);

  const orders = Array.isArray(data?.orders) ? data?.orders : [];

  return (
    <DashboardLayout>

      <div className="text-sm text-muted-foreground pb-6">
        Buying / Receiving &gt; Buyer Order
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-lg font-medium">
            {t("buyerDashboard.noOrders") || "No orders found"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {orders.map((order: any) => {
            const isExpanded = expandedOrders.has(order.checkout_id);
            const statusSteps = getStatusSteps(order.status);
            const isCancelled = order.status === 'cancelled';
            const batch = order.batch;
            const seller = order.seller


            return (
              <Card
                key={order.checkout_id}
                className="border hover:border-accent/50 hover:shadow-large transition-all duration-300 group overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="p-5 bg-gradient-to-r from-card to-muted/20 border-b border-border">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg text-foreground">
                            Order #{order.checkout_id}
                          </h3>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Batch #{order.batch_id} • Product IDs: {batch?.product_ids.join(", ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">
                          ${order.total_price}
                        </p>
                        <p className="text-xs text-muted-foreground">{order.currency}</p>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Quantity</p>
                          <p className="font-medium text-foreground">{order.quantity} items</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Order Date</p>
                          <p className="font-medium text-foreground">
                            {formatDateDDMMYYYY(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div>
                        {/* <p>Seller Details</p>
                          <p>{seller?.user_login}</p> */}
                        <p>Seller Email-{seller?.display_name}</p>
                      </div>
                    </div>

                    {/* Progress Steps */}
                    {!isCancelled && statusSteps && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="relative">
                          <div className="absolute top-5 left-0 right-0 h-1 bg-muted mx-6">
                            <div
                              className="h-full bg-success transition-all duration-500"
                              style={{
                                width: `${(statusSteps.filter(s => s.isCompleted).length - 1) / (statusSteps.length - 1) * 100}%`
                              }}
                            />
                          </div>
                          <div className="relative flex justify-between">
                            {statusSteps.map((step) => {
                              const Icon = step.icon;
                              return (
                                <div key={step.key} className="flex flex-col items-center z-10">
                                  <div
                                    className={cn(
                                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                                      step.isCompleted
                                        ? "bg-success border-success text-white shadow-colored"
                                        : "bg-card border-border text-muted-foreground",
                                      step.isCurrent ? "ring-4 ring-success/20 scale-110" : ""
                                    )}
                                  >
                                    {step.isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                  </div>
                                  <div className="mt-2 text-center">
                                    <p
                                      className={cn(
                                        "text-[10px] font-medium transition-colors leading-tight",
                                        step.isCompleted || step.isCurrent ? "text-foreground" : "text-muted-foreground",
                                        step.isCurrent ? "text-success font-semibold" : ""
                                      )}
                                    >
                                      {step.label}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-muted/20 flex items-center justify-between gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(order.checkout_id)}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          <span>{t("buyerDashboard.hideDetails") || "Hide Details"}</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          <span>{t("buyerDashboard.showDetails") || "Show Details"}</span>
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleMessage(order)}
                      className="shadow-soft flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {t("buyerDashboard.contactSeller") || "Contact Seller"}
                    </Button>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && batch && (
                    <div className="border-t border-border bg-gradient-to-br from-muted/30 to-muted/10 p-5 animate-in fade-in-50 duration-300 space-y-4">
                      {batch.products?.map((product: any) => (
                        
                        <div key={product.product_id} className="flex flex-col">
                          <div className="flex gap-4"> 
                          <img
                            src={product.image1}
                            alt={product.title}
                            className="w-24 h-24 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{product.title}</h4>
                            <p className="text-sm text-muted-foreground">{product.description}</p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {product.categories?.map((cat: any) => (
                                <Badge key={cat.term_id} className="bg-muted/20 text-xs">
                                  {cat.term}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          </div>
                          <div>
                            <p>Seller Details</p>
                            <p>{seller?.user_login}</p>
                            <p>{seller?.display_name}</p>
                          </div>

                        </div>

                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Chat Sidebar */}
      <ChatSidebarWrapper
        isOpen={showMessageDialog}
        onClose={handleCloseChat}
        batchId={batchId}
        sellerId={sellerId}
        embedded={false}
      />

    </DashboardLayout>
  );
}
