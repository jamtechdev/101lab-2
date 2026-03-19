// @ts-nocheck
import React from "react";
import { MessageCircle, X } from "lucide-react";
import SellerChatTest from "./SellerChatTest";


type Props = {
  isOpen: boolean;
  onClose: () => void;
  batchId?: number | string;
  embedded?: boolean;
};

export default function SellerSideBarWrapper({ isOpen, onClose, batchId, embedded }: Props) {
  return (
    <>
      {/* Dim Background */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[9998]"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Slide-in Chat Sidebar */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Chat sidebar"
        className={`fixed top-0 right-0 h-full  w-[350px] max-w-full bg-white shadow-2xl z-[10000] 
          transition-transform duration-300 transform
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Chat</h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Close chat"
          >
            <X size={20} />
          </button>
        </div>



        <SellerChatTest batchId={batchId} embedded={embedded} />

      </div>
    </>
  );
}
