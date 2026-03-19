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
  Pause,
  XCircle,
  Eye,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  User,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import logo from "@/assets/greenbidz_logo.png";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";

// Static data for offers received
const staticOffersReceivedData = {
  unaccepted: [
    {
      id: 1,
      offer_id: "OFFER-001",
      batch_id: "BATCH-001",
      buyer_name: "Green Buyers Ltd",
      buyer_company: "Green Buyers Ltd",
      product_title: "Industrial Copper Wire Scrap",
      quantity: "500 kg",
      offered_price: "$2,450",
      date_submitted: "2024-01-15",
      status: "unaccepted",
      product_image: "/placeholder.png",
      description: "High-grade copper wire scrap from manufacturing process.",
      buyer_location: "Singapore"
    },
    {
      id: 2,
      offer_id: "OFFER-002",
      batch_id: "BATCH-002",
      buyer_name: "Eco Traders Inc",
      buyer_company: "Eco Traders Inc",
      product_title: "Aluminum Beverage Cans",
      quantity: "1,200 kg",
      offered_price: "$890",
      date_submitted: "2024-01-14",
      status: "unaccepted",
      product_image: "/placeholder.png",
      description: "Clean aluminum beverage cans ready for recycling.",
      buyer_location: "Malaysia"
    }
  ],
  accepted: [
    {
      id: 3,
      offer_id: "OFFER-003",
      batch_id: "BATCH-003",
      buyer_name: "Recycle Masters Ltd",
      buyer_company: "Recycle Masters Ltd",
      product_title: "Plastic PET Bottles",
      quantity: "800 kg",
      offered_price: "$1,250",
      date_submitted: "2024-01-13",
      date_accepted: "2024-01-13",
      status: "accepted",
      product_image: "/placeholder.png",
      description: "Clear PET bottles, washed and ready for processing.",
      buyer_location: "Thailand"
    }
  ],
  pause: [
    {
      id: 4,
      offer_id: "OFFER-004",
      batch_id: "BATCH-004",
      buyer_name: "Waste Management Inc",
      buyer_company: "Waste Management Inc",
      product_title: "Mixed Paper Scrap",
      quantity: "600 kg",
      offered_price: "$420",
      date_submitted: "2024-01-12",
      date_paused: "2024-01-12",
      status: "pause",
      product_image: "/placeholder.png",
      description: "Mixed office paper and cardboard.",
      buyer_location: "Vietnam"
    }
  ],
  complete: [
    {
      id: 5,
      offer_id: "OFFER-005",
      batch_id: "BATCH-005",
      buyer_name: "Green Solutions Co",
      buyer_company: "Green Solutions Co",
      product_title: "Glass Bottles",
      quantity: "1,000 kg",
      offered_price: "$650",
      date_submitted: "2024-01-10",
      date_completed: "2024-01-14",
      status: "complete",
      product_image: "/placeholder.png",
      description: "Mixed color glass bottles, sorted and cleaned.",
      buyer_location: "Indonesia"
    }
  ],
  did_not_get: [
    {
      id: 6,
      offer_id: "OFFER-006",
      batch_id: "BATCH-006",
      buyer_name: "Metal Traders",
      buyer_company: "Metal Traders",
      product_title: "Steel Scrap",
      quantity: "2,000 kg",
      offered_price: "$1,800",
      date_submitted: "2024-01-08",
      date_cancelled: "2024-01-12",
      status: "did_not_get",
      product_image: "/placeholder.png",
      description: "Mixed steel scrap from construction.",
      buyer_location: "Philippines"
    }
  ]
};

const SellerOffersReceived: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<string>("unaccepted");
  const [expandedOffers, setExpandedOffers] = useState<Set<number>>(new Set());

  const statusConfig: Record<string, any> = {
    unaccepted: {
      label: "Unaccepted",
      color: "bg-yellow-100 text-yellow-800",
      icon: Clock
    },
    accepted: {
      label: "Accepted",
      color: "bg-green-100 text-green-800",
      icon: CheckCircle2
    },
    pause: {
      label: "Paused",
      color: "bg-blue-100 text-blue-800",
      icon: Pause
    },
    complete: {
      label: "Completed",
      color: "bg-purple-100 text-purple-800",
      icon: CheckCircle2
    },
    did_not_get: {
      label: "Did Not Get",
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
    setExpandedOffers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderOffersList = (offers: any[]) => {
    if (offers.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-lg font-medium">No offers received</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4">
        {offers.map((offer) => {
          const isExpanded = expandedOffers.has(offer.id);

          return (
            <Card key={offer.id} className="border hover:border-accent/50 hover:shadow-large transition-all duration-300 group overflow-hidden">
              <CardContent className="p-0">
                <div className="p-5 bg-gradient-to-r from-card to-muted/20 border-b border-border">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg text-foreground">{offer.offer_id}</h3>
                        {getStatusBadge(offer.status)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {offer.product_title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        From: {offer.buyer_company} ({offer.buyer_location})
                      </p>
                    </div>
                    <div className="relative flex-shrink-0">
                      <img
                        src={offer.product_image}
                        alt="product"
                        className="w-16 h-16 object-cover rounded-lg border-2 border-border shadow-soft group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-xs">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Offered Price</p>
                        <p className="font-medium text-foreground">{offer.offered_price}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Quantity</p>
                        <p className="font-medium text-foreground">{offer.quantity}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Buyer</p>
                        <p className="font-medium text-foreground">{offer.buyer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Date Submitted</p>
                        <p className="font-medium text-foreground">{offer.date_submitted}</p>
                      </div>
                    </div>
                  </div>

                  {offer.date_accepted && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-muted-foreground">Accepted on:</span>
                        <span className="font-medium text-green-600">{offer.date_accepted}</span>
                      </div>
                    </div>
                  )}

                  {offer.date_paused && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs">
                        <Pause className="w-4 h-4 text-blue-600" />
                        <span className="text-muted-foreground">Paused on:</span>
                        <span className="font-medium text-blue-600">{offer.date_paused}</span>
                      </div>
                    </div>
                  )}

                  {offer.date_completed && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-purple-600" />
                        <span className="text-muted-foreground">Completed on:</span>
                        <span className="font-medium text-purple-600">{offer.date_completed}</span>
                      </div>
                    </div>
                  )}

                  {offer.date_cancelled && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-muted-foreground">Cancelled on:</span>
                        <span className="font-medium text-red-600">{offer.date_cancelled}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-muted/20 flex items-center justify-between gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(offer.id)}
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
                    {offer.status === 'unaccepted' && (
                      <>
                        <Button size="sm" variant="outline">
                          Reject
                        </Button>
                        <Button size="sm">
                          Accept Offer
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-gradient-to-br from-muted/30 to-muted/10 p-5 animate-in fade-in-50 duration-300">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                          <Package className="w-5 h-5 text-accent" />
                          Product Details
                        </h4>
                        <p className="text-muted-foreground">{offer.description}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                          <User className="w-5 h-5 text-accent" />
                          Buyer Information
                        </h4>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-foreground">Company</p>
                              <p className="text-sm text-muted-foreground">{offer.buyer_company}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">Contact Person</p>
                              <p className="text-sm text-muted-foreground">{offer.buyer_name}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">Location</p>
                              <p className="text-sm text-muted-foreground">{offer.buyer_location}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">Offer ID</p>
                              <p className="text-sm text-muted-foreground">{offer.offer_id}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                        <div>
                          <p className="text-sm font-medium text-foreground">Batch ID</p>
                          <p className="text-sm text-muted-foreground">{offer.batch_id}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Total Amount</p>
                          <p className="text-sm text-muted-foreground font-medium">{offer.offered_price}</p>
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
    return staticOffersReceivedData[tab as keyof typeof staticOffersReceivedData]?.length || 0;
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
                <h1 className="text-2xl font-bold text-foreground">Offers Received</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate("/dashboard")} className="shadow-soft">
                Back to Dashboard
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
          onClick={() => navigate("/dashboard")}
          className="mb-6 hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Offers Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-10 bg-gradient-to-b from-primary to-accent rounded-full"></div>
              <h2 className="text-2xl font-bold text-foreground">Offers Received from Buyers</h2>
            </div>
          </div>

          <Card className="shadow-large border-0">
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b border-border bg-gradient-to-r from-card to-muted/20 px-6 pt-4">
                  <TabsList className="grid w-full grid-cols-5 bg-muted/50 p-1">
                    <TabsTrigger
                      value="unaccepted"
                      className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-soft transition-all"
                    >
                      <Clock className="w-4 h-4" />
                      <span className="hidden sm:inline">Unaccepted</span>
                      <Badge variant="secondary" className="ml-1 bg-accent/10 text-accent border-accent/20">
                        {getTabCount("unaccepted")}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="accepted"
                      className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-soft transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Accepted</span>
                      <Badge variant="secondary" className="ml-1 bg-accent/10 text-accent border-accent/20">
                        {getTabCount("accepted")}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="pause"
                      className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-soft transition-all"
                    >
                      <Pause className="w-4 h-4" />
                      <span className="hidden sm:inline">Paused</span>
                      <Badge variant="secondary" className="ml-1 bg-accent/10 text-accent border-accent/20">
                        {getTabCount("pause")}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="complete"
                      className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-soft transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Complete</span>
                      <Badge variant="secondary" className="ml-1 bg-accent/10 text-accent border-accent/20">
                        {getTabCount("complete")}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="did_not_get"
                      className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-soft transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Did Not Get</span>
                      <Badge variant="secondary" className="ml-1 bg-accent/10 text-accent border-accent/20">
                        {getTabCount("did_not_get")}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="unaccepted" className="mt-0 p-6">
                  {renderOffersList(staticOffersReceivedData.unaccepted)}
                </TabsContent>

                <TabsContent value="accepted" className="mt-0 p-6">
                  {renderOffersList(staticOffersReceivedData.accepted)}
                </TabsContent>

                <TabsContent value="pause" className="mt-0 p-6">
                  {renderOffersList(staticOffersReceivedData.pause)}
                </TabsContent>

                <TabsContent value="complete" className="mt-0 p-6">
                  {renderOffersList(staticOffersReceivedData.complete)}
                </TabsContent>

                <TabsContent value="did_not_get" className="mt-0 p-6">
                  {renderOffersList(staticOffersReceivedData.did_not_get)}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SellerOffersReceived;


