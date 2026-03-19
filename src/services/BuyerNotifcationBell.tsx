// @ts-nocheck
import { useEffect, useState, useRef } from "react";
import { Bell, PartyPopper } from "lucide-react";
import axios from "axios";
import { getSocket } from "@/services/socket";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { setUnreadMap, setBidAcceptedCount } from "../rtk/slices/unreadSlice";
import { SITE_TYPE } from "@/config/site";

const url = import.meta.env.VITE_PRODUCTION_URL;

export default function BuyerNotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [audioAllowed, setAudioAllowed] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for dropdown

  const DEFAULT_TITLE = "GreenBidz Seller Portal - Turn Assets into Value";

  const notificationSound = new Audio("/notification.mp3");
  notificationSound.preload = "auto";

  const { map: unreadMap, bidAcceptedCount } = useSelector(
    (state: RootState) => state.unread
  );

  const totalChatUnread = Object.values(unreadMap).reduce(
    (sum, count) => sum + count,
    0
  );

  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${url}notifications/${userId}?unread=true&platform=${SITE_TYPE}`);
      const list = res?.data?.notifications || [];
      setNotifications(list);

      const map: Record<string, number> = {};
      let bidCount = 0;
      list.forEach((n) => {
        if (n.type === "chat" && !n.isRead) {     
          const key = `${n.seller_id}_${n.batch_id}`;
          map[key] = (map[key] || 0) + 1;
        }

        
        if (n.type === "Bid Accepted" && !n.isRead) {
          bidCount += 1;
        }
      });

      dispatch(setUnreadMap(map));
      dispatch(setBidAcceptedCount(bidCount));
    } catch (error) {
      console.error("Error fetching notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [userId, open]);

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();

    const handleNotification = (data) => {
      if (data?.type === "Bid Accepted") {
        new Audio("/celebration.mp3").play().catch(() => {});
      } else {
        notificationSound.play().catch(() => {});
      }
      fetchNotifications();
    };

    socket.on("notification", handleNotification);
    return () => socket.off("notification", handleNotification);
  }, [userId]);

  // Outside click detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter((n) => !n.isRead)
        .map((n) => n.notification_id);
      if (!unreadIds.length) return;

      await axios.put(`${url}notifications/read`, { ids: unreadIds, platform: SITE_TYPE });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setOpen(false);
    } catch (error) {
      console.error("Failed to mark notifications as read", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const latestBidAccepted = notifications
    .filter((n) => n.type === "Bid Accepted")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  return (
    <div className="relative flex gap-2">
      {/* Chat / Notifications Bell */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-100"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-1 bg-red-500 rounded-full text-white text-xs px-1.5 py-0.5">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 bg-white shadow-lg border rounded-xl z-50 flex flex-col max-h-[26rem] overflow-y-auto"
        >
          <div className="flex justify-between items-center p-3 border-b">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-gray-400 text-sm p-3">No notifications</p>
          ) : (
            <ul className="flex-1 flex-col p-3 space-y-2">
              {notifications.map((n) => (
                <li
                  key={n.notification_id}
                  className={`p-2 border rounded-lg text-sm cursor-pointer hover:bg-gray-100 flex items-center gap-2 ${
                    !n.isRead ? "bg-gray-50 font-semibold" : "bg-white"
                  }`}
                  onClick={() => {
                    if (n.type === "chat") {
                      navigate("/buyer/chat/message");
                    } else if (n.url) {
                      navigate(n.url);
                    }
                    setOpen(false);
                  }}
                >
                  {n.type === "Bid Accepted" && (
                    <PartyPopper className="text-green-600" size={18} />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{n.title}</p>
                    <p className="text-xs text-gray-600">{n.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Bid Accepted Icon in header (clickable) */}
      {/* {bidAcceptedCount > 0 && latestBidAccepted && (
        <div
          className="relative p-2 rounded-full hover:bg-gray-100 cursor-pointer"
          onClick={() =>
            latestBidAccepted.url && navigate(latestBidAccepted.url)
          }
        >
          <PartyPopper size={22} className="text-green-600" />
          <span className="absolute -top-2 -right-1 bg-green-600 rounded-full text-white text-xs px-1.5 py-0.5">
            {bidAcceptedCount}
          </span>
        </div>
      )} */}
    </div>
  );
}
