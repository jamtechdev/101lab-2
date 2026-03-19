import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/greenbidz_logo.png";

const shopLinks = [
  { label: "Machining Centers", to: "/buyer-marketplace?category=machining-centers" },
  { label: "Lathes", to: "/buyer-marketplace?category=lathes" },
  { label: "Milling Machines", to: "/buyer-marketplace?category=milling-machines" },
  { label: "Boring & Drilling", to: "/buyer-marketplace?category=boring-drilling" },
  { label: "Grinding & Finishing", to: "/buyer-marketplace?category=grinding-finishing" },
  { label: "Press Brakes & Shears", to: "/buyer-marketplace?category=press-brakes-shears" },
  { label: "Laser & Plasma", to: "/buyer-marketplace?category=laser-plasma" },
  { label: "Welding", to: "/buyer-marketplace?category=welding" },
  { label: "Scrap", to: "/buyer-marketplace?category=scrap" },
];

const sellLinks = [
  { label: "List a Machine", href: "#" },
  { label: "Valuation Services", href: "#" },
  { label: "Liquidations", href: "#" },
];

const supportLinks = [
  { label: "FAQ", href: "#" },
  { label: "Shipping & Logistics", href: "#" },
  { label: "Secure Escrow", href: "#" },
  { label: "Contact Us", href: "#" },
];

const companyLinks = [
  { label: "About GreenBidz", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
];

const Footer = () => {
  return (
    <footer className="bg-[hsl(220_20%_12%)] text-[hsl(0_0%_85%)]">
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <img src={logo} alt="GreenBidz" className="h-7 w-auto mb-4 brightness-200" />
            <p className="text-sm text-[hsl(0_0%_60%)] leading-relaxed mb-6">
              Asia's leading B2B marketplace for used industrial metalworking machinery.
            </p>
            {/* Newsletter */}
            <div>
              <p className="text-sm font-semibold text-[hsl(0_0%_90%)] mb-2">Newsletter</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(0_0%_45%)]" />
                  <input
                    type="email"
                    placeholder="Your email"
                    className="w-full h-9 pl-9 pr-3 rounded-md border border-[hsl(220_15%_22%)] bg-[hsl(220_18%_16%)] text-sm text-[hsl(0_0%_85%)] placeholder:text-[hsl(0_0%_40%)] focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-sm font-semibold text-[hsl(0_0%_95%)] mb-4 uppercase tracking-wide">Shop</h4>
            <ul className="space-y-2">
              {shopLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-[hsl(0_0%_55%)] hover:text-[hsl(0_0%_90%)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sell */}
          <div>
            <h4 className="text-sm font-semibold text-[hsl(0_0%_95%)] mb-4 uppercase tracking-wide">Sell</h4>
            <ul className="space-y-2">
              {sellLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-[hsl(0_0%_55%)] hover:text-[hsl(0_0%_90%)] transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-[hsl(0_0%_95%)] mb-4 uppercase tracking-wide">Support</h4>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-[hsl(0_0%_55%)] hover:text-[hsl(0_0%_90%)] transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-[hsl(0_0%_95%)] mb-4 uppercase tracking-wide">Company</h4>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-[hsl(0_0%_55%)] hover:text-[hsl(0_0%_90%)] transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[hsl(220_15%_18%)]">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[hsl(0_0%_40%)]">
            © {new Date().getFullYear()} GreenBidz. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-[hsl(0_0%_40%)]">
            <a href="#" className="hover:text-[hsl(0_0%_70%)] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[hsl(0_0%_70%)] transition-colors">Terms</a>
            <a href="#" className="hover:text-[hsl(0_0%_70%)] transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
