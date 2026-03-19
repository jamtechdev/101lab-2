import { ReactNode } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
    children: ReactNode;
    activePath: string;
}

export const AdminLayout = ({ children, activePath }: AdminLayoutProps) => {
    const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useAdminSidebar();

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20">
            {/* Sidebar */}
            <AdminSidebar activePath={activePath} />

            {/* Main Content */}
            <div
                className={cn(
                    "transition-all duration-300",
                    // Desktop: margin based on sidebar collapsed state
                    sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
                    // Mobile: no margin (sidebar is overlay)
                    "ml-0"
                )}
            >
                {/* Mobile header with menu button */}
                <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm lg:hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(true)}
                            className="text-foreground"
                        >
                            <Menu className="h-6 w-6" />
                        </Button>
                        <div className="flex-1 text-center">
                            <span className="text-lg font-semibold">Admin</span>
                        </div>
                        <div className="w-10" /> {/* Spacer for centering */}
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
};

