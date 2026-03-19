import React, { useState, useEffect } from "react";
import axios from "axios";
import { MessageSquare, Mail, Search, Send } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { getSocket } from "@/services/socket";

export default function SellerChatPageList({ batchId = 233 }) {
    const sellerId = 533; // from login later
    const apiUrl = import.meta.env.VITE_PRODUCTION_URL;

    const socket = getSocket();

    const [buyers, setBuyers] = useState([]);
    const [loadingBuyers, setLoadingBuyers] = useState(true);
    const [buyersError, setBuyersError] = useState(null);

    const [selectedBuyer, setSelectedBuyer] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    const [conversationId, setConversationId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [newMessage, setNewMessage] = useState("");

    // ---------------------------
    // SOCKET INITIALIZATION
    // ---------------------------
    useEffect(() => {
        if (!socket) return;

        socket.emit("joinRooms", { user_id: sellerId, role: "seller" });

        socket.on("chat_message", (msg) => {

            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socket.off("chat_message");
        };
    }, [socket, sellerId]);

    // ---------------------------
    // Fetch buyers
    // ---------------------------
    const fetchBuyers = async () => {
        setLoadingBuyers(true);
        try {
            const res = await axios.get(
                `${apiUrl}chat/batch/${batchId}/seller/${sellerId}/buyers`
            );
            setBuyers(res.data.buyerList?.data || []);
        } catch (err) {
            console.error(err);
            setBuyersError("Failed to load buyers");
        } finally {
            setLoadingBuyers(false);
        }
    };

    // ---------------------------
    // Join chat + load messages
    // ---------------------------
    const openConversation = async (buyer) => {
        if (!socket) return;

        setSelectedBuyer(buyer);
        setMessages([]);
        setLoadingMessages(true);

        socket.emit(
            "joinChat",
            {
                batch_id: `batch-${batchId}`,
                user_id: sellerId,
                role: "seller",
                other_party_id: buyer.ID,
            },
            async (res) => {
                if (res.error) {
                    console.error("joinChat error:", res.error);
                    setLoadingMessages(false);
                    return;
                }

                setConversationId(res.conversation_id);

                // fetch messages
                try {
                    const resp = await axios.get(
                        `${apiUrl}chat/conversation/${res.conversation_id}/messages`
                    );
                    setMessages(resp.data || []);
                } catch (err) {
                    console.error("message fetch error", err);
                }

                setLoadingMessages(false);
            }
        );
    };

    // ---------------------------
    // Send Message
    // ---------------------------
    const handleSendMessage = () => {
        if (!newMessage.trim() || !conversationId || !socket) return;

        socket.emit("chat_message", {
            conversation_id: conversationId,
            batch_id: `batch-${batchId}`,
            sender_id: sellerId,
            receiver_id: selectedBuyer.ID,
            sender_role: "seller",
            message: newMessage.trim(),
        });

        setNewMessage("");
    };

    // ---------------------------
    // Fetch buyers on load
    // ---------------------------
    useEffect(() => {
        fetchBuyers();
    }, [batchId]);

    // Filter search
    const filteredBuyers = buyers.filter((buyer) =>
        (buyer.display_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (buyer.user_email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (buyer.user_login || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="flex h-screen bg-gray-50">

                {/* Sidebar */}
                <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                            Conversations
                        </h2>

                        {/* Search */}
                        <div className="relative mt-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search buyers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                            />
                        </div>
                    </div>

                    {/* Buyer list */}
                    <div className="flex-1 overflow-y-auto">
                        {loadingBuyers ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : filteredBuyers.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No buyers found
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredBuyers.map((buyer) => (
                                    <div
                                        key={buyer.ID}
                                        onClick={() => openConversation(buyer)}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                                            selectedBuyer?.ID === buyer.ID
                                                ? "bg-blue-50 border-l-4 border-blue-600"
                                                : ""
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                                                {(buyer.display_name || "U").charAt(0).toUpperCase()}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-gray-900 truncate">
                                                    {buyer.display_name}
                                                </h3>
                                                <p className="text-xs text-gray-500 truncate">
                                                    @{buyer.user_login}
                                                </p>

                                                <div className="flex items-center gap-1 mt-1">
                                                    <Mail className="w-3 h-3 text-gray-400" />
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {buyer.user_email}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat section */}
                <div className="flex-1 flex flex-col bg-white">
                    {selectedBuyer ? (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold">
                                    {selectedBuyer.display_name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-semibold">{selectedBuyer.display_name}</h3>
                                    <p className="text-sm text-gray-500">{selectedBuyer.user_email}</p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                                {loadingMessages ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        <div className="text-center">
                                            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                            <p>No messages yet</p>
                                            <p className="text-sm mt-1">Start the conversation!</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {Array.isArray(messages) && messages.length>0 && messages.map((msg) => (
                                            <div
                                                key={msg.message_id || Math.random()}
                                                className={`flex ${
                                                    msg.sender_role === "seller"
                                                        ? "justify-end"
                                                        : "justify-start"
                                                }`}
                                            >
                                                <div
                                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                                        msg.sender_role === "seller"
                                                            ? "bg-blue-600 text-white"
                                                            : "bg-white text-gray-900 border"
                                                    }`}
                                                >
                                                    <p className="text-sm">{msg.message}</p>
                                                    <p className="text-xs mt-1 text-gray-300">
                                                        {new Date(msg.created_at || Date.now()).toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t bg-white flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    placeholder="Type your message..."
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                                    className="flex-1 px-4 py-2 border rounded-lg"
                                />

                                <button
                                    onClick={handleSendMessage}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
                                >
                                    <Send className="w-4 h-4" /> Send
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-500">
                            <div className="text-center">
                                <MessageSquare className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                                <h3 className="text-lg font-medium">Select a conversation</h3>
                                <p className="text-sm mt-1">Choose a buyer to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
