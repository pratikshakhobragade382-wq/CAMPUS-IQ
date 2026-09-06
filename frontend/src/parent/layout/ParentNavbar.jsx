import { useAuth } from "../../context/AuthContext";
import "./ParentNavbar.css";

export default function ParentNavbar() {
  const { user } = useAuth();

  const parentName =
    user?.parent?.name ||
    user?.name ||
    user?.fullName ||
    "Parent";

  const firstName = parentName.split(" ")[0];

  return (
    <header className="parent-navbar">

      {/* ======================================================
          LEFT SIDE
      ====================================================== */}

      <div className="parent-navbar-left">
        <div className="parent-navbar-heading">
          <h1>Parent Portal</h1>
          <p>Welcome back, {firstName}!</p>
        </div>
      </div>

      {/* ======================================================
          RIGHT SIDE
      ====================================================== */}

      <div className="parent-navbar-right">

        {/* Notifications */}

        <button
          type="button"
          className="parent-topbar-icon"
          aria-label="Notifications"
        >
          <i className="fa-regular fa-bell"></i>

          <span className="parent-notification-dot">
            0
          </span>
        </button>

        {/* Settings */}

        <button
          type="button"
          className="parent-topbar-icon"
          aria-label="Settings"
        >
          <i className="fa-solid fa-gear"></i>
        </button>

        {/* Divider */}

        <div className="parent-navbar-divider"></div>

        {/* Profile */}

        <div className="parent-navbar-profile">

          <div className="parent-navbar-avatar">
            {parentName.charAt(0).toUpperCase()}
          </div>

          <div className="parent-navbar-profile-info">
            <strong>{parentName}</strong>
            <span>Parent</span>
          </div>

        </div>

      </div>

    </header>
  );
}