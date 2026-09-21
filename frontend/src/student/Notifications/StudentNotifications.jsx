import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Bell,
  CalendarDays,
  CheckCheck,
  ClipboardList,
  FileText,
  Filter,
  Loader2,
  Megaphone,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../api/notification.api";

import "./StudentNotifications.css";

/* ============================================================
   RESPONSE HELPERS
============================================================ */

function extractNotifications(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.notifications)) {
    return response.data.notifications;
  }

  if (Array.isArray(response?.notifications)) {
    return response.notifications;
  }

  return [];
}

function extractUnreadCount(response) {
  if (typeof response === "number") {
    return response;
  }

  if (typeof response?.data?.count === "number") {
    return response.data.count;
  }

  if (typeof response?.count === "number") {
    return response.count;
  }

  return 0;
}

/* ============================================================
   NORMALIZE NOTIFICATION
============================================================ */

function normalizeNotification(notification) {
  if (!notification) {
    return null;
  }

  return {
    ...notification,

    id: notification.id ?? notification._id,

    title:
      notification.title ||
      "Notification",

    message:
      notification.message ||
      notification.body ||
      "",

    type:
      notification.type ||
      "general",

    priority:
      notification.priority ||
      "normal",

    createdAt:
      notification.createdAt ||
      notification.created_at ||
      notification.date ||
      null,

    isRead:
      notification.isRead === true ||
      notification.read === true ||
      Boolean(notification.readAt),
  };
}

/* ============================================================
   ICONS
============================================================ */

function getNotificationIcon(type) {
  switch (type) {
    case "holiday":
      return CalendarDays;

    case "exam":
      return FileText;

    case "assignment":
    case "homework":
    case "activity":
      return ClipboardList;

    case "announcement":
      return Megaphone;

    default:
      return Bell;
  }
}

/* ============================================================
   TYPE LABEL
============================================================ */

function getNotificationTypeLabel(type) {
  switch (type) {
    case "holiday":
      return "Holiday";

    case "exam":
      return "Exam";

    case "assignment":
      return "Assignment";

    case "homework":
      return "Homework";

    case "announcement":
      return "Announcement";

    case "activity":
      return "Activity";

    default:
      return "General";
  }
}

/* ============================================================
   TIME FORMAT
============================================================ */

function formatNotificationTime(value) {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const now = new Date();

  const difference = Math.floor(
    (now.getTime() - date.getTime()) / 1000
  );

  if (difference < 60) {
    return "Just now";
  }

  if (difference < 3600) {
    const minutes = Math.floor(
      difference / 60
    );

    return `${minutes} minute${
      minutes === 1 ? "" : "s"
    } ago`;
  }

  if (difference < 86400) {
    const hours = Math.floor(
      difference / 3600
    );

    return `${hours} hour${
      hours === 1 ? "" : "s"
    } ago`;
  }

  if (difference < 172800) {
    return "Yesterday";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

/* ============================================================
   COMPONENT
============================================================ */

export default function StudentNotifications() {
  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    filterType,
    setFilterType,
  ] = useState("all");

  const [
    filterStatus,
    setFilterStatus,
  ] = useState("all");

  const [
    selectedNotification,
    setSelectedNotification,
  ] = useState(null);

  /* ==========================================================
     LOAD NOTIFICATIONS

     IMPORTANT:
     Use getNotifications(), not getAllNotifications().
  ========================================================== */

  const loadNotifications = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) {
          setLoading(true);
        }

        setError("");

        const [
          notificationResponse,
          countResponse,
        ] = await Promise.all([
          getNotifications(),
          getUnreadNotificationCount(),
        ]);

        const list = extractNotifications(
          notificationResponse
        )
          .map(normalizeNotification)
          .filter(Boolean);

        const count =
          extractUnreadCount(countResponse);

        setNotifications(list);
        setUnreadCount(count);
      } catch (err) {
        console.error(
          "Student notification load error:",
          err
        );

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load notifications.";

        setError(message);
      } finally {
        if (!silent) {
          setLoading(false);
        }

        setRefreshing(false);
      }
    },
    []
  );

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications({
        silent: true,
      });
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [loadNotifications]);

  /* ==========================================================
     MARK ONE AS READ
  ========================================================== */

  const handleMarkAsRead = async (
    notification
  ) => {
    if (!notification?.id) {
      setSelectedNotification(
        notification
      );
      return;
    }

    if (!notification.isRead) {
      try {
        await markNotificationAsRead(
          notification.id
        );

        setNotifications(
          (previous) =>
            previous.map((item) =>
              item.id === notification.id
                ? {
                    ...item,
                    isRead: true,
                  }
                : item
            )
        );

        setUnreadCount(
          (previous) =>
            Math.max(0, previous - 1)
        );
      } catch (err) {
        console.error(
          "Mark notification read error:",
          err
        );
      }
    }

    setSelectedNotification(
      {
        ...notification,
        isRead: true,
      }
    );
  };

  /* ==========================================================
     MARK ALL AS READ
  ========================================================== */

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      setRefreshing(true);

      await markAllNotificationsAsRead();

      setNotifications(
        (previous) =>
          previous.map((item) => ({
            ...item,
            isRead: true,
          }))
      );

      setUnreadCount(0);
    } catch (err) {
      console.error(
        "Mark all notifications read error:",
        err
      );
    } finally {
      setRefreshing(false);
    }
  };

  /* ==========================================================
     REFRESH
  ========================================================== */

  const handleRefresh = async () => {
    setRefreshing(true);

    await loadNotifications({
      silent: true,
    });
  };

  /* ==========================================================
     FILTER
  ========================================================== */

  const filteredNotifications = useMemo(() => {
    const search = searchText
      .trim()
      .toLowerCase();

    return notifications.filter(
      (notification) => {
        const title =
          String(
            notification.title || ""
          ).toLowerCase();

        const message =
          String(
            notification.message || ""
          ).toLowerCase();

        const matchesSearch =
          !search ||
          title.includes(search) ||
          message.includes(search);

        const matchesType =
          filterType === "all" ||
          notification.type ===
            filterType;

        const matchesStatus =
          filterStatus === "all" ||
          (
            filterStatus === "unread" &&
            !notification.isRead
          ) ||
          (
            filterStatus === "read" &&
            notification.isRead
          );

        return (
          matchesSearch &&
          matchesType &&
          matchesStatus
        );
      }
    );
  }, [
    notifications,
    searchText,
    filterType,
    filterStatus,
  ]);

  /* ==========================================================
     COUNTERS
  ========================================================== */

  const unreadInList =
    notifications.filter(
      (item) => !item.isRead
    ).length;

  const holidayCount =
    notifications.filter(
      (item) =>
        item.type === "holiday"
    ).length;

  const examCount =
    notifications.filter(
      (item) =>
        item.type === "exam"
    ).length;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="student-notifications-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="student-notifications-header">

        <div>
          <div className="student-notifications-title-row">

            <div className="student-notifications-title-icon">
              <Bell
                size={22}
                strokeWidth={2.2}
              />
            </div>

            <div>
              <h2>
                Notifications
              </h2>

              <p>
                Stay updated with important
                school and academic
                information.
              </p>
            </div>

          </div>
        </div>

        <div className="student-notification-header-actions">

          <button
            type="button"
            className="student-refresh-button"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh notifications"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "student-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            type="button"
            className="student-mark-all-button"
            onClick={
              handleMarkAllAsRead
            }
            disabled={
              unreadCount === 0 ||
              refreshing
            }
          >
            <CheckCheck
              size={16}
            />

            Mark all as read
          </button>

        </div>

      </div>

      {/* ======================================================
          STAT CARDS
      ====================================================== */}

      <div className="student-notification-stats">

        <div className="student-notification-stat">

          <span className="student-notification-stat-icon blue">
            <Bell size={17} />
          </span>

          <div>
            <strong>
              {notifications.length}
            </strong>

            <small>
              Recent notifications
            </small>
          </div>

        </div>

        <div className="student-notification-stat">

          <span className="student-notification-stat-icon red">
            <AlertCircle size={17} />
          </span>

          <div>
            <strong>
              {unreadInList}
            </strong>

            <small>
              Unread notifications
            </small>
          </div>

        </div>

        <div className="student-notification-stat">

          <span className="student-notification-stat-icon orange">
            <CalendarDays size={17} />
          </span>

          <div>
            <strong>
              {holidayCount}
            </strong>

            <small>
              Holiday updates
            </small>
          </div>

        </div>

        <div className="student-notification-stat">

          <span className="student-notification-stat-icon purple">
            <FileText size={17} />
          </span>

          <div>
            <strong>
              {examCount}
            </strong>

            <small>
              Exam updates
            </small>
          </div>

        </div>

      </div>

      {/* ======================================================
          SEARCH + FILTERS
      ====================================================== */}

      <div className="student-notification-toolbar">

        <div className="student-notification-search">

          <Search size={16} />

          <input
            type="text"
            placeholder="Search notifications..."
            value={searchText}
            onChange={(event) =>
              setSearchText(
                event.target.value
              )
            }
          />

        </div>

        <div className="student-notification-filter">

          <Filter size={15} />

          <select
            value={filterType}
            onChange={(event) =>
              setFilterType(
                event.target.value
              )
            }
          >
            <option value="all">
              All types
            </option>

            <option value="holiday">
              Holidays
            </option>

            <option value="exam">
              Exams
            </option>

            <option value="assignment">
              Assignments
            </option>

            <option value="homework">
              Homework
            </option>

            <option value="announcement">
              Announcements
            </option>

            <option value="activity">
              Activities
            </option>
          </select>

        </div>

        <select
          className="student-notification-status-filter"
          value={filterStatus}
          onChange={(event) =>
            setFilterStatus(
              event.target.value
            )
          }
        >
          <option value="all">
            All
          </option>

          <option value="unread">
            Unread
          </option>

          <option value="read">
            Read
          </option>
        </select>

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="student-notification-error">

          <AlertCircle size={17} />

          <div>
            <strong>
              Unable to load notifications
            </strong>

            <p>
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadNotifications()
            }
          >
            Retry
          </button>

        </div>
      )}

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading ? (
        <div className="student-notification-loading">

          <Loader2
            size={30}
            className="student-spin"
          />

          <p>
            Loading notifications...
          </p>

        </div>
      ) : filteredNotifications.length ===
        0 ? (

        /* ====================================================
           EMPTY
        ==================================================== */

        <div className="student-notification-empty">

          <div className="student-empty-icon">
            <Bell size={30} />
          </div>

          <h3>
            No notifications
          </h3>

          <p>
            {searchText ||
            filterType !== "all" ||
            filterStatus !== "all"
              ? "No notifications match your current filters."
              : "You're all caught up. New important school updates will appear here automatically."}
          </p>

          {(searchText ||
            filterType !== "all" ||
            filterStatus !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchText("");
                setFilterType("all");
                setFilterStatus("all");
              }}
            >
              Clear filters
            </button>
          )}

        </div>

      ) : (

        /* ====================================================
           NOTIFICATION LIST
        ==================================================== */

        <div className="student-notification-list">

          {filteredNotifications.map(
            (notification) => {

              const Icon =
                getNotificationIcon(
                  notification.type
                );

              return (
                <button
                  type="button"
                  key={notification.id}
                  className={`student-notification-card ${
                    notification.isRead
                      ? "read"
                      : "unread"
                  }`}
                  onClick={() =>
                    handleMarkAsRead(
                      notification
                    )
                  }
                >

                  <div
                    className={`student-notification-card-icon type-${notification.type}`}
                  >
                    <Icon size={19} />
                  </div>

                  <div className="student-notification-card-body">

                    <div className="student-notification-card-top">

                      <div className="student-notification-card-title">

                        <h3>
                          {notification.title}
                        </h3>

                        {!notification.isRead && (
                          <span className="student-unread-label">
                            New
                          </span>
                        )}

                      </div>

                      <span className="student-notification-type">
                        {getNotificationTypeLabel(
                          notification.type
                        )}
                      </span>

                    </div>

                    <p className="student-notification-message">
                      {notification.message}
                    </p>

                    <div className="student-notification-meta">

                      <span>
                        {formatNotificationTime(
                          notification.createdAt
                        )}
                      </span>

                      <span
                        className={`student-priority ${notification.priority}`}
                      >
                        {notification.priority}
                      </span>

                    </div>

                  </div>

                  {!notification.isRead && (
                    <span className="student-card-unread-dot" />
                  )}

                </button>
              );
            }
          )}

        </div>
      )}

      {/* ======================================================
          DETAIL MODAL
      ====================================================== */}

      {selectedNotification && (
        <div
          className="student-notification-modal-overlay"
          onClick={() =>
            setSelectedNotification(
              null
            )
          }
        >

          <div
            className="student-notification-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="student-notification-modal-header">

              <div className="student-notification-modal-icon">

                {(() => {
                  const Icon =
                    getNotificationIcon(
                      selectedNotification.type
                    );

                  return (
                    <Icon size={22} />
                  );
                })()}

              </div>

              <button
                type="button"
                className="student-notification-modal-close"
                onClick={() =>
                  setSelectedNotification(
                    null
                  )
                }
              >
                <X size={18} />
              </button>

            </div>

            <div className="student-notification-modal-body">

              <span className="student-notification-type large">
                {getNotificationTypeLabel(
                  selectedNotification.type
                )}
              </span>

              <h2>
                {selectedNotification.title}
              </h2>

              <p>
                {selectedNotification.message}
              </p>

              <div className="student-notification-modal-meta">

                <span>
                  <Bell size={14} />

                  {formatNotificationTime(
                    selectedNotification.createdAt
                  )}
                </span>

                <span>
                  Priority:{" "}
                  {
                    selectedNotification.priority
                  }
                </span>

              </div>

            </div>

            <div className="student-notification-modal-footer">

              <button
                type="button"
                onClick={() =>
                  setSelectedNotification(
                    null
                  )
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}