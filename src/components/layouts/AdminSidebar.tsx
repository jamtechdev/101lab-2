import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard, Package, ShoppingCart, Store, BarChart3,
    Settings, LogOut, X, MessageCircle, User, Zap, Percent, Gavel,
    UserCheck, Tag, Handshake, Megaphone, BookOpen, FileText,
    type LucideIcon,
} from "lucide-react";
import logo from "@/assets/greenbidz_logo.png";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { toastError, toastSuccess } from "@/helper/toasterNotification";
import { useLogoutMutation } from "@/rtk/slices/apiSlice";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import {
    sidebarAsideClass,
    sidebarHeaderClass,
    sidebarCloseButtonClass,
    sidebarNavClass,
    sidebarNavItemClass,
    sidebarNavIconClass,
    sidebarActiveBarClass,
} from "./sidebar/sidebarStyles";
import { SectionHeader } from "./sidebar/SectionHeader";
import { computeAdminNavIsActive } from "./sidebar/helpers";

/**
 * Admin sidebar deviates from SIDEBAR_DESIGN.md §0 decision #2 in two ways:
 *  - Logout lives in the sidebar footer (no admin header user-menu exists).
 *  - Uses its own `useAdminSidebar()` context rather than the unified
 *    SidebarContext, because 23 admin pages already consume that hook.
 *
 * The visual tokens (dark slate, brand active state, label-caps section
 * headers, 280px width) match the rest of the system.
 */

interface NavItem {
    icon: LucideIcon;
    label: string;
    path: string;
}

function AdminNavLink({
    item,
    onNavigate,
    allPaths,
}: {
    item: NavItem;
    onNavigate: () => void;
    allPaths: string[];
}) {
    const location = useLocation();
    const Icon = item.icon;
    const isActive = computeAdminNavIsActive(
        item.path,
        location.pathname,
        allPaths
    );

    return (
        <Link
            to={item.path}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={sidebarNavItemClass(isActive)}
        >
            {isActive && (
                <span aria-hidden="true" className={sidebarActiveBarClass} />
            )}
            <span className={sidebarNavIconClass(isActive)}>
                <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="flex-1 truncate">{item.label}</span>
        </Link>
    );
}

const AdminSidebar = (_props?: { activePath?: string }) => {
    const { t } = useTranslation();
    const { sidebarOpen, setSidebarOpen } = useAdminSidebar();
    const [logout] = useLogoutMutation();
    const closeBtnRef = useRef<HTMLButtonElement>(null);

    const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
        {
            label: t("admin.sidebar.group.overview", "Overview"),
            items: [
                { icon: LayoutDashboard, label: t("admin.sidebar.dashboard", "Dashboard"),         path: "/admin" },
                { icon: BarChart3,       label: t("admin.sidebar.analytics", "Analytics"),         path: "/admin/analytics" },
            ],
        },
        {
            label: t("admin.sidebar.group.listings", "Listings"),
            items: [
                { icon: Package,      label: t("admin.sidebar.listings", "All Listings"),          path: "/admin/listings" },
                { icon: Gavel,        label: t("admin.sidebar.auctionGroups", "Auction Groups"),   path: "/admin/auction-groups" },
                { icon: ShoppingCart, label: t("admin.sidebar.bids", "Bids"),                      path: "/admin/bids" },
                { icon: Tag,          label: t("admin.sidebar.offersOrders", "Offers & Orders"),   path: "/admin/offers" },
            ],
        },
        {
            label: t("admin.sidebar.group.users", "Users"),
            items: [
                { icon: User,          label: t("admin.sidebar.users", "All Users"),               path: "/admin/users" },
                { icon: ShoppingCart,  label: t("admin.sidebar.buyers", "Buyers"),                 path: "/admin/buyers" },
                { icon: Store,         label: t("admin.sidebar.sellers", "Sellers"),               path: "/admin/sellers" },
                { icon: MessageCircle, label: t("admin.sidebar.chat", "Messages"),                     path: "/admin/sellers/chat" },
            ],
        },
        {
            label: t("admin.sidebar.group.approvals", "Approvals"),
            items: [
                { icon: Zap,       label: t("admin.sidebar.autoApproval", "Auto-approval"),            path: "/admin/auto-approval" },
                { icon: UserCheck, label: t("admin.sidebar.sellerUpgradeRequests", "Seller Requests"), path: "/admin/seller-upgrade-requests" },
                { icon: Megaphone, label: t("admin.sidebar.productRequests", "Wanted Board"),          path: "/admin/product-requests" },
            ],
        },
        {
            label: t("admin.sidebar.group.sales", "Sales & Finance"),
            items: [
                { icon: Handshake, label: t("admin.sidebar.salesLeads", "Sales Leads"),   path: "/admin/sales-leads" },
                { icon: Percent,   label: t("admin.sidebar.commission", "Commission"),    path: "/admin/commission" },
            ],
        },
        {
            label: t("admin.sidebar.group.content", "Content"),
            items: [
                { icon: BookOpen,  label: t("admin.sidebar.blogs", "Blog"),               path: "/admin/blogs" },
                { icon: FileText,  label: t("admin.sidebar.siteContent", "Site Content"), path: "/admin/site-content" },
                { icon: Settings,  label: t("admin.sidebar.settings", "Settings"),        path: "/admin/settings" },
            ],
        },
    ];

    const adminNavPaths = NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.path));

    const handleLogout = async () => {
        try {
            const confirmLogout = window.confirm(
                t("common.confirmLogout", "Are you sure you want to logout?")
            );
            if (!confirmLogout) return;

            await logout().unwrap();

            document.cookie = "accessToken=; Max-Age=0; path=/; domain=.101recycle.greenbidz.com; secure; SameSite=None";
            document.cookie = "refreshToken=; Max-Age=0; path=/; domain=.101recycle.greenbidz.com; secure; SameSite=None";
            const keepKeys = new Set(["language", "prefer-smooth-animations"]);
            Object.keys(localStorage).forEach((key) => {
                if (!keepKeys.has(key)) localStorage.removeItem(key);
            });

            toastSuccess(t("common.logoutSuccess", "Logged out successfully"));
            window.location.href = "/auth?type=admin";
        } catch (error: any) {
            console.error("Logout failed:", error);
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
        <>
            {/* Mobile backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

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
                    <img src={logo} alt="GreenBidz" className="h-9 w-auto brightness-0 invert" />
                    <button
                        ref={closeBtnRef}
                        className={sidebarCloseButtonClass}
                        onClick={() => setSidebarOpen(false)}
                        aria-label={t("common.close", "Close navigation")}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav */}
                <nav className={sidebarNavClass}>
                    {NAV_SECTIONS.map((section, i) => (
                        <div key={section.label} className={i > 0 ? "mt-1" : undefined}>
                            <SectionHeader title={section.label} />
                            <div className="space-y-0.5">
                                {section.items.map((item) => (
                                    <AdminNavLink
                                        key={item.path}
                                        item={item}
                                        allPaths={adminNavPaths}
                                        onNavigate={() => setSidebarOpen(false)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer logout (admin-specific — no header user-menu) */}
                <div className="px-3 py-3 border-t border-sidebar-border shrink-0">
                    <button
                        onClick={handleLogout}
                        aria-label={t("common.logout", "Logout")}
                        className={cn(
                            sidebarNavItemClass(false),
                            "hover:text-destructive hover:bg-destructive/10"
                        )}
                    >
                        <span className={sidebarNavIconClass(false)}>
                            <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                        </span>
                        <span className="flex-1 text-left truncate">{t("common.logout", "Logout")}</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default AdminSidebar;
