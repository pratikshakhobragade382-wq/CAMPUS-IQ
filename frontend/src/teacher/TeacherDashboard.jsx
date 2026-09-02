import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import TeacherTopbar from "./components/TeacherTopbar";
import { getTeacherDashboardSummary } from "../api/dashboard.api";
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

  // =========================================================
  // DASHBOARD DATA
  // =========================================================

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeacherDashboardSummary()
      .then((res) => {
        setSummary(res.data);
      })
      .catch((err) => {
        console.error(
          "Failed to load teacher dashboard:",
          err
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const stats = summary?.stats || {};

  const todaySchedule =
    summary?.todaySchedule || [];

  const upcomingClasses =
    summary?.upcomingClasses || [];

  const recentActivity =
    summary?.recentActivity || [];

  const attendanceOverview =
    summary?.attendanceOverview || [];

  // =========================================================
  // DATE
  // =========================================================

  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="teacher-panel">

      <TeacherTopbar />

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
            TEACHER PROFILE
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
                {loading
                  ? "…"
                  : stats.classesAssigned ?? 0}
              </strong>

              <small>
                Assigned classes
              </small>

            </div>

            <div className="teacher-stat-icon blue">
              <i className="fa-solid fa-book-open"></i>
            </div>

          </div>


          {/* My Students */}

          <div className="teacher-stat-card">

            <div className="teacher-stat-content">

              <span>
                My Students
              </span>

              <strong>
                {loading
                  ? "…"
                  : stats.studentsAssigned ?? 0}
              </strong>

              <small>
                Students assigned
              </small>

            </div>

            <div className="teacher-stat-icon green">
              <i className="fa-solid fa-user-graduate"></i>
            </div>

          </div>


          {/* Today's Attendance */}

          <div className="teacher-stat-card">

            <div className="teacher-stat-content">

              <span>
                Today's Attendance
              </span>

              <strong>
                {loading
                  ? "…"
                  : `${stats.todayAttendancePercentage ?? 0}%`}
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
                {loading
                  ? "…"
                  : stats.pendingAssignments ?? 0}
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


                {attendanceOverview.length > 0 ? (

                  <div className="teacher-attendance-bars">

                    {attendanceOverview.map((day) => {

                      const present =
                        Number(day.present) || 0;

                      const absent =
                        Number(day.absent) || 0;

                      const late =
                        Number(day.late) || 0;

                      const total =
                        present +
                        absent +
                        late;

                      const presentPercentage =
                        total > 0
                          ? Math.round(
                              (present / total) * 100
                            )
                          : 0;

                      const absentPercentage =
                        total > 0
                          ? Math.round(
                              (absent / total) * 100
                            )
                          : 0;

                      const latePercentage =
                        total > 0
                          ? Math.round(
                              (late / total) * 100
                            )
                          : 0;

                      return (

                        <div
                          className="teacher-attendance-day"
                          key={day.date}
                        >

                          {/* =================================
                              STACKED ATTENDANCE BAR
                          ================================== */}

                          <div className="teacher-attendance-bar-wrapper">

                            {/* Present */}

                            <div
                              className="teacher-attendance-bar present"
                              style={{
                                height: `${presentPercentage}%`,
                              }}
                              title={`${day.name}: ${present} Present (${presentPercentage}%)`}
                            ></div>


                            {/* Absent */}

                            <div
                              className="teacher-attendance-bar absent"
                              style={{
                                height: `${absentPercentage}%`,
                              }}
                              title={`${day.name}: ${absent} Absent (${absentPercentage}%)`}
                            ></div>


                            {/* Late */}

                            <div
                              className="teacher-attendance-bar late"
                              style={{
                                height: `${latePercentage}%`,
                              }}
                              title={`${day.name}: ${late} Late (${latePercentage}%)`}
                            ></div>

                          </div>


                          {/* Present percentage */}

                          <span className="teacher-attendance-percentage">
                            {presentPercentage}% Present
                          </span>


                          {/* Day name */}

                          <span className="teacher-attendance-day-name">
                            {day.name}
                          </span>

                        </div>

                      );

                    })}

                  </div>

                ) : (

                  <div className="teacher-chart-empty">

                    <i className="fa-solid fa-chart-line"></i>

                    <span>
                      Attendance data will appear here
                    </span>

                  </div>

                )}

              </div>

            </div>


            {/* =================================================
                ATTENDANCE LEGEND
            ================================================== */}

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


            {!loading && todaySchedule.length > 0 ? (

              <div className="teacher-schedule-list">

                {todaySchedule.map((item) => (

                  <div
                    className="teacher-schedule-item"
                    key={item.id}
                  >

                    <div className="teacher-schedule-time">
                      {item.startTime} - {item.endTime}
                    </div>

                    <div className="teacher-schedule-info">

                      <strong>
                        {item.subject}
                      </strong>

                      <span>
                        {item.class}
                        {item.section
                          ? ` - ${item.section}`
                          : ""}
                      </span>

                    </div>

                  </div>

                ))}

              </div>

            ) : (

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

            )}

          </div>

        </section>


        {/* ===================================================
            BOTTOM DASHBOARD GRID
        ==================================================== */}

        <section className="teacher-bottom-grid">

          {/* =================================================
              UPCOMING CLASSES
          ================================================== */}

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


            {!loading && upcomingClasses.length > 0 ? (

              <div className="teacher-schedule-list">

                {upcomingClasses.map((item) => (

                  <div
                    className="teacher-schedule-item"
                    key={item.id}
                  >

                    <div className="teacher-schedule-time">

                      {item.startTime} - {item.endTime}

                    </div>

                    <div className="teacher-schedule-info">

                      <strong>
                        {item.subject}
                      </strong>

                      <span>
                        {item.class}
                        {item.section
                          ? ` - ${item.section}`
                          : ""}
                      </span>

                    </div>

                  </div>

                ))}

              </div>

            ) : (

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

            )}

          </div>


          {/* =================================================
              RECENT ACTIVITY
          ================================================== */}

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


            {!loading && recentActivity.length > 0 ? (

              <div className="teacher-schedule-list">

                {recentActivity.map((activity) => (

                  <div
                    className="teacher-schedule-item"
                    key={activity.id}
                  >

                    <div className="teacher-schedule-time">

                      {new Date(
                        activity.date
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}

                    </div>

                    <div className="teacher-schedule-info">

                      <strong>
                        {activity.title}
                      </strong>

                      <span>
                        {activity.description}
                      </span>

                    </div>

                  </div>

                ))}

              </div>

            ) : (

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

            )}

          </div>

        </section>

      </main>

    </div>
  );
}
