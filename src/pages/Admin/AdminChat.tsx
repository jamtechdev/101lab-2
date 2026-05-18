import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Inbox, Package, Search, Send, MessageSquareText, Loader2, ShieldCheck, Eye } from "lucide-react";
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
import { avatarColor, avatarInitial, formatInboxTime, formatThreadDivider } from "@/utils/chatHelpers";
import { formatChatDateTime } from "@/utils/formatChatDateTime";

export default function AdminChat() {
    const location = useLocation();
    let { sellerId } = useParams();
    const userId = localStorage.getItem("userId")

    const numericSellerId = sellerId ? Number(sellerId) : null;
    const { sidebarOpen, setSidebarOpen } = useAdminSidebar();

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


    // Deduplicate by (buyer ID + batch ID). The backend may return multiple
    // conversation rows for the same buyer/batch pair — keep the most recent.
    const dedupedBuyers = (() => {
        const map = new Map<string, any>();
        for (const b of buyers) {
            const key = `${b.ID}_${b.batch_id}`;
            const existing = map.get(key);
            if (!existing) {
                map.set(key, b);
            } else {
                const t1 = new Date(existing.lastMessageAt || 0).getTime();
                const t2 = new Date(b.lastMessageAt || 0).getTime();
                if (t2 > t1) map.set(key, b);
            }
        }
        return Array.from(map.values());
    })();

    // Filter buyers
    const filteredBuyers = dedupedBuyers.filter((buyer) =>
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
        <div className="min-h-screen w-full overflow-x-hidden bg-background">
            <AdminSidebar activePath="/admin/sellers/chat" />
            <div
                className="transition-all duration-300 p-4 lg:p-6 space-y-6 animate-in fade-in-50 duration-500 lg:pl-[280px] ml-0"
            >
                <AdminHeader />

                <div className="flex h-[calc(100dvh-160px)] min-h-[400px] bg-white border border-zinc-200 rounded-lg overflow-hidden">

                    {/* ── LEFT: BUYER LIST ───────────────────────────────── */}
                    <aside className="w-full sm:w-[360px] bg-white border-r border-zinc-200 flex flex-col min-h-0">
                        <div className="px-4 pt-5 pb-3 border-b border-zinc-100">
                            <div className="flex items-center gap-2 mb-1">
                                <Eye className="w-5 h-5 text-[#0f4c2a]" />
                                <h2 className="text-lg font-semibold text-zinc-900">Observing seller</h2>
                                <span className="ml-auto text-xs text-zinc-500">{sortedBuyers.length}</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 mb-3">Buyers who messaged this seller</p>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="text"
                                    placeholder="Search by buyer, batch…"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm rounded-md bg-zinc-50 border border-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700/40 focus:bg-white transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loadingBuyers ? (
                                <div className="flex items-center justify-center h-40">
                                    <Loader2 className="w-5 h-5 text-[#0f4c2a] animate-spin" />
                                </div>
                            ) : sortedBuyers.length === 0 ? (
                                <div className="px-6 py-12 text-center">
                                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                                        <Inbox className="w-6 h-6 text-emerald-700" />
                                    </div>
                                    <p className="text-sm font-medium text-zinc-900">No conversations</p>
                                    <p className="text-xs text-zinc-500 mt-1 max-w-[230px] mx-auto">
                                        This seller has not received any buyer messages yet.
                                    </p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-zinc-100">
                                    {sortedBuyers.map((buyer) => {
                                        const isSelected = selectedBuyer?.ID === buyer.ID && selectedBuyer?.batch_id === buyer.batch_id;
                                        const unread = getUnreadCount(buyer);
                                        return (
                                            <li key={`${buyer.ID}_${buyer.batch_id}`}>
                                                <button
                                                    onClick={() => openConversation(buyer)}
                                                    className={`relative w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors flex gap-3 items-start ${isSelected ? "bg-emerald-50/50" : ""}`}
                                                >
                                                    {/* Selected indicator only — never used for unread */}
                                                    <span
                                                        aria-hidden
                                                        className={`absolute left-0 top-0 bottom-0 w-[3px] ${isSelected ? "bg-[#0f4c2a]" : "bg-transparent"}`}
                                                    />
                                                    <div className={`w-10 h-10 rounded-full ${avatarColor(buyer.ID)} text-white flex items-center justify-center font-medium text-sm flex-shrink-0`}>
                                                        {avatarInitial(buyer.display_name)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            {/* Unread dot — distinct visual from the selected rail */}
                                                            {unread > 0 && (
                                                                <span aria-hidden className="w-2 h-2 rounded-full bg-[#0f4c2a] flex-shrink-0" />
                                                            )}
                                                            <h3 className={`text-sm truncate ${unread > 0 ? "font-semibold text-zinc-900" : "font-medium text-zinc-800"}`}>
                                                                {buyer.display_name || "Buyer"}
                                                            </h3>
                                                            <span className="ml-auto text-[11px] text-zinc-500 flex-shrink-0">
                                                                {formatInboxTime(buyer.lastMessageAt)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                                                                <Package className="w-2.5 h-2.5" /> #{buyer.batch_id}
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

                    {/* ── RIGHT: READ-ONLY THREAD ────────────────────────── */}
                    <section className="flex-1 flex flex-col min-h-0 bg-white">
                        {selectedBuyer ? (
                            <>
                                {/* Admin banner */}
                                <div className="flex-shrink-0 px-5 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-[11px] text-amber-900">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>Admin view — observing conversation. Both parties are not aware you are viewing.</span>
                                </div>

                                <header className="flex-shrink-0 px-5 py-3 border-b border-zinc-200 bg-white flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full ${avatarColor(selectedBuyer.ID)} text-white flex items-center justify-center font-medium text-sm flex-shrink-0`}>
                                        {avatarInitial(selectedBuyer.display_name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-semibold text-zinc-900 leading-tight truncate">
                                            {selectedBuyer.display_name}
                                        </h3>
                                        <p className="text-[11px] text-zinc-500 leading-tight mt-0.5 truncate">
                                            Buyer · {selectedBuyer.user_email}
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                                        <Package className="w-3 h-3" /> Batch #{selectedBuyer.batch_id}
                                    </span>
                                </header>

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
                                            <h3 className="text-base font-semibold text-zinc-900 mb-1">No messages</h3>
                                            <p className="text-xs text-zinc-500 max-w-[260px]">
                                                This buyer and seller haven't exchanged any messages yet.
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
                                            const isSellerSide = item.sender_role === "seller";
                                            return (
                                                <div key={item.message_id} className={`flex ${isSellerSide ? "justify-end" : "justify-start"}`}>
                                                    <div className={`max-w-[78%] flex flex-col ${isSellerSide ? "items-end" : "items-start"}`}>
                                                        <span className={`text-[10px] mb-1 px-1 font-semibold uppercase tracking-wider ${isSellerSide ? "text-emerald-700" : "text-zinc-500"}`}>
                                                            {isSellerSide ? "Seller" : "Buyer"}
                                                        </span>
                                                        <div
                                                            className={`px-3.5 py-2 text-sm leading-snug whitespace-pre-wrap break-words shadow-sm ${isSellerSide
                                                                ? "bg-[#0f4c2a] text-white rounded-2xl rounded-br-md"
                                                                : "bg-white text-zinc-900 border border-zinc-200 rounded-2xl rounded-bl-md"
                                                                }`}
                                                        >
                                                            {item.message}
                                                        </div>
                                                        <span className="text-[10px] mt-1 px-1 text-zinc-400">
                                                            {item?.created_at ? formatChatDateTime(item.created_at) : ""}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Admin read-only footer note (no composer) */}
                                <div className="flex-shrink-0 border-t border-zinc-200 bg-zinc-50/50 px-5 py-3 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
                                    <Eye className="w-3 h-3" />
                                    Read-only · admin observation
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center bg-zinc-50/30">
                                <div className="text-center max-w-[300px] px-6">
                                    <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                                        <MessageSquareText className="w-8 h-8 text-emerald-700" />
                                    </div>
                                    <h3 className="text-base font-semibold text-zinc-900">Select a conversation</h3>
                                    <p className="text-sm text-zinc-500 mt-1">Pick a buyer from the list to view their thread with this seller.</p>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
