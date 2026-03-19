import React, { useState, useEffect } from "react";
import axios from "axios";
import { MessageSquare, Mail, Search, Send } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { getSocket } from "@/services/socket";
import { useLocation, useParams } from "react-router-dom";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { cn } from "@/lib/utils";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { useSelector } from "react-redux";
import { RootState } from "@/rtk/store";
import AdminHeader from "./AdminHeader";
import { SITE_TYPE } from "@/config/site";

export default function AdminChat() {
    const location = useLocation();
    let { sellerId } = useParams();
    const userId = localStorage.getItem("userId")

    const numericSellerId = sellerId ? Number(sellerId) : null;
    const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useAdminSidebar();

    const [hasMore, setHasMore] = useState(true);
    const [loadingOlder, setLoadingOlder] = useState(false);

    const MESSAGE_LIMIT = 20;


    // const sellerId = localStorage.getItem("userId")
    const apiUrl = import.meta.env.VITE_PRODUCTION_URL;
    const searchParams = new URLSearchParams(location.search);
    const batchId = searchParams.get("batchId");
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


    const unreadMap = useSelector((state: RootState) => state.sellerUnread);





    // SOCKET INITIALIZATION
    useEffect(() => {
        if (!socket) return;

        socket.emit("joinRooms", { user_id: sellerId, role: "seller" });

        socket.on("chat_message", (msg) => {
            // Only push message if from this conversation
            if (msg.conversation_id === conversationId) {
                setMessages((prev) => [...prev, msg]);
            }
        });

        socket.on("new_conversation_seller", (data) => {
            fetchBuyers();
        });

        return () => {
            socket.off("chat_message");
        };
    }, [socket, conversationId]);


    // Fetch all buyers 
    const fetchBuyers = async () => {
        setLoadingBuyers(true);
        try {
            const res = await axios.get(
                `${apiUrl}chat/batch/${batchId}/seller/${numericSellerId}/buyers`
            );
            setBuyers(res.data.buyerList?.data || []);
        } catch (err) {
            console.error(err);
            setBuyersError("Failed to load buyers");
        } finally {
            setLoadingBuyers(false);
        }
    };

    useEffect(() => {
        fetchBuyers();
    }, [batchId]);


    // When clicking a buyer → join chat + load messages

    const openConversation = async (buyer) => {
        if (!socket) return;



        setSelectedBuyer(buyer);
        setMessages([]);
        setLoadingMessages(true);

        try {
            await axios.put(`${apiUrl}notifications/read_by_batch`, {
                batchId: buyer.batch_id,
                buyerId: buyer.ID,
                sellerId: userId,
                platform: SITE_TYPE,
            });

            // Emit socket to seller so Notification Bell updates in real-time
            socket.emit("notification_read", {
                sellerId: numericSellerId,
                buyerId: buyer.ID,
                batchId: buyer.batch_id,
            });
        } catch (err) {
            console.error("Failed to mark notifications read by batch:", err);
        }
        const batchIdForChat = buyer.batch_id;
        socket.emit(
            "joinChat",
            {
                batch_id: `batch-${batchIdForChat}`,
                user_id: sellerId,
                role: "seller",
                other_party_id: buyer.ID,
                platform: SITE_TYPE,
            },
            async (res) => {
                if (res.error) {
                    console.error("joinChat error", res.error);
                    setLoadingMessages(false);
                    return;
                }

                const cid = res.conversation_id;
                setConversationId(cid);

                try {
                    const msgRes = await axios.get(
                        `${apiUrl}chat/conversation/${cid}/messages?platform=${SITE_TYPE}`,
                        {
                            params: { limit: MESSAGE_LIMIT }
                        }
                    );

                    setMessages(msgRes.data.messages || []);
                    setHasMore(msgRes.data.hasMore);
                } catch (err) {
                    console.error("Failed to load messages", err);
                }

                setLoadingMessages(false);
            }
        );
    };

    const loadOlderMessages = async () => {
        if (!conversationId || messages.length === 0 || !hasMore) return;

        setLoadingOlder(true);

        try {
            const oldestMessageId = messages[0].message_id;

            const res = await axios.get(
                `${apiUrl}chat/conversation/${conversationId}/messages?platform=${SITE_TYPE}`,
                {
                    params: {
                        limit: MESSAGE_LIMIT,
                        beforeMessageId: oldestMessageId,
                    },
                }
            );

            setMessages(prev => [...res.data.messages, ...prev]);
            setHasMore(res.data.hasMore);
        } catch (err) {
            console.error("Failed to load older messages", err);
        } finally {
            setLoadingOlder(false);
        }
    };





    // SEND MESSAGE

    const handleSendMessage = () => {
        if (!newMessage.trim() || !conversationId || !socket) return;

        socket.emit("chat_message", {
            conversation_id: conversationId,
            batch_id: `batch-${selectedBuyer.batch_id}`,
            sender_id: sellerId,
            receiver_id: selectedBuyer.ID,
            sender_role: "seller",
            message: newMessage.trim(),
            platform: SITE_TYPE,
        });

        setNewMessage("");
    };


    // Filter buyers

    const filteredBuyers = buyers.filter((buyer) =>
        (buyer.display_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (buyer.user_email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (buyer.user_login || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getUnreadCount = (buyer) => {
        return unreadMap[`${sellerId}_${buyer.batch_id}_${buyer.ID}`] || 0;
    };



    // UI
    const sortedBuyers = [...filteredBuyers].sort((a, b) => {
        return getUnreadCount(b) - getUnreadCount(a);
    });



    return (

        <div className="min-h-screen w-full overflow-x-hidden bg-background">

            <AdminSidebar activePath="/admin/sellers/chat" />

            <div
                className={cn(
                    "transition-all duration-300 p-4 lg:p-6 space-y-6 animate-in fade-in-50 duration-500",
                    // Desktop: margin based on sidebar collapsed state
                    sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
                    // Mobile: no margin (sidebar is overlay)
                    "ml-0"
                )}
            >
                <AdminHeader />
                <div className="flex h-screen bg-gray-50">



                    {/* LEFT SIDEBAR */}
                    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                        <div className="p-4 border-b">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-blue-600" />
                                Conversations
                            </h2>

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

                        <div className="flex-1 overflow-y-auto">
                            {loadingBuyers ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
                                </div>
                            ) : sortedBuyers.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">No buyers found</div>
                            ) : (
                                <div className="divide-y">
                                    {sortedBuyers.map((buyer, index) => (
                                        <div
                                            key={index + 1}
                                            onClick={() => openConversation(buyer)}
                                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedBuyer?.ID === buyer.ID
                                                ? "bg-blue-50 border-l-4 border-blue-600"
                                                : ""
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                                    {buyer.display_name?.charAt(0).toUpperCase()}
                                                </div>

                                                <div className="flex-1">
                                                    <h3 className="font-medium truncate">
                                                        {buyer.display_name}
                                                    </h3>
                                                    <div className="flex items-center gap-1 mt-1">

                                                        <p className="text-xs text-gray-500 truncate">
                                                            BatchId- #
                                                            {buyer.batch_id}
                                                        </p>
                                                    </div>
                                                    {getUnreadCount(buyer) > 0 && (
                                                        <span className="ml-auto text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                                                            {getUnreadCount(buyer)}
                                                        </span>
                                                    )}

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

                    {/* RIGHT CHAT WINDOW */}
                    <div className="flex-1 flex flex-col bg-white">
                        {selectedBuyer ? (
                            <>
                                {/* Header */}
                                <div className="p-4 border-b flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl">
                                        {selectedBuyer.display_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{selectedBuyer.display_name}</h3>
                                        <p className="text-sm text-gray-500">BatchId:- #
                                            {selectedBuyer.batch_id}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {selectedBuyer.user_email}
                                        </p>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">

                                    {/* LOAD OLDER */}
                                    {hasMore && !loadingMessages && (
                                        <div className="text-center mb-3">
                                            <button
                                                onClick={loadOlderMessages}
                                                disabled={loadingOlder}
                                                className="text-xs text-blue-600 hover:underline disabled:text-gray-400"
                                            >
                                                {loadingOlder ? "Loading..." : "Load older messages"}
                                            </button>
                                        </div>
                                    )}

                                    {loadingMessages ? (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full"></div>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-gray-500">
                                            <div className="text-center">
                                                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                                <p>No messages yet</p>
                                                <p className="text-sm">Start the conversation!</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {messages.map((msg) => (
                                                <div
                                                    key={msg.message_id}
                                                    className={`flex ${msg.sender_role === "seller"
                                                            ? "justify-end"
                                                            : "justify-start"
                                                        }`}
                                                >
                                                    <div
                                                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.sender_role === "seller"
                                                                ? "bg-blue-600 text-white"
                                                                : "bg-white border text-gray-900"
                                                            }`}
                                                    >
                                                        <p className="text-sm">{msg.message}</p>
                                                        <p className="text-xs mt-1 opacity-70">
                                                            {new Date(msg.created_at).toLocaleTimeString([], {
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




                                {/* Input */}
                                {/* <div className="p-4 border-t flex gap-2 bg-white">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        placeholder="Type your message..."
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                        className="flex-1 px-4 py-2 border rounded-lg"
                                    />

                                    <button
                                        onClick={handleSendMessage}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
                                    >
                                        <Send className="w-4 h-4" /> Send
                                    </button>
                                </div> */}
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
                                <div className="text-center">
                                    <MessageSquare className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                                    <h3 className="text-lg font-medium">Select a conversation</h3>
                                    <p className="text-sm">Choose a buyer to start messaging</p>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>

    );
}
