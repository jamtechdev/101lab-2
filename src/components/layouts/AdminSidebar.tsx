import { useNavigate } from "react-router-dom";
import {
    LayoutDashboard, Package, ShoppingCart, Store, BarChart3,
    Settings, ChevronLeft, ChevronRight, LogOut, X,
    MessageCircle, User, Zap, Percent, Gavel, UserCheck,
    ClipboardList, Shield, Tag, Handshake, Megaphone, BookOpen, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/greenbidz_logo.png";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { toastError, toastSuccess } from "@/helper/toasterNotification";
import { useLogoutMutation } from "@/rtk/slices/apiSlice";
import { useAdminSidebar } from "@/context/AdminSidebarContext";

interface AdminSidebarProps {
    activePath: string;
}

const AdminSidebar = ({ activePath }: AdminSidebarProps) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const NAV_GROUPS = [
        {
            label: t("admin.sidebar.group.overview", "Overview"),
            items: [
                { icon: LayoutDashboard, label: t("admin.sidebar.dashboard", "Dashboard"),  path: "/admin" },
                { icon: BarChart3,       label: t("admin.sidebar.analytics", "Analytics"),  path: "/admin/analytics" },
            ],
        },
        {
            label: t("admin.sidebar.group.listings", "Listings"),
            items: [
                { icon: Package,      label: t("admin.sidebar.listings", "All Listings"),        path: "/admin/listings" },
                { icon: Gavel,        label: t("admin.sidebar.auctionGroups", "Auction Groups"), path: "/admin/auction-groups" },
                { icon: ShoppingCart, label: t("admin.sidebar.bids", "Bids"),                    path: "/admin/bids" },
                { icon: Tag,          label: t("admin.sidebar.offersOrders", "Offers & Orders"), path: "/admin/offers" },
            ],
        },
        {
            label: t("admin.sidebar.group.users", "Users"),
            items: [
                { icon: User,          label: t("admin.sidebar.users", "All Users"),  path: "/admin/users" },
                { icon: ShoppingCart,  label: t("admin.sidebar.buyers", "Buyers"),    path: "/admin/buyers" },
                { icon: Store,         label: t("admin.sidebar.sellers", "Sellers"),  path: "/admin/sellers" },
                { icon: MessageCircle, label: t("admin.sidebar.chat", "Chat"),        path: "/admin/sellers/chat" },
            ],
        },
        {
            label: t("admin.sidebar.group.approvals", "Approvals"),
            items: [
                { icon: Zap,           label: t("admin.sidebar.autoApproval", "Auto-approval"),            path: "/admin/auto-approval" },
                { icon: UserCheck,     label: t("admin.sidebar.sellerUpgradeRequests", "Seller Requests"), path: "/admin/seller-upgrade-requests" },
                { icon: Megaphone,     label: t("admin.sidebar.productRequests", "Wanted Board"),          path: "/admin/product-requests" },
            ],
        },
        {
            label: t("admin.sidebar.group.sales", "Sales"),
            items: [
                { icon: Handshake, label: t("admin.sidebar.salesLeads", "Sales Leads"), path: "/admin/sales-leads" },
            ],
        },
        {
            label: t("admin.sidebar.group.finance", "Finance"),
            items: [
                { icon: Percent, label: t("admin.sidebar.commission", "Commission"), path: "/admin/commission" },
            ],
        },
        {
            label: t("admin.sidebar.group.content", "Content"),
            items: [
                { icon: BookOpen, label: t("admin.sidebar.blogs", "Blog"),        path: "/admin/blogs" },
                { icon: FileText, label: t("admin.sidebar.siteContent", "Site Content"), path: "/admin/site-content" },
            ],
        },
        {
            label: t("admin.sidebar.group.system", "System"),
            items: [
                { icon: Settings, label: t("admin.sidebar.settings", "Settings"), path: "/admin/settings" },
            ],
        },
    ];
    const { sidebarCollapsed, setSidebarCollapsed, sidebarOpen, setSidebarOpen } = useAdminSidebar();
    const [logout] = useLogoutMutation();

    const handleLogout = async () => {
        try {
            const confirmLogout = window.confirm(
                t("common.confirmLogout") || "Are you sure you want to logout?"
            );
            if (!confirmLogout) return;

            await logout().unwrap();

            document.cookie = "accessToken=; Max-Age=0; path=/; domain=.101recycle.greenbidz.com; secure; SameSite=None";
            document.cookie = "refreshToken=; Max-Age=0; path=/; domain=.101recycle.greenbidz.com; secure; SameSite=None";
            localStorage.removeItem("userId");
            localStorage.removeItem("userRole");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");

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
                    "fixed left-0 top-0 z-50 bg-gradient-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col h-screen",
                    sidebarCollapsed ? "w-16" : "w-64",
                    "lg:translate-x-0",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Logo */}
                <div className="flex items-center justify-between px-4 h-16 border-b border-sidebar-border shrink-0">
                    {!sidebarCollapsed && (
                        <div className="flex items-center gap-2.5">
                            <img src={logo} alt="GreenBidz" className="h-7 w-7 rounded-lg" />
                            <div>
                                <p className="text-sidebar-foreground font-bold text-sm leading-none">GreenBidz</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <Shield className="h-2.5 w-2.5 text-primary" />
                                    <span className="text-[10px] text-primary font-semibold uppercase tracking-wide">{t("admin.sidebar.adminBadge", "Admin")}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    {sidebarCollapsed && (
                        <img src={logo} alt="GreenBidz" className="h-7 w-7 rounded-lg mx-auto" />
                    )}
                    <div className="flex items-center shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden h-8 w-8 text-sidebar-foreground/60 hover:bg-sidebar-border hover:text-sidebar-foreground"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="hidden lg:flex h-8 w-8 text-sidebar-foreground/60 hover:bg-sidebar-border hover:text-sidebar-foreground"
                        >
                            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
                    {NAV_GROUPS.map((group) => (
                        <div key={group.label} className="mb-1">
                            {/* Section label */}
                            {!sidebarCollapsed && (
                                <p className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 px-3 pt-3 pb-1">
                                    {group.label}
                                </p>
                            )}
                            {sidebarCollapsed && <div className="border-t border-sidebar-border/40 my-2 mx-1" />}

                            {/* Items */}
                            {group.items.map((item) => {
                                const isActive = activePath === item.path;
                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => navigate(item.path)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group",
                                            isActive
                                                ? "bg-primary text-white shadow-sm"
                                                : "text-sidebar-foreground/70 hover:bg-sidebar-border/60 hover:text-sidebar-foreground",
                                            sidebarCollapsed && "justify-center px-2"
                                        )}
                                        title={sidebarCollapsed ? item.label : undefined}
                                    >
                                        <item.icon className={cn(
                                            "h-[18px] w-[18px] shrink-0 transition-colors",
                                            isActive ? "text-white" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                                        )} />
                                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                                        {!sidebarCollapsed && isActive && (
                                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70 shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* Logout */}
                <div className="px-2 py-3 border-t border-sidebar-border shrink-0">
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                            "text-sidebar-foreground/50 hover:bg-red-500/10 hover:text-red-400",
                            sidebarCollapsed && "justify-center px-2"
                        )}
                        title={sidebarCollapsed ? t("common.logout", "Logout") : undefined}
                    >
                        <LogOut className="h-[18px] w-[18px] shrink-0" />
                        {!sidebarCollapsed && <span>{t("common.logout", "Logout")}</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default AdminSidebar;
