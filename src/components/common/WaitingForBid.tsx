import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const WaitingForBuyerAction: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="w-full mx-auto p-0 pt-2">
            <div className="bg-yellow-100 border-l-4 border-yellow-500 rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0 bg-yellow-500 rounded-lg p-3">
                            <Clock className="w-6 h-6 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {t('waitingForBuyer.title')}
                            </h3>

                            <div className="mt-2 space-y-2">
                                <p className="text-gray-700">{t('waitingForBuyer.message')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaitingForBuyerAction;
