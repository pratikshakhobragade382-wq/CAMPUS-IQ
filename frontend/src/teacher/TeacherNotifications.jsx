import { useState } from "react";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import "./TeacherNotifications.css";

export default function TeacherNotifications() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Attendance Reminder",
      message:
        "Please complete today's attendance for all your assigned classes.",
      time: "Today, 9:00 AM",
      type: "attendance",
      read: false,
    },
    {
      id: 2,
      title: "New Assignment",
      message:
        "A new assignment has been added to your class. Please review it.",
      time: "Today, 10:30 AM",
      type: "assignment",
      read: false,
    },
    {
      id: 3,
      title: "Timetable Updated",
      message:
        "Your timetable has been updated. Please check the latest schedule.",
      time: "Yesterday, 4:20 PM",
      type: "timetable",
      read: true,
    },
    {
      id: 4,
      title: "Exam Reminder",
      message:
        "Your upcoming examination schedule is available in the Exams section.",
      time: "Yesterday, 11:15 AM",
      type: "exam",
      read: true,
    },
  ]);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const getIcon = (type) => {
    switch (type) {
      case "attendance":
        return "✓";

      case "assignment":
        return "A";

      case "timetable":
        return "T";

      case "exam":
        return "E";

      default:
        return "!";
    }
  };

  return (
    <div className="teacher-notifications-page">

      {/* ================================
          PAGE HEADER
      ================================= */}

      <div className="teacher-notifications-header">

        <div className="teacher-notifications-title-area">

          <div className="teacher-notifications-title-icon">
            <Bell size={24} />
          </div>

          <div>
            <h1>Notifications</h1>

            <p>
              Stay updated with important messages and activities.
            </p>
          </div>

        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            className="teacher-notifications-mark-all"
            onClick={markAllAsRead}
          >
            <CheckCheck size={17} />
            Mark all as read
          </button>
        )}

      </div>

      {/* ================================
          SUMMARY
      ================================= */}

      <div className="teacher-notifications-summary">

        <div className="teacher-notification-summary-card">

          <div className="teacher-summary-icon">
            <Bell size={20} />
          </div>

          <div>
            <span>Total Notifications</span>
            <strong>{notifications.length}</strong>
          </div>

        </div>

        <div className="teacher-notification-summary-card">

          <div className="teacher-summary-icon unread">
            <span>{unreadCount}</span>
          </div>

          <div>
            <span>Unread Notifications</span>
            <strong>{unreadCount}</strong>
          </div>

        </div>

      </div>

      {/* ================================
          NOTIFICATIONS LIST
      ================================= */}

      <div className="teacher-notifications-card">

        <div className="teacher-notifications-card-header">

          <div>
            <h2>Recent Notifications</h2>

            <p>
              Important updates related to your teaching activities.
            </p>
          </div>

          {unreadCount > 0 && (
            <span className="teacher-unread-badge">
              {unreadCount} unread
            </span>
          )}

        </div>

        <div className="teacher-notifications-list">

          {notifications.length === 0 ? (

            <div className="teacher-notifications-empty">

              <div className="teacher-empty-icon">
                <Bell size={28} />
              </div>

              <h3>No notifications</h3>

              <p>
                You are all caught up. New notifications will appear here.
              </p>

            </div>

          ) : (

            notifications.map((notification) => (

              <div
                key={notification.id}
                className={`teacher-notification-item ${
                  !notification.read ? "unread" : ""
                }`}
              >

                {/* ICON */}

                <div
                  className={`teacher-notification-icon ${notification.type}`}
                >
                  {getIcon(notification.type)}
                </div>

                {/* CONTENT */}

                <div className="teacher-notification-content">

                  <div className="teacher-notification-top">

                    <h3>{notification.title}</h3>

                    {!notification.read && (
                      <span className="teacher-notification-new">
                        New
                      </span>
                    )}

                  </div>

                  <p>{notification.message}</p>

                  <span className="teacher-notification-time">
                    {notification.time}
                  </span>

                </div>

                {/* ACTIONS */}

                <div className="teacher-notification-actions">

                  {!notification.read && (
                    <button
                      type="button"
                      title="Mark as read"
                      aria-label={`Mark ${notification.title} as read`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check size={17} />
                    </button>
                  )}

                  <button
                    type="button"
                    title="Delete notification"
                    aria-label={`Delete ${notification.title}`}
                    onClick={() =>
                      deleteNotification(notification.id)
                    }
                  >
                    <Trash2 size={17} />
                  </button>

                </div>

              </div>

            ))

          )}

        </div>

      </div>

    </div>
  );
}