import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { pushPageViewEvent } from "@/utils/gtm";

export default function RouteTracker() {
  const location = useLocation();
  const prevPath = useRef<string>("");

  useEffect(() => {
    if (location.pathname === prevPath.current) return;
    prevPath.current = location.pathname;
    pushPageViewEvent(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return null;
}
