import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
  Building2,
  Eye,
  Gavel,
  Trophy,
  ShoppingCart,
  History,
} from "lucide-react";
import logo from "@/assets/greenbidz_logo.png";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useLogoutMutation } from "@/rtk/slices/apiSlice";
import { toastError, toastSuccess } from "@/helper/toasterNotification";
import BuyerNotificationBell from "@/services/BuyerNotifcationBell";
import RoleSwitcher from "@/components/common/RoleSwitcher";
import { useTranslation } from "react-i18next";

const SectionHeader = ({ title }: { title: string }) => (
  <div className="px-3 pt-4 pb-1">
    <h3 className="text-[9px] font-semibold text-sidebar-foreground/30 uppercase tracking-widest">
      {title}
    </h3>
  </div>
);

const BuyerDashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [logout, { isLoading }] = useLogoutMutation();
  const userName = localStorage.getItem("userName");
  const { t } = useTranslation();

  const navigationSections = [
    {
      title: t("buyerDashboard.sectionOverview") || "OVERVIEW",
      items: [
        { name: t("nav.dashboard") || "Dashboard", href: "/buyer-dashboard", icon: LayoutDashboard },
        { name: t("buyerDashboard.browseMarketplace") || "Browse Marketplace", href: "/buyer-marketplace", icon: Store },
      ],
    },
    {
      title: t("buyerDashboard.sectionActivities") || "MY ACTIVITIES",
      items: [
        { name: t("buyerDashboard.myInspections") || "My Inspections", href: "/buyer/inspections", icon: Eye },
        { name: t("buyerDashboard.myBids") || "My Bids", href: "/buyer/bids", icon: Gavel },
        { name: t("buyerDashboard.winningBids") || "Winning Bids", href: "/buyer/winning-bids", icon: Trophy },
        { name: t("buyerDashboard.myOrders") || "My Orders", href: "/buyer/orders", icon: ShoppingCart },
        { name: t("buyerDashboard.orderHistory") || "Order History", href: "/buyer/order-history", icon: History },
      ],
    },
    {
      title: t("buyerDashboard.sectionSupport") || "SUPPORT",
      items: [
        { name: t("buyerDashboard.messages") || "Messages", href: "/buyer/chat/message", icon: MessageCircle },
        { name: t("nav.settings") || "Settings", href: "/buyer/profile-setting", icon: Settings },
      ],
    },
  ];

  const handleLogout = async () => {
    try {
      const confirm = window.confirm(
        t("common.confirmLogout") || "Are you sure you want to logout?"
      );
      if (!confirm) return;

      await logout().unwrap();

      document.cookie =
        "accessToken=; Max-Age=0; path=/; domain=.101recycle.greenbidz.com; secure; SameSite=None";
      document.cookie =
        "refreshToken=; Max-Age=0; path=/; domain=.101recycle.greenbidz.com; secure; SameSite=None";

      localStorage.clear();
      sessionStorage.clear();
      toastSuccess(t("common.logoutSuccess") || "Logged out successfully");
      window.location.href = "/";
    } catch (error: any) {
      toastError(error?.data?.message || t("common.logoutFailed") || "Logout failed");
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
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
            <img
              src={logo}
              alt="GreenBidz"
              className="h-6 w-auto cursor-pointer brightness-0 invert"
              onClick={() => navigate("/")}
            />
            <button
              className="lg:hidden text-sidebar-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Segmented Role Toggle */}
          <div className="px-4 pt-4 pb-2">
            <RoleSwitcher variant="segmented" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto sidebar-scroll">
            {navigationSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <SectionHeader title={section.title} />
                <div className="px-2.5 space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/buyer-dashboard"
                        ? location.pathname === "/buyer-dashboard" || location.pathname.startsWith("/buyer-dashboard/")
                        : location.pathname === item.href || location.pathname.startsWith(item.href + "/");
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
            ))}
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
              <LanguageSwitcher />
              <BuyerNotificationBell />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-accent">
                    {userName?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <span
                  className="text-sm font-medium text-foreground hidden sm:block cursor-pointer"
                  onClick={() => navigate("/buyer/profile-setting")}
                >
                  {userName}
                </span>
                <button
                  onClick={handleLogout}
                  disabled={isLoading}
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
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default BuyerDashboardLayout;
