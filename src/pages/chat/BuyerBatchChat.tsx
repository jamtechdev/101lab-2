// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Send, MessageSquareText, Package, X, ShieldCheck, Loader2 } from "lucide-react";
import { getSocket } from "@/services/socket";
import axios from "axios";
import { formatChatDateTime } from "../../utils/formatChatDateTime";
import { SITE_TYPE } from "@/config/site";

type Props = {
  batchId?: any;
  sellerId?: any;
  userRole?: "buyer" | "seller";
  onClose?: () => void;
};

export default function BuyerChatTest({ batchId, sellerId, userRole = "buyer", onClose }: Props) {
  const socket = getSocket();
  const loggedInUserId = localStorage.getItem("userId");

  const batch_id = batchId;
  const current_user_id = loggedInUserId;
  const other_party_id = sellerId;
  const buyer_id = userRole === "seller" ? other_party_id : current_user_id;
  const seller_id = userRole === "seller" ? current_user_id : other_party_id;

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const conversationIdRef = useRef(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const url = import.meta.env.VITE_SOCKET_URL;
  const apiUrl = import.meta.env.VITE_PRODUCTION_URL;

  const otherPartyLabel = userRole === "seller" ? "Buyer" : "Seller";
  const otherPartyInitial = (otherPartyLabel?.[0] || "?").toUpperCase();

  const STARTER_PROMPTS = userRole === "seller"
    ? [
        "Thanks for your interest — happy to help.",
        "Item is available. When can you pick up?",
        "Could you share your company details?",
      ]
    : [
        "Is this batch still available?",
        "Can you share more photos or serial numbers?",
        "What are the pickup / shipping terms?",
      ];

  const fetchConversationMessages = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}chat/buyer/${batch_id}/${buyer_id}/${seller_id}?platform=${SITE_TYPE}`
      );
      const conversationMessages = response.data;
      if (conversationMessages.length > 0) setMessages(conversationMessages);
    } catch (err) {
      console.error("Error fetching seller messages:", err);
    }
  };

  useEffect(() => {
    if (!socket) return;
    if (!socket.connected) socket.connect();

    const handleChatMessage = (msg) => {
      if (msg.conversation_id !== conversationIdRef.current) return;
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("chat_message", handleChatMessage);

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
            fetchConversationMessages();
          }
        }
      );
    }

    return () => {
      socket.off("chat_message", handleChatMessage);
    };
  }, [socket, batch_id, buyer_id, seller_id]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [input]);

  const sendMessage = (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text) return;
    if (!conversationId) {
      console.log("Cannot send: conversationId not ready");
      return;
    }
    setSending(true);
    socket.emit("chat_message", {
      conversation_id: conversationId,
      batch_id: `batch-${batch_id}`,
      sender_id: current_user_id,
      receiver_id: other_party_id,
      sender_role: userRole,
      message: text,
      platform: SITE_TYPE,
    });

    axios.post(`${apiUrl}chat/notify-admin`, {
      conversation_id: conversationId,
      batch_id: batch_id,
      buyer_id: buyer_id,
      seller_id: seller_id,
      sender_role: userRole,
      message: text,
      platform: SITE_TYPE,
    }).catch(() => {});

    setInput("");
    // Reset the input height after clearing
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      setSending(false);
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Build a flat render list with date dividers interleaved.
  const renderItems = useMemo(() => {
    if (!Array.isArray(messages) || messages.length === 0) return [];
    const items: any[] = [];
    let lastKey = "";
    const now = new Date();
    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const dividerLabel = (d: Date) => {
      const today = new Date();
      const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
      if (isSameDay(d, today)) return "Today";
      if (isSameDay(d, yesterday)) return "Yesterday";
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" });
    };
    for (const msg of messages) {
      const d = new Date(msg.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (key !== lastKey) {
        items.push({ type: "divider", id: `d-${key}`, label: dividerLabel(d) });
        lastKey = key;
      }
      items.push({ type: "msg", ...msg });
    }
    return items;
  }, [messages]);

  const hasMessages = Array.isArray(messages) && messages.length > 0;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── Header ───────────────────────────────────── */}
      <header className="px-4 py-3 bg-[#0f4c2a] text-white flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-full bg-[#1a7a45] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {otherPartyInitial}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#0f4c2a]" aria-label="online" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight truncate">{otherPartyLabel}</p>
          <p className="text-[11px] text-emerald-100/80 leading-tight mt-0.5">Typically replies within a few hours</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* ── Context strip ───────────────────────────── */}
      <div className="px-4 py-2.5 bg-emerald-50/60 border-b border-emerald-100 flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-white border border-emerald-200 flex items-center justify-center flex-shrink-0">
          <Package className="w-3.5 h-3.5 text-emerald-700" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-emerald-700/70 font-semibold leading-tight">Batch</p>
          <p className="text-xs font-semibold text-emerald-900 leading-tight">#{batch_id}</p>
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 bg-slate-50/50 space-y-2">
        {hasMessages ? (
          <>
            {renderItems.map((item) => {
              if (item.type === "divider") {
                return (
                  <div key={item.id} className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{item.label}</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                );
              }
              const isOwn = String(item.sender_id) === String(current_user_id);
              return (
                <div key={item.message_id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[78%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                    <div
                      className={`px-3.5 py-2 text-sm leading-snug whitespace-pre-wrap break-words shadow-sm ${
                        isOwn
                          ? "bg-[#0f4c2a] text-white rounded-2xl rounded-br-md"
                          : "bg-white text-slate-900 border border-slate-200 rounded-2xl rounded-bl-md"
                      }`}
                    >
                      {item.message}
                    </div>
                    <span className={`text-[10px] mt-1 px-1 ${isOwn ? "text-slate-400" : "text-slate-400"}`}>
                      {formatChatDateTime(item.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          /* ── Empty state ── */
          <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <MessageSquareText className="w-7 h-7 text-emerald-700" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              Start a conversation with the {otherPartyLabel.toLowerCase()}
            </h3>
            <p className="text-xs text-slate-500 mb-5 max-w-[260px]">
              Ask questions about this batch — pickup, condition, photos, or anything else.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-[280px]">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setInput(p);
                    textareaRef.current?.focus();
                  }}
                  className="text-left text-xs px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-colors text-slate-700"
                >
                  {p}
                </button>
              ))}
            </div>
            <p className="mt-6 text-[10px] text-slate-400 flex items-center gap-1.5 max-w-[280px] leading-relaxed">
              <ShieldCheck className="w-3 h-3 flex-shrink-0" />
              Messages may be reviewed for trust &amp; safety.
            </p>
          </div>
        )}
      </div>

      {/* ── Input (sticky footer) ────────────────────── */}
      <div className="border-t border-slate-200 bg-white px-3 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700/40 focus:bg-white transition-colors"
            style={{ minHeight: 44, maxHeight: 140 }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || sending}
            aria-label="Send message"
            className="w-10 h-10 rounded-full bg-[#0f4c2a] hover:bg-[#1a3c2a] disabled:bg-emerald-900/30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors flex-shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="mt-1.5 px-1 text-[10px] text-slate-400">
          <span className="font-medium">Enter</span> to send · <span className="font-medium">Shift + Enter</span> for new line
        </p>
      </div>
    </div>
  );
}
