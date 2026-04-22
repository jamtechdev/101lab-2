import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { pushPageViewEvent } from "@/utils/gtm";
import i18n from "@/i18n/config";

const SUPPORTED_LANGS = ["en", "zh", "ja", "th"];

export default function RouteTracker() {
  const location = useLocation();
  const prevPath = useRef<string>("");

  useEffect(() => {
    if (location.pathname === prevPath.current) return;
    prevPath.current = location.pathname;
    pushPageViewEvent(location.pathname + location.search);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const lang = params.get("lang");
    if (lang && SUPPORTED_LANGS.includes(lang)) {
      localStorage.setItem("language", lang);
      i18n.changeLanguage(lang);
    }
  }, [location.search]);

  return null;
}
