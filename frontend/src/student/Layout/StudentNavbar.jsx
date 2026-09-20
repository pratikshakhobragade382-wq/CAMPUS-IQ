import { Bell, Settings, UserRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

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

  const currentPage =
    pageTitles[location.pathname] || pageTitles["/student/dashboard"];

  const studentName =
    user?.student?.name ||
    user?.name ||
    user?.fullName ||
    "Student";

  const studentInitial = studentName
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <header className="student-navbar">

      <div className="student-navbar-heading">
        <h1>{currentPage.title}</h1>
        <p>
          {currentPage.subtitle === "Welcome back, Student!"
            ? `Welcome back, ${studentName}!`
            : currentPage.subtitle}
        </p>
      </div>

      <div className="student-navbar-actions">

        <button
          type="button"
          className="student-navbar-icon"
          title="Notifications"
          onClick={() => navigate("/student/notifications")}
        >
          <Bell size={18} strokeWidth={2} />
          <span className="student-notification-dot">0</span>
        </button>

        <button
          type="button"
          className="student-navbar-icon"
          title="Settings"
          onClick={() => navigate("/student/settings")}
        >
          <Settings size={18} strokeWidth={2} />
        </button>

        <div className="student-navbar-divider" />

        <button
          type="button"
          className="student-navbar-user"
          onClick={() => navigate("/student/profile")}
          title="My Profile"
        >
          <span className="student-navbar-avatar">
            {studentInitial}
          </span>

          <span className="student-navbar-user-info">
            <strong>{studentName}</strong>
            <small>Student</small>
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
