// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Heart, Share2, MessageSquare, MapPin, Package, ArrowLeft, Calendar, User, Building2, AlertCircle, CheckCircle2, Clock, ShoppingCart, Percent } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetBatchByProductSlugQuery } from '@/rtk/slices/batchApiSlice';
import { SITE_TYPE } from '@/config/site';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import BuyerHeader from '@/pages/buyer/BuyerHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import MakeOfferModal from './MakeOfferModal';
import ProductESGCard from '../esg/ProductESGCard';
import ChatSidebarWrapper from '@/components/common/ChatSidebarWrapper';
import BuyerOfferSection from './BuyerOfferSection';
import { pushViewListingEvent } from '@/utils/gtm';


export default function BrowserListingDetail() {
  const { t, i18n } = useTranslation();
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const showDashboardLayout = location.pathname.startsWith("/dashboard");
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);


  const handleBackNavigation = () => {
    if (showDashboardLayout) {
      navigate('/dashboard/browse');
    } else {
      navigate('/buyer-marketplace');
    }
  };

  const { data: productData, isLoading, error } = useGetBatchByProductSlugQuery({
    productSlug: name || '',
    type: SITE_TYPE,
    buyerId: Number(localStorage.getItem("userId"))
  });

  // Fire GA4 view_listing once batch + product data loads
  useEffect(() => {
    try {
      if (!productData?.success) return;
      const p = productData.data;
      const b = p?.batch;
      if (!b || !p) return;
      pushViewListingEvent({
        batch_id:       b.batch_id ?? b.id ?? p.product_id,
        batch_number:   b.batch_number,
        batch_title:    p.title,
        batch_category: p?.categories?.[0]?.term_slug ?? p?.categories?.[0]?.term,
        batch_status:   b.status,
        item_count:     Array.isArray(b.products) ? b.products.length : 1,
        seller_id:      b.seller_id ?? p?.sellerData?.ID,
      });
    } catch {}
  }, [productData?.success]);

  const parsePhpArray = (meta: string | undefined): string[] => {
    if (!meta) return [];

    try {
      const matches = [...meta.matchAll(/"([^"]*)"/g)];
      return matches
        .map(m => m[1])
        .filter(v => v.trim() !== "");
    } catch {
      return [];
    }
  };
  const getMetaValue = (meta: any[], key: string) => {
    const metaItem = meta?.find(m => m.meta_key === key);
    if (!metaItem?.meta_value) return "";

    const parsed = parsePhpArray(metaItem.meta_value);


    if (parsed.length > 0) return parsed[0];


    if (metaItem.meta_value.includes('s:0:""')) return "";

    // fallback
    return metaItem.meta_value;
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('browserListingDetail.na');
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: string | number, currency?: string) => {
    if (!price) return t('browserListingDetail.contactForPrice');

    const validCurrency = typeof currency === 'string' && currency.length === 3 ? currency : 'TWD';

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: validCurrency,
        minimumFractionDigits: 0,
      }).format(parseFloat(price as string));
    } catch {
      return t('browserListingDetail.contactForPrice');
    }
  };

  // Get translated title or description based on current language
  const getTranslatedField = (fieldName: string) => {
    const translationKey = `${fieldName}_${i18n.language}`;
    return getMetaValue(product?.meta, translationKey) || getMetaValue(product?.meta, `${fieldName}_en`) || product?.[fieldName] || '';
  };

  const handleQuantityChange = (delta) => {
    const maxQuantity = parseInt(getMetaValue(product.meta, "quantity") || "1");
    const newQuantity = Math.max(1, Math.min(quantity + delta, maxQuantity));
    setQuantity(newQuantity);
  };

  const handleBuyNow = () => {
    // Navigate to checkout with product data - conditional based on layout
    const checkoutPath = showDashboardLayout ? '/dashboard/checkout' : '/buyer/checkout';
    navigate(checkoutPath, {
      state: {
        product,
        batch,
        biddingDetails,
        sellerData,
        quantity,
        pricePerUnit: parseFloat(getMetaValue(product.meta, "price_per_unit"))
      }
    });
  };

  const handleMakeOffer = () => {
    setShowOfferModal(true);
  };

  if (isLoading) {
    const loadingContent = (
      <div className="min-h-screen bg-neutral-50">
        {!showDashboardLayout && <BuyerHeader />}
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Skeleton className="w-32 h-10 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="w-full h-[500px]" />
            <div className="space-y-4">
              <Skeleton className="w-3/4 h-10" />
              <Skeleton className="w-1/2 h-8" />
              <Skeleton className="w-full h-32" />
            </div>
          </div>
        </div>
      </div>
    );
    return showDashboardLayout ? <DashboardLayout>{loadingContent}</DashboardLayout> : loadingContent;
  }

  if (error || !productData?.success) {
    const errorContent = (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        {!showDashboardLayout && <BuyerHeader />}
        <div className="text-center p-8 bg-white rounded-lg shadow-sm max-w-md">
          <AlertCircle className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-neutral-900 mb-2">{t('browserListingDetail.productNotFound')}</h2>
          <p className="text-neutral-600 mb-6">{t('browserListingDetail.productNotFoundDescription')}</p>
          <Button
            onClick={handleBackNavigation}
            className="bg-neutral-900 hover:bg-neutral-800 text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('browserListingDetail.backToBrowse')}
          </Button>
        </div>
      </div>
    );
    return showDashboardLayout ? <DashboardLayout>{errorContent}</DashboardLayout> : errorContent;
  }


  const product = productData.data;
  const { batch, biddingDetails, sellerData, buyerOffer } = productData.data;
  console.log("prod1", productData.data.buyerOffer)



  const images = product?.attachments
    ?.filter(att => att.type?.startsWith('image'))
    .map(att => att.url) || [];

  const mainImage = images[selectedImage] || product?.image1 || 'https://via.placeholder.com/800';
  const condition = getMetaValue(product?.meta, "condition");
  const maxQuantity = parseInt(getMetaValue(product?.meta, "quantity") || "1");
  const location1 = biddingDetails?.location1 || getMetaValue(product?.meta, "location") || t('browserListingDetail.locationNotSpecified');

  // Get pricing metadata
  const priceNowEnabled = getMetaValue(product?.meta, "price_now_enabled") === "1";
  const priceFormat = getMetaValue(product?.meta, "price_format"); // "buyNow" or "makeOffer"
  const pricePerUnit = parseFloat(getMetaValue(product?.meta, "price_per_unit"));
  const productCurrency = getMetaValue(product?.meta, "_product_currency") || "USD";

  const getConditionLabel = (cond) => {
    if (!cond) return t('browserListingDetail.conditionNotSpecified');
    return t(`browserListingDetail.conditionLabels.${cond}`, cond);
  };

  const loggedInUserId = Number(localStorage.getItem("userId"));
  const sellerUserId = Number(sellerData?.ID);
  const isOwnProduct = loggedInUserId === sellerUserId;



  const content = (
    <div className="min-h-screen bg-neutral-50">
      {!showDashboardLayout && <BuyerHeader />}
      <div className="max-w-6xl mx-auto px-4 py-4">

        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBackNavigation}
          className="mb-4 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('browserListingDetail.back')}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left Column - Images */}
          <div className="space-y-2">

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-16 h-16 border-2 rounded overflow-hidden transition-all ${selectedImage === index
                      ? 'border-neutral-900 ring-2 ring-neutral-900 ring-offset-2'
                      : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt={`View ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <img
                src={mainImage}
                alt={getTranslatedField('title')}
                className="w-full h-auto object-contain"
              />
            </div>

            {/* Description */}
            {(getTranslatedField('description') || product?.description) && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">{t('browserListingDetail.details')}</h2>
                {(() => {
                  const desc = getTranslatedField('description') || "";
                  return /<[a-z][\s\S]*>/i.test(desc)
                    ? <div className="text-neutral-700 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: desc }} />
                    : <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">{desc}</p>;
                })()}

                {/* Extra Content (rich text) below description */}
                {(() => {
                  const extra = getTranslatedField('extra_content') || getMetaValue(product?.meta, 'extra_content') || "";
                  if (!extra) return null;
                  return (
                    <div className="mt-4 prose prose-sm max-w-none text-neutral-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: extra }}
                    />
                  );
                })()}

                {product.categories && product.categories.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-neutral-200">
                    <p className="text-sm text-neutral-600 mb-2">
                      {t('browserListingDetail.category')} <span className="text-neutral-900 font-medium">{product.categories[0].term}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-4">

            {/* Title & Price Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h1 className="text-2xl font-semibold text-neutral-900 mb-2">{getTranslatedField('title')}</h1>

              {/* Price Display */}
              {priceNowEnabled && pricePerUnit > 0 && (
                <div className="mb-3">
                  <div className="text-3xl font-semibold text-neutral-900">
                    {formatPrice(pricePerUnit, productCurrency)}
                    <span className="text-base text-neutral-600 font-normal ml-2">{t('browserListingDetail.perUnit')}</span>
                  </div>
                  {quantity > 1 && (
                    <div className="text-sm text-neutral-600 mt-1">
                      {t('browserListingDetail.total')}: {formatPrice(pricePerUnit * quantity, productCurrency)}
                    </div>
                  )}
                </div>
              )}

              {/* Info Pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded-md">
                  {maxQuantity} {t('browserListingDetail.available')}
                </span>
                <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded-md">
                  {getConditionLabel(condition)}
                </span>
                {batch.batch_number && (
                  <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded-md">
                    {t('browserListingDetail.batch')} #{batch.batch_number}
                  </span>
                )}
              </div>


              {/* Bidding Timeline */}
              {biddingDetails && (
                <div className="mb-4 pb-4 border-b border-neutral-200">
                  <div className="flex items-center gap-2 text-neutral-700 text-sm mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">{t('browserListingDetail.biddingPeriod')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm pl-6">
                    <div>
                      <div className="text-neutral-600">{t('browserListingDetail.starts')}</div>
                      <div className="text-neutral-900 font-medium">{formatDate(biddingDetails.start_date)}</div>
                    </div>
                    <div>
                      <div className="text-neutral-600">{t('browserListingDetail.ends')}</div>
                      <div className="text-neutral-900 font-medium">{formatDate(biddingDetails.end_date)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Commission: seller pays this to the site; priority seller > batch > global */}
              {(() => {
                const pct = (batch as { commission_percent?: number | null })?.commission_percent;
                if (pct == null || Number(pct) < 0) return null;
                return (
                  <div className="mb-4 p-4 rounded-lg border-2 border-amber-200 bg-amber-50/80 dark:border-amber-800/50 dark:bg-amber-950/30">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100 font-semibold text-base mb-1.5">
                      <Percent className="w-5 h-5 shrink-0" />
                      <span>{t('browserListingDetail.commission')}: </span>
                      <span className="text-lg">{Number(pct)}%</span>
                    </div>
                    <p className="text-sm text-amber-800 dark:text-amber-200 pl-7">
                      {t('browserListingDetail.sellerPaysCommission', { percent: Number(pct) })}
                    </p>
                  </div>
                );
              })()}

              {/* Quantity Selector - Only show if price_now_enabled */}
              {priceNowEnabled && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">{t('browserListingDetail.quantity')}</label>
                  <div className="flex items-center border border-neutral-300 rounded-md w-32">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="px-3 py-2 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setQuantity(Math.max(1, Math.min(val, maxQuantity)));
                      }}
                      className="w-full text-center border-x border-neutral-300 py-2 focus:outline-none"
                      min="1"
                      max={maxQuantity}
                    />
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= maxQuantity}
                      className="px-3 py-2 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">{t('browserListingDetail.maximumUnits', { count: maxQuantity })}</p>
                </div>
              )}

              {/* Action Buttons - Conditional based on price_now_enabled and price_format */}
              <div className="space-y-2 mb-4">
                {isOwnProduct ? (
                  <Button
                    disabled
                    className="w-full bg-neutral-300 text-neutral-600 py-6 text-base font-medium cursor-not-allowed"
                  >
                    Your Product
                  </Button>
                ) : priceNowEnabled ? (
                  priceFormat === 'buyNow' ? (
                    <Button
                      onClick={handleBuyNow}
                      className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-6 text-base font-medium transition-colors"
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      {t('browserListingDetail.buyNow')} -{" "}
                      {formatPrice(pricePerUnit * quantity, productCurrency)}
                    </Button>
                  ) : priceFormat === 'offer' ? (
                    <Button
                      onClick={handleMakeOffer}
                      className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-6 text-base font-medium transition-colors"
                    >
                      <MessageSquare className="mr-2 h-5 w-5" />
                      {t('browserListingDetail.makeAnOffer')}
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-6 text-base font-medium transition-colors"
                    >
                      <MessageSquare className="mr-2 h-5 w-5" />
                      {t('browserListingDetail.contactSeller')}
                    </Button>
                  )
                ) : (
                  <Button
                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-6 text-base font-medium transition-colors"
                    onClick={() => setShowMessageDialog(true)}
                  >
                    <MessageSquare className="mr-2 h-5 w-5" />
                    {t('browserListingDetail.contactSeller')}
                  </Button>
                )}
              </div>
              {product && (
                <ProductESGCard product={product} />
              )}

              {/* Quick Actions */}
              {/* <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <button
                  onClick={() => setIsFavorited(!isFavorited)}
                  className="flex items-center gap-2 text-neutral-700 hover:text-neutral-900 text-sm transition-colors"
                >
                  <Heart className={`h-5 w-5 transition-all ${isFavorited ? 'fill-current text-red-500' : ''}`} />
                  {isFavorited ? t('browserListingDetail.saved') : t('browserListingDetail.save')}
                </button>
                <button className="flex items-center gap-2 text-neutral-700 hover:text-neutral-900 text-sm transition-colors">
                  <Share2 className="h-5 w-5" />
                  {t('browserListingDetail.share')}
                </button>
              </div> */}

              {/* Important Notes */}
              {biddingDetails?.notes && (
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <div className="flex items-start gap-2 text-sm mb-2">
                    <AlertCircle className="w-4 h-4 text-neutral-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      {biddingDetails.notes.inspection_needed && (
                        <p className="text-neutral-700">{t('browserListingDetail.inspectionRequired')}</p>
                      )}
                      {biddingDetails.notes.required_docs && (
                        <p className="text-neutral-700">
                          <span className="font-medium">{t('browserListingDetail.requiredDocuments')}</span> {biddingDetails.notes.required_docs}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Seller Info Card */}
            {sellerData && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">{t('browserListingDetail.sellerInformation')}</h3>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 font-semibold text-lg">
                    {sellerData.display_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-neutral-900">{sellerData.display_name}</div>
                    <div className="text-sm text-neutral-600">
                      {t('browserListingDetail.memberSince')} {formatDate(sellerData.user_registered)}
                    </div>
                  </div>
                </div>

                {sellerData.meta?.find(m => m.meta_key === 'greenbidz_company')?.meta_value && (
                  <div className="flex items-start gap-2 text-sm pt-3 border-t border-neutral-200">
                    <Building2 className="w-4 h-4 text-neutral-600 mt-0.5" />
                    <div>
                      <div className="text-neutral-600 mb-1">{t('browserListingDetail.company')}</div>
                      <div className="text-neutral-900 font-medium">
                        {sellerData.meta.find(m => m.meta_key === 'greenbidz_company').meta_value}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Location Card */}
            {/* <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-neutral-600 mt-1" />
                <div>
                  <h3 className="font-medium text-neutral-900 mb-1">{t('browserListingDetail.shipsFrom')} {location1}</h3>
                  <p className="text-sm text-neutral-600">{t('browserListingDetail.localPickupAvailable')}</p>
                  <p className="text-sm text-neutral-900 font-medium mt-1">{location1}</p>
                </div>
              </div>
            </div> */}

            {/* Batch Status */}
            {batch.status && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-medium text-neutral-900 mb-3">{t('browserListingDetail.listingStatus')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">{t('browserListingDetail.status')}</span>
                    <span className="text-neutral-900 font-medium capitalize">{batch.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">{t('browserListingDetail.type')}</span>
                    <span className="text-neutral-900 font-medium capitalize">
                      {biddingDetails?.type?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">{t('browserListingDetail.totalBids')}</span>
                    <span className="text-neutral-900 font-medium">
                      {biddingDetails?.buyer_bids?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <BuyerOfferSection buyerOffer={buyerOffer} />

          </div>
        </div>

        <ChatSidebarWrapper
          isOpen={showMessageDialog}
          onClose={() => setShowMessageDialog(false)}
          batchId={product?.product_id}
          sellerId={sellerUserId}
          embedded={false}
        />
      </div>
    </div>
  );



  return (
    <>
      {showDashboardLayout ? <DashboardLayout>{content}</DashboardLayout> : content}

      {/* Make Offer Modal */}
      {showOfferModal && (
        <MakeOfferModal
          isOpen={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          product={product}
          batch={batch}
          quantity={quantity}
          maxQuantity={maxQuantity}
          currency={productCurrency}
        />
      )}
    </>
  );
}