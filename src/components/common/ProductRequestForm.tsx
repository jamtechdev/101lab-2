import { useState, useEffect, useRef } from "react";
import { Send, Loader2, X, CheckCircle2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitProductRequestMutation } from "@/rtk/slices/adminApiSlice";
import { toastSuccess, toastError } from "@/helper/toasterNotification";
import { useGetUserProfileQuery } from "@/rtk/slices/apiSlice";
import { useTranslation } from "react-i18next";

interface ProductRequestFormProps {
  searchQuery?: string;
}


export default function ProductRequestForm({ searchQuery = "" }: ProductRequestFormProps) {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh" || i18n.language === "zh-TW";

  const userId = localStorage.getItem("userId");
  const isLoggedIn = !!userId;

  const { data: profileData } = useGetUserProfileQuery(userId!, { skip: !userId });
  const [submitRequest, { isLoading }] = useSubmitProductRequestMutation();

  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
    setTimeout(() => { setSubmitted(false); }, 300);
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
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-border max-h-[92vh] overflow-y-auto">

            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {isZh ? "告訴我們您的需求" : "What are you looking for?"}
                </h2>
                {/* <p className="text-[11px] text-muted-foreground mt-0.5">              
                  {isZh ? "我們將在24小時內與您聯繫" : "We'll reach out within 24 hours"}
                </p> */}
              </div>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors ml-2 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {submitted ? (
                /* Success state */
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
                      : "Thank you! Our team will contact you."}
                  </p>
                  <Button variant="outline" size="sm" onClick={handleClose} className="mt-2">
                    {isZh ? "關閉" : "Close"}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* 1 — What are you looking for? */}
                  <div className="space-y-1">
                    <label htmlFor="pr-message" className="block text-xs font-semibold text-foreground">
                      {isZh ? "您在尋找什麼？" : "What are you looking for?"}
                      <span className="text-muted-foreground font-normal ml-1">{isZh ? "（選填）" : "(optional)"}</span>
                    </label>
                    <Textarea
                      id="pr-message"
                      value={form.message}
                      onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                      placeholder={isZh ? "例如：品牌、型號、數量、預算範圍..." : "e.g. brand, model, quantity, budget range..."}
                      rows={4}
                      className="text-sm resize-none w-full"
                    />
                  </div>

                  {/* Divider + Contact section */}
                  <div className="border-t border-border" />

                  <p className="text-xs font-semibold text-foreground">
                    {isZh ? "您的聯絡資訊" : "Your contact details"}
                  </p>

                  {/* Name + Email side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="pr-name" className="block text-xs font-medium text-muted-foreground">
                        {isZh ? "姓名" : "Name"} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="pr-name"
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder={isZh ? "您的姓名" : "Your name"}
                        className="h-9 text-sm w-full"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="pr-email" className="block text-xs font-medium text-muted-foreground">
                        {isZh ? "電子郵件" : "Email"} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="pr-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="your@email.com"
                        className="h-9 text-sm w-full"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone — full width */}
                  <div className="space-y-1">
                    <label htmlFor="pr-phone" className="block text-xs font-medium text-muted-foreground">
                      {isZh ? "電話號碼" : "Phone Number"}
                      <span className="ml-1 font-normal">{isZh ? "（選填）" : "(optional)"}</span>
                    </label>
                    <Input
                      id="pr-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder={isZh ? "您的電話" : "+886 or your number"}
                      className="h-9 text-sm w-full"
                    />
                  </div>

                  {/* Auto-fill notice */}
                  {isLoggedIn && (
                    <div className="flex items-center gap-1.5 text-[11px] text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      {isZh ? "聯絡資訊已從您的帳戶自動填入" : "Contact info auto-filled from your account"}
                    </div>
                  )}

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isZh ? "提交中..." : "Submitting..."}</>
                    ) : (
                      <><Send className="w-4 h-4 mr-2" />{isZh ? "提交需求" : "Submit Request"}</>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
