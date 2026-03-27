import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Bell,
  CheckCircle2,
  FileText,
  Shield,
  UserPlus,
  Search,
  Eye,
  Gavel,
  Handshake,
  Package,
  BarChart3,
  Clock,
  Target
} from "lucide-react";
import logo from "@/assets/greenbidz_logo.png";
import heroImage from "@/assets/resellers-hero.jpg";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useTranslation } from 'react-i18next';
import Header from "@/components/common/Header";
import SEOMeta from "@/components/common/SEOMeta";

const Resellers = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const benefits = [
    {
      icon: TrendingUp,
      title: t('resellers.benefits.moreDealFlow.title'),
      description: t('resellers.benefits.moreDealFlow.desc')
    },
    {
      icon: FileText,
      title: t('resellers.benefits.betterInfo.title'),
      description: t('resellers.benefits.betterInfo.desc')
    },
    {
      icon: BarChart3,
      title: t('resellers.benefits.digitalBidding.title'),
      description: t('resellers.benefits.digitalBidding.desc')
    },
    {
      icon: Clock,
      title: t('resellers.benefits.fasterDecisions.title'),
      description: t('resellers.benefits.fasterDecisions.desc')
    },
    {
      icon: Shield,
      title: t('resellers.benefits.trust.title'),
      description: t('resellers.benefits.trust.desc')
    }
  ];

  const steps = [
    {
      icon: UserPlus,
      title: t('resellers.howItWorks.step1.title'),
      description: t('resellers.howItWorks.step1.desc')
    },
    {
      icon: Bell,
      title: t('resellers.howItWorks.step2.title'),
      description: t('resellers.howItWorks.step2.desc')
    },
    {
      icon: Eye,
      title: t('resellers.howItWorks.step3.title'),
      description: t('resellers.howItWorks.step3.desc')
    },
    {
      icon: Gavel,
      title: t('resellers.howItWorks.step4.title'),
      description: t('resellers.howItWorks.step4.desc')
    },
    {
      icon: Handshake,
      title: t('resellers.howItWorks.step5.title'),
      description: t('resellers.howItWorks.step5.desc')
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOMeta
        title="Recyclers & Resellers Marketplace - GreenBidz"
        description="Get daily requests from factories and manufacturers. Source quality equipment and materials at scale. Grow your recycling business with GreenBidz enterprise network."
        keywords="recycler marketplace, reseller platform, equipment sourcing, factory requests, bulk equipment"
        type="website"
      />
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
            alt="Recycling facility"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-accent/20 via-accent/40 to-accent/60" />
        </div>

        {/* Content */}
        <div className="relative container mx-auto max-w-5xl text-center py-32 px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            {t('resellers.hero.title')}
          </h1>
          <p className="text-xl md:text-2xl text-white/95 mb-8 max-w-4xl mx-auto drop-shadow-md">
            {t('resellers.hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="shadow-lg hover:shadow-xl transition-all">
              {t('resellers.hero.joinBuyer')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm shadow-lg"
              onClick={() => navigate("/buyer-marketplace")}
            >
              {t('resellers.hero.viewListings')}
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-10 sm:py-20 sm:px-4 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-6">
              {t('resellers.problem.title')}
            </h2>
          </div>
          <Card className="p-3 sm:p-8 md:p-12 bg-gradient-card border-2 border-border hover:border-accent/50 transition-all shadow-medium">
            <p className="text-lg text-muted-foreground mb-6 font-medium">
              {t('resellers.problem.intro')}
            </p>
            <ul className="space-y-4 text-lg text-muted-foreground mb-8">
              <li className="flex items-start gap-3">
                <span className="text-accent mt-1 text-xl">•</span>
                <span>{t('resellers.problem.point1')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-1 text-xl">•</span>
                <span>{t('resellers.problem.point2')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-1 text-xl">•</span>
                <span>{t('resellers.problem.point3')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-1 text-xl">•</span>
                <span>{t('resellers.problem.point4')}</span>
              </li>
            </ul>
            <p className="text-lg font-bold text-accent bg-accent/10 p-4 rounded-lg">
              {t('resellers.problem.result')}
            </p>
          </Card>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-10 sm:py-20 sm:px-4 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-6">
              {t('resellers.solution.title')}
            </h2>
          </div>
          <div className="max-w-4xl mx-auto">
            <p className="text-sm sm:text-lg text-muted-foreground mb-6 font-medium">
              {t('resellers.solution.intro')}
            </p>
            <ul className="space-y-4 text-lg text-muted-foreground mb-8">
              <li className="flex items-start gap-3 bg-card p-4 rounded-lg border border-border hover:border-accent/50 transition-all">
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <span>{t('resellers.solution.point1')}</span>
              </li>
              <li className="flex items-start gap-3 bg-card p-4 rounded-lg border border-border hover:border-accent/50 transition-all">
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <span>{t('resellers.solution.point2')}</span>
              </li>
              <li className="flex items-start gap-3 bg-card p-4 rounded-lg border border-border hover:border-accent/50 transition-all">
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <span>{t('resellers.solution.point3')}</span>
              </li>
              <li className="flex items-start gap-3 bg-card p-4 rounded-lg border border-border hover:border-accent/50 transition-all">
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <span>{t('resellers.solution.point4')}</span>
              </li>
            </ul>
            <Card className="p-6 bg-gradient-card border-2 border-accent/50 shadow-medium">
              <p className="text-xl font-bold text-accent text-center">
                {t('resellers.solution.summary')}
              </p>
            </Card>
          </div>
        </div>
      </section>


      {/* Daily Requests Section */}
      <section className="py-10 sm:py-20 sm:px-4 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
              </span>
              <span className="text-sm font-semibold">{t('resellers.dailyRequests.newToday')}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-4">
              {t('resellers.dailyRequests.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {t('resellers.dailyRequests.subtitle')}
            </p>
          </div>

          {/* Sample Listings Table */}
          <Card className="overflow-hidden border-2 border-border mb-8 animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-accent/5 border-b border-border">
                  <tr>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">時間</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">照片</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">項目</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">類別</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">數量</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">地點</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Listing 1 - Inspection Phase */}
                  <tr className="border-b border-border hover:bg-accent/5 transition-colors">
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">2小時前</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-16 h-16 rounded bg-accent/10 flex items-center justify-center">
                        <Package className="w-8 h-8 text-accent/40" />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-foreground hover:text-accent transition-colors cursor-pointer">CNC銑床 - 5軸加工中心</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">工業機械</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">3台</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">📍 台中市</span>
                    </td>
                    <td className="py-4 px-4">
                      <Button variant="outline" size="sm" className="whitespace-nowrap">
                        參加檢驗
                      </Button>
                    </td>
                  </tr>

                  {/* Listing 2 - Bidding Phase */}
                  <tr className="border-b border-border hover:bg-accent/5 transition-colors">
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">5小時前</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-16 h-16 rounded bg-accent/10 flex items-center justify-center">
                        <Package className="w-8 h-8 text-accent/40" />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-foreground hover:text-accent transition-colors cursor-pointer">SMT貼片機配件批次</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">電子零件</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">批量</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">📍 新竹市</span>
                    </td>
                    <td className="py-4 px-4">
                      <Button size="sm" className="bg-accent hover:bg-accent/90 whitespace-nowrap">
                        參加投標
                      </Button>
                    </td>
                  </tr>

                  {/* Listing 3 - Bidding Phase */}
                  <tr className="border-b border-border hover:bg-accent/5 transition-colors">
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">今日</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-16 h-16 rounded bg-accent/10 flex items-center justify-center">
                        <Package className="w-8 h-8 text-accent/40" />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-foreground hover:text-accent transition-colors cursor-pointer">不鏽鋼板材剩餘批次</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">金屬材料</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">8噸</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">📍 高雄市</span>
                    </td>
                    <td className="py-4 px-4">
                      <Button size="sm" className="bg-accent hover:bg-accent/90 whitespace-nowrap">
                        參加投標
                      </Button>
                    </td>
                  </tr>

                  {/* Listing 4 - Inspection Phase */}
                  <tr className="border-b border-border hover:bg-accent/5 transition-colors">
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">今日</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-16 h-16 rounded bg-accent/10 flex items-center justify-center">
                        <Package className="w-8 h-8 text-accent/40" />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-foreground hover:text-accent transition-colors cursor-pointer">注塑機 - 200噸</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">塑膠設備</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">2台</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">📍 桃園市</span>
                    </td>
                    <td className="py-4 px-4">
                      <Button variant="outline" size="sm" className="whitespace-nowrap">
                        參加檢驗
                      </Button>
                    </td>
                  </tr>

                  {/* Listing 5 - Bidding Phase */}
                  <tr className="border-b border-border hover:bg-accent/5 transition-colors">
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">1天前</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-16 h-16 rounded bg-accent/10 flex items-center justify-center">
                        <Package className="w-8 h-8 text-accent/40" />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-foreground hover:text-accent transition-colors cursor-pointer">工業用電腦及顯示器</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">辦公設備</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">50套</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">📍 台北市</span>
                    </td>
                    <td className="py-4 px-4">
                      <Button size="sm" className="bg-accent hover:bg-accent/90 whitespace-nowrap">
                        參加投標
                      </Button>
                    </td>
                  </tr>

                  {/* Listing 6 - Inspection Phase */}
                  <tr className="hover:bg-accent/5 transition-colors">
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">今日</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-16 h-16 rounded bg-accent/10 flex items-center justify-center">
                        <Package className="w-8 h-8 text-accent/40" />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-foreground hover:text-accent transition-colors cursor-pointer">反應釜及配套系統</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">化工設備</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">1套</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">📍 台南市</span>
                    </td>
                    <td className="py-4 px-4">
                      <Button variant="outline" size="sm" className="whitespace-nowrap">
                        參加檢驗
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* CTA Button */}
          <div className="text-center">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all"
              onClick={() => navigate("/buyer-marketplace")}
            >
              {t('resellers.dailyRequests.viewAll')}
            </Button>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-10 sm:py-20 sm:px-4 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-4">
              {t('resellers.benefits.title')}
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
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-4">
              {t('resellers.howItWorks.title')}
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

      {/* Positioning Section */}
      <section className="py-10 sm:py-20 sm:px-4 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-6">
              {t('resellers.positioning.title')}
            </h2>
          </div>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-muted-foreground mb-6 font-medium">
              {t('resellers.positioning.intro')}
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 bg-gradient-card border-2 border-border hover:border-accent/50 transition-all text-center">
                <Package className="w-12 h-12 text-accent mx-auto mb-4" />
                <p className="text-foreground font-medium">
                  {t('resellers.positioning.point1')}
                </p>
              </Card>
              <Card className="p-6 bg-gradient-card border-2 border-border hover:border-accent/50 transition-all text-center">
                <Search className="w-12 h-12 text-accent mx-auto mb-4" />
                <p className="text-foreground font-medium">
                  {t('resellers.positioning.point2')}
                </p>
              </Card>
              <Card className="p-6 bg-gradient-card border-2 border-border hover:border-accent/50 transition-all text-center">
                <Target className="w-12 h-12 text-accent mx-auto mb-4" />
                <p className="text-foreground font-medium">
                  {t('resellers.positioning.point3')}
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 px-4 bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-accent/40" />
        <div className="relative container mx-auto max-w-5xl text-center">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 drop-shadow-lg">
            {t('resellers.finalCta.title')}
          </h2>
          <p className="text-xl text-white/95 mb-8 max-w-4xl mx-auto drop-shadow-md">
            {t('resellers.finalCta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="shadow-lg hover:shadow-xl transition-all">
              Apply as a Buyer
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm shadow-lg">
              See How Buyer Accounts Work
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

export default Resellers;
