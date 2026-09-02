import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import TeacherSidebar from "../TeacherSidebar";
import "./TeacherLayout.css";

export default function TeacherLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  /*
   * ============================================================
   * TEACHER TOPBAR NAVIGATION
   * ============================================================
   *
   * Several teacher pages have their own topbar.
   *
   * Instead of editing every teacher page separately, this
   * listener makes the existing bell and gear buttons work
   * everywhere in the teacher portal.
   *
   * Bell  -> /teacher/notifications
   * Gear  -> /teacher/settings
   */

  useEffect(() => {
    const handleTeacherTopbarClick = (event) => {
      /*
       * Find the nearest topbar button.
       */
      const button = event.target.closest(
        ".teacher-topbar-icon"
      );

      /*
       * Click was somewhere else.
       */
      if (!button) {
        return;
      }

      /*
       * Make sure this is actually inside the teacher portal.
       */
      const teacherPortalElement =
        button.closest(".teacher-layout");

      if (!teacherPortalElement) {
        return;
      }

      /*
       * Find the icon inside the button.
       */
      const icon = button.querySelector("i");

      if (!icon) {
        return;
      }

      /*
       * ========================================================
       * BELL
       * ========================================================
       */

      if (
        icon.classList.contains("fa-bell") ||
        icon.classList.contains("fa-regular") &&
          button.querySelector(".fa-bell")
      ) {
        event.preventDefault();
        event.stopPropagation();

        if (location.pathname !== "/teacher/notifications") {
          navigate("/teacher/notifications");
        }

        return;
      }

      /*
       * ========================================================
       * GEAR
       * ========================================================
       */

      if (
        icon.classList.contains("fa-gear") ||
        icon.classList.contains("fa-cog")
      ) {
        event.preventDefault();
        event.stopPropagation();

        if (location.pathname !== "/teacher/settings") {
          navigate("/teacher/settings");
        }

        return;
      }
    };

    /*
     * Use capture mode so the navigation works even when
     * the page's own button does not have an onClick handler.
     */
    document.addEventListener(
      "click",
      handleTeacherTopbarClick,
      true
    );

    return () => {
      document.removeEventListener(
        "click",
        handleTeacherTopbarClick,
        true
      );
    };
  }, [navigate, location.pathname]);

  return (
    <div className="teacher-layout">

      {/* ======================================================
          TEACHER SIDEBAR
      ====================================================== */}

      <TeacherSidebar />

      {/* ======================================================
          TEACHER MAIN AREA
      ====================================================== */}

      <div className="teacher-layout-content">
           <main
          className={`teacher-main ${
            location.pathname === "/teacher/ai-copilot"
              ? "teacher-main--fixed"
              : "teacher-main--scrollable"
          }`}
        >
          <Outlet />
        </main>
      </div>

    </div>
  );
}