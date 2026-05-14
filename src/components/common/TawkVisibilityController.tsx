import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const ALLOW_EXACT = new Set<string>([
  "/",
  "/factories",
  "/resellers",
  "/sell",
  "/sell-with-greenbidz",
  "/direct-sales",
  "/auth",
  "/forgot-password",
  "/verify-email",
  "/marketplace",
  "/buyer-marketplace",
  "/wanted",
  "/blog",
]);

const ALLOW_PREFIX = [
  "/blog/",
  "/buyer-marketplace/",
  "/marketplace/",
];

const isAllowedPath = (path: string): boolean => {
  if (ALLOW_EXACT.has(path)) return true;
  return ALLOW_PREFIX.some((p) => path.startsWith(p));
};

declare global {
  interface Window {
    Tawk_API?: {
      showWidget?: () => void;
      hideWidget?: () => void;
      onLoad?: () => void;
    };
  }
}

export default function TawkVisibilityController() {
  const { pathname } = useLocation();
  const [inAppChatOpen, setInAppChatOpen] = useState(false);

  // Listen for in-app chat drawer open/close events so the Tawk customer-support
  // widget can step aside while a seller chat is open (avoids two chat UIs colliding).
  useEffect(() => {
    const onOpen = () => setInAppChatOpen(true);
    const onClose = () => setInAppChatOpen(false);
    window.addEventListener("app-chat-open", onOpen);
    window.addEventListener("app-chat-close", onClose);
    return () => {
      window.removeEventListener("app-chat-open", onOpen);
      window.removeEventListener("app-chat-close", onClose);
    };
  }, []);

  useEffect(() => {
    const allowed = isAllowedPath(pathname) && !inAppChatOpen;

    const apply = (): boolean => {
      const api = window.Tawk_API;
      if (!api || (!api.showWidget && !api.hideWidget)) return false;
      try {
        if (allowed) api.showWidget?.();
        else api.hideWidget?.();
        return true;
      } catch {
        return false;
      }
    };

    if (apply()) return;

    const interval = window.setInterval(() => {
      if (apply()) window.clearInterval(interval);
    }, 300);
    const timeout = window.setTimeout(() => window.clearInterval(interval), 10000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [pathname, inAppChatOpen]);

  return null;
}
