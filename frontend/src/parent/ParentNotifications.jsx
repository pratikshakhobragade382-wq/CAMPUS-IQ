import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  BellOff,
  BookOpen,
  CalendarDays,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Loader2,
  Megaphone,
  RefreshCw,
  Trash2,
  UserCheck,
} from "lucide-react";

import {
  deleteAllNotifications,
  deleteNotification,
  getAllNotifications,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../api/notification.api";

import "./ParentNotifications.css";

const PAGE_SIZE = 8;

function getNotificationIcon(type) {
  switch (type) {
    case "assignment":
    case "homework":
    case "activity":
      return ClipboardList;
    case "attendance":
      return UserCheck;
    case "exam":
      return FileText;
    case "timetable":
    case "class":
      return BookOpen;
    case "holiday":
      return CalendarDays;
    case "announcement":
      return Megaphone;
    default:
      return Bell;
  }
}

function getNotificationTypeLabel(type) {
  if (!type) {
    return "General";
  }

  return String(type)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatNotificationTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractNotifications(responseData) {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  if (Array.isArray(responseData?.data?.notifications)) {
    return responseData.data.notifications;
  }

  if (Array.isArray(responseData?.notifications)) {
    return responseData.notifications;
  }

  return [];
}

function normalizeNotification(notification) {
  if (!notification || typeof notification !== "object") {
    return null;
  }

  const isRead =
    notification.isRead === true ||
    notification.read === true ||
    (notification.readAt !== null && notification.readAt !== undefined);

  return {
    ...notification,
    id: notification.id ?? notification._id,
    title: notification.title || "Notification",
    message: notification.message || notification.body || "",
    type: notification.type || "general",
    createdAt:
      notification.createdAt ||
      notification.created_at ||
      notification.date ||
      null,
    isRead,
  };
}

async function fetchParentNotifications() {
  try {
    return await getAllNotifications();
  } catch (allError) {
    logNotificationApiError("GET /notifications/all failed", allError);
    return getNotifications();
  }
}

function logNotificationApiError(action, error) {
  const status = error?.response?.status;
  const data = error?.response?.data;

  console.error("[Parent Notifications]", action, {
    url: error?.config?.url || "(unknown)",
    baseURL: error?.config?.baseURL || "(unknown)",
    method: (error?.config?.method || "").toUpperCase(),
    status: status || "(no HTTP status)",
    responseData: data || null,
    message: data?.error || data?.message || error?.message || "(none)",
    code: data?.code || error?.code || "(none)",
    requestId: data?.requestId || "(none)",
    hasAuthHeader: Boolean(error?.config?.headers?.Authorization),
  });
}

function getErrorMessage(error, fallback) {
  if (!error?.response) {
    if (error?.code === "ERR_NETWORK") {
      return "Unable to reach the notification service. Please check your connection and try again.";
    }

    return fallback;
  }

  const status = error.response.status;
  const data = error.response.data || {};

  if (status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (status === 403) {
    return "You do not have permission to view these notifications.";
  }

  if (status === 404) {
    return "Notification service was not found.";
  }

  /*
   * The backend error handler hides Prisma/server internals behind
   * "Something went wrong". Do not copy that generic 500 text into the page.
   */
  if (status >= 500) {
    return "The notification service could not complete this request. Please try again.";
  }

  if (
    typeof data.error === "string" &&
    data.error &&
    data.error !== "Something went wrong"
  ) {
    return data.error;
  }

  if (typeof data.message === "string" && data.message) {
    return data.message;
  }

  return fallback;
}

export default function ParentNotifications() {
  const [notifications, setNotifications] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    setActionError("");

    try {
      const response = await fetchParentNotifications();
      const list = extractNotifications(response)
        .map(normalizeNotification)
        .filter(Boolean);

      list.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setNotifications(list);
    } catch (err) {
      logNotificationApiError("Failed to fetch parent notifications", err);
      setError(
        getErrorMessage(
          err,
          "Unable to load notifications. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const notificationList = notifications ?? [];
  const hasLoadedNotifications = Array.isArray(notifications);

  const unreadCount = useMemo(
    () =>
      hasLoadedNotifications
        ? notificationList.filter((item) => !item.isRead).length
        : null,
    [hasLoadedNotifications, notificationList]
  );

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notificationList.filter((item) => !item.isRead);
    }

    if (filter === "read") {
      return notificationList.filter((item) => item.isRead);
    }

    return notificationList;
  }, [notificationList, filter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotifications.length / PAGE_SIZE)
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedNotifications = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredNotifications.slice(start, start + PAGE_SIZE);
  }, [filteredNotifications, page]);

  const handleFilterChange = (nextFilter) => {
    setFilter(nextFilter);
    setPage(1);
  };

  const handleMarkAsRead = async (notification) => {
    if (notification.isRead) {
      return;
    }

    setBusyId(notification.id);
    setActionError("");

    try {
      await markNotificationAsRead(notification.id);
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item
        )
      );
    } catch (err) {
      logNotificationApiError("PUT /notifications/:id/read failed", err);
      setActionError(getErrorMessage(err, "Unable to mark this notification as read."));
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!unreadCount) {
      return;
    }

    setMarkingAll(true);
    setActionError("");

    try {
      await markAllNotificationsAsRead();
      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true }))
      );
    } catch (err) {
      logNotificationApiError("PUT /notifications/read-all failed", err);
      setActionError(getErrorMessage(err, "Unable to mark all notifications as read."));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDeleteOne = async (event, notificationId) => {
    event.stopPropagation();

    const confirmed = window.confirm("Delete this notification?");
    if (!confirmed) {
      return;
    }

    setBusyId(notificationId);
    setActionError("");

    try {
      await deleteNotification(notificationId);
      setNotifications((current) =>
        current.filter((item) => item.id !== notificationId)
      );
    } catch (err) {
      logNotificationApiError("DELETE /notifications/:id failed", err);
      setActionError(getErrorMessage(err, "Unable to delete this notification."));
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!hasLoadedNotifications || notificationList.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "Delete all notifications? This cannot be undone."
    );
    if (!confirmed) {
      return;
    }

    setDeletingAll(true);
    setActionError("");

    try {
      await deleteAllNotifications();
      setNotifications([]);
    } catch (err) {
      logNotificationApiError("DELETE /notifications failed", err);
      setActionError(getErrorMessage(err, "Unable to delete all notifications."));
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div className="parent-notifications-page">
      <div className="parent-notifications-topbar">
        <div>
          <h1>Notifications</h1>
          <p>School updates sent to your parent account.</p>
        </div>

        <div className="parent-notifications-count-badge">
          <span className="count-number">
            {hasLoadedNotifications && unreadCount !== null ? unreadCount : "—"}
          </span>
          <span className="count-label">Unread</span>
        </div>
      </div>

      <div className="parent-notifications-toolbar">
        <div className="parent-notifications-filters">
          <button
            type="button"
            className={filter === "all" ? "active" : ""}
            onClick={() => handleFilterChange("all")}
          >
            All
          </button>
          <button
            type="button"
            className={filter === "unread" ? "active" : ""}
            onClick={() => handleFilterChange("unread")}
          >
            Unread
          </button>
          <button
            type="button"
            className={filter === "read" ? "active" : ""}
            onClick={() => handleFilterChange("read")}
          >
            Read
          </button>
        </div>

        <div className="parent-notifications-actions">
          <button
            type="button"
            className="parent-notifications-text-btn"
            onClick={handleMarkAllAsRead}
            disabled={markingAll || !unreadCount}
          >
            {markingAll ? <Loader2 size={15} className="parent-spin" /> : <CheckCheck size={15} />}
            Mark all as read
          </button>

          <button
            type="button"
            className="parent-notifications-text-btn danger"
            onClick={handleDeleteAll}
            disabled={deletingAll || !hasLoadedNotifications || notificationList.length === 0}
          >
            {deletingAll ? <Loader2 size={15} className="parent-spin" /> : <Trash2 size={15} />}
            Delete all
          </button>
        </div>
      </div>

      {actionError && (
        <div className="parent-notifications-banner error" role="status">
          <AlertCircle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {loading && (
        <div className="parent-module-status" aria-busy="true">
          <div className="parent-module-spinner" />
          <p>Loading notifications...</p>
        </div>
      )}

      {!loading && error && (
        <div className="parent-module-status error">
          <div className="parent-module-status-icon error">
            <AlertCircle size={28} />
          </div>
          <h3>Unable to load notifications</h3>
          <p>{error}</p>
          <button type="button" className="parent-notifications-retry-btn" onClick={loadNotifications}>
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      )}

      {!loading && !error && hasLoadedNotifications && filteredNotifications.length === 0 && (
        <div className="parent-module-status">
          <div className="parent-module-status-icon">
            <BellOff size={28} />
          </div>
          <h3>
            {notificationList.length === 0
              ? "No notifications yet"
              : "No notifications in this filter"}
          </h3>
          <p>
            {notificationList.length === 0
              ? "When the school sends an update, it will appear here."
              : "Try a different filter to see more notifications."}
          </p>
        </div>
      )}

      {!loading && !error && hasLoadedNotifications && pagedNotifications.length > 0 && (
        <>
          <div className="parent-notifications-list">
            {pagedNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const isBusy = busyId === notification.id;

              return (
                <article
                  key={notification.id}
                  className={`parent-notification-card ${
                    notification.isRead ? "" : "unread"
                  }`}
                  onClick={() => handleMarkAsRead(notification)}
                >
                  <div className="parent-notification-icon">
                    <Icon size={18} />
                  </div>

                  <div className="parent-notification-content">
                    <div className="parent-notification-top">
                      <h3>{notification.title || "Notification"}</h3>
                      {!notification.isRead && (
                        <span className="parent-notification-unread">Unread</span>
                      )}
                    </div>

                    <p>{notification.message || "No message provided."}</p>

                    <div className="parent-notification-meta">
                      <span>{getNotificationTypeLabel(notification.type)}</span>
                      <span>{formatNotificationTime(notification.createdAt)}</span>
                      {notification.priority && notification.priority !== "normal" && (
                        <span className="parent-notification-priority">
                          {getNotificationTypeLabel(notification.priority)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="parent-notification-delete"
                    aria-label="Delete notification"
                    disabled={isBusy}
                    onClick={(event) => handleDeleteOne(event, notification.id)}
                  >
                    {isBusy ? <Loader2 size={16} className="parent-spin" /> : <Trash2 size={16} />}
                  </button>
                </article>
              );
            })}
          </div>

          {filteredNotifications.length > PAGE_SIZE && (
            <div className="parent-notifications-pagination">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <span>
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
