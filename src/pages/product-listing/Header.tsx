import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/greenbidz_logo.png";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import NotificationBell from '../../services/NotificationBell'

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <header className="border-b border-border bg-gradient-card sticky top-0 z-10 shadow-medium backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3">
          <div className="flex items-center gap-4">
            <img
              src={logo}
              alt="GreenBidz"
              className="h-8 w-auto cursor-pointer hover:scale-105 transition-transform"
              onClick={() => navigate("/")}
            />
            <h1 className="text-xl font-bold bg-gradient-accent bg-clip-text text-transparent">
              {t("upload.itemForSale")}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="hover:bg-success/10 hover:text-success hover:border-success transition-colors"
              onClick={() => {
                // toast.success("草稿已保存 Draft saved");
                navigate("/dashboard");
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("steps.step1.saveReturnDashboard")}
            </Button>
            <LanguageSwitcher />
            <NotificationBell />
            <Button
              variant="ghost"
              className="hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() => navigate("/dashboard")}
            >
              {t("steps.step1.cancel")}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
