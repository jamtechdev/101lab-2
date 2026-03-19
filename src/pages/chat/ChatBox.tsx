import { useEffect, useState } from "react";
import { getSocket } from "@/services/socket";

interface ChatBoxProps {
  batchId?: string;
  userId?: string;
  role?: "buyer" | "seller";
  otherUserId?: string;
  listingId?: string;
  userType?: string;
  userName?: string;
}

export default function ChatBox({ batchId, userId, role, otherUserId }: ChatBoxProps) {
  // const socket = getSocket();

  // const [conversationId, setConversationId] = useState<string | null>(null);
  // const [messages, setMessages] = useState<any[]>([]);
  // const [input, setInput] = useState("");

  // console.log("props is",batchId,userId,role,otherUserId,);
  

  // useEffect(() => {
  //   socket.emit(
  //     "joinChat",
  //     {
  //       batch_id: batchId,
  //       user_id: userId,
  //       role: role,
  //       other_party_id: otherUserId,
  //     },
  //     (response: any) => {

  //       console.log("respinse is",response);
        
  //       if (response?.conversation_id) {
  //         setConversationId(response.conversation_id);
  //         console.log("Joined chat room:", response.room);
  //       } else {
  //         console.error("joinChat error:", response?.error);
  //       }
  //     }
  //   );

  //   socket.on("chat_message", (msg) => {
  //     setMessages((prev) => [...prev, msg]);
  //   });

  //   return () => {
  //     socket.off("chat_message");
  //   };
  // }, []);

  // console.log("conversion id is",conversationId);
  

  // const sendMessage = () => {
  //   if (!input.trim() || !conversationId) return;

  //   socket.emit("chat_message", {
  //     conversation_id: conversationId,
  //     batch_id: batchId,
  //     sender_id: userId,
  //     sender_role: role,
  //     message: input,
  //   });

  //   setInput("");
  // };

  return (
    <div>
      <p></p>
    </div>
    // <div className="p-4 border rounded">
    //   <div className="h-64 overflow-y-auto bg-gray-100 p-2 mb-2">
    //     {messages.map((m, i) => (
    //       <div key={i} className={m.sender_id === userId ? "text-right" : "text-left"}>
    //         <p className="bg-white p-2 m-1 inline-block rounded">{m.message}</p>
    //       </div>
    //     ))}
    //   </div>

    //   <div className="flex gap-2">
    //     <input
    //       className="border p-2 w-full"
    //       value={input}
    //       onChange={(e) => setInput(e.target.value)}
    //       placeholder="Type message..."
    //     />
    //     <button onClick={sendMessage} className="bg-blue-600 text-white p-2 px-4 rounded">
    //       Send
    //     </button>
    //   </div>
    // </div>
  );
}
