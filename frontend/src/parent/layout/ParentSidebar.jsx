import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";
import "./ParentSidebar.css";

export default function ParentSidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const parentName =
    user?.parent?.name ||
    user?.name ||
    user?.fullName ||
    "Parent";

  const avatarUrl = user?.avatarUrl || user?.parent?.avatarUrl || "";

  const menuItems = [
    {
      label: "Dashboard",
      icon: "fa-solid fa-bars-staggered",
      path: "/parent/dashboard",
    },

    {
      label: "My Children",
      icon: "fa-solid fa-user-group",
      path: "/parent/children",
    },

    {
      label: "Calendar",
      icon: "fa-regular fa-calendar",
      path: "/parent/calendar",
    },

    {
      label: "Attendance",
      icon: "fa-solid fa-user-check",
      path: "/parent/attendance",
    },

    {
      label: "Assignments",
      icon: "fa-solid fa-clipboard-list",
      path: "/parent/assignments",
    },

    {
      label: "Timetable",
      icon: "fa-solid fa-clock",
      path: "/parent/timetable",
    },

    {
      label: "Exams",
      icon: "fa-solid fa-file-lines",
      path: "/parent/exams",
    },

    // =================================================
    // AI PERFORMANCE
    // =================================================

    {
      label: "AI Performance Predictor",
      icon: "fa-solid fa-chart-line",
      path: "/parent/ai-performance",
    },

    // =================================================
    // COMPLAINT MANAGEMENT
    // =================================================

    {
      label: "Report Complaint",
      icon: "fa-solid fa-file-circle-exclamation",
      path: "/parent/complaints",
    },
  ];

  const bottomItems = [
    {
      label: "Notifications",
      icon: "fa-regular fa-bell",
      path: "/parent/notifications",
    },

    {
      label: "My Profile",
      icon: "fa-regular fa-user",
      path: "/parent/profile",
    },

    {
      label: "Settings",
      icon: "fa-solid fa-gear",
      path: "/parent/settings",
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/parent-login");
  };

  return (
    <aside className="parent-sidebar">

      {/* =================================================
          LOGO
      ================================================= */}

      <div className="parent-sidebar-logo">
        <img
          src={logo}
          alt="Campus IQ"
        />
      </div>

      {/* =================================================
          PARENT PROFILE
      ================================================= */}

      <NavLink
        to="/parent/profile"
        className="parent-sidebar-profile"
      >

        {avatarUrl ? (
          <img
            className="parent-sidebar-avatar-image"
            src={avatarUrl}
            alt=""
          />
        ) : (
          <div className="parent-sidebar-avatar">
            {parentName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="parent-sidebar-profile-info">

          <strong>
            {parentName}
          </strong>

          <span>
            Parent
          </span>

        </div>

      </NavLink>

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <nav className="parent-sidebar-nav">

        <p className="parent-sidebar-section-title">
          MAIN MENU
        </p>

        {menuItems.map((item) => (

          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `parent-sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >

            <i className={item.icon}></i>

            <span>
              {item.label}
            </span>

          </NavLink>

        ))}

        <p className="parent-sidebar-section-title parent-sidebar-other-title">
          OTHER
        </p>

        {bottomItems.map((item) => (

          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `parent-sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >

            <i className={item.icon}></i>

            <span>
              {item.label}
            </span>

          </NavLink>

        ))}

      </nav>

      {/* =================================================
          LOGOUT
      ================================================= */}

      <div className="parent-sidebar-footer">

        <button
          type="button"
          className="parent-sidebar-logout"
          onClick={handleLogout}
        >

          <i className="fa-solid fa-right-from-bracket"></i>

          <span>
            Logout
          </span>

        </button>

      </div>

    </aside>
  );
}