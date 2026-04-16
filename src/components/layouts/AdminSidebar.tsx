import { useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Store,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Menu,
    X,
    MessageCircle,
    Mail,
    User,
    Zap,
    Percent,
    Gavel,
    UserCheck,
    ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/greenbidz_logo.png";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { toastError, toastSuccess } from "@/helper/toasterNotification";
import { useLogoutMutation } from "@/rtk/slices/apiSlice";
import { useAdminSidebar } from "@/context/AdminSidebarContext";

interface AdminSidebarProps {
    activePath: string; // pass current page path
}

const AdminSidebar = ({ activePath }: AdminSidebarProps) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { sidebarCollapsed, setSidebarCollapsed, sidebarOpen, setSidebarOpen } = useAdminSidebar();
    const [logout] = useLogoutMutation();

    const navItems = [
        { icon: LayoutDashboard, label: t("admin.sidebar.dashboard"), path: "/admin" },
        { icon: Package, label: t("admin.sidebar.listings"), path: "/admin/listings" },
        { icon: Gavel, label: t("admin.sidebar.auctionGroups", "Auction Groups"), path: "/admin/auction-groups" },
        { icon: ShoppingCart, label: t("admin.sidebar.buyers"), path: "/admin/buyers" },
        { icon: Store, label: t("admin.sidebar.sellers"), path: "/admin/sellers" },
        { icon: BarChart3, label: t("admin.sidebar.analytics"), path: "/admin/analytics" },
        { icon: MessageCircle, label: t("admin.sidebar.chat"), path: "/admin/sellers/chat" },
        // { icon: Mail, label: t("admin.sidebar.emailsettings"), path: "/admin/settings/email" },
        { icon: User, label: t("admin.sidebar.users"), path: "/admin/users" },
        { icon: Zap, label: t("admin.sidebar.autoApproval", "Auto-approval"), path: "/admin/auto-approval" },
        { icon: UserCheck, label: t("admin.sidebar.sellerUpgradeRequests", "Seller Requests"), path: "/admin/seller-upgrade-requests" },
        { icon: ClipboardList, label: t("admin.sidebar.productRequests", "Product Requests"), path: "/admin/product-requests" },
        { icon: Percent, label: t("admin.sidebar.commission", "Commission"), path: "/admin/commission" },

        { icon: Settings, label: t("admin.sidebar.settings"), path: "/admin/settings" },

    ];


    const handleLogout = async () => {
        try {
            const confirmLogout = window.confirm(
                t("common.confirmLogout") || "Are you sure you want to logout?"
            );
            if (!confirmLogout) return;

            await logout().unwrap();

            document.cookie =
                "accessToken=; Max-Age=0; path=/; domain=.101recycle.greenbidz.com; secure; SameSite=None";
            document.cookie =
                "refreshToken=; Max-Age=0; path=/; domain=.101recycle.greenbidz.com; secure; SameSite=None";

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

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-0 z-50 bg-gradient-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col h-screen overflow-y-auto",
                    // Desktop: always visible, width based on collapsed state
                    sidebarCollapsed ? "w-16" : "w-64",
                    // Mobile: slide in/out based on sidebarOpen state
                    "lg:translate-x-0",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Logo + Toggle */}
                <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
                    {!sidebarCollapsed && (
                        <div className="flex items-center gap-3">
                            <img src={logo} alt="GreenBidz" className="h-8" />
                            <span className="text-sidebar-foreground font-bold">GreenBidz</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        {/* Mobile close button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-border"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                        {/* Desktop collapse toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="hidden lg:flex text-sidebar-foreground hover:bg-sidebar-border"
                        >
                            {sidebarCollapsed ? (
                                <ChevronRight className="h-5 w-5" />
                            ) : (
                                <ChevronLeft className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <Button
                            key={item.path}
                            variant="ghost"
                            className={cn(
                                "w-full justify-start text-sidebar-foreground hover:bg-sidebar-border px-2",
                                activePath === item.path && "bg-accent hover:bg-accent/90"
                            )}
                            onClick={() => navigate(item.path)}
                        >
                            <item.icon className={cn("h-5 w-5", !sidebarCollapsed && "mr-3")} />
                            {!sidebarCollapsed && <span>{item.label}</span>}
                        </Button>
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-sidebar-border">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-foreground/10 px-2"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        {!sidebarCollapsed && "Logout"}
                    </Button>
                </div>
            </aside>
        </>
    );
};

export default AdminSidebar;
