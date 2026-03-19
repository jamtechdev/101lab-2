// @ts-nocheck
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate, useSearchParams } from "react-router-dom";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import {
  ArrowLeft,
  Lock,
  Building2,
  Eye,
  EyeOff,
  CheckCircle2,
  ShoppingCart,
  Store,
  Upload,
  X,
  Phone,
  FileText,
  MapPin,
  HelpCircle,
  Wrench,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

import {
  useLoginMutation,
  useSignupMutation,
} from "@/rtk/slices/apiSlice";

import {
  toastSuccess,
  toastError,
  toastWarning,
} from "../../helper/toasterNotification";
import { showSuccess, showError } from "../../helper/sweetAlertNotification";
import { getSocket } from "@/services/socket";

type UserType = "buyer" | "seller" | "admin";
type AuthMode = "signup" | "signin";

interface SignupForm {
  title: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirm_password: string;
  role?: string;
  company?: string;
  company_tax_id?: string;
  tax_document?: File[];
  street_address?: string;
  city?: string;
  district_state?: string;
  postal_code?: string;
  country?: string;
  waste_disposal_permit?: File[];
  business_reg_certificate?: File[];
}

const TITLE_OPTIONS = [
  { value: "Mr", label: "Mr." },
  { value: "Mrs", label: "Mrs." },
  { value: "Ms", label: "Ms." },
  { value: "Dr", label: "Dr." },
];

const COUNTRY_OPTIONS = [
  { value: "VN", label: "Vietnam" },
  { value: "TH", label: "Thailand" },
  { value: "MY", label: "Malaysia" },
  { value: "SG", label: "Singapore" },
  { value: "ID", label: "Indonesia" },
  { value: "PH", label: "Philippines" },
  { value: "MM", label: "Myanmar" },
  { value: "KH", label: "Cambodia" },
  { value: "LA", label: "Laos" },
  { value: "BN", label: "Brunei" },
  { value: "CN", label: "China" },
  { value: "TW", label: "Taiwan" },
  { value: "JP", label: "Japan" },
  { value: "KR", label: "South Korea" },
  { value: "IN", label: "India" },
  { value: "AU", label: "Australia" },
  { value: "NZ", label: "New Zealand" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "CA", label: "Canada" },
  { value: "OTHER", label: "Other" },
];

const EQUIPMENT_CATEGORIES = [
  { slug: "machining-centers", name: "Machining Centers" },
  { slug: "lathes", name: "Lathes (CNC & Conventional)" },
  { slug: "milling-machines", name: "Milling Machines" },
  { slug: "boring-drilling", name: "Boring & Drilling Machines" },
  { slug: "grinding-finishing", name: "Grinding & Finishing" },
  { slug: "sawing-machines", name: "Sawing Machines" },
  { slug: "press-brakes-shears", name: "Press Brakes & Shears" },
  { slug: "punching-forging", name: "Punching & Forging" },
  { slug: "laser-plasma-cutting", name: "Laser & Plasma Cutting" },
  { slug: "welding-equipment", name: "Welding Equipment" },
  { slug: "scrap", name: "Scrap" },
];

// 3 signup steps: Account → Company Info → Preview
const SIGNUP_STEPS = [
  { label: "Account", Icon: Lock },
  { label: "Company Info", Icon: Building2 },
  { label: "Preview", Icon: Eye },
];

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [userType, setUserType] = useState<UserType>("buyer");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [signupStep, setSignupStep] = useState(1); // 1, 2, 3
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [formData, setFormData] = useState<SignupForm>({
    title: "",
    first_name: "",
    last_name: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    company: "",
    company_tax_id: "",
    street_address: "",
    city: "",
    district_state: "",
    postal_code: "",
    country: "",
  });

  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [signup, { isLoading: isSignupLoading }] = useSignupMutation();
  const allowedTypes: UserType[] = ["buyer", "seller", "admin"];

  useEffect(() => {
    const type = searchParams.get("type") as UserType | null;
    if (!type || !allowedTypes.includes(type)) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("type", "buyer");
      setSearchParams(newParams, { replace: true });
      setUserType("buyer");
    } else {
      setUserType(type);
      if (type === "admin") setAuthMode("signin");
    }
  }, [searchParams]);

  const handleTypeSwitch = (type: UserType) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("type", type);
    setSearchParams(newParams, { replace: true });
    setUserType(type);
    setSignupStep(1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const fieldName = id.replace("signup-", "");
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) => password.length >= 6;

  const handleFileChange = (e, field) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024;
    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    const valid = files.filter(file => {
      if (!allowed.includes(file.type)) { toastWarning(`Invalid file type: ${file.name}`); return false; }
      if (file.size > maxSize) { toastWarning(`File too large (max 10MB): ${file.name}`); return false; }
      return true;
    });
    setFormData(prev => ({ ...prev, [field]: [...(prev[field] || []), ...valid] }));
  };

  const removeFile = (field: string, index: number) => {
    setFormData(prev => ({ ...prev, [field]: prev[field]?.filter((_, i) => i !== index) }));
  };

  const handleStep1Next = () => {
    if (!formData.first_name.trim()) { toastWarning("First name is required."); return; }
    if (!formData.last_name.trim()) { toastWarning("Last name is required."); return; }
    if (!validateEmail(formData.email)) { toastWarning("Please enter a valid email address."); return; }
    if (!validatePassword(formData.password)) { toastWarning("Password must be at least 6 characters."); return; }
    if (formData.password !== formData.confirm_password) { toastWarning("Passwords do not match."); return; }
    setSignupStep(2);
  };

  const handleStep2Next = () => {
    if (!formData.company?.trim()) { toastWarning("Company name is required."); return; }
    if (userType === "seller" && !formData.company_tax_id?.trim()) {
      toastWarning("Company Tax ID is required for sellers.");
      return;
    }
    if (!formData.street_address?.trim()) { toastWarning("Street address is required."); return; }
    if (!formData.city?.trim()) { toastWarning("City is required."); return; }
    if (!formData.country?.trim()) { toastWarning("Country is required."); return; }
    setSignupStep(3);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fullName = `${formData.first_name.trim()} ${formData.last_name.trim()}`;
    const formPayload = new FormData();
    // Only send fields the controller expects
    formPayload.append("name", fullName);
    formPayload.append("email", formData.email);
    formPayload.append("password", formData.password);
    formPayload.append("role", userType);
    formPayload.append("company", formData.company || "");
    formPayload.append("street_address", formData.street_address || "");
    formPayload.append("city", formData.city || "");
    formPayload.append("district_state", formData.district_state || "");
    formPayload.append("postal_code", formData.postal_code || "");
    formPayload.append("country", formData.country || "");
    if (formData.company_tax_id) formPayload.append("companyTaxIdNumber", formData.company_tax_id);
    formData.waste_disposal_permit?.forEach(f => formPayload.append("waste_disposal_permit", f));
    formData.business_reg_certificate?.forEach(f => formPayload.append("business_reg_certificate", f));

    try {
      const result = await signup(formPayload).unwrap();
      if (result?.success) {
        toastSuccess("Account created successfully.");
        await showSuccess("Welcome!", "Your account has been created successfully.");
        setFormData({ title: "", first_name: "", last_name: "", name: "", email: "", phone: "", password: "", confirm_password: "", company: "", company_tax_id: "", street_address: "", city: "", district_state: "", postal_code: "", country: "" });
        setSignupStep(1);
        setSelectedCategories([]);
        setAuthMode("signin");
      } else {
        toastError(result?.message || "Signup failed.");
      }
    } catch (err: any) {
      const message = err?.data?.message || err?.data?.data?.message || err?.message || "Something went wrong.";
      toastError(message);
      showError("Signup Failed", message);
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

  /* ── File Upload Zone ── */
  const FileUploadZone = ({ id, label, field, hint }: { id: string; label: string; field: string; hint?: string }) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-foreground">{label}
        {hint && <span className="ml-1 text-muted-foreground font-normal">({hint})</span>}
      </Label>
      <label
        htmlFor={id}
        className="flex flex-col items-center justify-center w-full py-4 rounded-lg border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
      >
        <Upload className="w-4 h-4 text-muted-foreground mb-1" />
        <span className="text-xs text-muted-foreground">Click to upload</span>
        <Input id={id} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="hidden" onChange={(e) => handleFileChange(e, field)} />
      </label>
      {formData[field]?.length > 0 && (
        <div className="space-y-1">
          {formData[field].map((file, idx) => (
            <div key={idx} className="flex items-center justify-between text-[11px] bg-muted rounded px-2.5 py-1.5">
              <span className="truncate max-w-[180px] font-mono">{file.name}</span>
              <button type="button" className="text-destructive ml-2" onClick={() => removeFile(field, idx)}>
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* ── Stepper (3 steps with circle icons) ── */
  const Stepper = () => {
    const progress = ((signupStep - 1) / (SIGNUP_STEPS.length - 1)) * 100;
    return (
      <div className="mb-8">
        {/* Circle icons row */}
        <div className="relative flex items-start justify-between mb-3">
          {/* connecting line */}
          <div className="absolute top-5 left-[10%] right-[10%] h-[2px] bg-border" />
          {SIGNUP_STEPS.map(({ label, Icon }, i) => {
            const step = i + 1;
            const isDone = step < signupStep;
            const isCurrent = step === signupStep;
            return (
              <div key={step} className="flex flex-col items-center relative z-10" style={{ width: "33.33%" }}>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isDone
                    ? "bg-primary border-primary text-primary-foreground"
                    : isCurrent
                    ? "bg-primary border-primary text-primary-foreground shadow-colored"
                    : "bg-background border-border text-muted-foreground"
                )}>
                  {isDone
                    ? <CheckCircle2 className="w-5 h-5" />
                    : <Icon className="w-4 h-4" />
                  }
                </div>
                <span className={cn(
                  "mt-2 text-xs text-center",
                  isCurrent ? "font-bold text-primary" : isDone ? "font-medium text-primary/70" : "text-muted-foreground"
                )}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
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
          {/* Language switcher — visible on all screen sizes, right-aligned */}
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

          {/* ── Auth mode switcher ── */}
          <div className="flex justify-center gap-1 mb-6">
            <button
              type="button"
              onClick={() => setAuthMode("signup")}
              className={cn(
                "px-5 py-1.5 text-sm font-medium transition-colors",
                authMode === "signup"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t("auth.createAccount")}
            </button>
            <span className="text-muted-foreground self-center">·</span>
            <button
              type="button"
              onClick={() => setAuthMode("signin")}
              className={cn(
                "px-5 py-1.5 text-sm font-medium transition-colors",
                authMode === "signin"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t("auth.signIn")}
            </button>
          </div>

          {/* ══ SIGN IN ══ */}
          {authMode === "signin" && (
            <div className="animate-fade-in">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-primary">{t("auth.welcomeBack")}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {userType === "buyer"
                    ? t("auth.signInToBuyer")
                    : userType === "admin"
                    ? t("auth.adminPortal")
                    : t("auth.signInToSeller")}
                </p>
              </div>
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email" className="text-sm font-medium text-foreground">
                    {t("auth.companyEmail")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="info@greenbidz.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-muted/30 border-border focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-password" className="text-sm font-medium text-foreground">
                    {t("auth.password")} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 bg-muted/30 border-border focus:border-primary pr-10"
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {userType !== "admin" && (
                  <div className="text-right">
                    <button type="button" className="text-xs text-primary hover:underline" onClick={() => navigate("/forgot-password")}>
                      {t("auth.forgotPassword")}
                    </button>
                  </div>
                )}
                <Button type="submit" className="w-full h-12 text-sm font-semibold bg-primary hover:bg-primary-light text-primary-foreground" disabled={isLoginLoading}>
                  {isLoginLoading ? t("auth.signingIn") : t("auth.loginButton")}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  {t("auth.noAccount")}{" "}
                  <button type="button" className="text-primary font-medium hover:underline" onClick={() => setAuthMode("signup")}>
                    {t("auth.createOne")}
                  </button>
                </p>
              </form>
            </div>
          )}

          {/* ══ SIGN UP ══ */}
          {authMode === "signup" && userType !== "admin" && (
            <div className="animate-fade-in">
              {/* Description */}
              <p className="text-sm text-muted-foreground text-center mb-6 max-w-xl mx-auto leading-relaxed">
                {userType === "buyer" ? t("auth.buyerSearchDesc") : t("auth.sellerRegisterDesc")}
              </p>

              {/* Stepper */}
              <Stepper />

              <form onSubmit={handleSignUp}>

                {/* ═══ STEP 1: Account Information ═══ */}
                {signupStep === 1 && (
                  <div className="space-y-5 animate-fade-in">
                    <h3 className="text-xl font-bold text-foreground">{t("auth.accountInformation")}</h3>

                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-first_name" className="text-sm font-medium text-foreground">
                          {t("auth.firstName")} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="signup-first_name"
                          value={formData.first_name}
                          onChange={handleChange}
                          className="h-12 bg-muted/30 border-border focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-last_name" className="text-sm font-medium text-foreground">
                          {t("auth.lastName")} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="signup-last_name"
                          value={formData.last_name}
                          onChange={handleChange}
                          className="h-12 bg-muted/30 border-border focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-email" className="text-sm font-medium text-foreground">
                        {t("auth.companyEmail")} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="info@greenbidz.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="h-12 bg-muted/30 border-border focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-phone" className="text-sm font-medium text-foreground">
                        {t("auth.phone")} <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex items-center h-12 px-3 bg-muted/30 border border-border rounded-md gap-2 text-sm text-muted-foreground shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="081234 56789"
                          value={formData.phone || ""}
                          onChange={handleChange}
                          className="h-12 bg-muted/30 border-border focus:border-primary flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password" className="text-sm font-medium text-foreground">
                        {t("auth.password")} <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Min. 6 characters"
                          value={formData.password}
                          onChange={handleChange}
                          className="h-12 bg-muted/30 border-border focus:border-primary pr-10"
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(v => !v)}>
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-confirm_password" className="text-sm font-medium text-foreground">
                        {t("auth.confirmPassword")} <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="signup-confirm_password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter your password"
                          value={formData.confirm_password}
                          onChange={handleChange}
                          className="h-12 bg-muted/30 border-border focus:border-primary pr-10"
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirmPassword(v => !v)}>
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {formData.confirm_password && formData.password !== formData.confirm_password && (
                        <p className="text-xs text-destructive">{t("auth.passwordsNoMatch")}</p>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <p className="text-sm text-muted-foreground">
                        {t("auth.haveAccount")}{" "}
                        <button type="button" className="text-primary font-medium hover:underline" onClick={() => setAuthMode("signin")}>
                          {t("auth.signIn")}
                        </button>
                      </p>
                      <Button
                        type="button"
                        onClick={handleStep1Next}
                        className="px-8 h-10 text-sm font-semibold bg-primary hover:bg-primary-light text-primary-foreground"
                      >
                        {t("auth.next")}
                      </Button>
                    </div>
                  </div>
                )}

                {/* ═══ STEP 2: Company Info ═══ */}
                {signupStep === 2 && (
                  <div className="space-y-5 animate-fade-in">
                    <h3 className="text-xl font-bold text-foreground">{t("auth.companyInformation")}</h3>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-company" className="text-sm font-medium text-foreground">
                        {t("auth.companyName")} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="signup-company"
                        value={formData.company || ""}
                        onChange={handleChange}
                        className="h-12 bg-muted/30 border-border focus:border-primary"
                      />
                    </div>

                    {userType === "seller" && (
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <Label htmlFor="signup-company_tax_id" className="text-sm font-medium text-foreground">
                              {t("auth.taxRegNumber")} <span className="text-destructive">*</span>
                            </Label>
                            <div className="group relative">
                              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-[10px] bg-foreground text-background rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                {t("auth.companyTaxIdRequired")}
                              </div>
                            </div>
                          </div>
                          <Input
                            id="signup-company_tax_id"
                            placeholder={t("auth.companyTaxIdPlaceholder")}
                            value={formData.company_tax_id || ""}
                            onChange={handleChange}
                            className="h-12 bg-muted/30 border-border focus:border-primary font-mono"
                          />
                        </div>
                        <FileUploadZone id="tax_document" label={t("auth.businessLicense")} field="tax_document" hint={t("auth.optional")} />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-street_address" className="text-sm font-medium text-foreground">
                        {t("auth.streetAddress")} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="signup-street_address"
                        value={formData.street_address || ""}
                        onChange={handleChange}
                        className="h-12 bg-muted/30 border-border focus:border-primary"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-city" className="text-sm font-medium text-foreground">
                          {t("auth.city")} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="signup-city"
                          value={formData.city || ""}
                          onChange={handleChange}
                          className="h-12 bg-muted/30 border-border focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-district_state" className="text-sm font-medium text-foreground">
                          {t("auth.state")}
                        </Label>
                        <Input
                          id="signup-district_state"
                          value={formData.district_state || ""}
                          onChange={handleChange}
                          className="h-12 bg-muted/30 border-border focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-postal_code" className="text-sm font-medium text-foreground">
                          {t("auth.postal")}
                        </Label>
                        <Input
                          id="signup-postal_code"
                          value={formData.postal_code || ""}
                          onChange={handleChange}
                          className="h-12 bg-muted/30 border-border focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-foreground">
                        {t("auth.country")} <span className="text-destructive">*</span>
                      </Label>
                      <Select value={formData.country || ""} onValueChange={(v) => setFormData(prev => ({ ...prev, country: v }))}>
                        <SelectTrigger className="h-12 bg-muted/30 border-border focus:border-primary">
                          <SelectValue placeholder={t("auth.country")} />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRY_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FileUploadZone id="waste_disposal_permit" label={t("auth.wasteDisposalPermit")} field="waste_disposal_permit" hint={t("auth.optional")} />
                      <FileUploadZone id="business_reg_certificate" label={t("auth.businessRegistration")} field="business_reg_certificate" hint={t("auth.optional")} />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <Button type="button" variant="outline" onClick={() => setSignupStep(1)} className="h-10 px-6">
                        ← {t("auth.back")}
                      </Button>
                      <Button
                        type="button"
                        onClick={handleStep2Next}
                        className="px-8 h-10 text-sm font-semibold bg-primary hover:bg-primary-light text-primary-foreground"
                      >
                        {t("auth.next")}
                      </Button>
                    </div>
                  </div>
                )}

                {/* ═══ STEP 3: Preview ═══ */}
                {signupStep === 3 && (
                  <div className="space-y-5 animate-fade-in">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{t("auth.previewSubmit")}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{t("auth.previewReview")}</p>
                    </div>

                    {/* Summary cards */}
                    <div className="rounded-lg border border-border bg-muted/20 divide-y divide-border">
                      <div className="px-5 py-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">{t("auth.account")}</p>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                          <div><span className="text-muted-foreground">{t("auth.name")}:</span> <span className="font-medium">{formData.first_name} {formData.last_name}</span></div>
                          <div><span className="text-muted-foreground">{t("auth.email")}:</span> <span className="font-medium">{formData.email}</span></div>
                          {formData.phone && <div><span className="text-muted-foreground">{t("auth.phone")}:</span> <span className="font-medium">{formData.phone}</span></div>}
                          <div><span className="text-muted-foreground">{t("auth.roleLabel")}:</span> <span className="font-medium capitalize">{t(`auth.${userType}`)}</span></div>
                        </div>
                      </div>
                      <div className="px-5 py-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">{t("auth.companyDetail")}</p>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                          <div><span className="text-muted-foreground">{t("auth.companyName")}:</span> <span className="font-medium">{formData.company}</span></div>
                          {formData.company_tax_id && <div><span className="text-muted-foreground">{t("auth.companyTaxId")}:</span> <span className="font-medium font-mono">{formData.company_tax_id}</span></div>}
                          <div className="col-span-2"><span className="text-muted-foreground">{t("auth.streetAddress")}:</span> <span className="font-medium">{[formData.street_address, formData.city, formData.country].filter(Boolean).join(", ")}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Interests */}
                    <div>
                      <p className="text-sm font-medium text-foreground mb-3">
                        {t("auth.equipmentInterests")} <span className="text-muted-foreground font-normal">({t("auth.optional")})</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {EQUIPMENT_CATEGORIES.map((cat) => {
                          const isSelected = selectedCategories.includes(cat.slug);
                          return (
                            <button
                              key={cat.slug}
                              type="button"
                              onClick={() => toggleCategory(cat.slug)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                                isSelected
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-border bg-background text-foreground hover:border-primary/40"
                              )}
                            >
                              <Wrench className="w-3 h-3" />
                              {cat.name}
                            </button>
                          );
                        })}
                      </div>
                      {selectedCategories.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">{selectedCategories.length} selected</p>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <Button type="button" variant="outline" onClick={() => setSignupStep(2)} className="h-10 px-6">
                        ← {t("auth.back")}
                      </Button>
                      <Button
                        type="submit"
                        className="px-8 h-10 text-sm font-bold bg-primary hover:bg-primary-light text-primary-foreground shadow-colored"
                        disabled={isSignupLoading}
                      >
                        {isSignupLoading ? t("auth.creatingAccount") : t("auth.completeRegistration")}
                      </Button>
                    </div>
                  </div>
                )}

              </form>
            </div>
          )}

        </div>
        </div>{/* end inner scroll content */}
      </div>{/* end right panel */}
    </div>
  );
};

export default Auth;
