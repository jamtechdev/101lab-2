/**
 * ========================================
 * SMOOTH SCROLL UTILITIES
 * ========================================
 *
 * Smooth scrolling helpers and components
 * Better scroll experience for users
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

// =====================================================
// SMOOTH SCROLL TO TOP BUTTON
// =====================================================

export const ScrollToTopButton: React.FC<{
  showAfter?: number;
  duration?: number;
}> = ({ showAfter = 300, duration = 0.6 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > showAfter);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [showAfter]);

  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <motion.button
      onClick={handleClick}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-8 right-8 z-40 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"
      title="Scroll to top"
    >
      <ChevronUp size={20} />
    </motion.button>
  );
};

// =====================================================
// SMOOTH SCROLL INTO VIEW
// =====================================================

export const SmoothScrollIntoView: React.FC<{
  children: React.ReactNode;
  behavior?: ScrollBehavior;
  className?: string;
}> = ({ children, behavior = 'smooth', className = '' }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior, block: 'start' });
    }
  };

  return (
    <div
      ref={ref}
      className={`scroll-smooth ${className}`}
      onClick={handleScroll}
    >
      {children}
    </div>
  );
};

// =====================================================
// SCROLL PROGRESS INDICATOR
// =====================================================

export const ScrollProgress: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 z-50"
      style={{ width: `${scrollProgress}%` }}
      transition={{ duration: 0.1 }}
    />
  );
};

// =====================================================
// SCROLL TO ELEMENT BY ID
// =====================================================

export const useScrollTo = (duration = 0.6) => {
  return (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
};

// =====================================================
// SMOOTH ANCHOR LINKS
// =====================================================

export const SmoothAnchorLink: React.FC<{
  href: string;
  children: React.ReactNode;
  className?: string;
  offset?: number;
}> = ({ href, children, className = '', offset = 0 }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!href.startsWith('#')) return;

    e.preventDefault();
    const target = document.querySelector(href);

    if (target) {
      const targetPosition = (target as HTMLElement).offsetTop - offset;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
};

// =====================================================
// PARALLAX SCROLL ELEMENT
// =====================================================

export const ParallaxScroll: React.FC<{
  children: React.ReactNode;
  offset?: number;
  className?: string;
}> = ({ children, offset = 50, className = '' }) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={className}
      style={{
        transform: `translateY(${scrollY * 0.5}px)`,
      }}
    >
      {children}
    </div>
  );
};

// =====================================================
// SCROLL TO SECTION NAV
// =====================================================

export const ScrollNav: React.FC<{
  sections: Array<{ id: string; label: string }>;
  className?: string;
}> = ({ sections, className = '' }) => {
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`flex gap-4 ${className}`}>
      {sections.map((section) => (
        <motion.button
          key={section.id}
          onClick={() => scrollToSection(section.id)}
          className={`px-4 py-2 rounded transition-all ${
            activeSection === section.id
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {section.label}
        </motion.button>
      ))}
    </nav>
  );
};

// =====================================================
// INFINITE SCROLL TRIGGER
// =====================================================

export const useInfiniteScroll = (callback: () => void, threshold = 0.9) => {
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const scrollPercent = (scrollTop + windowHeight) / docHeight;

      if (scrollPercent > threshold) {
        callback();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [callback, threshold]);
};

// =====================================================
// STICKY SCROLL ELEMENT
// =====================================================

export const StickyScroll: React.FC<{
  children: React.ReactNode;
  top?: number;
  className?: string;
}> = ({ children, top = 0, className = '' }) => {
  return (
    <motion.div
      className={`sticky ${className}`}
      style={{ top: `${top}px` }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

// =====================================================
// SCROLL TO SECTION ON MOUNT
// =====================================================

export const useScrollToOnMount = (elementId: string | null, delay = 0) => {
  useEffect(() => {
    if (!elementId) return;

    const timer = setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [elementId, delay]);
};

// =====================================================
// SCROLL LOCK (prevent scroll)
// =====================================================

export const useScrollLock = (locked: boolean) => {
  useEffect(() => {
    if (locked) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [locked]);
};

export default {
  ScrollToTopButton,
  SmoothScrollIntoView,
  ScrollProgress,
  useScrollTo,
  SmoothAnchorLink,
  ParallaxScroll,
  ScrollNav,
  useInfiniteScroll,
  StickyScroll,
  useScrollToOnMount,
  useScrollLock,
};
