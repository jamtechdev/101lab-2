/**
 * ========================================
 * SKELETON LOADERS
 * ========================================
 *
 * Smooth skeleton screens instead of spinners
 * Shows content structure while loading
 */

import React from 'react';

// =====================================================
// PRODUCT CARD SKELETON
// =====================================================

export const ProductCardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg overflow-hidden shadow animate-pulse">
          {/* Image placeholder */}
          <div className="w-full h-48 bg-gray-300" />

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <div className="h-4 bg-gray-200 rounded w-3/4" />

            {/* Description */}
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
            </div>

            {/* Price and button row */}
            <div className="flex justify-between items-center pt-2">
              <div className="h-5 bg-gray-300 rounded w-20" />
              <div className="h-8 bg-gray-300 rounded w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// =====================================================
// LIST ITEM SKELETON
// =====================================================

export const ListItemSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded animate-pulse">
          {/* Avatar */}
          <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0" />

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>

          {/* Action */}
          <div className="w-16 h-8 bg-gray-300 rounded flex-shrink-0" />
        </div>
      ))}
    </div>
  );
};

// =====================================================
// TABLE SKELETON
// =====================================================

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex bg-gray-100 animate-pulse">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex-1 h-10 bg-gray-200 border-r border-gray-200" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex border-b border-gray-200 animate-pulse">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="flex-1 h-12 bg-gray-100 border-r border-gray-200 flex items-center px-4"
            >
              <div className="h-3 bg-gray-300 rounded w-4/5" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// =====================================================
// TEXT SKELETON (for paragraphs)
// =====================================================

export const TextSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 rounded"
          style={{
            width: i === lines - 1 ? '80%' : '100%',
          }}
        />
      ))}
    </div>
  );
};

// =====================================================
// HEADER SKELETON
// =====================================================

export const HeaderSkeleton: React.FC = () => {
  return (
    <div className="bg-white border-b border-gray-200 p-4 space-y-3 animate-pulse">
      {/* Logo area */}
      <div className="flex justify-between items-center">
        <div className="h-8 w-32 bg-gray-300 rounded" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 w-10 bg-gray-200 rounded" />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 w-20 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  );
};

// =====================================================
// SIDEBAR SKELETON
// =====================================================

export const SidebarSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <div className="space-y-3 p-4 animate-pulse">
      {/* Header */}
      <div className="h-6 w-1/2 bg-gray-300 rounded mb-4" />

      {/* Items */}
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-4/5 ml-4" />
        </div>
      ))}
    </div>
  );
};

// =====================================================
// CARD GRID SKELETON
// =====================================================

export const CardGridSkeleton: React.FC<{ count?: number; cols?: number }> = ({
  count = 6,
  cols = 3
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(${100 / cols}%, 1fr))`,
      gap: '1.5rem'
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg overflow-hidden shadow animate-pulse">
          {/* Image */}
          <div className="w-full h-32 bg-gray-300" />

          {/* Content */}
          <div className="p-3 space-y-2">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
};

// =====================================================
// DASHBOARD WIDGET SKELETON
// =====================================================

export const WidgetSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg p-6 shadow animate-pulse space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-6 bg-gray-300 rounded w-24" />
        </div>
        <div className="h-8 w-8 bg-gray-200 rounded" />
      </div>

      {/* Chart area */}
      <div className="h-40 bg-gray-100 rounded flex items-end gap-1 p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-300 rounded-t"
            style={{ height: `${Math.random() * 100}%`, minHeight: '4px' }}
          />
        ))}
      </div>
    </div>
  );
};

// =====================================================
// DETAIL PAGE SKELETON
// =====================================================

export const DetailPageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero image */}
      <div className="w-full h-96 bg-gray-300 rounded-lg" />

      {/* Title and metadata */}
      <div className="space-y-3">
        <div className="h-8 bg-gray-300 rounded w-2/3" />
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-24" />
          ))}
        </div>
      </div>

      {/* Content sections */}
      {Array.from({ length: 3 }).map((_, section) => (
        <div key={section} className="space-y-3 border-t pt-6">
          <div className="h-6 bg-gray-300 rounded w-40" />
          {Array.from({ length: 3 }).map((_, line) => (
            <div
              key={line}
              className="h-4 bg-gray-200 rounded"
              style={{
                width: line === 2 ? '85%' : '100%',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default {
  ProductCardSkeleton,
  ListItemSkeleton,
  TableSkeleton,
  TextSkeleton,
  HeaderSkeleton,
  SidebarSkeleton,
  CardGridSkeleton,
  WidgetSkeleton,
  DetailPageSkeleton,
};
