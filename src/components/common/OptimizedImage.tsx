/**
 * ========================================
 * OPTIMIZED IMAGE COMPONENT
 * ========================================
 *
 * Complete image component with:
 * - Lazy loading
 * - Responsive sizing
 * - Error handling
 * - Blur-up effect
 * - Loading state
 * - Accessibility
 *
 * Usage:
 * <OptimizedImage
 *   src={url}
 *   alt="Product"
 *   width={300}
 *   height={200}
 * />
 */

import React, { useState, useEffect, useRef } from 'react';
import { getOptimizedImageUrl, getResponsiveImages, getPlaceholderUrl } from '@/services/imageService';

// =====================================================
// TYPES
// =====================================================

interface OptimizedImageProps {
  /** Image URL */
  src: string;
  /** Alt text (required for accessibility) */
  alt: string;
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Image quality */
  quality?: 'low' | 'medium' | 'high';
  /** CSS class name */
  className?: string;
  /** Container CSS class */
  containerClassName?: string;
  /** Callback when image loads */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: () => void;
  /** Show placeholder while loading */
  showPlaceholder?: boolean;
  /** Object fit style */
  objectFit?: 'cover' | 'contain' | 'fill';
  /** Optional title attribute */
  title?: string;
  /** Use intersection observer for lazy loading */
  lazy?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Custom error component */
  errorComponent?: React.ReactNode;
}

// =====================================================
// COMPONENT
// =====================================================

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 300,
  height = 200,
  quality = 'medium',
  className = '',
  containerClassName = '',
  onLoad,
  onError,
  showPlaceholder = true,
  objectFit = 'cover',
  title,
  lazy = true,
  loadingComponent,
  errorComponent,
}) => {
  // ===================================================
  // STATE
  // ===================================================

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(!lazy);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ===================================================
  // EFFECTS
  // ===================================================

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || shouldLoad) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
      observer.disconnect();
    };
  }, [lazy, shouldLoad]);

  // ===================================================
  // HANDLERS
  // ===================================================

  const handleLoad = () => {
    setImageLoaded(true);
    setImageFailed(false);
    onLoad?.();
  };

  const handleError = () => {
    console.warn(`Failed to load image: ${src}`);
    setImageFailed(true);
    setImageLoaded(false);
    onError?.();
  };

  // ===================================================
  // IMAGE URLS
  // ===================================================

  const optimizedUrl = shouldLoad
    ? getOptimizedImageUrl(src, width, height, quality)
    : undefined;

  const responsiveImages = shouldLoad
    ? getResponsiveImages(src, width)
    : undefined;

  const placeholderUrl = showPlaceholder
    ? getPlaceholderUrl(src, 50)
    : undefined;

  // ===================================================
  // ERROR STATE
  // ===================================================

  if (imageFailed) {
    return (
      <div
        className={`
          bg-gray-200 dark:bg-gray-700
          flex items-center justify-center
          ${containerClassName}
        `}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : 'auto',
          aspectRatio: width && height ? `${width}/${height}` : 'auto',
        }}
        role="img"
        aria-label={`Failed to load: ${alt}`}
      >
        {errorComponent ? (
          errorComponent
        ) : (
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              ⚠️
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              Image unavailable
            </p>
          </div>
        )}
      </div>
    );
  }

  // ===================================================
  // LOADING STATE
  // ===================================================

  if (!shouldLoad || (showPlaceholder && !imageLoaded)) {
    return (
      <div
        ref={containerRef}
        className={`
          relative overflow-hidden
          ${containerClassName}
        `}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : 'auto',
          aspectRatio: width && height ? `${width}/${height}` : 'auto',
          backgroundColor: '#f3f4f6',
        }}
      >
        {/* Placeholder background */}
        {placeholderUrl && (
          <div
            className="absolute inset-0 blur-md"
            style={{
              backgroundImage: `url('${placeholderUrl}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}

        {/* Loading indicator */}
        {loadingComponent ? (
          <div className="absolute inset-0 flex items-center justify-center">
            {loadingComponent}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Hidden image for caching */}
        {shouldLoad && optimizedUrl && (
          <img
            ref={imgRef}
            src={optimizedUrl}
            srcSet={responsiveImages}
            alt={alt}
            title={title}
            style={{ display: 'none' }}
            onLoad={handleLoad}
            onError={handleError}
            crossOrigin="anonymous"
            decoding="async"
          />
        )}
      </div>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div
      ref={containerRef}
      className={`
        relative overflow-hidden
        ${containerClassName}
      `}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        aspectRatio: width && height ? `${width}/${height}` : 'auto',
      }}
    >
      {/* Picture element for modern format support */}
      <picture>
        {/* WebP format for modern browsers */}
        {optimizedUrl && (
          <source
            srcSet={responsiveImages}
            type="image/webp"
          />
        )}

        {/* Main image */}
        <img
          ref={imgRef}
          src={optimizedUrl || '/placeholder.png'}
          srcSet={responsiveImages}
          alt={alt}
          title={title}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          crossOrigin="anonymous"
          className={`
            w-full h-full
            transition-opacity duration-300
            ${imageLoaded ? 'opacity-100' : 'opacity-0'}
            ${className}
          `}
          style={{
            objectFit: objectFit,
            objectPosition: 'center',
          }}
          onLoad={handleLoad}
          onError={handleError}
        />

        {/* Placeholder background while loading */}
        {showPlaceholder && placeholderUrl && !imageLoaded && (
          <div
            className="absolute inset-0 blur-sm"
            style={{
              backgroundImage: `url('${placeholderUrl}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              pointerEvents: 'none',
            }}
          />
        )}
      </picture>
    </div>
  );
};

export default OptimizedImage;
