import { useAuth } from "../context/AuthContext";
import "./TeacherDashboard.css";

export default function TeacherDashboard() {
  const { user } = useAuth();

  // =========================================================
  // TEACHER INFORMATION
  // =========================================================

  const teacherName =
    user?.staff?.name ||
    user?.name ||
    user?.fullName ||
    "Teacher";

  const teacherEmail =
    user?.email ||
    "teacher@example.com";

  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="teacher-panel">

      {/* =====================================================
          TOP HEADER
      ====================================================== */}

      <header className="teacher-topbar">

        {/* Search */}

        <div className="teacher-search">
          <i className="fa-solid fa-magnifying-glass"></i>

          <input
            type="text"
            placeholder="Search anything..."
          />
        </div>


        {/* Topbar Actions */}

        <div className="teacher-topbar-actions">

          {/* Notification */}

          <button className="teacher-topbar-icon">
            <i className="fa-regular fa-bell"></i>

            <span className="teacher-notification-dot">
              1
            </span>
          </button>


          {/* Settings */}

          <button className="teacher-topbar-icon">
            <i className="fa-solid fa-gear"></i>
          </button>


          {/* Divider */}

          <div className="teacher-topbar-divider"></div>


          {/* Profile */}

          <div className="teacher-mini-profile">

            <div className="teacher-mini-avatar">
              {teacherName.charAt(0).toUpperCase()}
            </div>

            <div className="teacher-mini-info">

              <strong>
                {teacherName}
              </strong>

              <span>
                Teacher
              </span>

            </div>

          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="teacher-main-content">

        {/* ===================================================
            PAGE HEADING
        ==================================================== */}

        <div className="teacher-page-heading">

          <div>

            <h1>
              Teacher Dashboard
            </h1>

            <p>
              Welcome back! Here's what's happening with your
              classes today.
            </p>

          </div>


          <div className="teacher-current-date">

            <i className="fa-regular fa-calendar"></i>

            <span>
              {formattedDate}
            </span>

          </div>

        </div>


        {/* ===================================================
            TEACHER PROFILE / WELCOME
        ==================================================== */}

        <section className="teacher-welcome-card">

          <div className="teacher-welcome-left">

            <div className="teacher-large-avatar">
              <i className="fa-solid fa-chalkboard-user"></i>
            </div>

            <div className="teacher-welcome-info">

              <span className="teacher-welcome-label">
                Teacher Profile
              </span>

              <h2>
                Welcome, {teacherName}! 👋
              </h2>

              <p>
                {teacherEmail}
              </p>

              <div className="teacher-active-status">
                <span></span>
                Active Teacher
              </div>

            </div>

          </div>


          <div className="teacher-welcome-decoration">
            <i className="fa-solid fa-school"></i>
          </div>

        </section>


        {/* ===================================================
            STATISTICS
        ==================================================== */}

        <section className="teacher-stat-grid">

          {/* My Classes */}

          <div className="teacher-stat-card">

            <div className="teacher-stat-content">

              <span>
                My Classes
              </span>

              <strong>
                0
              </strong>

              <small>
                Assigned classes
              </small>

            </div>

            <div className="teacher-stat-icon blue">
              <i className="fa-solid fa-book-open"></i>
            </div>

          </div>


          {/* Students */}

          <div className="teacher-stat-card">

            <div className="teacher-stat-content">

              <span>
                My Students
              </span>

              <strong>
                0
              </strong>

              <small>
                Students assigned
              </small>

            </div>

            <div className="teacher-stat-icon green">
              <i className="fa-solid fa-user-graduate"></i>
            </div>

          </div>


          {/* Attendance */}

          <div className="teacher-stat-card">

            <div className="teacher-stat-content">

              <span>
                Today's Attendance
              </span>

              <strong>
                0%
              </strong>

              <small>
                Attendance recorded
              </small>

            </div>

            <div className="teacher-stat-icon sky">
              <i className="fa-solid fa-user-check"></i>
            </div>

          </div>


          {/* Assignments */}

          <div className="teacher-stat-card">

            <div className="teacher-stat-content">

              <span>
                Assignments
              </span>

              <strong>
                0
              </strong>

              <small>
                Pending assignments
              </small>

            </div>

            <div className="teacher-stat-icon light-green">
              <i className="fa-solid fa-clipboard-list"></i>
            </div>

          </div>

        </section>


        {/* ===================================================
            MAIN DASHBOARD GRID
        ==================================================== */}

        <section className="teacher-main-grid">

          {/* =================================================
              ATTENDANCE OVERVIEW
          ================================================== */}

          <div className="teacher-dashboard-card attendance-card">

            <div className="teacher-card-header">

              <div>

                <h2>
                  Attendance Overview
                </h2>

                <p>
                  Student attendance for the last 7 days
                </p>

              </div>

              <button className="teacher-card-menu">
                <i className="fa-solid fa-ellipsis"></i>
              </button>

            </div>


            {/* Chart Placeholder */}

            <div className="teacher-chart-placeholder">

              <div className="teacher-chart-y-axis">

                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>

              </div>


              <div className="teacher-chart-area">

                <div className="teacher-chart-grid-line"></div>
                <div className="teacher-chart-grid-line"></div>
                <div className="teacher-chart-grid-line"></div>
                <div className="teacher-chart-grid-line"></div>
                <div className="teacher-chart-grid-line"></div>


                <div className="teacher-chart-empty">
                  <i className="fa-solid fa-chart-line"></i>

                  <span>
                    Attendance data will appear here
                  </span>
                </div>


                <div className="teacher-chart-days">

                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>

                </div>

              </div>

            </div>


            {/* Legend */}

            <div className="teacher-chart-legend">

              <span>
                <i className="legend-present"></i>
                Present
              </span>

              <span>
                <i className="legend-absent"></i>
                Absent
              </span>

              <span>
                <i className="legend-late"></i>
                Late
              </span>

            </div>

          </div>


          {/* =================================================
              TODAY'S CLASSES
          ================================================== */}

          <div className="teacher-dashboard-card">

            <div className="teacher-card-header">

              <div>

                <h2>
                  Today's Classes
                </h2>

                <p>
                  Your teaching schedule for today
                </p>

              </div>

              <button className="teacher-card-menu">
                <i className="fa-solid fa-ellipsis"></i>
              </button>

            </div>


            <div className="teacher-empty-content">

              <div className="teacher-empty-icon blue">
                <i className="fa-solid fa-calendar-day"></i>
              </div>

              <h3>
                No classes scheduled
              </h3>

              <p>
                Your classes for today will appear here.
              </p>

            </div>

          </div>

        </section>


        {/* ===================================================
            BOTTOM DASHBOARD GRID
        ==================================================== */}

        <section className="teacher-bottom-grid">

          {/* Upcoming Classes */}

          <div className="teacher-dashboard-card">

            <div className="teacher-card-header">

              <div>

                <h2>
                  Upcoming Classes
                </h2>

                <p>
                  Your next scheduled classes
                </p>

              </div>

              <button className="teacher-card-menu">
                <i className="fa-solid fa-ellipsis"></i>
              </button>

            </div>


            <div className="teacher-empty-content small">

              <div className="teacher-empty-icon green">
                <i className="fa-solid fa-clock"></i>
              </div>

              <h3>
                No upcoming classes
              </h3>

              <p>
                Your upcoming schedule will appear here.
              </p>

            </div>

          </div>


          {/* Recent Activity */}

          <div className="teacher-dashboard-card">

            <div className="teacher-card-header">

              <div>

                <h2>
                  Recent Activity
                </h2>

                <p>
                  Your latest teaching activities
                </p>

              </div>

              <button className="teacher-card-menu">
                <i className="fa-solid fa-ellipsis"></i>
              </button>

            </div>


            <div className="teacher-empty-content small">

              <div className="teacher-empty-icon sky">
                <i className="fa-solid fa-list-check"></i>
              </div>

              <h3>
                No recent activity
              </h3>

              <p>
                Your recent activities will appear here.
              </p>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}