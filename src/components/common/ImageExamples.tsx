/**
 * ========================================
 * IMAGE USAGE EXAMPLES
 * ========================================
 *
 * Copy-paste these examples into your components
 */

import React from 'react';
import OptimizedImage from '@/components/common/OptimizedImage';
import { getImageForUseCase, getOptimizedImageUrl } from '@/services/imageService';

// =====================================================
// EXAMPLE 1: PRODUCT CARD IMAGE
// =====================================================

export const ProductCardExample = ({ product }: any) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow">
      {/* Product image */}
      <OptimizedImage
        src={product.mainImage}
        alt={`${product.name} product image`}
        width={300}
        height={200}
        quality="medium"
        className="group-hover:scale-105 transition-transform"
        objectFit="cover"
      />

      {/* Product info */}
      <div className="p-4">
        <h3 className="font-semibold">{product.name}</h3>
        <p className="text-gray-600">${product.price}</p>
      </div>
    </div>
  );
};

// =====================================================
// EXAMPLE 2: PRODUCT DETAILS (HIGH QUALITY)
// =====================================================

export const ProductDetailsExample = ({ product }: any) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Main image - high quality */}
      <div className="col-span-2">
        <OptimizedImage
          src={product.mainImage}
          alt={`${product.name} main image`}
          width={600}
          height={600}
          quality="high"
          objectFit="contain"
          className="rounded-lg"
        />
      </div>

      {/* Thumbnails */}
      <div className="space-y-2">
        {product.images?.map((img: string, idx: number) => (
          <OptimizedImage
            key={idx}
            src={img}
            alt={`${product.name} view ${idx + 1}`}
            width={120}
            height={120}
            quality="medium"
            className="cursor-pointer border rounded hover:border-blue-500"
            objectFit="cover"
          />
        ))}
      </div>
    </div>
  );
};

// =====================================================
// EXAMPLE 3: LANDING PAGE HERO
// =====================================================

export const HeroImageExample = () => {
  const heroUrl = '/images/hero-banner.jpg';

  return (
    <div className="relative w-full h-96">
      <OptimizedImage
        src={heroUrl}
        alt="Hero banner - Industrial equipment marketplace"
        width={1200}
        height={400}
        quality="high"
        className="w-full h-full"
        objectFit="cover"
        showPlaceholder={true}
      />

      {/* Overlay content */}
      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
        <h1 className="text-white text-4xl font-bold">Welcome to GreenBidz</h1>
      </div>
    </div>
  );
};

// =====================================================
// EXAMPLE 4: SELLER AVATAR
// =====================================================

export const SellerAvatarExample = ({ seller }: any) => {
  return (
    <div className="flex items-center gap-3">
      {/* Avatar - low quality, small */}
      <OptimizedImage
        src={seller.avatar}
        alt={`${seller.name} avatar`}
        width={48}
        height={48}
        quality="low"
        className="rounded-full"
        objectFit="cover"
      />

      {/* Seller info */}
      <div>
        <h4 className="font-semibold">{seller.name}</h4>
        <p className="text-sm text-gray-600">⭐ {seller.rating}/5</p>
      </div>
    </div>
  );
};

// =====================================================
// EXAMPLE 5: CATEGORY IMAGE
// =====================================================

export const CategoryCardExample = ({ category }: any) => {
  return (
    <div className="relative rounded-lg overflow-hidden h-32 group">
      <OptimizedImage
        src={category.image}
        alt={`${category.name} category`}
        width={300}
        height={150}
        quality="medium"
        className="group-hover:scale-110 transition-transform duration-300"
        objectFit="cover"
      />

      {/* Label overlay */}
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <span className="text-white font-semibold text-lg">
          {category.name}
        </span>
      </div>
    </div>
  );
};

// =====================================================
// EXAMPLE 6: GALLERY / LIGHTBOX
// =====================================================

export const GalleryImageExample = ({ images }: any) => {
  const [selectedIdx, setSelectedIdx] = React.useState(0);

  return (
    <div>
      {/* Main image - high quality */}
      <div className="mb-4 bg-gray-100 rounded-lg">
        <OptimizedImage
          src={images[selectedIdx]}
          alt={`Gallery image ${selectedIdx + 1}`}
          width={800}
          height={600}
          quality="high"
          objectFit="contain"
          className="w-full"
        />
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2 overflow-x-auto">
        {images.map((img: string, idx: number) => (
          <button
            key={idx}
            onClick={() => setSelectedIdx(idx)}
            className={`
              flex-shrink-0 border-2 rounded
              ${selectedIdx === idx ? 'border-blue-500' : 'border-gray-300'}
            `}
          >
            <OptimizedImage
              src={img}
              alt={`Thumbnail ${idx + 1}`}
              width={80}
              height={80}
              quality="low"
              objectFit="cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

// =====================================================
// EXAMPLE 7: USING SERVICE DIRECTLY (Alternative)
// =====================================================

export const ServiceDirectExample = ({ product }: any) => {
  // Get optimized URL from service
  const imageUrl = getImageForUseCase(product.image, 'card');

  return (
    <img
      src={imageUrl}
      alt={product.name}
      width={300}
      height={200}
      loading="lazy"
      decoding="async"
      className="object-cover"
    />
  );
};

// =====================================================
// EXAMPLE 8: MOSAIC LAYOUT (Multiple Images)
// =====================================================

export const MosaicLayoutExample = ({ product }: any) => {
  const images = [product.mainImage];
  const thumbnails = product.sideImages || [];

  return (
    <div className="grid grid-cols-4 gap-2">
      {/* Main image - 2x2 */}
      <div className="col-span-2 row-span-2">
        <OptimizedImage
          src={images[0]}
          alt="Main product image"
          width={300}
          height={300}
          quality="high"
          className="rounded-lg"
          objectFit="cover"
        />
      </div>

      {/* Thumbnail images - 1x1 each */}
      {thumbnails.slice(0, 4).map((img: string, idx: number) => (
        <OptimizedImage
          key={idx}
          src={img}
          alt={`Product view ${idx + 1}`}
          width={100}
          height={100}
          quality="medium"
          className="rounded-lg cursor-pointer hover:opacity-80"
          objectFit="cover"
        />
      ))}
    </div>
  );
};

// =====================================================
// EXAMPLE 9: BACKGROUND IMAGE
// =====================================================

export const BackgroundImageExample = ({ backgroundUrl }: any) => {
  const optimizedUrl = getOptimizedImageUrl(backgroundUrl, 1920, 1080, 'high');

  return (
    <div
      className="w-full h-96 rounded-lg"
      style={{
        backgroundImage: `url('${optimizedUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Content */}
    </div>
  );
};

// =====================================================
// EXAMPLE 10: LAZY LOAD WITH CUSTOM ERROR
// =====================================================

export const CustomErrorExample = ({ product }: any) => {
  const [loadError, setLoadError] = React.useState(false);

  return (
    <OptimizedImage
      src={product.image}
      alt={product.name}
      width={300}
      height={200}
      quality="medium"
      onError={() => {
        setLoadError(true);
        console.error(`Failed to load image: ${product.image}`);
      }}
      errorComponent={
        <div className="text-center">
          <div className="text-4xl">📷</div>
          <p className="text-gray-600 mt-2">Image not available</p>
          <button
            onClick={() => setLoadError(false)}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Retry
          </button>
        </div>
      }
    />
  );
};

export default {
  ProductCardExample,
  ProductDetailsExample,
  HeroImageExample,
  SellerAvatarExample,
  CategoryCardExample,
  GalleryImageExample,
  ServiceDirectExample,
  MosaicLayoutExample,
  BackgroundImageExample,
  CustomErrorExample,
};
