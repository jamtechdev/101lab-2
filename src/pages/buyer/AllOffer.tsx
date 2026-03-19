import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DollarSign, MessageCircle, Package, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import ChatSidebarWrapper from "@/components/common/ChatSidebarWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TABS = [
  { key: "pending", label: "Unaccepted" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Didn't get" },
] as const;

type OfferStatus = "pending" | "accepted" | "rejected";

interface BuyerAllOffersProps {
  data: any;
  isLoading: boolean;
}

export default function BuyerAllOffers({ data, isLoading }: BuyerAllOffersProps) {
  const navigate = useNavigate();

  const [status, setStatus] = useState<OfferStatus>("pending");
  const [batchId, setBatchId] = useState<number | null>(null);
  const [sellerId, setSellerId] = useState<number | null>(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  const allOffers = data?.data ?? [];

  const filteredOffers = useMemo(() => {
    return allOffers.filter((offer) => offer.status === status);
  }, [allOffers, status]);

  const handleMessage = (offer: any) => {
    setBatchId(offer.batch_id);
    setSellerId(offer.seller_id);
    setShowMessageDialog(true);
  };

  const handleCloseChat = () => {
    setBatchId(null);
    setSellerId(null);
    setShowMessageDialog(false);
  };

  const handleViewBatch = (batchId: number) => {
    navigate(`/batch/${batchId}`);
  };

  return (
    <div className="space-y-6  mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">My Offers</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatus(tab.key)}
            className={cn(
              "px-5 py-2.5 text-sm font-medium transition-all relative",
              status === tab.key
                ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-10 w-10 border-3 border-blue-600 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredOffers.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 text-lg">No offers found</p>
          <p className="text-gray-400 text-sm mt-1">Your {status} offers will appear here</p>
        </div>
      )}

      {/* Offers List */}
      <div className="space-y-4">
        {filteredOffers.map((offer: any) => {
          const product = offer.batch?.products?.[0];
          const batch = offer.batch;
          
          return (
            <Card 
              key={offer.offer_id} 
              className="border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              <CardContent className="p-0">
                {/* Batch Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">
                      Batch #{batch?.batch_id || offer.batch_id}
                    </h3>
                    <Badge 
                      variant="outline" 
                      className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                    >
                      {batch?.status || "Scheduled"}
                    </Badge>
                  </div>
                  {/* <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewBatch(offer.batch_id)}
                    className="text-sm font-medium border-gray-300 hover:bg-gray-100"
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    View Batch
                  </Button> */}
                </div>

                {/* Batch Details */}
                {(batch?.inspection_date || batch?.registered_date) && (
                  <div className="px-6 py-3 bg-white border-b border-gray-100 flex gap-8 text-sm">
                    {batch?.inspection_date && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="font-medium">Inspection:</span>
                        <span>{new Date(batch.inspection_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {batch?.registered_date && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="font-medium">Registered:</span>
                        <span>{new Date(batch.registered_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Product Section */}
                <div className="px-6 py-5">
                  <div className="flex items-start gap-2 mb-4">
                    <Package className="h-5 w-5 text-teal-600 mt-0.5" />
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">Products</h4>
                      <Badge variant="secondary" className="bg-teal-50 text-teal-700 text-xs">
                        {batch?.products?.length || 1} item{(batch?.products?.length || 1) > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>

                  {/* Product Card with Image Carousel */}
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
                        {/* Product Title & Badge */}
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h5 className="text-lg font-semibold text-gray-900 leading-tight">
                              {product?.title || "Product Title"}
                            </h5>
                            <Badge 
                              variant="outline" 
                              className="bg-teal-50 text-teal-700 border-teal-200 text-xs flex-shrink-0"
                            >
                              #{product?.product_id || 1}
                            </Badge>
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

                        {/* Offer Details */}
                        <div className="pt-3 border-t border-gray-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Offer Price:</span>
                            <span className="text-lg font-semibold text-gray-900">
                              ${offer.offer_price}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Quantity:</span>
                            <span className="text-base font-medium text-gray-900">
                              {offer.offer_quantity}
                            </span>
                          </div>
                          {offer.message && (
                            <div className="pt-2">
                              <p className="text-xs text-gray-500 mb-1">Your Message:</p>
                              <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-200">
                                {offer.message}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Status & Action */}
                        <div className="flex items-center justify-between pt-3">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-sm px-3 py-1",
                              offer.status === "pending" && "bg-yellow-100 text-yellow-800 border-yellow-200",
                              offer.status === "accepted" && "bg-green-100 text-green-800 border-green-200",
                              offer.status === "rejected" && "bg-red-100 text-red-800 border-red-200"
                            )}
                          >
                            {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                          </Badge>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleMessage(offer)}
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