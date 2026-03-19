import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket;
const url=import.meta.env.VITE_SOCKET_URL;

export const getSocket = () => {
  if (!socket) {
  socket = io(url, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  }
  return socket;
};



export const useSocketConnected = () => {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = getSocket();

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);

    // Initial state
    setConnected(s.connected);

    return () => {
      s.off("connect", handleConnect);
      s.off("disconnect", handleDisconnect);
    };
  }, []);

  return connected;
};