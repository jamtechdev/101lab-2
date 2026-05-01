import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Helmet } from "react-helmet-async";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import {
  Globe2, Gavel, Megaphone, HeadphonesIcon, Send,
  Upload, ListChecks, Handshake, Quote, ChevronRight,
} from "lucide-react";
import heroImg from "@/assets/direct-sales/hero-reseller.jpg";
import { PHONE_CODES } from "@/config/phoneCodes";
import { useLanguageAwareCategories } from "@/hooks/useLanguageAwareCategories";


/* ─── Why Partner Card ─────────────────────────────────────────────────── */
const PartnerCard = ({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) => (
  <div className="group bg-card border border-border rounded-lg p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <h3 className="text-base font-bold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
  </div>
);

/* ─── Step Card ────────────────────────────────────────────────────────── */
const StepCard = ({
  num,
  icon: Icon,
  title,
  desc,
}: {
  num: number;
  icon: React.ElementType;
  title: string;
  desc: string;
}) => (
  <div className="relative bg-card border border-border rounded-lg p-6 text-center hover:shadow-lg hover:border-primary/30 transition-all duration-300">
    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-sm font-bold">
      {num}
    </div>
    <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
    <h3 className="font-bold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
  </div>
);

/* ════════════════════════════════════════════════════════════════════════ */
/*  DIRECT SALES PAGE                                                      */
/* ════════════════════════════════════════════════════════════════════════ */
const emptyForm = {
  companyName: "",
  fullName: "",
  phoneCode: "+886",
  phone: "",
  companyEmail: "",
  message: "",
  attachment: null as File | null,
};

const SELLER_COUNTRIES = ["China", "Indonesia", "India", "Malaysia", "Taiwan", "Thailand", "Japan", "Vietnam"];

const DirectSalesPage = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [submitting, setSubmitting] = useState(false);
  const { data: categories = [] } = useLanguageAwareCategories();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, attachment: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.companyName.trim() || !form.fullName.trim() || !form.companyEmail.trim() || !form.phone.trim() || !form.message.trim()) {
      toast.error(t("directSalesPage.form.errors.allFieldsRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const productionUrl = import.meta.env.VITE_PRODUCTION_URL || "http://localhost:4000/api/v1/";
      const endpoint = `${productionUrl.replace("/api/v1/", "")}/api/v1/reseller/submit-application`;

      const formData = new FormData();
      formData.append("lead_type", "direct-sales-101lab");
      formData.append("companyName", form.companyName);
      formData.append("fullName", form.fullName);
      formData.append("phoneCode", form.phoneCode);
      formData.append("phone", form.phone);
      formData.append("companyEmail", form.companyEmail);
      formData.append("message", form.message);
      if (form.attachment) {
        formData.append("attachment", form.attachment);
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "x-platform": import.meta.env.VITE_SITE_TYPE || "LabGreenbidz",
          "x-system-key": import.meta.env.VITE_X_SYSTEM_KEY || "",
        },
        body: formData,
      });

      const result = await response.json() as { ok?: boolean; error?: string; itemId?: string };

      if (result?.ok) {
        toast.success(t("directSalesPage.form.success"));
        setForm(emptyForm);
        return;
      }

      toast.error(result?.error || t("directSalesPage.form.errors.submitFailed"));
    } catch (err: any) {
      toast.error(err?.message || t("directSalesPage.form.errors.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const partners = [
    {
      icon: Globe2,
      title: t("directSalesPage.partnerCards.globalExposure.title"),
      desc: t("directSalesPage.partnerCards.globalExposure.desc"),
    },
    {
      icon: Gavel,
      title: t("directSalesPage.partnerCards.auctionTools.title"),
      desc: t("directSalesPage.partnerCards.auctionTools.desc"),
    },
    {
      icon: Megaphone,
      title: t("directSalesPage.partnerCards.marketing.title"),
      desc: t("directSalesPage.partnerCards.marketing.desc"),
    },
    {
      icon: HeadphonesIcon,
      title: t("directSalesPage.partnerCards.support.title"),
      desc: t("directSalesPage.partnerCards.support.desc"),
    },
  ];

  const steps = [
    {
      icon: Upload,
      title: t("directSalesPage.steps.onboard.title"),
      desc: t("directSalesPage.steps.onboard.desc"),
    },
    {
      icon: ListChecks,
      title: t("directSalesPage.steps.list.title"),
      desc: t("directSalesPage.steps.list.desc"),
    },
    {
      icon: Handshake,
      title: t("directSalesPage.steps.close.title"),
      desc: t("directSalesPage.steps.close.desc"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>{t("directSalesPage.meta.title")}</title>
        <meta name="description" content={t("directSalesPage.meta.description")} />
        <meta name="keywords" content="power seller, industrial equipment sales, machinery marketplace, B2B selling, reseller program" />
        <meta property="og:title" content={t("directSalesPage.meta.title")} />
        <meta property="og:description" content={t("directSalesPage.meta.ogDescription")} />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content={t("directSalesPage.meta.twitterTitle")} />
        <meta name="twitter:description" content={t("directSalesPage.meta.twitterDescription")} />
        <link rel="canonical" href="https://101recycle.greenbidz.com/direct-sales" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://101recycle.greenbidz.com"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": t("directSalesPage.meta.breadcrumbLabel"),
                "item": "https://101recycle.greenbidz.com/direct-sales"
              }
            ]
          })}
        </script>
      </Helmet>
      <Header />

      {/* ── HERO + FORM ──────────────────────────────────────────── */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-10 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

            {/* Left — Image + overlay text */}
            <div className="relative rounded-lg overflow-hidden h-[300px] sm:h-[400px] lg:h-full lg:min-h-[560px]">
              <img
                src={heroImg}
                alt={t("directSalesPage.hero.imageAlt")}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                  {t("directSalesPage.hero.title")}
                </h2>
                <p className="text-sm text-white/80 leading-relaxed">
                  {t("directSalesPage.hero.desc")}
                </p>
              </div>
            </div>

            {/* Right — Form */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
                {t("directSalesPage.form.title")}
              </h1>

              <form onSubmit={handleSubmit} className="space-y-5">                             

                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t("directSalesPage.form.companyName")} <span className="text-destructive">*</span>
                  </label>
                  <Input name="companyName" placeholder={t("directSalesPage.form.companyNamePlaceholder")} value={form.companyName} onChange={handleChange} required className="border-border" />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t("directSalesPage.form.fullName")} <span className="text-destructive">*</span>
                  </label>
                  <Input name="fullName" placeholder={t("directSalesPage.form.fullNamePlaceholder")} value={form.fullName} onChange={handleChange} required className="border-border" />
                </div>

                {/* Phone with Country Code */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t("directSalesPage.form.phone")} <span className="text-destructive">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="phoneCode"
                      value={form.phoneCode}
                      onChange={handleChange}
                      className="border border-border rounded-md bg-background text-foreground text-sm px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary w-40 shrink-0"
                    >
                      {PHONE_CODES.filter(c => SELLER_COUNTRIES.includes(c.country)).map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                    <Input name="phone" type="tel" placeholder={t("directSalesPage.form.phonePlaceholder")} value={form.phone} onChange={handleChange} required className="border-border flex-1" />
                  </div>
                </div>

                {/* Company Email */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t("directSalesPage.form.companyEmail")} <span className="text-destructive">*</span>
                  </label>
                  <Input name="companyEmail" type="email" placeholder={t("directSalesPage.form.companyEmailPlaceholder")} value={form.companyEmail} onChange={handleChange} required className="border-border" />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t("directSalesPage.form.message")} <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    name="message"
                    placeholder={t("directSalesPage.form.messagePlaceholder")}
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="border-border"
                  />
                </div>

                {/* Attachment */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t("directSalesPage.form.attachment")} <span className="text-muted-foreground font-normal">({t("directSalesPage.form.optional")})</span>
                  </label>
                  <label
                    htmlFor="attachment-input"
                    className={`flex flex-col items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed cursor-pointer transition-colors
                      ${form.attachment
                        ? "border-primary bg-primary/5"
                        : "border-border bg-muted/40 hover:border-primary hover:bg-primary/5"
                      }`}
                    style={{ minHeight: "110px", padding: "20px 16px" }}
                  >
                    <Upload className={`h-7 w-7 ${form.attachment ? "text-primary" : "text-muted-foreground"}`} />
                    {form.attachment ? (
                      <div className="text-center">
                        <p className="text-sm font-medium text-primary break-all">{form.attachment.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("directSalesPage.form.changeFile")}</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">{t("directSalesPage.form.uploadFile")}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("directSalesPage.form.allowedFiles")}</p>
                      </div>
                    )}
                    <Input
                      id="attachment-input"
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png,.gif"
                    />
                  </label>
                </div>

                <Button type="submit" className="w-full sm:w-auto px-8" disabled={submitting}>
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? t("directSalesPage.form.sending") : t("directSalesPage.form.applyNow")}
                </Button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* ── WHY PARTNER ──────────────────────────────────────────── */}
      <section className="bg-muted/30">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="text-center mb-10">
            <p className="uppercase text-xs tracking-[0.2em] font-semibold text-primary mb-2">
              {t("directSalesPage.whyPartner.eyebrow")}
            </p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              {t("directSalesPage.whyPartner.title")}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {partners.map((p) => (
              <PartnerCard key={p.title} {...p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="text-center mb-10">
            <p className="uppercase text-xs tracking-[0.2em] font-semibold text-primary mb-2">
              {t("directSalesPage.howItWorks.eyebrow")}
            </p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              {t("directSalesPage.howItWorks.title")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <StepCard key={s.title} num={i + 1} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* ── DESIGNED FOR POWER SELLERS ────────────────────────────── */}
      <section className="bg-primary">
        <div className="container mx-auto px-4 py-12 md:py-16 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-primary-foreground mb-4">
            {t("directSalesPage.powerSellers.title")}
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed mb-8">
            {t("directSalesPage.powerSellers.desc")}
          </p>
          <div className="max-w-2xl mx-auto bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg p-6 md:p-8">
            <Quote className="h-8 w-8 text-primary-foreground/50 mx-auto mb-4" />
            <p className="text-primary-foreground italic leading-relaxed mb-4">
              {t("directSalesPage.powerSellers.quote")}
            </p>
            <p className="text-primary-foreground/70 text-sm font-semibold">
              {t("directSalesPage.powerSellers.quoteAuthor")}
            </p>
          </div>
        </div>
      </section>

      {/* ── VELOCITY HIGHLIGHTS ───────────────────────────────────── */}
      <section className="bg-muted/30">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { value: t("directSalesPage.stats.daysValue"), label: t("directSalesPage.stats.daysLabel") },
              { value: t("directSalesPage.stats.countriesValue"), label: t("directSalesPage.stats.countriesLabel") },
              { value: t("directSalesPage.stats.feesValue"), label: t("directSalesPage.stats.feesLabel") },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl md:text-3xl font-bold text-primary">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES & SUBCATEGORIES ────────────────────────────── */}
      {categories.length > 0 && (
        <section className="bg-background">
          <div className="container mx-auto px-4 py-12 md:py-20">
            <div className="text-center mb-12">
              <p className="uppercase text-xs tracking-[0.2em] font-semibold text-primary mb-2">
                {t("directSalesPage.categories.eyebrow")}
              </p>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                {t("directSalesPage.categories.title")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <div
                  key={category.slug}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                >
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    {category.name}
                    {category.subcategories && category.subcategories.length > 0 && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {category.subcategories.length}
                      </span>
                    )}
                  </h3>

                  {category.subcategories && category.subcategories.length > 0 ? (
                    <ul className="space-y-2">
                      {category.subcategories.map((subcategory) => (
                        <li
                          key={subcategory.slug}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ChevronRight className="h-4 w-4 text-primary/60" />
                          {subcategory.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">{t("directSalesPage.categories.noSubcategories")}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default DirectSalesPage;
