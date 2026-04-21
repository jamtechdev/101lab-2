import React, { useState } from 'react';
import { X, Upload, FileText, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CountrySelect } from '@/components/common/CountrySelect';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSubmitOfferMutation } from '@/rtk/slices/bidApiSlice';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { SITE_TYPE } from '@/config/site';
import { pushPlaceBidEvent } from '@/utils/gtm';

interface MakeBiddingOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: {
    batch_id: number;
    batch_number: string;
    title: string;
  };
}

export default function MakeBiddingOfferModal({
  isOpen,
  onClose,
  batch
}: MakeBiddingOfferModalProps) {
  const { t } = useTranslation();
  const [submitOffer, { isLoading }] = useSubmitOfferMutation();

  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    country: '',
    amount: '',
    notes: '',
    type: SITE_TYPE as 'recycle' | 'other'
  });

  const [documentImage, setDocumentImage] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentImage(file);
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setDocumentPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setDocumentPreview(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast.error('User not authenticated');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('batch_id', batch.batch_id.toString());
      formDataToSend.append('buyer_id', userId);
      formDataToSend.append('company_name', formData.company_name);
      formDataToSend.append('contact_person', formData.contact_person || '');
      formDataToSend.append('country', formData.country || '');
      formDataToSend.append('amount', formData.amount || '');
      formDataToSend.append('notes', formData.notes || '');
      formDataToSend.append('type', formData.type);

      if (documentImage) {
        formDataToSend.append('document_image', documentImage);
      }

      const result = await submitOffer(formDataToSend).unwrap();

      try {
        pushPlaceBidEvent({
          batch_id:    batch.batch_id,
          batch_number: batch.batch_number,
          bid_amount:  Number(formData.amount),
          currency:    "TWD",
          bid_type:    "whole_item",
        });
      } catch { /* tracking errors must never affect UX */ }

      toast.success(result.message);
      onClose();

      // Reset form
      setFormData({
        company_name: '',
        contact_person: '',
        country: '',
        amount: '',
        notes: '',
        type: SITE_TYPE
      });
      setDocumentImage(null);
      setDocumentPreview(null);

    } catch (error: any) {
      toast.error(error.data?.message || 'Failed to submit offer');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">Make an Offer</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Batch Info */}
          <div className="bg-neutral-50 rounded-lg p-4">
            <h3 className="font-medium text-neutral-900">{batch.title}</h3>
            <p className="text-sm text-neutral-600 mt-1">Batch #{batch.batch_number}</p>
          </div>

          {/* Company Name */}
          <div>
            <Label htmlFor="company_name" className="text-sm font-medium text-neutral-900">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="company_name"
              type="text"
              value={formData.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              placeholder="Enter your company name"
              className="mt-2"
              required
            />
          </div>

          {/* Contact Person */}
          <div>
            <Label htmlFor="contact_person" className="text-sm font-medium text-neutral-900">
              Contact Person
            </Label>
            <Input
              id="contact_person"
              type="text"
              value={formData.contact_person}
              onChange={(e) => handleInputChange('contact_person', e.target.value)}
              placeholder="Enter contact person name"
              className="mt-2"
            />
          </div>

          {/* Country */}
          <div>
            <Label htmlFor="country" className="text-sm font-medium text-neutral-900">
              Country
            </Label>
            <CountrySelect
              id="country"
              value={formData.country}
              onChange={(v) => handleInputChange('country', v)}
              className="mt-2 h-10"
            />
          </div>

          {/* Offer Amount */}
          <div>
            <Label htmlFor="amount" className="text-sm font-medium text-neutral-900">
              Offer Amount (Optional)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="Enter your offer amount"
              className="mt-2"
            />
          </div>

          {/* Offer Type */}
          <div>
            <Label className="text-sm font-medium text-neutral-900">
              Offer Type
            </Label>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value={SITE_TYPE}
                  checked={formData.type === SITE_TYPE}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="mr-2"
                />
                Recycle
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="other"
                  checked={formData.type === 'other'}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="mr-2"
                />
                Other
              </label>
            </div>
          </div>

          {/* Document Upload */}
          <div>
            <Label className="text-sm font-medium text-neutral-900">
              Document (Optional)
            </Label>
            <div className="mt-2">
              <input
                type="file"
                id="document_image"
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
              />
              <label
                htmlFor="document_image"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-neutral-400 transition-colors"
              >
                {documentPreview ? (
                  <div className="flex flex-col items-center">
                    <img 
                      src={documentPreview}
                      alt="Document preview"
                      className="w-16 h-16 object-cover rounded mb-2"
                    />
                    <span className="text-sm text-neutral-600">Change document</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                    <span className="text-sm text-neutral-600">Upload document</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-neutral-900">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any additional notes or requirements..."
              rows={4}
              className="mt-2"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-neutral-200">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white py-3 font-medium"
            >
              {isLoading ? 'Submitting...' : 'Submit Offer'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-neutral-300 text-neutral-900 hover:bg-neutral-50 py-3 font-medium"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}














