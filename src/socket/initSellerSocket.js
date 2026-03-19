// initSellerSocket.js
import { getSocket } from "@/services/socket";
import { emitSellerEvent } from "./sellerEvents";

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

  socket.on("connect", () => {
    console.log("🔌 Seller socket connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("❌ Seller socket disconnected");
  });

  console.log("✅ Seller socket listeners initialized");
};
