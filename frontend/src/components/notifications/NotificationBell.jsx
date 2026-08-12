import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
} from "../../api/notification.api";

import { ROUTES } from "../../utils/constants";

const NotificationBell = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // =====================================================
  // LOAD UNREAD COUNT
  // =====================================================

  useEffect(() => {
    loadUnreadCount();
  }, []);

  const loadUnreadCount = async () => {
    try {
      const response = await getUnreadNotificationCount();

      console.log("NOTIFICATION RESPONSE:", response);
      console.log("UNREAD COUNT:", response.data.count);

      setUnreadCount(response.data.count);
    } catch (error) {
      console.error("Failed to load notification count:", error);
    }
  };

  // =====================================================
  // OPEN / CLOSE NOTIFICATION DROPDOWN
  // =====================================================

  const handleBellClick = async () => {
    const newState = !isOpen;

    setIsOpen(newState);

    if (newState) {
      try {
        const response = await getNotifications();

        setNotifications(response.data);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    }
  };

  // =====================================================
  // MARK NOTIFICATION AS READ
  // =====================================================

  const handleNotificationClick = async (notification) => {
    if (notification.isRead) {
      return;
    }

    try {
      await markNotificationAsRead(notification.id);

      setNotifications((currentNotifications) =>
        currentNotifications.map((item) =>
          item.id === notification.id
            ? { ...item, isRead: true }
            : item
        )
      );

      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // =====================================================
  // VIEW ALL NOTIFICATIONS
  // =====================================================

  const handleViewAll = () => {
    console.log("VIEW ALL CLICKED");

    // Close dropdown first
    setIsOpen(false);

    // Navigate to notifications page
    navigate(ROUTES.NOTIFICATIONS);
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="relative">
      {/* Notification bell */}
      <button
        type="button"
        onClick={handleBellClick}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        aria-label="Notifications"
      >
        <i className="fa-solid fa-bell text-gray-600 text-lg"></i>

        {/* Unread count */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-600 text-white text-[10px] font-semibold rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">

          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications
            </h3>

            {unreadCount > 0 && (
              <span className="text-xs text-gray-500">
                {unreadCount} unread
              </span>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">

            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <i className="fa-regular fa-bell-slash text-gray-300 text-2xl mb-2"></i>

                <p className="text-sm text-gray-500">
                  No notifications
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  onClick={() =>
                    handleNotificationClick(notification)
                  }
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.isRead
                      ? "bg-blue-50"
                      : "bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">

                    {/* Notification icon */}
                    <div className="mt-1">
                      <i className="fa-solid fa-circle-info text-blue-500"></i>
                    </div>

                    {/* Notification content */}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        {notification.message}
                      </p>

                      {!notification.isRead && (
                        <p className="text-[10px] text-blue-600 font-medium mt-1">
                          New
                        </p>
                      )}
                    </div>

                  </div>
                </button>
              ))
            )}

          </div>

          {/* =================================================
              VIEW ALL BUTTON
              ================================================= */}

          <div className="border-t border-gray-200">
            <button
              type="button"
              onClick={handleViewAll}
              className="w-full px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
            >
              View all
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default NotificationBell;