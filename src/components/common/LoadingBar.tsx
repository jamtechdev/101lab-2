/**
 * ========================================
 * LOADING BAR / PROGRESS BAR
 * ========================================
 *
 * Visual feedback for page/content loading
 * Smooth animated progress bar at top of page
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface LoadingBarProps {
  isLoading?: boolean;
  progress?: number; // 0-100
  duration?: number;
  color?: string;
  height?: number;
}

// =====================================================
// MAIN LOADING BAR
// =====================================================

export const LoadingBar: React.FC<LoadingBarProps> = ({
  isLoading = false,
  progress = 0,
  duration = 0.5,
  color = 'bg-blue-500',
  height = 2,
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    setDisplayProgress(progress);
  }, [progress]);

  if (!isLoading && displayProgress === 0) {
    return null;
  }

  return (
    <motion.div
      className={`fixed top-0 left-0 h-1 ${color} z-50`}
      initial={{ width: '0%' }}
      animate={{ width: `${displayProgress}%` }}
      transition={{ duration }}
      style={{ height: `${height}px` }}
    />
  );
};

// =====================================================
// AUTO-INCREMENTING LOADING BAR (for pages)
// =====================================================

export const AutoLoadingBar: React.FC<{ isComplete?: boolean }> = ({ isComplete = false }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isComplete) {
      setProgress(100);
      const timer = setTimeout(() => setProgress(0), 500);
      return () => clearTimeout(timer);
    }

    const timer = setInterval(() => {
      setProgress((prev) => {
        // Slow down as it approaches 90%
        if (prev > 90) return prev + (100 - prev) * 0.02;
        if (prev > 75) return prev + 5;
        if (prev > 50) return prev + 10;
        return prev + 30;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isComplete]);

  return (
    <motion.div
      className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 z-50"
      animate={{ width: `${progress}%` }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    />
  );
};

// =====================================================
// CIRCULAR PROGRESS
// =====================================================

export const CircularProgress: React.FC<{
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}> = ({ progress, size = 100, strokeWidth = 4, color = 'text-blue-500', label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5 }}
          className={color}
          strokeLinecap="round"
        />
      </svg>

      {label && <span className="text-sm font-medium">{label}</span>}
      <span className="text-xs text-gray-600">{progress}%</span>
    </div>
  );
};

// =====================================================
// GRADIENT PROGRESS BAR
// =====================================================

export const GradientProgressBar: React.FC<{
  progress: number; // 0-100
  label?: string;
  showLabel?: boolean;
  height?: number;
  animated?: boolean;
}> = ({ progress, label, showLabel = true, height = 6, animated = true }) => {
  return (
    <div className="w-full space-y-1">
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden`} style={{ height: `${height}px` }}>
        <motion.div
          className="h-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-500"
          animate={animated ? { width: `${progress}%`, opacity: [0.7, 1, 0.7] } : { width: `${progress}%` }}
          transition={animated ? { duration: 2, repeat: Infinity } : {}}
          initial={{ width: '0%' }}
        />
      </div>

      {showLabel && (
        <div className="flex justify-between text-xs text-gray-600">
          <span>{label || 'Loading'}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
};

// =====================================================
// INDETERMINATE PROGRESS (streaming/unknown duration)
// =====================================================

export const IndeterminateProgress: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => {
  return (
    <div className="w-full space-y-2">
      <div className="w-full bg-gray-200 rounded-full overflow-hidden h-2">
        <motion.div
          className="h-full bg-blue-500"
          animate={{
            x: ['0%', '100%', '-100%'],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ width: '30%' }}
        />
      </div>
      <p className="text-xs text-gray-600 text-center">{label}</p>
    </div>
  );
};

// =====================================================
// LINEAR PROGRESS STEPS
// =====================================================

export const StepProgress: React.FC<{
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}> = ({ currentStep, totalSteps, labels }) => {
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="flex gap-2 mb-3">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <motion.div
            key={i}
            className={`flex-1 h-1 rounded-full ${
              i < currentStep ? 'bg-green-500' : i === currentStep ? 'bg-blue-500' : 'bg-gray-200'
            }`}
            animate={i === currentStep ? { scale: [1, 1.1, 1] } : {}}
            transition={i === currentStep ? { duration: 1.5, repeat: Infinity } : {}}
          />
        ))}
      </div>

      {/* Labels */}
      {labels && (
        <div className="flex justify-between text-xs text-gray-600">
          {labels.map((label, i) => (
            <span key={i} className={i === currentStep ? 'font-semibold text-blue-600' : ''}>
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// =====================================================
// SKELETON PROGRESS (shimmer effect)
// =====================================================

export const SkeletonProgress: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-gradient-to-r from-gray-200 via-white to-gray-200 rounded"
          animate={{
            backgroundPosition: ['0% 0%', '100% 0%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            backgroundSize: '200% 100%',
            width: i === lines - 1 ? '80%' : '100%',
          }}
        />
      ))}
    </div>
  );
};

// =====================================================
// MULTI-BAR PROGRESS
// =====================================================

export const MultiBarProgress: React.FC<{
  items: Array<{
    label: string;
    progress: number;
    color?: string;
  }>;
}> = ({ items }) => {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">{item.label}</span>
            <span className="text-gray-600">{item.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full overflow-hidden h-2">
            <motion.div
              className={item.color || 'bg-blue-500'}
              initial={{ width: '0%' }}
              animate={{ width: `${item.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default {
  LoadingBar,
  AutoLoadingBar,
  CircularProgress,
  GradientProgressBar,
  IndeterminateProgress,
  StepProgress,
  SkeletonProgress,
  MultiBarProgress,
};
