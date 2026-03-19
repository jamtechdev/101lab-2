import { getSocket } from "@/services/socket";

if (!window.__globalSocketInit) window.__globalSocketInit = false;

export const initGlobalSocket = () => {
  if (window.__globalSocketInit) {
    console.log("⚡ Global socket already initialized");
    return;
  }
  window.__globalSocketInit = true;

  const socket = getSocket();
  console.log("⚡ Global socket initialized");
};
