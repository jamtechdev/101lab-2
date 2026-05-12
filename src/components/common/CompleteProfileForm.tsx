// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountrySelect } from "@/components/common/CountrySelect";
import { useLanguageAwareCategories } from "@/hooks/useLanguageAwareCategories";
import { toastError, toastSuccess } from "@/helper/toasterNotification";
import { cn } from "@/lib/utils";
import {
  Loader2, Building2, Phone, Tag, Check, ChevronDown, ChevronRight,
  UserPlus, Lock, Eye, EyeOff,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { SITE_TYPE_PROFILE } from "@/config/site";

const INDUSTRY_OPTIONS = [
  "Academic / University", "Research Institute", "Biotechnology", "Pharmaceutical",
  "Healthcare / Hospital", "Clinical Diagnostics Lab", "Environmental Testing",
  "Food & Beverage Testing", "Chemical Industry", "Agriculture / AgriTech",
  "Oil & Gas / Energy", "Semiconductor / Electronics", "Contract Research Organization (CRO)",
  "Government / Regulatory", "Manufacturing / Industrial Lab", "Distributor / Reseller",
  "Startup / Small Business", "Other",
];

const PHONE_CODES = [
  { code: "+86", flag: "🇨🇳" }, { code: "+62", flag: "🇮🇩" },
  { code: "+91", flag: "🇮🇳" }, { code: "+60", flag: "🇲🇾" },
  { code: "+886", flag: "🇹🇼" }, { code: "+66", flag: "🇹🇭" },
  { code: "+81", flag: "🇯🇵" }, { code: "+84", flag: "🇻🇳" },
  { code: "+44", flag: "🇬🇧" }, { code: "+1", flag: "🇺🇸" },
];

const API_BASE = "https://api.101recycle.greenbidz.com";

interface Props {
  onSuccess: () => void;
}

const CompleteProfileForm = ({ onSuccess }: Props) => {
  const { t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const submit = async () => {
    if (form.password && form.password.length < 6) {
      toastError("Password must be at least 6 characters.");
      return;
    }
    if (form.password && form.password !== form.confirmPassword) {
      toastError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const payload: any = {
        phone: form.phone ? `${form.phoneCode}${form.phone}` : "",
        company: form.company,
        country: form.country,
        industry: form.industry === "Other" ? `Other: ${form.industryOther}` : form.industry,
        interests: selectedInterests,
      };
      if (form.password) payload.password = form.password;

      const { data } = await axios.patch(
        `${API_BASE}/auth/google/complete-profile?type=${SITE_TYPE_PROFILE}`,
        payload,
        { withCredentials: true, headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toastSuccess("Profile saved! Your account is now under review.");
        onSuccess();
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
    <div className="space-y-6">

      {/* Contact & Location */}
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

      {/* Interests */}
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

      {/* Password */}
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
              <Input type={showPassword ? "text" : "password"} placeholder={t("auth.passwordMinPlaceholder")}
                value={form.password} onChange={setF("password")}
                className="h-11 pl-10 pr-10 bg-background border-border focus:border-primary" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5" onClick={() => setShowPassword(v => !v)}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">{t("auth.confirmPassword")}</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input type={showConfirmPassword ? "text" : "password"} placeholder={t("auth.repeatPasswordPlaceholder")}
                value={form.confirmPassword} onChange={setF("confirmPassword")}
                className="h-11 pl-10 pr-10 bg-background border-border focus:border-primary" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5" onClick={() => setShowConfirmPassword(v => !v)}>
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Button
        type="button"
        className="w-full h-12 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        disabled={isSubmitting}
        onClick={submit}
      >
        {isSubmitting
          ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
          : <><UserPlus className="w-4 h-4" />Complete Profile</>
        }
      </Button>
    </div>
  );
};

export default CompleteProfileForm;
