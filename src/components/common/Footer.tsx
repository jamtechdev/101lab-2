// @ts-nocheck
import { Link, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/greenbidz_logo.png";
import { useLanguageAwareCategories } from "@/hooks/useLanguageAwareCategories";
import { SITE_FULL_NAME } from "@/config/branding";
import { useTranslation } from "react-i18next";

const MONDAY_FORM_URL = "https://forms.monday.com/";

const Footer = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { data: categoriesData } = useLanguageAwareCategories();

  const supportLinks = [
    { label: t("footer.faq"), href: "#" },
    { label: t("footer.shipping"), href: "#" },
    { label: t("footer.escrow"), href: "#" },
    { label: t("footer.contactUs"), href: "#" },
  ];

  const companyLinks = [
    { label: t("footer.aboutUs"), href: "#" },
    { label: t("footer.privacyPolicy"), href: "#" },
    { label: t("footer.termsOfService"), href: "#" },
  ];

  const labLinks = [
    { label: t("footer.blogs"), to: "/blog" },
    { label: t("footer.wantedItems"), to: "/wanted" },
  ];
  const categories: any[] = Array.isArray(categoriesData)
    ? categoriesData
    : (categoriesData as any)?.data ?? [];

  return (
    <footer className="bg-foreground text-card">
      {/* CTA banner */}
      {/* <div className="border-b border-card/10">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="GreenBidz" className="h-6 w-auto brightness-200" />
            <p className="text-sm text-card/80">
              {t("footer.ctaBannerText")} | <span className="font-semibold text-card">GreenBidz</span>
            </p>
          </div>
          <a href={MONDAY_FORM_URL} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 rounded px-4">
              {t("footer.ctaButton")}
            </Button>
          </a>
        </div>
      </div> */}

      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <img src={logo} alt="GreenBidz" className="h-7 w-auto brightness-200" />
              <p className="text-xs text-card/50 mt-1">{SITE_FULL_NAME}</p>
            </div>
            <p className="text-sm text-card/60 leading-relaxed mb-6">
              {t("footer.brandDesc")}
            </p>
            {/* Newsletter */}
            <div>
              <p className="text-sm font-semibold text-card/90 mb-2">{t("footer.newsletter")}</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-card/30" />
                  <input
                    type="email"
                    placeholder={t("footer.emailPlaceholder")}
                    className="w-full h-9 pl-9 pr-3 rounded-md border border-card/10 bg-card/5 text-sm text-card/85 placeholder:text-card/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs">
                  {t("footer.subscribe")}
                </Button>
              </div>
            </div>
          </div>

          {/* Shop by Category — dynamic */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-semibold text-card/95 mb-4 uppercase tracking-wide">{t("footer.shopByCategory")}</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {categories.slice(0, 12).map((cat: any) => {
                const label = cat.name || cat.label || cat.term || cat.category_name || "";
                const slug = cat.slug || cat.term_slug || label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                if (!label) return null;
                return (
                  <li key={cat.term_id || cat.id || slug}>
                    <button
                      onClick={() => navigate(`/buyer-marketplace?category=${slug}`)}
                      className="text-sm text-card/55 hover:text-card/90 transition-colors text-left"
                    >
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-card/95 mb-4 uppercase tracking-wide">{t("footer.support")}</h4>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-card/55 hover:text-card/90 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Blogs */}
          <div>
            <h4 className="text-sm font-semibold text-card/95 mb-4 uppercase tracking-wide">{t("footer.blogs")}</h4>
            <ul className="space-y-2">
              {labLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-card/55 hover:text-card/90 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-card/95 mb-4 uppercase tracking-wide">{t("footer.company")}</h4>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-card/55 hover:text-card/90 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-card/10">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-card/40">
            © {new Date().getFullYear()} GreenBidz — {SITE_FULL_NAME}. {t("footer.allRightsReserved")}
          </p>
          <div className="flex items-center gap-4 text-xs text-card/40">
            <a href="#" className="hover:text-card/70 transition-colors">{t("footer.privacy")}</a>
            <a href="#" className="hover:text-card/70 transition-colors">{t("footer.terms")}</a>
            <a href="#" className="hover:text-card/70 transition-colors">{t("footer.cookies")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
