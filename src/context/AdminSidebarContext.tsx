import { createContext, useContext, useState, ReactNode } from "react";

interface AdminSidebarContextType {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const AdminSidebarContext = createContext<AdminSidebarContextType | undefined>(undefined);

export const AdminSidebarProvider = ({ children }: { children: ReactNode }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <AdminSidebarContext.Provider
            value={{
                sidebarCollapsed,
                setSidebarCollapsed,
                sidebarOpen,
                setSidebarOpen,
            }}
        >
            {children}
        </AdminSidebarContext.Provider>
    );
};

export const useAdminSidebar = () => {
    const context = useContext(AdminSidebarContext);
    if (context === undefined) {
        throw new Error("useAdminSidebar must be used within AdminSidebarProvider");
    }
    return context;
};

