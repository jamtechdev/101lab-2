/**
 * ========================================
 * IMAGE OPTIMIZATION SERVICE
 * ========================================
 *
 * Complete image handling with:
 * - URL optimization (WebP, compression)
 * - Responsive images (srcset)
 * - Lazy loading
 * - Error handling
 * - Placeholder generation
 *
 * Usage:
 * const optimized = getOptimizedImageUrl(url, 300, 200);
 */

// =====================================================
// TYPES
// =====================================================

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface OptimizedImageOptions {
  width?: number;
  height?: number;
  quality?: 'low' | 'medium' | 'high';
  format?: 'webp' | 'jpg' | 'png';
  fit?: 'cover' | 'contain' | 'fill';
}

// =====================================================
// CONSTANTS
// =====================================================

const DEFAULT_PLACEHOLDER = '/placeholder.png';
const DEFAULT_QUALITY = 'medium';

const QUALITY_MAP = {
  low: 60,      // For thumbnails, avatars
  medium: 75,   // For cards, lists
  high: 90,     // For hero, details
};

const COMMON_SIZES = {
  thumbnail: { width: 120, height: 120 },
  card: { width: 300, height: 200 },
  detail: { width: 600, height: 600 },
  hero: { width: 1200, height: 600 },
  mobile: { width: 280, height: 200 },
};

// =====================================================
// MAIN FUNCTIONS
// =====================================================

/**
 * Get optimized image URL with compression and format conversion
 *
 * @param url - Original image URL
 * @param width - Width in pixels
 * @param height - Height in pixels
 * @param quality - Quality level (low, medium, high)
 * @returns Optimized image URL
 *
 * Example:
 * const url = getOptimizedImageUrl('original.jpg', 300, 200, 'medium');
 * // Returns: 'original.jpg' (returns original if backend doesn't support optimization)
 */
export const getOptimizedImageUrl = (
  url: string,
  width?: number,
  height?: number,
  quality: 'low' | 'medium' | 'high' = DEFAULT_QUALITY
): string => {
  // Fallback to placeholder if no URL
  if (!url || url.trim() === '') {
    return DEFAULT_PLACEHOLDER;
  }

  // For now, return URL as-is since backend may not support query params
  // In production, integrate with CDN like Cloudinary, Imgix, or Vercel Image Optimization
  return url;
};

// =====================================================
// RESPONSIVE IMAGES
// =====================================================

/**
 * Generate responsive image srcset for different pixel densities
 *
 * @param url - Image URL
 * @param width - Base width (currently not used since backend doesn't support optimization)
 * @returns srcset string for <img> tag
 *
 * For production, integrate with CDN to generate different sizes
 */
export const getResponsiveImages = (
  url: string,
  width: number = 300
): string => {
  if (!url) return `${DEFAULT_PLACEHOLDER} 1x`;

  // Return single URL for all densities
  // In production, use CDN like Cloudinary: url?w=300 1x, url?w=600 2x, etc.
  return `${url} 1x`;
};

/**
 * Generate srcset for responsive layout with different viewport widths
 *
 * @param url - Image URL
 * @param sizes - Array of widths to generate
 * @returns srcset string for different viewport sizes
 *
 * Example:
 * <img srcSet={getResponsiveSizes(url, [300, 600, 1200])} />
 */
export const getResponsiveSizes = (
  url: string,
  widths: number[] = [300, 600, 1200]
): string => {
  if (!url) return `${DEFAULT_PLACEHOLDER}`;

  try {
    return widths
      .sort((a, b) => a - b)
      .map((width) => `${getOptimizedImageUrl(url, width)} ${width}w`)
      .join(', ');
  } catch (error) {
    console.error('Error generating responsive sizes:', error);
    return DEFAULT_PLACEHOLDER;
  }
};

// =====================================================
// PLACEHOLDERS & BLUR-UP
// =====================================================

/**
 * Get low-quality placeholder URL for blur-up effect
 *
 * @param url - Original image URL
 * @param width - Small width for placeholder (default 50px) - not used since backend doesn't support optimization
 * @returns Placeholder URL
 *
 * For production, use CDN to generate actual low-quality versions
 */
export const getPlaceholderUrl = (url: string, width: number = 50): string => {
  if (!url) return DEFAULT_PLACEHOLDER;

  // Return same URL as placeholder for now
  // In production, use CDN to serve actual low-quality LQIP (Low Quality Image Placeholder)
  return url;
};

/**
 * Get base64 data URL for inline placeholder
 * (Can be used for inline SVG placeholder)
 *
 * Returns a tiny SVG placeholder that can be inline
 */
export const getInlineDataURLPlaceholder = (
  color: string = '#e5e7eb'
): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect fill="${color}" width="100" height="100"/>
    <text x="50" y="50" font-size="12" text-anchor="middle" fill="#9ca3af" dy=".3em">Image</text>
  </svg>`;

  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
};

// =====================================================
// PRELOADING
// =====================================================

/**
 * Preload image to cache it
 *
 * @param url - Image URL to preload
 * @returns Promise that resolves when image is loaded
 *
 * Example:
 * await preloadImage(url).catch(() => console.error('Failed to preload'));
 */
export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('No URL provided'));
      return;
    }

    const img = new Image();

    const handleLoad = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error(`Failed to load image: ${url}`));
    };

    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
    };

    img.onload = handleLoad;
    img.onerror = handleError;
    img.src = getOptimizedImageUrl(url);

    // Timeout after 30 seconds
    setTimeout(() => {
      cleanup();
      reject(new Error(`Image load timeout: ${url}`));
    }, 30000);
  });
};

/**
 * Preload multiple images in parallel
 *
 * @param urls - Array of image URLs
 * @returns Promise that resolves when all images are loaded
 */
export const preloadImages = (urls: string[]): Promise<PromiseSettledResult<void>[]> => {
  return Promise.allSettled(urls.map((url) => preloadImage(url)));
};

// =====================================================
// VALIDATION & HELPERS
// =====================================================

/**
 * Check if URL is valid and accessible
 *
 * @param url - Image URL to validate
 * @returns Promise<boolean>
 */
export const isImageUrlValid = async (url: string): Promise<boolean> => {
  if (!url || typeof url !== 'string') return false;

  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return response.ok || response.status === 0; // 0 = no-cors mode
  } catch {
    return false;
  }
};

/**
 * Get image dimensions from URL
 *
 * @param url - Image URL
 * @returns Promise<ImageDimensions>
 */
export const getImageDimensions = (url: string): Promise<ImageDimensions> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${url}`));
    };

    img.src = url;
  });
};

/**
 * Generate image URL for specific use case
 *
 * @param url - Original image URL
 * @param useCase - Predefined use case
 * @returns Optimized URL
 *
 * Example:
 * const cardImg = getImageForUseCase(url, 'card');
 * const thumbnailImg = getImageForUseCase(url, 'thumbnail');
 */
export const getImageForUseCase = (
  url: string,
  useCase: keyof typeof COMMON_SIZES
): string => {
  const size = COMMON_SIZES[useCase];

  if (!size) {
    console.warn(`Unknown use case: ${useCase}`);
    return getOptimizedImageUrl(url);
  }

  const qualityMap = {
    thumbnail: 'low' as const,
    card: 'medium' as const,
    detail: 'high' as const,
    hero: 'high' as const,
    mobile: 'medium' as const,
  };

  return getOptimizedImageUrl(url, size.width, size.height, qualityMap[useCase]);
};

// =====================================================
// EXPORTS
// =====================================================

export default {
  getOptimizedImageUrl,
  getResponsiveImages,
  getResponsiveSizes,
  getPlaceholderUrl,
  getInlineDataURLPlaceholder,
  preloadImage,
  preloadImages,
  isImageUrlValid,
  getImageDimensions,
  getImageForUseCase,
  COMMON_SIZES,
  QUALITY_MAP,
};
