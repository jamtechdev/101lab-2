// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MessageSquare, Mail, Search, Send, LogOut, MessageCircle, ChevronDown } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { getSocket } from "@/services/socket";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { formatChatDateTime } from '../../utils/formatChatDateTime';
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import NotificationBell from '../../services/NotificationBell.jsx'
import i18n from "@/i18n/config";

import logo from "@/assets/greenbidz_logo.png";
import { toastError, toastSuccess } from "@/helper/toasterNotification";
import { useLogoutMutation } from "@/rtk/slices/apiSlice";
import { useLanguageAwareCategories } from "@/hooks/useLanguageAwareCategories";
import BuyerNotificationBell from "@/services/BuyerNotifcationBell.js";

const VISIBLE_CAT_COUNT = 6;

const BuyerHeader = () => {

    const navigate = useNavigate()

    const { t } = useTranslation()
    const [logout, { isLoading }] = useLogoutMutation();
    const userName = localStorage.getItem("userName")
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);

    const lang = i18n.language || "en";
    const { data: categoriesData } = useLanguageAwareCategories();
    const categories: any[] = Array.isArray(categoriesData)
        ? categoriesData
        : (categoriesData as any)?.data ?? [];
    const visibleCategories = categories.slice(0, VISIBLE_CAT_COUNT);

    const unreadMap = useSelector((state: RootState) => state.unread);

    const unreadState = useSelector((state: RootState) => state.unread);

    const totalUnread = Object.values(unreadState?.map || {}).reduce(
        (sum, count) => sum + Number(count || 0),
        0
    );

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


            localStorage.clear();
            toastSuccess(t("common.logoutSuccess"));
            window.location.href = "/";
        } catch (error: any) {
            toastError(error?.data?.message || t("common.logoutFailed"));
        }
    };

    return (
        <div>

            <header className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-4">
                            <img src={logo} alt="GreenBidz" className="sm:h-8 w-auto cursor-pointer transition-transform hover:scale-105" onClick={() => navigate("/")} />

                        </div>


                        <div className="flex items-center gap-2">
                            <LanguageSwitcher />

                            {localStorage.getItem("userId") ? (
                                <>
                                    {/* Chat */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate("/buyer/chat/message")}
                                        className="relative flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        <span className="hidden sm:inline">{t("nav.chat")}</span>
                                        {totalUnread > 0 && (
                                            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[11px] font-semibold flex items-center justify-center rounded-full ring-2 ring-background">
                                                {totalUnread}
                                            </span>
                                        )}
                                    </Button>

                                    {/* Welcome name */}
                                    <span
                                        className="text-sm text-gray-500 hidden sm:block cursor-pointer hover:text-gray-700"
                                        onClick={() => navigate("/buyer/profile-setting")}
                                    >
                                        {t('dashboard.welcomeBack', { user: userName })}
                                    </span>

                                    {/* My Dashboard */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                        onClick={() => {
                                            const userRole = localStorage.getItem("userRole");
                                            const target = userRole === "seller" ? "/dashboard" : "/buyer-dashboard";
                                            window.open(target, "_blank");
                                        }}
                                    >
                                        My Dashboard
                                    </Button>

                                    {/* Logout */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleLogout}
                                        disabled={isLoading}
                                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                    >
                                        <LogOut className="h-4 w-4" />
                                    </Button>

                                    <BuyerNotificationBell />
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                        onClick={() => window.open("/auth?type=buyer", "_blank")}
                                    >
                                        {t("nav.buyerLogin")}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                        onClick={() => window.open("/auth", "_blank")}
                                    >
                                        {t("nav.sellerLogin")}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                        onClick={() => window.open("/auth?type=admin", "_blank")}
                                    >
                                        {t("nav.adminLogin")}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Category Bar ──────────────────────────────────────────── */}
            <div className="hidden lg:block bg-gray-800 sticky top-[65px] z-40">
                <div className="container mx-auto px-4">
                    <div className="flex items-center">

                        {/* All Categories dropdown */}
                        <div className="relative">
                            <button
                                onMouseEnter={() => setIsCategoryOpen(true)}
                                onMouseLeave={() => setIsCategoryOpen(false)}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-600 text-white text-sm font-medium hover:bg-gray-500 transition-colors"
                            >
                                All Categories
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isCategoryOpen ? "rotate-180" : ""}`} />
                            </button>

                            {isCategoryOpen && (
                                <div
                                    className="absolute left-0 top-full z-50 bg-white border border-gray-200 shadow-lg rounded-b min-w-[220px] max-h-80 overflow-y-auto"
                                    onMouseEnter={() => setIsCategoryOpen(true)}
                                    onMouseLeave={() => setIsCategoryOpen(false)}
                                >
                                    <Link
                                        to="/buyer-marketplace"
                                        className="block px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 border-b border-gray-100"
                                    >
                                        All Categories
                                    </Link>
                                    {categories.map((cat: any) => (
                                        <Link
                                            key={cat.term_id}
                                            to={`/buyer-marketplace?category=${cat.slug}`}
                                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                                        >
                                            {cat.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick category links */}
                        {visibleCategories.map((cat: any) => (
                            <Link
                                key={cat.term_id}
                                to={`/buyer-marketplace?category=${cat.slug}`}
                                className="px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors whitespace-nowrap"
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    )
}

export default BuyerHeader