// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import {
  ArrowLeft, Lock, Eye, EyeOff, ShoppingCart, Mail, LogIn,
  Loader2, UserPlus, CheckCircle2, Check, ChevronDown, ChevronRight,
  Tag, AlertCircle, RefreshCw, User, Building2, Phone, Globe,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

import { useLoginMutation, useSignupWithLinkMutation, useResendVerificationLinkMutation } from "@/rtk/slices/apiSlice";
import { CountrySelect } from "@/components/common/CountrySelect";
import { useLanguageAwareCategories } from "@/hooks/useLanguageAwareCategories";
import { toastSuccess, toastError, toastWarning } from "../../helper/toasterNotification";
import { getSocket } from "@/services/socket";
import { pushLoginEvent, pushSignupEvent, pushRoleSelectedEvent, pushFormInteractEvent } from "@/utils/gtm";

type UserType = "buyer" | "seller" | "admin";
type AuthMode = "signup" | "signin";
type SignupStep = "form" | "check_email";

const INDUSTRY_OPTIONS = [
  "Academic / University",
  "Research Institute",
  "Biotechnology",
  "Pharmaceutical",
  "Healthcare / Hospital",
  "Clinical Diagnostics Lab",
  "Environmental Testing",
  "Food & Beverage Testing",
  "Chemical Industry",
  "Agriculture / AgriTech",
  "Oil & Gas / Energy",
  "Semiconductor / Electronics",
  "Contract Research Organization (CRO)",
  "Government / Regulatory",
  "Manufacturing / Industrial Lab",
  "Distributor / Reseller",
  "Startup / Small Business",
  "Other",
];

const PHONE_CODES = [
  // Keep order aligned with CountrySelect: priority countries first, then others.
  { code: "+86", flag: "🇨🇳", label: "CN" },
  { code: "+62", flag: "🇮🇩", label: "ID" },
  { code: "+91", flag: "🇮🇳", label: "IN" },
  { code: "+60", flag: "🇲🇾", label: "MY" },
  { code: "+886", flag: "🇹🇼", label: "TW" },
  { code: "+66", flag: "🇹🇭", label: "TH" },
  { code: "+81", flag: "🇯🇵", label: "JP" },
  { code: "+84", flag: "🇻🇳", label: "VN" },

  { code: "+20", flag: "🇪🇬", label: "EG" },
  { code: "+61", flag: "🇦🇺", label: "AU" },
  { code: "+55", flag: "🇧🇷", label: "BR" },
  { code: "+33", flag: "🇫🇷", label: "FR" },
  { code: "+49", flag: "🇩🇪", label: "DE" },
  { code: "+852", flag: "🇭🇰", label: "HK" },
  { code: "+254", flag: "🇰🇪", label: "KE" },
  { code: "+82", flag: "🇰🇷", label: "KR" },
  { code: "+52", flag: "🇲🇽", label: "MX" },
  { code: "+31", flag: "🇳🇱", label: "NL" },
  { code: "+234", flag: "🇳🇬", label: "NG" },
  { code: "+65", flag: "🇸🇬", label: "SG" },
  { code: "+7", flag: "🇷🇺", label: "RU" },
  { code: "+966", flag: "🇸🇦", label: "SA" },
  { code: "+27", flag: "🇿🇦", label: "ZA" },
  { code: "+90", flag: "🇹🇷", label: "TR" },
  { code: "+971", flag: "🇦🇪", label: "AE" },
  { code: "+44", flag: "🇬🇧", label: "GB" },
  { code: "+1", flag: "🇺🇸", label: "US" },
];

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [userType, setUserType] = useState<UserType>("buyer");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupStep, setSignupStep] = useState<SignupStep>("form");

  // Sign in
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup form
  const [form, setForm] = useState({
    email: "", password: "", confirmPassword: "",
    first_name: "", last_name: "", phone: "",
    phoneCode: "+86",
    company: "", country: "",
    industry: "", industryOther: "",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [interestDropdownOpen, setInterestDropdownOpen] = useState(false);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);
  const [pendingEmail, setPendingEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  // unverifiedModal: null = hidden | { email, type } = shown
  const [unverifiedModal, setUnverifiedModal] = useState<{ email: string; type: "not_verified" | "pending" } | null>(null);
  const [isResendingLink, setIsResendingLink] = useState(false);

  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [signupWithLink, { isLoading: isSignupLoading }] = useSignupWithLinkMutation();
  const [resendVerificationLink] = useResendVerificationLinkMutation();
  const { data: labCategories = [] } = useLanguageAwareCategories();
  const [returnedFromVerify, setReturnedFromVerify] = useState(false);

  const allowedTypes: UserType[] = ["buyer", "seller", "admin"];

  // When user comes back to this tab (after clicking email link in another tab),
  // show "Verified? Sign in now" prompt on the check_email screen.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && signupStep === "check_email") {
        setReturnedFromVerify(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [signupStep]);

  // Close interests dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setInterestDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const type = searchParams.get("type") as UserType | null;
    const mode = searchParams.get("mode") as AuthMode | null;
    if (!type || !allowedTypes.includes(type)) {
      const p = new URLSearchParams(searchParams); p.set("type", "buyer");
      setSearchParams(p, { replace: true }); setUserType("buyer");
    } else {
      setUserType(type);
      if (type === "admin") setAuthMode("signin");
      else if (mode === "signin" || mode === "signup") setAuthMode(mode);
    }
  }, [searchParams]);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const setF = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const toggleInterest = (slug: string) =>
    setSelectedInterests(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(form.email)) { toastWarning(t("auth.validation.validEmailAddress")); return; }
    if (form.password.length < 6) { toastWarning(t("auth.validation.passwordMinLength")); return; }
    if (form.password !== form.confirmPassword) { toastWarning(t("auth.passwordsNoMatch")); return; }
    if (!form.first_name.trim()) { toastWarning(t("auth.validation.firstNameRequired")); return; }
    if (!form.last_name.trim()) { toastWarning(t("auth.validation.lastNameRequired")); return; }
    if (!termsAccepted) { toastWarning(t("auth.validation.acceptTerms")); return; }

    try {
      await signupWithLink({
        email: form.email, password: form.password, role: "buyer",
        first_name: form.first_name, last_name: form.last_name,
        phone: form.phone ? `${form.phoneCode}${form.phone}` : "",
        company: form.company, country: form.country,
        industry: form.industry === "Other" ? `Other: ${form.industryOther}` : form.industry,
        interests: selectedInterests,
      }).unwrap();
      try { pushRoleSelectedEvent(userType); } catch { }
      try { pushSignupEvent(userType); } catch { }
      setPendingEmail(form.email);
      setSignupStep("check_email");
    } catch (err: any) {
      toastError(err?.data?.message || t("auth.validation.registrationFailed"));
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) { toastWarning(t("auth.validation.validEmail")); return; }
    try {
      const result = await login({ email, password }).unwrap();
      if (result?.success) {
        try { pushLoginEvent(result, "email"); } catch { }
        toastSuccess(t("auth.validation.welcomeBackToast"));
        const userId = result.data?.data?.user?.id;
        const role = result.data?.data?.role;
        const userName = result.data?.data?.user?.username;
        const companyName = result.data?.userDetail?.company;
        const accessToken = result?.data?.token;
        const refreshToken = result?.data?.refreshToken;
        if (userId) {
          localStorage.setItem("userId", userId.toString());
          localStorage.setItem("userRole", role); localStorage.setItem("jwtRole", role);
          localStorage.setItem("activeView", role);
          if (userName) localStorage.setItem("userName", userName);
          if (companyName && companyName !== "null") localStorage.setItem("companyName", companyName);
          else localStorage.removeItem("companyName");
        }
        const socket = getSocket(); socket.connect();
        socket.emit("joinRooms", { user_id: userId, role }, (res: any) => { });
        if (accessToken) localStorage.setItem("accessToken", accessToken);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        if (role === "buyer") window.location.href = "/buyer-dashboard";
        else if (role === "seller") window.location.href = "/dashboard";
        else if (role === "admin") window.location.href = "/admin";
        else window.location.href = "/forbidden";
      } else { toastError(result?.message || t("auth.validation.loginFailed")); }
    } catch (err: any) {
      const code = err?.data?.code;
      if (code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedModal({ email, type: "not_verified" });
      } else if (err?.status === 403 || code === "ACCOUNT_PENDING") {
        setUnverifiedModal({ email, type: "pending" });
      } else {
        toastError(err?.data?.message || t("auth.validation.loginFailed"));
      }
    }
  };

  const FEATURES = [
    t("auth.features.verifiedMarketplace"), t("auth.features.secureBidding"),
    t("auth.features.realTimeNotifications"), t("auth.features.businessVerification"),
  ];

  // ── Interests dropdown label helper
  const getInterestLabel = (slug: string) =>
    labCategories.flatMap(c => [c, ...(c.subcategories || [])]).find(c => c.slug === slug)?.name || slug;

  return (
    <div className="min-h-screen flex bg-background">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[380px] xl:w-[440px] flex-col justify-between p-10 text-primary-foreground relative overflow-hidden bg-gradient-primary shrink-0">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M20 20h20v20H20zM0 0h20v20H0z\'/%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative z-10">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity mb-10">
            <ArrowLeft className="w-4 h-4" />{t("auth.backToHome")}
          </button>
          <div className="mb-1"><span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">{t("auth.welcomeTo")}</span></div>
          <h1 className="text-3xl font-bold mb-3 tracking-tight">GreenBidz</h1>
          <p className="text-sm opacity-70 leading-relaxed max-w-[300px]">{t("landing.subtitle")}</p>
          {userType !== "admin" && (
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wide">
              <ShoppingCart className="w-3.5 h-3.5" /> {t("auth.buyerAccount")}
            </div>
          )}
        </div>
        <div className="relative z-10 space-y-4 mt-auto">
          <div className="w-10 h-[2px] opacity-30 bg-warning" />
          {FEATURES.map((item, i) => (
            <div key={i} className="flex items-start gap-3 text-sm opacity-70">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-warning" /><span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border lg:border-none lg:px-10 lg:pt-6 lg:pb-0">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground lg:hidden">
            <ArrowLeft className="w-4 h-4" />{t("auth.backToHome")}
          </button>
          <span className="text-sm font-semibold text-primary lg:hidden">GreenBidz</span>
          <div className="ml-auto"><LanguageSwitcher /></div>
        </div>

        <div className="flex-1 flex items-start justify-center py-8 px-4 lg:px-8">
          <div className="w-full max-w-2xl">

            {/* ══ SIGN IN ══ */}
            {authMode === "signin" && (
              <div className="animate-fade-in max-w-md mx-auto rounded-2xl border border-border bg-card shadow-sm p-8 lg:p-10">
                <div className="text-center mb-7">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">{t("auth.welcomeBack")}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {userType === "admin" ? t("auth.adminPortal") : t("auth.signInToBuyer")}
                  </p>
                </div>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{t("auth.companyEmail")} <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} onFocus={() => { try { pushFormInteractEvent('login', 'email'); } catch { } }} required className="h-12 pl-10 bg-muted/30 border-border focus:border-primary" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{t("auth.password")} <span className="text-destructive">*</span></Label>
                      {userType !== "admin" && <button type="button" className="text-xs text-primary hover:underline" onClick={() => navigate("/forgot-password")}>{t("auth.forgotPassword")}</button>}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="h-12 pl-10 pr-11 bg-muted/30 border-border focus:border-primary" />
                      <button type="button" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(v => !v)}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 font-semibold bg-primary hover:bg-primary/90 gap-2 mt-2" disabled={isLoginLoading}>
                    {isLoginLoading ? <><Loader2 className="w-4 h-4 animate-spin" />{t("auth.signingIn")}</> : <><LogIn className="w-4 h-4" />{t("auth.loginButton")}</>}
                  </Button>
                </form>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground uppercase tracking-wide">{t("auth.or")}</span></div>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-5 text-center">
                  <p className="text-sm font-semibold mb-0.5">{t("auth.dontHaveAccountYet")}</p>
                  <p className="text-xs text-muted-foreground mb-4">{t("auth.joinThousands")}</p>
                  <Button type="button" variant="outline" className="w-full h-10 text-sm font-semibold border-primary text-primary hover:bg-primary hover:text-primary-foreground gap-2" onClick={() => setAuthMode("signup")}>
                    <UserPlus className="w-4 h-4" />{t("auth.createAccountFree")}
                  </Button>
                </div>
              </div>
            )}

            {/* ══ SIGN UP ══ */}
            {authMode === "signup" && userType !== "admin" && (
              <div className="animate-fade-in">

                {/* ── Check email screen ── */}
                {signupStep === "check_email" && (
                  <div className="animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <button type="button" onClick={() => setSignupStep("form")} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h2 className="text-lg font-bold text-foreground">{t("auth.finishSetupTitle")}</h2>
                      <div className="w-8" />
                    </div>

                    {/* Returned from verify tab — prompt to sign in */}
                    {returnedFromVerify && (
                      <div className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          <p className="text-sm font-medium text-emerald-800">
                            {t("auth.alreadyVerifiedPrompt")}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 flex-shrink-0"
                          onClick={() => {
                            setReturnedFromVerify(false);
                            setSignupStep("form");
                            setAuthMode("signin");
                          }}
                        >
                          <LogIn className="w-3.5 h-3.5" />{t("auth.signIn")}
                        </Button>
                      </div>
                    )}

                    {/* Amber info banner */}
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 mb-6">
                      <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800 leading-relaxed">
                        {t("auth.finishSetupBanner")}
                      </p>
                    </div>

                    {/* Verify email row */}
                    <div className="rounded-xl border border-border bg-background overflow-hidden">
                      <div className="flex items-start gap-4 p-5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground mb-3">{t("auth.verifyEmailTitle")}</p>
                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-full border-2 border-red-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <AlertCircle className="w-4 h-4 text-red-400" />
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {t("auth.verifyEmailInstructionPrefix")}{" "}
                              <span className="font-semibold text-foreground">{pendingEmail}</span>.{" "}
                              {t("auth.verifyEmailInstructionSuffix")}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isResending}
                          onClick={async () => {
                            setIsResending(true);
                            try {
                              await resendVerificationLink({ email: pendingEmail }).unwrap();
                              toastSuccess(t("auth.verificationEmailResent"));
                            } catch (err: any) {
                              toastError(err?.data?.message || t("auth.failedToResendTryAgain"));
                            } finally { setIsResending(false); }
                          }}
                          className="text-sm font-semibold text-primary hover:underline flex-shrink-0 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isResending
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <RefreshCw className="w-3.5 h-3.5" />
                          }
                          {t("auth.resend")}
                        </button>
                      </div>

                      {/* What's next steps */}
                      <div className="border-t border-border bg-muted/30 px-5 py-4 space-y-2.5">
                        {[
                          t("auth.verifyStep1"),
                          t("auth.verifyStep2"),
                          t("auth.verifyStep3"),
                        ].map((step, i) => (
                          <div key={i} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] flex-shrink-0">{i + 1}</div>
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full h-11 mt-5 bg-primary hover:bg-primary/90 font-semibold gap-2" onClick={() => navigate("/marketplace")}>
                      {t("auth.browseWhileWaiting")}
                    </Button>
                  </div>
                )}

                {/* ── Registration form ── */}
                {signupStep === "form" && (
                  <div className="animate-fade-in">
                    <div className="text-center mb-7">
                      <h2 className="text-2xl font-bold">{t("auth.createYourAccountTitle")}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{t("auth.joinMarketplaceFree")}</p>
                    </div>

                    <form onSubmit={handleSignupSubmit} className="space-y-6">

                      {/* ── Section: Credentials ── */}
                      <div className="rounded-2xl border border-border bg-muted/20 p-6 space-y-4">
                        <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Lock className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <p className="text-sm font-semibold text-foreground">{t("auth.accountCredentials")}</p>
                        </div>

                        {/* Email — full row */}
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-foreground">
                            {t("auth.companyEmail")} <span className="text-destructive">*</span>
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <Input type="email" placeholder="company@yourcompany.com" value={form.email}
                              onChange={setF("email")} onFocus={() => { try { pushFormInteractEvent('registration', 'email'); } catch { } }}
                              required className="h-11 pl-10 bg-background border-border focus:border-primary" />
                          </div>
                        </div>

                        {/* Password + Confirm — 2 cols */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-foreground">
                              {t("auth.password")} <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                              <Input type={showPassword ? "text" : "password"} placeholder={t("auth.passwordMinPlaceholder")}
                                value={form.password} onChange={setF("password")} required
                                className="h-11 pl-10 pr-10 bg-background border-border focus:border-primary" />
                              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5" onClick={() => setShowPassword(v => !v)}>
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-foreground">
                              {t("auth.confirmPassword")} <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                              <Input type={showConfirmPassword ? "text" : "password"} placeholder={t("auth.repeatPasswordPlaceholder")}
                                value={form.confirmPassword} onChange={setF("confirmPassword")} required
                                className="h-11 pl-10 pr-10 bg-background border-border focus:border-primary" />
                              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5" onClick={() => setShowConfirmPassword(v => !v)}>
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ── Section: Personal + Company (combined) ── */}
                      <div className="rounded-2xl border border-border bg-muted/20 p-6 space-y-4">
                        <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <p className="text-sm font-semibold text-foreground">{t("auth.personalCompanyDetails")}</p>
                        </div>

                        {/* First name | Last name | Phone — 3 cols */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-foreground">
                              {t("auth.firstName")} <span className="text-destructive">*</span>
                            </Label>
                            <Input placeholder={t("auth.firstNameExample")} value={form.first_name} onChange={setF("first_name")}
                              required className="h-11 bg-background border-border focus:border-primary" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-foreground">
                              {t("auth.lastName")} <span className="text-destructive">*</span>
                            </Label>
                            <Input placeholder={t("auth.lastNameExample")} value={form.last_name} onChange={setF("last_name")}
                              required className="h-11 bg-background border-border focus:border-primary" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-foreground">{t("auth.phoneNumber")}</Label>
                            <div className="flex h-11 rounded-md border border-border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 overflow-hidden">
                              <select
                                value={form.phoneCode}
                                onChange={e => setForm(p => ({ ...p, phoneCode: e.target.value }))}
                                className="h-full pl-2 pr-1 text-sm bg-muted/40 border-r border-border text-foreground focus:outline-none cursor-pointer shrink-0"
                              >
                                {PHONE_CODES.map(({ code, flag, label }) => (
                                  <option key={code} value={code}>{flag} {code}</option>
                                ))}
                              </select>
                              <input
                                type="tel"
                                placeholder={t("auth.phonePlaceholder")}
                                value={form.phone}
                                onChange={setF("phone")}
                                className="flex-1 h-full px-3 text-sm bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Company | Country — 2 cols */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-foreground">{t("auth.companyName")}</Label>
                            <div className="relative">
                              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                              <Input placeholder={t("auth.yourCompany")} value={form.company} onChange={setF("company")}
                                className="h-11 pl-10 bg-background border-border focus:border-primary" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-foreground">{t("auth.country")}</Label>
                            <CountrySelect value={form.country} onChange={v => setForm(p => ({ ...p, country: v }))} className="h-11 bg-background" />
                          </div>
                        </div>

                        {/* Customer Industry — full row */}
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-foreground">{t("auth.customerIndustry")}</Label>
                          <select
                            value={form.industry}
                            onChange={e => setForm(p => ({ ...p, industry: e.target.value, industryOther: "" }))}
                            className="w-full h-11 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="">{t("auth.selectYourIndustry")}</option>
                            {INDUSTRY_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          {form.industry === "Other" && (
                            <Input
                              placeholder={t("auth.specifyIndustryPlaceholder")}
                              value={form.industryOther}
                              onChange={setF("industryOther")}
                              className="h-11 bg-background border-border focus:border-primary mt-2"
                            />
                          )}
                        </div>
                      </div>

                      {/* ── Section: Interests ── */}
                      {labCategories.length > 0 && (
                        <div className="rounded-2xl border border-border bg-muted/20 p-6 space-y-4">
                          <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Tag className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                              {t("auth.equipmentInterests")} <span className="text-xs font-normal text-muted-foreground ml-1">({t("auth.optional")})</span>
                            </p>
                          </div>
                          <div ref={dropdownRef} className="relative">
                            {/* Trigger */}
                            <button
                              type="button"
                              onClick={() => setInterestDropdownOpen(v => !v)}
                              className={cn(
                                "w-full h-11 px-3 rounded-md border text-sm flex items-center justify-between bg-background transition-all",
                                interestDropdownOpen ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                              )}
                            >
                              <span className="flex items-center gap-2 text-muted-foreground truncate">
                                {selectedInterests.length === 0
                                  ? t("auth.selectCategoriesInterested")
                                  : <span className="text-foreground font-medium">{t("auth.categoriesSelected", { count: selectedInterests.length })}</span>
                                }
                              </span>
                              <ChevronDown className={cn("w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ml-2", interestDropdownOpen && "rotate-180")} />
                            </button>

                            {/* Panel */}
                            {interestDropdownOpen && (
                              <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-border bg-background shadow-xl max-h-64 overflow-y-auto">
                                {labCategories.map((cat) => {
                                  const parentSel = selectedInterests.includes(cat.slug);
                                  const isExp = expandedParents.includes(cat.slug);
                                  const hasSubs = cat.subcategories?.length > 0;
                                  return (
                                    <div key={cat.slug} className="border-b border-border/60 last:border-0">
                                      <div className="flex items-stretch">
                                        <button type="button" onClick={() => toggleInterest(cat.slug)}
                                          className="flex items-center gap-2.5 flex-1 px-3 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors text-left">
                                          <div className={cn("w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all", parentSel ? "bg-primary border-primary" : "border-border")}>
                                            {parentSel && <Check className="w-2.5 h-2.5 text-white" />}
                                          </div>
                                          <span className={parentSel ? "text-primary" : "text-foreground"}>{cat.name}</span>
                                        </button>
                                        {hasSubs && (
                                          <button type="button"
                                            onClick={() => setExpandedParents(prev => prev.includes(cat.slug) ? prev.filter(s => s !== cat.slug) : [...prev, cat.slug])}
                                            className="px-3 border-l border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                                            <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", isExp && "rotate-90")} />
                                          </button>
                                        )}
                                      </div>
                                      {hasSubs && isExp && (
                                        <div className="bg-muted/30 border-t border-border/60">
                                          {cat.subcategories.map((sub) => {
                                            const subSel = selectedInterests.includes(sub.slug);
                                            return (
                                              <button key={sub.slug} type="button" onClick={() => toggleInterest(sub.slug)}
                                                className="flex items-center gap-2 w-full px-5 py-2 text-xs hover:bg-muted/50 transition-colors text-left border-b border-border/40 last:border-0">
                                                <div className={cn("w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-all", subSel ? "bg-primary border-primary" : "border-border")}>
                                                  {subSel && <Check className="w-2 h-2 text-white" />}
                                                </div>
                                                <span className={subSel ? "text-primary font-medium" : "text-muted-foreground"}>{sub.name}</span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Selected tags */}
                            {selectedInterests.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {selectedInterests.map(slug => (
                                  <span key={slug} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                                    {getInterestLabel(slug)}
                                    <button type="button" onClick={() => toggleInterest(slug)} className="hover:text-destructive ml-0.5 leading-none">×</button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Terms */}
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0" />
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          {t("auth.agreementPrefix")}{" "}
                          <span className="text-primary hover:underline cursor-pointer">{t("auth.userTerms")}</span>,{" "}
                          <span className="text-primary hover:underline cursor-pointer">{t("auth.privacyStatement")}</span>{" "}
                          {t("auth.agreementSuffix")}
                        </span>
                      </label>

                      <Button type="submit" className="w-full h-12 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2" disabled={isSignupLoading}>
                        {isSignupLoading ? <><Loader2 className="w-4 h-4 animate-spin" />{t("auth.creatingAccount")}</> : t("auth.createAccount")}
                      </Button>
                    </form>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                      <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">{t("auth.alreadyHaveAccount")}</span></div>
                    </div>
                    <Button type="button" variant="outline" className="w-full h-11 text-sm font-semibold border-primary text-primary hover:bg-primary hover:text-primary-foreground gap-2" onClick={() => setAuthMode("signin")}>
                      <LogIn className="w-4 h-4" />{t("auth.signIn")}
                    </Button>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Unverified / Pending account overlay modal ── */}
      {unverifiedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border p-8 flex flex-col items-center text-center">
            {/* Close */}
            <button
              type="button"
              onClick={() => setUnverifiedModal(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icon */}
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-5",
              unverifiedModal.type === "not_verified" ? "bg-amber-100" : "bg-blue-50"
            )}>
              {unverifiedModal.type === "not_verified"
                ? <Mail className="w-8 h-8 text-amber-500" />
                : <CheckCircle2 className="w-8 h-8 text-blue-500" />
              }
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-foreground mb-2">
              {unverifiedModal.type === "not_verified" ? t("auth.emailNotVerifiedTitle") : t("auth.accountPendingApprovalTitle")}
            </h3>

            {/* Body */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-1">
              {unverifiedModal.type === "not_verified"
                ? t("auth.emailNotVerifiedBody")
                : t("auth.accountPendingApprovalBody")
              }
            </p>
            <p className="text-sm font-semibold text-foreground mb-4">{unverifiedModal.email}</p>

            <div className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 mb-5 text-left">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {unverifiedModal.type === "not_verified"
                  ? t("auth.emailNotVerifiedHelp")
                  : t("auth.accountPendingApprovalHelp")
                }
              </p>
            </div>

            {unverifiedModal.type === "not_verified" && (
              <Button
                type="button"
                className="w-full h-11 font-semibold bg-primary hover:bg-primary/90 gap-2 mb-3"
                disabled={isResendingLink}
                onClick={async () => {
                  setIsResendingLink(true);
                  try {
                    await resendVerificationLink({ email: unverifiedModal.email }).unwrap();
                    toastSuccess(t("auth.verificationEmailResentInbox"));
                  } catch (err: any) {
                    toastError(err?.data?.message || t("auth.failedToResend"));
                  } finally { setIsResendingLink(false); }
                }}
              >
                {isResendingLink
                  ? <><Loader2 className="w-4 h-4 animate-spin" />{t("auth.sending")}</>
                  : <><RefreshCw className="w-4 h-4" />{t("auth.resendVerificationEmail")}</>
                }
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 text-sm mb-3"
              onClick={() => { setUnverifiedModal(null); navigate("/marketplace"); }}
            >
              {t("auth.browseWhileWaiting")}
            </Button>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground underline"
              onClick={() => setUnverifiedModal(null)}
            >
              {t("auth.close")}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Auth;
