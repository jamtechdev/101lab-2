import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  XCircle,
  Eye,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  Truck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import logo from "@/assets/greenbidz_logo.png";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";

// Static data for orders
const staticOrdersData = {
  active: [
    {
      id: 1,
      order_id: "ORD-001",
      batch_id: "BATCH-003",
      seller_name: "Recycle Masters Ltd",
      product_title: "Plastic PET Bottles",
      quantity: "800 kg",
      order_amount: "$1,250",
      order_date: "2024-01-13",
      expected_delivery: "2024-01-20",
      status: "active",
      product_image: "/placeholder.png",
      description: "Clear PET bottles, washed and ready for processing.",
      current_step: "Payment Processing"
    },
    {
      id: 2,
      order_id: "ORD-002",
      batch_id: "BATCH-007",
      seller_name: "Eco Plastics Inc",
      product_title: "HDPE Containers",
      quantity: "600 kg",
      order_amount: "$950",
      order_date: "2024-01-14",
      expected_delivery: "2024-01-22",
      status: "active",
      product_image: "/placeholder.png",
      description: "Blue HDPE containers for recycling.",
      current_step: "Quality Inspection"
    }
  ],
  completed: [
    {
      id: 3,
      order_id: "ORD-003",
      batch_id: "BATCH-005",
      seller_name: "Green Solutions Co",
      product_title: "Glass Bottles",
      quantity: "1,000 kg",
      order_amount: "$650",
      order_date: "2024-01-10",
      completed_date: "2024-01-14",
      status: "completed",
      product_image: "/placeholder.png",
      description: "Mixed color glass bottles, sorted and cleaned.",
      delivery_date: "2024-01-15"
    },
    {
      id: 4,
      order_id: "ORD-004",
      batch_id: "BATCH-008",
      seller_name: "Metal Traders",
      product_title: "Copper Pipes",
      quantity: "300 kg",
      order_amount: "$2,100",
      order_date: "2024-01-08",
      completed_date: "2024-01-12",
      status: "completed",
      product_image: "/placeholder.png",
      description: "Used copper pipes from plumbing.",
      delivery_date: "2024-01-13"
    }
  ],
  cancelled: [
    {
      id: 5,
      order_id: "ORD-005",
      batch_id: "BATCH-006",
      seller_name: "Metal Traders",
      product_title: "Steel Scrap",
      quantity: "2,000 kg",
      order_amount: "$1,800",
      order_date: "2024-01-08",
      cancelled_date: "2024-01-12",
      status: "cancelled",
      product_image: "/placeholder.png",
      description: "Mixed steel scrap from construction.",
      cancellation_reason: "Quality issues identified during inspection"
    }
  ]
};

const BuyerOrders: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<string>("active");
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  const statusConfig: Record<string, any> = {
    active: {
      label: "Active",
      color: "bg-blue-100 text-blue-800",
      icon: Clock
    },
    completed: {
      label: "Completed",
      color: "bg-green-100 text-green-800",
      icon: CheckCircle2
    },
    cancelled: {
      label: "Cancelled",
      color: "bg-red-100 text-red-800",
      icon: XCircle
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status];
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const toggleExpanded = (id: number) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderOrdersList = (orders: any[]) => {
    if (orders.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-lg font-medium">No orders found</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => {
          const isExpanded = expandedOrders.has(order.id);

          return (
            <Card key={order.id} className="border hover:border-accent/50 hover:shadow-large transition-all duration-300 group overflow-hidden">
              <CardContent className="p-0">
                <div className="p-5 bg-gradient-to-r from-card to-muted/20 border-b border-border">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg text-foreground">{order.order_id}</h3>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {order.product_title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Seller: {order.seller_name} | Batch: {order.batch_id}
                      </p>
                    </div>
                    <div className="relative flex-shrink-0">
                      <img
                        src={order.product_image}
                        alt="product"
                        className="w-16 h-16 object-cover rounded-lg border-2 border-border shadow-soft group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-xs">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Order Amount</p>
                        <p className="font-medium text-foreground">{order.order_amount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Quantity</p>
                        <p className="font-medium text-foreground">{order.quantity}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Order Date</p>
                        <p className="font-medium text-foreground">{order.order_date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Truck className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">
                          {order.status === 'completed' ? 'Delivery Date' :
                           order.status === 'cancelled' ? 'Cancelled Date' : 'Expected Delivery'}
                        </p>
                        <p className="font-medium text-foreground">
                          {order.delivery_date || order.cancelled_date || order.expected_delivery}
                        </p>
                      </div>
                    </div>
                  </div>

                  {order.current_step && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-accent" />
                        <span className="text-muted-foreground">Current Step:</span>
                        <span className="font-medium text-foreground">{order.current_step}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-muted/20 flex items-center justify-between gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(order.id)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        <span>Hide Details</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span>Show Details</span>
                      </>
                    )}
                  </Button>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    {order.status === 'active' && (
                      <Button size="sm">
                        Track Order
                      </Button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-gradient-to-br from-muted/30 to-muted/10 p-5 animate-in fade-in-50 duration-300">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                          <Package className="w-5 h-5 text-accent" />
                          Order Details
                        </h4>
                        <p className="text-muted-foreground">{order.description}</p>
                      </div>

                      {order.cancellation_reason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <h5 className="font-medium text-red-800 mb-2">Cancellation Reason</h5>
                          <p className="text-red-700">{order.cancellation_reason}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                        <div>
                          <p className="text-sm font-medium text-foreground">Seller Information</p>
                          <p className="text-sm text-muted-foreground">{order.seller_name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Order ID</p>
                          <p className="text-sm text-muted-foreground">{order.order_id}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Batch ID</p>
                          <p className="text-sm text-muted-foreground">{order.batch_id}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Total Amount</p>
                          <p className="text-sm text-muted-foreground font-medium">{order.order_amount}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const getTabCount = (tab: string) => {
    return staticOrdersData[tab as keyof typeof staticOrdersData]?.length || 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm shadow-soft sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <img src={logo} alt="GreenBidz" className="sm:h-8 w-auto cursor-pointer transition-transform hover:scale-105" onClick={() => navigate("/")} />
              <div className="flex items-center gap-2">
                <div className="w-1 h-7 bg-gradient-to-b from-accent to-accent-light rounded-full"></div>
                <h1 className="text-2xl font-bold text-foreground">Buyer Orders</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate("/buyer-dashboard")} className="shadow-soft">
                Back to Buyer Dashboard
              </Button>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/buyer-dashboard")}
          className="mb-6 hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Buyer Dashboard
        </Button>

        {/* Orders Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-10 bg-gradient-to-b from-primary to-accent rounded-full"></div>
              <h2 className="text-2xl font-bold text-foreground">My Orders</h2>
            </div>
          </div>

          <Card className="shadow-large border-0">
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b border-border bg-gradient-to-r from-card to-muted/20 px-6 pt-4">
                  <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1">
                    <TabsTrigger
                      value="active"
                      className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-soft transition-all"
                    >
                      <Clock className="w-4 h-4" />
                      <span className="hidden sm:inline">Active</span>
                      <Badge variant="secondary" className="ml-1 bg-accent/10 text-accent border-accent/20">
                        {getTabCount("active")}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="completed"
                      className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-soft transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Completed</span>
                      <Badge variant="secondary" className="ml-1 bg-accent/10 text-accent border-accent/20">
                        {getTabCount("completed")}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="cancelled"
                      className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-soft transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Cancelled</span>
                      <Badge variant="secondary" className="ml-1 bg-accent/10 text-accent border-accent/20">
                        {getTabCount("cancelled")}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="active" className="mt-0 p-6">
                  {renderOrdersList(staticOrdersData.active)}
                </TabsContent>

                <TabsContent value="completed" className="mt-0 p-6">
                  {renderOrdersList(staticOrdersData.completed)}
                </TabsContent>

                <TabsContent value="cancelled" className="mt-0 p-6">
                  {renderOrdersList(staticOrdersData.cancelled)}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BuyerOrders;
