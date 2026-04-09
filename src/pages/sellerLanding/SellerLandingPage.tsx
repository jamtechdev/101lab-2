import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import SEOMeta from "@/components/common/SEOMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Check, ChevronDown, ChevronUp, Send, TrendingUp, Globe2,
  FileText, Truck, Shield, DollarSign, BarChart3, Users, Upload,
} from "lucide-react";
import { PHONE_CODES } from "@/config/phoneCodes";
import heroImg from "@/assets/seller-landing/hero-handshake.jpg";
import benefitsImg from "@/assets/seller-landing/benefits-worker.jpg";
import servicesImg from "@/assets/seller-landing/services-inspector.jpg";
import officeImg from "@/assets/seller-landing/office-building.jpg";

/* ─── Accordion Item ──────────────────────────────────────────────────────── */
const AccordionStep = ({
  num,
  title,
  description,
  isOpen,
  onToggle,
}: {
  num: number;
  title: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <div className="border-b border-border">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-4 px-5 text-left hover:bg-muted/50 transition-colors"
    >
      <span className="text-sm md:text-base font-semibold text-foreground">
        {num}. {title}
      </span>
      {isOpen ? (
        <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      ) : (
        <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      )}
    </button>
    {isOpen && (
      <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed animate-fade-in">
        {description}
      </div>
    )}
  </div>
);

/* ─── Testimonial Card ────────────────────────────────────────────────────── */
const TestimonialCard = ({
  name,
  company,
  industry,
  quote,
}: {
  name: string;
  company: string;
  industry: string;
  quote: string;
}) => (
  <div className="bg-card border border-border rounded-lg p-6 flex flex-col gap-4">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-lg font-bold text-primary">
          {name.charAt(0)}
        </span>
      </div>
      <div>
        <p className="font-semibold text-foreground text-sm">{name}</p>
        <p className="text-xs text-muted-foreground">{company}</p>
        <p className="text-xs text-primary">{industry}</p>
      </div>
    </div>
    <p className="text-sm text-muted-foreground leading-relaxed italic">
      "{quote}"
    </p>
  </div>
);

/* ─── Check Item ──────────────────────────────────────────────────────────── */
const CheckItem = ({ text }: { text: string }) => (
  <div className="flex items-start gap-2">
    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
    <span className="font-semibold text-foreground text-sm md:text-base">{text}</span>
  </div>
);

/* ─── Stat Card ───────────────────────────────────────────────────────────── */
const StatCard = ({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
}) => (
  <div className="text-center">
    <Icon className="h-8 w-8 text-primary mx-auto mb-2" />
    <p className="text-2xl md:text-3xl font-bold text-primary">{value}</p>
    <p className="text-sm text-muted-foreground mt-1">{label}</p>
  </div>
);

/* ════════════════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                                  */
/* ════════════════════════════════════════════════════════════════════════════ */
const SellerLandingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [openStep, setOpenStep] = useState<number | null>(0);

  const [form, setForm] = useState({
    companyName: "",
    fullName: "",
    phoneCode: "+886",
    phone: "",
    companyEmail: "",
    message: "",
    attachment: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, attachment: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.companyName.trim() || !form.fullName.trim() || !form.companyEmail.trim() || !form.phone.trim() || !form.message.trim()) {
      toast.error("All fields are required.");
      return;
    }

    setSubmitting(true);
    try {
      const productionUrl = import.meta.env.VITE_PRODUCTION_URL || "http://localhost:4000/api/v1/";
      const endpoint = `${productionUrl.replace("/api/v1/", "")}/api/v1/sales/submit-deal`;

      const formData = new FormData();
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
        body: formData,
      });

      const result = await response.json() as { ok?: boolean; error?: string; itemId?: string };

      if (result?.ok) {
        toast.success("Your enquiry has been submitted! We'll be in touch shortly.");
        setForm({ companyName: "", fullName: "", phoneCode: "+886", phone: "", companyEmail: "", message: "", attachment: null });
        return;
      }

      toast.error(result?.error || "Could not submit. Please try again.");
    } catch (err: any) {
      toast.error(err?.message || "Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    {
      title: "Consulting and evaluation",
      description:
        "You tell us what's for sale, we tell you what your assets are worth! Our experts use a comprehensive sales database constantly updated with real auction prices. Our market-driven evaluation is the best basis for your sales success.",
    },
    {
      title: "International marketing",
      description:
        "Use the reach and sales power of our auction platform to market your machines and inventories professionally and internationally. We advertise your offer in a targeted manner and get more for you!",
    },
    {
      title: "Full service",
      description:
        "No matter what, how much or how you sell — 101Machines does all the work for you! We clean the machines, create product catalogues, organize inspections, and optimize every detail. After the sale we handle disassembly, transport, and customs.",
    },
    {
      title: "Fastest possible payout",
      description:
        "International invoice management is handled by our specialists who ensure the invoice reaches the buyer promptly and in accordance with the law. We handle VAT and origin management smoothly so you receive your money as quickly as possible!",
    },
  ];

  const testimonials = [
    {
      name: "James Chen",
      company: "Pacific Metal Works, Taiwan",
      industry: "Sheet metal processing",
      quote:
        "We noticed how competent and pleasant working with 101Machines is, even after the first project. Their large network means the right buyer is always found, even for complex systems.",
    },
    {
      name: "Marcus Weber",
      company: "Weber Industrietechnik, Germany",
      industry: "Used machinery trade",
      quote:
        "I have been working with 101Machines for years. With them, I have a reliable and consistently fair partner. Projects are managed with extreme competence and professionalism.",
    },
    {
      name: "Sarah Thompson",
      company: "Precision Engineering Ltd, UK",
      industry: "Precision mechanics",
      quote:
        "101Machines is a reliable and professional partner that offers a smooth and hassle-free service. Their support and guidance throughout the process were invaluable and exceeded my expectations.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOMeta
        title="Sell With GreenBidz - Global Marketplace for Equipment & Materials"
        description="List and sell your equipment globally. Reach thousands of verified buyers. Fast approvals, transparent pricing, and secure transactions with GreenBidz."
        keywords="sell equipment online, marketplace for sellers, industrial equipment sales, global buyer network"
        type="website"
      />
      <Header />

      {/* ── HERO + FORM ─────────────────────────────────────────────────── */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-10 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left — Image + overlay text */}
            <div className="relative rounded-lg overflow-hidden h-[300px] sm:h-[400px] lg:h-full lg:min-h-[600px]">
              <img
                src={heroImg}
                alt="Sell your used machinery"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                  Fill out our form and we will take care of the rest!
                </h2>
                <p className="text-sm text-white/80 leading-relaxed">
                  Sell your used machines quickly and easily! With our
                  international network, we will find the right buyer for your
                  equipment.
                </p>
              </div>
            </div>

            {/* Right — Contact Form */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
                Make the most of your used machinery
              </h1>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Company Name <span className="text-destructive">*</span>
                  </label>
                  <Input name="companyName" placeholder="Company name" value={form.companyName} onChange={handleChange} required className="border-border" />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <Input name="fullName" placeholder="First and last name" value={form.fullName} onChange={handleChange} required className="border-border" />
                </div>

                {/* Phone with Country Code */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Country Code & Phone <span className="text-destructive">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="phoneCode"
                      value={form.phoneCode}
                      onChange={handleChange}
                      className="border border-border rounded-md bg-background text-foreground text-sm px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary w-40 shrink-0"
                    >
                      {PHONE_CODES.filter(c => ["China", "Indonesia", "India", "Malaysia", "Taiwan", "Thailand", "Japan", "Vietnam"].includes(c.country)).map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                    <Input name="phone" type="tel" placeholder="Phone number" value={form.phone} onChange={handleChange} required className="border-border flex-1" />
                  </div>
                </div>

                {/* Company Email */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Company Email <span className="text-destructive">*</span>
                  </label>
                  <Input name="companyEmail" type="email" placeholder="company@example.com" value={form.companyEmail} onChange={handleChange} required className="border-border" />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Message <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    name="message"
                    placeholder="Describe your inquiry or what you want to sell…"
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
                    Attachment (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      onChange={handleFileChange}
                      className="border-border flex-1"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png,.gif"
                    />
                    {form.attachment && (
                      <span className="text-sm text-muted-foreground">{form.attachment.name}</span>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full sm:w-auto px-8" disabled={submitting}>
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? "Sending…" : "Send request"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUE BEYOND USE ────────────────────────────────────────────── */}
      <section className="bg-muted/30">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <p className="uppercase text-xs tracking-[0.2em] font-semibold text-primary mb-2">
            No matter what type of machine you want to sell, you've come to the right place!
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Value Beyond Use
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Leave the search for the right buyer to the experts from 101Machines.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our experienced team will ensure that your machine achieves the best price.
                Trust the industry's most trusted Auction &amp; Marketplace Network!
              </p>
            </div>
            <div className="rounded-lg overflow-hidden shadow-medium">
              <img
                src={servicesImg}
                alt="Expert using tablet in factory"
                className="w-full h-[280px] md:h-[320px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── YOUR BENEFITS ───────────────────────────────────────────────── */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="rounded-lg overflow-hidden shadow-medium order-2 lg:order-1">
              <img
                src={benefitsImg}
                alt="Worker inspecting machinery"
                className="w-full h-[280px] md:h-[360px] object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                Your Benefits
              </h2>
              <div className="space-y-4">
                <CheckItem text="High proceeds" />
                <CheckItem text="Trouble-free processes" />
                <CheckItem text="Prompt payment" />
                <CheckItem text="Comprehensive services" />
              </div>
            </div>        
          </div>
        </div>
      </section>

      {/* ── OUR SERVICES ────────────────────────────────────────────────── */}
      <section className="bg-muted/30">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                Our services
              </h2>
              <div className="space-y-4">
                <CheckItem text="Professional valuations" />
                <CheckItem text="Worldwide online marketing" />
                <CheckItem text="Online auctions in 50+ Countries" />
                <CheckItem text="Invoice management" />
                <CheckItem text="Dismantling, transport, customs formalities etc." />
              </div>
            </div>
            <div className="rounded-lg overflow-hidden shadow-medium">
              <img
                src={servicesImg}
                alt="Inspector with tablet"
                className="w-full h-[280px] md:h-[360px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── FOUR STEPS TO SUCCESS ───────────────────────────────────────── */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <h2 className="text-xl md:text-2xl font-bold text-foreground text-center mb-10 italic">
            Only four steps to your success:
          </h2>
          <div className="max-w-2xl mx-auto border border-border rounded-lg overflow-hidden bg-card">
            {steps.map((step, i) => (
              <AccordionStep
                key={i}
                num={i + 1}
                title={step.title}
                description={step.description}
                isOpen={openStep === i}
                onToggle={() => setOpenStep(openStep === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA + OFFICE IMAGE ──────────────────────────────────────────── */}
      <section className="bg-muted/50">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="rounded-lg overflow-hidden shadow-medium">
              <img
                src={officeImg}
                alt="101Machines office"
                className="w-full h-[280px] md:h-[380px] object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-5 leading-snug">
                To sell used machines at first-class conditions, you need first-rate partners.
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                101Machines has a wealth of experience in the used machinery market and can create
                the optimum solution for you. Whether you are looking for individual machines or
                complete plants, you will receive the best price currently available on the market
                through our auction platform.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We take over the global marketing of your surplus machines on our platform — you
                can rely on the industry's best-selling auction network. We organise the entire
                sales process and get more for you.
              </p>
              <p className="text-sm font-semibold text-foreground">
                Benefit now from the reach of our platform with millions of impressions, thousands
                of industrial goods sold and buyers worldwide!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────────── */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: BarChart3, value: "50M+", label: "Impressions" },
              { icon: Shield, value: "10,000+", label: "Industrial Goods Sold" },
              { icon: Users, value: "500K+", label: "Users Worldwide" },
              { icon: Globe2, value: "50+", label: "Countries" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary-foreground/80" />
                <p className="text-2xl md:text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-primary-foreground/80 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <p className="uppercase text-xs tracking-[0.2em] font-semibold text-primary text-center mb-2">
            What our sellers say
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
            Why you should sell with 101Machines
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <TestimonialCard key={i} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
      <section className="bg-primary">
        <div className="container mx-auto px-4 py-10 md:py-14 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-primary-foreground mb-4">
            Ready to sell your machinery?
          </h2>
          <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
            Get started today — fill out our contact form and our team will get back to you within 24 hours.
          </p>
          <Button
            variant="outline"
            className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary text-black"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Get in touch now
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SellerLandingPage;