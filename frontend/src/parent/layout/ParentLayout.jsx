import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import ParentSidebar from "./ParentSidebar";
import ParentNavbar from "./ParentNavbar";
import "./ParentLayout.css";

export default function ParentLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  /*
   * ============================================================
   * PARENT TOPBAR NAVIGATION
   * ============================================================
   *
   * This allows the notification and settings buttons
   * in the parent portal topbar to work consistently.
   */

  useEffect(() => {
    const handleParentTopbarClick = (event) => {
      const button = event.target.closest(
        ".parent-topbar-icon"
      );

      if (!button) {
        return;
      }

      /*
       * Make sure the clicked button belongs to
       * the Parent Portal.
       */
      const parentPortalElement =
        button.closest(".parent-layout");

      if (!parentPortalElement) {
        return;
      }

      const icon = button.querySelector("i");

      if (!icon) {
        return;
      }

      /*
       * ========================================================
       * NOTIFICATIONS
       * ========================================================
       */

      if (
        icon.classList.contains("fa-bell") ||
        (icon.classList.contains("fa-regular") &&
          button.querySelector(".fa-bell"))
      ) {
        event.preventDefault();
        event.stopPropagation();

        if (
          location.pathname !==
          "/parent/notifications"
        ) {
          navigate("/parent/notifications");
        }

        return;
      }

      /*
       * ========================================================
       * SETTINGS
       * ========================================================
       */

      if (
        icon.classList.contains("fa-gear") ||
        icon.classList.contains("fa-cog")
      ) {
        event.preventDefault();
        event.stopPropagation();

        if (
          location.pathname !==
          "/parent/settings"
        ) {
          navigate("/parent/settings");
        }

        return;
      }
    };

    /*
     * Capture mode ensures the buttons work even if
     * the individual page does not have an onClick.
     */
    document.addEventListener(
      "click",
      handleParentTopbarClick,
      true
    );

    return () => {
      document.removeEventListener(
        "click",
        handleParentTopbarClick,
        true
      );
    };
  }, [navigate, location.pathname]);

  return (
    <div className="parent-layout">

      {/* ======================================================
          PARENT SIDEBAR
      ====================================================== */}

      <ParentSidebar />

      {/* ======================================================
          PARENT MAIN AREA
      ====================================================== */}

      <div className="parent-layout-content">

        <ParentNavbar />

        <main className="parent-main">
          <Outlet />
        </main>

      </div>

    </div>
  );
}