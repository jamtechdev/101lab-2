/**
 * ========================================
 * SMOOTH INTERACTIONS & HOVER EFFECTS
 * ========================================
 *
 * Interactive elements with smooth feedback
 * Buttons, cards, and other interactive components
 */

import React from 'react';
import { motion } from 'framer-motion';

// =====================================================
// SMOOTH BUTTON VARIANTS
// =====================================================

interface SmoothButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const SmoothButton: React.FC<SmoothButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  icon,
  className = '',
  disabled = false,
  ...props
}) => {
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    ghost: 'text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`
        flex items-center gap-2 rounded-lg font-medium
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 border-2 border-current border-r-transparent rounded-full"
        />
      )}
      {icon && !isLoading && icon}
      {children}
    </motion.button>
  );
};

// =====================================================
// SMOOTH CARD HOVER
// =====================================================

export const SmoothCard: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  hoverScale?: number;
}> = ({ children, onClick, className = '', hoverScale = 1.02 }) => {
  return (
    <motion.div
      whileHover={{ scale: hoverScale, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={onClick}
      className={`
        rounded-lg shadow-sm hover:shadow-md
        transition-shadow duration-200 ease-out
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

// =====================================================
// SMOOTH ICON BUTTON
// =====================================================

export const SmoothIconButton: React.FC<{
  icon: React.ReactNode;
  onClick?: () => void;
  title?: string;
  className?: string;
  disabled?: boolean;
}> = ({ icon, onClick, title, className = '', disabled = false }) => {
  return (
    <motion.button
      whileHover={!disabled ? { rotate: 10, scale: 1.1 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`
        p-2 rounded-lg transition-colors
        hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {icon}
    </motion.button>
  );
};

// =====================================================
// SMOOTH ACCORDION ITEM
// =====================================================

export const SmoothAccordionItem: React.FC<{
  title: string;
  children: React.ReactNode;
  isOpen?: boolean;
  onChange?: (open: boolean) => void;
  className?: string;
}> = ({ title, children, isOpen = false, onChange, className = '' }) => {
  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <motion.button
        onClick={() => onChange?.(!isOpen)}
        className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold">{title}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-600"
        >
          ▼
        </motion.div>
      </motion.button>

      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        overflow="hidden"
        className="border-t"
      >
        <div className="p-4">{children}</div>
      </motion.div>
    </div>
  );
};

// =====================================================
// SMOOTH TAB SWITCHER
// =====================================================

export const SmoothTabs: React.FC<{
  tabs: Array<{ id: string; label: string; content: React.ReactNode }>;
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}> = ({ tabs, defaultTab = tabs[0]?.id, onChange, className = '' }) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeTabContent = tabs.find((t) => t.id === activeTab);

  return (
    <div className={className}>
      {/* Tab buttons */}
      <div className="flex gap-2 border-b mb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`
              px-4 py-2 font-medium transition-colors whitespace-nowrap
              ${
                activeTab === tab.id
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-gray-900'
              }
            `}
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {activeTabContent?.content}
      </motion.div>
    </div>
  );
};

// =====================================================
// SMOOTH TOGGLE SWITCH
// =====================================================

export const SmoothToggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, disabled = false }) => {
  return (
    <div className="flex items-center gap-2">
      <motion.button
        onClick={() => !disabled && onChange(!checked)}
        className={`
          w-12 h-6 rounded-full transition-colors
          ${checked ? 'bg-blue-500' : 'bg-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        disabled={disabled}
      >
        <motion.div
          animate={{ x: checked ? 24 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-5 h-5 bg-white rounded-full ml-0.5"
        />
      </motion.button>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </div>
  );
};

// =====================================================
// SMOOTH INPUT FIELD
// =====================================================

export const SmoothInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
  }
> = ({ label, error, className = '', ...props }) => {
  const [focused, setFocused] = React.useState(false);

  return (
    <div className="space-y-1">
      {label && (
        <motion.label
          animate={{ fontSize: focused ? '0.875rem' : '1rem' }}
          className="block text-gray-700"
        >
          {label}
        </motion.label>
      )}

      <motion.input
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`
          w-full px-4 py-2 rounded-lg border
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className}
        `}
        animate={{
          boxShadow: focused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
        }}
        {...props}
      />

      {error && (
        <motion.span
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-500"
        >
          {error}
        </motion.span>
      )}
    </div>
  );
};

// =====================================================
// SMOOTH DROPDOWN
// =====================================================

export const SmoothDropdown: React.FC<{
  items: Array<{ id: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}> = ({ items, value, onChange, label, placeholder = 'Select...' }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative space-y-1">
      {label && <label className="block text-sm text-gray-700">{label}</label>}

      <motion.button
        onClick={() => setOpen(!open)}
        className="w-full p-2 rounded-lg border border-gray-300 text-left flex justify-between items-center hover:border-gray-400 transition-colors"
        whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
      >
        <span>{items.find((i) => i.id === value)?.label || placeholder}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          ▼
        </motion.div>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
        className={`absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 ${
          open ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {items.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => {
              onChange(item.id);
              setOpen(false);
            }}
            className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors ${
              value === item.id ? 'bg-blue-100 text-blue-700 font-medium' : ''
            }`}
            whileHover={{ paddingLeft: '1.25rem' }}
          >
            {item.label}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

// =====================================================
// SMOOTH LINK
// =====================================================

export const SmoothLink: React.FC<{
  href: string;
  children: React.ReactNode;
  className?: string;
}> = ({ href, children, className = '' }) => {
  return (
    <motion.a
      href={href}
      whileHover={{ x: 2 }}
      whileTap={{ x: 0 }}
      className={`transition-colors duration-200 ${className}`}
    >
      {children}
    </motion.a>
  );
};

export default {
  SmoothButton,
  SmoothCard,
  SmoothIconButton,
  SmoothAccordionItem,
  SmoothTabs,
  SmoothToggle,
  SmoothInput,
  SmoothDropdown,
  SmoothLink,
};
