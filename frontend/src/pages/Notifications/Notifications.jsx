import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trash2,
  Bell,
  GraduationCap,
  UserPlus,
  CalendarDays,
  PartyPopper,
  Wallet,
  BellOff,
} from "lucide-react";

import {
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../../api/notification.api";

// =====================================================
// ICON + COLOR MAP — one look per notification type
// Falls back to a generic bell if the type isn't listed.
// =====================================================

const TYPE_STYLES = {
  student: { icon: GraduationCap, bg: "#D1E8FC", color: "#1D6FB8" },
  staff: { icon: UserPlus, bg: "#D1E8FC", color: "#1D6FB8" },
  academic_year: { icon: CalendarDays, bg: "#FCEFFC", color: "#A855C7" },
  holiday: { icon: PartyPopper, bg: "#FFF3DC", color: "#C77B1D" },
  fee_deadline: { icon: Wallet, bg: "#FFE3E3", color: "#D14343" },
  fee: { icon: Wallet, bg: "#DFFCEA", color: "#1FA05B" },
  general: { icon: Bell, bg: "#D1E8FC", color: "#1D6FB8" },
};

const getTypeStyle = (type) => TYPE_STYLES[type] || TYPE_STYLES.general;

const Notifications = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // LOAD ALL NOTIFICATIONS
  // =====================================================

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const response = await getAllNotifications();

      setNotifications(response.data || []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // MARK ONE NOTIFICATION AS READ (on click)
  // =====================================================

  const handleNotificationClick = async (notification) => {
    if (notification.isRead) {
      return;
    }

    try {
      await markNotificationAsRead(notification.id);

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, isRead: true }
            : item
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // =====================================================
  // MARK ALL AS READ (button at the top)
  // =====================================================

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();

      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true }))
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  // =====================================================
  // DELETE ONE NOTIFICATION
  // =====================================================

  const handleDeleteOne = async (event, notificationId) => {
    event.stopPropagation();

    const confirmed = window.confirm("Delete this notification?");
    if (!confirmed) return;

    try {
      await deleteNotification(notificationId);

      setNotifications((current) =>
        current.filter((item) => item.id !== notificationId)
      );
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  // =====================================================
  // DELETE ALL NOTIFICATIONS
  // =====================================================

  const handleDeleteAll = async () => {
    if (notifications.length === 0) return;

    const confirmed = window.confirm(
      "Delete ALL notifications? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      await deleteAllNotifications();
      setNotifications([]);
    } catch (error) {
      console.error("Failed to delete all notifications:", error);
    }
  };

  // =====================================================
  // RELATIVE TIME (e.g. "2 hours ago", "Yesterday")
  // =====================================================

  const formatRelativeTime = (date) => {
    if (!date) return "";

    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

    return then.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // GROUP NOTIFICATIONS INTO Today / Yesterday / Older
  // =====================================================

  const groupNotifications = (list) => {
    const today = [];
    const yesterday = [];
    const older = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    list.forEach((notification) => {
      const createdAt = new Date(notification.createdAt);

      if (createdAt >= startOfToday) {
        today.push(notification);
      } else if (createdAt >= startOfYesterday) {
        yesterday.push(notification);
      } else {
        older.push(notification);
      }
    });

    const sections = [];
    if (today.length > 0) sections.push({ label: "Today", items: today });
    if (yesterday.length > 0) sections.push({ label: "Yesterday", items: yesterday });
    if (older.length > 0) sections.push({ label: "Older", items: older });

    return sections;
  };

  const groupedSections = groupNotifications(notifications);
  const hasUnread = notifications.some((n) => !n.isRead);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FCEFFC]/40 via-transparent to-transparent p-6">

      {/* =================================================
          PAGE HEADER
          ================================================= */}

      <div className="flex items-center justify-between mb-5">

        <div className="flex items-center gap-3">

          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: "#D1E8FC" }}
          >
            <Bell size={20} style={{ color: "#1D6FB8" }} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Notifications
              {unreadCount > 0 && (
                <span
                  className="ml-2 align-middle text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "#D1E8FC", color: "#1D6FB8" }}
                >
                  {unreadCount} new
                </span>
              )}
            </h1>

            <p className="text-sm text-gray-500 mt-0.5">
              Notifications from the past 15 days
            </p>
          </div>

        </div>

        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
        >
          Back
        </button>

      </div>

      {/* =================================================
          ACTION BAR — Mark all as read / Delete all
          ================================================= */}

      {notifications.length > 0 && (
        <div className="flex items-center justify-end gap-4 mb-4">

          <button
            onClick={handleMarkAllAsRead}
            disabled={!hasUnread}
            className="text-sm font-medium transition-colors duration-200 disabled:text-gray-300 disabled:cursor-not-allowed"
            style={{ color: hasUnread ? "#1D6FB8" : undefined }}
          >
            Mark all as read
          </button>

          <span className="text-gray-300">|</span>

          <button
            onClick={handleDeleteAll}
            className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors duration-200"
          >
            Delete all
          </button>

        </div>
      )}

      {/* =================================================
          LOADING
          ================================================= */}

      {loading ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-12 text-center">

          <div
            className="w-10 h-10 mx-auto rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: "#D1E8FC", borderTopColor: "transparent" }}
          ></div>

          <p className="text-sm text-gray-500 mt-4">
            Loading notifications...
          </p>

        </div>
      ) : notifications.length === 0 ? (

        /* =================================================
           NO NOTIFICATIONS
           ================================================= */

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-14 text-center">

          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "#D1E8FC" }}
          >
            <BellOff size={26} style={{ color: "#1D6FB8" }} />
          </div>

          <h2 className="text-lg font-semibold text-gray-800 mt-4">
            No notifications
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            There are no notifications from the past 15 days.
          </p>

        </div>
      ) : (

        /* =================================================
           GROUPED NOTIFICATION LIST
           ================================================= */

        <div className="space-y-7">

          {groupedSections.map((section) => (

            <div key={section.label}>

              {/* Section label — Today / Yesterday / Older */}
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#1D6FB8" }}>
                  {section.label}
                </span>
                <span className="flex-1 h-px bg-gradient-to-r from-[#D1E8FC] to-transparent"></span>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

                {section.items.map((notification) => {
                  const style = getTypeStyle(notification.type);
                  const TypeIcon = style.icon;

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`group flex items-start gap-4 px-5 py-4 border-b border-gray-100 last:border-b-0 cursor-pointer transition-all duration-200 hover:bg-[#FCEFFC]/50 ${
                        !notification.isRead ? "bg-[#D1E8FC]/25" : "bg-white"
                      }`}
                    >

                      {/* Type icon avatar */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                        style={{ backgroundColor: style.bg }}
                      >
                        <TypeIcon size={18} style={{ color: style.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">

                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {notification.title}
                          </h4>

                          {!notification.isRead && (
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: "#1D6FB8" }}
                            ></span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                          {notification.message}
                        </p>

                        <p className="text-xs text-gray-400 mt-2">
                          {formatRelativeTime(notification.createdAt)}
                        </p>

                      </div>

                      {/* Delete button — appears clearly on hover */}
                      <button
                        onClick={(event) => handleDeleteOne(event, notification.id)}
                        className="flex-shrink-0 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg p-1.5 transition-all duration-200 opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>
                  );
                })}

              </div>

            </div>

          ))}

        </div>
      )}

    </div>
  );
};

export default Notifications;