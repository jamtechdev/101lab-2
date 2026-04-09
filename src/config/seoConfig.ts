/**
 * Centralized SEO Configuration File
 * Update meta tags, titles, descriptions, keywords from here
 * All pages reference this file - one place to manage all SEO
 */

export interface PageSEO {
  title: string;
  description: string;
  keywords: string;
  image?: string;
  type?: 'website' | 'article' | 'product' | 'organization';
}

export const SEO_CONFIG: Record<string, PageSEO> = {
  // Homepage
  home: {
    title: 'GreenBidz - Enterprise Asset Management & Marketplace',
    description:
      'Professional B2B marketplace for buying and selling industrial equipment, machinery, and recyclable materials. Turn your surplus assets into value with our trusted platform.',
    keywords:
      'industrial equipment, machinery marketplace, asset management, buy equipment, sell surplus, B2B marketplace, recycling, surplus equipment',
    image: '/greenbidz_logo.png',
    type: 'website',
  },

  // Factories Landing
  factories: {
    title: 'Factories & Manufacturers - GreenBidz',
    description:
      'Streamline your surplus equipment and waste disposal with GreenBidz. Sell equipment at scale, reach global buyers, and dispose of waste responsibly. Enterprise solutions for factories.',
    keywords: 'factory marketplace, industrial equipment, surplus equipment, waste disposal, manufacturer platform',
    image: '/greenbidz_logo.png',
    type: 'website',
  },

  // Resellers/Recyclers Landing
  resellers: {
    title: 'Recyclers & Resellers Marketplace - GreenBidz',
    description:
      'Get daily requests from factories and manufacturers. Source quality equipment and materials at scale. Grow your recycling business with GreenBidz enterprise network.',
    keywords: 'recycler marketplace, reseller platform, equipment sourcing, factory requests, bulk equipment',
    image: '/greenbidz_logo.png',
    type: 'website',
  },

  // Seller Landing Page
  sellerLanding: {
    title: 'Sell With GreenBidz - Global Marketplace for Equipment & Materials',
    description:
      'List and sell your equipment globally. Reach thousands of verified buyers. Fast approvals, transparent pricing, and secure transactions with GreenBidz.',
    keywords: 'sell equipment online, marketplace for sellers, industrial equipment sales, global buyer network',
    image: '/greenbidz_logo.png',
    type: 'website',
  },

  // Marketplace/Browse
  marketplace: {
    title: 'Industrial Equipment Marketplace - GreenBidz',
    description:
      'Discover industrial equipment, machinery, and recyclable materials from verified sellers worldwide on GreenBidz.',
    keywords: 'buy equipment, marketplace, industrial equipment, machinery, sellers, equipment for sale',
    image: '/greenbidz_logo.png',
    type: 'website',
  },

  // Product Listing Detail
  listingDetail: {
    title: 'Equipment Listing - GreenBidz Marketplace',
    description:
      'View detailed equipment listing including specifications, pricing, and seller information. Connect with verified sellers on GreenBidz.',
    keywords: 'equipment details, machinery listing, buy equipment, equipment specs, verified seller',
    image: '/greenbidz_logo.png',
    type: 'product',
  },

  // SEO Analytics Dashboard
  seoAnalytics: {
    title: 'SEO Performance Dashboard - GreenBidz Analytics',
    description:
      'Monitor your website\'s SEO performance, metrics, and optimization status. Real-time analytics and insights for GreenBidz platform.',
    keywords: 'SEO analytics, performance metrics, website analytics, SEO dashboard',
    image: '/greenbidz_logo.png',
    type: 'website',
  },

  // Authentication
  auth: {
    title: 'Login & Sign Up - GreenBidz',
    description: 'Create an account or login to GreenBidz. Join our global marketplace for industrial equipment.',
    keywords: 'login, sign up, account, registration, authentication',
    image: '/greenbidz_logo.png',
    type: 'website',
  },

  // Forgot Password
  forgotPassword: {
    title: 'Reset Password - GreenBidz',
    description: 'Recover your GreenBidz account password securely.',
    keywords: 'forgot password, reset password, account recovery',
    image: '/greenbidz_logo.png',
    type: 'website',
  },

  // 404 Not Found
  notFound: {
    title: '404 - Page Not Found - GreenBidz',
    description: 'The page you are looking for does not exist. Return to GreenBidz marketplace.',
    keywords: '404, not found, error',
    image: '/greenbidz_logo.png',
    type: 'website',
  },
};

/**
 * Helper function to get SEO data for a page
 * Usage: const seoData = getSEO('home');
 */
export const getSEO = (pageName: string): PageSEO => {
  return SEO_CONFIG[pageName] || SEO_CONFIG.home;
};

/**
 * Dynamic page SEO generator (for pages with search queries, filters, etc.)
 */
export const getDynamicSEO = (basePageName: string, params: Record<string, any>): PageSEO => {
  const baseSEO = getSEO(basePageName);

  if (basePageName === 'marketplace' && params.search) {
    return {
      ...baseSEO,
      title: `Buy ${params.search} - GreenBidz Marketplace`,
      description: `Browse and buy quality ${params.search} on GreenBidz. Connect with trusted sellers of industrial equipment and machinery.`,
    };
  }

  if (basePageName === 'listingDetail' && params.productName) {
    return {
      ...baseSEO,
      title: `${params.productName} - Buy on GreenBidz`,
      description: `${params.productName} - View pricing, specifications, and connect with the seller on GreenBidz marketplace.`,
    };
  }

  return baseSEO;
};

/**
 * Global SEO Settings
 */
export const GLOBAL_SEO = {
  siteName: 'GreenBidz',
  siteUrl: 'https://101recycle.greenbidz.com',
  logo: '/greenbidz_logo.png',
  author: 'GreenBidz',
  twitterHandle: '@GreenBidz',
  defaultLocale: 'en_US',
  supportedLocales: {
    en: 'en_US',
    zh: 'zh_TW',
    ja: 'ja_JP',
    th: 'th_TH',
  },
};

/**
 * Category-specific SEO (if you want to customize per category)
 */
export const CATEGORY_SEO: Record<string, PageSEO> = {
  'material-handling': {
    title: 'Material Handling Equipment - Buy on GreenBidz',
    description: 'Browse quality material handling equipment from verified sellers. Industrial solutions for your business.',
    keywords: 'material handling, equipment, conveyor systems, lifting equipment',
  },
  'construction': {
    title: 'Construction & Earthmoving Equipment - GreenBidz',
    description: 'Find construction and earthmoving machinery on GreenBidz. Connect with trusted sellers.',
    keywords: 'construction equipment, earthmoving, machinery',
  },
  // Add more categories as needed
};
