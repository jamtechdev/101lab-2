import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Save,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { Menu } from "lucide-react";
import {
  useUpdateUserSettingsMutation,
  useGetUserProfileQuery
} from "@/rtk/slices/apiSlice";

const AdminSettings = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useAdminSidebar();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const userId = localStorage.getItem("userId");

  // -------------------- Local State --------------------
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [language, setLanguage] = useState("zh-TW");
  const [timezone, setTimezone] = useState("Asia/Taipei");
  const [currency, setCurrency] = useState("TWD");

  const [updateUserSettings] = useUpdateUserSettingsMutation();

  // -------------------- Loading States --------------------
  const [loadingPersonal, setLoadingPersonal] = useState(false);

  // -------------------- Fetch Profile --------------------
  const { data: profileData, isLoading: loadingProfile, refetch } = useGetUserProfileQuery(userId);

  useEffect(() => {
    if (profileData?.success) {
      const data = profileData.data;
      setEmail(data.email || "");
      setFirstName(data.personalInfo.firstName || "");
      setLastName(data.personalInfo.lastName || "");
      setPhone(data.personalInfo.phone || "");
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
        userId
      }).unwrap();

      if (response.success) toast.success(t("settings.settingsSaved"));
      else toast.error(response.message);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update personal info");
    } finally {
      setLoadingPersonal(false);
    }
  };


  if (loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-accent-light rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <p className="mt-4 text-sm font-medium text-muted-foreground">Loading settings...</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background">
      <AdminSidebar activePath="/admin/settings" />

      <div
        className={cn(
          "transition-all duration-300 min-h-screen flex flex-col overflow-hidden",
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
              <span className="text-lg font-semibold">{t('admin.settings.title')}</span>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Desktop header */}
        <header className="hidden lg:flex bg-card border-b px-6 py-4 items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{t('admin.settings.titleFull')}</h1>
          <Button onClick={handleSavePersonalInfo}>
            <Save className="h-4 w-4 mr-2" />
            {t('admin.settings.saveChanges')}
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">{t('admin.settings.profile')}</TabsTrigger>
              {/* <TabsTrigger value="general">{t('admin.settings.general')}</TabsTrigger>
              <TabsTrigger value="notifications">{t('admin.settings.notifications')}</TabsTrigger>
              <TabsTrigger value="security">{t('admin.settings.security')}</TabsTrigger>
              <TabsTrigger value="platform">{t('admin.settings.platform')}</TabsTrigger> */}
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
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
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">{t("settings.lastName")}</Label>
                      <Input
                        id="lastName"
                        placeholder={t("settings.enterLastName")}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="border-border/50 focus:border-accent"
                      />
                    </div>
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
            </TabsContent>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.settings.generalSettings')}</CardTitle>
                  <CardDescription>{t('admin.settings.manageBasic')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform-name">{t('admin.settings.platformName')}</Label>
                    <Input id="platform-name" defaultValue="GreenBidz" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform-email">{t('admin.settings.platformEmail')}</Label>
                    <Input id="platform-email" type="email" defaultValue="admin@greenbidz.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-email">{t('admin.settings.supportEmail')}</Label>
                    <Input id="support-email" type="email" defaultValue="support@greenbidz.com" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.settings.notificationSettings')}</CardTitle>
                  <CardDescription>{t('admin.settings.configureNotifications')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t('admin.settings.emailNotifications')}</Label>
                      <p className="text-sm text-muted-foreground">{t('admin.settings.receiveEmailNotifications')}</p>
                    </div>
                    <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notification-email">{t('admin.settings.notificationEmail')}</Label>
                    <Input id="notification-email" type="email" defaultValue="admin@greenbidz.com" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.settings.securitySettings')}</CardTitle>
                  <CardDescription>{t('admin.settings.manageSecurity')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">{t('admin.settings.sessionTimeout')}</Label>
                    <Input id="session-timeout" type="number" defaultValue="60" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t('admin.settings.twoFactorAuth')}</Label>
                      <p className="text-sm text-muted-foreground">{t('admin.settings.enable2FA')}</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="platform" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.settings.platformSettings')}</CardTitle>
                  <CardDescription>{t('admin.settings.controlBehavior')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t('admin.settings.maintenanceMode')}</Label>
                      <p className="text-sm text-muted-foreground">{t('admin.settings.putInMaintenance')}</p>
                    </div>
                    <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t('admin.settings.autoApproveListings')}</Label>
                      <p className="text-sm text-muted-foreground">{t('admin.settings.automaticallyApprove')}</p>
                    </div>
                    <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-listing-price">{t('admin.settings.maxListingPrice')}</Label>
                    <Input id="max-listing-price" type="number" defaultValue="10000000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commission-rate">{t('admin.settings.commissionRate')}</Label>
                    <Input id="commission-rate" type="number" step="0.1" defaultValue="5.0" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
