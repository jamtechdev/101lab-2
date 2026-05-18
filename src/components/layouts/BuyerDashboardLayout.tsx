import { useEffect, useRef } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  Bookmark,
  Headphones,
  MessageCircle,
} from "lucide-react";
import logo from "@/assets/greenbidz_logo.png";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useLogoutMutation } from "@/rtk/slices/apiSlice";
import { toastError, toastSuccess } from "@/helper/toasterNotification";
import BuyerNotificationBell from "@/services/BuyerNotifcationBell";
import RoleSwitcher from "@/components/common/RoleSwitcher";
import { useTranslation } from "react-i18next";
import { pushLogoutEvent } from "@/utils/gtm";
import {
  SidebarProvider,
  useSidebar,
  NavItemLink,
  SectionHeader,
  useFilterItems,
  sidebarAsideClass,
  sidebarHeaderClass,
  sidebarCloseButtonClass,
  sidebarMainOffsetClass,
  sidebarRoleSwitcherWrapClass,
  sidebarNavClass,
  type NavSection,
} from "./sidebar";

function BuyerDashboardShell() {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const [logout, { isLoading }] = useLogoutMutation();
  const userName = localStorage.getItem("userName");
  const { t } = useTranslation();
  const filterItems = useFilterItems();

  const navigationSections: NavSection[] = [
    {
      title: t("buyerDashboard.sectionOverview", "Overview"),
      items: [
        { name: t("nav.dashboard", "Dashboard"), href: "/buyer-dashboard", icon: LayoutDashboard, permission: null },
        { name: t("buyerDashboard.watchlist", "Watchlist"), href: "/my-lots", icon: Bookmark, permission: null },
      ],
    },
    {
      title: t("buyerDashboard.sectionAccount", "Account"),
      items: [
        { name: t("nav.settings", "Settings"), href: "/buyer/profile-setting", icon: Settings, permission: null },
        { name: t("nav.chat", "Messages"), href: "/buyer/chat/message", icon: MessageCircle, permission: null },
        {
          name: t("buyerDashboard.contactSupport", "Contact Support"),
          href: "mailto:support@greenbidz.com",
          icon: Headphones,
          permission: null,
        },
      ],
    },
  ];


  // Buyer-specific logout: uses cross-domain cookie clearing.
  // Kept inline rather than using useLogoutHandler so we don't change the
  // existing cookie-clear semantics during this migration.
  const handleLogout = async () => {
    try {
      const confirm = window.confirm(
        t("common.confirmLogout", "Are you sure you want to logout?")
      );
      if (!confirm) return;
      try { pushLogoutEvent(); } catch { }
      await logout().unwrap();
      document.cookie =
        "accessToken=; Max-Age=0; path=/; domain=.101recycle.greenbidz.com; secure; SameSite=None";
      document.cookie =
        "refreshToken=; Max-Age=0; path=/; domain=.101recycle.greenbidz.com; secure; SameSite=None";
      localStorage.clear();
      sessionStorage.clear();
      toastSuccess(t("common.logoutSuccess", "Logged out successfully"));
      window.location.href = "/";
    } catch (error: any) {
      toastError(error?.data?.message || t("common.logoutFailed", "Logout failed"));
    }
  };

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen, setSidebarOpen]);

  useEffect(() => {
    if (sidebarOpen) closeBtnRef.current?.focus();
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F9FAFB" }}>
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
        {/* Top bar — light theme */}
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
                  aria-label={t("common.logout", "Logout")}
                  title={t("common.logout", "Logout")}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" tabIndex={-1} className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const BuyerDashboardLayout = () => (
  <SidebarProvider>
    <BuyerDashboardShell />
  </SidebarProvider>
);

export default BuyerDashboardLayout;
