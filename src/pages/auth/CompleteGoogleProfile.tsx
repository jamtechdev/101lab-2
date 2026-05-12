// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountrySelect } from "@/components/common/CountrySelect";
import { useLanguageAwareCategories } from "@/hooks/useLanguageAwareCategories";
import { toastError } from "@/helper/toasterNotification";
import { cn } from "@/lib/utils";
import authLogo from "@/assets/lablogo.png";
import {
  Loader2, Building2, Phone, Tag, Check, ChevronDown, ChevronRight,
  ArrowLeft, CheckCircle2, UserPlus, Lock, Eye, EyeOff,
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
  { code: "+86", flag: "🇨🇳", label: "CN" }, { code: "+62", flag: "🇮🇩", label: "ID" },
  { code: "+91", flag: "🇮🇳", label: "IN" }, { code: "+60", flag: "🇲🇾", label: "MY" },
  { code: "+886", flag: "🇹🇼", label: "TW" }, { code: "+66", flag: "🇹🇭", label: "TH" },
  { code: "+81", flag: "🇯🇵", label: "JP" }, { code: "+84", flag: "🇻🇳", label: "VN" },
  { code: "+44", flag: "🇬🇧", label: "GB" }, { code: "+1", flag: "🇺🇸", label: "US" },
];

const API_BASE = "https://api.101recycle.greenbidz.com";

const CompleteGoogleProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const prefillEmail = searchParams.get("email")      || localStorage.getItem("googlePrefillEmail") || localStorage.getItem("userEmail") || "";
  const prefillFirst = searchParams.get("first_name") || localStorage.getItem("googlePrefillFirst") || "";
  const prefillLast  = searchParams.get("last_name")  || localStorage.getItem("googlePrefillLast")  || "";

  const [form, setForm] = useState({
    phone: "", phoneCode: "+86",
    company: "", country: "",
    industry: "", industryOther: "",
    password: "", confirmPassword: "",
  });
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
        phone:     skipAll ? "" : (form.phone ? `${form.phoneCode}${form.phone}` : ""),
        company:   skipAll ? "" : form.company,
        country:   skipAll ? "" : form.country,
        industry:  skipAll ? "" : (form.industry === "Other" ? `Other: ${form.industryOther}` : form.industry),
        interests: skipAll ? [] : selectedInterests,
      };
      if (!skipAll && form.password) payload.password = form.password;

      const { data } = await axios.patch(
        `${API_BASE}/auth/google/complete-profile?type=${SITE_TYPE_PROFILE}`,
        payload,
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        const role = localStorage.getItem("userRole") || localStorage.getItem("jwtRole") || "buyer";
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
    <div className="min-h-screen flex bg-background">

      {/* ── Left branding panel — matches registration ── */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[460px] flex-col justify-center p-10 relative overflow-hidden shrink-0"
        style={{ background: "linear-gradient(160deg, #e8f8f2 0%, #d6f0e8 50%, #c8ece2 100%)" }}>
        <div className="flex flex-col gap-8">
          <div className="w-40 h-20 bg-white rounded-2xl shadow-md flex items-center justify-center px-4">
            <img src={authLogo} alt="101LAB" className="h-12 w-auto object-contain" />
          </div>
          <div>
            <h1 className="text-[2.6rem] font-extrabold text-gray-900 leading-[1.15] mb-4">
              Welcome to a smarter<br />lab equipment<br />marketplace.
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              Build your account, tune your equipment interests, and unlock bidding-ready verification.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Infrastructure", "Biotech", "Pharma", "T&M"].map(pill => (
              <span key={pill} className="px-4 py-1.5 rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: "#2ec99a" }}>
                {pill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-white">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border lg:border-none lg:px-10 lg:pt-6 lg:pb-0">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground lg:hidden">
            <ArrowLeft className="w-4 h-4" />{t("auth.backToHome")}
          </button>
          <div className="ml-auto"><LanguageSwitcher /></div>
        </div>

        <div className="flex-1 flex items-start justify-center py-10 px-6 lg:px-10">
          <div className="w-full max-w-2xl">

            {/* Header */}
            <div className="mb-8">
              <p className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-2">COMPLETE PROFILE</p>
              <h2 className="text-4xl font-extrabold text-gray-900 leading-tight">Finish setting up your account</h2>
              {(prefillFirst || prefillEmail) && (
                <p className="text-sm text-gray-400 mt-2">
                  {prefillFirst && <span className="font-semibold text-gray-600">{prefillFirst} {prefillLast} · </span>}
                  <span className="font-semibold text-gray-600">{prefillEmail}</span>
                  <span className="ml-2 text-gray-400">— All fields are optional</span>
                </p>
              )}
            </div>

            <div className="space-y-6">

              {/* Phone | Company */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-base font-bold text-gray-800">Phone Number</Label>
                  <div className="flex h-14 rounded-2xl border border-gray-200 bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 overflow-hidden">
                    <select
                      value={form.phoneCode}
                      onChange={e => setForm(p => ({ ...p, phoneCode: e.target.value }))}
                      className="h-full pl-3 pr-1 text-sm bg-gray-50 border-r border-gray-200 text-gray-700 focus:outline-none cursor-pointer shrink-0"
                    >
                      {PHONE_CODES.map(({ code, flag }) => (
                        <option key={code} value={code}>{flag} {code}</option>
                      ))}
                    </select>
                    <input
                      type="tel" placeholder="+1 555 000 0000"
                      value={form.phone} onChange={setF("phone")}
                      className="flex-1 h-full px-4 text-sm bg-transparent focus:outline-none text-gray-800 placeholder:text-gray-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-bold text-gray-800">Company Name</Label>
                  <Input placeholder="Your company / lab" value={form.company} onChange={setF("company")}
                    className="h-14 rounded-2xl border-gray-200 bg-white focus:border-indigo-500 focus:ring-indigo-500/20 text-sm px-4" />
                </div>
              </div>

              {/* Country | Equipment Interest */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-base font-bold text-gray-800">Country</Label>
                  <CountrySelect value={form.country} onChange={v => setForm(p => ({ ...p, country: v }))} className="h-14 rounded-2xl border-gray-200 bg-white px-4" />
                </div>
                <div className="space-y-2" ref={dropdownRef}>
                  <Label className="text-base font-bold text-gray-800">Equipment Interest</Label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setInterestDropdownOpen(v => !v)}
                      className={cn(
                        "w-full h-14 px-4 rounded-2xl border text-sm flex items-center justify-between bg-white transition-all",
                        interestDropdownOpen ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <span className="text-gray-400 truncate">
                        {selectedInterests.length === 0 ? "Select category" : <span className="text-gray-800">{selectedInterests.length} selected</span>}
                      </span>
                      <ChevronDown className={cn("w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ml-2", interestDropdownOpen && "rotate-180")} />
                    </button>
                    {interestDropdownOpen && (
                      <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-gray-200 bg-white shadow-xl max-h-64 overflow-y-auto">
                        {labCategories.map((cat) => {
                          const parentSel = selectedInterests.includes(cat.slug);
                          const isExp = expandedParents.includes(cat.slug);
                          const hasSubs = cat.subcategories?.length > 0;
                          return (
                            <div key={cat.slug} className="border-b border-gray-100 last:border-0">
                              <div className="flex items-stretch">
                                <button type="button" onClick={() => toggleInterest(cat.slug)}
                                  className="flex items-center gap-2.5 flex-1 px-3 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors text-left">
                                  <div className={cn("w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all", parentSel ? "bg-indigo-600 border-indigo-600" : "border-gray-300")}>
                                    {parentSel && <Check className="w-2.5 h-2.5 text-white" />}
                                  </div>
                                  <span className={parentSel ? "text-indigo-600" : "text-gray-800"}>{cat.name}</span>
                                </button>
                                {hasSubs && (
                                  <button type="button"
                                    onClick={() => setExpandedParents(prev => prev.includes(cat.slug) ? prev.filter(s => s !== cat.slug) : [...prev, cat.slug])}
                                    className="px-3 border-l border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                                    <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", isExp && "rotate-90")} />
                                  </button>
                                )}
                              </div>
                              {hasSubs && isExp && (
                                <div className="bg-gray-50 border-t border-gray-100">
                                  {cat.subcategories.map((sub) => {
                                    const subSel = selectedInterests.includes(sub.slug);
                                    return (
                                      <button key={sub.slug} type="button" onClick={() => toggleInterest(sub.slug)}
                                        className="flex items-center gap-2 w-full px-5 py-2 text-xs hover:bg-gray-100 transition-colors text-left border-b border-gray-100 last:border-0">
                                        <div className={cn("w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-all", subSel ? "bg-indigo-600 border-indigo-600" : "border-gray-300")}>
                                          {subSel && <Check className="w-2 h-2 text-white" />}
                                        </div>
                                        <span className={subSel ? "text-indigo-600 font-medium" : "text-gray-500"}>{sub.name}</span>
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
              </div>

              {/* Password | Confirm Password */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-base font-bold text-gray-800">
                    Password <span className="text-xs font-normal text-gray-400">(optional)</span>
                  </Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} placeholder="Enter password"
                      value={form.password} onChange={setF("password")}
                      className="h-14 pr-12 rounded-2xl border-gray-200 bg-white focus:border-indigo-500 focus:ring-indigo-500/20 text-sm px-4" />
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">Lets you also login with email</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-bold text-gray-800">Confirm Password</Label>
                  <div className="relative">
                    <Input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm password"
                      value={form.confirmPassword} onChange={setF("confirmPassword")}
                      className="h-14 pr-12 rounded-2xl border-gray-200 bg-white focus:border-indigo-500 focus:ring-indigo-500/20 text-sm px-4" />
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowConfirmPassword(v => !v)}>
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="button"
                className="w-full h-14 text-base font-semibold text-white gap-2 rounded-2xl"
                style={{ backgroundColor: '#3730a3' }}
                disabled={isSubmitting}
                onClick={() => submit(false)}
              >
                {isSubmitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                  : "Complete Profile"
                }
              </Button>

            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CompleteGoogleProfile;
