import { ReactNode } from "react";
import { Menu } from "lucide-react";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
    children: ReactNode;
    activePath?: string;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
    const { setSidebarOpen } = useAdminSidebar();

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
            <AdminSidebar />

            <div className="lg:pl-56">
                {/* Mobile header */}
                <header className="sticky top-0 z-30 bg-card border-b border-border lg:hidden">
                    <div className="flex items-center px-4 py-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-foreground"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <span className="ml-4 text-sm font-semibold">Admin</span>
                    </div>
                </header>

                <main className="p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
};

