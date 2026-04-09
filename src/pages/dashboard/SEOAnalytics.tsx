import React, { useEffect, useState } from 'react';
import SEOMeta from '@/components/common/SEOMeta';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Globe,
  Zap,
  Search,
  Share2,
} from 'lucide-react';

const SEOAnalytics = () => {
  const [loading, setLoading] = useState(false);

  // Mock SEO Performance Data
  const seoScore = 95;
  const indexedPages = 45;
  const coreWebVitalsStatus = 'Good';
  const mobileScore = 98;
  const desktopScore = 96;

  // Mock data for charts
  const performanceData = [
    { name: 'Week 1', score: 82, traffic: 1200 },
    { name: 'Week 2', score: 85, traffic: 1400 },
    { name: 'Week 3', score: 88, traffic: 1600 },
    { name: 'Week 4', score: 92, traffic: 2000 },
    { name: 'Week 5', score: 94, traffic: 2400 },
    { name: 'Week 6', score: 95, traffic: 2800 },
  ];

  const languageDistribution = [
    { name: 'English', value: 60 },
    { name: 'Chinese', value: 20 },
    { name: 'Japanese', value: 12 },
    { name: 'Thai', value: 8 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const metricsCards = [
    {
      title: 'SEO Score',
      value: seoScore,
      unit: '/100',
      icon: TrendingUp,
      color: 'text-blue-500',
      status: 'Excellent',
      statusColor: 'bg-green-500/10 text-green-700',
    },
    {
      title: 'Indexed Pages',
      value: indexedPages,
      unit: 'pages',
      icon: Globe,
      color: 'text-green-500',
      status: 'Active',
      statusColor: 'bg-green-500/10 text-green-700',
    },
    {
      title: 'Mobile Score',
      value: mobileScore,
      unit: '/100',
      icon: Zap,
      color: 'text-yellow-500',
      status: 'Excellent',
      statusColor: 'bg-green-500/10 text-green-700',
    },
    {
      title: 'Desktop Score',
      value: desktopScore,
      unit: '/100',
      icon: Search,
      color: 'text-purple-500',
      status: 'Excellent',
      statusColor: 'bg-green-500/10 text-green-700',
    },
  ];

  const seoChecklist = [
    { title: 'Meta Tags', status: true, description: 'All pages have proper meta tags' },
    { title: 'Sitemap', status: true, description: 'XML sitemap created and submitted' },
    { title: 'Robots.txt', status: true, description: 'Robots.txt configured correctly' },
    { title: 'SSL Certificate', status: true, description: 'HTTPS enabled on all pages' },
    { title: 'Mobile Optimized', status: true, description: 'Mobile responsive design' },
    { title: 'Structured Data', status: true, description: 'JSON-LD schema implemented' },
    { title: 'Performance', status: true, description: 'Core Web Vitals optimized' },
    { title: 'Multi-language', status: true, description: 'Hreflang tags configured (EN, ZH, JA, TH)' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOMeta
        title="SEO Performance Dashboard - GreenBidz Analytics"
        description="Monitor your website's SEO performance, metrics, and optimization status. Real-time analytics and insights for GreenBidz platform."
        keywords="SEO analytics, performance metrics, website analytics, SEO dashboard"
        type="website"
      />
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">SEO Performance Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Monitor and track your website's SEO health and optimization status
          </p>
        </div>

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {metricsCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </CardTitle>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-bold text-foreground">{card.value}</span>
                    <span className="text-sm text-muted-foreground">{card.unit}</span>
                  </div>
                  <Badge className={card.statusColor}>{card.status}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Performance Trend Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>SEO Score Trend</CardTitle>
              <p className="text-sm text-muted-foreground">
                6-week performance tracking
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Language Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Multi-Language Support</CardTitle>
              <p className="text-sm text-muted-foreground">
                Content distribution
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={languageDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {languageDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* SEO Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Implementation Checklist</CardTitle>
            <p className="text-sm text-muted-foreground">
              Status of all SEO optimizations implemented
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {seoChecklist.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  {item.status ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SEO Strategy Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>SEO Strategy & Performance Purpose</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Our Approach</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>✓ <strong>Dynamic Meta Tags:</strong> Every page has unique, optimized meta descriptions and titles</li>
                <li>✓ <strong>Structured Data:</strong> JSON-LD schema implemented for Organization, Products, and BreadcrumbList</li>
                <li>✓ <strong>Multi-language SEO:</strong> Full support for English, Chinese (Traditional), Japanese, and Thai with hreflang tags</li>
                <li>✓ <strong>Sitemap & Robots:</strong> Automated sitemap generation and search engine crawling instructions</li>
                <li>✓ <strong>Performance Optimization:</strong> Core Web Vitals optimized for mobile and desktop</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Performance Goals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-200">
                  <p className="text-sm font-medium text-blue-700">Organic Reach</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">+150%</p>
                  <p className="text-xs text-blue-600 mt-1">Target increase in organic traffic</p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-200">
                  <p className="text-sm font-medium text-green-700">Search Visibility</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">95+</p>
                  <p className="text-xs text-green-600 mt-1">Target SEO score</p>
                </div>
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-200">
                  <p className="text-sm font-medium text-purple-700">Global Reach</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">4 Languages</p>
                  <p className="text-xs text-purple-600 mt-1">Multi-language support</p>
                </div>
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-200">
                  <p className="text-sm font-medium text-orange-700">User Experience</p>
                  <p className="text-2xl font-bold text-orange-900 mt-1">98%</p>
                  <p className="text-xs text-orange-600 mt-1">Mobile score</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Key Metrics Tracked</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Indexed Pages', value: '45' },
                  { label: 'Crawlable Links', value: '100%' },
                  { label: 'Meta Coverage', value: '100%' },
                  { label: 'Mobile Friendly', value: '✓' },
                  { label: 'HTTPS', value: '✓' },
                  { label: 'Core Web Vitals', value: 'Good' },
                ].map((metric, idx) => (
                  <div key={idx} className="text-center p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                    <p className="text-lg font-bold text-foreground">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default SEOAnalytics;
