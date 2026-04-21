import { useState, useMemo, useEffect, useRef } from "react";
import { DollarSign, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGetUserOffersQuery } from "@/rtk/slices/bidApiSlice";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import ChatSidebarWrapper from "@/components/common/ChatSidebarWrapper";
import { pushPurchaseEvent } from "@/utils/gtm";

const TABS = [
  { key: "pending", label: "Unaccepted" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Didn't get" },
];

export default function BuyerOffers() {
  const buyerId = localStorage.getItem("userId") || "";

  const [batchId, setBatchId] = useState<number | null>(null);
  const [sellerId, setSellerId] = useState<number | null>(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  const [status, setStatus] = useState<
    "pending" | "accepted" | "rejected"
  >("pending");

  const { data, isLoading } = useGetUserOffersQuery(
    { buyer_id: buyerId },
    { skip: !buyerId }
  );

  const allOffers = data?.data || [];

  const filteredOffers = useMemo(() => {
    return allOffers.filter((offer) => offer.status === status);
  }, [allOffers, status]);

  const firedOfferIdsRef = useRef<Set<string | number>>(new Set());

  useEffect(() => {
    try {
      const acceptedOffers = allOffers.filter((o: any) => o.status === "accepted");
      acceptedOffers.forEach((offer: any) => {
        if (!offer?.offer_id) return;
        if (firedOfferIdsRef.current.has(offer.offer_id)) return;
        firedOfferIdsRef.current.add(offer.offer_id);

        try {
          // Prefer the server-generated UUID `transaction_id` so the buyer's
          // `purchase` event can be reconciled with the seller's `listing_sold`
          // event. Fall back to the client-synthesized `offer-<id>` string only
          // while the backend field hasn't shipped yet.
          const transactionId =
            offer?.transaction_id ?? `offer-${offer.offer_id}`;
          pushPurchaseEvent({
            transaction_id: String(transactionId),
            transaction_type: "offer_accepted",
            offer_rounds: offer.round || offer.offer_round || 1,
            value: offer.amount,
            currency: offer.currency || "INR",
            items: [{
              item_id: offer.batch_id,
              item_name: offer.batch?.products?.[0]?.title || "",
              item_category: offer.batch?.products?.[0]?.categories?.[0]?.term || "",
              price: offer.amount,
              quantity: 1,
            }],
          });
        } catch (gtmInnerErr) {
          console.warn("[GTM] purchase event (offer_accepted) failed:", gtmInnerErr);
        }
      });
    } catch (gtmErr) {
      console.warn("[GTM] purchase effect (offer_accepted) failed:", gtmErr);
    }
  }, [allOffers]);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="text-sm text-muted-foreground">
          Buying / Receiving &gt; Submitted offers
        </div>

        <h1 className="text-2xl font-semibold">Submitted offers</h1>

        {/* Tabs */}
        <div className="flex gap-6 border-b">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatus(tab.key as any)}
              className={cn(
                "pb-2 text-sm font-medium",
                status === tab.key
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Offers */}
        {isLoading ? (
          <div className="p-10 text-center">Loading...</div>
        ) : filteredOffers.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            Nothing here
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOffers.map((offer) => {
              const product = offer?.batch?.products?.[0];
              const category =
                product?.categories?.[0]?.term || "—";

              return (
                <div
                  key={offer.offer_id}
                  className="flex gap-4 rounded-lg border bg-background p-4"
                >
                  {/* Product Image */}
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md border">
                    <img
                      src={product?.image1 || "/placeholder.png"}
                      alt={product?.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium leading-tight">
                        {product?.title || "Product"}
                      </h3>

                      <p className="text-xs text-muted-foreground">
                        Category: {category}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Offer ID: #{offer.offer_id}
                      </p>

                      {/* Seller Info */}
                      {offer.seller && (
                        <div className="text-xs text-muted-foreground">
                          Seller: {offer.seller.display_name} <br />
                          Email: {offer.seller.user_email}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3">
                      {/* Price + Qty */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {offer.offer_price}
                        </div>
                        <div>Qty: {offer.offer_quantity}</div>
                      </div>

                      {/* Status + Chat */}
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-medium capitalize",
                            offer.status === "pending" &&
                            "bg-yellow-100 text-yellow-700",
                            offer.status === "accepted" &&
                            "bg-green-100 text-green-700",
                            offer.status === "rejected" &&
                            "bg-red-100 text-red-700"
                          )}
                        >
                          {offer.status}
                        </span>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMessage(offer)}
                        >
                          <MessageCircle className="mr-1 h-4 w-4" />
                          Chat
                        </Button>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat */}
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
