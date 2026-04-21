// initSellerSocket.js
import { getSocket } from "@/services/socket";
import { emitSellerEvent } from "./sellerEvents";
import { pushListingSoldEvent } from "../utils/gtm";

let initialized = false;

export const initSellerSocket = () => {
  const socket = getSocket();

  if (!socket) {
    console.warn("Seller socket not available!");
    return;
  }

  if (initialized) {
    console.log("Seller socket already initialized");
    return;
  }
  initialized = true;

  const sellerEvents = [
    "seller_batch_updated",
    "notification",
    "network_invitation_sent",
    "seller_added_to_network",
    "network_invitation_accepted"
  ];

  sellerEvents.forEach((event) => {
    socket.off(event);
    socket.on(event, (data) => {
      console.log(`✅ Seller Event Received: ${event}`, data);
      emitSellerEvent();
    });
  });

  // Backend ships listing_sold socket event on payment confirm / offer accept (pending).
  socket.off("listing_sold");
  socket.on("listing_sold", (payload) => {
    console.log("✅ Seller Event Received: listing_sold", payload);
    try {
      pushListingSoldEvent({
        transaction_id: payload?.transaction_id,
        listing_id: payload?.listing_id,
        listing_category: payload?.listing_category,
        sold_price: payload?.sold_price,
        asking_price: payload?.asking_price,
        days_to_sell: payload?.days_to_sell,
        total_bids_received: payload?.total_bids_received,
        total_offers_received: payload?.total_offers_received,
        deal_type: payload?.deal_type,
        currency: payload?.currency,
      });
    } catch (gtmErr) {
      console.warn("[GTM] listing_sold event failed:", gtmErr);
    }
    emitSellerEvent();
  });

  socket.on("connect", () => {
    console.log("🔌 Seller socket connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("❌ Seller socket disconnected");
  });

  console.log("✅ Seller socket listeners initialized");
};
