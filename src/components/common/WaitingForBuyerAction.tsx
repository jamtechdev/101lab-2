import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Slot {
  time?: string;
  display_time?: string;
}

interface Schedule {
  date: string;
  slots: Slot[];
}

interface Props {
  data?: Schedule[];
  registrationData?: any[];
}

const WaitingForBuyerAction: React.FC<Props> = ({ data = [], registrationData = [] }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full mx-auto p-0">
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
                {t('waitingForBuyer.title')},{' '}
                {registrationData.length > 0
                  ? t('waitingForBuyer.scheduled', { count: registrationData.length })
                  : t('waitingForBuyer.notScheduled')}
              </h3>

              {Array.isArray(data) && data.length > 0 ? (
                data.map((s, index) => (
                  <div key={index} className="mb-2">
                    <p className="text-lg font-semibold">
                      {t('waitingForBuyer.notScheduled')} {s.date}
                    </p>
                    <p className="text-sm font-medium text-gray-700">
                      {t('waitingForBuyer.timeSlots')}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {s.slots?.map((slot, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded-full shadow-sm hover:bg-gray-300 transition-colors duration-200"
                        >
                          {slot.display_time || slot.time}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <span className="font-normal">{t('waitingForBuyer.message')}</span>
              )}

              {/* Status indicator */}
              <div className="flex items-center gap-2 text-green-600 mt-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">{t('waitingForBuyer.submissionComplete')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingForBuyerAction;
