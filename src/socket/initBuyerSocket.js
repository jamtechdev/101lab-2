import { getSocket } from "@/services/socket";
import { emitBuyerEvent } from "./buyerEvents";

let initialized = false; 

export const initBuyerSocket = () => {
  const socket = getSocket();

  if (!socket) {
    console.warn(" Buyer socket not available!");
    return;
  }

  // Prevent multiple bindings
  if (initialized) {
    console.log("Buyer socket already initialized");
    return;
  }
  initialized = true;

  // All buyer-related events
  const buyerEvents = [
    "inspection_created",
    "inspection_updated",
    "inspection_complete",
    "company_registered",
    "bidding_started",
    "mark_winner",
    "bid_created",
    "bid_placed",
    "batch_created",
    "batch_updated",
    "demo-working",
    "demo-working1",
    "notification_created",
    "notification",
    "batch_updated",
    "pickup-scheduled",
    // "seller_batch_updated"
  ];

  // Register listeners
  buyerEvents.forEach((event) => {
    socket.off(event); // ensure no duplicates
    socket.on(event, (data) => {
      console.log(`✅ Buyer Event Received: ${event}`, data);
      emitBuyerEvent(); 
    });
  });

  // Reconnect support
  socket.on("connect", () => {
    console.log("🔌 Buyer socket connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log(" Buyer socket disconnected");
  });

  console.log("✅ Buyer socket listeners initialized");
};
