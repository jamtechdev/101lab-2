// @ts-nocheck
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  ShoppingCart,
  Store,
  Mail,
  LogIn,
  Loader2,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

import {
  useLoginMutation,
  useSignupMutation,
  useSignupInitiateMutation,
  useVerifySignupCodeMutation,
  useResendVerificationCodeMutation,
  useCompleteSignupMutation,
} from "@/rtk/slices/apiSlice";

import {
  toastSuccess,
  toastError,
  toastWarning,
} from "../../helper/toasterNotification";
import { showSuccess } from "../../helper/sweetAlertNotification";
import { getSocket } from "@/services/socket";

type UserType = "buyer" | "seller" | "admin";
type AuthMode = "signup" | "signin";




const Auth = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [userType, setUserType] = useState<UserType>("buyer");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sign in state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Simple signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  // Profile form state
  const [profileData, setProfileData] = useState({
    first_name: "", last_name: "", phone: "",
    company: "", company_tax_id: "",
    street_address: "", city: "", district_state: "", postal_code: "", country: "",
  });

  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [signup] = useSignupMutation();
  const [signupInitiate, { isLoading: isInitiateLoading }] = useSignupInitiateMutation();
  const [verifySignupCode, { isLoading: isVerifyLoading }] = useVerifySignupCodeMutation();
  const [resendVerificationCode, { isLoading: isResendLoading }] = useResendVerificationCodeMutation();
  const [completeSignup, { isLoading: isCompleteLoading }] = useCompleteSignupMutation();
  const allowedTypes: UserType[] = ["buyer", "seller", "admin"];

  useEffect(() => {
    const type = searchParams.get("type") as UserType | null;
    const mode = searchParams.get("mode") as AuthMode | null;
    if (!type || !allowedTypes.includes(type)) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("type", "buyer");
      setSearchParams(newParams, { replace: true });
      setUserType("buyer");
    } else {
      setUserType(type);
      if (type === "admin") {
        setAuthMode("signin");
      } else if (mode === "signin" || mode === "signup") {
        setAuthMode(mode);
      }
    }
  }, [searchParams]);

  const handleTypeSwitch = (type: UserType) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("type", type);
    newParams.set("mode", authMode); // always preserve current mode
    setSearchParams(newParams, { replace: true });
    setUserType(type);
    setSignupStep(1);
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignupCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateEmail(signupEmail)) { toastWarning("Please enter a valid email address."); return; }
    if (signupPassword.length < 6) { toastWarning("Password must be at least 6 characters."); return; }
    if (signupPassword !== signupConfirmPassword) { toastWarning("Passwords do not match."); return; }
    if (!termsAccepted) { toastWarning("Please accept the terms to continue."); return; }

    try {
      const result = await signupInitiate({ email: signupEmail, password: signupPassword, role: userType }).unwrap();
      if (result?.success) {
        setPendingEmail(signupEmail);
        setShowVerification(true);
      }
    } catch (err: any) {
      toastError(err?.data?.message || "Failed to send verification code.");
    }
  };

  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!verificationCode.trim()) { toastWarning("Please enter the verification code."); return; }

    try {
      const result = await verifySignupCode({ email: pendingEmail, code: verificationCode }).unwrap();
      if (result?.success) {
        toastSuccess("Email verified! Please complete your profile.");
        setShowVerification(false);
        setShowProfileForm(true);
        setVerificationCode("");
      }
    } catch (err: any) {
      toastError(err?.data?.message || "Invalid code. Please try again.");
    }
  };

  const handleCompleteSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profileData.first_name.trim()) { toastWarning("First name is required."); return; }
    if (!profileData.last_name.trim()) { toastWarning("Last name is required."); return; }

    try {
      const result = await completeSignup({ email: pendingEmail, ...profileData }).unwrap();
      if (result?.success) {
        toastSuccess("Account created successfully!");
        await showSuccess("Welcome!", "Your account has been created. Please wait for admin approval before signing in.");
        setShowProfileForm(false);
        setSignupEmail(""); setSignupPassword(""); setSignupConfirmPassword("");
        setTermsAccepted(false); setPendingEmail("");
        setProfileData({ first_name: "", last_name: "", phone: "", company: "", company_tax_id: "", street_address: "", city: "", district_state: "", postal_code: "", country: "" });
        setAuthMode("signin");
      }
    } catch (err: any) {
      toastError(err?.data?.message || "Failed to complete registration.");
    }
  };

  const handleResendCode = async () => {
    try {
      await resendVerificationCode({ email: pendingEmail }).unwrap();
      toastSuccess("New code sent to your email.");
    } catch (err: any) {
      toastError(err?.data?.message || "Failed to resend code.");
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateEmail(email)) { toastWarning("Please enter a valid email."); return; }
    try {
      const result = await login({ email, password }).unwrap();
      if (result?.success) {
        toastSuccess("Welcome back!");
        const userId = result.data?.data?.user?.id;
        const role = result.data?.data?.role;
        const userName = result.data?.data?.user?.username;
        const companyName = result.data?.userDetail?.company;
        const accessToken = result?.data?.token;
        const refreshToken = result?.data?.refreshToken;
        if (userId) {
          localStorage.setItem("userId", userId.toString());
          localStorage.setItem("userRole", role);
          localStorage.setItem("userName", userName);
          localStorage.setItem("companyName", companyName);
        }
        const socket = getSocket();
        socket.connect();
        socket.emit("joinRooms", { user_id: userId, role }, (res: { success: boolean }) => {
          if (res.success) console.log("Socket rooms joined successfully");
        });
        if (accessToken) localStorage.setItem("accessToken", accessToken);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        if (role === "buyer") window.location.href = "/buyer-dashboard";
        else if (role === "seller") window.location.href = "/dashboard";
        else if (role === "admin") window.location.href = "/admin";
        else window.location.href = "/forbidden";
      } else {
        toastError(result?.message || "Login failed.");
      }
    } catch (err: any) {
      toastError(err?.data?.message || "Login failed.");
    }
  };

  const toggleCategory = (slug: string) => {
    setSelectedCategories(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };


  const FEATURES = [
    t("auth.features.verifiedMarketplace"),
    t("auth.features.secureBidding"),
    t("auth.features.realTimeNotifications"),
    t("auth.features.businessVerification"),
  ];

  return (
    <div className="min-h-screen flex bg-background">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[380px] xl:w-[440px] flex-col justify-between p-10 text-primary-foreground relative overflow-hidden bg-gradient-primary shrink-0">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M20 20h20v20H20zM0 0h20v20H0z\'/%3E%3C/g%3E%3C/svg%3E")' }} />

        {/* Top */}
        <div className="relative z-10">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity mb-10">
            <ArrowLeft className="w-4 h-4" />
            {t("auth.backToHome")}
          </button>
          <div className="mb-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">Welcome to</span>
          </div>
          <h1 className="text-3xl font-bold mb-3 tracking-tight">GreenBidz</h1>
          <p className="text-sm opacity-70 leading-relaxed max-w-[300px]">
            {t("landing.subtitle")}
          </p>

          {/* Role badge */}
          {userType !== "admin" && (
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wide">
              {userType === "buyer"
                ? <><ShoppingCart className="w-3.5 h-3.5" /> {t("auth.buyerAccount")}</>
                : <><Store className="w-3.5 h-3.5" /> {t("auth.sellerAccount")}</>
              }
            </div>
          )}
        </div>

        {/* Bottom features */}
        <div className="relative z-10 space-y-4 mt-auto">
          <div className="w-10 h-[2px] opacity-30 bg-warning" />
          {FEATURES.map((item, i) => (
            <div key={i} className="flex items-start gap-3 text-sm opacity-70">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-warning" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Mobile / top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border lg:border-none lg:px-10 lg:pt-6 lg:pb-0">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground lg:hidden">
            <ArrowLeft className="w-4 h-4" /> {t("auth.backToHome")}
          </button>
          <span className="text-sm font-semibold text-primary lg:hidden">GreenBidz</span>
          {/* Language switcher — right-aligned */}
          <div className="ml-auto">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="flex-1 flex items-start justify-center py-8 px-6 lg:px-10">
        <div className="w-full max-w-xl">

          {/* ── Buyer / Seller pill toggle ── */}
          {userType !== "admin" && authMode === "signup" && (
            <div className="flex justify-center mb-6">
              <div className="inline-flex rounded-full border border-border bg-muted/40 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => handleTypeSwitch("buyer")}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200",
                    userType === "buyer"
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {t("auth.imABuyer")}
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeSwitch("seller")}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200",
                    userType === "seller"
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Store className="w-4 h-4" />
                  {t("auth.imASeller")}
                </button>
              </div>
            </div>
          )}

          {/* ══ SIGN IN ══ */}
          {authMode === "signin" && (
            <div className="animate-fade-in">

              {/* Icon + heading */}
              <div className="text-center mb-7">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t("auth.welcomeBack")}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {userType === "buyer"
                    ? t("auth.signInToBuyer")
                    : userType === "admin"
                    ? t("auth.adminPortal")
                    : t("auth.signInToSeller")}
                </p>
              </div>


              {/* Form */}
              <form onSubmit={handleSignIn} className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email" className="text-sm font-medium text-foreground">
                    {t("auth.companyEmail")} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="info@greenbidz.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 pl-10 bg-muted/30 border-border focus:border-primary"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password" className="text-sm font-medium text-foreground">
                      {t("auth.password")} <span className="text-destructive">*</span>
                    </Label>
                    {userType !== "admin" && (
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline"
                        onClick={() => navigate("/forgot-password")}
                      >
                        {t("auth.forgotPassword")}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 pl-10 pr-11 bg-muted/30 border-border focus:border-primary"
                    />
                    <button
                      type="button"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword(v => !v)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full h-12 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2 mt-2"
                  disabled={isLoginLoading}
                >
                  {isLoginLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {t("auth.signingIn")}</>
                  ) : (
                    <><LogIn className="w-4 h-4" /> {t("auth.loginButton")}</>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-3 text-xs text-muted-foreground uppercase tracking-wide">
                    or
                  </span>
                </div>
              </div>

              {/* Create Account CTA card */}
              <div className="rounded-xl border border-border bg-muted/30 p-5 text-center">
                <p className="text-sm font-semibold text-foreground mb-0.5">Don't have an account yet?</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Join thousands of buyers &amp; sellers on GreenBidz
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 text-sm font-semibold border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all gap-2"
                  onClick={() => setAuthMode("signup")}
                >
                  <UserPlus className="w-4 h-4" />
                  Create Account — It's Free
                </Button>
              </div>

            </div>
          )}

          {/* ══ SIGN UP ══ */}
          {authMode === "signup" && userType !== "admin" && (
            <div className="animate-fade-in">


              {/* Profile details form (step 3) */}
              {showProfileForm ? (
                <div className="animate-fade-in">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Complete your profile</h2>
                    <p className="text-sm text-muted-foreground mt-1">Fill in your details to finish creating your account</p>
                  </div>

                  <form onSubmit={handleCompleteSignup} className="space-y-4">
                    {/* Name row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">First name <span className="text-destructive">*</span></label>
                        <input
                          type="text" placeholder="First name" required
                          value={profileData.first_name}
                          onChange={(e) => setProfileData(p => ({ ...p, first_name: e.target.value }))}
                          className="w-full h-11 px-3 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Last name <span className="text-destructive">*</span></label>
                        <input
                          type="text" placeholder="Last name" required
                          value={profileData.last_name}
                          onChange={(e) => setProfileData(p => ({ ...p, last_name: e.target.value }))}
                          className="w-full h-11 px-3 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Phone number</label>
                      <input
                        type="tel" placeholder="+1 234 567 8900"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(p => ({ ...p, phone: e.target.value }))}
                        className="w-full h-11 px-3 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>

                    {/* Company */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Company name</label>
                      <input
                        type="text" placeholder="Your company"
                        value={profileData.company}
                        onChange={(e) => setProfileData(p => ({ ...p, company: e.target.value }))}
                        className="w-full h-11 px-3 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>

                    {/* Company Tax ID (sellers only) */}
                    {userType === "seller" && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Company Tax ID</label>
                        <input
                          type="text" placeholder="Tax ID number"
                          value={profileData.company_tax_id}
                          onChange={(e) => setProfileData(p => ({ ...p, company_tax_id: e.target.value }))}
                          className="w-full h-11 px-3 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                      </div>
                    )}

                    {/* Address section */}
                    <div className="pt-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Address</p>
                      <div className="space-y-3">
                        <input
                          type="text" placeholder="Street address"
                          value={profileData.street_address}
                          onChange={(e) => setProfileData(p => ({ ...p, street_address: e.target.value }))}
                          className="w-full h-11 px-3 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text" placeholder="City"
                            value={profileData.city}
                            onChange={(e) => setProfileData(p => ({ ...p, city: e.target.value }))}
                            className="w-full h-11 px-3 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          />
                          <input
                            type="text" placeholder="State / District"
                            value={profileData.district_state}
                            onChange={(e) => setProfileData(p => ({ ...p, district_state: e.target.value }))}
                            className="w-full h-11 px-3 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text" placeholder="Postal code"
                            value={profileData.postal_code}
                            onChange={(e) => setProfileData(p => ({ ...p, postal_code: e.target.value }))}
                            className="w-full h-11 px-3 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          />
                          <input
                            type="text" placeholder="Country"
                            value={profileData.country}
                            onChange={(e) => setProfileData(p => ({ ...p, country: e.target.value }))}
                            className="w-full h-11 px-3 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                      disabled={isCompleteLoading}
                    >
                      {isCompleteLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : "Complete Registration"}
                    </Button>
                  </form>
                </div>
              ) : showVerification ? (
                <div className="animate-fade-in space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Create account</h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      {"We've sent an email with a code to your inbox at "}
                      <span className="font-semibold text-foreground">{pendingEmail}</span>.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      It might take a few minutes for your code to arrive. If you don't see it, we recommend checking your Spam folder.
                    </p>
                  </div>
                  <form onSubmit={handleVerifyCode} className="space-y-4">
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter your verification or recovery code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                      className="h-12 text-center text-lg tracking-widest border-primary/40 focus:border-primary bg-muted/20"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isResendLoading}
                      className="text-sm text-primary hover:underline disabled:opacity-50"
                    >
                      {isResendLoading ? "Sending..." : "Resend code"}
                    </button>
                    <Button
                      type="submit"
                      className="w-full h-12 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                      disabled={isVerifyLoading}
                    >
                      {isVerifyLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : "Submit"}
                    </Button>
                  </form>
                  <div className="text-center">
                    <button
                      type="button"
                      className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                      onClick={() => { setShowVerification(false); setVerificationCode(""); }}
                    >
                      Cancel registration
                    </button>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in space-y-5">
                  <div className="text-center mb-2">
                    <h2 className="text-2xl font-bold text-foreground">Create account</h2>
                  </div>
                  <form onSubmit={handleSignupCreate} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="s-email" className="text-sm font-medium">Email address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input id="s-email" type="email" placeholder="Email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required className="h-12 pl-10 bg-muted/30 border-border focus:border-primary" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="s-password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input id="s-password" type={showPassword ? "text" : "password"} placeholder="Password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required className="h-12 pl-10 pr-11 bg-muted/30 border-border focus:border-primary" />
                        <button type="button" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(v => !v)}>
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="s-confirm" className="text-sm font-medium">Confirm password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input id="s-confirm" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm password" value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} required className="h-12 pl-10 pr-11 bg-muted/30 border-border focus:border-primary" />
                        <button type="button" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirmPassword(v => !v)}>
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0" />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        I agree with the{" "}
                        <span className="text-primary hover:underline cursor-pointer">user terms</span>,{" "}
                        <span className="text-primary hover:underline cursor-pointer">privacy statement</span>{" "}
                        and I give permission for GreenBidz to carry out activities for both sellers and buyers.
                      </span>
                    </label>
                    <Button type="submit" className="w-full h-12 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2" disabled={isInitiateLoading}>
                      {isInitiateLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending code...</> : "Create"}
                    </Button>
                  </form>
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center">
                      <span className="bg-background px-3 text-xs text-muted-foreground">Already have an account?</span>
                    </div>
                  </div>
                  <Button type="button" variant="outline" className="w-full h-11 text-sm font-semibold border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all gap-2" onClick={() => setAuthMode("signin")}>
                    <LogIn className="w-4 h-4" />
                    Sign in
                  </Button>
                </div>
              )}
            </div>
          )}

        </div>
        </div>{/* end inner scroll content */}
      </div>{/* end right panel */}
    </div>
  );
};

export default Auth;
