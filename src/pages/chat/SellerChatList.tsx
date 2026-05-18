import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { Inbox, Package, Search, Send, MessageSquareText, Loader2, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { sidebarFixedLeftClass } from "@/components/layouts/sidebar";
import { cn } from "@/lib/utils";
import { getSocket } from "@/services/socket";
import { useLocation, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/rtk/store";
import { useSellerPermissions } from "@/hooks/useSellerPermissions";
import { SITE_TYPE } from "@/config/site";
import { formatChatDateTime } from '../../utils/formatChatDateTime';
import { avatarColor, avatarInitial, formatInboxTime, formatThreadDivider } from '../../utils/chatHelpers';
import { Button } from "@/components/ui/button";

export default function SellerChatPageList() {
    const { hasPermission } = useSellerPermissions();
    const sellerId =  localStorage.getItem("companySellerId") || localStorage.getItem("userId")
    const apiUrl = import.meta.env.VITE_PRODUCTION_URL;
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const batchId = searchParams.get("batchId");
    const buyerIdFromParam = searchParams.get("buyerId");
    const [unreadMap, setUnreadMap] = useState({});
    const bottomRef = useRef(null);
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

    const [hasMore, setHasMore] = useState(true);
    const [loadingOlder, setLoadingOlder] = useState(false);

    const MESSAGE_LIMIT = 20;



    const unreadMap1 = useSelector((state: RootState) => state.unread);




    // -----------------------------------
    // SOCKET INITIALIZATION
    // -----------------------------------
    useEffect(() => {

        if (!socket) return;

        socket.emit("joinRooms", { user_id: sellerId, role: "seller" });

        socket.on("chat_message", (msg) => {
            if (msg.conversation_id === conversationId) {
                setMessages((prev) => [...prev, msg]);
            }

            setBuyers((prev) =>
                prev.map((b) =>
                    b.ID === msg.sender_id && b.batch_id === msg.batch_id
                        ? { ...b, lastMessageAt: msg.created_at }
                        : b
                )
            );
        });

        socket.on("new_conversation_seller", (data) => {
            fetchBuyers();
        });

        // socket.on("notification", (data) => {
        //     console.log("notification received:", data);
        //     console.log("currently selected buyer:", selectedBuyer);

        //     if (!(selectedBuyer?.ID === data.buyer_id && selectedBuyer?.batch_id === data.batch_id)) {
        //         const key = `${data.buyer_id}_${data.batch_id}`;
        //         setUnreadMap((prev) => ({
        //             ...prev,
        //             [key]: (prev[key] || 0) + 1,
        //         }));
        //     }
        // });

        return () => {
            socket.off("chat_message");
        };
    }, [socket, conversationId]);

    // -----------------------------------
    // Fetch all buyers (left list)
    // -----------------------------------
    const fetchBuyers = async () => {
        setLoadingBuyers(true);
        try {
            const res = await axios.get(
                `${apiUrl}chat/batch/${batchId}/seller/${sellerId}/buyers`
            );
            // setBuyers(res.data.buyerList?.data || []);
            setBuyers(Array.isArray(res.data.buyerList?.data) ? res.data.buyerList.data : []);

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

    // -----------------------------------
    // When clicking a buyer → join chat + load messages
    // -----------------------------------
    const openConversation = async (buyer) => {
        if (!socket) return;
        setSelectedBuyer(buyer);
        setMessages([]);
        setLoadingMessages(true);


        // ----- Reset unread count for this buyer + batch -----
        const key = `${buyer.ID}_${buyer.batch_id}`;
        setUnreadMap((prev) => ({
            ...prev,
            [key]: 0,
        }));


        try {
            await axios.put(`${apiUrl}notifications/read_by_batch`, {
                batchId: buyer.batch_id,
                buyerId: buyer.ID,
                sellerId: sellerId,
                platform: SITE_TYPE,
            });

            // Emit socket to seller so Notification Bell updates in real-time
            socket.emit("notification_read", {
                sellerId: sellerId,
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

                    const messagesFetched = msgRes.data.messages || [];

                    setMessages(msgRes.data.messages || []);
                    setHasMore(msgRes.data.hasMore);

                    if (messagesFetched.length > 0) {
                        const lastMsgTime = messagesFetched[messagesFetched.length - 1].created_at;

                        setBuyers(prev =>
                            prev.map(s =>
                                s.ID === buyer.ID && s.batch_id === buyer.batch_id
                                    ? { ...s, lastMessageAt: lastMsgTime }
                                    : s
                            )
                        );
                    }


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



    // -----------------------------------
    // SEND MESSAGE
    // -----------------------------------
    const handleSendMessage = () => {
        // Check permission before sending
        if (!hasPermission("chat.send")) {
            return;
        }
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

        // setMessages((prev) => [...prev, newMessage.trim()]);


        const now = new Date().toISOString();
        setBuyers(prev =>
            prev.map(s =>
                s.ID === selectedBuyer.ID && s.batch_id === selectedBuyer.batch_id
                    ? { ...s, lastMessageAt: now }
                    : s
            )
        );

        setNewMessage("");
    };


    // Deduplicate by (buyer ID + batch ID). The backend may return multiple
    // conversation rows for the same buyer/batch pair — keep the entry with
    // the most recent activity.
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


    const sortedBuyers = filteredBuyers.sort((a, b) => {
        const unreadA = unreadMap1.map?.[`${a.ID}_${a.batch_id}`] || 0;
        const unreadB = unreadMap1.map?.[`${b.ID}_${b.batch_id}`] || 0;

        if (unreadB !== unreadA) return unreadB - unreadA; // unread first

        const dateA = new Date(a.lastMessageAt || 0).getTime();
        const dateB = new Date(b.lastMessageAt || 0).getTime();
        return dateB - dateA;
    });






    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    useEffect(() => {
        if (!buyers.length || !buyerIdFromParam) return;
        if (selectedBuyer) return;

        const buyerToSelect = buyers.find(
            b => b.ID.toString() === buyerIdFromParam
        );

        if (buyerToSelect) {
            openConversation(buyerToSelect);
        }
    }, [buyers, buyerIdFromParam, selectedBuyer]);




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

    const canSend = hasPermission("chat.send");

    return (
        <DashboardLayout>
            {/* Full-bleed below header; left offset matches sidebar width (280px). */}
            <div
              className={cn(
                "fixed top-14 left-0 right-0 bottom-0 flex bg-white overflow-hidden z-10",
                sidebarFixedLeftClass
              )}
            >

                {/* ── LEFT: INBOX LIST ───────────────────────────────── */}
                <aside className="w-full sm:w-[360px] bg-white border-r border-zinc-200 flex flex-col min-h-0">
                    <div className="px-4 pt-5 pb-3 border-b border-zinc-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Inbox className="w-5 h-5 text-[#0f4c2a]" />
                            <h2 className="text-lg font-semibold text-zinc-900">Messages</h2>
                            <span className="ml-auto text-xs text-zinc-500">{sortedBuyers.length}</span>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Search by buyer, batch, email…"
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
                                <p className="text-sm font-medium text-zinc-900">No conversations yet</p>
                                <p className="text-xs text-zinc-500 mt-1 max-w-[230px] mx-auto">
                                    Buyers will reach out once your batches are live and discoverable.
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-zinc-100">
                                {sortedBuyers.map((buyer) => {
                                    const isSelected = selectedBuyer?.ID === buyer.ID && selectedBuyer?.batch_id === buyer.batch_id;
                                    const unread = unreadMap1.map?.[`${buyer.ID}_${buyer.batch_id}`] || 0;
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

                {/* ── RIGHT: THREAD ──────────────────────────────────── */}
                <section className="flex-1 flex flex-col min-h-0 bg-white">
                    {selectedBuyer ? (
                        <>
                            <header className="flex-shrink-0 px-5 py-3 border-b border-zinc-200 bg-white flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full ${avatarColor(selectedBuyer.ID)} text-white flex items-center justify-center font-medium text-sm flex-shrink-0`}>
                                    {avatarInitial(selectedBuyer.display_name)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-semibold text-zinc-900 leading-tight truncate">{selectedBuyer.display_name}</h3>
                                    <p className="text-[11px] text-zinc-500 leading-tight mt-0.5">Buyer interested in your listing</p>
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
                                        <h3 className="text-base font-semibold text-zinc-900 mb-1">No messages yet</h3>
                                        <p className="text-xs text-zinc-500 max-w-[260px]">
                                            This buyer hasn't sent a message yet. You can send the first reply here.
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
                                        const isOwn = item.sender_role === "seller";
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
                                                        {item?.created_at ? formatChatDateTime(item.created_at) : ""}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={bottomRef} />
                            </div>

                            <div className="flex-shrink-0 border-t border-zinc-200 bg-white px-3 py-3">
                                {!canSend && (
                                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5 mb-2 flex items-center gap-1.5">
                                        <ShieldCheck className="w-3 h-3" />
                                        You don't have permission to send messages. Ask your company admin.
                                    </p>
                                )}
                                <div className="flex items-end gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        placeholder={canSend ? "Type a message…" : "Sending disabled"}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && canSend && handleSendMessage()}
                                        disabled={!canSend}
                                        className="flex-1 h-11 px-3.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700/40 focus:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!canSend || !newMessage.trim()}
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
                                <p className="text-sm text-zinc-500 mt-1">Pick a buyer from the list to view your message thread.</p>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}
