// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import authLogo from "@/assets/lablogo.png";
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

import axios from "axios";
import { useLoginMutation, useSignupWithLinkMutation, useResendVerificationLinkMutation } from "@/rtk/slices/apiSlice";
import SEOMeta from "@/components/common/SEOMeta";
import { getSEO } from "@/config/seoConfig";
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
  { code: "+86", label: "CN" },
  { code: "+62", label: "ID" },
  { code: "+91", label: "IN" },
  { code: "+60", label: "MY" },
  { code: "+886", label: "TW" },
  { code: "+66", label: "TH" },
  { code: "+81", label: "JP" },
  { code: "+84", label: "VN" },
  { code: "+20", label: "EG" },
  { code: "+61", label: "AU" },
  { code: "+55", label: "BR" },
  { code: "+33", label: "FR" },
  { code: "+49", label: "DE" },
  { code: "+852", label: "HK" },
  { code: "+254", label: "KE" },
  { code: "+82", label: "KR" },
  { code: "+52", label: "MX" },
  { code: "+31", label: "NL" },
  { code: "+234", label: "NG" },
  { code: "+65", label: "SG" },
  { code: "+27", label: "ZA" },
  { code: "+34", label: "ES" },
  { code: "+46", label: "SE" },
  { code: "+41", label: "CH" },
  { code: "+90", label: "TR" },
  { code: "+44", label: "GB" },
  { code: "+1", label: "US" },
]

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
    // industry: "", industryOther: "",
  });
  const [wantToSell, setWantToSell] = useState(false);
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

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = () => {
    if (isGoogleLoading) return;
    const clientId = "471881848291-9vg48o19oonnstms9hoj7c8noi2ab0ps.apps.googleusercontent.com";
    const redirectUri = encodeURIComponent("https://api.101recycle.greenbidz.com/auth/google/callback");
    const scope = encodeURIComponent("openid email profile");
    const state = encodeURIComponent(JSON.stringify({ mode: authMode, type: userType }));
    window.location.href =
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=select_account`;
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(form.email)) { toastWarning(t("auth.validation.validEmailAddress")); return; }
    if (form.password.length < 6) { toastWarning(t("auth.validation.passwordMinLength")); return; }
    if (form.password !== form.confirmPassword) { toastWarning(t("auth.passwordsNoMatch")); return; }
    if (!form.first_name.trim()) { toastWarning(t("auth.validation.firstNameRequired")); return; }
    if (!form.last_name.trim()) { toastWarning(t("auth.validation.lastNameRequired")); return; }

    try {
      await signupWithLink({
        email: form.email, password: form.password, role: wantToSell ? "seller" : "buyer",
        first_name: form.first_name, last_name: form.last_name,
        phone: form.phone ? `${form.phoneCode}${form.phone}` : "",
        company: form.company, country: form.country,
        // industry: form.industry === "Other" ? `Other: ${form.industryOther}` : form.industry,
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
      console.log("changes");
      
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
        if (role === "buyer") window.location.href = "/dashboard";
        else if (role === "seller") window.location.href = "/dashboard";
        else if (role === "admin") window.location.href = "/admin";
        else window.location.href = "/forbidden";
      } else { toastError(result?.message || t("auth.validation.loginFailed")); }
    } catch (err: any) {
      const code = err?.data?.code;
      if (code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedModal({ email, type: "not_verified" });
      } else if (err?.status === 403 || code === "ACCOUNT_PENDING") {
        const { token, refreshToken, userId } = err?.data || {};
        if (token) localStorage.setItem("accessToken", token);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        if (userId) localStorage.setItem("userId", userId.toString());
        window.location.href = "/dashboard";
      } else {
        toastError(err?.data?.message || t("auth.validation.loginFailed"));
      }
    }
  };

  const FEATURES = [
    t("auth.features.verifiedMarketplace"), t("auth.features.secureBidding"),
    t("auth.features.realTimeNotifications"), t("auth.features.businessVerification"),
  ];

  // â”€â”€ Interests dropdown label helper
  const getInterestLabel = (slug: string) =>
    labCategories.flatMap(c => [c, ...(c.subcategories || [])]).find(c => c.slug === slug)?.name || slug;

  return (
    <>
    <SEOMeta {...getSEO('auth')} />
    <div className="min-h-screen overflow-hidden bg-gradient-lab px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl  items-center justify-center">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">

          {/* â”€â”€ Left branding aside â”€â”€ */}
          <aside className="hidden lg:block">
            <div className="mb-10 inline-flex rounded-2xl bg-card/80 px-6 py-4 shadow-panel backdrop-blur">
              <img src={authLogo} alt="101LAB" className="h-20 w-auto object-contain" />
            </div>
            <h1 className="max-w-xl text-5xl font-extrabold leading-tight text-brand-navy">
              Welcome to a smarter lab equipment marketplace.
            </h1>
            <p className="mt-5 max-w-lg text-xl leading-8 text-muted-foreground">
              Build your account, tune your equipment interests, and unlock bidding-ready verification.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {["Infrastructure", "Biotech", "Pharma", "T&M"].map(pill => (
                <span key={pill} className="rounded-full px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: "#2ec99a" }}>{pill}</span>
              ))}
            </div>
          </aside>

          {/* card â”€â”€ */}
          <div className={authMode === "signup" ? "rounded-3xl bg-card shadow-panel ring-1 ring-border/70" : "w-full"}>

            {/* â•â• SIGN IN â•â• */}
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
                      <Input type={showPassword ? "text" : "password"} placeholder="" value={password} onChange={e => setPassword(e.target.value)} required className="h-12 pl-10 pr-11 bg-muted/30 border-border focus:border-primary" />
                      <button type="button" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(v => !v)}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 font-semibold bg-primary hover:bg-primary/90 gap-2 mt-2" disabled={isLoginLoading}>
                    {isLoginLoading ? <><Loader2 className="w-4 h-4 animate-spin" />{t("auth.signingIn")}</> : <><LogIn className="w-4 h-4" />{t("auth.loginButton")}</>}
                  </Button>
                </form>
                {/* â”€â”€ Google sign-in button â”€â”€ */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground uppercase tracking-wide">or</span></div>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full h-11 flex items-center justify-center gap-3 rounded-lg border border-border bg-background hover:bg-muted/40 transition-colors text-sm font-medium text-foreground disabled:opacity-50 mb-5"
                >
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

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

            {/* â•â• SIGN UP â•â• */}
            {authMode === "signup" && userType !== "admin" && (
              <div className="animate-fade-in">

                {/* â”€â”€ Check email screen â”€â”€ */}
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

                    {/* Returned from verify tab â€” prompt to sign in */}
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

                {/* â”€â”€ Registration form â”€â”€ */}
                {signupStep === "form" && (
                  <div className="animate-fade-in mx-auto w-full max-w-3xl   p-6 sm:p-10">
                    <div className="mb-8">
                      <p className="text-sm font-extrabold uppercase tracking-normal text-brand-teal mb-2">Create Account</p>
                      <h2 className="mt-2 text-3xl font-extrabold text-brand-navy">Start browsing 101LAB</h2>
                    </div>

                    {/* â”€â”€ Google sign-up button (top) â”€â”€ */}
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isGoogleLoading}
                      className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white px-6 py-4 text-base font-semibold text-gray-700 shadow-sm transition-all hover:shadow-md disabled:opacity-50 mb-6"
                    >
                      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 48 48" aria-hidden="true">
                        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
                        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C41.1 35.6 44 30.3 44 24c0-1.3-.1-2.4-.4-3.5z"/>
                      </svg>
                      Sign up with Google
                    </button>

                    <div className="my-6 flex items-center gap-4">
                      <span className="h-px flex-1 bg-border" />
                      <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">or</span>
                      <span className="h-px flex-1 bg-border" />
                    </div>

                    <form onSubmit={handleSignupSubmit} className="grid gap-7 sm:grid-cols-2">

                      {/* First Name | Last Name */}
                      <label className="block">
                        <span className="mb-2 block text-base font-bold text-gray-900"><span className="text-destructive mr-1">*</span>First Name</span>
                        <input placeholder="First Name" value={form.first_name} onChange={setF("first_name")} required
                          className="h-14 w-full rounded-2xl border border-gray-200 bg-white px-5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-base font-bold text-gray-900"><span className="text-destructive mr-1">*</span>Last Name</span>
                        <input placeholder="Last Name" value={form.last_name} onChange={setF("last_name")} required
                          className="h-14 w-full rounded-2xl border border-gray-200 bg-white px-5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                      </label>

                      {/* Email */}
                      <label className="block sm:col-span-2">
                        <span className="mb-2 block text-base font-bold text-gray-900"><span className="text-destructive mr-1">*</span>Email</span>
                        <input type="email" placeholder="name@company.com" value={form.email}
                          onChange={setF("email")} onFocus={() => { try { pushFormInteractEvent('registration', 'email'); } catch { } }} required
                          className="h-14 w-full rounded-2xl border border-gray-200 bg-white px-5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                      </label>

                      {/* Phone Number */}
                      <label className="block">
                        <span className="mb-2 block text-base font-bold text-gray-900"><span className="text-destructive mr-1">*</span>Phone Number</span>
                        <div className="flex h-14 rounded-2xl border border-gray-200 bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 overflow-hidden">
                          <select
                            value={form.phoneCode}
                            onChange={e => setForm(p => ({ ...p, phoneCode: e.target.value }))}
                            className="h-full pl-3 pr-1 text-base bg-muted border-r border-input text-foreground focus:outline-none cursor-pointer shrink-0"
                          >
                            {PHONE_CODES.map(({ code, label }) => (
                              <option key={code} value={code}>{label} {code}</option>
                            ))}
                          </select>
                          <input type="tel" placeholder="+1 555 000 0000" value={form.phone} onChange={setF("phone")}
                            className="flex-1 h-full px-4 text-xl font-medium bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground/55" />
                        </div>
                      </label>

                      {/* Company Name */}
                      <label className="block">
                        <span className="mb-2 block text-base font-bold text-gray-900"><span className="text-destructive mr-1">*</span>Company Name</span>
                        <input placeholder="Your company / lab" value={form.company} onChange={setF("company")}
                          className="h-14 w-full rounded-2xl border border-gray-200 bg-white px-5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                      </label>

                      {/* Country */}
                      <label className="block">
                        <span className="mb-2 block text-base font-bold text-gray-900"><span className="text-destructive mr-1">*</span>Country</span>
                        <CountrySelect value={form.country} onChange={v => setForm(p => ({ ...p, country: v }))}
                          className="h-14 w-full rounded-2xl border border-gray-200 bg-white px-5 text-sm" />
                      </label>

                      {/* Equipment Interest */}
                      <div className="block" ref={dropdownRef}>
                        <span className="mb-2 block text-base font-bold text-gray-900"><span className="text-destructive mr-1">*</span>Equipment Interest</span>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setInterestDropdownOpen(v => !v)}
                            className={cn(
                              "w-full h-14 px-5 rounded-2xl border border-gray-200 bg-white text-sm flex items-center justify-between transition-all",
                              interestDropdownOpen ? "border-indigo-500 ring-2 ring-indigo-100" : "border-gray-200 hover:border-gray-300"
                            )}
                          >
                            <span className={selectedInterests.length === 0 ? "text-muted-foreground/55" : "text-foreground"}>
                              {selectedInterests.length === 0 ? "Select category" : `${selectedInterests.length} selected`}
                            </span>
                            <ChevronDown className={cn("w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ml-2", interestDropdownOpen && "rotate-180")} />
                          </button>
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
                        </div>
                      </div>

                      {/* Password */}
                      <label className="block sm:col-span-2">
                        <span className="mb-2 block text-base font-bold text-gray-900"><span className="text-destructive mr-1">*</span>Password</span>
                        <div className="relative">
                          <input type={showPassword ? "text" : "password"} placeholder="Enter password"
                            value={form.password} onChange={setF("password")} required
                            className="h-14 w-full rounded-2xl border border-gray-200 bg-white px-5 pr-14 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                          <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(v => !v)}>
                            {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                          </button>
                        </div>
                        <span className="mt-3 block text-lg font-semibold text-muted-foreground">At least 8 characters, a capital letter and a special character</span>
                      </label>

                      {/* Confirm Password */}
                      <label className="block sm:col-span-2">
                        <span className="mb-2 block text-base font-bold text-gray-900"><span className="text-destructive mr-1">*</span>Confirm Password</span>
                        <div className="relative">
                          <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm password"
                            value={form.confirmPassword} onChange={setF("confirmPassword")} required
                            className="h-14 w-full rounded-2xl border border-gray-200 bg-white px-5 pr-14 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                          <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirmPassword(v => !v)}>
                            {showConfirmPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                          </button>
                        </div>
                      </label>

                      {/* Become a Seller */}
                      <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors sm:col-span-2">
                        <input
                          type="checkbox"
                          checked={wantToSell}
                          onChange={e => setWantToSell(e.target.checked)}
                          className="w-5 h-5 accent-primary flex-shrink-0"
                        />
                        <div className="flex-1">
                          <span className="text-base font-bold text-foreground">Become a Seller</span>
                          <p className="text-sm text-muted-foreground mt-0.5">Register as a seller to list and auction your items. Requires admin approval.</p>
                        </div>
                      </label>

                      <button type="submit" disabled={isSignupLoading}
                        className="sm:col-span-2 mt-2 w-full rounded-2xl px-6 py-4 text-base font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ background: "linear-gradient(135deg, hsl(215,60%,18%), hsl(180,65%,40%))" }}>
                        {isSignupLoading ? "Creating Accountâ€¦" : "Create Account"}
                      </button>
                    </form>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                      <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">{t("auth.alreadyHaveAccount")}</span></div>
                    </div>
                    <Button type="button" variant="outline" className="w-full h-11 text-sm font-semibold border-primary text-primary hover:bg-primary hover:text-primary-foreground gap-2" onClick={() => setAuthMode("signin")}>
                      <LogIn className="w-4 h-4" />{t("auth.signIn")}
                    </Button>
                  </div>
                )}

              </div>
            )}

          </div>{/* end right card */}
        </div>{/* end grid */}
      </div>{/* end centered section */}

      {/* â”€â”€ Unverified / Pending account overlay modal â”€â”€ */}
      {unverifiedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border p-8 flex flex-col items-center text-center">
            <button type="button" onClick={() => setUnverifiedModal(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-5", unverifiedModal.type === "not_verified" ? "bg-amber-100" : "bg-blue-50")}>
              {unverifiedModal.type === "not_verified" ? <Mail className="w-8 h-8 text-amber-500" /> : <CheckCircle2 className="w-8 h-8 text-blue-500" />}
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {unverifiedModal.type === "not_verified" ? t("auth.emailNotVerifiedTitle") : t("auth.accountPendingApprovalTitle")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-1">
              {unverifiedModal.type === "not_verified" ? t("auth.emailNotVerifiedBody") : t("auth.accountPendingApprovalBody")}
            </p>
            <p className="text-sm font-semibold text-foreground mb-4">{unverifiedModal.email}</p>
            <div className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 mb-5 text-left">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {unverifiedModal.type === "not_verified" ? t("auth.emailNotVerifiedHelp") : t("auth.accountPendingApprovalHelp")}
              </p>
            </div>
            {unverifiedModal.type === "not_verified" && (
              <Button type="button" className="w-full h-11 font-semibold bg-primary hover:bg-primary/90 gap-2 mb-3" disabled={isResendingLink}
                onClick={async () => {
                  setIsResendingLink(true);
                  try { await resendVerificationLink({ email: unverifiedModal.email }).unwrap(); toastSuccess(t("auth.verificationEmailResentInbox")); }
                  catch (err: any) { toastError(err?.data?.message || t("auth.failedToResend")); }
                  finally { setIsResendingLink(false); }
                }}>
                {isResendingLink ? <><Loader2 className="w-4 h-4 animate-spin" />{t("auth.sending")}</> : <><RefreshCw className="w-4 h-4" />{t("auth.resendVerificationEmail")}</>}
              </Button>
            )}
            <Button type="button" variant="outline" className="w-full h-10 text-sm mb-3" onClick={() => { setUnverifiedModal(null); navigate("/marketplace"); }}>
              {t("auth.browseWhileWaiting")}
            </Button>
            <button type="button" className="text-xs text-muted-foreground hover:text-foreground underline" onClick={() => setUnverifiedModal(null)}>
              {t("auth.close")}
            </button>
          </div>
        </div>
      )}

    </div>
    </>
  );
};

export default Auth;

