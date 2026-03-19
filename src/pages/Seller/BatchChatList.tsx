import React, { useEffect, useState } from "react";
import axios from "axios";
import { getSocket } from "@/services/socket";

interface Buyer {
  buyer_id: number;
  name?: string;
}

export default function SellerBatchMessageList() {
  const sellerId = localStorage.getItem("seller_id");
  const apiUrl = import.meta.env.VITE_PRODUCTION_URL as string;
  const socket = getSocket();

  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch buyers
  const fetchBuyers = async () => {
    if (!sellerId) return;
    try {
      setLoading(true);
      const res = await axios.get<Buyer[]>(`${apiUrl}chat/buyers/${sellerId}`);
      setBuyers(res.data);
    } catch (err) {
      console.error("Error fetching buyers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sellerId) return;

    // Initial fetch
    fetchBuyers();

    if (!socket) return;

    // Join seller room
    socket.emit("joinRooms", { user_id: Number(sellerId), role: "seller" });

    // Listen for new messages
    socket.on("chat_message", () => {
      console.log("New message received, refreshing buyer list");
      fetchBuyers();
    });

    return () => {
      socket.off("chat_message");
    };

  }, [sellerId,socket,fetchBuyers]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Buyers</h2>
      {loading ? (
        <p>Loading buyers...</p>
      ) : buyers.length > 0 ? (
        <ul className="space-y-2">
          {buyers.map((buyer) => (
            <li
              key={buyer.buyer_id}
              className="p-3 border rounded hover:bg-gray-100 cursor-pointer"
            >
              {buyer.name || `Buyer #${buyer.buyer_id}`}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No buyers found yet.</p>
      )}
    </div>
  );
}
