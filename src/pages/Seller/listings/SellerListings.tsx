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
  Eye,
  Edit,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  TrendingUp,
  Archive,
  Play,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import logo from "@/assets/greenbidz_logo.png";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";

// Static data for listings
const staticListingsData = {
  active: [
    {
      id: 1,
      batch_id: "BATCH-001",
      title: "Industrial Copper Wire Scrap",
      quantity: "500 kg",
      starting_price: "$2,400",
      current_price: "$2,450",
      end_date: "2024-01-25",
      status: "active",
      image: "/placeholder.png",
      description: "High-grade copper wire scrap from manufacturing process.",
      bids_count: 3,
      views_count: 25,
      category: "Copper Scrap"
    },
    {
      id: 2,
      batch_id: "BATCH-002",
      title: "Aluminum Beverage Cans",
      quantity: "1,200 kg",
      starting_price: "$850",
      current_price: "$890",
      end_date: "2024-01-28",
      status: "active",
      image: "/placeholder.png",
      description: "Clean aluminum beverage cans ready for recycling.",
      bids_count: 5,
      views_count: 42,
      category: "Aluminum Scrap"
    }
  ],
  draft: [
    {
      id: 3,
      batch_id: "BATCH-003",
      title: "Plastic PET Bottles",
      quantity: "800 kg",
      starting_price: "$1,200",
      current_price: "$1,200",
      created_date: "2024-01-10",
      status: "draft",
      image: "/placeholder.png",
      description: "Clear PET bottles, washed and ready for processing.",
      bids_count: 0,
      views_count: 0,
      category: "Plastic Scrap"
    }
  ],
  expired: [
    {
      id: 4,
      batch_id: "BATCH-004",
      title: "Mixed Paper Scrap",
      quantity: "600 kg",
      starting_price: "$400",
      final_price: "$420",
      end_date: "2024-01-15",
      status: "expired",
      image: "/placeholder.png",
      description: "Mixed office paper and cardboard.",
      bids_count: 2,
      views_count: 18,
      category: "Paper Scrap",
      winner: "Green Buyers Ltd"
    },
    {
      id: 5,
      batch_id: "BATCH-005",
      title: "Glass Bottles",
      quantity: "1,000 kg",
      starting_price: "$600",
      final_price: "$650",
      end_date: "2024-01-12",
      status: "expired",
      image: "/placeholder.png",
      description: "Mixed color glass bottles, sorted and cleaned.",
      bids_count: 4,
      views_count: 35,
      category: "Glass Scrap",
      winner: "Recycle Masters Ltd"
    }
  ],
  inactive: [
    {
      id: 6,
      batch_id: "BATCH-006",
      title: "Steel Scrap",
      quantity: "2,000 kg",
      starting_price: "$1,700",
      current_price: "$1,800",
      end_date: "2024-01-08",
      status: "inactive",
      image: "/placeholder.png",
      description: "Mixed steel scrap from construction.",
      bids_count: 1,
      views_count: 12,
      category: "Steel Scrap",
      reason: "Cancelled by seller"
    }
  ]
};

const SellerListings: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<string>("active");
  const [expandedListings, setExpandedListings] = useState<Set<number>>(new Set());

  const statusConfig: Record<string, any> = {
    active: {
      label: "Active",
      color: "bg-green-100 text-green-800",
      icon: Play
    },
    draft: {
      label: "Draft",
      color: "bg-gray-100 text-gray-800",
      icon: Edit
    },
    expired: {
      label: "Expired",
      color: "bg-blue-100 text-blue-800",
      icon: Archive
    },
    inactive: {
      label: "Inactive",
      color: "bg-red-100 text-red-800",
      icon: AlertCircle
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
    setExpandedListings(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderListingsList = (listings: any[]) => {
    if (listings.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-lg font-medium">No listings found</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4">
        {listings.map((listing) => {
          const isExpanded = expandedListings.has(listing.id);

          return (
            <Card key={listing.id} className="border hover:border-accent/50 hover:shadow-large transition-all duration-300 group overflow-hidden">
              <CardContent className="p-0">
                <div className="p-5 bg-gradient-to-r from-card to-muted/20 border-b border-border">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg text-foreground">{listing.batch_id}</h3>
                        {getStatusBadge(listing.status)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {listing.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Category: {listing.category}
                      </p>
                    </div>
                    <div className="relative flex-shrink-0">
                      <img
                        src={listing.image}
                        alt="product"
                        className="w-16 h-16 object-cover rounded-lg border-2 border-border shadow-soft group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-xs">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">
                          {listing.final_price ? 'Final Price' : 'Current Price'}
                        </p>
                        <p className="font-medium text-foreground">
                          {listing.final_price || listing.current_price}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Quantity</p>
                        <p className="font-medium text-foreground">{listing.quantity}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Bids</p>
                        <p className="font-medium text-foreground">{listing.bids_count}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Views</p>
                        <p className="font-medium text-foreground">{listing.views_count}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">
                          {listing.status === 'draft' ? 'Created' : 'End Date'}
                        </p>
                        <p className="font-medium text-foreground">
                          {listing.created_date || listing.end_date}
                        </p>
                      </div>
                    </div>
                    {listing.winner && (
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-muted-foreground">Winner</p>
                          <p className="font-medium text-green-600">{listing.winner}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-muted/20 flex items-center justify-between gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(listing.id)}
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
                    {listing.status === 'draft' && (
                      <Button size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                    {listing.status === 'active' && (
                      <Button size="sm">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View Bids
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
                          Product Details
                        </h4>
                        <p className="text-muted-foreground">{listing.description}</p>
                      </div>

                      {listing.reason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <h5 className="font-medium text-red-800 mb-2">Reason for Inactivity</h5>
                          <p className="text-red-700">{listing.reason}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                        <div>
                          <p className="text-sm font-medium text-foreground">Batch ID</p>
                          <p className="text-sm text-muted-foreground">{listing.batch_id}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Category</p>
                          <p className="text-sm text-muted-foreground">{listing.category}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Starting Price</p>
                          <p className="text-sm text-muted-foreground">{listing.starting_price}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Total Bids</p>
                          <p className="text-sm text-muted-foreground">{listing.bids_count}</p>
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
    return staticListingsData[tab as keyof typeof staticListingsData]?.length || 0;
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
                <h1 className="text-2xl font-bold text-foreground">Product Listings</h1>
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

        {/* Listings Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-10 bg-gradient-to-b from-primary to-accent rounded-full"></div>
              <h2 className="text-2xl font-bold text-foreground">My Product Listings</h2>
            </div>
            <Button>
              Create New Listing
            </Button>
          </div>

          <Card className="shadow-large border-0">
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b border-border bg-gradient-to-r from-card to-muted/20 px-6 pt-4">
                  <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1">
                    <TabsTrigger
                      value="active"
                      className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-soft transition-all"
                    >
                      <Play className="w-4 h-4" />
                      <span className="hidden sm:inline">Active</span>
                      <Badge variant="secondary" className="ml-1 bg-accent/10 text-accent border-accent/20">
                        {getTabCount("active")}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="draft"
                      className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-soft transition-all"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline">Draft</span>
                      <Badge variant="secondary" className="ml-1 bg-accent/10 text-accent border-accent/20">
                        {getTabCount("draft")}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="expired"
                      className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-soft transition-all"
                    >
                      <Archive className="w-4 h-4" />
                      <span className="hidden sm:inline">Expired</span>
                      <Badge variant="secondary" className="ml-1 bg-accent/10 text-accent border-accent/20">
                        {getTabCount("expired")}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="inactive"
                      className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-soft transition-all"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Inactive</span>
                      <Badge variant="secondary" className="ml-1 bg-accent/10 text-accent border-accent/20">
                        {getTabCount("inactive")}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="active" className="mt-0 p-6">
                  {renderListingsList(staticListingsData.active)}
                </TabsContent>

                <TabsContent value="draft" className="mt-0 p-6">
                  {renderListingsList(staticListingsData.draft)}
                </TabsContent>

                <TabsContent value="expired" className="mt-0 p-6">
                  {renderListingsList(staticListingsData.expired)}
                </TabsContent>

                <TabsContent value="inactive" className="mt-0 p-6">
                  {renderListingsList(staticListingsData.inactive)}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SellerListings;
















