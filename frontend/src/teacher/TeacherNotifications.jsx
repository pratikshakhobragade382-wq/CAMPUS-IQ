import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import axiosClient from "../api/axios";
import {
  getClasses,
  getClassSections,
} from "../api/class.api";

import "./Notifications.css";

// ============================================================
// NOTIFICATION ICON
// ============================================================

function getNotificationIcon(type) {
  switch (type) {
    case "student":
    case "new_student":
      return "fa-solid fa-user-plus";

    case "teacher":
    case "new_teacher":
      return "fa-solid fa-chalkboard-user";

    case "activity":
    case "assignment":
      return "fa-solid fa-calendar-check";

    case "class":
    case "timetable":
      return "fa-solid fa-chalkboard";

    case "homework":
      return "fa-solid fa-book-open";

    case "attendance":
      return "fa-solid fa-user-check";

    case "exam":
      return "fa-solid fa-file-lines";

    case "meeting":
    case "parent_meeting":
      return "fa-solid fa-users";

    case "announcement":
      return "fa-solid fa-bullhorn";

    case "section":
      return "fa-solid fa-layer-group";

    default:
      return "fa-solid fa-bell";
  }
}

// ============================================================
// NOTIFICATION TYPE LABEL
// ============================================================

function getNotificationTypeLabel(type) {
  switch (type) {
    case "student":
    case "new_student":
      return "Student Update";

    case "teacher":
    case "new_teacher":
      return "Teacher Update";

    case "activity":
    case "assignment":
      return "Activity";

    case "class":
    case "timetable":
      return "Class Update";

    case "homework":
      return "Homework";

    case "attendance":
      return "Attendance";

    case "exam":
      return "Exam";

    case "meeting":
    case "parent_meeting":
      return "Meeting";

    case "section":
      return "Section Update";

    case "announcement":
      return "Announcement";

    default:
      return "General";
  }
}

// ============================================================
// TIME FORMAT
// ============================================================

function formatNotificationTime(value) {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
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

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

// ============================================================
// NORMALIZE NOTIFICATION
// ============================================================

function normalizeNotification(notification) {
  if (!notification) {
    return null;
  }

  // ==========================================================
  // AUTOMATIC TEACHER NOTIFICATIONS
  // ==========================================================
  //
  // These notifications are created when a teacher creates
  // an assignment or timetable.
  //
  // They should show:
  //
  // Teacher
  //
  // instead of:
  //
  // Admin
  //
  // ==========================================================

  const isTeacherCreatedNotification =
    notification.type === "assignment" ||
    notification.type === "timetable" ||
    notification.title === "Assignment Created" ||
    notification.title === "Assignment Updated" ||
    notification.title === "Assignment Removed" ||
    notification.title === "Timetable Created" ||
    notification.title === "Timetable Updated" ||
    notification.title === "Timetable Removed";

  // ==========================================================
  // SENDER
  // ==========================================================

  const sender =
    isTeacherCreatedNotification
      ? "Teacher"
      : typeof notification.sender === "object"
        ? (
            notification.sender?.name ||
            notification.sender?.fullName ||
            notification.sender?.username ||
            notification.sender?.email ||
            "Admin"
          )
        : (
            notification.sender ||
            notification.senderName ||
            "Admin"
          );

  // ==========================================================
  // SENDER ROLE
  // ==========================================================

  const senderRole =
    isTeacherCreatedNotification
      ? "Teacher"
      : typeof notification.sender === "object"
        ? (
            notification.sender?.role ||
            notification.senderRole ||
            "Administrator"
          )
        : (
            notification.senderRole ||
            notification.sender_role ||
            "Administrator"
          );

  // ==========================================================
  // CREATED DATE
  // ==========================================================

  const createdAt =
    notification.createdAt ||
    notification.created_at ||
    notification.date ||
    notification.timestamp;

  // ==========================================================
  // IMPORTANT
  // ==========================================================

  const important =
    notification.important === true ||
    notification.priority === "high" ||
    notification.priority === "HIGH" ||
    notification.priority === "important";

  // ==========================================================
  // READ
  // ==========================================================

  const read =
    notification.read === true ||
    notification.isRead === true ||
    (
      notification.readAt !== null &&
      notification.readAt !== undefined
    );

  // ==========================================================
  // RETURN NORMALIZED OBJECT
  // ==========================================================

  return {
    ...notification,

    id:
      notification.id ||
      notification._id ||
      `${Date.now()}-${Math.random()}`,

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

    sender,

    senderRole,

    time:
      notification.time ||
      formatNotificationTime(createdAt),

    important,

    read,

    system:
      notification.system === true ||
      notification.isSystem === true,

    audience:
      notification.audience ||
      notification.recipientType ||
      notification.recipient_type ||
      null,

    createdAt,
  };
}

// ============================================================
// EXTRACT NOTIFICATIONS
// ============================================================

function extractNotifications(responseData) {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (
    Array.isArray(
      responseData?.data
    )
  ) {
    return responseData.data;
  }

  if (
    Array.isArray(
      responseData?.data?.notifications
    )
  ) {
    return responseData.data.notifications;
  }

  if (
    Array.isArray(
      responseData?.notifications
    )
  ) {
    return responseData.notifications;
  }

  if (
    Array.isArray(
      responseData?.results
    )
  ) {
    return responseData.results;
  }

  return [];
}

// ============================================================
// EXTRACT ARRAY
// ============================================================

function extractArray(responseData) {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (
    Array.isArray(
      responseData?.data
    )
  ) {
    return responseData.data;
  }

  return [];
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function TeacherNotifications() {
  // ==========================================================
  // TABS
  // ==========================================================

  const [
    activeTab,
    setActiveTab,
  ] = useState("received");

  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================

  const [
    receivedNotifications,
    setReceivedNotifications,
  ] = useState([]);

  const [
    sentNotifications,
    setSentNotifications,
  ] = useState([]);

  const [
    loadingNotifications,
    setLoadingNotifications,
  ] = useState(true);

  // ==========================================================
  // SEARCH / FILTER
  // ==========================================================

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState("all");

  // ==========================================================
  // MODALS
  // ==========================================================

  const [
    showCompose,
    setShowCompose,
  ] = useState(false);

  const [
    selectedNotification,
    setSelectedNotification,
  ] = useState(null);

  const [
    sending,
    setSending,
  ] = useState(false);

  // ==========================================================
  // CLASSES
  // ==========================================================

  const [
    classes,
    setClasses,
  ] = useState([]);

  const [
    sections,
    setSections,
  ] = useState([]);

  const [
    loadingClasses,
    setLoadingClasses,
  ] = useState(false);

  const [
    loadingSections,
    setLoadingSections,
  ] = useState(false);

  // ==========================================================
  // FORM
  // ==========================================================

  const [
    form,
    setForm,
  ] = useState({
    title: "",
    message: "",
    type: "announcement",
    audience: "student",
    classId: "",
    sectionId: "",
    important: false,
  });

  // ==========================================================
  // LOAD CLASSES
  // ==========================================================

  const loadClasses =
    useCallback(async () => {
      try {
        setLoadingClasses(true);

        const response =
          await getClasses();

        const classList =
          extractArray(response);

        setClasses(classList);
      } catch (error) {
        console.error(
          "Failed to load classes:",
          error
        );

        setClasses([]);
      } finally {
        setLoadingClasses(false);
      }
    }, []);

  // ==========================================================
  // LOAD SECTIONS
  // ==========================================================

  useEffect(() => {
    const loadSections =
      async () => {
        if (!form.classId) {
          setSections([]);
          return;
        }

        try {
          setLoadingSections(true);

          const response =
            await getClassSections(
              form.classId
            );

          const sectionList =
            extractArray(response);

          setSections(sectionList);
        } catch (error) {
          console.error(
            "Failed to load sections:",
            error
          );

          setSections([]);
        } finally {
          setLoadingSections(false);
        }
      };

    loadSections();
  }, [form.classId]);

  // ==========================================================
  // LOAD CLASSES WHEN MODAL OPENS
  // ==========================================================

  useEffect(() => {
    if (showCompose) {
      loadClasses();
    }
  }, [
    showCompose,
    loadClasses,
  ]);

  // ==========================================================
  // LOAD RECEIVED NOTIFICATIONS
  // ==========================================================

  const loadReceivedNotifications =
    useCallback(async () => {
      try {
        setLoadingNotifications(true);

        const response =
          await axiosClient.get(
            "/notifications"
          );

        const rawNotifications =
          extractNotifications(
            response.data
          );

        const normalizedNotifications =
          rawNotifications
            .map(
              normalizeNotification
            )
            .filter(Boolean);

        normalizedNotifications.sort(
          (a, b) => {
            const dateA =
              new Date(
                a.createdAt || 0
              ).getTime();

            const dateB =
              new Date(
                b.createdAt || 0
              ).getTime();

            return dateB - dateA;
          }
        );

        setReceivedNotifications(
          normalizedNotifications
        );
      } catch (error) {
        console.error(
          "Failed to load notifications:",
          error
        );
      } finally {
        setLoadingNotifications(false);
      }
    }, []);

  // ==========================================================
  // AUTO REFRESH NOTIFICATIONS
  // ==========================================================

  useEffect(() => {
    loadReceivedNotifications();

    const interval =
      setInterval(
        loadReceivedNotifications,
        15000
      );

    const handleFocus =
      () => {
        loadReceivedNotifications();
      };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      clearInterval(interval);

      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [
    loadReceivedNotifications,
  ]);

  // ==========================================================
  // COUNTS
  // ==========================================================

  const unreadCount =
    useMemo(
      () =>
        receivedNotifications.filter(
          (notification) =>
            !notification.read
        ).length,
      [
        receivedNotifications,
      ]
    );

  const importantCount =
    useMemo(
      () =>
        receivedNotifications.filter(
          (notification) =>
            notification.important
        ).length,
      [
        receivedNotifications,
      ]
    );

  const sentCount =
    sentNotifications.length;

  // ==========================================================
  // FILTER RECEIVED
  // ==========================================================

  const filteredReceived =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      return receivedNotifications.filter(
        (notification) => {
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
            !value ||
            searchableText.includes(
              value
            );

          let matchesFilter =
            true;

          if (
            filter === "unread"
          ) {
            matchesFilter =
              !notification.read;
          }

          if (
            filter === "important"
          ) {
            matchesFilter =
              notification.important;
          }

          if (
            filter === "messages"
          ) {
            matchesFilter =
              !notification.system;
          }

          return (
            matchesSearch &&
            matchesFilter
          );
        }
      );
    }, [
      receivedNotifications,
      search,
      filter,
    ]);

  // ==========================================================
  // FILTER SENT
  // ==========================================================

  const filteredSent =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      return sentNotifications.filter(
        (notification) => {
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
            !value ||
            searchableText.includes(
              value
            );

          const matchesFilter =
            filter === "all" ||
            (
              filter === "important" &&
              notification.important
            );

          return (
            matchesSearch &&
            matchesFilter
          );
        }
      );
    }, [
      sentNotifications,
      search,
      filter,
    ]);

  // ==========================================================
  // RESET FORM
  // ==========================================================

  const resetForm =
    () => {
      setForm({
        title: "",
        message: "",
        type: "announcement",
        audience: "student",
        classId: "",
        sectionId: "",
        important: false,
      });

      setSections([]);
    };

  // ==========================================================
  // MARK AS READ
  // ==========================================================

  const markAsRead =
    async (id) => {
      try {
        await axiosClient.put(
          `/notifications/${id}/read`
        );
      } catch (error) {
        console.error(
          "Mark as read failed:",
          error
        );
      }

      setReceivedNotifications(
        (current) =>
          current.map(
            (notification) =>
              notification.id === id
                ? {
                    ...notification,
                    read: true,
                  }
                : notification
          )
      );
    };

  // ==========================================================
  // MARK ALL AS READ
  // ==========================================================

  const markAllAsRead =
    async () => {
      if (unreadCount === 0) {
        return;
      }

      try {
        await axiosClient.put(
          "/notifications/read-all"
        );
      } catch (error) {
        console.error(
          "Mark all as read failed:",
          error
        );
      }

      setReceivedNotifications(
        (current) =>
          current.map(
            (notification) => ({
              ...notification,
              read: true,
            })
          )
      );
    };

  // ==========================================================
  // DELETE NOTIFICATION
  // ==========================================================

  const deleteNotification =
    async (id) => {
      try {
        await axiosClient.delete(
          `/notifications/${id}`
        );
      } catch (error) {
        console.error(
          "Delete notification failed:",
          error
        );
      }

      setReceivedNotifications(
        (current) =>
          current.filter(
            (notification) =>
              notification.id !== id
          )
      );

      if (
        selectedNotification?.id ===
        id
      ) {
        setSelectedNotification(
          null
        );
      }
    };

  // ==========================================================
  // OPEN NOTIFICATION
  // ==========================================================

  const openNotification =
    (notification) => {
      markAsRead(
        notification.id
      );

      setSelectedNotification({
        ...notification,
        read: true,
      });
    };

  // ==========================================================
  // SEND NOTIFICATION
  // ==========================================================

  const handleSendNotification =
    async (event) => {
      event.preventDefault();

      if (!form.title.trim()) {
        alert(
          "Please enter notification title."
        );
        return;
      }

      if (!form.message.trim()) {
        alert(
          "Please enter notification message."
        );
        return;
      }

      const allowedAudiences = [
        "admin",
        "parent",
        "student",
      ];

      if (
        !allowedAudiences.includes(
          form.audience
        )
      ) {
        alert(
          "Please select a valid notification recipient."
        );
        return;
      }

      if (
        form.audience !== "student" &&
        (
          form.classId ||
          form.sectionId
        )
      ) {
        alert(
          "Class and section targeting is available only for Students."
        );
        return;
      }

      if (
        form.sectionId &&
        !form.classId
      ) {
        alert(
          "Please select a class before selecting a section."
        );
        return;
      }

      try {
        setSending(true);

        const classId =
          form.classId
            ? Number(form.classId)
            : null;

        const sectionId =
          form.sectionId
            ? Number(form.sectionId)
            : null;

        const payload = {
          title:
            form.title.trim(),

          message:
            form.message.trim(),

          type:
            form.type,

          priority:
            form.important
              ? "high"
              : "normal",

          audience:
            form.audience,

          classId,

          sectionId,

          userId:
            null,

          expiresAt:
            null,
        };

        console.log(
          "SENDING TEACHER NOTIFICATION:",
          payload
        );

        const response =
          await axiosClient.post(
            "/notifications",
            payload
          );

        if (
          !response.data ||
          response.data.success !== true
        ) {
          throw new Error(
            response.data?.message ||
            "Failed to send notification"
          );
        }

        const selectedClass =
          classes.find(
            (item) =>
              Number(item.id) ===
              Number(classId)
          );

        const selectedSection =
          sections.find(
            (item) =>
              Number(item.id) ===
              Number(sectionId)
          );

        let target =
          form.audience === "admin"
            ? "Admin"
            : form.audience === "parent"
              ? "All Parents"
              : "All Students";

        if (
          form.audience === "student" &&
          selectedClass
        ) {
          target =
            selectedClass.name;

          if (selectedSection) {
            target +=
              ` - Section ${selectedSection.name}`;
          } else {
            target +=
              " - All Sections";
          }
        }

        const newNotification = {
          id:
            response.data.data?.id ||
            Date.now(),

          title:
            form.title.trim(),

          message:
            form.message.trim(),

          type:
            form.type,

          recipient:
            form.audience === "admin"
              ? "Admin"
              : form.audience === "parent"
                ? "Parents"
                : "Students",

          target,

          time:
            "Just now",

          status:
            "Delivered",

          important:
            form.important,
        };

        setSentNotifications(
          (current) => [
            newNotification,
            ...current,
          ]
        );

        resetForm();

        setShowCompose(
          false
        );

        setActiveTab(
          "sent"
        );

        alert(
          `Notification sent successfully to ${target}!`
        );

      } catch (error) {
        console.error(
          "FAILED TO SEND NOTIFICATION:",
          error
        );

        console.error(
          "RESPONSE:",
          error.response?.data
        );

        alert(
          error.response?.data?.message ||
          error.message ||
          "Failed to send notification. Please try again."
        );
      } finally {
        setSending(false);
      }
    };

  // ==========================================================
  // OPEN COMPOSE
  // ==========================================================

  const openCompose =
    () => {
      resetForm();
      setShowCompose(true);
    };

  // ==========================================================
  // CLASS CHANGE
  // ==========================================================

  const handleClassChange =
    (event) => {
      const value =
        event.target.value;

      setForm(
        (current) => ({
          ...current,
          classId: value,
          sectionId: "",
        })
      );
    };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="teacher-panel">

      <main className="teacher-main-content notifications-page">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <section className="notifications-heading">

          <div>

            <span className="notifications-eyebrow">
              TEACHER PORTAL
            </span>

            <h1>
              Notifications
            </h1>

            <p>
              Receive updates and send notifications
              to Admin, Parents or Students.
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
            TOOLBAR
        ==================================================== */}

        <section className="notifications-toolbar">

          <div className="notification-tabs">

            <button
              type="button"
              className={
                activeTab === "received"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab("received")
              }
            >
              <i className="fa-solid fa-inbox"></i>
              Received
            </button>

            <button
              type="button"
              className={
                activeTab === "sent"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab("sent")
              }
            >
              <i className="fa-solid fa-paper-plane"></i>
              Sent
            </button>

          </div>

          <div className="notification-search-filter">

            <div className="notification-search">

              <i className="fa-solid fa-magnifying-glass"></i>

              <input
                type="text"
                placeholder="Search notifications..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

            </div>

            <select
              value={filter}
              onChange={(event) =>
                setFilter(
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

              <option value="important">
                Important
              </option>

              <option value="messages">
                Messages
              </option>
            </select>

          </div>

        </section>

        {/* ====================================================
            RECEIVED NOTIFICATIONS
        ==================================================== */}

        {activeTab === "received" && (

          <section className="notifications-list-section">

            <div className="notifications-list-header">

              <div>

                <h2>
                  Received Notifications
                </h2>

                <p>
                  Notifications available to you.
                </p>

              </div>

              {unreadCount > 0 && (

                <button
                  type="button"
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </button>

              )}

            </div>

            {loadingNotifications ? (

              <div className="notification-empty-state">

                <i className="fa-solid fa-spinner fa-spin"></i>

                <h3>
                  Loading notifications...
                </h3>

              </div>

            ) : filteredReceived.length === 0 ? (

              <div className="notification-empty-state">

                <i className="fa-regular fa-bell-slash"></i>

                <h3>
                  No notifications found
                </h3>

                <p>
                  You don't have any notifications
                  matching your current filter.
                </p>

              </div>

            ) : (

              <div className="notifications-list">

                {filteredReceived.map(
                  (notification) => (

                    <article
                      key={notification.id}
                      className={
                        `notification-card ${
                          !notification.read
                            ? "unread"
                            : ""
                        }`
                      }
                      onClick={() =>
                        openNotification(
                          notification
                        )
                      }
                    >

                      <div className="notification-card-icon">

                        <i
                          className={getNotificationIcon(
                            notification.type
                          )}
                        ></i>

                      </div>

                      <div className="notification-card-content">

                        <div className="notification-card-top">

                          <h3>
                            {notification.title}
                          </h3>

                          {notification.important && (

                            <span className="notification-important-badge">
                              Important
                            </span>

                          )}

                        </div>

                        <p>
                          {notification.message}
                        </p>

                        <div className="notification-card-meta">

                          <span>
                            {getNotificationTypeLabel(
                              notification.type
                            )}
                          </span>

                          <span>
                            {notification.sender}
                          </span>

                          <span>
                            {notification.time}
                          </span>

                        </div>

                      </div>

                      {!notification.read && (

                        <span className="notification-unread-dot"></span>

                      )}

                    </article>

                  )
                )}

              </div>

            )}

          </section>

        )}

        {/* ====================================================
            SENT NOTIFICATIONS
        ==================================================== */}

        {activeTab === "sent" && (

          <section className="notifications-list-section">

            <div className="notifications-list-header">

              <div>

                <h2>
                  Sent Notifications
                </h2>

                <p>
                  Notifications sent by you.
                </p>

              </div>

            </div>

            {filteredSent.length === 0 ? (

              <div className="notification-empty-state">

                <i className="fa-regular fa-paper-plane"></i>

                <h3>
                  No sent notifications
                </h3>

                <p>
                  Notifications you send to
                  students will appear here.
                </p>

              </div>

            ) : (

              <div className="notifications-list">

                {filteredSent.map(
                  (notification) => (

                    <article
                      key={notification.id}
                      className="notification-card"
                    >

                      <div className="notification-card-icon">

                        <i className="fa-solid fa-paper-plane"></i>

                      </div>

                      <div className="notification-card-content">

                        <div className="notification-card-top">

                          <h3>
                            {notification.title}
                          </h3>

                          {notification.important && (

                            <span className="notification-important-badge">
                              Important
                            </span>

                          )}

                        </div>

                        <p>
                          {notification.message}
                        </p>

                        <div className="notification-card-meta">

                          <span>
                            To: {notification.recipient}
                          </span>

                          <span>
                            {notification.target}
                          </span>

                          <span>
                            {notification.time}
                          </span>

                        </div>

                      </div>

                    </article>

                  )
                )}

              </div>

            )}

          </section>

        )}

      </main>

      {/* ======================================================
          COMPOSE MODAL
      ====================================================== */}

      {showCompose && (

        <div
          className="notification-modal-overlay"
          onClick={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              setShowCompose(false);
            }

          }}
        >

          <div className="notification-compose-modal">

            <div className="notification-compose-header">

              <div>

                <span className="notifications-eyebrow">
                  TEACHER PORTAL
                </span>

                <h2>
                  Send Notification
                </h2>

                <p>
                  Send a message to administrators,
                  parents or students.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCompose(false)
                }
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

            </div>

            <form
              className="notification-compose-body"
              onSubmit={
                handleSendNotification
              }
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
                    setForm(
                      (current) => ({
                        ...current,
                        title:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Example: Important Notice"
                  maxLength={100}
                  required
                />

              </div>

              {/* TYPE */}

              <div className="notification-form-field">

                <label>
                  Notification Type
                </label>

                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        type:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="announcement">
                    Announcement
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

              {/* SEND TO */}

              <div className="notification-form-field">

                <label>
                  Send To
                  <span>*</span>
                </label>

                <select
                  value={form.audience}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,

                        audience:
                          event.target.value,

                        classId:
                          event.target.value ===
                          "student"
                            ? current.classId
                            : "",

                        sectionId:
                          event.target.value ===
                          "student"
                            ? current.sectionId
                            : "",
                      })
                    )
                  }
                  required
                >

                  <option value="admin">
                    Admin
                  </option>

                  <option value="parent">
                    Parents
                  </option>

                  <option value="student">
                    Students
                  </option>

                </select>

                <small>
                  Teachers can send notifications
                  to Admin, Parents or Students.
                </small>

              </div>

              {/* CLASS */}

              {form.audience === "student" && (

                <div className="notification-form-field">

                  <label>
                    Class
                    <small>
                      Optional
                    </small>
                  </label>

                  <select
                    value={form.classId}
                    onChange={
                      handleClassChange
                    }
                  >

                    <option value="">
                      All Classes
                    </option>

                    {loadingClasses ? (

                      <option disabled>
                        Loading classes...
                      </option>

                    ) : (

                      classes.map(
                        (classItem) => (

                          <option
                            key={
                              classItem.id
                            }
                            value={
                              classItem.id
                            }
                          >
                            {classItem.name}
                          </option>

                        )
                      )

                    )}

                  </select>

                </div>

              )}

              {/* SECTION */}

              {form.audience === "student" && (

                <div className="notification-form-field">

                  <label>
                    Section
                    <small>
                      Optional
                    </small>
                  </label>

                  <select
                    value={
                      form.sectionId
                    }
                    disabled={
                      !form.classId ||
                      loadingSections
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          sectionId:
                            event.target.value,
                        })
                      )
                    }
                  >

                    <option value="">
                      {loadingSections
                        ? "Loading sections..."
                        : "All Sections"}
                    </option>

                    {sections.map(
                      (section) => (

                        <option
                          key={
                            section.id
                          }
                          value={
                            section.id
                          }
                        >
                          {section.name}
                        </option>

                      )
                    )}

                  </select>

                  {!form.classId && (

                    <small>
                      Select a class to choose
                      a specific section.
                    </small>

                  )}

                </div>

              )}

              {/* MESSAGE */}

              <div className="notification-form-field">

                <label>
                  Message
                  <span>*</span>
                </label>

                <textarea
                  value={form.message}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        message:
                          event.target.value,
                      })
                    )
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
                  checked={
                    form.important
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        important:
                          event.target.checked,
                      })
                    )
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
                    Recipients will see this
                    notification as important.
                  </small>

                </div>

              </label>

              {/* TARGET PREVIEW */}

              <div className="notification-compose-info">

                <i className="fa-solid fa-circle-info"></i>

                <div>

                  <strong>
                    Who will receive this?
                  </strong>

                  <p>

                    This notification will be
                    sent to{" "}

                    <b>
                      {form.audience === "admin"
                        ? "Admin"
                        : form.audience === "parent"
                          ? "Parents"
                          : "Students"}
                    </b>

                    {form.audience ===
                      "student" && (

                      <>

                        {" "}

                        {form.classId ? (

                          <>

                            in{" "}

                            <b>
                              {
                                classes.find(
                                  (item) =>
                                    Number(
                                      item.id
                                    ) ===
                                    Number(
                                      form.classId
                                    )
                                )?.name ||
                                "Selected Class"
                              }
                            </b>

                            {" "}

                            {form.sectionId
                              ? `- Section ${
                                  sections.find(
                                    (item) =>
                                      Number(
                                        item.id
                                      ) ===
                                      Number(
                                        form.sectionId
                                      )
                                  )?.name ||
                                  ""
                                }`
                              : "- All Sections"}

                          </>

                        ) : (

                          <>
                            across{" "}
                            <b>
                              All Classes
                            </b>
                          </>

                        )}

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
                  onClick={() =>
                    setShowCompose(false)
                  }
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
          NOTIFICATION DETAIL
      ====================================================== */}

      {selectedNotification && (

        <div
          className="notification-modal-overlay"
          onClick={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedNotification(
                null
              );
            }

          }}
        >

          <div className="notification-compose-modal">

            <div className="notification-compose-header">

              <div>

                <span className="notifications-eyebrow">
                  NOTIFICATION
                </span>

                <h2>
                  {selectedNotification.title}
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedNotification(
                    null
                  )
                }
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

            </div>

            <div className="notification-compose-body">

              <div className="notification-detail-icon">

                <i
                  className={getNotificationIcon(
                    selectedNotification.type
                  )}
                ></i>

              </div>

              <p>
                {selectedNotification.message}
              </p>

              <div className="notification-card-meta">

                <span>
                  {getNotificationTypeLabel(
                    selectedNotification.type
                  )}
                </span>

                <span>
                  {selectedNotification.sender}
                </span>

                <span>
                  {selectedNotification.time}
                </span>

              </div>

              <div className="notification-modal-footer">

                <button
                  type="button"
                  className="notification-cancel-button"
                  onClick={() =>
                    deleteNotification(
                      selectedNotification.id
                    )
                  }
                >
                  <i className="fa-solid fa-trash"></i>
                  Delete
                </button>

                <button
                  type="button"
                  className="notification-send-button"
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

        </div>

      )}

    </div>
  );
}