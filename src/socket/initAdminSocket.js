import { getSocket } from "@/services/socket";
import { emitAdminEvent } from "./adminEvent";

let initialized = false; 

export const initAdminSocket = () => {
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

  // All admin-related events
  const adminEvents = [
    "batch_updated",
    "user_add",
    "adminNotification",
  ];

  // Register listeners
  adminEvents.forEach((event) => {
    socket.off(event); // ensure no duplicates
    socket.on(event, () => {
      console.log(` Admin Event Received: ${event}`);
      emitAdminEvent()
    });
  });

  // Reconnect support
  socket.on("connect", () => {
    console.log("🔌 Admin socket connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log(" Admin socket disconnected");
  });

  console.log(" Admin socket listeners initialized");
};
