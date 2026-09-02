import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function TeacherTopbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search anything...",
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const teacherName =
    user?.staff?.name ||
    user?.name ||
    user?.fullName ||
    "Teacher";

  const controlledSearchProps = onSearchChange
    ? {
        value: searchValue ?? "",
        onChange: (event) => onSearchChange(event.target.value),
      }
    : {};

  return (
    <header className="teacher-topbar">
      <div className="teacher-search">
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <input
          type="search"
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          {...controlledSearchProps}
        />
      </div>

      <div className="teacher-topbar-actions">
        <button
          type="button"
          className="teacher-topbar-icon"
          aria-label="Notifications"
          onClick={() => navigate("/teacher/notifications")}
        >
          <i className="fa-regular fa-bell" aria-hidden="true"></i>
        </button>

        <button
          type="button"
          className="teacher-topbar-icon"
          aria-label="Settings"
          onClick={() => navigate("/teacher/settings")}
        >
          <i className="fa-solid fa-gear" aria-hidden="true"></i>
        </button>

        <div className="teacher-topbar-divider"></div>

        <div
          className="teacher-mini-profile"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/teacher/profile")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              navigate("/teacher/profile");
            }
          }}
        >
          <div className="teacher-mini-avatar">
            {teacherName.charAt(0).toUpperCase()}
          </div>

          <div className="teacher-mini-info">
            <strong>{teacherName}</strong>
            <span>Teacher</span>
          </div>
        </div>
      </div>
    </header>
  );
}
