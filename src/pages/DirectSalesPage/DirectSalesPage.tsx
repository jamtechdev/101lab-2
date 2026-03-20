import { useState } from "react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Globe2, Gavel, Megaphone, HeadphonesIcon, Send,
  Upload, ListChecks, Handshake, ChevronRight, Quote,
} from "lucide-react";
import heroImg from "@/assets/direct-sales/hero-reseller.jpg";

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
const DirectSalesPage = () => {
  const [form, setForm] = useState({
    companyName: "",
    fullName: "",
    email: "",
    phone: "",
    country: "",
    inventoryType: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Direct sales lead:", form);
  };

  const partners = [
    {
      icon: Globe2,
      title: "Global Exposure",
      desc: "Instantly put your equipment in front of verified buyers from over 100 countries through our active marketplace.",
    },
    {
      icon: Gavel,
      title: "Advanced Auction Tools",
      desc: "Use our proprietary bidding engine to run timed auctions or 'Buy It Now' listings with full control.",
    },
    {
      icon: Megaphone,
      title: "Zero Marketing Overhead",
      desc: "We handle the SEO, global email marketing, and lead generation so you can focus on sourcing inventory.",
    },
    {
      icon: HeadphonesIcon,
      title: "Dedicated Support",
      desc: "Power Sellers get access to a priority account manager to help optimise listings and logistics.",
    },
  ];

  const steps = [
    {
      icon: Upload,
      title: "Onboard",
      desc: "Apply for a Power Seller account. Once verified, you gain access to our bulk-upload tools and dashboard.",
    },
    {
      icon: ListChecks,
      title: "List",
      desc: "Post your machinery with detailed specs, photos, and your preferred pricing strategy — single or bulk.",
    },
    {
      icon: Handshake,
      title: "Close",
      desc: "Manage inquiries through our secure portal and finalise sales using our automated invoicing system.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* ── HERO BANNER ──────────────────────────────────────────── */}
      <section className="relative h-[340px] sm:h-[400px] lg:h-[460px] overflow-hidden">
        <img
          src={heroImg}
          alt="Direct Sales at 101Machines"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <p className="uppercase text-xs sm:text-sm tracking-[0.2em] text-primary-foreground/80 mb-3 font-medium">
            BUY DIRECTLY FROM INSOLVENCY, LIQUIDATION, CLOSURE OR MODERNISATION
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-foreground max-w-3xl leading-tight">
            Direct Sales at 101Machines
          </h1>
        </div>
      </section>

      {/* ── INTRO ────────────────────────────────────────────────── */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4">
            Maximize Your Reach. Scale Your Sales.
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Stop chasing leads and start closing deals. List your surplus machinery on the world's
            most active industrial marketplace and leverage our global buyer network to move
            inventory faster and at higher margins.
          </p>
        </div>
      </section>

      {/* ── WHY PARTNER ──────────────────────────────────────────── */}
      <section className="bg-muted/30">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="text-center mb-10">
            <p className="uppercase text-xs tracking-[0.2em] font-semibold text-primary mb-2">
              Why Partner with Us?
            </p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              We provide the technology — you provide the inventory
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
              How It Works
            </p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              Three steps to start selling
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
            Designed for Power Sellers
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed mb-8">
            Whether you are an independent broker, a regional dealer, or a corporate asset
            manager — our platform is built to handle high-volume inventory with ease.
          </p>
          <div className="max-w-2xl mx-auto bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg p-6 md:p-8">
            <Quote className="h-8 w-8 text-primary-foreground/50 mx-auto mb-4" />
            <p className="text-primary-foreground italic leading-relaxed mb-4">
              "Our partnership with 101Machines has increased our turnover rate by 40%. It's the
              easiest way to reach international buyers without the international headache."
            </p>
            <p className="text-primary-foreground/70 text-sm font-semibold">
              — Current Reseller Partner
            </p>
          </div>
        </div>
      </section>

      {/* ── APPLICATION FORM ─────────────────────────────────────── */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <p className="uppercase text-xs tracking-[0.2em] font-semibold text-primary mb-2">
                Ready to expand your footprint?
              </p>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
                Apply to Become a Reseller
              </h2>
              <p className="text-muted-foreground text-sm">
                No upfront fees. Pay only when you sell.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 bg-card border border-border rounded-lg p-6 md:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { name: "companyName", label: "Company Name", placeholder: "Your company" },
                  { name: "fullName", label: "Full Name", placeholder: "First and last name" },
                  { name: "email", label: "Email Address", placeholder: "you@company.com", type: "email" },
                  { name: "phone", label: "Phone Number", placeholder: "+1 234 567 890" },
                  { name: "country", label: "Country", placeholder: "Country" },
                  { name: "inventoryType", label: "Inventory Type", placeholder: "CNC, Presses, Vehicles…" },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {f.label} <span className="text-destructive">*</span>
                    </label>
                    <Input
                      name={f.name}
                      type={(f as any).type || "text"}
                      placeholder={f.placeholder}
                      value={(form as any)[f.name]}
                      onChange={handleChange}
                      required
                      className="border-border"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Tell us about your inventory <span className="text-destructive">*</span>
                </label>
                <Textarea
                  name="message"
                  placeholder="Describe the type and volume of equipment you typically sell…"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="border-border"
                />
              </div>

              <Button type="submit" className="w-full sm:w-auto px-8">
                <Send className="h-4 w-4 mr-2" />
                Apply Now
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* ── VELOCITY HIGHLIGHTS ───────────────────────────────────── */}
      <section className="bg-muted/30">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { value: "< 30 Days", label: "Average Days on Market" },
              { value: "100+", label: "Countries with Active Buyers" },
              { value: "0%", label: "Upfront Listing Fees" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl md:text-3xl font-bold text-primary">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DirectSalesPage;