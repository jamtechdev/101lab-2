// @ts-nocheck
import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useBatchCreateMutation, useBiddingCreateMutation } from "@/rtk/slices/productSlice";
import { useSignupWithLinkMutation } from "@/rtk/slices/apiSlice";
import { useLanguageAwareCategories } from "@/hooks/useLanguageAwareCategories";
import { SITE_TYPE } from "@/config/site";
import { SITE_NAME } from "@/config/branding";
import { CountrySelectItems, CountrySelect } from "@/components/common/CountrySelect";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Check } from "lucide-react";
import { useTranslation } from "react-i18next";   
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";
import toast from "react-hot-toast";
import logo from "@/assets/greenbidz_logo.png";
import {
  ImagePlus, Video, X, CheckCircle2,
  Home, LayoutDashboard, LogIn, UserPlus, Eye, EyeOff,
} from "lucide-react";
import axiosInstance from "@/rtk/api/axiosInstance";
import { useLoginModal } from "@/context/LoginModalContext";

// ─── helpers ────────────────────────────────────────────────────────────────

function isoDate(date: Date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function biddingDefaults() {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 45);
  return { start_date: isoDate(start), end_date: isoDate(end) };
}

const CONDITIONS = [
  { key: "new", tKey: "sellPage.conditionNew" },
  { key: "usedFunctional", tKey: "sellPage.conditionUsed" },
  { key: "forParts", tKey: "sellPage.conditionForParts" },
  { key: "wasteDisposal", tKey: "sellPage.conditionWaste" },
  { key: "demolitionRemoval", tKey: "sellPage.conditionDemolition" },
];

const OPERATION_STATUSES = [
  { key: "deinstalled", tKey: "sellPage.statusDeinstalled" },
  { key: "needDeinstall", tKey: "sellPage.statusNeedDeinstall" },
  { key: "collected", tKey: "sellPage.statusCollected" },
  { key: "other", tKey: "sellPage.statusOther" },
];

interface MediaFile {
  file: File;
  url: string;
  type: "image" | "video";
}

// ─── Shared header + footer wrapper for post-form screens ───────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* header */}
      <div className="bg-white border-b py-4 text-center shrink-0">
        <img src={logo} alt={SITE_NAME} className="h-10 mx-auto cursor-pointer" onClick={() => navigate("/")} />
      </div>
      {/* content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        {children}
      </div>
      {/* footer */}
      <footer className="bg-white border-t py-5 text-center text-xs text-muted-foreground shrink-0">
        © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
      </footer>
    </div>
  );
}

// ─── Auth gate screen ────────────────────────────────────────────────────────

const PHONE_CODES = [
  { code: "+86", label: "CN" }, { code: "+62", label: "ID" }, { code: "+91", label: "IN" },
  { code: "+60", label: "MY" }, { code: "+886", label: "TW" }, { code: "+66", label: "TH" },
  { code: "+81", label: "JP" }, { code: "+84", label: "VN" }, { code: "+65", label: "SG" },
  { code: "+82", label: "KR" }, { code: "+44", label: "GB" }, { code: "+1", label: "US" },
  { code: "+33", label: "FR" }, { code: "+49", label: "DE" }, { code: "+61", label: "AU" },
  { code: "+55", label: "BR" }, { code: "+31", label: "NL" }, { code: "+41", label: "CH" },
  { code: "+90", label: "TR" }, { code: "+20", label: "EG" }, { code: "+27", label: "ZA" },
];

function AuthGate({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { openLoginModal } = useLoginModal();
  const [signupWithLink] = useSignupWithLinkMutation();
  const { data: labCategories = [] } = useLanguageAwareCategories();

  type View = "choice" | "register" | "check_email";
  const [view, setView] = useState<View>("choice");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [interestOpen, setInterestOpen] = useState(false);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);
  const interestRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "",
    password: "", confirmPassword: "",
    phoneCode: "+886", phone: "",
    company: "", country: "",
  });
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const toggleInterest = (slug: string) =>
    setSelectedInterests(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);

  // close interest dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (interestRef.current && !interestRef.current.contains(e.target as Node))
        setInterestOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim()) { toast.error("First name is required."); return; }
    if (!form.last_name.trim()) { toast.error("Last name is required."); return; }
    if (!form.email) { toast.error("Email is required."); return; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match."); return; }
    setIsSubmitting(true);
    try {
      // Register — backend now returns userId directly, no login needed
      const signupRes = await signupWithLink({
        email: form.email, password: form.password, role: "seller",
        first_name: form.first_name, last_name: form.last_name,
        phone: form.phone ? `${form.phoneCode}${form.phone}` : "",
        company: form.company, country: form.country,
        interests: selectedInterests,
      }).unwrap();

      const userId = signupRes?.data?.userId;
      if (!userId) throw new Error("Registration succeeded but no user ID was returned.");

      // Store just enough for publish() to run — no token, no real session
      localStorage.setItem("userId", userId.toString());
      localStorage.setItem("userRole", "seller");
      localStorage.setItem("userName", `${form.first_name} ${form.last_name}`);
      localStorage.setItem("companyName", form.company || "");
      // Flag so publish() cleans all this up on completion
      localStorage.setItem("sellRegistrationSession", "1");

      // Publish immediately
      onLoginSuccess();
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || "";
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exists")) {
        toast.error("An account with this email already exists. Please log in instead.");
        setView("choice");
      } else {
        toast.error(msg || "Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = () => openLoginModal({ portalType: "seller", onSuccess: onLoginSuccess });

  const inputCls = "h-14 w-full rounded-2xl border border-gray-200 bg-white px-5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100";
  const labelCls = "mb-2 block text-base font-bold text-gray-900";

  // ── registered success ─────────────────────────────────────────────────────
  if (view === "check_email") {
    return (
      <PageShell>
        <div className="w-full max-w-lg bg-white border rounded-2xl p-10 text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-11 h-11 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold">Account Created!</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your account has been created. Please log in to publish your listing and access your dashboard.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Button className="bg-green-600 hover:bg-green-700 text-white w-full" onClick={() => navigate("/auth?mode=signin&type=seller")}>
              <LogIn className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── register form ──────────────────────────────────────────────────────────
  if (view === "register") {
    return (
      <PageShell>
        <div className="w-full max-w-7xl">
          <div className="bg-blue-50 border border-blue-200 rounded px-5 py-3 text-sm text-blue-800 mb-5">
            {t("sellPage.authBanner")}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── Registration form ── */}
            <div className="bg-white border rounded-2xl p-8">
              <p className="text-sm font-extrabold uppercase tracking-wide text-primary mb-1">Create Account</p>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Register as a Seller</h2>

              <form onSubmit={handleRegisterSubmit} className="grid gap-5 sm:grid-cols-2">
                {/* First Name */}
                <label className="block">
                  <span className={labelCls}><span className="text-destructive mr-1">*</span>First Name</span>
                  <input className={inputCls} placeholder="First Name" value={form.first_name} onChange={setF("first_name")} required />
                </label>

                {/* Last Name */}
                <label className="block">
                  <span className={labelCls}><span className="text-destructive mr-1">*</span>Last Name</span>
                  <input className={inputCls} placeholder="Last Name" value={form.last_name} onChange={setF("last_name")} required />
                </label>

                {/* Email */}
                <label className="block sm:col-span-2">
                  <span className={labelCls}><span className="text-destructive mr-1">*</span>Email</span>
                  <input type="email" className={inputCls} placeholder="name@company.com" value={form.email} onChange={setF("email")} required />
                </label>

                {/* Phone */}
                <label className="block">
                  <span className={labelCls}><span className="text-destructive mr-1">*</span>Phone Number</span>
                  <div className="flex h-14 rounded-2xl border border-gray-200 bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 overflow-hidden">
                    <select
                      value={form.phoneCode}
                      onChange={e => setForm(p => ({ ...p, phoneCode: e.target.value }))}
                      className="h-full pl-3 pr-1 text-sm bg-muted border-r border-input text-foreground focus:outline-none cursor-pointer shrink-0"
                    >
                      {PHONE_CODES.map(({ code, label }) => (
                        <option key={code} value={code}>{label} {code}</option>
                      ))}
                    </select>
                    <input type="tel" placeholder="555 000 0000" value={form.phone} onChange={setF("phone")}
                      className="flex-1 h-full px-4 text-sm font-medium bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground/55" />
                  </div>
                </label>

                {/* Company */}
                <label className="block">
                  <span className={labelCls}><span className="text-destructive mr-1">*</span>Company Name</span>
                  <input className={inputCls} placeholder="Your company" value={form.company} onChange={setF("company")} />
                </label>

                {/* Country */}
                <label className="block">
                  <span className={labelCls}><span className="text-destructive mr-1">*</span>Country</span>
                  <CountrySelect
                    value={form.country}
                    onChange={v => setForm(p => ({ ...p, country: v }))}
                    className="h-14 w-full rounded-2xl border border-gray-200 bg-white px-5 text-sm"
                  />
                </label>

                {/* Equipment Interest */}
                <div className="block" ref={interestRef}>
                  <span className={labelCls}><span className="text-destructive mr-1">*</span>Equipment Interest</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setInterestOpen(v => !v)}
                      className={cn(
                        "w-full h-14 px-5 rounded-2xl border border-gray-200 bg-white text-sm flex items-center justify-between transition-all",
                        interestOpen ? "border-indigo-500 ring-2 ring-indigo-100" : "hover:border-gray-300"
                      )}
                    >
                      <span className={selectedInterests.length === 0 ? "text-muted-foreground/55" : "text-foreground"}>
                        {selectedInterests.length === 0 ? "Select category" : `${selectedInterests.length} selected`}
                      </span>
                      <ChevronDown className={cn("w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ml-2", interestOpen && "rotate-180")} />
                    </button>
                    {interestOpen && (
                      <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-border bg-background shadow-xl max-h-64 overflow-y-auto">
                        {labCategories.map((cat: any) => {
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
                                  {cat.subcategories.map((sub: any) => {
                                    const subSel = selectedInterests.includes(sub.slug);
                                    return (
                                      <button key={sub.slug} type="button" onClick={() => toggleInterest(sub.slug)}
                                        className="flex items-center gap-2 w-full px-5 py-2 text-xs hover:bg-muted/50 transition-colors text-left border-b border-border/40 last:border-0">
                                        <div className={cn("w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center", subSel ? "bg-primary border-primary" : "border-border")}>
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
                  <span className={labelCls}><span className="text-destructive mr-1">*</span>Password</span>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} placeholder="Enter password"
                      value={form.password} onChange={setF("password")} required
                      className={inputCls + " pr-14"} />
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(v => !v)}>
                      {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <span className="mt-1 block text-xs text-muted-foreground">At least 6 characters</span>
                </label>

                {/* Confirm Password */}
                <label className="block sm:col-span-2">
                  <span className={labelCls}><span className="text-destructive mr-1">*</span>Confirm Password</span>
                  <div className="relative">
                    <input type={showConfirmPw ? "text" : "password"} placeholder="Confirm password"
                      value={form.confirmPassword} onChange={setF("confirmPassword")} required
                      className={inputCls + " pr-14"} />
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirmPw(v => !v)}>
                      {showConfirmPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </label>

                {/* Seller note */}
                <div className="sm:col-span-2 flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-4">
                  <UserPlus className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Registering as a Seller</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Your listing will go live after admin approval.</p>
                  </div>
                </div>

                {/* Submit */}
                <button type="submit" disabled={isSubmitting}
                  className="sm:col-span-2 w-full rounded-2xl px-6 py-4 text-base font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, hsl(215,60%,18%), hsl(180,65%,40%))" }}>
                  {isSubmitting
                    ? <span className="flex items-center justify-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />Creating Account…</span>
                    : "Create Account"
                  }
                </button>
              </form>

              <button className="mt-4 text-xs text-muted-foreground hover:underline" onClick={() => setView("choice")}>
                ← Back
              </button>
            </div>

            {/* ── Login panel ── */}
            <div className="bg-white border rounded-2xl p-8 flex flex-col gap-4">
              <h2 className="text-2xl font-bold">{t("sellPage.login")}</h2>
              <p className="text-muted-foreground text-sm">{t("sellPage.loginDesc")}</p>
              <Button className="bg-green-600 hover:bg-green-700 text-white w-fit" onClick={handleLogin}>
                <LogIn className="h-4 w-4 mr-2" />
                {t("sellPage.addTheMachine")}
              </Button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── choice view ────────────────────────────────────────────────────────────
  return (
    <PageShell>
      <div className="w-full max-w-4xl space-y-5">
        <div className="bg-blue-50 border border-blue-200 rounded px-5 py-3 text-sm text-blue-800">
          {t("sellPage.authBanner")}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-2xl p-8 flex flex-col gap-4">
            <h2 className="text-2xl font-bold">{t("sellPage.newMember")}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("sellPage.newMemberDesc", { siteName: SITE_NAME })}
            </p>
            <Button variant="outline" className="w-fit" onClick={() => setView("register")}>
              <UserPlus className="h-4 w-4 mr-2" />
              {t("sellPage.register")}
            </Button>
          </div>
          <div className="bg-white border rounded-2xl p-8 flex flex-col gap-4">
            <h2 className="text-2xl font-bold">{t("sellPage.login")}</h2>
            <p className="text-muted-foreground text-sm">{t("sellPage.loginDesc")}</p>
            <Button className="bg-green-600 hover:bg-green-700 text-white w-fit" onClick={handleLogin}>
              <LogIn className="h-4 w-4 mr-2" />
              {t("sellPage.addTheMachine")}
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ─── Not-seller screen ───────────────────────────────────────────────────────

function NotSellerScreen({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <PageShell>
      <div className="w-full max-w-xl bg-white border rounded p-10 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
          <LayoutDashboard className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold">{t("sellPage.notSellerTitle")}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">{t("sellPage.notSellerDesc")}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => navigate("/dashboard")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            {t("sellPage.goToDashboard")}
          </Button>
          <Button variant="outline" onClick={onClose}>{t("sellPage.maybeLater")}</Button>
        </div>
      </div>
    </PageShell>
  );
}

// ─── Thank-you screen ───────────────────────────────────────────────────────

function ThankYouPublish({ onGoToDashboard }: { onGoToDashboard: () => void }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <PageShell>
      <div className="w-full max-w-2xl bg-white border rounded p-10 text-center space-y-6">
        {/* icon */}
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-11 h-11 text-green-600" />
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">{t("sellPage.publishedTitle")}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{t("sellPage.publishedDesc")}</p>
        </div>

        {/* steps */}
        <div className="bg-gray-50 border rounded p-5 text-left space-y-3">
          {["publishedStep1", "publishedStep2", "publishedStep3"].map((key, i) => (
            <div key={key} className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-muted-foreground">{t(`sellPage.${key}`)}</span>
            </div>
          ))}
        </div>

        {/* actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={onGoToDashboard}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            {t("sellPage.goToDashboardBtn")}
          </Button>
          <Button variant="outline" onClick={() => navigate("/")}>
            <Home className="mr-2 h-4 w-4" />
            {t("sellPage.backToHome")}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

type Screen = "form" | "auth" | "notSeller" | "done";

const DRAFT_KEY = "sellDraft";

function loadDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null") ?? {}; } catch { return {}; }
}

export default function PublicSellPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { openLoginModal } = useLoginModal();

  const [batchCreate] = useBatchCreateMutation();
  const [biddingCreate] = useBiddingCreateMutation();
  const { data: catData } = useLanguageAwareCategories();
  const lang = localStorage.getItem("language") || "en";

  // ── form state (lazy-initialised from draft once on mount) ────────────────
  const [title, setTitle] = useState(() => loadDraft().title ?? "");
  const [parentCategory, setParentCategory] = useState(() => loadDraft().parentCategory ?? "");
  const [subCategory, setSubCategory] = useState(() => loadDraft().subCategory ?? "");
  const [subCategoryName, setSubCategoryName] = useState(() => loadDraft().subCategoryName ?? "");
  const [description, setDescription] = useState(() => loadDraft().description ?? "");
  const [manufacturer, setManufacturer] = useState(() => loadDraft().manufacturer ?? "");
  const [model, setModel] = useState(() => loadDraft().model ?? "");
  const [condition, setCondition] = useState<string[]>(() => loadDraft().condition ?? []);
  const [operationStatus, setOperationStatus] = useState<string[]>(() => loadDraft().operationStatus ?? []);
  const [country, setCountry] = useState(() => loadDraft().country ?? "");
  const [address, setAddress] = useState(() => loadDraft().address ?? "");
  const [quantity, setQuantity] = useState(() => loadDraft().quantity ?? 1);
  const [estimatedValue, setEstimatedValue] = useState(() => loadDraft().estimatedValue ?? "");
  const [currency, setCurrency] = useState<"TWD" | "USD">(() => loadDraft().currency ?? "USD");
  const [enableBuyNow, setEnableBuyNow] = useState(() => loadDraft().enableBuyNow ?? true);
  const [pricePerUnit, setPricePerUnit] = useState(() => loadDraft().pricePerUnit ?? "");
  const [media, setMedia] = useState<MediaFile[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // ── ui state ───────────────────────────────────────────────────────────────
  const [screen, setScreen] = useState<Screen>("form");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── helper: save current form to localStorage ──────────────────────────────
  const saveDraft = useCallback(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      title, parentCategory, subCategory, subCategoryName,
      description, manufacturer, model, condition, operationStatus,
      country, address, quantity, estimatedValue, currency, enableBuyNow, pricePerUnit,
    }));
  }, [title, parentCategory, subCategory, subCategoryName, description, manufacturer, model,
      condition, operationStatus, country, address, quantity, estimatedValue, currency, enableBuyNow, pricePerUnit]);

  // ── categories ─────────────────────────────────────────────────────────────
  const parents = catData ?? [];
  const children = (catData?.find((c: any) => c.slug === parentCategory)?.subcategories) ?? [];

  // ── media handlers ─────────────────────────────────────────────────────────
  const handleMedia = (files: FileList | null, type: "image" | "video") => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      setMedia((prev) => [...prev, { file, url, type }]);
    });
  };

  const removeMedia = (idx: number) => {
    setMedia((prev) => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // ── validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required";
    if (!parentCategory) e.category = "Please select a category";
    if (!subCategory) e.category = "Please select a sub-category";
    if (!description.trim()) e.description = "Description is required";
    if (condition.length === 0) e.condition = "Select at least one condition";
    if (operationStatus.length === 0) e.operationStatus = "Select at least one operation status";
    if (!country) e.country = "Country is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── reset all form fields and draft (only call on success) ────────────────
  const resetForm = useCallback(() => {
    setMedia(prev => {
      prev.forEach(m => URL.revokeObjectURL(m.url));
      return [];
    });
    setTitle("");
    setParentCategory("");
    setSubCategory("");
    setSubCategoryName("");
    setDescription("");
    setManufacturer("");
    setModel("");
    setCondition([]);
    setOperationStatus([]);
    setCountry("");
    setAddress("");
    setQuantity(1);
    setEstimatedValue("");
    setCurrency("USD");
    setEnableBuyNow(true);
    setPricePerUnit("");
    setErrors({});
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  // ── publish (called after auth confirmed) ──────────────────────────────────
  // Edge case keys stored in localStorage:
  //   sellPendingProductId — product created but batch failed → skip product on retry
  //   sellPublishing       — tab was closed mid-publish → resume on next mount
  const isPublishingRef = useRef(false); // #1 prevent duplicate calls on refresh

  const publish = useCallback(async () => {
    // Guard: prevent concurrent/duplicate publish calls
    if (isPublishingRef.current) return;

    const userId = localStorage.getItem("userId");
    const role   = localStorage.getItem("userRole");

    if (!userId) { setScreen("auth"); return; }
    // New sellers registered via sell page may not have role set yet — treat as seller
    if (role && role !== "seller") { setScreen("notSeller"); return; }

    // Registration-session users have no token — they use userId only to publish
    const isRegSession = localStorage.getItem("sellRegistrationSession") === "1";
    if (!isRegSession) {
      const hasToken =
        !!localStorage.getItem("accessToken") ||
        document.cookie.includes("accessToken");
      if (!hasToken) {
        toast.error("Your session has expired. Please log in again.");
        setScreen("auth");
        return;
      }
    }

    // Client-side file size check (max 10 MB per file)
    const oversized = media.filter(m => m.file.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error(`${oversized.length} file(s) exceed 10 MB. Please remove them before publishing.`);
      return;
    }

    isPublishingRef.current = true;
    setLoading(true);

    // #1 Mark in-progress so a page refresh can detect and resume
    localStorage.setItem("sellPublishing", "1");

    try {
      // #6 If product was already created (batch failed last time), skip product step
      let productId = localStorage.getItem("sellPendingProductId");

      if (!productId) {
        const formData = new FormData();
        formData.append("product_title", title);
        formData.append("product_content", description);
        formData.append("product_type", "simple");
        formData.append("product_category_ids", subCategory);
        if (manufacturer) formData.append("manufacturer", manufacturer);
        if (model) formData.append("model", model);
        formData.append("category_name", subCategoryName);
        formData.append("seller_name", localStorage.getItem("userName") || "");
        formData.append("seller_company", localStorage.getItem("companyName") || "");
        formData.append("post_author_id", userId);
        formData.append("steps", "1");
        formData.append("quantity", String(quantity));
        formData.append("location[]", address ? `${address}, ${country}` : country);
        formData.append("country", country);
        condition.forEach((c) => formData.append("item_condition[]", c));
        operationStatus.forEach((s) => formData.append("operation_status[]", s));
        formData.append("sellerVisible", "true");
        formData.append("replacement_cost_per_unit", "");
        formData.append("weight_per_unit", "");
        formData.append("price_now_enabled", enableBuyNow ? "1" : "0");
        formData.append("price_format", enableBuyNow ? "buyNow" : "offer");
        formData.append("price_currency", currency);
        formData.append("price_per_unit", enableBuyNow && pricePerUnit ? pricePerUnit : "");
        formData.append("visibility", "PUBLIC");
        ["101it.co", "greenbidz.com"].forEach((site) => formData.append("allowed_sites[]", site));
        media.forEach((m) => {
          if (m.type === "image") formData.append("images", m.file);
          else formData.append("videos", m.file);
        });

        const baseURL = import.meta.env.VITE_PRODUCTION_URL;
        // #7 Reduce timeout to 60s and show user-friendly message
        const productRes = await axiosInstance.post(
          `${baseURL}wp/create-product-direct?lang=${lang}&type=${SITE_TYPE}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              "x-platform": "LabGreenbidz",
              "x-system-key": import.meta.env.VITE_X_SYSTEM_KEY || "",
            },
            timeout: 60000,
          }
        );

        if (!productRes?.data?.success)
          throw new Error(productRes?.data?.message || "Failed to create product");

        productId = String(productRes?.data?.data?.product_id);
        // #6 Save productId so batch retry doesn't recreate the product
        localStorage.setItem("sellPendingProductId", productId);
      }

      // ── Step 2: Batch creation ─────────────────────────────────────────────
      // #6 If batch was already created (bidding failed last time), skip batch step
      let batchId = localStorage.getItem("sellPendingBatchId")
        ? Number(localStorage.getItem("sellPendingBatchId"))
        : null;

      if (!batchId) {
        const batchRes = await batchCreate({
          productIds: [Number(productId)],
          sellerId: userId,
          visibility: "PUBLIC",
          type: SITE_TYPE,
          country,
        }).unwrap();

        if (!batchRes?.success)
          throw new Error(batchRes?.message || "Failed to create batch");

        batchId = batchRes?.data?.batch_id;
        // Save so bidding retry doesn't recreate the batch
        localStorage.setItem("sellPendingBatchId", String(batchId));
      }

      // ── Step 3: Bidding creation ───────────────────────────────────────────
      const { start_date, end_date } = biddingDefaults();
      const biddingRes = await biddingCreate({
        batch_id: batchId,
        type: enableBuyNow ? "fixed_price" : "make_offer",
        start_date,
        end_date,
        target_price: enableBuyNow && pricePerUnit ? String(pricePerUnit) : "0",
        currency,
        isAuction: false,
        enableBidding: true,
        taxInclusive: true,
        allowWholePrice: true,
      }).unwrap();

      if (!biddingRes?.success)
        throw new Error(biddingRes?.message || "Failed to set up bidding");

      // All done — clean up all temporary publish state
      localStorage.removeItem("sellPendingProductId");
      localStorage.removeItem("sellPendingBatchId");
      localStorage.removeItem("sellPublishing");
      // If session was created by the registration flow (not a real login),
      // clear auth so a back/refresh doesn't try to re-publish with stale data.
      if (localStorage.getItem("sellRegistrationSession") === "1") {
        localStorage.removeItem("sellRegistrationSession");
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userName");
        localStorage.removeItem("companyName");
        window.dispatchEvent(new Event("auth-changed"));
      }
      resetForm();
      setScreen("done");

    } catch (err: any) {
      const msg = err?.message || err?.data?.message || "";
      const isRegSession = localStorage.getItem("sellRegistrationSession") === "1";

      // Always clean up the reg-session on any error — it cannot be resumed
      // because media files are held in React state and lost on refresh
      if (isRegSession) {
        localStorage.removeItem("sellRegistrationSession");
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
        localStorage.removeItem("companyName");
        window.dispatchEvent(new Event("auth-changed"));
      }

      if (err?.response?.status === 401 || msg.toLowerCase().includes("unauthorized")) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        toast.error("Session expired. Please log in again to publish.");
        setScreen("auth");
      } else if (err?.code === "ECONNABORTED" || msg.toLowerCase().includes("timeout")) {
        toast.error("Upload timed out. Check your connection and try again.");
      } else {
        toast.error(msg || "Something went wrong. Please try again.");
      }
      localStorage.removeItem("sellPublishing");
    } finally {
      isPublishingRef.current = false;
      setLoading(false);
    }
  }, [title, description, manufacturer, model, subCategory, subCategoryName, quantity, address, country, condition, operationStatus, enableBuyNow, currency, pricePerUnit, media, lang, batchCreate, biddingCreate, resetForm]);

  // On mount: if no sessionStorage flag the tab was previously closed → clear stale draft.
  // sessionStorage is wiped automatically by the browser when the tab closes.
  useEffect(() => {
    const tabWasOpen = sessionStorage.getItem("sellTabOpen");
    if (!tabWasOpen) {
      // Fresh tab — clear any leftover localStorage from a previous closed session
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem("sellPublishing");
      localStorage.removeItem("sellPendingProductId");
      localStorage.removeItem("sellPendingBatchId");
      localStorage.removeItem("sellRegistrationSession");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userName");
      localStorage.removeItem("companyName");
    }
    sessionStorage.setItem("sellTabOpen", "1");
  }, []);

  // ── auto-publish when returning with ?publish=1 ────────────────────────────
  const publishRef = useRef(publish);
  useEffect(() => { publishRef.current = publish; }, [publish]);
  useEffect(() => {
    // #4 Auto-publish if returning via ?publish=1
    if (searchParams.get("publish") === "1") {
      publishRef.current();
      return;
    }
    // Resume interrupted publish — tab was closed mid-publish
    if (localStorage.getItem("sellPublishing") === "1") {
      const userId = localStorage.getItem("userId");
      const isRegSession = localStorage.getItem("sellRegistrationSession") === "1";
      const productAlreadyCreated = !!localStorage.getItem("sellPendingProductId");

      if (isRegSession && !productAlreadyCreated) {
        // Reg-session + product not yet created = media files are gone from memory,
        // cannot resume step 1. Clear everything and let user re-submit the form.
        localStorage.removeItem("sellPublishing");
        localStorage.removeItem("sellRegistrationSession");
        localStorage.removeItem("sellPendingProductId");
        localStorage.removeItem("sellPendingBatchId");
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
        localStorage.removeItem("companyName");
        window.dispatchEvent(new Event("auth-changed"));
        toast.error("Your session was interrupted. Please fill the form and try again.");
      } else if (userId) {
        // Either a real logged-in user, or reg-session where product was already created
        // (batch/bid failed) — safe to resume since product step will be skipped
        toast("Resuming your previous submission…", { icon: "🔄" });
        setTimeout(() => publishRef.current(), 800);
      } else {
        // No userId at all — clear stale flag
        localStorage.removeItem("sellPublishing");
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // #3 Handle login modal dismissed without logging in — show a toast nudge
  const handleLoginModalOpen = useCallback((opts: any) => {
    openLoginModal({
      ...opts,
      onSuccess: opts.onSuccess,
    });
    // After 500ms check if modal was dismissed (user didn't log in)
    // RTK openLoginModal doesn't expose onDismiss, so we use a small nudge toast
  }, [openLoginModal]);

  // ── form submit: validate → save draft → auth gate or publish ────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const userId = localStorage.getItem("userId");
    if (!userId) {
      saveDraft();
      setScreen("auth");
      return;
    }

    publish();
  };

  // ── auth gate: login succeeded → publish ───────────────────────────────────
  const handleLoginSuccess = useCallback(() => {
    publish();
  }, [publish]);

  // Browser back from auth screen — if draft exists and screen is auth, go back to form
  useEffect(() => {
    const onPopState = () => {
      if (screen === "auth" && localStorage.getItem(DRAFT_KEY)) {
        setScreen("form");
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [screen]);

  // Warn user before refresh/tab close if publishing is in progress or form has data
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      const isPublishing = loading || localStorage.getItem("sellPublishing") === "1";
      const hasDraft = !!title.trim() || !!localStorage.getItem(DRAFT_KEY);
      if (isPublishing || hasDraft) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    // pagehide fires only when user actually confirmed leave / closed the tab.
    // Clear all sell-related localStorage so next visit starts fresh.
    const onPageHide = () => {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem("sellPublishing");
      localStorage.removeItem("sellPendingProductId");
      localStorage.removeItem("sellPendingBatchId");
      localStorage.removeItem("sellRegistrationSession");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userName");
      localStorage.removeItem("companyName");
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [loading, title]);

  // ─── screens ──────────────────────────────────────────────────────────────

  if (loading)
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Spinning logo */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
            <img src={logo} alt={SITE_NAME} className="absolute inset-0 m-auto h-10 w-10 rounded-lg" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">Publishing your listing…</p>
            <p className="text-sm text-muted-foreground mt-1">Please wait, this may take a few seconds.</p>
          </div>
          {/* Progress bar */}
          <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-[progress_3s_ease-in-out_infinite]" style={{ width: "70%" }} />
          </div>
        </div>
      </PageShell>
    );

  if (screen === "auth")
    return <AuthGate onLoginSuccess={handleLoginSuccess} />;

  if (screen === "notSeller")
    return <NotSellerScreen onClose={() => setScreen("form")} />;

  if (screen === "done")
    return <ThankYouPublish onGoToDashboard={() => navigate("/dashboard")} />;

  // ─── form screen ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-800 text-white py-2 px-4 text-center text-sm">
        <div className="flex items-center justify-center gap-2">
          <span className="font-semibold underline">{t("sellPage.trustpilotBar")}</span>
          <span className="text-green-400">★★★★★</span>
        </div>
      </header>

      {/* Logo bar */}
      <div className="bg-white border-b py-4 text-center">
        <img src={logo} alt={SITE_NAME} className="h-10 mx-auto cursor-pointer" onClick={() => navigate("/")} />
      </div>


      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8 items-start">

        {/* ── Left sidebar ── */}
        <aside className="hidden lg:flex flex-col gap-6 w-72 shrink-0">
          {/* Contact box */}
          <div className="bg-white border rounded p-5">
            <p className="font-semibold text-sm mb-3">{t("sellPage.doYouHaveQuestions")}</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">💬</div>
              <span className="text-sm text-muted-foreground">{t("sellPage.teamHere")}</span>
            </div>
            <a
              href="mailto:support@greenbidz.com"
              className="inline-block border border-primary text-primary text-sm px-4 py-1.5 rounded hover:bg-primary/5 transition-colors"
            >
              {t("sellPage.contactUs")}
            </a>
          </div>

          {/* Sell with us */}
          <div>
            <p className="font-bold text-base mb-3">{t("sellPage.sellWithUs")}</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                t("sellPage.reach"),
                t("sellPage.sellFaster"),
                t("sellPage.noFees"),
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✔</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Trustpilot widget */}
          <div className="bg-white border rounded p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">{t("sellPage.trustedBy")}</p>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-600 font-bold text-sm">★</span>
       
            </div>
            <div className="flex gap-0.5 mb-1">
              {[1,2,3,4].map(i => (
                <span key={i} className="bg-green-500 text-white text-xs px-1.5 py-0.5">★</span>
              ))}
              <span className="bg-green-300 text-white text-xs px-1.5 py-0.5">★</span>
            </div>
            
          </div>

        </aside>

        {/* ── Right: form ── */}
        <div className="flex-1 bg-white border rounded p-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">{t("sellPage.pageTitle")}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {t("sellPage.pageSubtitle")}{" "}
            <span className="text-primary">{t("sellPage.pageSubtitleLink")}</span> {t("sellPage.pageSubtitleEnd")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Title */}
            <div>
              <Label htmlFor="title" className="text-sm font-medium">
                {t("sellPage.titleLabel")} <span className="text-muted-foreground font-normal">{t("sellPage.required")}</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`mt-1 ${errors.title ? "border-destructive" : ""}`}
              />
              {errors.title && <p className="text-destructive text-xs mt-1">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <Label className="text-sm font-medium">
                {t("sellPage.descriptionLabel")} <span className="text-muted-foreground font-normal">{t("sellPage.required")}</span>
              </Label>
              <div className={`mt-1 ${errors.description ? "border border-destructive rounded-md" : ""}`}>
                <SunEditor
                  setContents={description}
                  onChange={setDescription}
                  setOptions={{
                    height: "180",
                    buttonList: [["bold", "italic", "underline", "list"], ["align", "fontSize"]],
                  }}
                />
              </div>
              {errors.description && <p className="text-destructive text-xs mt-1">{errors.description}</p>}
            </div>

            {/* Photos */}
            <div>
              <Label className="text-sm font-medium">{t("sellPage.photosLabel")}</Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">{t("sellPage.photosNote")}</p>
              <div
                className="border border-dashed border-gray-300 rounded bg-gray-50 p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => imageInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleMedia(e.dataTransfer.files, "image"); }}
              >
                <ImagePlus className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-primary text-sm">{t("sellPage.uploadDrag")}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  onClick={(e) => { e.stopPropagation(); imageInputRef.current?.click(); }}
                >
                  {t("sellPage.browse")}
                </Button>
              </div>
              <input ref={imageInputRef} type="file" accept="image/*,.pdf" multiple hidden
                onChange={(e) => handleMedia(e.target.files, "image")} />
              <input ref={videoInputRef} type="file" accept="video/*" hidden
                onChange={(e) => handleMedia(e.target.files, "video")} />
              {media.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {media.map((m, i) => (
                    <div key={i} className="relative w-24 h-24 rounded overflow-hidden border group">
                      {m.type === "image"
                        ? <img src={m.url} alt="" className="w-full h-full object-cover" />
                        : <video src={m.url} className="w-full h-full object-cover" />}
                      <button
                        type="button"
                        onClick={() => removeMedia(i)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manufacturer + Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">{t("sellPage.manufacturerLabel")}</Label>
                <Input className="mt-1" value={manufacturer} onChange={e => setManufacturer(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm font-medium">{t("sellPage.modelLabel")}</Label>
                <Input className="mt-1" value={model} onChange={e => setModel(e.target.value)} />
              </div>
            </div>

            {/* Year + Sale deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">{t("sellPage.yearLabel")}</Label>
                <Input className="mt-1" type="number" placeholder="" />
              </div>
              <div>
                <Label className="text-sm font-medium">{t("sellPage.saleDeadlineLabel")}</Label>
                <Select defaultValue="1month">
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1month">{t("sellPage.oneMonth")}</SelectItem>
                    <SelectItem value="3months">{t("sellPage.threeMonths")}</SelectItem>
                    <SelectItem value="6months">{t("sellPage.sixMonths")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Parent category */}
            <div>
              <Label className="text-sm font-medium">
                {t("sellPage.parentCategoryLabel")} <span className="text-muted-foreground font-normal">{t("sellPage.required")}</span>
              </Label>
              <Select value={parentCategory} onValueChange={(v) => { setParentCategory(v); setSubCategory(""); setSubCategoryName(""); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={t("sellPage.selectCategory")} /></SelectTrigger>
                <SelectContent>
                  {parents.map((c: any) => (
                    <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {parentCategory && (
                <div className="mt-3">
                  <Label className="text-sm font-medium">
                    {t("sellPage.subCategoryLabel")} <span className="text-muted-foreground font-normal">{t("sellPage.required")}</span>
                  </Label>
                  <Select value={subCategory} onValueChange={(v) => { setSubCategory(v); setSubCategoryName(children.find((c: any) => String(c.id) === v)?.name || ""); }}>
                    <SelectTrigger className={`mt-1 ${errors.category ? "border-destructive" : ""}`}>
                      <SelectValue placeholder={t("sellPage.selectSubCategory")} />
                    </SelectTrigger>
                    <SelectContent>
                      {children.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-destructive text-xs mt-1">{errors.category}</p>}
                </div>
              )}
            </div>

            {/* Price */}
            <div>
              <Label className="text-sm font-medium">
                {t("sellPage.priceLabel")} <span className="text-muted-foreground font-normal">{t("sellPage.required")}</span>
              </Label>
              <div className="flex gap-3 mt-1">
                <Input
                  className="flex-1"
                  placeholder=""
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                />
                <Select value={currency} onValueChange={(v) => setCurrency(v as "TWD" | "USD")}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="TWD">TWD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-6 mt-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={enableBuyNow} onCheckedChange={(v) => setEnableBuyNow(!!v)} />
                  {t("sellPage.showPriceOnline")}
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox />
                  {t("sellPage.isNegotiable")}
                </label>
              </div>
            </div>

            {/* Condition */}
            <div>
              <Label className="text-sm font-medium">
                {t("sellPage.conditionLabel")} <span className="text-muted-foreground font-normal">{t("sellPage.required")}</span>
              </Label>
              <div className="flex flex-wrap gap-4 mt-2">
                {CONDITIONS.map((c) => (
                  <label key={c.key} className="flex items-center gap-2 cursor-pointer select-none text-sm">
                    <Checkbox
                      checked={condition.includes(c.key)}
                      onCheckedChange={(checked) =>
                        setCondition((prev) => checked ? [...prev, c.key] : prev.filter((k) => k !== c.key))
                      }
                    />
                    {t(c.tKey)}
                  </label>
                ))}
              </div>
              {errors.condition && <p className="text-destructive text-xs mt-1">{errors.condition}</p>}
            </div>

            {/* Operation Status */}
            <div>
              <Label className="text-sm font-medium">
                {t("sellPage.operationStatusLabel")} <span className="text-muted-foreground font-normal">{t("sellPage.required")}</span>
              </Label>
              <div className="flex flex-wrap gap-4 mt-2">
                {OPERATION_STATUSES.map((s) => (
                  <label key={s.key} className="flex items-center gap-2 cursor-pointer select-none text-sm">
                    <Checkbox
                      checked={operationStatus.includes(s.key)}
                      onCheckedChange={(checked) =>
                        setOperationStatus((prev) => checked ? [...prev, s.key] : prev.filter((k) => k !== s.key))
                      }
                    />
                    {t(s.tKey)}
                  </label>
                ))}
              </div>
              {errors.operationStatus && <p className="text-destructive text-xs mt-1">{errors.operationStatus}</p>}
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">
                  {t("sellPage.countryLabel")} <span className="text-muted-foreground font-normal">{t("sellPage.required")}</span>
                </Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className={`mt-1 ${errors.country ? "border-destructive" : ""}`}>
                    <SelectValue placeholder={t("sellPage.selectCountry")} />
                  </SelectTrigger>
                  <SelectContent>
                    <CountrySelectItems />
                  </SelectContent>
                </Select>
                {errors.country && <p className="text-destructive text-xs mt-1">{errors.country}</p>}
              </div>
              <div>
                <Label className="text-sm font-medium">{t("sellPage.addressLabel")}</Label>
                <Input
                  className="mt-1"
                  placeholder=""
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            {/* Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">{t("sellPage.quantityLabel")}</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">{t("sellPage.estimatedValueLabel")}</Label>
                <Input
                  className="mt-1"
                  placeholder=""
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-10 py-2.5 text-sm font-medium rounded"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    {t("sellPage.saving")}
                  </span>
                ) : t("sellPage.saveButton")}
              </Button>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
}
