// @ts-nocheck
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useGetOwnerOffersQuery, useUpdateOfferStatusMutation } from "@/rtk/slices/bidApiSlice";
import { Button } from "@/components/ui/button";
import ChatSidebarWrapper from "@/components/common/ChatSidebarWrapper"; // import chat wrapper
import { pushOfferReceivedEvent } from "@/utils/gtm";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
};   

const SellerOffer = () => {
  const sellerID = localStorage.getItem("userId") || "";
  const { data: offerData, isLoading, error, refetch } = useGetOwnerOffersQuery({ sellerID });
  const [updateOfferStatus] = useUpdateOfferStatusMutation();
  const [expandedOffers, setExpandedOffers] = useState<Set<number>>(new Set());

  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatBatchId, setChatBatchId] = useState<number | null>(null);
  const [chatBuyerId, setChatBuyerId] = useState<number | null>(null);

  const offers = Array.isArray(offerData?.data) ? offerData.data : [];

  // GA4 tracking — offer_received (fires once per pending offer; helper dedupes by offer_id)
  useEffect(() => {
    if (!Array.isArray(offers) || offers.length === 0) return;
    try {
      for (const offer of offers) {
        if (offer?.status && offer.status !== "pending") continue;
        const product: any = offer?.batch?.products?.[0];
        const metaVal = (key: string) =>
          product?.meta?.find((m: any) => m.meta_key === key)?.meta_value;
        // Prefer new backend field `offer.asking_price`; fall back to meta lookup
        // (price_per_unit → replacement_cost_per_unit → 0) for backwards compatibility.
        const fallbackAskingPriceRaw =
          metaVal("price_per_unit") ??
          metaVal("replacement_cost_per_unit") ??
          0;
        const askingPrice =
          offer?.asking_price !== undefined && offer?.asking_price !== null
            ? Number(offer.asking_price) || 0
            : Number(fallbackAskingPriceRaw) || 0;
        // Prefer new backend field `offer.offer_round`; fall back to 1.
        const offerRound =
          offer?.offer_round !== undefined && offer?.offer_round !== null
            ? Number(offer.offer_round) || 1
            : 1;
        // Prefer new backend field `offer.currency`; helper defaults to INR if undefined.
        const currency = offer?.currency ?? undefined;
        pushOfferReceivedEvent({
          listing_id:   offer?.batch?.batch_id ?? "",
          offer_id:     offer?.offer_id ?? "",
          offer_amount: Number(offer?.offer_price) || 0,
          asking_price: askingPrice,
          offer_round:  offerRound,
          currency,
        });
      }
    } catch { /* tracking errors must never affect UX */ }
  }, [offerData]);

  const handleStatusUpdate = async (offer_id: number, status: "accepted" | "rejected") => {
    const isConfirmed = window.confirm(`Are you sure you want to ${status} this offer?`);
    if (!isConfirmed) return;

    const lang=localStorage.getItem("language") || "en"

    try {
      await updateOfferStatus({ offer_id, status,lang }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to update offer status:", err);
      alert("Failed to update offer status. Please try again.");
    }
  };

  const toggleExpanded = (offer_id: number) => {
    setExpandedOffers((prev) => {
      const next = new Set(prev);
      if (next.has(offer_id)) next.delete(offer_id);
      else next.add(offer_id);
      return next;
    });
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

  if (isLoading)
    return (
      <DashboardLayout>
        <p>Loading offers...</p>
      </DashboardLayout>
    );

  if (error)
    return (
      <DashboardLayout>
        <p>Error loading offers</p>
      </DashboardLayout>
    );


    console.log("offers is",offers)

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Seller Offers Received</h1>
          <p className="text-slate-600">View and manage offers sent by buyers</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {offers.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-600">
              No offers received yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {offers.map((offer) => {
                const isExpanded = expandedOffers.has(offer.offer_id);
                const product = offer.batch?.products?.[0]; // assume one product per batch
                const batch = offer.batch;
                const buyer = offer.buyer;

                // helper to find meta value
                const getMeta = (key: string) =>
                  product?.meta?.find((m: any) => m.meta_key === key)?.meta_value;

                return (
                  <div key={offer.offer_id} className="border-b border-slate-200">
                    {/* Offer summary */}
                    <div className="flex items-center justify-between px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Offer #{offer.offer_id}</p>
                        <p className="text-xs text-slate-500">
                          Buyer #{offer.user_id} • Quantity: {offer.offer_quantity} • ${Number(offer.offer_price).toFixed(2)}
                        </p>
                        {offer.message && <p className="text-xs text-slate-400">{offer.message}</p>}
                        <span
                          className={`inline-flex items-center px-2 py-1 mt-1 text-xs font-medium rounded ${statusColors[offer.status]}`}
                        >
                          {offer.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {offer.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => handleStatusUpdate(offer.offer_id, "accepted")}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-xs"
                              onClick={() => handleStatusUpdate(offer.offer_id, "rejected")}
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        {/* View More / Less button */}
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-xs"
                          onClick={() => toggleExpanded(offer.offer_id)}
                        >
                          {isExpanded ? "View Less" : "View More"}
                        </Button>

                        {/* Chat Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => handleOpenChat(batch.batch_id, offer.user_id)}
                        >
                          Chat
                        </Button>
                      </div>
                    </div>

                    {/* Expanded product, batch, buyer details */}
                    {isExpanded && product && (
                      <div className="bg-slate-50 p-6 flex flex-col gap-4">
                        <div className="flex gap-6">
                          <img
                            src={product.image1}
                            alt="Product"
                            className="w-24 h-24 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="text-sm text-slate-600 mb-2">{product.description}</p>
                            {product.categories?.length > 0 && (
                              <p className="text-xs text-slate-500">
                                Category: {product.categories.map((c: any) => c.term).join(", ")}
                              </p>
                            )}
                            {/* Product meta details */}
                            <p className="text-xs text-slate-500 mt-2">
                              Replacement Cost per Unit: ${getMeta("replacement_cost_per_unit")}
                            </p>
                            <p className="text-xs text-slate-500">
                              Weight per Unit: {getMeta("weight_per_unit")} kg
                            </p>
                            <p className="text-xs text-slate-500">
                              Quantity: {getMeta("quantity")}
                            </p>
                            <p className="text-xs text-slate-500">
                              Condition: {getMeta("condition")?.replace(/a:1:{i:0;s:\d+:"/, "").replace('";}', '')}
                            </p>
                          </div>
                        </div>

                        {/* Batch details */}
                        <div className="border-t border-slate-200 pt-2 text-xs text-slate-500">
                          <p>Batch Number: {batch?.batch_number}</p>
                          <p>Batch Status: {batch?.batch_status}</p>
                          <p>Visibility: {batch?.visibility}</p>
                        </div>

                        {/* Buyer details */}
                        {buyer && (
                          <div className="border-t border-slate-200 pt-2 text-xs text-slate-500">
                            <p>Buyer Name: {buyer.display_name}</p>
                            <p>Buyer Email: {buyer.user_email}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Sidebar */}
      <ChatSidebarWrapper
        isOpen={showChat}
        onClose={handleCloseChat}
        batchId={chatBatchId}
        sellerId={Number(chatBuyerId)}
        // buyerId={chatBuyerId}
        embedded={false}
      />
    </DashboardLayout>
  );
};

export default SellerOffer;
