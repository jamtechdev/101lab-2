/**
 * ========================================
 * BRANDING CONFIGURATION
 * ========================================
 *
 * Priority:
 * 1. VITE_SITE_TYPE in .env (primary)
 * 2. Auto-detect from domain (fallback)
 *
 * API values stay unchanged (LabGreenbidz, machines, etc.)
 * Branding maps API value → display name
 */

import { SITE_TYPE } from './site';

// =====================================================
// BRANDING MAP
// Maps all possible VITE_SITE_TYPE values → display config
// =====================================================

const BRANDING_MAP: Record<string, {
  siteName: string;
  fullName: string;
  tagline: string;
  description: string;
}> = {
  // 101machines
  'machines': {
    siteName: '101machines',
    fullName: '101machines by Greenbidz',
    tagline: 'Industrial Machinery Marketplace',
    description: 'Turn your used machinery, tools, and surplus inventory into capital.',
  },

  // 101lab - env value is "LabGreenbidz"
  'labgreenbidz': {
    siteName: '101lab',
    fullName: '101lab by Greenbidz',
    tagline: 'Laboratory Equipment Marketplace',
    description: 'Buy and sell quality laboratory equipment and instruments.',
  },

  // recycle / default
  'recycle': {
    siteName: 'GreenBidz',
    fullName: 'GreenBidz Marketplace',
    tagline: 'Recyclable Materials Marketplace',
    description: 'Connect with verified recyclers and suppliers.',
  },
};

// =====================================================
// DOMAIN DETECTION (fallback if env not set)
// =====================================================

const detectBrandingFromDomain = (): string => {
  if (typeof window === 'undefined') return 'machines';

  const hostname = window.location.hostname.toLowerCase();

  if (hostname.includes('101lab')) return 'labgreenbidz';
  if (hostname.includes('101machines')) return 'machines';
  if (hostname.includes('recycle')) return 'recycle';

  return 'machines'; // default
};

// =====================================================
// RESOLVE BRANDING
// 1. Use VITE_SITE_TYPE from env
// 2. If not set → detect from domain
// =====================================================

const resolveBrandingKey = (): string => {
  const envValue = SITE_TYPE?.toLowerCase()?.trim();

  // If env is set and recognized → use it directly
  if (envValue && BRANDING_MAP[envValue]) {
    return envValue;
  }

  // Env not set or not recognized → detect from domain
  return detectBrandingFromDomain();
};

const brandingKey = resolveBrandingKey();

export const CURRENT_BRANDING = BRANDING_MAP[brandingKey] || BRANDING_MAP['machines'];

// Quick exports
export const SITE_NAME = CURRENT_BRANDING.siteName;
export const SITE_FULL_NAME = CURRENT_BRANDING.fullName;
export const SITE_TAGLINE = CURRENT_BRANDING.tagline;
export const SITE_DESCRIPTION = CURRENT_BRANDING.description;

export default CURRENT_BRANDING;
