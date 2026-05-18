import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Settings,
  MessageCircle,
  Menu,
  X,
  Store,
  Gavel,
  Users,
  TableProperties,
} from "lucide-react";
import logo from "@/assets/greenbidz_logo.png";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import SellerNotificationListener from "../common/SellerNotificationListener.jsx";
import CompanySelector from "../common/CompanySelector";
import NotificationBell from "../../services/NotificationBell.jsx";
import RoleSwitcher from "../common/RoleSwitcher";
import {
  SidebarProvider,
  useSidebar,
  NavItemLink,
  SectionHeader,
  UserMenu,
  useFilterItems,
  sidebarAsideClass,
  sidebarHeaderClass,
  sidebarCloseButtonClass,
  sidebarMainOffsetClass,
  sidebarRoleSwitcherWrapClass,
  sidebarNavClass,
  type NavSection,
  type NavItem,
} from "./sidebar";
import { useSellerPermissions } from "@/hooks/useSellerPermissions";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onNewBid?: () => void;
}

function DashboardShell({ children, onNewBid }: DashboardLayoutProps) {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();
  const userId = localStorage.getItem("userId");

  const filterItems = useFilterItems();
  // Bulk Upload is a power-seller-only perk. The flag comes from
  // jos_usermeta.is_power_seller — surfaced via useSellerPermissions().
  // Backend must echo the meta key onto /user/verify-user for this to flip
  // true for the seller themselves (see docs/POWER_SELLER.md).
  const { isPowerSeller } = useSellerPermissions();

  const navigationSections: NavSection[] = [
    {
      title: t("nav.marketplace", "Marketplace"),
      items: [
        {
          name: t("nav.browseMarketplace", "Browse Marketplace"),
          href: "/buyer-marketplace",
          icon: Store,
          permission: null,
          target: "_blank",
        },
      ],
    },
    {
      title: t("nav.selling", "Selling"),
      items: [
        { name: t("nav.dashboard", "Dashboard"), href: "/dashboard", icon: LayoutDashboard, permission: null },
        // { name: t("nav.listAnItem", "List an Item"), href: "/upload", icon: Package, permission: null },
        // Bulk Upload — power-seller-only.
        isPowerSeller && {
          name: t("nav.bulkUpload", "Bulk Upload"),
          href: "/dashboard/bulk-upload",
          icon: TableProperties,
          permission: null,
        },
        { name: t("nav.myListings", "My Listings"), href: "/dashboard/submissions", icon: ClipboardList, permission: null },
        { name: t("nav.buyerActivity", "Buyer activity"), href: "/dashboard/buyer-activity", icon: Users, permission: null },
        // Auction Groups — power-seller-only.
        isPowerSeller && { name: "Auction Groups", href: "/dashboard/auction-groups", icon: Gavel, permission: null },
      ].filter(Boolean) as NavItem[],
    },
    {
      title: t("nav.intelligence", "Intelligence"),
      items: [
        // Deal Reports — power-seller-only.
        isPowerSeller && { name: t("nav.dealReports", "Deal Reports"), href: "/dashboard/reports", icon: ClipboardList, permission: "reports.view" },
        { name: t("nav.chat", "Messages"), href: "/dashboard/submission/message", icon: MessageCircle, permission: "chat.view" },
      ].filter(Boolean) as NavItem[],
    },
    {
      title: t("buyerDashboard.sectionAccount", "Account"),
      items: [
        { name: t("nav.settings", "Settings"), href: "/dashboard/settings", icon: Settings, permission: "settings.view" },
      ],
    },
  ];

  // Esc closes the mobile drawer; bind at window so focus location doesn't matter
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen, setSidebarOpen]);

  // Auto-focus close-X when drawer opens
  useEffect(() => {
    if (sidebarOpen) closeBtnRef.current?.focus();
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F9FAFB" }}>
      {userId && (
        <SellerNotificationListener
          sellerId={userId}
          onNewBid={() => onNewBid?.()}
        />
      )}

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — dark theme (only the sidebar; header + main stay light) */}
      <aside
        id="primary-nav"
        aria-label={t("nav.primaryNav", "Primary navigation")}
        className={cn(
          sidebarAsideClass,
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={sidebarHeaderClass}>
          <Link to="/" aria-label="GreenBidz home" className="flex items-center">
            <img src={logo} alt="GreenBidz" className="h-9 w-auto brightness-0 invert" />
          </Link>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label={t("common.close", "Close navigation")}
            className={sidebarCloseButtonClass}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role switcher */}
        <div className={sidebarRoleSwitcherWrapClass}>
          <RoleSwitcher variant="segmented" />
        </div>

        {/* Navigation */}
        <nav className={sidebarNavClass}>
          {navigationSections.map((section, i) => {
            const visible = filterItems(section.items);
            if (visible.length === 0) return null;
            return (
              <div key={i} className={i > 0 ? "mt-1" : undefined}>
                <SectionHeader title={section.title} />
                <div className="space-y-0.5">
                  {visible.map((item) => (
                    <NavItemLink key={item.href} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main column */}
      <div className={sidebarMainOffsetClass}>
        {/* Top bar — light theme; only the sidebar is dark per design directive */}
        <header className="sticky top-0 z-30 bg-card border-b border-border">
          <div className="flex h-14 items-center justify-between px-4 lg:px-6">
            <button
              className="lg:hidden text-foreground"
              onClick={() => setSidebarOpen(true)}
              aria-label={t("nav.openNav", "Open navigation")}
              aria-expanded={sidebarOpen}
              aria-controls="primary-nav"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 ml-auto">
              <CompanySelector />
              <LanguageSwitcher />
              <NotificationBell />
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" tabIndex={-1} className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

const DashboardLayout = (props: DashboardLayoutProps) => (
  <SidebarProvider>
    <DashboardShell {...props} />
  </SidebarProvider>
);

export default DashboardLayout;
