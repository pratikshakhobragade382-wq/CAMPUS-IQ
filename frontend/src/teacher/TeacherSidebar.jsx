import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";
import "./TeacherSidebar.css";

export default function TeacherSidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const teacherName =
    user?.staff?.name ||
    user?.name ||
    user?.fullName ||
    "Teacher";

  const menuItems = [
    {
      label: "Dashboard",
      icon: "fa-solid fa-bars-staggered",
      path: "/teacher/dashboard",
    },
    {
      label: "My Classes",
      icon: "fa-solid fa-book-open",
      path: "/teacher/classes",
    },
    {
      label: "My Students",
      icon: "fa-solid fa-user-graduate",
      path: "/teacher/students",
    },
    {
      label: "Attendance",
      icon: "fa-solid fa-user-check",
      path: "/teacher/attendance",
    },
    {
      label: "Assignments",
      icon: "fa-solid fa-clipboard-list",
      path: "/teacher/assignments",
    },
    {
      label: "Timetable",
      icon: "fa-solid fa-clock",
      path: "/teacher/timetable",
    },
    {
      label: "Exams",
      icon: "fa-solid fa-file-lines",
      path: "/teacher/exams",
    },
    {
      label: "AI Teacher Co-Pilot",
      icon: "fa-solid fa-robot",
      path: "/teacher/ai-copilot",
    },
  ];

  const bottomItems = [
    {
      label: "Notifications",
      icon: "fa-regular fa-bell",
      path: "/teacher/notifications",
    },
    {
      label: "My Profile",
      icon: "fa-regular fa-user",
      path: "/teacher/profile",
    },
    {
      label: "Settings",
      icon: "fa-solid fa-gear",
      path: "/teacher/settings",
    },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="teacher-sidebar">

      {/* LOGO */}
      <div className="teacher-sidebar-logo">
        <img src={logo} alt="Campus IQ" />
      </div>

      {/* TEACHER PROFILE */}
      <div className="teacher-sidebar-profile">
        <div className="teacher-sidebar-avatar">
          {teacherName.charAt(0).toUpperCase()}
        </div>

        <div className="teacher-sidebar-profile-info">
          <strong>{teacherName}</strong>
          <span>Teacher</span>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="teacher-sidebar-nav">

        <p className="teacher-sidebar-section-title">
          MAIN MENU
        </p>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `teacher-sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <i className={item.icon}></i>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <p className="teacher-sidebar-section-title teacher-sidebar-other-title">
          OTHER
        </p>

        {bottomItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `teacher-sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <i className={item.icon}></i>
            <span>{item.label}</span>
          </NavLink>
        ))}

      </nav>

      {/* LOGOUT */}
      <div className="teacher-sidebar-footer">
        <button
          type="button"
          className="teacher-sidebar-logout"
          onClick={handleLogout}
        >
          <i className="fa-solid fa-right-from-bracket"></i>
          <span>Logout</span>
        </button>
      </div>

    </aside>
  );
}