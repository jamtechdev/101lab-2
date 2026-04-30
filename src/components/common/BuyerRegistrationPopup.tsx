import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Clock, Gavel, X } from "lucide-react";

const DELAY_MS = 40_000;

export const BuyerRegistrationPopup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("userId")) return;
    if (location.pathname.startsWith("/auth")) return;

    const timer = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    if (open) return;
    if (localStorage.getItem("userId")) return;
    if (location.pathname.startsWith("/auth")) return;

    const timer = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [open]);

  const dismiss = () => setOpen(false);
  const goRegister = () => { setOpen(false); navigate("/auth?mode=signin"); };

  const badges = [
    t("buyerPopup.badge1"),
    t("buyerPopup.badge2"),
    t("buyerPopup.badge3"),
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-[460px] translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-lg shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
        {/* Brand-coloured top bar */}
        <div className="bg-[hsl(155,72%,17%)] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-300 shrink-0" />
            <span className="text-white text-xs font-bold uppercase tracking-widest">
              {t("buyerPopup.banner")}
            </span>
          </div>
          <button
            onClick={dismiss}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="bg-white px-8 py-8 text-center">
          {/* Icon circle */}
          <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Gavel className="w-7 h-7 text-[hsl(155,72%,17%)]" />
          </div>

          {/* Title */}
          <h2 className="text-[1.45rem] font-extrabold text-gray-900 leading-snug mb-1">
            {t("buyerPopup.titleLine1")}
          </h2>
          <h2 className="text-[1.45rem] font-extrabold text-[hsl(155,72%,17%)] leading-snug mb-4">
            {t("buyerPopup.titleLine2")}
          </h2>

          {/* Description */}
          <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-sm mx-auto">
            {t("buyerPopup.description")}
          </p>

          {/* CTA */}
          <Button
            className="w-full bg-[hsl(155,72%,17%)] hover:bg-[hsl(155,72%,22%)] text-white font-bold text-base py-6 rounded-lg"
            onClick={goRegister}
          >
            {t("buyerPopup.cta")} →
          </Button>

          {/* Trust badges */}
          <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
            {badges.map((badge, i) => (
              <span key={i} className="flex items-center gap-1 text-xs text-gray-500">
                <span className="text-[hsl(155,72%,17%)]">✓</span>
                {badge}
              </span>
            ))}
          </div>
        </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
