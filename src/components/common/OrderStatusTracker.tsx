import React from 'react';

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled";

interface OrderStatusTrackerProps {
  status: OrderStatus;
}

const orderSteps: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "completed", "cancelled"];

const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({ status }) => {
  const currentStepIndex = orderSteps.indexOf(status);

  return (
    <div className="flex items-center gap-2 mb-4 mt-2">
      {orderSteps.map((step, index) => {
        // Determine color for dot
        let dotColor = "bg-white border-gray-300";
        let textColor = "text-gray-500";
        let lineColor = "bg-gray-300";

        if (status === "cancelled") {
          if (step === "cancelled") {
            dotColor = "bg-red-500 border-red-500";
            textColor = "text-red-600";
          } else {
            dotColor = "bg-gray-300 border-gray-300";
            textColor = "text-gray-500";
          }
        } else {
          if (index <= currentStepIndex) {
            dotColor = "bg-green-500 border-green-500";
            textColor = "text-green-600";
            lineColor = "bg-green-500";
          }
        }

        return (
          <div key={step} className="flex flex-1 flex-col items-center">
            {/* Dot */}
            <div className={`w-4 h-4 rounded-full border-2 ${dotColor}`}></div>

            {/* Line between dots */}
            {index < orderSteps.length - 1 && (
              <div className={`flex-1 h-1 mx-1 ${index < currentStepIndex ? lineColor : "bg-gray-300"}`}></div>
            )}

            {/* Status name */}
            <span className={`mt-1 text-xs font-medium ${textColor}`}>
              {step.charAt(0).toUpperCase() + step.slice(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default OrderStatusTracker;
