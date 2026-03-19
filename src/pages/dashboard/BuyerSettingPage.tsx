import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { User, Bell, Lock, Globe, CreditCard, FileText, Save, Shield, Settings as SettingsIcon, LogOut } from "lucide-react";


import logo from "@/assets/greenbidz_logo.png";


import {
  useUpdateUserSettingsMutation,
  useGetUserProfileQuery,
  useLogoutMutation
} from "@/rtk/slices/apiSlice";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useNavigate } from "react-router-dom";
import { toastError, toastSuccess } from "@/helper/toasterNotification";
import { Textarea } from "@/components/ui/textarea";




const BuyerSettingPage = () => {
  const { t } = useTranslation();

  const userId = localStorage.getItem("userId");

  const navigate = useNavigate()

  // -------------------- Local State --------------------
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [experience, setExperience] = useState("")
  const [companyDetail, setCompanyDetail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [language, setLanguage] = useState("zh-TW");
  const [timezone, setTimezone] = useState("Asia/Taipei");
  const [currency, setCurrency] = useState("TWD");

  const [updateUserSettings] = useUpdateUserSettingsMutation();

  const userName = localStorage.getItem("userName")


  const [logout, { isLoading }] = useLogoutMutation();

  // -------------------- Loading States --------------------
  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [loadingLanguage, setLoadingLanguage] = useState(false);

  // -------------------- Fetch Profile --------------------
  const { data: profileData, isLoading: loadingProfile, refetch } = useGetUserProfileQuery(userId);

  useEffect(() => {
    if (profileData?.success) {
      const data = profileData.data;
      setEmail(data.email || "");
      setFirstName(data.displayName || "");
      setLastName(data.personalInfo.lastName || "");
      setPhone(data.personalInfo.phone || "");
      setExperience(data?.personalInfo?.experience)
      setCompanyDetail(data?.personalInfo?.companyDetail)
      setCompany(data.personalInfo.company || "");
      setLanguage(data.languageRegion.language || "zh-TW");
      setTimezone(data.languageRegion.timezone || "Asia/Taipei");
      setCurrency(data.languageRegion.currency || "TWD");
    }
  }, [profileData]);

  // -------------------- Save Handlers --------------------
  const handleSavePersonalInfo = async () => {
    if (!firstName && !lastName && !email && !phone && !company) {
      toast.error("Please provide at least one field to update!");
      return;
    }

    setLoadingPersonal(true);
    try {
      const response = await updateUserSettings({
        firstName,
        lastName,
        email,
        phone,
        company,
        userId,
        companyDetail,
        experience

      }).unwrap();

      if (response.success) {
        toast.success(t("settings.settingsSaved"));
        localStorage.setItem("companyName", company)
      }
      else toast.error(response.message);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update personal info");
    } finally {
      setLoadingPersonal(false);
    }
  };



  // Logout handler
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

  const handleSaveSecurity = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    setLoadingSecurity(true);
    try {

      const response = await updateUserSettings({
        currentPassword,
        newPassword,
        userId
      }).unwrap();

      if (response.success) {
        toast.success("Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(response.message);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update password");
    } finally {
      setLoadingSecurity(false);
    }
  };

  const handleSaveLanguageRegion = async () => {
    setLoadingLanguage(true);
    try {
      const response = await updateUserSettings({
        language,
        timezone,
        currency,
        userId
      }).unwrap();

      if (response.success) toast.success("Preferences updated successfully");
      else toast.error(response.message);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update preferences");
    } finally {
      setLoadingLanguage(false);
    }
  };

  if (loadingProfile) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-accent-light rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-4 text-sm font-medium text-muted-foreground">Loading settings...</p>
        </div>
      </>
    );
  }

  return (
    // <DashboardLayout>
    <div className="px-4">
      {false &&
        <header className="border-b border-border bg-card/80 backdrop-blur-sm shadow-soft sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={logo}
                alt="GreenBidz"
                className="h-8 w-auto cursor-pointer transition-transform hover:scale-105"
                onClick={() => navigate("/")}
              />
              <div className="flex items-center gap-2">
                <div className="w-1 h-7 bg-gradient-to-b from-accent to-accent-light rounded-full"></div>
                <h1 className="text-xl font-bold text-foreground hidden sm:block">{t("buyer.marketplace")}</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate("/buyer-dashboard")} className="shadow-soft">
                {t("buyerDashboard.title")}
              </Button>

              <span className="text-sm text-muted-foreground hidden sm:block" onClick={() => navigate("/buyer/profile-setting")}>

                {t('dashboard.welcomeBack', { user: userName })}

              </span>

              <LanguageSwitcher />

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                disabled={isLoading}
                className="hover:bg-muted/50 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </Button>

              {/* <NotificationBell/> */}


            </div>
          </div>
        </header>
      }
      <div className="space-y-6 animate-in fade-in-50 duration-500 max-w-full px-20 pt-10">
        {/* Header */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-7 bg-gradient-to-b from-accent to-accent-light rounded-full"></div>
            <h1 className="text-3xl font-bold text-foreground">{t("settings.title")}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-3">{t("settings.subtitle")}</p>
        </div>

        {/* Profile Settings */}
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10 text-info">
                <User className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">{t("settings.profileInformation")}</CardTitle>
                <CardDescription className="mt-1">{t("settings.profileDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">{t("settings.firstName")}</Label>
                <Input
                  id="firstName"
                  placeholder={t("settings.enterFirstName")}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="border-border/50 focus:border-accent"
                />
              </div>
              {/* <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">{t("settings.lastName")}</Label>
                <Input
                  id="lastName"
                  placeholder={t("settings.enterLastName")}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="border-border/50 focus:border-accent"
                />
              </div> */}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                readOnly
                className="bg-muted/50 border-border/50 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">{t("settings.phoneNumber")}</Label>
              <Input
                id="phone"
                placeholder="+886 912 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border-border/50 focus:border-accent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium">{t("auth.companyName")}</Label>
              <Input
                id="company"
                placeholder={t("settings.enterCompanyName")}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="border-border/50 focus:border-accent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium">{t("auth.experience")}</Label>
              <Input
                id="experience"
                type="number"
                min={0}
                placeholder={t("settings.enterExperience")}
                value={experience}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || Number(value) >= 0) {
                    setExperience(value);
                  }
                }}
                className="border-border/50 focus:border-accent"
              />

            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium">{t("auth.companyDetail")}</Label>
              <Textarea
                id="experience"
                placeholder={t("settings.enterCompanyDetail")}
                value={companyDetail}
                onChange={(e) => setCompanyDetail(e.target.value)}
                className="border-border/50 focus:border-accent"
              />
            </div>
            <div className="pt-2">
              <Button
                onClick={handleSavePersonalInfo}
                disabled={loadingPersonal}
                className="bg-gradient-to-r from-accent to-accent-light text-white hover:shadow-accent transition-all duration-300"
              >
                <Save className="w-4 h-4 mr-2" />
                {loadingPersonal ? t("settings.saving") : t("settings.savePreferences")}
              </Button>
            </div>

          </CardContent>
        </Card>



        {/* Notification Settings */}
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">{t('settings.notificationPreferences')}</CardTitle>
                <CardDescription className="mt-1">{t('settings.notificationDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5 flex-1">
                <Label className="text-sm font-medium">{t('settings.newBidNotifications')}</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('settings.newBidDesc')}
                </p>
              </div>
              <Switch defaultChecked className="ml-4" />
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5 flex-1">
                <Label className="text-sm font-medium">{t('settings.inspectionReminders')}</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('settings.inspectionRemindersDesc')}
                </p>
              </div>
              <Switch defaultChecked className="ml-4" />
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5 flex-1">
                <Label className="text-sm font-medium">{t('settings.reportReadyNotifications')}</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('settings.reportReadyDesc')}
                </p>
              </div>
              <Switch defaultChecked className="ml-4" />
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5 flex-1">
                <Label className="text-sm font-medium">{t('settings.emailDigest')}</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('settings.emailDigestDesc')}
                </p>
              </div>
              <Switch className="ml-4" />
            </div>
          </CardContent>
        </Card>





        {/* Security Settings */}
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">{t("settings.securitySettings")}</CardTitle>
                <CardDescription className="mt-1">{t("settings.securityDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium">{t("settings.currentPassword")}</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="border-border/50 focus:border-accent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">{t("settings.newPassword")}</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border-border/50 focus:border-accent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">{t("settings.confirmNewPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border-border/50 focus:border-accent"
              />
            </div>
            <div className="pt-2">
              <Button
                onClick={handleSaveSecurity}
                disabled={loadingSecurity}
                className="bg-gradient-to-r from-accent to-accent-light text-white hover:shadow-accent transition-all duration-300"
              >
                <Save className="w-4 h-4 mr-2" />
                {loadingSecurity ? t("settings.saving") : t("settings.updatePassword")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10 text-info">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">{t("settings.languageRegion")}</CardTitle>
                <CardDescription className="mt-1">{t("settings.languageRegionDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language" className="text-sm font-medium">{t("settings.language")}</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language" className="border-border/50 focus:border-accent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh-TW">{t("settings.traditionalChinese")}</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-sm font-medium">{t("settings.timezone")}</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone" className="border-border/50 focus:border-accent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Taipei">台北 (GMT+8)</SelectItem>
                  <SelectItem value="Asia/Hong_Kong">香港 (GMT+8)</SelectItem>
                  <SelectItem value="Asia/Shanghai">上海 (GMT+8)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-sm font-medium">{t("settings.currency")}</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency" className="border-border/50 focus:border-accent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TWD">{t("settings.twd")}</SelectItem>
                  <SelectItem value="USD">{t("settings.usd")}</SelectItem>
                  <SelectItem value="HKD">{t("settings.hkd")}</SelectItem>
                  <SelectItem value="CNY">{t("settings.cny")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-2">
              <Button
                onClick={handleSaveLanguageRegion}
                disabled={loadingLanguage}
                className="bg-gradient-to-r from-accent to-accent-light text-white hover:shadow-accent transition-all duration-300"
              >
                <Save className="w-4 h-4 mr-2" />
                {loadingLanguage ? t("settings.saving") : t("settings.savePreferences")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    // </DashboardLayout>
  );
};

export default BuyerSettingPage;
