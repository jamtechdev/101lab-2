import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Gavel, 
  Package, 
  Check, 
  Truck, 
  CheckCircle, 
  X, 
  MessageCircle, 
  ChevronLeft, 
  ChevronRight, 
  Eye,
  Calendar,
  Clock
} from "lucide-react";
import ChatSidebarWrapper from "@/components/common/ChatSidebarWrapper";
import { cn } from "@/lib/utils";

interface BuyerAllOrdersProps {
  res: any[];
  isLoading: boolean;
}

export default function BuyerAllOrders({ res, isLoading }: BuyerAllOrdersProps) {
  const orders = res ?? [];
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [batchId, setBatchId] = useState<number | null>(null);
  const [sellerId, setSellerId] = useState<number | null>(null);
  const [activeChatInfo, setActiveChatInfo] = useState<{ orderId: number | null; productId: number | null }>({
    orderId: null,
    productId: null,
  });

  const filteredOrders = activeStatus ? orders.filter(o => o.status === activeStatus) : orders;

  const statusColors: Record<string, string> = {
    submitted: "bg-yellow-100 text-yellow-800 border-yellow-300",
    accepted: "bg-blue-100 text-blue-800 border-blue-300",
    delivered: "bg-purple-100 text-purple-800 border-purple-300",
    completed: "bg-green-100 text-green-800 border-green-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
  };

  const statusIcons: Record<string, any> = {
    submitted: Package,
    accepted: Check,
    delivered: Truck,
    completed: CheckCircle,
    cancelled: X,
  };

  const handleMessage = (order: any) => {
    setBatchId(order.batch_id);
    setSellerId(order.seller_id);
    setActiveChatInfo({ orderId: order.checkout_id, productId: order.product_id });
    setShowMessageDialog(true);
  };

  const handleCloseChat = () => {
    setBatchId(null);
    setSellerId(null);
    setActiveChatInfo({ orderId: null, productId: null });
    setShowMessageDialog(false);
  };

  const handleViewBatch = (batchId: number) => {
    // Navigate to batch detail page
    window.location.href = `/batch/${batchId}`;
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showMessageDialog) handleCloseChat();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showMessageDialog]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-3 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6  mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">My Orders</h2>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveStatus(null)}
          className={cn(
            "px-5 py-2.5 text-sm font-medium transition-all relative",
            activeStatus === null
              ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          All Orders
        </button>
        {["submitted", "accepted", "delivered", "completed", "cancelled"].map((status) => (
          <button
            key={status}
            onClick={() => setActiveStatus(status)}
            className={cn(
              "px-5 py-2.5 text-sm font-medium transition-all relative capitalize",
              activeStatus === status
                ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Gavel className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 text-lg">No orders found</p>
          <p className="text-gray-400 text-sm mt-1">
            {activeStatus ? `No ${activeStatus} orders` : "Your orders will appear here"}
          </p>
        </div>
      ) : (
        /* Orders List */
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const StatusIcon = statusIcons[order.status] ?? Package;
            const product = order.batch?.products?.[0];
            const batch = order.batch;

            return (
              <Card 
                key={order.checkout_id} 
                className="border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Order Header */}
                  <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">
                        Order #{order.checkout_id}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs font-medium",
                          statusColors[order.status]
                        )}
                      >
                        <StatusIcon className="w-3 h-3 mr-1.5" />
                        {order.status}
                      </Badge>
                      {batch?.batch_id && (
                        <Badge 
                          variant="outline" 
                          className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                        >
                          Batch #{batch.batch_id}
                        </Badge>
                      )}
                    </div>
                    {/* {batch?.batch_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewBatch(batch.batch_id)}
                        className="text-sm font-medium border-gray-300 hover:bg-gray-100"
                      >
                        <Eye className="h-4 w-4 mr-1.5" />
                        View Batch
                      </Button>
                    )} */}
                  </div>

                  {/* Order Details */}
                  {(order.created_at || batch?.inspection_date) && (
                    <div className="px-6 py-3 bg-white border-b border-gray-100 flex gap-8 text-sm">
                      {order.created_at && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Ordered:</span>
                          <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                      )}
                      {batch?.inspection_date && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Inspection:</span>
                          <span>{new Date(batch.inspection_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Product Section */}
                  <div className="px-6 py-5">
                    <div className="flex items-start gap-2 mb-4">
                      <Package className="h-5 w-5 text-teal-600 mt-0.5" />
                      <h4 className="font-medium text-gray-900">Product Details</h4>
                    </div>

                    {/* Product Card with Image */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex gap-0">
                        {/* Image Section */}
                        <div className="relative w-64 h-64 bg-gray-100 flex-shrink-0">
                          {product?.image1 ? (
                            <>
                              <img
                                src={product.image1}
                                alt={product.title || "Product"}
                                className="w-full h-full object-cover"
                              />
                              {/* Image Counter Badge */}
                              <div className="absolute top-3 right-3 bg-gray-900/80 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                                1/5
                              </div>
                              {/* Navigation Arrows */}
                              <button className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition">
                                <ChevronLeft className="h-5 w-5 text-gray-700" />
                              </button>
                              <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition">
                                <ChevronRight className="h-5 w-5 text-gray-700" />
                              </button>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-12 w-12 text-gray-300" />
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 p-6 space-y-4">
                          {/* Product Title */}
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h5 className="text-lg font-semibold text-gray-900 leading-tight">
                                {product?.title || "Product Title"}
                              </h5>
                              {product?.product_id && (
                                <Badge 
                                  variant="outline" 
                                  className="bg-teal-50 text-teal-700 border-teal-200 text-xs flex-shrink-0"
                                >
                                  #{product.product_id}
                                </Badge>
                              )}
                            </div>
                            {product?.categories?.length > 0 && (
                              <p className="text-sm text-gray-500">
                                {product.categories.map((c: any) => c.term).join(", ")}
                              </p>
                            )}
                          </div>

                          {/* Description */}
                          {product?.description && (
                            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                              {product.description}
                            </p>
                          )}

                          {/* Order Details */}
                          <div className="pt-3 border-t border-gray-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Total Price:</span>
                              <span className="text-lg font-semibold text-gray-900">
                                {order.total_price} {order.currency || "USD"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Quantity:</span>
                              <span className="text-base font-medium text-gray-900">
                                {order.quantity}
                              </span>
                            </div>
                            {order.message && (
                              <div className="pt-2">
                                <p className="text-xs text-gray-500 mb-1">Order Message:</p>
                                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-200">
                                  {order.message}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                          <div className="flex items-center justify-end pt-3">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleMessage(order)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <MessageCircle className="h-4 w-4 mr-1.5" />
                              Message Seller
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
    </div>
  );
}