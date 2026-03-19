// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MessageSquare, Mail, Search, Send } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { getSocket } from "@/services/socket";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { formatChatDateTime } from '../../utils/formatChatDateTime';
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import BuyerHeader from "../buyer/BuyerHeader";
import { resetUnread, setUnreadMap } from "@/rtk/slices/unreadSlice";
import { SITE_TYPE } from "@/config/site";

export default function BuyerAllChatList() {
    const buyerId = localStorage.getItem("userId");
    const apiUrl = import.meta.env.VITE_PRODUCTION_URL;
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const batchIdFromParam = searchParams.get("batchId");
    const sellerIdFromParam = searchParams.get("sellerId");

    const socket = getSocket();
    const bottomRef = useRef(null);

    const [sellers, setSellers] = useState([]);
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [messages, setMessages] = useState([]);
    const [conversationId, setConversationId] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [loadingSellers, setLoadingSellers] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const MESSAGE_LIMIT = 20;

    const unreadMap = useSelector((state: RootState) => state.unread);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Socket Initialization
    useEffect(() => {
        if (!socket) return;

        socket.emit("joinRooms", { user_id: buyerId, role: "buyer" });

        socket.on("chat_message", (msg) => {
            // Update messages if this conversation is open
            if (msg.conversation_id === conversationId) {
                setMessages(prev => [...prev, msg]);
            }

            // Update lastMessageAt for this seller in sidebar
            setSellers(prev =>
                prev.map(s =>
                    s.ID === msg.sender_id && s.batch_id === msg.batch_id
                        ? { ...s, lastMessageAt: msg.created_at }
                        : s
                )
            );
        });

        socket.on("new_conversation_buyer", () => {
            fetchSellers();
        });

        return () => socket.off("chat_message");
    }, [socket, conversationId]);

    //  Fetch sellers (left sidebar) 
    const fetchSellers = async () => {
        setLoadingSellers(true);
        try {
            const res = await axios.get(`${apiUrl}chat/buyer/${buyerId}/sellers?platform=${SITE_TYPE}`);
            const sellerList = res.data.sellerList?.data || [];
            setSellers(sellerList);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingSellers(false);
        }
    };

    useEffect(() => { fetchSellers(); }, [buyerId]);

    // Open conversation 
    const openConversation = async (seller) => {
        if (!socket) return;

        setSelectedSeller(seller);
        setMessages([]);
        setLoadingMessages(true);
        const batchIdForChat = seller.batch_id;
        const key = `${seller.ID}_${seller.batch_id}`;

        try {
            await axios.put(`${apiUrl}notifications/read_by_batch`, {
                batchId: seller.batch_id,
                buyerId: Number(buyerId),
                sellerId: seller.ID,
                role: "buyer",
                platform: SITE_TYPE,
            });

            socket.emit("notification_read", {
                sellerId: seller.ID,
                buyerId: Number(buyerId),
                batchId: seller.batch_id,
            });
        } catch (err) {
            console.error("Failed to mark notifications read by batch:", err);
        }

        socket.emit("joinChat", {
            batch_id: `batch-${batchIdForChat}`,
            user_id: buyerId,
            role: "buyer",
            other_party_id: seller.ID,
            platform: SITE_TYPE,
        }, async (res) => {
            if (res.error) { console.error(res.error); setLoadingMessages(false); return; }
            setConversationId(res.conversation_id);

            try {
                const msgRes = await axios.get(`${apiUrl}chat/conversation/${res.conversation_id}/messages?platform=${SITE_TYPE}`, {
                    params: { limit: MESSAGE_LIMIT }
                });
                const messagesFetched = msgRes.data.messages || [];
                setMessages(messagesFetched);
                setHasMore(msgRes.data.hasMore);

                // Update lastMessageAt for this seller
                if (messagesFetched.length > 0) {
                    const lastMsgTime = messagesFetched[messagesFetched.length - 1].created_at;
                    setSellers(prev =>
                        prev.map(s =>
                            s.ID === seller.ID && s.batch_id === seller.batch_id
                                ? { ...s, lastMessageAt: lastMsgTime }
                                : s
                        )
                    );
                }
            } catch (err) { console.error(err); }

            setLoadingMessages(false);
        });
    };

    const loadOlderMessages = async () => {
        if (!conversationId || messages.length === 0 || !hasMore) return;
        setLoadingOlder(true);

        try {
            const oldestMessageId = messages[0].message_id;
            const res = await axios.get(`${apiUrl}chat/conversation/${conversationId}/messages?platform=${SITE_TYPE}`, {
                params: { limit: MESSAGE_LIMIT, beforeMessageId: oldestMessageId }
            });
            setMessages(prev => [...res.data.messages, ...prev]);
            setHasMore(res.data.hasMore);
        } catch (err) { console.error(err); }
        finally { setLoadingOlder(false); }
    };

    //  Send Message 
    const handleSendMessage = () => {
        if (!newMessage.trim() || !conversationId || !socket) return;

        socket.emit("chat_message", {
            conversation_id: conversationId,
            batch_id: `batch-${selectedSeller.batch_id}`,
            sender_id: buyerId,
            receiver_id: selectedSeller.ID,
            sender_role: "buyer",
            message: newMessage.trim(),
            platform: SITE_TYPE,
        });

        // Update lastMessageAt immediately for this seller
        const now = new Date().toISOString();
        setSellers(prev =>
            prev.map(s =>
                s.ID === selectedSeller.ID && s.batch_id === selectedSeller.batch_id
                    ? { ...s, lastMessageAt: now }
                    : s
            )
        );

        setNewMessage("");
    };

    // Filter & Sort Sellers 
    const filteredSellers = sellers.filter(seller =>
        (seller.display_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (seller.user_email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (seller.user_login || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedSellers = filteredSellers.sort((a, b) => {
        const unreadA = unreadMap.map?.[`${a.ID}_${a.batch_id}`] || 0;
        const unreadB = unreadMap.map?.[`${b.ID}_${b.batch_id}`] || 0;

        if (unreadB !== unreadA) return unreadB - unreadA;

        const dateA = new Date(a.lastMessageAt || 0).getTime();
        const dateB = new Date(b.lastMessageAt || 0).getTime();
        return dateB - dateA;
    });

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    useEffect(() => {
        if (!sellers.length) return;
        if (!sellerIdFromParam || !batchIdFromParam) return;

 
        if (selectedSeller) return;

        const sel = sellers.find(
            s =>
                s.ID.toString() === sellerIdFromParam &&
                s.batch_id.toString() === batchIdFromParam
        );

        if (sel) {
            openConversation(sel);
        }
    }, [sellers, sellerIdFromParam, batchIdFromParam, selectedSeller]);


    //  JSX 
    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
            {/* <BuyerHeader /> */}
            <div className="flex flex-1 overflow-hidden bg-gray-50 px-6">
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
                                placeholder="Search sellers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loadingSellers ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
                            </div>
                        ) : sortedSellers.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">No sellers found</div>
                        ) : (
                            <div className="divide-y">
                                {sortedSellers.map((seller) => (
                                    <div
                                        key={`${seller.ID}_${seller.batch_id}`}
                                        onClick={() => openConversation(seller)}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedSeller?.ID === seller.ID && selectedSeller?.batch_id === seller.batch_id ? "bg-blue-50 border-l-4 border-blue-600" : ""}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                                {seller.display_name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium truncate">{seller.display_name}</h3>
                                                <p className="text-xs text-gray-500 truncate">BatchId- #{seller.batch_id}</p>
                                                {unreadMap.map[`${seller.ID}_${seller.batch_id}`] > 0 && (
                                                    <span className="ml-auto text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                                                        {unreadMap.map[`${seller.ID}_${seller.batch_id}`]}
                                                    </span>
                                                )}
                                                <p className="text-xs text-gray-500 truncate">@{seller.user_login}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Mail className="w-3 h-3 text-gray-400" />
                                                    <p className="text-xs text-gray-500 truncate">{seller.user_email}</p>
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
                    {selectedSeller ? (
                        <>
                            <div className="p-4 border-b flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl">
                                    {selectedSeller.display_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-semibold">{selectedSeller.display_name}</h3>
                                    <p className="text-sm text-gray-500">BatchId: #{selectedSeller.batch_id}</p>
                                    <p className="text-sm text-gray-500">{selectedSeller.user_email}</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                                {hasMore && !loadingMessages && (
                                    <div className="text-center mb-3">
                                        <button onClick={loadOlderMessages} disabled={loadingOlder} className="text-xs text-blue-600 hover:underline disabled:text-gray-400">
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
                                            <div key={msg.message_id} className={`flex ${msg.sender_role === "buyer" ? "justify-end" : "justify-start"}`}>
                                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.sender_role === "buyer" ? "bg-blue-600 text-white" : "bg-white border text-gray-900"}`}>
                                                    <p className="text-sm">{msg.message}</p>
                                                    <span className={`text-[11px] ${msg.sender_role === "seller" ? "text-[#808080]" : "text-gray-400"}`}>
                                                        {formatChatDateTime(msg?.created_at)}
                                                    </span>
                                                </div>
                                                <div ref={bottomRef} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t flex gap-2 bg-white">
                                <input
                                    type="text"
                                    value={newMessage}
                                    placeholder="Type your message..."
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                    className="flex-1 px-4 py-2 border rounded-lg"
                                />
                                <button onClick={handleSendMessage} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
                                    <Send className="w-4 h-4" /> Send
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
                            <div className="text-center">
                                <MessageSquare className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                                <h3 className="text-lg font-medium">Select a conversation</h3>
                                <p className="text-sm">Choose a seller to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
