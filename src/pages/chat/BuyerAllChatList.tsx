// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { Inbox, Package, Search, Send, MessageSquareText, Loader2, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { getSocket } from "@/services/socket";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { formatChatDateTime } from '../../utils/formatChatDateTime';
import { avatarColor, avatarInitial, formatInboxTime, formatThreadDivider } from '../../utils/chatHelpers';
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

    // Deduplicate by (seller ID + batch ID). The backend may return multiple
    // conversation rows for the same seller/batch pair — keep the entry with
    // the most recent activity.
    const dedupedSellers = (() => {
        const map = new Map<string, any>();
        for (const s of sellers) {
            const key = `${s.ID}_${s.batch_id}`;
            const existing = map.get(key);
            if (!existing) {
                map.set(key, s);
            } else {
                const t1 = new Date(existing.lastMessageAt || 0).getTime();
                const t2 = new Date(s.lastMessageAt || 0).getTime();
                if (t2 > t1) map.set(key, s);
            }
        }
        return Array.from(map.values());
    })();

    // Filter & Sort Sellers
    const filteredSellers = dedupedSellers.filter(seller =>
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


    // Group messages into render items with date dividers (computed)
    const renderItems = useMemo(() => {
        if (!Array.isArray(messages) || messages.length === 0) return [];
        const items: any[] = [];
        let lastKey = "";
        for (const msg of messages) {
            const d = new Date(msg.created_at);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            if (key !== lastKey) {
                items.push({ type: "divider", id: `d-${key}`, label: formatThreadDivider(d) });
                lastKey = key;
            }
            items.push({ type: "msg", ...msg });
        }
        return items;
    }, [messages]);

    return (
        <div className="h-[100dvh] flex flex-col bg-white overflow-hidden">
            <div className="flex flex-1 overflow-hidden min-h-0">

                {/* ── LEFT: INBOX LIST ───────────────────────────────── */}
                <aside className="w-full sm:w-[360px] bg-white border-r border-zinc-200 flex flex-col min-h-0">
                    <div className="px-4 pt-5 pb-3 border-b border-zinc-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Inbox className="w-5 h-5 text-[#0f4c2a]" />
                            <h2 className="text-lg font-semibold text-zinc-900">Messages</h2>
                            <span className="ml-auto text-xs text-zinc-500">{sortedSellers.length}</span>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Search by seller, batch, email…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-md bg-zinc-50 border border-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700/40 focus:bg-white transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loadingSellers ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="w-5 h-5 text-[#0f4c2a] animate-spin" />
                            </div>
                        ) : sortedSellers.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                                    <Inbox className="w-6 h-6 text-emerald-700" />
                                </div>
                                <p className="text-sm font-medium text-zinc-900">No conversations yet</p>
                                <p className="text-xs text-zinc-500 mt-1 max-w-[230px] mx-auto">
                                    Browse listings and message a seller to start your first conversation.
                                </p>
                                <Button
                                    onClick={() => navigate("/buyer-marketplace")}
                                    className="mt-4 h-9 bg-[#0f4c2a] hover:bg-[#1a3c2a] text-white text-xs"
                                >
                                    Browse listings
                                </Button>
                            </div>
                        ) : (
                            <ul className="divide-y divide-zinc-100">
                                {sortedSellers.map((seller) => {
                                    const isSelected = selectedSeller?.ID === seller.ID && selectedSeller?.batch_id === seller.batch_id;
                                    const unread = unreadMap.map[`${seller.ID}_${seller.batch_id}`] || 0;
                                    return (
                                        <li key={`${seller.ID}_${seller.batch_id}`}>
                                            <button
                                                onClick={() => openConversation(seller)}
                                                className={`relative w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors flex gap-3 items-start ${isSelected ? "bg-emerald-50/50" : ""}`}
                                            >
                                                {/* Selected indicator only — never used for unread */}
                                                <span
                                                    aria-hidden
                                                    className={`absolute left-0 top-0 bottom-0 w-[3px] ${isSelected ? "bg-[#0f4c2a]" : "bg-transparent"}`}
                                                />
                                                <div className={`w-10 h-10 rounded-full ${avatarColor(seller.ID)} text-white flex items-center justify-center font-medium text-sm flex-shrink-0`}>
                                                    {avatarInitial(seller.display_name)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        {/* Unread dot — distinct visual from the selected rail */}
                                                        {unread > 0 && (
                                                            <span aria-hidden className="w-2 h-2 rounded-full bg-[#0f4c2a] flex-shrink-0" />
                                                        )}
                                                        <h3 className={`text-sm truncate ${unread > 0 ? "font-semibold text-zinc-900" : "font-medium text-zinc-800"}`}>
                                                            {seller.display_name || "Seller"}
                                                        </h3>
                                                        <span className="ml-auto text-[11px] text-zinc-500 flex-shrink-0">
                                                            {formatInboxTime(seller.lastMessageAt)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                                                            <Package className="w-2.5 h-2.5" /> #{seller.batch_id}
                                                        </span>
                                                        {unread > 0 && (
                                                            <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-semibold rounded-full bg-[#0f4c2a] text-white">
                                                                {unread}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </aside>

                {/* ── RIGHT: THREAD ──────────────────────────────────── */}
                <section className="flex-1 flex flex-col min-h-0 bg-white">
                    {selectedSeller ? (
                        <>
                            {/* Thread header */}
                            <header className="flex-shrink-0 px-5 py-3 border-b border-zinc-200 bg-white flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full ${avatarColor(selectedSeller.ID)} text-white flex items-center justify-center font-medium text-sm flex-shrink-0`}>
                                    {avatarInitial(selectedSeller.display_name)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-semibold text-zinc-900 leading-tight truncate">{selectedSeller.display_name}</h3>
                                    <p className="text-[11px] text-zinc-500 leading-tight mt-0.5">Typically replies within a few hours</p>
                                </div>
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                                    <Package className="w-3 h-3" /> Batch #{selectedSeller.batch_id}
                                </span>
                            </header>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 bg-zinc-50/40 space-y-2">
                                {hasMore && !loadingMessages && (
                                    <div className="text-center mb-3">
                                        <button onClick={loadOlderMessages} disabled={loadingOlder} className="text-xs text-[#0f4c2a] hover:underline disabled:text-zinc-400 font-medium">
                                            {loadingOlder ? "Loading…" : "Load older messages"}
                                        </button>
                                    </div>
                                )}

                                {loadingMessages ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-6 h-6 text-[#0f4c2a] animate-spin" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
                                        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                                            <MessageSquareText className="w-7 h-7 text-emerald-700" />
                                        </div>
                                        <h3 className="text-base font-semibold text-zinc-900 mb-1">No messages yet</h3>
                                        <p className="text-xs text-zinc-500 max-w-[260px]">
                                            Send the first message to start a conversation with this seller about Batch #{selectedSeller.batch_id}.
                                        </p>
                                    </div>
                                ) : (
                                    renderItems.map((item) => {
                                        if (item.type === "divider") {
                                            return (
                                                <div key={item.id} className="flex items-center gap-3 py-2">
                                                    <div className="flex-1 h-px bg-zinc-200" />
                                                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{item.label}</span>
                                                    <div className="flex-1 h-px bg-zinc-200" />
                                                </div>
                                            );
                                        }
                                        const isOwn = item.sender_role === "buyer";
                                        return (
                                            <div key={item.message_id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                                                <div className={`max-w-[78%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                                                    <div
                                                        className={`px-3.5 py-2 text-sm leading-snug whitespace-pre-wrap break-words shadow-sm ${isOwn
                                                            ? "bg-[#0f4c2a] text-white rounded-2xl rounded-br-md"
                                                            : "bg-white text-zinc-900 border border-zinc-200 rounded-2xl rounded-bl-md"
                                                            }`}
                                                    >
                                                        {item.message}
                                                    </div>
                                                    <span className="text-[10px] mt-1 px-1 text-zinc-400">
                                                        {formatChatDateTime(item?.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={bottomRef} />
                            </div>

                            {/* Composer */}
                            <div className="flex-shrink-0 border-t border-zinc-200 bg-white px-3 py-3">
                                <div className="flex items-end gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        placeholder="Type a message…"
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                        className="flex-1 h-11 px-3.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700/40 focus:bg-white transition-colors"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim()}
                                        aria-label="Send message"
                                        className="w-10 h-10 rounded-full bg-[#0f4c2a] hover:bg-[#1a3c2a] disabled:bg-emerald-900/30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors flex-shrink-0"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-zinc-50/30">
                            <div className="text-center max-w-[300px] px-6">
                                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                                    <MessageSquareText className="w-8 h-8 text-emerald-700" />
                                </div>
                                <h3 className="text-base font-semibold text-zinc-900">Select a conversation</h3>
                                <p className="text-sm text-zinc-500 mt-1">Pick a seller from the list to view your message thread.</p>
                                <p className="mt-5 text-[11px] text-zinc-400 flex items-center justify-center gap-1.5">
                                    <ShieldCheck className="w-3 h-3" /> Messages may be reviewed for trust &amp; safety.
                                </p>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
