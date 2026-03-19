// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { Send, User, Package } from "lucide-react";
import { getSocket } from "@/services/socket";
import axios from "axios";
import { formatChatDateTime } from '../../utils/formatChatDateTime'
import { SITE_TYPE } from "@/config/site";

export default function BuyerChatTest({ batchId, sellerId, userRole = "buyer" }: { batchId?: any; sellerId?: any; userRole?: string }) {
  const socket = getSocket();

  const loggedInUserId = localStorage.getItem("userId");

  const batch_id = batchId;
  // sellerId prop always holds the "other party" ID:
  //   buyer usage  → sellerId = the seller they're chatting with
  //   seller usage → sellerId = the buyer they're chatting with (from selectedChatBid.buyer_id)
  const current_user_id = loggedInUserId;
  const other_party_id = sellerId;
  const buyer_id  = userRole === "seller" ? other_party_id : current_user_id;
  const seller_id = userRole === "seller" ? current_user_id : other_party_id;

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const conversationIdRef = useRef(null);

  const url = import.meta.env.VITE_SOCKET_URL;
  const apiUrl = import.meta.env.VITE_PRODUCTION_URL;

  const fetchConversationMessages = async () => {
    try {
      // Fetch messages for batch + seller
      const response = await axios.get(
        `${apiUrl}chat/buyer/${batch_id}/${buyer_id}/${seller_id}?platform=${SITE_TYPE}`
      );

      const conversationMessages = response.data;

      if (conversationMessages.length > 0) {
        // setConversationId(conversationMessages[0].conversation_id);
        setMessages(conversationMessages);
      }
    } catch (err) {
      console.error("Error fetching seller messages:", err);
    }
  };

  // useEffect(() => {
  //   if (!batch_id || !buyer_id) return;
  //   fetchConversationMessages();
  // }, [batch_id, buyer_id]);

  useEffect(() => {
    if (!socket) return;
    // Ensure socket is connected
    if (!socket.connected) {
      socket.connect();
    }

    // Component-specific chat listener
    const handleChatMessage = (msg) => {


      if (msg.conversation_id !== conversationIdRef.current) return;
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("chat_message", handleChatMessage);

    // Join rooms only once (when component mounts)
    if (current_user_id && batch_id && other_party_id) {
      socket.emit("joinRooms", { user_id: current_user_id, role: userRole });
      socket.emit(
        "joinChat",
        {
          batch_id: `batch-${batch_id}`,
          user_id: current_user_id,
          role: userRole,
          other_party_id: other_party_id,
          platform: SITE_TYPE,
        },
        async (res) => {
          if (res.error) {
            console.log("Join error", res.error);
          } else {

            setConversationId(res.conversation_id);
            conversationIdRef.current = res.conversation_id;

            fetchConversationMessages()

            // setMessages(response.data || []);
          }
        }
      );
    }

    return () => {
      // Remove only component-specific listener
      socket.off("chat_message", handleChatMessage);
      // Do NOT disconnect the global socket or remove 'connect' listener
    };
  }, [socket, batch_id, buyer_id, seller_id]);


  const sendMessage = () => {
    const trimmedMessage = input.trim();
    if (!trimmedMessage) return;
    if (!conversationId) {
      console.log("Cannot send: conversationId not ready");
      return;
    }

    socket.emit("chat_message", {
      conversation_id: conversationId,
      batch_id: `batch-${batch_id}`,
      sender_id: current_user_id,
      receiver_id: other_party_id,
      sender_role: userRole,
      message: trimmedMessage,
      platform: SITE_TYPE,
    });

    setInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };




  return (
    <div className="flex  justify-center h-full">
      <div className=" w-full bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">User Chat</h2>
              <p className="text-sm text-blue-100">User ID: {seller_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
            <Package className="w-4 h-4" />
            <span className="text-sm font-medium">Batch #{batch_id}</span>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {Array.isArray(messages) && messages.length > 0 ? (
            messages.map((msg) => (
              <div
                key={msg.message_id}
                className={`flex ${String(msg.sender_id) === String(current_user_id) ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${String(msg.sender_id) === String(current_user_id)
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-br-sm"
                    : "bg-white text-gray-800 rounded-bl-sm border border-gray-200"
                    }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold ${String(msg.sender_id) === String(current_user_id)
                        ? "text-blue-100"
                        : "text-gray-500"
                        }`}
                    >
                      {String(msg.sender_id) === String(current_user_id) ? "You" : (userRole === "seller" ? "Buyer" : "Seller")}
                    </span>
                    <span
                      className={`text-[11px] ${String(msg.sender_id) === String(current_user_id)
                          ? "text-blue-100"
                          : "text-gray-400"
                        }`}
                    >
                      {formatChatDateTime(msg.created_at)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed break-words ">
                    {msg.message}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Package className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t pb-[10rem] border-gray-200 bg-white p-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                rows="1"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                style={{ minHeight: "48px", maxHeight: "120px" }}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>


  );
}