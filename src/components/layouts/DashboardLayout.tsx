import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  TrendingUp,
  Settings,
  MessageCircle,
  LogOut,
  Menu,
  X,
  Users,
  Shield,
  Store,
  Clock,
  Eye,
  Gavel,
  Trophy,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/greenbidz_logo.png";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useLogoutMutation } from "@/rtk/slices/apiSlice";
import { toastError, toastSuccess } from "@/helper/toasterNotification";
import { useGetSellerBidsQuery } from "@/rtk/slices/batchApiSlice";
import SellerNotificationListener from '../common/SellerNotificationListener.jsx'
import { useSellerPermissions } from "@/hooks/useSellerPermissions";
import CompanySelector from "../common/CompanySelector";
import NotificationBell from '../../services/NotificationBell.jsx'
import CompanyOrganization from "../common/CompanyOrganization";
import RoleSwitcher from "../common/RoleSwitcher";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onNewBid?: () => void;
}

// Section header component
const SectionHeader = ({ title }: { title: string }) => (
  <div className="px-3 pt-4 pb-1">
    <h3 className="text-[9px] font-semibold text-sidebar-foreground/30 uppercase tracking-widest">
      {title}
    </h3>
  </div>
);

const DashboardLayout = ({ children, onNewBid }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [logout, { isLoading }] = useLogoutMutation();
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName");

  // Get user permissions for navigation filtering
  const { hasPermission, hasAnyPermission } = useSellerPermissions();

  // Check if user is in normal seller mode (not company mode)
  const isCompanyMode = localStorage.getItem("isCompanyMode") === 'true';
  const isNormalSellerMode = !isCompanyMode;

  // RTK Query hook to refetch bids
  const { refetch: refetchAllBids } = useGetSellerBidsQuery(
    { userId: userId || '', page: 1, limit: 10 },
    { skip: !userId }
  );

  // Sidebar structure
  const navigationSections = [
    {
      title: t('nav.marketplace'),
      items: [
        { name: t("buyerDashboard.browseMarketplace") || "Browse Marketplace", href: "/buyer-marketplace", icon: Store, target: "_blank" },
      ],
    },
    {
      title: t('nav.selling'),
      items: [
        { name: t('nav.dashboard'), href: "/dashboard", icon: LayoutDashboard, permission: null },
        { name: t('nav.listAnItem'), href: "/upload", icon: Package, permission: null },
        { name: t('nav.myListings'), href: "/dashboard/submissions", icon: ClipboardList, permission: null },
        { name: t('nav.bidsAndWinners'), href: "/dashboard/bids", icon: TrendingUp, permission: "bidding.view" },
        { name: "Auction Groups", href: "/dashboard/auction-groups", icon: Gavel, permission: null },
      ]
    },
    {
      title: t('nav.intelligence'),
      items: [
        { name: t('nav.dealReports'), href: "/dashboard/reports", icon: ClipboardList, permission: "reports.view" },
        { name: t('nav.chat'), href: "/dashboard/submission/message", icon: MessageCircle, permission: "chat.view" },
      ]
    },
    {
      title: t('nav.admin'),
      items: [
        { name: t('nav.settings'), href: "/dashboard/settings", icon: Settings, permission: "settings.view" },
      ]
    }
  ];

  // Filter items based on permissions
  const filterItems = (items: any[]) => {
    return items.filter(item => {
      if (!item.permission) return true;
      if (item.permission === "settings.view" && isNormalSellerMode) return true;
      if (item.permission === "userManagement.view") return hasPermission("userManagement.view") || hasPermission("userManagement.edit");
      return hasPermission(item.permission);
    });
  };

  const handleLogout = async () => {
    try {
      const confirm = window.confirm("Are you sure you want to logout?");
      if (!confirm) return;

      await logout().unwrap();

      document.cookie = "accessToken=; Max-Age=0; path=/;";
      document.cookie = "refreshToken=; Max-Age=0; path=/;";
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      {userId && (
        <SellerNotificationListener
          sellerId={userId}
          onNewBid={() => {
            if (onNewBid) onNewBid();
          }}
        />
      )}

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-56 bg-sidebar border-r border-sidebar-border transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
            <img src={logo} alt="GreenBidz" className="h-6 w-auto brightness-0 invert" />
            <button
              className="lg:hidden text-sidebar-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Segmented Role Toggle at top */}
          <div className="px-4 pt-4 pb-2">
            <RoleSwitcher variant="segmented" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto sidebar-scroll">
            {navigationSections.map((section, sectionIndex) => {
              const filteredItems = filterItems(section.items);
              if (filteredItems.length === 0) return null;

              return (
                <div key={sectionIndex}>
                  {section.title && <SectionHeader title={section.title} />}
                  <div className="px-2.5 space-y-0.5">
                    {filteredItems.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        location.pathname === item.href ||
                        (item.href !== "/dashboard" && location.pathname.startsWith(item.href + "/"));

                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={cn(
                            "flex items-center gap-2 px-2.5 py-1.5 rounded text-[12px] font-medium transition-all duration-150",
                            isActive
                              ? "bg-sidebar-foreground/10 text-sidebar-foreground"
                              : "text-sidebar-foreground/50 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground/80"
                          )}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-56">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-card border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3">
            <button
              className="lg:hidden text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 ml-auto">
              <CompanySelector />
              <LanguageSwitcher />
              <NotificationBell />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-accent">
                    {userName?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-foreground hidden sm:block">
                  {userName}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
