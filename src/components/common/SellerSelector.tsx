import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useGetAvailableSellersQuery } from '@/rtk/slices/sellerNetworkSlice';
import { Building2, Users, Crown } from 'lucide-react';

interface Seller {
  seller_id: number;
  seller_email: string;
  seller_name: string;
  is_main_seller: boolean;
  type: 'main' | 'network';
  network_id?: number;
  added_at?: string;
}


interface SellerSelectorProps {
  mainSellerId: number;
  selectedSellerId?: number;
  onSellerSelect: (sellerId: number) => void;
  className?: string;
}

const SellerSelector: React.FC<SellerSelectorProps> = ({
  mainSellerId,
  selectedSellerId,
  onSellerSelect,
  className = ''
}) => {
  const { t } = useTranslation();
  const { data: sellersData, isLoading, error } = useGetAvailableSellersQuery(mainSellerId);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

  const availableSellers = sellersData?.data || [];

  // Auto-select main seller if no selection
  useEffect(() => {
    if (availableSellers.length > 0 && !selectedSellerId) {
      const mainSeller = availableSellers.find(seller => seller.is_main_seller);
      if (mainSeller) {
        onSellerSelect(mainSeller.seller_id);
        setSelectedSeller(mainSeller);
      }
    }
  }, [availableSellers, selectedSellerId, onSellerSelect]);

  // Update selected seller when selectedSellerId changes
  useEffect(() => {
    if (selectedSellerId && availableSellers.length > 0) {
      const seller = availableSellers.find(s => s.seller_id === selectedSellerId);
      setSelectedSeller(seller || null);
    }
  }, [selectedSellerId, availableSellers]);

  const handleSellerClick = (seller: Seller) => {
    setSelectedSeller(seller);
    onSellerSelect(seller.seller_id);
  };

  

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">{t('sellerNetwork.loading')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || availableSellers.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-4 text-gray-500">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p>{t('sellerNetwork.noSellersFound')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t('sellerNetwork.selectSeller')}
        </CardTitle>
        <p className="text-sm text-gray-600">{t('sellerNetwork.chooseSeller')}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableSellers.map((seller) => (
            <div
              key={seller.seller_id}
              className={`relative p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                selectedSeller?.seller_id === seller.seller_id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSellerClick(seller)}
            >
              {seller.is_main_seller && (
                <div className="absolute top-2 right-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                </div>
              )}

              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {seller.seller_name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{seller.seller_name}</div>
                  <div className="text-xs text-gray-500">{seller.seller_email}</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Badge
                  variant={seller.is_main_seller ? "default" : "secondary"}
                  className="text-xs"
                >
                  {seller.is_main_seller
                    ? t('sellerNetwork.mainSeller')
                    : t('sellerNetwork.networkSeller')
                  }
                </Badge>

                {seller.type === 'network' && seller.added_at && (
                  <div className="text-xs text-gray-400">
                    {new Date(seller.added_at).toLocaleDateString()}
                  </div>
                )}
              </div>

              {selectedSeller?.seller_id === seller.seller_id && (
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedSeller && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <Building2 className="h-4 w-4" />
              <span className="text-sm font-medium">
                {t('sellerNetwork.viewProducts')} {t('sellerNetwork.productsFrom')} {selectedSeller.seller_name}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SellerSelector;
