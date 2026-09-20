import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardCheck,
  BookOpen,
  CalendarDays,
  FileText,
  BarChart3,
  Bell,
  MessageSquareWarning,
  UserRound,
  Settings,
  LogOut,
  GraduationCap,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import logo from "../../assets/logo.png";

import "./StudentSidebar.css";

const mainMenu = [
  {
    label: "Dashboard",
    path: "/student/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Attendance",
    path: "/student/attendance",
    icon: ClipboardCheck,
  },
  {
    label: "Assignments",
    path: "/student/assignments",
    icon: BookOpen,
  },
  {
    label: "Timetable",
    path: "/student/timetable",
    icon: CalendarDays,
  },
  {
    label: "Exams & Results",
    path: "/student/exams",
    icon: FileText,
  },
  {
    label: "Performance",
    path: "/student/performance",
    icon: BarChart3,
  },
];

const otherMenu = [
  {
    label: "Notifications",
    path: "/student/notifications",
    icon: Bell,
  },
  {
    label: "Complaints",
    path: "/student/complaints",
    icon: MessageSquareWarning,
  },
  {
    label: "My Profile",
    path: "/student/profile",
    icon: UserRound,
  },
  {
    label: "Settings",
    path: "/student/settings",
    icon: Settings,
  },
];

export default function StudentSidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const studentName =
    user?.student?.name ||
    user?.name ||
    user?.fullName ||
    "Student";

  const studentInitial = studentName
    .trim()
    .charAt(0)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/student-login", { replace: true });
  };

  const renderMenu = (items) =>
    items.map(({ label, path, icon: Icon }) => (
      <NavLink
        key={path}
        to={path}
        className={({ isActive }) =>
          `student-nav-item ${isActive ? "active" : ""}`
        }
      >
        <Icon
          className="student-nav-icon"
          size={17}
          strokeWidth={2.1}
        />

        <span>{label}</span>
      </NavLink>
    ));

  return (
    <aside className="student-sidebar">

      {/* ==================================================
          LOGO
      ================================================== */}

      <div className="student-sidebar-logo">
        <img
          src={logo}
          alt="Campus IQ"
        />
      </div>

      {/* ==================================================
          STUDENT PROFILE
      ================================================== */}

      <div className="student-sidebar-profile">
        <div className="student-avatar">
          {studentInitial}
        </div>

        <div className="student-profile-info">
          <strong>{studentName}</strong>
          <span>Student</span>
        </div>
      </div>

      {/* ==================================================
          MAIN MENU
      ================================================== */}

      <div className="student-sidebar-section">
        <span className="student-section-title">
          MAIN MENU
        </span>

        <nav className="student-nav">
          {renderMenu(mainMenu)}
        </nav>
      </div>

      {/* ==================================================
          OTHER
      ================================================== */}

      <div className="student-sidebar-section student-other-section">
        <span className="student-section-title">
          OTHER
        </span>

        <nav className="student-nav">
          {renderMenu(otherMenu)}
        </nav>
      </div>

      {/* ==================================================
          LOGOUT
      ================================================== */}

      <div className="student-sidebar-bottom">
        <button
          type="button"
          className="student-logout"
          onClick={handleLogout}
        >
          <LogOut
            size={17}
            strokeWidth={2.1}
          />

          <span>Logout</span>
        </button>
      </div>

    </aside>
  );
}
