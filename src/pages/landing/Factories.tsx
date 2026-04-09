import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Users,
  CheckCircle2,
  FileText,
  Leaf,
  Shield,
  Upload,
  Settings,
  Gavel,
  BarChart3,
  Factory,
  DollarSign,
  FileCheck,
  Recycle,
  Eye
} from "lucide-react";
import logo from "@/assets/greenbidz_logo.png";
import heroImage from "@/assets/factories-hero.jpg";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useTranslation } from 'react-i18next';
import Header from "@/components/common/Header";
import SEOMeta from "@/components/common/SEOMeta";
import { getSEO } from "@/config/seoConfig";

const Factories = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const benefits = [
    {
      icon: Settings,
      title: t('factories.benefits.centralized.title'),
      description: t('factories.benefits.centralized.desc')
    },
    {
      icon: TrendingUp,
      title: t('factories.benefits.moreOffers.title'),
      description: t('factories.benefits.moreOffers.desc')
    },
    {
      icon: CheckCircle2,
      title: t('factories.benefits.fasterApprovals.title'),
      description: t('factories.benefits.fasterApprovals.desc')
    },
    {
      icon: FileText,
      title: t('factories.benefits.traceability.title'),
      description: t('factories.benefits.traceability.desc')
    },
    {
      icon: Leaf,
      title: t('factories.benefits.insights.title'),
      description: t('factories.benefits.insights.desc')
    },
    {
      icon: Shield,
      title: t('factories.benefits.audit.title'),
      description: t('factories.benefits.audit.desc')
    }
  ];

  const steps = [
    {
      icon: Upload,
      title: t('factories.howItWorks.step1.title'),
      description: t('factories.howItWorks.step1.desc')
    },
    {
      icon: Settings,
      title: t('factories.howItWorks.step2.title'),
      description: t('factories.howItWorks.step2.desc')
    },
    {
      icon: Users,
      title: t('factories.howItWorks.step3.title'),
      description: t('factories.howItWorks.step3.desc')
    },
    {
      icon: Gavel,
      title: t('factories.howItWorks.step4.title'),
      description: t('factories.howItWorks.step4.desc')
    },
    {
      icon: BarChart3,
      title: t('factories.howItWorks.step5.title'),
      description: t('factories.howItWorks.step5.desc')
    }
  ];

  const stakeholders = [
    {
      icon: Factory,
      title: t('factories.stakeholders.operations.title'),
      description: t('factories.stakeholders.operations.desc')
    },
    {
      icon: DollarSign,
      title: t('factories.stakeholders.procurement.title'),
      description: t('factories.stakeholders.procurement.desc')
    },
    {
      icon: FileCheck,
      title: t('factories.stakeholders.finance.title'),
      description: t('factories.stakeholders.finance.desc')
    },
    {
      icon: Recycle,
      title: t('factories.stakeholders.sustainability.title'),
      description: t('factories.stakeholders.sustainability.desc')
    }
  ];

  const seoData = getSEO('factories');

  return (
    <div className="min-h-screen bg-background">
      <SEOMeta {...seoData} />
      {/* Header */}
      {/* <header className="border-b border-border bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img 
            src={logo} 
            alt="101Recycle" 
            className="h-8 w-auto cursor-pointer"
            onClick={() => navigate("/")}
          />
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/factories")}>
              {t('nav.factories')}
            </Button>
            <Button variant="ghost" onClick={() => navigate("/resellers")}>
              {t('nav.resellers')}
            </Button>
            <LanguageSwitcher />
            <Button variant="outline" onClick={() => navigate("/auth?type=buyer")}>
              {t('nav.buyerLogin')}
            </Button>
            <Button onClick={() => navigate("/auth")} className="bg-accent hover:bg-accent/90">
              {t('nav.sellerLogin')}
            </Button>
          </div>
        </div>
      </header> */}
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-hero overflow-hidden">
        {/* Hero Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Factory warehouse"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-accent/20 via-accent/40 to-accent/60" />
        </div>

        {/* Content */}
        <div className="relative container mx-auto max-w-5xl text-center py-32 px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            {t('factories.hero.title')}
          </h1>
          <p className="text-xl md:text-2xl text-white/95 mb-8 max-w-4xl mx-auto drop-shadow-md">
            {t('factories.hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="shadow-lg hover:shadow-xl transition-all">
              {t('factories.hero.bookDemo')}
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm shadow-lg">
              {t('factories.hero.talkToTeam')}
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-10 sm:py-20 sm:px-4 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-6">
              {t('factories.problem.title')}
            </h2>
          </div>
          <Card className="p-3 sm:p-8 md:p-12 bg-gradient-card border-2 border-border hover:border-accent/50 transition-all shadow-medium">
            <p className="text-sm sm:text-lg  text-muted-foreground mb-6 font-medium">
              {t('factories.problem.intro')}
            </p>
            <ul className="space-y-4 text-sm sm:text-lg  text-muted-foreground mb-8">
              <li className="flex items-start gap-3">
                <span className="text-accent mt-1 text-xl">•</span>
                <span>{t('factories.problem.point1')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-1 text-xl">•</span>
                <span>{t('factories.problem.point2')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-1 text-xl">•</span>
                <span>{t('factories.problem.point3')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-1 text-xl">•</span>
                <span>{t('factories.problem.point4')}</span>
              </li>
            </ul>
            <p className="text-sm sm:text-lg  font-bold text-accent bg-accent/10 p-4 rounded-lg">
              {t('factories.problem.result')}
            </p>
          </Card>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-10 sm:py-20 sm:px-4 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-6">
              {t('factories.solution.title')}
            </h2>
          </div>
          <div className="max-w-4xl mx-auto">
            <p className="text-sm sm:text-lg  text-muted-foreground mb-6 font-medium">
              {t('factories.solution.intro')}
            </p>
            <ul className="space-y-4 text-sm sm:text-lg  text-muted-foreground mb-8">
              <li className="flex items-start gap-3 bg-card p-4 rounded-lg border border-border hover:border-accent/50 transition-all">
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <span>{t('factories.solution.point1')}</span>
              </li>
              <li className="flex items-start gap-3 bg-card p-4 rounded-lg border border-border hover:border-accent/50 transition-all">
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <span>{t('factories.solution.point2')}</span>
              </li>
              <li className="flex items-start gap-3 bg-card p-4 rounded-lg border border-border hover:border-accent/50 transition-all">
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <span>{t('factories.solution.point3')}</span>
              </li>
              <li className="flex items-start gap-3 bg-card p-4 rounded-lg border border-border hover:border-accent/50 transition-all">
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <span>{t('factories.solution.point4')}</span>
              </li>
            </ul>
            <Card className="p-6 bg-gradient-card border-2 border-accent/50 shadow-medium">
              <p className="text-sm sm:text-lg  text-muted-foreground mb-4 text-center">
                {t('factories.solution.summary')}
              </p>
              <p className="text-2xl font-bold text-accent text-center">
                {t('factories.solution.tagline')}
              </p>
            </Card>
          </div>
        </div>
      </section>


      {/* Key Benefits */}
      <section className="py-10 sm:py-20 sm:px-4 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-4">
              {t('factories.benefits.title')}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="p-6 bg-gradient-card border-2 border-border hover:border-accent hover:shadow-medium transition-all group">
                  <div className="w-14 h-14 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 group-hover:scale-110 transition-all">
                    <Icon className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-10 sm:py-20 sm:px-4 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-4">
              {t('factories.howItWorks.title')}
            </h2>
          </div>
          <div className="space-y-6 max-w-4xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={index} className="p-6 bg-gradient-card border-2 border-border hover:border-accent hover:shadow-medium transition-all">
                  <div className="flex gap-6 items-start">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center border-2 border-accent/20">
                        <Icon className="w-8 h-8 text-accent" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-bold text-accent bg-accent/10 px-3 py-1 rounded-full">
                          {index + 1}
                        </span>
                        <h3 className="text-xl font-bold text-foreground">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stakeholder Value */}
      <section className="py-10 sm:py-20 sm:px-4 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-4">
              {t('factories.stakeholders.title')}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {stakeholders.map((stakeholder, index) => {
              const Icon = stakeholder.icon;
              return (
                <Card key={index} className="p-6 bg-gradient-card border-2 border-border hover:border-accent hover:shadow-medium transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 group-hover:scale-110 transition-all">
                      <Icon className="w-7 h-7 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {stakeholder.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {stakeholder.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tracking Section */}
      <section className="py-10 sm:py-20 sm:px-4 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-4">
              {t('factories.tracking.title')}
            </h2>
            <p className="text-sm sm:text-lg  text-muted-foreground max-w-3xl mx-auto">
              {t('factories.tracking.subtitle')}
            </p>
          </div>

          {/* Tracking Table */}
          <Card className="overflow-hidden border-2 border-border animate-fade-in">
            <div className="bg-accent/5 px-6 py-4 border-b border-border">
              <h3 className="text-xl font-bold text-foreground">所有提交</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-accent/5 border-b border-border">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">{t('factories.tracking.batchId')}</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">{t('factories.tracking.type')}</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">{t('factories.tracking.items')}</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">{t('factories.tracking.value')}</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">{t('factories.tracking.bids')}</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">{t('factories.tracking.date')}</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">{t('factories.tracking.status')}</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">{t('factories.tracking.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Batch 1 - Live */}
                  <tr className="border-b border-border hover:bg-accent/5 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-semibold text-foreground">BATCH-001</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">{t('factories.tracking.surplusAssets')}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">12</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">$45,000</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">8</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">2025-01-15</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {t('factories.tracking.liveForBids')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        {t('factories.tracking.view')}
                      </Button>
                    </td>
                  </tr>

                  {/* Batch 2 - Inspection */}
                  <tr className="border-b border-border hover:bg-accent/5 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-semibold text-foreground">BATCH-002</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">{t('factories.tracking.scrap')}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">5</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">$12,500</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">0</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">2025-01-20</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        {t('factories.tracking.inspectionScheduled')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        {t('factories.tracking.view')}
                      </Button>
                    </td>
                  </tr>

                  {/* Batch 3 - Under Review */}
                  <tr className="border-b border-border hover:bg-accent/5 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-semibold text-foreground">BATCH-003</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">{t('factories.tracking.surplusAssets')}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">8</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">$28,750</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">0</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">2025-01-25</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        {t('factories.tracking.underReview')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        {t('factories.tracking.view')}
                      </Button>
                    </td>
                  </tr>

                  {/* Batch 4 - Closed */}
                  <tr className="border-b border-border hover:bg-accent/5 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-semibold text-foreground">BATCH-004</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">{t('factories.tracking.scrap')}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">15</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">$67,200</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">12</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">2025-01-10</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-500/10 text-gray-600 border border-gray-500/20">
                        {t('factories.tracking.closed')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        {t('factories.tracking.view')}
                      </Button>
                    </td>
                  </tr>

                  {/* Batch 5 - Live */}
                  <tr className="hover:bg-accent/5 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-semibold text-foreground">BATCH-005</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">{t('factories.tracking.surplusAssets')}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">20</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">$89,000</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">15</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">2025-01-18</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {t('factories.tracking.liveForBids')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        {t('factories.tracking.view')}
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 px-4 bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-accent/40" />
        <div className="relative container mx-auto max-w-5xl text-center">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 drop-shadow-lg">
            {t('factories.finalCta.title')}
          </h2>
          <p className="text-xl text-white/95 mb-8 max-w-4xl mx-auto drop-shadow-md">
            {t('factories.finalCta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="shadow-lg hover:shadow-xl transition-all">
              {t('factories.hero.bookDemo')}
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm shadow-lg">
              {t('factories.hero.talkToTeam')}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 bg-card">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>{t('footer.copyright', { company: '101Recycle' })}</p>
        </div>
      </footer>
    </div>
  );
};

export default Factories;
