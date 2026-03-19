// @ts-nocheck
import React, { useState } from 'react';
import { X, DollarSign, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSubmitOfferMutation } from '@/rtk/slices/bidApiSlice';
import { useNavigate } from 'react-router-dom';

export default function MakeOfferModal({ 
  isOpen, 
  onClose, 
  product, 
  batch,
  quantity,
  maxQuantity,
  currency = 'USD'
}) {
  const [offerQuantity, setOfferQuantity] = useState(quantity);
  const [offerPrice, setOfferPrice] = useState('');
  const [message, setMessage] = useState(
    `Hello 👋, I would like to make an offer for ${quantity} of '${product.title}'.`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [SubmitOfferRequest] = useSubmitOfferMutation();
  const navigate = useNavigate();

  const buyerId = Number(localStorage.getItem('userId'));
  const companyName = localStorage.getItem('companyName') || 'Unknown Company';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!offerPrice || Number(offerPrice) <= 0) return;
    if (!offerQuantity || offerQuantity > maxQuantity) return;

    try {
      setIsSubmitting(true);


      const lang=localStorage.getItem("language")

      const payload = {
        batch_id: batch.batch_id,
        buyer_id: buyerId,
        seller_id: batch?.seller_id,
        company_name: companyName,
        amount: Number(offerPrice) * offerQuantity,
        notes: message,
        type: 'other', 
        offer_quantity: offerQuantity,
        lang:lang || 'en'
      };

      await SubmitOfferRequest(payload);

      setIsSuccess(true); // ✅ Show success message
    } catch (error) {
      console.error('Offer submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(Number(value));
  };

  const totalOffer = offerPrice && offerQuantity ? Number(offerPrice) * offerQuantity : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">
            {isSuccess ? 'Success!' : 'Make an Offer'}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Message */}
        {isSuccess ? (
          <div className="p-6 text-center space-y-4">
            <CheckCircle2 className="mx-auto w-16 h-16 text-green-500" />
            <h3 className="text-xl font-semibold text-neutral-900">Offer Submitted Successfully!</h3>
            <p className="text-neutral-600">Your offer has been sent to the seller.</p>
            <div className="flex justify-center gap-4 mt-4">
              <Button onClick={() => navigate('/dashboard/offers')}>
                View My Offers
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard/browse')}>
                Browse More Products
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Product Info */}
            <div className="bg-neutral-50 rounded-lg p-4 flex gap-4">
              {product.image1 && (
                <img 
                  src={product.image1} 
                  alt={product.title}
                  className="w-20 h-20 object-cover rounded"
                />
              )}
              <div>
                <h3 className="font-medium text-neutral-900">{product.title}</h3>
                <p className="text-sm text-neutral-600 mt-1">Batch #{batch.batch_number}</p>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <Label className="text-sm font-medium text-neutral-900">
                Quantity <span className="text-red-500">*</span>
              </Label>
              <div className="mt-2 flex items-center border border-neutral-300 rounded-md w-32">
                <button
                  type="button"
                  onClick={() => setOfferQuantity(Math.max(1, offerQuantity - 1))}
                  disabled={offerQuantity <= 1}
                  className="px-3 py-2 hover:bg-neutral-50 disabled:opacity-50"
                >
                  −
                </button>
                <input
                  type="number"
                  value={offerQuantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setOfferQuantity(Math.max(1, Math.min(val, maxQuantity)));
                  }}
                  className="w-full text-center border-x border-neutral-300 py-2"
                  min="1"
                  max={maxQuantity}
                  required
                />
                <button
                  type="button"
                  onClick={() => setOfferQuantity(Math.min(maxQuantity, offerQuantity + 1))}
                  disabled={offerQuantity >= maxQuantity}
                  className="px-3 py-2 hover:bg-neutral-50 disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Offer Price */}
            <div>
              <Label className="text-sm font-medium text-neutral-900">
                Your Offer (per unit) <span className="text-red-500">*</span>
              </Label>
              <div className="mt-2 relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <Input
                  type="number"
                  step="0.01"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              {totalOffer > 0 && (
                <p className="text-sm text-neutral-600 mt-2">
                  Total offer: <span className="font-semibold">{formatCurrency(totalOffer)}</span>
                </p>
              )}
            </div>

            {/* Message */}
            <div>
              <Label className="text-sm font-medium text-neutral-900">Notes</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-neutral-200">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-neutral-900 text-white py-3"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Offer'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 py-3"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
