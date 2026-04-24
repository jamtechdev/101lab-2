// @ts-nocheck
import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSubmitOfferMutation } from '@/rtk/slices/bidApiSlice';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { pushMakeOfferEvent } from '@/utils/gtm';
import { SITE_TYPE } from '@/config/site';

export default function MakeOfferModal({
  isOpen,
  onClose,
  product,
  batch,
  quantity,
  maxQuantity,
  currency = 'USD'
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerQuantity, setOfferQuantity] = useState(quantity || 1);
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
    if (!offerQuantity || Number(offerQuantity) < 1) return;
    setStep('review');
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const qty = Number(offerQuantity) || 1;
      const payload = {
        batch_id: batch.batch_id,
        buyer_id: buyerId,
        seller_id: batch?.seller_id,
        company_name: company,
        amount: Number(offerPrice),
        notes: '',
        type: SITE_TYPE,
        offer_quantity: qty,
        lang,
      };
      await SubmitOfferRequest(payload);

      try {
        pushMakeOfferEvent({
          batch_id:       batch.batch_id,
          offer_amount:   Number(offerPrice),
          offer_quantity: qty,
          currency,
        });
      } catch { /* tracking errors must never affect UX */ }

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
              {isSuccess
                ? t('makeOfferModal.successTitle')
                : step === 'review'
                ? t('makeOfferModal.confirmTitle')
                : t('makeOfferModal.title')}
            </h2>
            {!isSuccess && (
              <p className="text-sm text-neutral-500 mt-1">
                {step === 'review'
                  ? t('makeOfferModal.confirmSubtitle')
                  : t('makeOfferModal.subtitle')}
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
            <p className="text-neutral-600">{t('makeOfferModal.successMessage')}</p>
            <div className="flex flex-col gap-2 mt-2">
              <Button
                onClick={() => navigate('/dashboard/offers')}
                className="bg-[#1a3c2a] hover:bg-[#152e21] text-white"
              >
                {t('makeOfferModal.viewOffers')}
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard/browse')}>
                {t('makeOfferModal.browseMore')}
              </Button>
            </div>
          </div>

        ) : step === 'review' ? (
          /* ── Confirm step ── */
          <div className="px-6 pb-6 space-y-5">
            {/* Summary table */}
            <div className="border border-neutral-200 rounded-lg overflow-hidden text-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                <span className="text-neutral-500">{t('makeOfferModal.company')}</span>
                <span className="font-semibold text-neutral-900 text-right max-w-[60%] break-words">{company}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                <span className="text-neutral-500">{t('makeOfferModal.contactPerson')}</span>
                <span className="font-semibold text-neutral-900 text-right max-w-[60%] break-words">{contactPerson}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-neutral-500">{t('makeOfferModal.quantity')}</span>
                <span className="font-semibold text-neutral-900">{offerQuantity}</span>
              </div>
            </div>

            {/* Offer amount box */}
            <div className="border border-amber-200 bg-amber-50/60 rounded-lg p-5 text-center">
              <p className="text-xs uppercase tracking-widest text-neutral-400 mb-2">{t('makeOfferModal.yourOffer')}</p>
              <p className="text-3xl font-bold text-neutral-900">{formatCurrency(offerPrice)}</p>
            </div>

            <p className="text-sm text-center text-neutral-500">{t('makeOfferModal.confirmQuestion')}</p>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('form')}
                className="flex-1 border-neutral-300"
              >
                {t('makeOfferModal.goBack')}
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-[#1a3c2a] hover:bg-[#152e21] text-white"
              >
                {isSubmitting ? t('makeOfferModal.submitting') : t('makeOfferModal.submitOffer')}
              </Button>
            </div>
          </div>

        ) : (
          /* ── Form step ── */
          <form onSubmit={handleReview} className="px-6 pb-6 space-y-4">
            {/* Company */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2 block">
                {t('makeOfferModal.company')}
              </Label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={t('makeOfferModal.companyPlaceholder')}
                className="bg-neutral-50 border-neutral-200"
                required
              />
            </div>

            {/* Contact Person */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2 block">
                {t('makeOfferModal.contactPerson')}
              </Label>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder={t('makeOfferModal.contactPersonPlaceholder')}
                className="bg-neutral-50 border-neutral-200"
                required
              />
            </div>

            {/* Offer Quantity */}
            <div>
              <Label className="text-sm font-semibold text-neutral-900 mb-2 block">
                {t('makeOfferModal.offerQuantity')}
              </Label>
              <Input
                type="number"
                min="1"
                max={maxQuantity || undefined}
                step="1"
                value={offerQuantity}
                onChange={(e) => setOfferQuantity(e.target.value)}
                placeholder={t('makeOfferModal.offerQuantityPlaceholder')}
                className="bg-neutral-50 border-neutral-200"
                required
              />
              {maxQuantity && (
                <p className="text-xs text-neutral-400 mt-1">
                  {t('auctionPage.maximumUnits', { count: maxQuantity })}
                </p>
              )}
            </div>

            {/* Offer Price */}
            <div>
              <Label className="text-sm font-semibold text-neutral-900 mb-2 block">
                {t('makeOfferModal.offerPrice')} ({currency})
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
                  placeholder={t('makeOfferModal.offerPricePlaceholder')}
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
                {t('makeOfferModal.cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#1a3c2a] hover:bg-[#152e21] text-white"
              >
                {t('makeOfferModal.reviewOffer')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
