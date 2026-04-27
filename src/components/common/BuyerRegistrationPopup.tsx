import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FlaskConical } from "lucide-react";

const STORAGE_KEY = "buyerPopupDismissedUntil";
const SUPPRESS_DAYS = 3;
const DELAY_MS = 10_000;
const SCROLL_THRESHOLD = 0.4;

const EXCLUDED_PATHS = ["/auth", "/forgot-password", "/verify-email", "/admin"];

export const BuyerRegistrationPopup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Don't show if logged in
    if (localStorage.getItem("userId")) return;

    // Don't show on auth/admin pages
    if (EXCLUDED_PATHS.some((p) => location.pathname.startsWith(p))) return;

    // Don't show if suppressed
    const suppressedUntil = localStorage.getItem(STORAGE_KEY);
    if (suppressedUntil && Date.now() < Number(suppressedUntil)) return;

    let fired = false;

    const show = () => {
      if (fired) return;
      fired = true;
      setOpen(true);
    };

    const timer = setTimeout(show, DELAY_MS);

    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0 && window.scrollY / total >= SCROLL_THRESHOLD) show();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [location.pathname]);

  const suppress = () => {
    const until = Date.now() + SUPPRESS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, String(until));
  };

  const dismiss = () => {
    setOpen(false);
    suppress();
  };

  const goRegister = () => {
    setOpen(false);
    suppress();
    navigate("/auth?type=buyer&mode=signup");
  };

  const benefits = [
    t("buyerPopup.benefit1"),
    t("buyerPopup.benefit2"),
    t("buyerPopup.benefit3"),
    t("buyerPopup.benefit4"),
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className="bg-[hsl(155,72%,17%)] px-6 pt-6 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="w-5 h-5 text-green-300" />
            <span className="text-green-300 text-xs font-semibold uppercase tracking-widest">
              {t("buyerPopup.eyebrow")}
            </span>
          </div>
          <h2 className="text-white text-xl font-bold leading-snug">
            {t("buyerPopup.title")}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {t("buyerPopup.description")}
          </p>

          <ul className="space-y-2 mb-6">
            {benefits.map((benefit, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-green-600 font-bold">✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 bg-[hsl(155,72%,17%)] hover:bg-[hsl(155,72%,22%)] text-white"
              onClick={goRegister}
            >
              {t("buyerPopup.cta")}
            </Button>
            <Button variant="ghost" className="flex-1 text-muted-foreground" onClick={dismiss}>
              {t("buyerPopup.dismiss")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
