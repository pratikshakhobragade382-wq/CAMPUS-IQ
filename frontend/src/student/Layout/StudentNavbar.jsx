import {
  Bell,
  Settings,
  UserRound,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import {
  getUnreadNotificationCount,
} from "../../api/notification.api";

import "./StudentNavbar.css";

const pageTitles = {
  "/student/dashboard": {
    title: "Student Portal",
    subtitle: "Welcome back, Student!",
  },

  "/student/attendance": {
    title: "Attendance",
    subtitle: "Track your attendance and presence.",
  },

  "/student/assignments": {
    title: "Assignments",
    subtitle: "View and manage your assignments.",
  },

  "/student/timetable": {
    title: "Timetable",
    subtitle: "Check your daily class schedule.",
  },

  "/student/exams": {
    title: "Exams & Results",
    subtitle: "View your exams and academic results.",
  },

  "/student/performance": {
    title: "Performance",
    subtitle: "Track your academic performance.",
  },

  "/student/notifications": {
    title: "Notifications",
    subtitle: "Stay updated with school announcements.",
  },

  "/student/complaints": {
    title: "Complaints",
    subtitle: "Submit and track your complaints.",
  },

  "/student/profile": {
    title: "My Profile",
    subtitle: "View and manage your profile.",
  },

  "/student/settings": {
    title: "Settings",
    subtitle: "Manage your account settings.",
  },
};

export default function StudentNavbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const { user } = useAuth();

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const loadUnreadCount =
    useCallback(async () => {
      try {
        const response =
          await getUnreadNotificationCount();

        const count =
          Number(
            response?.count ??
            response?.data?.count ??
            response ??
            0
          );

        setUnreadCount(
          Number.isFinite(count)
            ? count
            : 0
        );
      } catch (error) {
        console.error(
          "Failed to load student notification count:",
          error
        );

        /*
         * Do not break the student navbar
         * if notification API is unavailable.
         */
        setUnreadCount(0);
      }
    }, []);

  useEffect(() => {
    loadUnreadCount();

    /*
     * Refresh every 30 seconds.
     */
    const interval =
      setInterval(
        loadUnreadCount,
        30000
      );

    return () => {
      clearInterval(interval);
    };
  }, [loadUnreadCount]);

  /*
   * Refresh immediately when student
   * returns to this page.
   */
  useEffect(() => {
    const handleFocus = () => {
      loadUnreadCount();
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [loadUnreadCount]);

  /*
   * When student opens notifications,
   * refresh the badge after a short delay.
   */
  useEffect(() => {
    if (
      location.pathname ===
      "/student/notifications"
    ) {
      const timer =
        setTimeout(
          loadUnreadCount,
          500
        );

      return () =>
        clearTimeout(timer);
    }
  }, [
    location.pathname,
    loadUnreadCount,
  ]);

  const currentPage =
    pageTitles[
      location.pathname
    ] ||
    pageTitles[
      "/student/dashboard"
    ];

  const studentName =
    user?.student?.name ||
    user?.name ||
    user?.fullName ||
    "Student";

  const studentInitial =
    studentName
      .trim()
      .charAt(0)
      .toUpperCase();

  const badgeText =
    unreadCount > 99
      ? "99+"
      : String(unreadCount);

  return (
    <header className="student-navbar">

      <div className="student-navbar-heading">
        <h1>
          {currentPage.title}
        </h1>

        <p>
          {currentPage.subtitle ===
          "Welcome back, Student!"
            ? `Welcome back, ${studentName}!`
            : currentPage.subtitle}
        </p>
      </div>

      <div className="student-navbar-actions">

        {/* =================================================
            NOTIFICATIONS
        ================================================= */}

        <button
          type="button"
          className={`student-navbar-icon ${
            unreadCount > 0
              ? "has-notifications"
              : ""
          }`}
          title={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Notifications"
          }
          onClick={() =>
            navigate(
              "/student/notifications"
            )
          }
        >

          <Bell
            size={18}
            strokeWidth={2}
          />

          {unreadCount > 0 && (
            <span
              className="student-notification-dot show pulse"
            >
              {badgeText}
            </span>
          )}

        </button>

        {/* =================================================
            SETTINGS
        ================================================= */}

        <button
          type="button"
          className="student-navbar-icon"
          title="Settings"
          onClick={() =>
            navigate(
              "/student/settings"
            )
          }
        >
          <Settings
            size={18}
            strokeWidth={2}
          />
        </button>

        <div className="student-navbar-divider" />

        {/* =================================================
            USER
        ================================================= */}

        <button
          type="button"
          className="student-navbar-user"
          onClick={() =>
            navigate(
              "/student/profile"
            )
          }
          title="My Profile"
        >

          <span className="student-navbar-avatar">
            {studentInitial}
          </span>

          <span className="student-navbar-user-info">

            <strong>
              {studentName}
            </strong>

            <small>
              Student
            </small>

          </span>

          <UserRound
            size={14}
            strokeWidth={2}
            className="student-navbar-user-icon"
          />

        </button>

      </div>
    </header>
  );
}