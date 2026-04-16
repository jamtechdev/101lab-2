import { useState, useEffect, useRef } from "react";
import { Send, Loader2, X, ChevronRight, ChevronLeft, CheckCircle2, Microscope, FlaskConical, Thermometer, Gauge, Droplets, Scale, ShieldCheck, Dna, Pill, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitProductRequestMutation } from "@/rtk/slices/adminApiSlice";
import { toastSuccess, toastError } from "@/helper/toasterNotification";
import { useGetUserProfileQuery } from "@/rtk/slices/apiSlice";
import { useTranslation } from "react-i18next";

interface CategoryOption {
  name: string;
  slug: string;
  nameZh?: string;
}

interface ProductRequestFormProps {
  searchQuery?: string;
  categories?: CategoryOption[];
}

// Icon + emoji mapping by slug/name keywords
function getCategoryVisual(slug: string, name: string): { icon: React.ReactNode; emoji: string; color: string } {
  const s = slug.toLowerCase();
  const n = name.toLowerCase();

  if (s.includes("cold") || n.includes("cold") || n.includes("freezer") || n.includes("cryo"))
    return { icon: <Thermometer className="w-5 h-5" />, emoji: "❄️", color: "bg-blue-50 border-blue-200 text-blue-700" };
  if (s.includes("water") || n.includes("water") || n.includes("purif"))
    return { icon: <Droplets className="w-5 h-5" />, emoji: "💧", color: "bg-cyan-50 border-cyan-200 text-cyan-700" };
  if (s.includes("fume") || s.includes("safety") || s.includes("biosafety") || n.includes("fume") || n.includes("hood"))
    return { icon: <ShieldCheck className="w-5 h-5" />, emoji: "🛡️", color: "bg-orange-50 border-orange-200 text-orange-700" };
  if (s.includes("balance") || s.includes("scale") || n.includes("balance") || n.includes("scale") || n.includes("pipette"))
    return { icon: <Scale className="w-5 h-5" />, emoji: "⚖️", color: "bg-yellow-50 border-yellow-200 text-yellow-700" };
  if (s.includes("furniture") || s.includes("bench") || n.includes("furniture") || n.includes("bench"))
    return { icon: <Wrench className="w-5 h-5" />, emoji: "🪑", color: "bg-stone-50 border-stone-200 text-stone-700" };
  if (s.includes("life") || s.includes("bio") || n.includes("biotech") || n.includes("life science"))
    return { icon: <Dna className="w-5 h-5" />, emoji: "🧬", color: "bg-green-50 border-green-200 text-green-700" };
  if (s.includes("pharma") || n.includes("pharma") || n.includes("analytical"))
    return { icon: <Pill className="w-5 h-5" />, emoji: "💊", color: "bg-purple-50 border-purple-200 text-purple-700" };
  if (s.includes("test") || s.includes("measurement") || n.includes("test") || n.includes("measurement"))
    return { icon: <Gauge className="w-5 h-5" />, emoji: "📏", color: "bg-indigo-50 border-indigo-200 text-indigo-700" };
  if (s.includes("lab") || n.includes("lab") || n.includes("infra"))
    return { icon: <FlaskConical className="w-5 h-5" />, emoji: "🔬", color: "bg-teal-50 border-teal-200 text-teal-700" };

  return { icon: <Microscope className="w-5 h-5" />, emoji: "⚗️", color: "bg-gray-50 border-gray-200 text-gray-700" };
}

export default function ProductRequestForm({ searchQuery = "", categories = [] }: ProductRequestFormProps) {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh" || i18n.language === "zh-TW";

  const userId = localStorage.getItem("userId");
  const isLoggedIn = !!userId;

  const { data: profileData } = useGetUserProfileQuery(userId!, { skip: !userId });
  const [submitRequest, { isLoading }] = useSubmitProductRequestMutation();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitted, setSubmitted] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  // Pre-fill from profile
  useEffect(() => {
    if (!profileData?.data) return;
    const u = profileData.data;
    const fullName =
      u.personalInfo?.firstName && u.personalInfo?.lastName
        ? `${u.personalInfo.firstName} ${u.personalInfo.lastName}`.trim()
        : u.displayName || "";
    setForm((prev) => ({
      ...prev,
      name: fullName || prev.name,
      email: u.email || prev.email,
      phone: u.personalInfo?.phone || prev.phone,
    }));
  }, [profileData]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => { setSubmitted(false); setStep(1); setSelectedCategories([]); }, 300);
  };

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toastError(isZh ? "姓名和電子郵件為必填" : "Name and email are required");
      return;
    }
    try {
      await submitRequest({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        category: selectedCategories.join(", ") || undefined,
        search_query: searchQuery || undefined,
        message: form.message || undefined,
        user_id: userId || null,
      }).unwrap();
      setSubmitted(true);
      toastSuccess(isZh ? "需求已提交！" : "Request submitted!");
    } catch (err: any) {
      toastError(err?.data?.message || (isZh ? "提交失敗" : "Failed to submit"));
    }
  };

  // All categories including "Other"
  const allOptions: CategoryOption[] = [
    ...categories,
    { name: "Other", slug: "other", nameZh: "其他" },
  ];

  return (
    <>
      {/* Trigger button */}
      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors font-medium px-6"
        >
          <FlaskConical className="w-4 h-4" />
          {isZh ? "找不到商品？告訴我們您的需求" : "Can't find it? Tell us what you need"}
        </Button>
      </div>

      {/* Modal */}
      {open && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
        >
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-border max-h-[92vh] overflow-y-auto">

            {/* ── Header ── */}
            <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                {/* Step indicator */}
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center transition-colors ${step >= 1 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>1</div>
                  <div className={`w-8 h-0.5 rounded transition-colors ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
                  <div className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center transition-colors ${step >= 2 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>2</div>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground leading-tight">
                    {step === 1
                      ? (isZh ? "您對什麼感興趣？" : "What are you interested in?")
                      : (isZh ? "您的聯絡資訊" : "Your contact details")}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {step === 1
                      ? (isZh ? "選擇您想購買或競標的設備類型" : "Select the type of lab equipment you want to buy or bid on")
                      : (isZh ? "我們將聯絡您確認需求" : "We'll reach out to confirm your request")}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors ml-2 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Body ── */}
            <div className="p-6">
              {submitted ? (
                /* Success */
                <div className="text-center py-10 space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {isZh ? "需求已提交！" : "Request Submitted!"}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    {isZh
                      ? "感謝您！我們的團隊將在24小時內與您聯繫。"
                      : "Thank you! Our team will contact you within 24 hours."}
                  </p>
                  {selectedCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-center pt-1">
                      {selectedCategories.map((c) => (
                        <span key={c} className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{c}</span>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={handleClose} className="mt-2">
                    {isZh ? "關閉" : "Close"}
                  </Button>
                </div>

              ) : step === 1 ? (
                /* ── Step 1: Category interest chips ── */
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    {isZh ? "可多選" : "Select all that apply"}
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    {allOptions.map((cat) => {
                      const visual = getCategoryVisual(cat.slug, cat.name);
                      const isSelected = selectedCategories.includes(cat.name);
                      const displayName = isZh && cat.nameZh ? cat.nameZh : cat.name;

                      return (
                        <button
                          key={cat.slug}
                          type="button"
                          onClick={() => toggleCategory(cat.name)}
                          className={`
                            relative flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-150
                            ${isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : `border ${visual.color} hover:border-primary/40 hover:shadow-sm`}
                          `}
                        >
                          {/* Emoji icon */}
                          <span className="text-xl leading-none flex-shrink-0">{visual.emoji}</span>
                          <span className={`text-xs font-medium leading-snug flex-1 ${isSelected ? "text-primary" : "text-foreground"}`}>
                            {displayName}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 absolute top-2 right-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected count + Next */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      {selectedCategories.length > 0
                        ? (isZh ? `已選 ${selectedCategories.length} 項` : `${selectedCategories.length} selected`)
                        : (isZh ? "請至少選擇一項" : "Please select at least one")}
                    </span>
                    <Button
                      onClick={() => setStep(2)}
                      disabled={selectedCategories.length === 0}
                      className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {isZh ? "下一步" : "Next"}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

              ) : (
                /* ── Step 2: Contact details ── */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Selected interests summary */}
                  <div className="bg-muted/40 rounded-lg px-3 py-2.5 space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                      {isZh ? "您的興趣" : "Your interests"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCategories.map((c) => (
                        <span key={c} className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{c}</span>
                      ))}
                    </div>
                  </div>

                  {/* Name + Email */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="pr-name" className="text-xs font-medium text-muted-foreground">
                        {isZh ? "姓名" : "Name"} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="pr-name"
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder={isZh ? "您的姓名" : "Your name"}
                        className="mt-1 h-9 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="pr-email" className="text-xs font-medium text-muted-foreground">
                        {isZh ? "電子郵件" : "Email"} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="pr-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="your@email.com"
                        className="mt-1 h-9 text-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <Label htmlFor="pr-phone" className="text-xs font-medium text-muted-foreground">
                      {isZh ? "電話號碼" : "Phone Number"}
                    </Label>
                    <Input
                      id="pr-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder={isZh ? "您的電話（選填）" : "+886 or your number (optional)"}
                      className="mt-1 h-9 text-sm"
                    />
                  </div>

                  {/* Specific equipment / details */}
                  <div>
                    <Label htmlFor="pr-message" className="text-xs font-medium text-muted-foreground">
                      {isZh ? "具體需求（選填）" : "Specific requirements (optional)"}
                    </Label>
                    <Textarea
                      id="pr-message"
                      value={form.message}
                      onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                      placeholder={
                        isZh
                          ? "例如：品牌、型號、數量、預算範圍..."
                          : "e.g. brand, model, quantity, budget range..."
                      }
                      rows={3}
                      className="mt-1 text-sm resize-none"
                    />
                  </div>

                  {/* Auto-fill notice */}
                  {isLoggedIn && (
                    <div className="flex items-center gap-1.5 text-[11px] text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      {isZh ? "聯絡資訊已從您的帳戶自動填入" : "Contact info auto-filled from your account"}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="h-10 px-4 gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      {isZh ? "返回" : "Back"}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                    >
                      {isLoading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isZh ? "提交中..." : "Submitting..."}</>
                      ) : (
                        <><Send className="w-4 h-4 mr-2" />{isZh ? "提交需求" : "Submit Request"}</>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
