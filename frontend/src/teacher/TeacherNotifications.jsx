import {
  useCallback,
  useMemo,
  useState,
} from "react";

import "./Notifications.css";

/*
============================================================
TEACHER NOTIFICATIONS
============================================================

This version is frontend-safe.

It does NOT require:
- TeacherTopbar.jsx
- createNotification()
- notification API
- backend notification routes

You can connect the backend later.
============================================================
*/

/* ============================================================
   SAMPLE RECEIVED NOTIFICATIONS
============================================================ */

const INITIAL_RECEIVED_NOTIFICATIONS = [
  {
    id: 1,
    title: "New Student Added",
    message:
      "A new student, Aarav Sharma, has been added to Computer Science - Section A.",
    type: "student",
    sender: "Admin",
    senderRole: "Administrator",
    time: "10 minutes ago",
    date: "Today",
    read: false,
    important: true,
    system: true,
  },
  {
    id: 2,
    title: "New School Activity",
    message:
      "Annual Sports Day has been scheduled for 15 September 2026.",
    type: "activity",
    sender: "School Administration",
    senderRole: "Management",
    time: "1 hour ago",
    date: "Today",
    read: false,
    important: true,
    system: true,
  },
  {
    id: 3,
    title: "Section Assignment Updated",
    message:
      "You have been assigned as the teacher for Computer Science - Section B.",
    type: "class",
    sender: "Academic Department",
    senderRole: "Admin",
    time: "Yesterday",
    date: "Yesterday",
    read: true,
    important: false,
    system: true,
  },
  {
    id: 4,
    title: "Staff Meeting",
    message:
      "A staff meeting will be held tomorrow at 11:00 AM in the conference room.",
    type: "meeting",
    sender: "Principal",
    senderRole: "Principal",
    time: "Yesterday",
    date: "Yesterday",
    read: true,
    important: false,
    system: false,
  },
  {
    id: 5,
    title: "Exam Schedule Updated",
    message:
      "The internal examination schedule has been updated. Please check the examination module.",
    type: "exam",
    sender: "Examination Department",
    senderRole: "Admin",
    time: "2 days ago",
    date: "2 days ago",
    read: true,
    important: false,
    system: true,
  },
];

/* ============================================================
   SAMPLE SENT NOTIFICATIONS
============================================================ */

const INITIAL_SENT_NOTIFICATIONS = [
  {
    id: 101,
    title: "Homework Reminder",
    message:
      "Please complete Chapter 4 exercises before Friday.",
    type: "homework",
    recipient: "Parents",
    target: "Computer Science - Section A",
    time: "Today, 9:30 AM",
    status: "Delivered",
    important: false,
  },
  {
    id: 102,
    title: "Parent Meeting",
    message:
      "Parent-teacher meeting will be conducted this Saturday.",
    type: "meeting",
    recipient: "Parents",
    target: "Computer Science - Section A",
    time: "Yesterday, 4:15 PM",
    status: "Delivered",
    important: true,
  },
  {
    id: 103,
    title: "Assignment Submission",
    message:
      "Students are requested to submit the DBMS assignment by Monday.",
    type: "announcement",
    recipient: "Students",
    target: "Computer Science - Section B",
    time: "2 days ago",
    status: "Delivered",
    important: false,
  },
];

/* ============================================================
   ICON HELPER
============================================================ */

function getNotificationIcon(type) {
  switch (type) {
    case "student":
      return "fa-solid fa-user-plus";

    case "activity":
      return "fa-solid fa-calendar-check";

    case "class":
      return "fa-solid fa-chalkboard";

    case "homework":
      return "fa-solid fa-book-open";

    case "attendance":
      return "fa-solid fa-user-check";

    case "exam":
      return "fa-solid fa-file-lines";

    case "meeting":
      return "fa-solid fa-users";

    case "announcement":
      return "fa-solid fa-bullhorn";

    default:
      return "fa-solid fa-bell";
  }
}

/* ============================================================
   TYPE LABEL
============================================================ */

function getNotificationTypeLabel(type) {
  switch (type) {
    case "student":
      return "Student Update";

    case "activity":
      return "Activity";

    case "class":
      return "Class Update";

    case "homework":
      return "Homework";

    case "attendance":
      return "Attendance";

    case "exam":
      return "Exam";

    case "meeting":
      return "Meeting";

    case "announcement":
      return "Announcement";

    default:
      return "General";
  }
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function TeacherNotifications() {
  const [activeTab, setActiveTab] = useState("received");

  const [receivedNotifications, setReceivedNotifications] =
    useState(INITIAL_RECEIVED_NOTIFICATIONS);

  const [sentNotifications, setSentNotifications] =
    useState(INITIAL_SENT_NOTIFICATIONS);

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState("all");

  const [showCompose, setShowCompose] = useState(false);

  const [selectedNotification, setSelectedNotification] =
    useState(null);

  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "announcement",
    recipient: "Parents",
    className: "",
    section: "",
    important: false,
  });

  /* ============================================================
     RESET FORM
  ============================================================ */

  const resetForm = useCallback(() => {
    setForm({
      title: "",
      message: "",
      type: "announcement",
      recipient: "Parents",
      className: "",
      section: "",
      important: false,
    });
  }, []);

  /* ============================================================
     COUNTS
  ============================================================ */

  const unreadCount = useMemo(() => {
    return receivedNotifications.filter(
      (notification) => !notification.read
    ).length;
  }, [receivedNotifications]);

  const importantCount = useMemo(() => {
    return receivedNotifications.filter(
      (notification) => notification.important
    ).length;
  }, [receivedNotifications]);

  const sentCount = sentNotifications.length;

  /* ============================================================
     FILTER RECEIVED
  ============================================================ */

  const filteredReceived = useMemo(() => {
    const value = search.trim().toLowerCase();

    return receivedNotifications.filter((notification) => {
      const searchableText = [
        notification.title,
        notification.message,
        notification.sender,
        notification.senderRole,
        notification.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !value || searchableText.includes(value);

      let matchesFilter = true;

      if (filter === "unread") {
        matchesFilter = !notification.read;
      }

      if (filter === "important") {
        matchesFilter = notification.important;
      }

      if (filter === "system") {
        matchesFilter = notification.system;
      }

      if (filter === "messages") {
        matchesFilter = !notification.system;
      }

      return matchesSearch && matchesFilter;
    });
  }, [
    receivedNotifications,
    search,
    filter,
  ]);

  /* ============================================================
     FILTER SENT
  ============================================================ */

  const filteredSent = useMemo(() => {
    const value = search.trim().toLowerCase();

    return sentNotifications.filter((notification) => {
      const searchableText = [
        notification.title,
        notification.message,
        notification.recipient,
        notification.target,
        notification.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !value || searchableText.includes(value);

      const matchesFilter =
        filter === "all" ||
        (filter === "important" &&
          notification.important);

      return matchesSearch && matchesFilter;
    });
  }, [
    sentNotifications,
    search,
    filter,
  ]);

  /* ============================================================
     MARK AS READ
  ============================================================ */

  const markAsRead = (id) => {
    setReceivedNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: true,
            }
          : notification
      )
    );
  };

  /* ============================================================
     MARK ALL AS READ
  ============================================================ */

  const markAllAsRead = () => {
    setReceivedNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  /* ============================================================
     TOGGLE IMPORTANT
  ============================================================ */

  const toggleImportant = (id) => {
    setReceivedNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              important: !notification.important,
            }
          : notification
      )
    );
  };

  /* ============================================================
     DELETE
  ============================================================ */

  const deleteNotification = (id) => {
    setReceivedNotifications((current) =>
      current.filter(
        (notification) => notification.id !== id
      )
    );

    if (selectedNotification?.id === id) {
      setSelectedNotification(null);
    }
  };

  /* ============================================================
     OPEN NOTIFICATION
  ============================================================ */

  const openNotification = (notification) => {
    markAsRead(notification.id);
    setSelectedNotification(notification);
  };

  /* ============================================================
     SEND NOTIFICATION
  ============================================================ */

  const handleSendNotification = async (event) => {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.message.trim()
    ) {
      return;
    }

    try {
      setSending(true);

      /*
       * IMPORTANT:
       *
       * We are NOT calling createNotification()
       * here because that function/file does not exist yet.
       *
       * This currently saves the notification
       * in frontend state so you can test the UI.
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

      const target = form.className
        ? `${form.className}${
            form.section
              ? ` - Section ${form.section}`
              : ""
          }`
        : form.recipient;

      const newNotification = {
        id: Date.now(),
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        recipient: form.recipient,
        target,
        time: "Just now",
        status: "Delivered",
        important: form.important,
      };

      setSentNotifications((current) => [
        newNotification,
        ...current,
      ]);

      resetForm();

      setShowCompose(false);

      setActiveTab("sent");
    } catch (error) {
      console.error(
        "Failed to send notification:",
        error
      );
    } finally {
      setSending(false);
    }
  };

  /* ============================================================
     OPEN COMPOSE
  ============================================================ */

  const openCompose = () => {
    resetForm();
    setShowCompose(true);
  };

  /* ============================================================
     CLOSE MODALS
  ============================================================ */

  const closeCompose = () => {
    if (!sending) {
      setShowCompose(false);
    }
  };

  const closeNotification = () => {
    setSelectedNotification(null);
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="teacher-panel">

      {/* ======================================================
          TOPBAR
      ====================================================== */}

      <header className="teacher-notification-topbar">

        <div className="teacher-topbar-title">
          <h2>Teacher Portal</h2>
          <span>Notifications</span>
        </div>

        <div className="teacher-topbar-search">

          <i className="fa-solid fa-magnifying-glass"></i>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search notifications..."
          />

        </div>

        <div className="teacher-topbar-actions">

          <button
            type="button"
            title="Notifications"
          >
            <i className="fa-solid fa-bell"></i>

            {unreadCount > 0 && (
              <span className="teacher-notification-count">
                {unreadCount}
              </span>
            )}

          </button>

          <div className="teacher-avatar">
            T
          </div>

        </div>

      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="teacher-main-content notifications-page">

        {/* HEADER */}

        <section className="notifications-heading">

          <div>

            <span className="notifications-eyebrow">
              TEACHER PORTAL
            </span>

            <h1>
              Notifications
            </h1>

            <p>
              Send announcements, receive school
              updates and stay connected with
              students, parents and administration.
            </p>

          </div>

          <button
            type="button"
            className="compose-notification-button"
            onClick={openCompose}
          >
            <i className="fa-solid fa-pen-to-square"></i>
            New Notification
          </button>

        </section>

        {/* ====================================================
            STATISTICS
        ==================================================== */}

        <section className="notification-stat-grid">

          <div className="notification-stat-card">

            <div className="notification-stat-icon blue">
              <i className="fa-solid fa-bell"></i>
            </div>

            <div>
              <strong>
                {receivedNotifications.length}
              </strong>

              <span>
                Total Notifications
              </span>
            </div>

          </div>

          <div className="notification-stat-card">

            <div className="notification-stat-icon red">
              <i className="fa-solid fa-envelope"></i>
            </div>

            <div>
              <strong>
                {unreadCount}
              </strong>

              <span>
                Unread
              </span>
            </div>

          </div>

          <div className="notification-stat-card">

            <div className="notification-stat-icon yellow">
              <i className="fa-solid fa-star"></i>
            </div>

            <div>
              <strong>
                {importantCount}
              </strong>

              <span>
                Important
              </span>
            </div>

          </div>

          <div className="notification-stat-card">

            <div className="notification-stat-icon green">
              <i className="fa-solid fa-paper-plane"></i>
            </div>

            <div>
              <strong>
                {sentCount}
              </strong>

              <span>
                Sent By You
              </span>
            </div>

          </div>

        </section>

        {/* ====================================================
            WORKSPACE
        ==================================================== */}

        <section className="notification-workspace">

          {/* TABS */}

          <div className="notification-tabs">

            <button
              type="button"
              className={
                activeTab === "received"
                  ? "notification-tab active"
                  : "notification-tab"
              }
              onClick={() =>
                setActiveTab("received")
              }
            >

              <i className="fa-solid fa-inbox"></i>

              Received

              {unreadCount > 0 && (
                <span className="notification-tab-count">
                  {unreadCount}
                </span>
              )}

            </button>

            <button
              type="button"
              className={
                activeTab === "sent"
                  ? "notification-tab active"
                  : "notification-tab"
              }
              onClick={() =>
                setActiveTab("sent")
              }
            >

              <i className="fa-solid fa-paper-plane"></i>

              Sent

            </button>

          </div>

          {/* TOOLBAR */}

          <div className="notification-toolbar">

            <div className="notification-toolbar-search">

              <i className="fa-solid fa-magnifying-glass"></i>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder={
                  activeTab === "received"
                    ? "Search received notifications..."
                    : "Search sent notifications..."
                }
              />

            </div>

            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value)
              }
            >

              <option value="all">
                All Notifications
              </option>

              {activeTab === "received" && (
                <>
                  <option value="unread">
                    Unread
                  </option>

                  <option value="important">
                    Important
                  </option>

                  <option value="system">
                    System Updates
                  </option>

                  <option value="messages">
                    Messages
                  </option>
                </>
              )}

              {activeTab === "sent" && (
                <option value="important">
                  Important
                </option>
              )}

            </select>

            {activeTab === "received" && (
              <button
                type="button"
                className="mark-all-read-button"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <i className="fa-solid fa-check-double"></i>
                Mark All Read
              </button>
            )}

          </div>

          {/* ====================================================
              RECEIVED NOTIFICATIONS
          ==================================================== */}

          {activeTab === "received" && (
            <div className="notification-list">

              {filteredReceived.length === 0 ? (

                <div className="notification-empty">

                  <div className="notification-empty-icon">
                    <i className="fa-solid fa-bell-slash"></i>
                  </div>

                  <h3>
                    No Notifications Found
                  </h3>

                  <p>
                    There are no notifications
                    matching your current search
                    or filter.
                  </p>

                </div>

              ) : (

                filteredReceived.map(
                  (notification) => (

                    <article
                      className={
                        notification.read
                          ? "notification-card"
                          : "notification-card unread"
                      }
                      key={notification.id}
                    >

                      <div
                        className={
                          `notification-type-icon ${notification.type}`
                        }
                      >

                        <i
                          className={getNotificationIcon(
                            notification.type
                          )}
                        ></i>

                      </div>

                      <div className="notification-card-content">

                        <div className="notification-card-top">

                          <div>

                            <div className="notification-card-title-row">

                              <h3>
                                {notification.title}
                              </h3>

                              {!notification.read && (
                                <span className="unread-dot"></span>
                              )}

                              {notification.important && (
                                <span className="important-label">

                                  <i className="fa-solid fa-star"></i>

                                  Important

                                </span>
                              )}

                            </div>

                            <div className="notification-meta">

                              <span>
                                <i className="fa-solid fa-user"></i>
                                {notification.sender}
                              </span>

                              <span>
                                {notification.senderRole}
                              </span>

                              <span>
                                <i className="fa-regular fa-clock"></i>
                                {notification.time}
                              </span>

                            </div>

                          </div>

                          <div className="notification-card-menu">

                            <button
                              type="button"
                              title="Mark important"
                              onClick={() =>
                                toggleImportant(
                                  notification.id
                                )
                              }
                            >

                              <i
                                className={
                                  notification.important
                                    ? "fa-solid fa-star"
                                    : "fa-regular fa-star"
                                }
                              ></i>

                            </button>

                            <button
                              type="button"
                              title="Delete"
                              onClick={() =>
                                deleteNotification(
                                  notification.id
                                )
                              }
                            >

                              <i className="fa-solid fa-trash"></i>

                            </button>

                          </div>

                        </div>

                        <p className="notification-message-preview">
                          {notification.message}
                        </p>

                        <div className="notification-card-footer">

                          <span
                            className={
                              `notification-type-badge ${notification.type}`
                            }
                          >
                            {getNotificationTypeLabel(
                              notification.type
                            )}
                          </span>

                          {notification.system && (
                            <span className="system-badge">

                              <i className="fa-solid fa-gear"></i>

                              System Update

                            </span>
                          )}

                          <button
                            type="button"
                            className="read-notification-button"
                            onClick={() =>
                              openNotification(
                                notification
                              )
                            }
                          >

                            View Notification

                            <i className="fa-solid fa-arrow-right"></i>

                          </button>

                        </div>

                      </div>

                    </article>

                  )
                )

              )}

            </div>
          )}

          {/* ====================================================
              SENT NOTIFICATIONS
          ==================================================== */}

          {activeTab === "sent" && (
            <div className="notification-list">

              {filteredSent.length === 0 ? (

                <div className="notification-empty">

                  <div className="notification-empty-icon">
                    <i className="fa-solid fa-paper-plane"></i>
                  </div>

                  <h3>
                    No Sent Notifications
                  </h3>

                  <p>
                    You haven't sent any
                    notifications yet.
                  </p>

                  <button
                    type="button"
                    className="empty-compose-button"
                    onClick={openCompose}
                  >

                    <i className="fa-solid fa-plus"></i>

                    Send Notification

                  </button>

                </div>

              ) : (

                filteredSent.map(
                  (notification) => (

                    <article
                      className="notification-card sent-card"
                      key={notification.id}
                    >

                      <div
                        className={
                          `notification-type-icon ${notification.type}`
                        }
                      >

                        <i
                          className={getNotificationIcon(
                            notification.type
                          )}
                        ></i>

                      </div>

                      <div className="notification-card-content">

                        <div className="notification-card-top">

                          <div>

                            <div className="notification-card-title-row">

                              <h3>
                                {notification.title}
                              </h3>

                              {notification.important && (
                                <span className="important-label">

                                  <i className="fa-solid fa-star"></i>

                                  Important

                                </span>
                              )}

                            </div>

                            <div className="notification-meta">

                              <span>

                                <i className="fa-solid fa-paper-plane"></i>

                                To:{" "}
                                {notification.recipient}

                              </span>

                              <span>
                                {notification.target}
                              </span>

                              <span>

                                <i className="fa-regular fa-clock"></i>

                                {notification.time}

                              </span>

                            </div>

                          </div>

                          <span className="delivered-badge">

                            <i className="fa-solid fa-check-double"></i>

                            {notification.status}

                          </span>

                        </div>

                        <p className="notification-message-preview">
                          {notification.message}
                        </p>

                        <div className="notification-card-footer">

                          <span
                            className={
                              `notification-type-badge ${notification.type}`
                            }
                          >
                            {getNotificationTypeLabel(
                              notification.type
                            )}
                          </span>

                        </div>

                      </div>

                    </article>

                  )
                )

              )}

            </div>
          )}

        </section>

      </main>

      {/* ======================================================
          COMPOSE MODAL
      ====================================================== */}

      {showCompose && (

        <div
          className="notification-modal-overlay"
          onMouseDown={closeCompose}
        >

          <div
            className="notification-compose-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="notification-modal-header">

              <div>

                <span>
                  TEACHER PORTAL
                </span>

                <h2>
                  Send Notification
                </h2>

                <p>
                  Communicate important
                  information to parents,
                  students or administration.
                </p>

              </div>

              <button
                type="button"
                onClick={closeCompose}
                disabled={sending}
              >

                <i className="fa-solid fa-xmark"></i>

              </button>

            </div>

            <form
              className="notification-compose-body"
              onSubmit={handleSendNotification}
            >

              {/* TITLE */}

              <div className="notification-form-field">

                <label>
                  Notification Title
                  <span>*</span>
                </label>

                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Example: Homework Reminder"
                  maxLength={100}
                  required
                />

              </div>

              {/* TYPE AND RECIPIENT */}

              <div className="notification-form-row">

                <div className="notification-form-field">

                  <label>
                    Notification Type
                  </label>

                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        type: event.target.value,
                      }))
                    }
                  >

                    <option value="announcement">
                      Announcement
                    </option>

                    <option value="homework">
                      Homework
                    </option>

                    <option value="attendance">
                      Attendance
                    </option>

                    <option value="exam">
                      Exam
                    </option>

                    <option value="activity">
                      Activity
                    </option>

                    <option value="meeting">
                      Meeting
                    </option>

                    <option value="class">
                      Class Update
                    </option>

                    <option value="general">
                      General
                    </option>

                  </select>

                </div>

                <div className="notification-form-field">

                  <label>
                    Send To
                  </label>

                  <select
                    value={form.recipient}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        recipient: event.target.value,
                      }))
                    }
                  >

                    <option value="Parents">
                      Parents
                    </option>

                    <option value="Students">
                      Students
                    </option>

                    <option value="Admin">
                      Admin
                    </option>

                    <option value="Management">
                      Management
                    </option>

                    <option value="Principal">
                      Principal
                    </option>

                  </select>

                </div>

              </div>

              {/* CLASS AND SECTION */}

              <div className="notification-form-row">

                <div className="notification-form-field">

                  <label>
                    Class
                    <small>
                      Optional
                    </small>
                  </label>

                  <input
                    type="text"
                    value={form.className}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        className:
                          event.target.value,
                      }))
                    }
                    placeholder="Example: Computer Science"
                  />

                </div>

                <div className="notification-form-field">

                  <label>
                    Section
                    <small>
                      Optional
                    </small>
                  </label>

                  <input
                    type="text"
                    value={form.section}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        section:
                          event.target.value,
                      }))
                    }
                    placeholder="Example: A"
                  />

                </div>

              </div>

              {/* MESSAGE */}

              <div className="notification-form-field">

                <label>
                  Message
                  <span>*</span>
                </label>

                <textarea
                  value={form.message}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      message:
                        event.target.value,
                    }))
                  }
                  placeholder="Write your notification message here..."
                  rows={6}
                  maxLength={1000}
                  required
                />

                <div className="notification-character-count">
                  {form.message.length} / 1000
                </div>

              </div>

              {/* IMPORTANT */}

              <label className="important-checkbox">

                <input
                  type="checkbox"
                  checked={form.important}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      important:
                        event.target.checked,
                    }))
                  }
                />

                <span className="custom-checkbox">
                  <i className="fa-solid fa-check"></i>
                </span>

                <div>

                  <strong>
                    Mark as Important
                  </strong>

                  <small>
                    The recipient will see
                    this notification as
                    important.
                  </small>

                </div>

              </label>

              {/* INFO */}

              <div className="notification-compose-info">

                <i className="fa-solid fa-circle-info"></i>

                <div>

                  <strong>
                    Who will receive this?
                  </strong>

                  <p>

                    This notification will
                    be sent to{" "}

                    <b>
                      {form.recipient}
                    </b>

                    {form.className && (
                      <>
                        {" "}for{" "}

                        <b>
                          {form.className}

                          {form.section
                            ? ` - Section ${form.section}`
                            : ""}
                        </b>
                      </>
                    )}

                    .

                  </p>

                </div>

              </div>

              {/* FOOTER */}

              <div className="notification-modal-footer">

                <button
                  type="button"
                  className="notification-cancel-button"
                  onClick={closeCompose}
                  disabled={sending}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="notification-send-button"
                  disabled={
                    sending ||
                    !form.title.trim() ||
                    !form.message.trim()
                  }
                >

                  {sending ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane"></i>
                      Send Notification
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ======================================================
          VIEW NOTIFICATION MODAL
      ====================================================== */}

      {selectedNotification && (

        <div
          className="notification-modal-overlay"
          onMouseDown={closeNotification}
        >

          <div
            className="notification-view-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="notification-view-header">

              <div
                className={
                  `notification-view-icon ${selectedNotification.type}`
                }
              >

                <i
                  className={getNotificationIcon(
                    selectedNotification.type
                  )}
                ></i>

              </div>

              <div>

                <span>
                  {getNotificationTypeLabel(
                    selectedNotification.type
                  )}
                </span>

                <h2>
                  {selectedNotification.title}
                </h2>

              </div>

              <button
                type="button"
                onClick={closeNotification}
              >

                <i className="fa-solid fa-xmark"></i>

              </button>

            </div>

            <div className="notification-view-body">

              <div className="notification-view-meta">

                <div>

                  <span>
                    From
                  </span>

                  <strong>
                    {selectedNotification.sender}
                  </strong>

                </div>

                <div>

                  <span>
                    Role
                  </span>

                  <strong>
                    {selectedNotification.senderRole}
                  </strong>

                </div>

                <div>

                  <span>
                    Received
                  </span>

                  <strong>
                    {selectedNotification.time}
                  </strong>

                </div>

              </div>

              {selectedNotification.important && (

                <div className="notification-important-box">

                  <i className="fa-solid fa-star"></i>

                  <span>
                    This is an important
                    notification.
                  </span>

                </div>

              )}

              <div className="notification-full-message">

                <h4>
                  Message
                </h4>

                <p>
                  {selectedNotification.message}
                </p>

              </div>

            </div>

            <div className="notification-view-footer">

              <button
                type="button"
                className="notification-cancel-button"
                onClick={closeNotification}
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