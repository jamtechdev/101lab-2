// @ts-nocheck
import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [offerPrice, setOfferPrice] = useState('');
  const [company, setCompany] = useState(localStorage.getItem('companyName') || '');
  const [contactPerson, setContactPerson] = useState(localStorage.getItem('userName') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [SubmitOfferRequest] = useSubmitOfferMutation();
  const navigate = useNavigate();

  const buyerId = Number(localStorage.getItem('userId'));
  const lang = localStorage.getItem('language') || 'en';

  const handleReview = (e) => {
    e.preventDefault();
    if (!offerPrice || Number(offerPrice) <= 0) return;
    setStep('review');
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const payload = {
        batch_id: batch.batch_id,
        buyer_id: buyerId,
        seller_id: batch?.seller_id,
        company_name: company,
        amount: Number(offerPrice),
        notes: '',
        type: 'other',
        offer_quantity: 1,
        lang,
      };
      await SubmitOfferRequest(payload);
      setIsSuccess(true);
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
      minimumFractionDigits: 2,
    }).format(Number(value));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              {isSuccess ? 'Offer Submitted!' : step === 'review' ? 'Confirm Your Offer' : 'Make Offer'}
            </h2>
            {!isSuccess && (
              <p className="text-sm text-neutral-500 mt-1">
                {step === 'review'
                  ? 'Please double-check before submitting. This action cannot be undone.'
                  : 'Submit your price for this item.'}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 mt-0.5 ml-4 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success */}
        {isSuccess ? (
          <div className="px-6 pb-6 text-center space-y-4">
            <CheckCircle2 className="mx-auto w-14 h-14 text-green-500" />
            <p className="text-neutral-600">Your offer has been sent to the seller.</p>
            <div className="flex flex-col gap-2 mt-2">
              <Button
                onClick={() => navigate('/dashboard/offers')}
                className="bg-[#1a3c2a] hover:bg-[#152e21] text-white"
              >
                View My Offers
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard/browse')}>
                Browse More Products
              </Button>
            </div>
          </div>

        ) : step === 'review' ? (
          /* ── Confirm step ── */
          <div className="px-6 pb-6 space-y-5">
            {/* Summary table */}
            <div className="border border-neutral-200 rounded-lg overflow-hidden text-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                <span className="text-neutral-500">Company</span>
                <span className="font-semibold text-neutral-900 text-right max-w-[60%] break-words">{company}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-neutral-500">Contact</span>
                <span className="font-semibold text-neutral-900 text-right max-w-[60%] break-words">{contactPerson}</span>
              </div>
            </div>

            {/* Offer amount box */}
            <div className="border border-amber-200 bg-amber-50/60 rounded-lg p-5 text-center">
              <p className="text-xs uppercase tracking-widest text-neutral-400 mb-2">Your Offer</p>
              <p className="text-3xl font-bold text-neutral-900">{formatCurrency(offerPrice)}</p>
            </div>

            <p className="text-sm text-center text-neutral-500">Are you sure you want to submit this offer?</p>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('form')}
                className="flex-1 border-neutral-300"
              >
                Go Back
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-[#1a3c2a] hover:bg-[#152e21] text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Submit Offer'}
              </Button>
            </div>
          </div>

        ) : (
          /* ── Form step ── */
          <form onSubmit={handleReview} className="px-6 pb-6 space-y-4">
            {/* Company */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2 block">
                Company
              </Label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Your company name"
                className="bg-neutral-50 border-neutral-200"
                required
              />
            </div>

            {/* Contact Person */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2 block">
                Contact Person
              </Label>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Contact person name"
                className="bg-neutral-50 border-neutral-200"
                required
              />
            </div>

            {/* Offer Price */}
            <div>
              <Label className="text-sm font-semibold text-neutral-900 mb-2 block">
                Offer Price ({currency})
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium select-none">
                  $
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  placeholder="Enter your offer"
                  className="pl-8 bg-neutral-50 border-neutral-200"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-neutral-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#1a3c2a] hover:bg-[#152e21] text-white"
              >
                Review Offer
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
