import React, { useState } from 'react'
import { Button } from "@/components/ui/button";
import { Menu } from 'lucide-react';
import { useAdminSidebar } from '@/context/AdminSidebarContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import NotificationBell from './AdminNotification';

const AdminHeader = () => {

    const [dateRange, setDateRange] = useState("thisMonth");
    const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useAdminSidebar();
    const { t } = useTranslation();


    return (
        <div>
            <header className="bg-card border-b px-6 py-3 flex items-center justify-between ">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"


                        onClick={() => setSidebarOpen(true)}

                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    {/* <h1 className="text-2xl font-bold text-foreground">{t("admin.dashboard.title")}</h1> */}
                </div>

                <div className="flex items-center gap-4">
                    <NotificationBell />
                    {/* <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-4 py-2 border border-input rounded-md bg-background text-foreground"
                    >
                        <option value="thisMonth">{t("admin.dashboard.dateRange.thisMonth")}</option>
                        <option value="lastMonth">{t("admin.dashboard.dateRange.lastMonth")}</option>
                        <option value="last3Months">{t("admin.dashboard.dateRange.last3Months")}</option>
                        <option value="last6Months">{t("admin.dashboard.dateRange.last6Months")}</option>
                        <option value="thisYear">{t("admin.dashboard.dateRange.thisYear")}</option>
                    </select> */}
                    <LanguageSwitcher />
                </div>
            </header>

        </div>
    )
}

export default AdminHeader