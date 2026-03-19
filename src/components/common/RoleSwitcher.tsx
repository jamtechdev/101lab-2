import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Building2, ArrowLeftRight, Loader2, Lock, Mail, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSocket } from "@/services/socket";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RoleSwitcherProps {
  variant?: "default" | "segmented";
}

export default function RoleSwitcher({ variant = "default" }: RoleSwitcherProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [switching, setSwitching] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);

  const currentPath = window.location.pathname;
  const isBuyerDashboard = currentPath.startsWith("/buyer-dashboard") || currentPath.startsWith("/buyer/");
  const currentRole = isBuyerDashboard ? "buyer" : "seller";

  // Check if user is a verified seller
  const userRole = localStorage.getItem("userRole");
  const isVerifiedSeller = userRole === "seller";

  const handleSwitch = (targetRole: string) => {
    if (targetRole === currentRole || switching) return;

    // Always allow switching
    setSwitching(true);
    const userId = localStorage.getItem("userId");
    const targetPath = targetRole === "buyer" ? "/buyer-dashboard" : "/dashboard";

    localStorage.setItem("userRole", targetRole);

    try {
      const socket = getSocket();
      if (userId) {
        socket.emit("joinRooms", { user_id: userId, role: targetRole }, (res: any) => {
          console.log("Socket rooms switched to", targetRole, res);
        });
      }
    } catch (_) {}

    setTimeout(() => {
      navigate(targetPath);
      setSwitching(false);
    }, 300);
  };

  const SellerUpgradeModal = () => (
    <Dialog open={showSellerModal} onOpenChange={setShowSellerModal}>
      <DialogContent className="sm:max-w-md border border-border bg-card">
        <DialogHeader className="text-left space-y-3">
          {/* Premium badge */}
          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-[11px] font-semibold px-2.5 py-1 rounded w-fit uppercase tracking-wide">
            <Crown className="w-3 h-3" />
            Exclusive Access
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Become a Power Seller
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Join our network of trusted partners. Seller tools are currently available to verified businesses only. Reach out to our team to request access.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 p-3 rounded bg-muted/50 border border-border">
          <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">What you get</h4>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
              List and manage your inventory
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
              Receive bids and manage auctions
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
              Access analytics and deal reports
            </li>
          </ul>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Button
            asChild
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <a href="mailto:sales@greenbidz.com?subject=Power%20Seller%20Access%20Request&body=Hi%20GreenBidz%20Team%2C%0A%0AI%20would%20like%20to%20request%20access%20to%20the%20Power%20Seller%20tools.%0A%0AThank%20you.">
              <Mail className="w-4 h-4 mr-2" />
              Talk to an Expert
            </a>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSellerModal(false)}
            className="text-muted-foreground text-xs"
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // ── Segmented toggle variant ──
  if (variant === "segmented") {
    return (
      <>
        <div className="flex rounded bg-sidebar-foreground/10 p-0.5">
          <button
            onClick={() => handleSwitch("seller")}
            disabled={switching}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-sm text-[11px] font-medium transition-all duration-200",
              currentRole === "seller"
                ? "bg-sidebar-foreground/15 text-sidebar-foreground shadow-sm"
                : !isVerifiedSeller
                  ? "text-sidebar-foreground/35 hover:text-sidebar-foreground/50 opacity-70"
                  : "text-sidebar-foreground/40 hover:text-sidebar-foreground/60"
            )}
          >
            <Building2 className="w-3 h-3" />
            {t("dashboard.roleSwitcher.seller", "Seller")}
            {!isVerifiedSeller && currentRole !== "seller" && (
              <Lock className="w-2.5 h-2.5 ml-0.5 opacity-60" />
            )}
          </button>
          <button
            onClick={() => handleSwitch("buyer")}
            disabled={switching}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-sm text-[11px] font-medium transition-all duration-200",
              currentRole === "buyer"
                ? "bg-sidebar-foreground/15 text-sidebar-foreground shadow-sm"
                : "text-sidebar-foreground/40 hover:text-sidebar-foreground/60"
            )}
          >
            <Store className="w-3 h-3" />
            {t("dashboard.roleSwitcher.buyer", "Buyer")}
          </button>
        </div>
        <SellerUpgradeModal />
      </>
    );
  }

  // ── Default variant (legacy) ──
  const targetRole = isBuyerDashboard ? "seller" : "buyer";
  const targetLabel = isBuyerDashboard ? t("dashboard.roleSwitcher.sellerDashboard") : t("dashboard.roleSwitcher.buyerDashboard");
  const TargetIcon = isBuyerDashboard ? Building2 : Store;

  return (
    <>
      <div className="mx-4 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-foreground/5 border border-sidebar-border mb-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-sidebar-foreground/40 uppercase tracking-wider font-semibold">
              {t("dashboard.roleSwitcher.currentMode")}
            </p>
            <p className="text-sm font-semibold text-sidebar-foreground capitalize truncate">
              {currentRole === "buyer" ? t("dashboard.roleSwitcher.buyerDashboard") : t("dashboard.roleSwitcher.sellerDashboard")}
            </p>
          </div>
        </div>

        <button
          onClick={() => handleSwitch(targetRole)}
          disabled={switching}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border",
            targetRole === "seller" && !isVerifiedSeller
              ? "border-sidebar-border bg-sidebar-foreground/5 text-sidebar-foreground/60 hover:bg-sidebar-foreground/10 opacity-70"
              : "border-accent/30 bg-accent/5 text-accent hover:bg-accent/15 hover:border-accent/50",
            "disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          {switching ? (
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
          ) : targetRole === "seller" && !isVerifiedSeller ? (
            <Lock className="w-4 h-4 flex-shrink-0" />
          ) : (
            <ArrowLeftRight className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="flex-1 text-left">
            {switching ? t("dashboard.roleSwitcher.switching") : t("dashboard.roleSwitcher.switchTo", { role: targetRole })}
          </span>
          <TargetIcon className="w-4 h-4 flex-shrink-0 opacity-60" />
        </button>
      </div>
      <SellerUpgradeModal />
    </>
  );
}
