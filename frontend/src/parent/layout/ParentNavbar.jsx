import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { getUnreadNotificationCount } from "../../api/notification.api";
import "./ParentNavbar.css";

export default function ParentNavbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const parentName =
    user?.parent?.name ||
    user?.name ||
    user?.fullName ||
    "Parent";

  const firstName = parentName.split(" ")[0];
  const avatarUrl = user?.avatarUrl || user?.parent?.avatarUrl || "";

  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await getUnreadNotificationCount();
      const count = Number(response?.data?.count ?? 0);
      setUnreadCount(Number.isFinite(count) && count > 0 ? count : 0);
    } catch (error) {
      console.error("Failed to load parent unread notification count:", error);
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();

    const intervalId = window.setInterval(loadUnreadCount, 15000);
    const handleFocus = () => loadUnreadCount();

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadUnreadCount]);

  return (
    <header className="parent-navbar">
      <div className="parent-navbar-left">
        <div className="parent-navbar-heading">
          <h1>Parent Portal</h1>
          <p>Welcome back, {firstName}!</p>
        </div>
      </div>

      <div className="parent-navbar-right">
        <button
          type="button"
          className="parent-topbar-icon"
          aria-label="Notifications"
          title="Notifications"
          onClick={() => navigate("/parent/notifications")}
        >
          <i className="fa-regular fa-bell"></i>
          {unreadCount > 0 && (
            <span
              className="parent-notification-dot"
              aria-label={`${unreadCount} unread notifications`}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          className="parent-topbar-icon"
          aria-label="Settings"
          title="Settings"
          onClick={() => navigate("/parent/settings")}
        >
          <i className="fa-solid fa-gear"></i>
        </button>

        <div className="parent-navbar-divider"></div>

        <button
          type="button"
          className="parent-navbar-profile"
          onClick={() => navigate("/parent/profile")}
          aria-label="My Profile"
          title="My Profile"
        >
          {avatarUrl ? (
            <img
              className="parent-navbar-avatar-image"
              src={avatarUrl}
              alt=""
            />
          ) : (
            <div className="parent-navbar-avatar">
              {parentName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="parent-navbar-profile-info">
            <strong>{parentName}</strong>
            <span>Parent</span>
          </div>
        </button>
      </div>
    </header>
  );
}
