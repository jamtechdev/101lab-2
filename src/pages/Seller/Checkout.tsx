// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  Grid3X3,
  Building2
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import BuyerHeader from '@/pages/buyer/BuyerHeader';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { useCreateCheckoutMutation } from '@/rtk/slices/checkoutApiSlice';
import { useTranslation } from 'react-i18next';

/* ---------------- Placeholder ---------------- */
const PlaceholderImg = () => (
  <div className="w-full aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
    <div className="w-20 h-20 rounded-lg bg-background/70 border border-border flex items-center justify-center text-muted-foreground">
      <Grid3X3 className="w-8 h-8" />
    </div>
  </div>
);

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const showDashboardLayout = location.pathname.startsWith("/dashboard");

  const {
    product = {},
    batch = {},
    sellerData = {},
    biddingDetails = {},
    quantity: initialQuantity = 1,
    pricePerUnit = 0,
    currency = 'USD',
  } = location.state || {};

  const { t } = useTranslation();

  /* ---------------- State ---------------- */
  const [quantity] = useState(initialQuantity);
  const [formData, setFormData] = useState({
    shippingAddress: '',
    message: `Hello 👋, I would like to place an order for ${initialQuantity} of '${product?.title || 'this item'}'.`,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [createCheckout] = useCreateCheckoutMutation();

  /* ---------------- Redirect safety ---------------- */
  useEffect(() => {
    if (!product?.product_id) {
      navigate(showDashboardLayout ? '/dashboard/browse' : '/buyer-marketplace');
    }
  }, [product, navigate, showDashboardLayout]);

  if (!product?.product_id) return null;

  /* ---------------- Helpers ---------------- */
  const parsePhpArray = meta => {
    if (!meta) return [];
    try {
      return [...meta.matchAll(/"([^"]*)"/g)]
        .map(m => m[1])
        .filter(v => v.trim() !== "");
    } catch {
      return [];
    }
  };

  const getMetaValue = (meta, key) => {
    const metaItem = meta?.find(m => m.meta_key === key);
    if (!metaItem?.meta_value) return "";
    const parsed = parsePhpArray(metaItem.meta_value);
    return parsed.length ? parsed[0] : "";
  };

  /* ---------------- Prices ---------------- */
  const unitPrice = Number(pricePerUnit) || 0;
  const isFree = unitPrice === 0;

  const formattedUnitPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(unitPrice);

  const formattedTotalPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(unitPrice * quantity);

  const locationName =
    biddingDetails?.location || getMetaValue(product.meta, 'location');

  const condition = getMetaValue(product.meta, 'condition');

  /* ---------------- Handlers ---------------- */
  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async () => {
    if (!formData.shippingAddress.trim()) {
      setErrors({ shippingAddress: 'Shipping address is required.' });
      return;
    }

    setIsSubmitting(true);

    try {
      await createCheckout({
        batch_id: batch.batch_id,
        product_id: product.product_id,
        seller_id: batch.seller_id,
        buyer_id: Number(localStorage.getItem('userId')),
        quantity,
        price_per_unit: unitPrice,
        currency,
        shipping_address: formData.shippingAddress,
        message: formData.message,
      }).unwrap();

      setShowConfirmModal(false);
      setShowSuccessModal(true);

    } catch (err) {
      setErrors({
        submit: err?.data?.message || 'Unable to submit checkout.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- Page Content ---------------- */
  const content = (
    <div className="min-h-screen bg-neutral-50">
      {!showDashboardLayout && <BuyerHeader />}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <h1 className="text-3xl font-semibold">Checkout</h1>
        <p className="text-neutral-600 mt-1">
          Review your order before submitting
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-medium mb-4">Product details</h3>

              {product.image1 ? (
                <img
                  src={product.image1}
                  alt={product.title}
                  className="w-full aspect-[4/3] object-cover rounded-lg mb-4"
                />
              ) : <PlaceholderImg />}

              <div className="text-sm space-y-1">
                <p><strong>Product:</strong> {product.title}</p>
                <p><strong>Condition:</strong> {condition}</p>
                <p><strong>Location:</strong> {locationName}</p>
                <p><strong>Unit price:</strong> {isFree ? 'Free' : formattedUnitPrice}</p>
                <p><strong>Quantity:</strong> {quantity}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-medium mb-2">Seller</h3>
              <p>{sellerData.display_name}</p>

              {sellerData.meta?.find(m => m.meta_key === 'greenbidz_company')?.meta_value && (
                <div className="flex gap-2 mt-3 text-sm">
                  <Building2 className="w-4 h-4 mt-0.5" />
                  <span>
                    {sellerData.meta.find(m => m.meta_key === 'greenbidz_company').meta_value}
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT */}
          <div className="bg-white p-6 rounded-lg shadow-sm sticky top-6">
            <p className="text-sm text-center">Total price</p>
            <p className="text-2xl font-bold text-center">
              {isFree ? 'Free' : formattedTotalPrice}
            </p>

            <Button
              className="w-full mt-6"
              onClick={() => setShowConfirmModal(true)}
            >
              Submit Checkout
            </Button>

            {errors.submit && (
              <div className="mt-4 text-red-600 text-sm flex gap-2">
                <AlertCircle className="w-4 h-4" />
                {errors.submit}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ---------------- Confirm Modal ---------------- */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <p>
              Ordering <strong>{quantity}</strong> × <strong>{product.title}</strong>
            </p>

            <div>
              <Label>Message to Seller</Label>
              <Textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Shipping Address *</Label>
              <Textarea
                name="shippingAddress"
                value={formData.shippingAddress}
                onChange={handleInputChange}
              />
              {errors.shippingAddress && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.shippingAddress}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Placing order…' : 'Place Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Success Modal ---------------- */}
      <Dialog open={showSuccessModal}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle>🎉 Order Placed Successfully</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-neutral-600">
            Your order has been placed successfully.
          </p>

          <DialogFooter className="justify-center gap-2 mt-4">
            <Button
              onClick={() =>
                navigate(showDashboardLayout ? '/dashboard/orders' : '/buyer-dashboard')
              }
            >
              View Orders
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                navigate(showDashboardLayout ? '/dashboard/browse' : '/buyer-marketplace')
              }
            >
              Browse More
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );

  return showDashboardLayout
    ? <DashboardLayout>{content}</DashboardLayout>
    : content;
}
