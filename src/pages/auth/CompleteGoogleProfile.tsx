// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { sanitizePhoneInput } from "@/utils/phoneInput";
import PhoneInput from "react-phone-number-input";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { CountrySelect } from "@/components/common/CountrySelect";
import { useLanguageAwareCategories } from "@/hooks/useLanguageAwareCategories";
import { toastError } from "@/helper/toasterNotification";
import { cn } from "@/lib/utils";
import authLogo from "@/assets/lablogo.png";
import {
  Loader2, Check, ChevronDown, ChevronRight,
  Eye, EyeOff,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { SITE_TYPE_PROFILE } from "@/config/site";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";

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
];

const API_BASE = "https://api.101recycle.greenbidz.com";

const CompleteGoogleProfile = () => {
  const { t, i18n } = useTranslation();
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password && form.password.length < 6) { toastError("Password must be at least 6 characters."); return; }
    if (form.password && form.password !== form.confirmPassword) { toastError("Passwords do not match."); return; }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const payload: any = {
        first_name: form.first_name,
        last_name:  form.last_name,
        phone:      form.phone || "",
        company:    form.company,
        country:    form.country,
        interests:  selectedInterests,
        role:       wantToSell ? "seller" : undefined,
        lang:       i18n.language || "en",
      };
      if (form.password) payload.password = form.password;

      const roleParam = wantToSell ? "&role=seller" : "";
      const { data } = await axios.patch(
        `${API_BASE}/auth/google/complete-profile?type=${SITE_TYPE_PROFILE}${roleParam}`,
        payload,
        { withCredentials: true, headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        const storedRole = localStorage.getItem("userRole") || localStorage.getItem("jwtRole") || "buyer";
        const role = wantToSell ? "seller" : storedRole;
        if (wantToSell) {
          localStorage.setItem("userRole", "seller");
          localStorage.setItem("jwtRole", "seller");
          localStorage.setItem("activeView", "seller");
        }
        window.location.href = "/dashboard";
      } else {
        toastError(data.message || "Something went wrong.");
      }
    } catch (err: any) {
      toastError(err?.response?.data?.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-[100dvh] flex bg-gradient-lab overflow-hidden">

      {/* ── Left branding aside — stays fixed, vertically centered ── */}
      <aside className="hidden lg:flex flex-col justify-center flex-shrink-0 lg:w-[44%] xl:w-[42%] px-10 lg:px-14 xl:px-20 py-12 overflow-hidden">
        <div className="mb-10 inline-flex rounded-2xl bg-card/80 px-6 py-4 shadow-panel backdrop-blur self-start">
          <img src={authLogo} alt="101LAB" className="h-16 w-auto object-contain" />
        </div>
        <h1 className="max-w-xl text-4xl xl:text-5xl font-extrabold leading-tight text-brand-navy">
          Welcome to a smarter lab equipment marketplace.
        </h1>
        <p className="mt-5 max-w-lg text-lg xl:text-xl leading-7 text-muted-foreground">
          Complete your profile to unlock bidding, listing, and verified marketplace access.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {["Infrastructure", "Biotech", "Pharma", "T&M"].map(pill => (
            <span key={pill} className="rounded-full px-4 py-2 text-sm font-bold text-white"
              style={{ backgroundColor: "#2ec99a" }}>{pill}</span>
          ))}
        </div>
      </aside>

      {/* ── Right scrollable form column ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center px-4 py-10 sm:px-6 lg:px-12">

          {/* ── Card ── */}
          <div className="w-full max-w-xl rounded-3xl bg-card shadow-panel ring-1 ring-border/70">
            <div className="flex items-center justify-between px-6 pt-5 pb-0">
              <div className="lg:hidden">
                <img src={authLogo} alt="101LAB" className="h-8 w-auto object-contain" />
              </div>
              <div className="ml-auto"><LanguageSwitcher /></div>
            </div>

            <div className="px-6 pt-6 pb-8 sm:px-10">
              {/* Header */}
              <div className="mb-8">
                <p className="text-sm font-extrabold uppercase tracking-normal text-brand-teal mb-1">Complete Profile</p>
                <h2 className="text-3xl font-extrabold text-brand-navy">Finish setting up your account</h2>
                {(prefillFirst || prefillEmail) && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {prefillFirst && <span className="font-semibold text-foreground">{prefillFirst} {prefillLast} · </span>}
                    <span className="font-semibold text-foreground">{prefillEmail}</span>
                  </p>
                )}
              </div>

              <form onSubmit={submit} className="grid gap-7 sm:grid-cols-2">

                {/* First Name | Last Name */}
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-gray-700"><span className="text-destructive mr-1">*</span>First Name</span>
                  <input placeholder="First Name" value={form.first_name} onChange={setF("first_name")} required
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-gray-700"><span className="text-destructive mr-1">*</span>Last Name</span>
                  <input placeholder="Last Name" value={form.last_name} onChange={setF("last_name")} required
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20" />
                </label>

                {/* Email — pre-filled, read-only */}
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-semibold text-gray-700"><span className="text-destructive mr-1">*</span>Email</span>
                  <input type="email" value={form.email} readOnly
                    className="h-11 w-full rounded-lg border border-gray-200 bg-gray-100 px-3.5 text-sm text-gray-500 cursor-not-allowed focus:outline-none" />
                </label>

                {/* Phone Number */}
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-gray-700"><span className="text-destructive mr-1">*</span>Phone Number</span>
                  <PhoneInput
                    international
                    defaultCountry="CN"
                    value={form.phone as any}
                    onChange={(value) => setForm(p => ({ ...p, phone: (value || "") as any }))}
                    placeholder="Enter phone number"
                    className="phone-input-themed"
                    limitMaxLength
                  />
                </label>

                {/* Company Name */}
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-gray-700"><span className="text-destructive mr-1">*</span>Company Name</span>
                  <input placeholder="Your company / lab" value={form.company} onChange={setF("company")}
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20" />
                </label>

                {/* Country */}
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-gray-700"><span className="text-destructive mr-1">*</span>Country</span>
                  <CountrySelect value={form.country} onChange={v => setForm(p => ({ ...p, country: v }))}
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3.5 text-sm" />
                </label>

                {/* Equipment Interest */}
                <div className="block" ref={dropdownRef}>
                  <span className="mb-1.5 block text-sm font-semibold text-gray-700"><span className="text-destructive mr-1">*</span>Equipment Interest</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setInterestDropdownOpen(v => !v)}
                      className={cn(
                        "w-full h-11 px-3.5 rounded-lg border bg-white text-sm flex items-center justify-between transition-all",
                        interestDropdownOpen ? "border-emerald-700 ring-2 ring-emerald-700/20" : "border-gray-200 hover:border-gray-300"
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
                  <span className="mb-1.5 block text-sm font-semibold text-gray-700">Password <span className="text-muted-foreground font-normal text-sm">(optional)</span></span>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} placeholder="Set a password"
                      value={form.password} onChange={setF("password")}
                      className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3.5 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20" />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="mt-1.5 block text-xs text-muted-foreground">At least 8 characters, a capital letter and a special character</span>
                </label>

                {/* Confirm Password */}
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-semibold text-gray-700">Confirm Password</span>
                  <div className="relative">
                    <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm password"
                      value={form.confirmPassword} onChange={setF("confirmPassword")}
                      className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3.5 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20" />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirmPassword(v => !v)}>
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </label>

                {/* Become a Seller */}
                <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={wantToSell}
                    onChange={e => setWantToSell(e.target.checked)}
                    className="w-4 h-4 accent-emerald-700 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-foreground">Become a Seller</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Register as a seller to list and auction your items. Requires admin approval.</p>
                  </div>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="sm:col-span-2 mt-2 inline-flex w-full h-11 items-center justify-center rounded-lg px-6 text-sm font-semibold text-white bg-[#0f4c2a] hover:bg-[#1a3c2a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed gap-2"
                >
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : "Complete Profile"}
                </button>

              </form>
            </div>
          </div>{/* end card */}

        </div>{/* end center wrapper */}
      </main>{/* end scrollable right column */}
    </div>
  );
};

export default CompleteGoogleProfile;
