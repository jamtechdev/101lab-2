/**
 * ========================================
 * SMOOTHNESS UTILITIES
 * ========================================
 *
 * Helper functions for smooth interactions
 * Use these to enhance existing components
 */

// =====================================================
// EASE FUNCTIONS
// =====================================================

export const easing = {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeLinear: 'linear',
  easeQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeCubic: 'cubic-bezier(0.32, 0.67, 0.51, 1)',
  easeExpo: 'cubic-bezier(0.17, 0.84, 0.44, 1)',
  easeCirc: 'cubic-bezier(0.85, 0.14, 0.16, 0.85)',
};

// =====================================================
// TRANSITION HELPERS
// =====================================================

export const createTransition = (
  property: string = 'all',
  duration: number = 200,
  easeFunction: string = easing.easeInOut
): string => {
  return `${property} ${duration}ms ${easeFunction}`;
};

export const getSmoothTransition = (property = 'all', duration = 200) => {
  return {
    transition: createTransition(property, duration),
  };
};

// =====================================================
// HOVER STATE CLASSES
// =====================================================

export const smoothHoverClasses = {
  button: 'hover:scale-105 active:scale-95 transition-transform duration-200',
  card: 'hover:shadow-lg hover:scale-102 transition-all duration-200',
  link: 'hover:text-blue-600 transition-colors duration-200',
  icon: 'hover:scale-110 active:scale-90 transition-transform duration-150',
  overlay: 'hover:opacity-100 transition-opacity duration-300',
};

// =====================================================
// ANIMATION DELAYS
// =====================================================

export const getStaggerDelay = (index: number, baseDelay: number = 0.1): number => {
  return index * baseDelay;
};

export const getStaggerStyle = (index: number, baseDelay: number = 0.1) => {
  return {
    animationDelay: `${getStaggerDelay(index, baseDelay)}s`,
  };
};

// =====================================================
// SCROLL SMOOTH HELPER
// =====================================================

export const enableSmoothScroll = () => {
  if (typeof document !== 'undefined') {
    document.documentElement.style.scrollBehavior = 'smooth';
  }
};

export const disableSmoothScroll = () => {
  if (typeof document !== 'undefined') {
    document.documentElement.style.scrollBehavior = 'auto';
  }
};

// =====================================================
// DEBOUNCE & THROTTLE FOR SMOOTH INTERACTIONS
// =====================================================

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// =====================================================
// REQUEST ANIMATION FRAME HELPERS
// =====================================================

export const smoothRequest = (callback: FrameRequestCallback): number => {
  return requestAnimationFrame(callback);
};

export const smoothCancel = (id: number): void => {
  cancelAnimationFrame(id);
};

// =====================================================
// PARALLAX HELPER
// =====================================================

export const getParallaxOffset = (
  scrollY: number,
  multiplier: number = 0.5
): string => {
  return `translateY(${scrollY * multiplier}px)`;
};

// =====================================================
// SPRING ANIMATION PRESETS
// =====================================================

export const springPresets = {
  gentle: {
    type: 'spring',
    stiffness: 100,
    damping: 20,
  },
  normal: {
    type: 'spring',
    stiffness: 150,
    damping: 25,
  },
  bouncy: {
    type: 'spring',
    stiffness: 200,
    damping: 10,
  },
  snappy: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  },
};

// =====================================================
// FADE ANIMATION HELPERS
// =====================================================

export const fadeInVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideInVariants = (direction: 'left' | 'right' | 'up' | 'down' = 'right') => {
  const distances = {
    left: { x: -50 },
    right: { x: 50 },
    up: { y: -50 },
    down: { y: 50 },
  };

  const distance = distances[direction];

  return {
    initial: { opacity: 0, ...distance },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, ...distance },
  };
};

export const scaleInVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

// =====================================================
// TAILWIND CLASS GENERATORS
// =====================================================

export const getTransitionClass = (duration: 'fast' | 'normal' | 'slow' = 'normal') => {
  const durations = {
    fast: 'duration-200',
    normal: 'duration-300',
    slow: 'duration-500',
  };
  return `transition-all ${durations[duration]}`;
};

export const getHoverClass = (type: 'scale' | 'lift' | 'glow' | 'dim' = 'scale') => {
  const types = {
    scale: 'hover:scale-105',
    lift: 'hover:shadow-lg hover:-translate-y-1',
    glow: 'hover:shadow-lg hover:shadow-blue-200',
    dim: 'hover:opacity-75',
  };
  return types[type];
};

// =====================================================
// LOCAL STORAGE SMOOTHNESS PREFERENCE
// =====================================================

export const setSmoothPreference = (enabled: boolean) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('prefer-smooth-animations', String(enabled));
  }
};

export const getSmoothPreference = (): boolean => {
  if (typeof localStorage === 'undefined') return true;

  const pref = localStorage.getItem('prefer-smooth-animations');
  if (pref === null) return true; // Default: enabled

  return pref === 'true';
};

export const respectsPrefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// =====================================================
// ANIMATION PERFORMANCE CHECK
// =====================================================

export const shouldDisableAnimations = (): boolean => {
  if (respectsPrefersReducedMotion()) return true;
  if (!getSmoothPreference()) return true;

  // Check if device is low-end (optional)
  if (typeof navigator !== 'undefined') {
    const hardwareConcurrency = (navigator as any).hardwareConcurrency || 1;
    return hardwareConcurrency < 2; // Disable on very low-end devices
  }

  return false;
};

// =====================================================
// MOBILE DETECTION
// =====================================================

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const isTablet = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|Android|Tablet/i.test(ua);
};

// =====================================================
// VIEWPORT DETECTION
// =====================================================

export const getViewportSize = () => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

export const isViewportLarge = (): boolean => {
  return getViewportSize().width >= 1024;
};

export const isViewportSmall = (): boolean => {
  return getViewportSize().width < 768;
};

// =====================================================
// NETWORK STATUS FOR ADAPTIVE LOADING
// =====================================================

export const getNetworkType = (): string => {
  if (typeof navigator === 'undefined') return 'unknown';

  const connection = (navigator as any).connection;
  if (!connection) return 'unknown';

  return connection.effectiveType || 'unknown';
};

export const isSlowConnection = (): boolean => {
  const type = getNetworkType();
  return type === '2g' || type === '3g';
};

// =====================================================
// FOCUS MANAGEMENT
// =====================================================

export const focusElement = (selector: string) => {
  const element = document.querySelector<HTMLElement>(selector);
  if (element) {
    element.focus();
  }
};

export const trapFocus = (container: HTMLElement, enable: boolean = true) => {
  if (!enable) return;

  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
};

export default {
  easing,
  createTransition,
  getSmoothTransition,
  smoothHoverClasses,
  getStaggerDelay,
  enableSmoothScroll,
  debounce,
  throttle,
  springPresets,
  fadeInVariants,
  slideInVariants,
  shouldDisableAnimations,
  isMobileDevice,
};
