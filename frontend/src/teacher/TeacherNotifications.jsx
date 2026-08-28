import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import axiosClient from "../api/axios";
import "./Notifications.css";

/*
============================================================
 TEACHER NOTIFICATIONS
============================================================

 Teacher can:

 1. Receive notifications from Admin
 2. Receive automatic school notifications
 3. Send notifications to Admin / Parents / Students
 4. Mark notifications as read
 5. Mark notifications as important
 6. Delete notifications
 7. Search notifications
 8. Filter notifications

 IMPORTANT:

 Received notifications are NOT hard-coded.

 They are loaded from:

 GET /api/v1/notifications

============================================================
*/


/* ==========================================================
   ICON HELPER
========================================================== */

function getNotificationIcon(type) {

  switch (type) {

    case "student":
    case "new_student":
      return "fa-solid fa-user-plus";

    case "teacher":
    case "new_teacher":
      return "fa-solid fa-chalkboard-user";

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
    case "parent_meeting":
      return "fa-solid fa-users";

    case "announcement":
      return "fa-solid fa-bullhorn";

    case "section":
      return "fa-solid fa-layer-group";

    case "general":
    default:
      return "fa-solid fa-bell";
  }
}


/* ==========================================================
   TYPE LABEL HELPER
========================================================== */

function getNotificationTypeLabel(type) {

  switch (type) {

    case "student":
    case "new_student":
      return "Student Update";

    case "teacher":
    case "new_teacher":
      return "Teacher Update";

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
    case "parent_meeting":
      return "Meeting";

    case "section":
      return "Section Update";

    case "announcement":
      return "Announcement";

    case "general":
    default:
      return "General";
  }
}


/* ==========================================================
   AUDIENCE LABEL HELPER
========================================================== */

function getAudienceLabel(audience) {

  switch (audience) {

    case "admin":
      return "Admin";

    case "parent":
      return "Parents";

    case "student":
      return "Students";

    case "teacher":
      return "Teachers";

    default:
      return "Unknown";
  }
}


/* ==========================================================
   TIME FORMATTER
========================================================== */

function formatNotificationTime(value) {

  if (!value) {
    return "Just now";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const now = new Date();

  const difference =
    Math.floor(
      (now.getTime() - date.getTime()) / 1000
    );

  if (difference < 60) {
    return "Just now";
  }

  if (difference < 3600) {

    const minutes =
      Math.floor(difference / 60);

    return `${minutes} minute${
      minutes === 1 ? "" : "s"
    } ago`;
  }

  if (difference < 86400) {

    const hours =
      Math.floor(difference / 3600);

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


/* ==========================================================
   NORMALIZE BACKEND NOTIFICATION
==========================================================

 Backend notification structures can sometimes look like:

 {
   id,
   title,
   message,
   type,
   priority,
   read,
   createdAt,
   sender,
   senderRole,
   system
 }

 or:

 {
   id,
   title,
   message,
   type,
   priority,
   isRead,
   created_at
 }

 This function converts everything into the structure
 required by this frontend.

========================================================== */

function normalizeNotification(notification) {

  if (!notification) {
    return null;
  }


  const sender =
    typeof notification.sender === "object"
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


  const senderRole =
    typeof notification.sender === "object"
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


  const createdAt =
    notification.createdAt ||
    notification.created_at ||
    notification.date ||
    notification.timestamp;


  const important =
    notification.important === true ||
    notification.priority === "high" ||
    notification.priority === "HIGH" ||
    notification.priority === "important";


  const read =
    notification.read === true ||
    notification.isRead === true ||
    notification.readAt !== null &&
    notification.readAt !== undefined;


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
      notification.isSystem === true ||
      senderRole
        ?.toLowerCase()
        .includes("admin"),

    audience:
      notification.audience ||
      notification.recipientType ||
      notification.recipient_type ||
      null,

    createdAt,

  };
}


/* ==========================================================
   GET NOTIFICATION ARRAY FROM API RESPONSE
========================================================== */

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


/* ==========================================================
   MAIN COMPONENT
========================================================== */

export default function TeacherNotifications() {


  /* ========================================================
     ACTIVE TAB
  ======================================================== */

  const [
    activeTab,
    setActiveTab,
  ] = useState("received");


  /* ========================================================
     RECEIVED NOTIFICATIONS
  ======================================================== */

  const [
    receivedNotifications,
    setReceivedNotifications,
  ] = useState([]);


  /* ========================================================
     SENT NOTIFICATIONS
  ======================================================== */

  const [
    sentNotifications,
    setSentNotifications,
  ] = useState([]);


  /* ========================================================
     LOADING
  ======================================================== */

  const [
    loadingNotifications,
    setLoadingNotifications,
  ] = useState(true);


  /* ========================================================
     SEARCH
  ======================================================== */

  const [
    search,
    setSearch,
  ] = useState("");


  /* ========================================================
     FILTER
  ======================================================== */

  const [
    filter,
    setFilter,
  ] = useState("all");


  /* ========================================================
     COMPOSE MODAL
  ======================================================== */

  const [
    showCompose,
    setShowCompose,
  ] = useState(false);


  /* ========================================================
     SELECTED NOTIFICATION
  ======================================================== */

  const [
    selectedNotification,
    setSelectedNotification,
  ] = useState(null);


  /* ========================================================
     SENDING STATE
  ======================================================== */

  const [
    sending,
    setSending,
  ] = useState(false);


  /* ========================================================
     FORM
  ======================================================== */

  const [
    form,
    setForm,
  ] = useState({

    title: "",

    message: "",

    type: "announcement",

    audience: "admin",

    className: "",

    section: "",

    important: false,

  });


  /* ========================================================
     RESET FORM
  ======================================================== */

  const resetForm = useCallback(() => {

    setForm({

      title: "",

      message: "",

      type: "announcement",

      audience: "admin",

      className: "",

      section: "",

      important: false,

    });

  }, []);


  /* ========================================================
     LOAD RECEIVED NOTIFICATIONS
  ======================================================== */

  const loadReceivedNotifications =
    useCallback(
      async () => {

        try {

          setLoadingNotifications(true);


          console.log(
            "================================"
          );

          console.log(
            "LOADING TEACHER NOTIFICATIONS"
          );

          console.log(
            "GET /notifications"
          );

          console.log(
            "================================"
          );


          const response =
            await axiosClient.get(
              "/notifications"
            );


          console.log(
            "NOTIFICATION API RESPONSE:",
            response.data
          );


          const rawNotifications =
            extractNotifications(
              response.data
            );


          const normalizedNotifications =
            rawNotifications
              .map(normalizeNotification)
              .filter(Boolean);


          /*
           Newest notifications first.
          */

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

          console.error(
            "Backend response:",
            error.response?.data
          );


          /*
           Do not destroy the existing
           notifications if refresh fails.
          */

        } finally {

          setLoadingNotifications(
            false
          );

        }

      },
      []
    );


  /* ========================================================
     LOAD NOTIFICATIONS WHEN PAGE OPENS
  ======================================================== */

  useEffect(() => {

    let cancelled = false;


    const load = async () => {

      try {

        setLoadingNotifications(true);


        const response =
          await axiosClient.get(
            "/notifications"
          );


        if (cancelled) {
          return;
        }


        const rawNotifications =
          extractNotifications(
            response.data
          );


        const normalizedNotifications =
          rawNotifications
            .map(normalizeNotification)
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

        if (!cancelled) {

          console.error(
            "Failed to load notifications:",
            error
          );

        }

      } finally {

        if (!cancelled) {

          setLoadingNotifications(
            false
          );

        }

      }

    };


    load();


    /*
     Refresh automatically every 15 seconds.

     This means if Admin adds Nikki or Bhide,
     the teacher page will automatically pick
     up the notification without manually
     refreshing the browser.
    */

    const interval =
      setInterval(
        load,
        15000
      );


    /*
     Reload when teacher returns to the tab.
    */

    const handleFocus = () => {
      load();
    };


    window.addEventListener(
      "focus",
      handleFocus
    );


    return () => {

      cancelled = true;

      clearInterval(interval);

      window.removeEventListener(
        "focus",
        handleFocus
      );

    };

  }, []);


  /* ========================================================
     UNREAD COUNT
  ======================================================== */

  const unreadCount =
    useMemo(() => {

      return receivedNotifications.filter(
        (notification) =>
          !notification.read
      ).length;

    }, [
      receivedNotifications,
    ]);


  /* ========================================================
     IMPORTANT COUNT
  ======================================================== */

  const importantCount =
    useMemo(() => {

      return receivedNotifications.filter(
        (notification) =>
          notification.important
      ).length;

    }, [
      receivedNotifications,
    ]);


  /* ========================================================
     SENT COUNT
  ======================================================== */

  const sentCount =
    sentNotifications.length;


  /* ========================================================
     FILTER RECEIVED
  ======================================================== */

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
            filter === "system"
          ) {

            matchesFilter =
              notification.system;

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


  /* ========================================================
     FILTER SENT
  ======================================================== */

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


  /* ========================================================
     MARK AS READ
  ======================================================== */

  const markAsRead = async (id) => {

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


  /* ========================================================
     MARK ALL AS READ
  ======================================================== */

  const markAllAsRead = async () => {

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


  /* ========================================================
     TOGGLE IMPORTANT
  ======================================================== */

  const toggleImportant = (id) => {

    setReceivedNotifications(
      (current) =>
        current.map(
          (notification) =>
            notification.id === id
              ? {
                  ...notification,
                  important:
                    !notification.important,
                }
              : notification
        )
    );

  };


  /* ========================================================
     DELETE NOTIFICATION
  ======================================================== */

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
        selectedNotification?.id === id
      ) {

        setSelectedNotification(
          null
        );

      }

    };


  /* ========================================================
     OPEN NOTIFICATION
  ======================================================== */

  const openNotification =
    (notification) => {

      markAsRead(
        notification.id
      );


      setSelectedNotification(
        {
          ...notification,
          read: true,
        }
      );

    };


  /* ========================================================
     SEND NOTIFICATION
  ======================================================== */

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


      if (!form.audience) {

        alert(
          "Please select who should receive the notification."
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
          "Invalid notification audience."
        );

        return;
      }


      try {

        setSending(true);


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

          classId:
            null,

          sectionId:
            null,

          userId:
            null,

          expiresAt:
            null,

        };


        console.log(
          "SENDING NOTIFICATION:",
          payload
        );


        const response =
          await axiosClient.post(
            "/notifications",
            payload
          );


        console.log(
          "NOTIFICATION RESPONSE:",
          response.data
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
            getAudienceLabel(
              form.audience
            ),

          target:
            form.className
              ? `${form.className}${
                  form.section
                    ? ` - Section ${form.section}`
                    : ""
                }`
              : getAudienceLabel(
                  form.audience
                ),

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

        setShowCompose(false);

        setActiveTab("sent");


        alert(
          "Notification sent successfully!"
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


  /* ========================================================
     OPEN COMPOSE
  ======================================================== */

  const openCompose = () => {

    resetForm();

    setShowCompose(true);

  };


  /* ========================================================
     RENDER
  ======================================================== */

  return (

    <div className="teacher-panel">


      <main className="teacher-main-content notifications-page">


        {/* ==================================================
            HEADER
        ================================================== */}

        <section className="notifications-heading">

          <div>

            <span className="notifications-eyebrow">
              TEACHER PORTAL
            </span>

            <h1>
              Notifications
            </h1>

            <p>
              Send announcements and stay
              connected with administrators,
              parents and students.
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


        {/* ==================================================
            STATISTICS
        ================================================== */}

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


        {/* ==================================================
            WORKSPACE
        ================================================== */}

        <section className="notification-workspace">


          {/* =================================================
              TABS
          ================================================= */}

          <div className="notification-tabs">


            <button
              type="button"
              className={
                activeTab === "received"
                  ? "notification-tab active"
                  : "notification-tab"
              }
              onClick={() =>
                setActiveTab(
                  "received"
                )
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
                setActiveTab(
                  "sent"
                )
              }
            >

              <i className="fa-solid fa-paper-plane"></i>

              Sent

            </button>


          </div>


          {/* =================================================
              TOOLBAR
          ================================================= */}

          <div className="notification-toolbar">


            <div className="notification-toolbar-search">

              <i className="fa-solid fa-magnifying-glass"></i>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
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
                setFilter(
                  event.target.value
                )
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
                disabled={
                  unreadCount === 0
                }
              >

                <i className="fa-solid fa-check-double"></i>

                Mark All Read

              </button>

            )}

          </div>


          {/* =================================================
              RECEIVED
          ================================================= */}

          {activeTab === "received" && (

            <div className="notification-list">


              {loadingNotifications ? (

                <div className="notification-empty">

                  <div className="notification-empty-icon">

                    <i className="fa-solid fa-spinner fa-spin"></i>

                  </div>

                  <h3>
                    Loading Notifications
                  </h3>

                  <p>
                    Please wait while we load your notifications.
                  </p>

                </div>

              ) : filteredReceived.length === 0 ? (

                <div className="notification-empty">

                  <div className="notification-empty-icon">

                    <i className="fa-solid fa-bell-slash"></i>

                  </div>

                  <h3>
                    No Notifications Found
                  </h3>

                  <p>
                    You currently have no
                    received notifications.
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
                      key={
                        notification.id
                      }
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
                                {
                                  notification.title
                                }
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

                                {
                                  notification.sender
                                }

                              </span>


                              <span>

                                {
                                  notification.senderRole
                                }

                              </span>


                              <span>

                                <i className="fa-regular fa-clock"></i>

                                {
                                  notification.time
                                }

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

                          {
                            notification.message
                          }

                        </p>


                        <div className="notification-card-footer">


                          <span
                            className={
                              `notification-type-badge ${notification.type}`
                            }
                          >

                            {
                              getNotificationTypeLabel(
                                notification.type
                              )
                            }

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


          {/* =================================================
              SENT
          ================================================= */}

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
                      key={
                        notification.id
                      }
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
                                {
                                  notification.title
                                }
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

                                {
                                  notification.recipient
                                }

                              </span>


                              <span>

                                {
                                  notification.target
                                }

                              </span>


                              <span>

                                <i className="fa-regular fa-clock"></i>

                                {
                                  notification.time
                                }

                              </span>


                            </div>

                          </div>


                          <span className="delivered-badge">

                            <i className="fa-solid fa-check-double"></i>

                            {
                              notification.status
                            }

                          </span>


                        </div>


                        <p className="notification-message-preview">

                          {
                            notification.message
                          }

                        </p>


                        <div className="notification-card-footer">


                          <span
                            className={
                              `notification-type-badge ${notification.type}`
                            }
                          >

                            {
                              getNotificationTypeLabel(
                                notification.type
                              )
                            }

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


      {/* ====================================================
          COMPOSE MODAL
      ==================================================== */}

      {showCompose && (

        <div
          className="notification-modal-overlay"
          onMouseDown={() =>
            !sending &&
            setShowCompose(false)
          }
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
                  Send a message to Admin,
                  Parents or Students.
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  !sending &&
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


              <div className="notification-form-field">

                <label>

                  Notification Title

                  <span>
                    *
                  </span>

                </label>


                <input
                  type="text"
                  value={
                    form.title
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        title:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Example: Homework Reminder"
                  maxLength={100}
                  required
                />

              </div>


              <div className="notification-form-row">


                <div className="notification-form-field">

                  <label>
                    Notification Type
                  </label>


                  <select
                    value={
                      form.type
                    }
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

                    <span>
                      *
                    </span>

                  </label>


                  <select
                    value={
                      form.audience
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          audience:
                            event.target.value,
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

                </div>

              </div>


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
                    value={
                      form.className
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          className:
                            event.target.value,
                        })
                      )
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
                    value={
                      form.section
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          section:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="Example: A"
                  />

                </div>


              </div>


              <div className="notification-form-field">

                <label>

                  Message

                  <span>
                    *
                  </span>

                </label>


                <textarea
                  value={
                    form.message
                  }
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

                  {
                    form.message.length
                  }

                  {" "} / 1000

                </div>

              </div>


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
                    The recipient will see
                    this notification as
                    important.
                  </small>

                </div>


              </label>


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
                      {
                        getAudienceLabel(
                          form.audience
                        )
                      }
                    </b>


                    {form.className && (

                      <>

                        {" "}for{" "}

                        <b>

                          {
                            form.className
                          }

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


              <div className="notification-modal-footer">


                <button
                  type="button"
                  className="notification-cancel-button"
                  onClick={() =>
                    setShowCompose(false)
                  }
                  disabled={
                    sending
                  }
                >

                  Cancel

                </button>


                <button
                  type="submit"
                  className="notification-send-button"
                  disabled={
                    sending ||
                    !form.title.trim() ||
                    !form.message.trim() ||
                    !form.audience
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


      {/* ====================================================
          VIEW NOTIFICATION MODAL
      ==================================================== */}

      {selectedNotification && (

        <div
          className="notification-modal-overlay"
          onMouseDown={() =>
            setSelectedNotification(
              null
            )
          }
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

                  {
                    getNotificationTypeLabel(
                      selectedNotification.type
                    )
                  }

                </span>


                <h2>

                  {
                    selectedNotification.title
                  }

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


            <div className="notification-view-body">


              <div className="notification-view-meta">


                <div>

                  <span>
                    From
                  </span>

                  <strong>

                    {
                      selectedNotification.sender
                    }

                  </strong>

                </div>


                <div>

                  <span>
                    Role
                  </span>

                  <strong>

                    {
                      selectedNotification.senderRole
                    }

                  </strong>

                </div>


                <div>

                  <span>
                    Received
                  </span>

                  <strong>

                    {
                      selectedNotification.time
                    }

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

                  {
                    selectedNotification.message
                  }

                </p>

              </div>


            </div>


            <div className="notification-view-footer">


              <button
                type="button"
                className="notification-cancel-button"
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