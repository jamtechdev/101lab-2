// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { CountrySelect } from "@/components/common/CountrySelect";
import { useLanguageAwareCategories } from "@/hooks/useLanguageAwareCategories";
import { toastError } from "@/helper/toasterNotification";
import { cn } from "@/lib/utils";
import authLogo from "@/assets/lablogo.png";
import {
  Loader2, Check, ChevronDown, ChevronRight,
  ArrowLeft, Eye, EyeOff,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { SITE_TYPE_PROFILE } from "@/config/site";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";

const INDUSTRY_OPTIONS = [
  "Academic / University", "Research Institute", "Biotechnology", "Pharmaceutical",
  "Healthcare / Hospital", "Clinical Diagnostics Lab", "Environmental Testing",
  "Food & Beverage Testing", "Chemical Industry", "Agriculture / AgriTech",
  "Oil & Gas / Energy", "Semiconductor / Electronics", "Contract Research Organization (CRO)",
  "Government / Regulatory", "Manufacturing / Industrial Lab", "Distributor / Reseller",
  "Startup / Small Business", "Other",
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
  { code: "+44", label: "GB" },
  { code: "+1", label: "US" },
  { code: "+61", label: "AU" },
  { code: "+49", label: "DE" },
  { code: "+33", label: "FR" },
  { code: "+65", label: "SG" },
  { code: "+27", label: "ZA" },
  { code: "+82", label: "KR" },
  { code: "+52", label: "MX" },
  { code: "+55", label: "BR" },
  { code: "+20", label: "EG" },
  { code: "+234", label: "NG" },
  { code: "+90", label: "TR" },
  { code: "+31", label: "NL" },
]

const API_BASE = "https://api.101recycle.greenbidz.com";

const CompleteGoogleProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const prefillEmail   = searchParams.get("email")      || localStorage.getItem("googlePrefillEmail") || localStorage.getItem("userEmail") || "";
  const prefillFirst   = searchParams.get("first_name") || localStorage.getItem("googlePrefillFirst") || "";
  const prefillLast    = searchParams.get("last_name")  || localStorage.getItem("googlePrefillLast")  || "";
  const prefillCompany = searchParams.get("company")    || localStorage.getItem("companyName") || "";

  const [form, setForm] = useState({
    first_name: prefillFirst, last_name: prefillLast,
    email: prefillEmail,
    phone: "", phoneCode: "+86",
    company: prefillCompany, country: "",
    industry: "", industryOther: "",
    password: "", confirmPassword: "",
  });
  const [wantToSell, setWantToSell] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [interestDropdownOpen, setInterestDropdownOpen] = useState(false);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: labCategories = [] } = useLanguageAwareCategories();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toastError("Session expired. Please sign in with Google again.");
      navigate("/auth?mode=signup");
    }
    // Re-read from localStorage on mount to ensure prefill is always set
    const email   = searchParams.get("email")      || localStorage.getItem("googlePrefillEmail") || localStorage.getItem("userEmail") || "";
    const first   = searchParams.get("first_name") || localStorage.getItem("googlePrefillFirst") || "";
    const last    = searchParams.get("last_name")  || localStorage.getItem("googlePrefillLast")  || "";
    const company = searchParams.get("company")    || localStorage.getItem("companyName") || "";
    setForm(p => ({ ...p, email: email || p.email, first_name: first || p.first_name, last_name: last || p.last_name, company: company || p.company }));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setInterestDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const setF = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const toggleInterest = (slug: string) =>
    setSelectedInterests(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );

  const getInterestLabel = (slug: string) =>
    labCategories.flatMap(c => [c, ...(c.subcategories || [])]).find(c => c.slug === slug)?.name || slug;

  const submit = async (skipAll = false) => {
    // Password validation only if user typed something
    if (!skipAll && form.password && form.password.length < 6) {
      toastError("Password must be at least 6 characters.");
      return;
    }
    if (!skipAll && form.password && form.password !== form.confirmPassword) {
      toastError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const payload: any = {
        first_name: form.first_name,
        last_name:  form.last_name,
        phone:     skipAll ? "" : (form.phone ? `${form.phoneCode}${form.phone}` : ""),
        company:   skipAll ? "" : form.company,
        country:   skipAll ? "" : form.country,
        industry:  skipAll ? "" : (form.industry === "Other" ? `Other: ${form.industryOther}` : form.industry),
        interests: skipAll ? [] : selectedInterests,
        role:      wantToSell ? "seller" : undefined,
      };
      if (!skipAll && form.password) payload.password = form.password;

      const roleParam = wantToSell ? "&role=seller" : "";
      const { data } = await axios.patch(
        `${API_BASE}/auth/google/complete-profile?type=${SITE_TYPE_PROFILE}${roleParam}`,
        payload,
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        const storedRole = localStorage.getItem("userRole") || localStorage.getItem("jwtRole") || "buyer";
        const role = wantToSell ? "seller" : storedRole;
        if (wantToSell) { localStorage.setItem("userRole", "seller"); localStorage.setItem("jwtRole", "seller"); localStorage.setItem("activeView", "seller"); }
        window.location.href = role === "seller" ? "/dashboard" : "/buyer-dashboard";
      } else {
        toastError(data.message || "Something went wrong.");
      }
    } catch (err: any) {
      toastError(err?.response?.data?.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const FEATURES = [
    t("auth.features.verifiedMarketplace"),
    t("auth.features.secureBidding"),
    t("auth.features.realTimeNotifications"),
    t("auth.features.businessVerification"),
  ];

  return (
    <div className="min-h-screen flex bg-gradient-lab">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[460px] flex-col justify-center p-10 relative overflow-hidden shrink-0">
        <div className="flex flex-col gap-8">
          <div className="inline-flex rounded-2xl bg-card/80 px-6 py-4 shadow-panel backdrop-blur w-fit">
            <img src={authLogo} alt="101LAB" className="h-20 w-auto object-contain" />
          </div>
          <div>
            <h1 className="text-5xl font-extrabold text-brand-navy leading-tight max-w-xl">
              Welcome to a smarter lab equipment marketplace.
            </h1>
            <p className="mt-5 max-w-lg text-xl leading-8 text-muted-foreground">
              Build your account, tune your equipment interests, and unlock bidding-ready verification.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {["Infrastructure", "Biotech", "Pharma", "T&M"].map(pill => (
              <span key={pill} className="rounded-full px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: "#2ec99a" }}>
                {pill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border lg:border-none lg:px-10 lg:pt-6 lg:pb-0">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground lg:hidden">
            <ArrowLeft className="w-4 h-4" />{t("auth.backToHome")}
          </button>
          <div className="ml-auto"><LanguageSwitcher /></div>
        </div>

        <div className="flex-1 flex items-center justify-center py-8 px-4 lg:px-8">
          <div className="w-full max-w-3xl rounded-3xl bg-card shadow-panel ring-1 ring-border/70 p-6 sm:p-10">

            {/* Header */}
            <div className="mb-8">
              <p className="text-sm font-extrabold uppercase tracking-normal text-brand-teal mb-2">Complete Profile</p>
              <h2 className="mt-2 text-3xl font-extrabold text-brand-navy">Finish setting up your account</h2>
              {(prefillFirst || prefillEmail) && (
                <p className="text-sm text-muted-foreground mt-2">
                  {prefillFirst && <span className="font-semibold text-foreground">{prefillFirst} {prefillLast} · </span>}
                  <span className="font-semibold text-foreground">{prefillEmail}</span>
                </p>
              )}
            </div>

            <form onSubmit={e => { e.preventDefault(); submit(false); }} className="grid gap-7 sm:grid-cols-2">

              {/* First Name | Last Name */}
              <label className="block">
                <span className="mb-2 block text-base font-bold text-gray-900"><span className="text-destructive mr-1">*</span>First Name</span>
                <input placeholder="First Name" value={form.first_name} onChange={setF("first_name")}
                  className="h-14 w-full rounded-2xl border border-gray-200 bg-white px-5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
              </label>
              <label className="block">
                <span className="mb-2 block text-base font-bold text-gray-900"><span className="text-destructive mr-1">*</span>Last Name</span>
                <input placeholder="Last Name" value={form.last_name} onChange={setF("last_name")}
                  className="h-14 w-full rounded-2xl border border-gray-200 bg-white px-5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
              </label>

              {/* Email — pre-filled, read-only */}
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-base font-bold text-gray-900"><span className="text-destructive mr-1">*</span>Email</span>
                <input type="email" value={form.email} readOnly
                  className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-100 px-6 text-base font-medium text-gray-400 cursor-not-allowed focus:outline-none" />
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
                  className="h-14 w-full rounded-2xl border border-gray-200 bg-white px-6 text-base font-medium" />
              </label>

              {/* Equipment Interest */}
              <div className="block" ref={dropdownRef}>
                <span className="mb-2 block text-base font-bold text-gray-900"><span className="text-destructive mr-1">*</span>Equipment Interest</span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setInterestDropdownOpen(v => !v)}
                    className={cn(
                      "w-full h-14 px-5 rounded-2xl border border-gray-200 bg-white text-base font-medium flex items-center justify-between transition-all",
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
                    value={form.password} onChange={setF("password")}
                    className="h-14 w-full rounded-2xl border border-gray-200 bg-white px-6 pr-14 text-base font-medium text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
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
                    value={form.confirmPassword} onChange={setF("confirmPassword")}
                    className="h-14 w-full rounded-2xl border border-gray-200 bg-white px-6 pr-14 text-base font-medium text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
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

              {/* Submit */}
              <button type="submit" disabled={isSubmitting}
                className="sm:col-span-2 mt-2 w-full rounded-2xl px-6 py-4 text-base font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, hsl(215,60%,18%), hsl(180,65%,40%))" }}>
                {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" />Saving…</> : "Complete Profile"}
              </button>

            </form>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CompleteGoogleProfile;
