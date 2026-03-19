import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { getSocket } from "@/services/socket";
import {
  toastSuccess,
  toastError,
  toastWarning,
} from "../helper/toasterNotification";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  setUnread,
  incrementUnread,
  setUnreadMap,
} from "../rtk/slices/unreadSlice";
import { SITE_TYPE } from "@/config/site";
                                                                                      
const url = import.meta.env.VITE_PRODUCTION_URL;

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [audioAllowed, setAudioAllowed] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const DEFAULT_TITLE = "GreenBidz Seller Portal - Turn Assets into Value";

  const notificationSound = new Audio("/notification.mp3");
  notificationSound.preload = "auto";

  // Fetch notifications API
  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(
        `${url}notifications/${userId}?unread=true&platform=${SITE_TYPE}`,
      );

      const list = res?.data?.notifications || [];
      // setNotifications(res?.data?.notifications || []);

      setNotifications(list);

      const map = {};
      list.forEach((n) => {
        const key = `${n.buyer_id}_${n.batch_id}`;
        map[key] = (map[key] || 0) + 1;
      });

      dispatch(setUnreadMap(map));
    } catch (error) {
      console.error("Error fetching notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [userId, open]);

  // SOCKET JOIN + LISTENER
  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();

    const handleNotification = (data) => {
      notificationSound
        .play()
        .catch((err) => console.log("Audio play error:", err));
      fetchNotifications();
      // const key = `${data.buyer_id}_${data.batch_id}`;
      // dispatch(incrementUnread({ key }));
    };

    socket.on("notification", handleNotification);

    // Cleanup: remove listener, but do NOT disconnect
    return () => {
      socket.off("notification", handleNotification);
    };
  }, [userId]);

  //   useEffect(() => {
  //   const unlockAudio = () => {
  //     const sound = new Audio("/notification.mp3");
  //     sound.play().finally(() => {
  //       setAudioAllowed(true);
  //     });
  //     window.removeEventListener("click", unlockAudio);
  //   };

  //   // Wait for first user interaction
  //   window.addEventListener("click", unlockAudio);
  //   return () => window.removeEventListener("click", unlockAudio);
  // }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) New Notification - GreenBidz Seller Portal`;
    } else {
      document.title = DEFAULT_TITLE;
    }

    // Cleanup when component unmounts
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [unreadCount]);

  // Mark all unread notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter((n) => !n.isRead)
        .map((n) => n.notification_id);

      if (unreadIds.length === 0) return;

      await axios.put(`${url}notifications/read`, {
        ids: unreadIds,
        platform: SITE_TYPE,
      });
      setOpen(!open);

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark notifications as read", error);
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    if (open) {
      // Dropdown is closing → mark all as read
      // markAllAsRead();
    }
    setOpen(!open);
  };

  // 

  
// 1- TypeScript 
// 2- Next js 
// 3- React & Node enhance 
// 4- Database 
// 5- AI & AWS
  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-full hover:bg-gray-100"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-1 bg-red-500 border border-red-500 rounded-full text-white text-xs px-1.5 py-0.5">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="
      absolute right-0 mt-2 w-72
      bg-white shadow-lg border rounded-xl z-50
      flex flex-col max-h-64
    "
          style={{ maxHeight: "26rem" }}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-3 border-b shrink-0">
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

          {/* Scrollable list */}
          {notifications.length === 0 ? (
            <p className="text-gray-400 text-sm p-3">No notifications</p>
          ) : (
            <ul className="flex-1 overflow-y-auto p-3 space-y-2">
              {notifications.map((n) => (
                <li
                  key={n.notification_id}
                  className={`p-2 border rounded-lg text-sm cursor-pointer hover:bg-gray-100 ${
                    !n.isRead ? "bg-gray-50 font-semibold" : "bg-white"
                  }`}
                  onClick={() => navigate(n?.url)}
                >
                  <p className="font-medium">{n.title}</p>
                  <p className="text-xs text-gray-600">{n.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}


    </div>
  );
}
