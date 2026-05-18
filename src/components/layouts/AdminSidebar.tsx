import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard, Package, ShoppingCart, Store, BarChart3,
    Settings, LogOut, X, Menu,
    MessageCircle, User, Zap, Percent, Gavel,
    UserCheck, Shield, Tag, Handshake, Megaphone,
    BookOpen, FileText,
} from "lucide-react";
import logo from "@/assets/greenbidz_logo.png";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { toastError, toastSuccess } from "@/helper/toasterNotification";
import { useLogoutMutation } from "@/rtk/slices/apiSlice";
import { useAdminSidebar } from "@/context/AdminSidebarContext";

const SectionHeader = ({ title }: { title: string }) => (
    <div className="px-3 pt-4 pb-1">
        <h3 className="text-[9px] font-semibold text-sidebar-foreground/30 uppercase tracking-widest">
            {title}
        </h3>
    </div>
);

// activePath kept for backward compatibility — active state is now derived from useLocation()
const AdminSidebar = (_props?: { activePath?: string }) => {
    const location = useLocation();
    const { t } = useTranslation();
    const { sidebarOpen, setSidebarOpen } = useAdminSidebar();
    const [logout] = useLogoutMutation();

    const NAV_SECTIONS = [
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
                { icon: MessageCircle, label: t("admin.sidebar.chat", "Chat"),                     path: "/admin/sellers/chat" },
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

    const handleLogout = async () => {
        try {
            const confirmLogout = window.confirm(
                t("common.confirmLogout") || "Are you sure you want to logout?"
            );
            if (!confirmLogout) return;

            await logout().unwrap();

            document.cookie = "accessToken=; Max-Age=0; path=/; domain=.101recycle.greenbidz.com; secure; SameSite=None";
            document.cookie = "refreshToken=; Max-Age=0; path=/; domain=.101recycle.greenbidz.com; secure; SameSite=None";
            const keepKeys = new Set(["language", "prefer-smooth-animations"]);
            Object.keys(localStorage).forEach((key) => {
                if (!keepKeys.has(key)) localStorage.removeItem(key);
            });

            toastSuccess(t("common.logoutSuccess") || "Logged out successfully");
            window.location.href = "/auth?type=admin";
        } catch (error: any) {
            console.error("Logout failed:", error);
            toastError(error?.data?.message || t("common.logoutFailed") || "Logout failed");
        }
    };

    return (
        <>
            {/* Mobile backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-screen w-56 bg-sidebar border-r border-sidebar-border transition-transform duration-300 flex flex-col",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Logo */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border shrink-0">
                    <div className="flex items-center gap-2">
                        <img src={logo} alt="GreenBidz" className="h-6 w-auto brightness-0 invert" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 bg-primary/15 rounded px-1.5 py-0.5">
                            <Shield className="h-2.5 w-2.5 text-primary" />
                            <span className="text-[9px] text-primary font-semibold uppercase tracking-wide">
                                {t("admin.sidebar.adminBadge", "Admin")}
                            </span>
                        </div>
                        <button
                            className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto sidebar-scroll">
                    {NAV_SECTIONS.map((section) => (
                        <div key={section.label}>
                            <SectionHeader title={section.label} />
                            <div className="px-2.5 space-y-0.5">
                                {section.items.map((item) => {
                                    const isActive =
                                        location.pathname === item.path ||
                                        (item.path !== "/admin" && location.pathname.startsWith(item.path + "/"));
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setSidebarOpen(false)}
                                            className={cn(
                                                "flex items-center gap-2 px-2.5 py-1.5 rounded text-[12px] font-medium transition-all duration-150",
                                                isActive
                                                    ? "bg-sidebar-foreground/10 text-sidebar-foreground"
                                                    : "text-sidebar-foreground/50 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground/80"
                                            )}
                                        >
                                            <item.icon className="w-3.5 h-3.5 shrink-0" />
                                            <span className="flex-1 truncate">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Logout */}
                <div className="px-2.5 py-3 border-t border-sidebar-border shrink-0">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[12px] font-medium text-sidebar-foreground/50 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
                    >
                        <LogOut className="w-3.5 h-3.5 shrink-0" />
                        <span>{t("common.logout", "Logout")}</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default AdminSidebar;
