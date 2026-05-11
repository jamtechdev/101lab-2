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
        navigate("/account-pending");
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

      {/* ── Left branding panel — same as Auth.tsx ── */}
      <div className="hidden lg:flex lg:w-[380px] xl:w-[440px] flex-col justify-between p-10 text-primary-foreground relative overflow-hidden bg-gradient-primary shrink-0">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M20 20h20v20H20zM0 0h20v20H0z\'/%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative z-10">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity mb-10">
            <ArrowLeft className="w-4 h-4" />{t("auth.backToHome")}
          </button>
          <div className="mb-1"><span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">{t("auth.welcomeTo")}</span></div>
          <h1 className="text-3xl font-bold mb-3 tracking-tight">101Lab</h1>
          <p className="text-sm opacity-70 leading-relaxed max-w-[300px]">{t("landing.subtitle")}</p>
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

            {/* ══ PROFILE FORM ══ */}
            <div className="animate-fade-in">
                <div className="text-center mb-7">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted/40 border border-border mb-4">
                    <svg className="w-7 h-7" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold">{t("auth.createYourAccountTitle")}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {prefillFirst && <><span className="font-semibold text-foreground">{prefillFirst} {prefillLast}</span> · </>}
                    <span className="font-semibold text-foreground">{prefillEmail}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">All fields are optional — you can skip and fill them later</p>
                </div>

                <div className="space-y-6">

                  {/* ── Contact & Location ── */}
                  <div className="rounded-2xl border border-border bg-muted/20 p-6 space-y-4">
                    <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Phone className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {t("auth.personalCompanyDetails")}
                        <span className="text-xs font-normal text-muted-foreground ml-2">({t("auth.optional")})</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-foreground">{t("auth.phoneNumber")}</Label>
                        <div className="flex h-11 rounded-md border border-border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 overflow-hidden">
                          <select
                            value={form.phoneCode}
                            onChange={e => setForm(p => ({ ...p, phoneCode: e.target.value }))}
                            className="h-full pl-2 pr-1 text-sm bg-muted/40 border-r border-border text-foreground focus:outline-none cursor-pointer shrink-0"
                          >
                            {PHONE_CODES.map(({ code, flag }) => (
                              <option key={code} value={code}>{flag} {code}</option>
                            ))}
                          </select>
                          <input
                            type="tel" placeholder={t("auth.phonePlaceholder")}
                            value={form.phone} onChange={setF("phone")}
                            className="flex-1 h-full px-3 text-sm bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-foreground">{t("auth.country")}</Label>
                        <CountrySelect value={form.country} onChange={v => setForm(p => ({ ...p, country: v }))} className="h-11 bg-background" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-foreground">{t("auth.companyName")}</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input placeholder={t("auth.yourCompany")} value={form.company} onChange={setF("company")}
                          className="h-11 pl-10 bg-background border-border focus:border-primary" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-foreground">{t("auth.customerIndustry")}</Label>
                      <select
                        value={form.industry}
                        onChange={e => setForm(p => ({ ...p, industry: e.target.value, industryOther: "" }))}
                        className="w-full h-11 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">{t("auth.selectYourIndustry")}</option>
                        {INDUSTRY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      {form.industry === "Other" && (
                        <Input placeholder={t("auth.specifyIndustryPlaceholder")} value={form.industryOther}
                          onChange={setF("industryOther")}
                          className="h-11 bg-background border-border focus:border-primary mt-2" />
                      )}
                    </div>
                  </div>

                  {/* ── Interests ── */}
                  {labCategories.length > 0 && (
                    <div className="rounded-2xl border border-border bg-muted/20 p-6 space-y-4">
                      <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Tag className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {t("auth.equipmentInterests")}
                          <span className="text-xs font-normal text-muted-foreground ml-1">({t("auth.optional")})</span>
                        </p>
                      </div>
                      <div ref={dropdownRef} className="relative">
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

                  {/* ── Set Password (optional) ── */}
                  <div className="rounded-2xl border border-border bg-muted/20 p-6 space-y-4">
                    <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Lock className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        Set a Password
                        <span className="text-xs font-normal text-muted-foreground ml-2">({t("auth.optional")} — lets you also login with email)</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-foreground">{t("auth.password")}</Label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder={t("auth.passwordMinPlaceholder")}
                            value={form.password} onChange={setF("password")}
                            className="h-11 pl-10 pr-10 bg-background border-border focus:border-primary"
                          />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5" onClick={() => setShowPassword(v => !v)}>
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-foreground">{t("auth.confirmPassword")}</Label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder={t("auth.repeatPasswordPlaceholder")}
                            value={form.confirmPassword} onChange={setF("confirmPassword")}
                            className="h-11 pl-10 pr-10 bg-background border-border focus:border-primary"
                          />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5" onClick={() => setShowConfirmPassword(v => !v)}>
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Buttons ── */}
                  <Button
                    type="button"
                    className="w-full h-12 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                    disabled={isSubmitting}
                    onClick={() => submit(false)}
                  >
                    {isSubmitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" />{t("auth.creatingAccount")}</>
                      : <><UserPlus className="w-4 h-4" />{t("auth.createAccount")}</>
                    }
                  </Button>

                </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default CompleteGoogleProfile;
