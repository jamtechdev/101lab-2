
// SellerNotificationListener.jsx
import { useEffect } from "react";
import toast from "react-hot-toast";
import { emitBuyerEvent } from "@/socket/buyerEvents";

const SellerNotificationListener = ({ sellerId, onNewBid }) => {
  useEffect(() => {
    if (!sellerId) return;

    const eventSource = new EventSource(
      `https://api.101recycle.greenbidz.com/api/seller/stream/${sellerId}`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        toast.success(`New Bid Received: ₹${data.amount}`, {
          id: "new-bid-toast",
        });

        if (onNewBid) {
          onNewBid(data);
        }
        
        emitBuyerEvent();
      } catch (err) {
        console.error("❌ SSE parse error:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("⚠️ SSE Error:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [sellerId, onNewBid]);

  return null;
};

export default SellerNotificationListener;
