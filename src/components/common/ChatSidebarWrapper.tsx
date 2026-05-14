import React, { useEffect } from "react";
import BuyerChatTest from "../../pages/chat/BuyerBatchChat";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  batchId?: number | string;
  sellerId?: number | string;
  embedded?: boolean;
  userRole?: "buyer" | "seller";
};

export default function ChatSidebarWrapper({ isOpen, onClose, batchId, sellerId, embedded, userRole = "buyer" }: Props) {

  // Tell the Tawk customer-support widget to step aside while the in-app
  // seller chat drawer is open so the two chat UIs don't collide.
  useEffect(() => {
    if (!isOpen) return;
    window.dispatchEvent(new CustomEvent("app-chat-open"));
    return () => {
      window.dispatchEvent(new CustomEvent("app-chat-close"));
    };
  }, [isOpen]);

  // Close on Esc
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Dim Background */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[9998] transition-opacity duration-300"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Slide-in Chat Sidebar — chrome only; the chat content owns its own header / footer. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Chat sidebar"
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] max-w-full bg-white shadow-2xl z-[10000]
          flex flex-col overflow-hidden
          transition-transform duration-300 transform
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <BuyerChatTest batchId={batchId} sellerId={sellerId} userRole={userRole} onClose={onClose} />
      </div>
    </>
  );
}
