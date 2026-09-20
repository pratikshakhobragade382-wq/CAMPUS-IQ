import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axios";

import "./ParentDashboard.css";

export default function ParentDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switchingChild, setSwitchingChild] = useState(false);
  const [error, setError] = useState("");

  /* =========================================================
     LOAD PARENT DASHBOARD
  ========================================================= */

  const loadDashboard = useCallback(async (studentId = null) => {
    try {
      setError("");

      if (studentId) {
        setSwitchingChild(true);
      } else {
        setLoading(true);
      }

      const response = await axiosClient.get(
        "/dashboard/parent-summary",
        {
          params: studentId ? { studentId } : {},
        }
      );

      if (!response?.data?.success) {
        throw new Error(
          response?.data?.error ||
            response?.data?.message ||
            "Failed to load parent dashboard."
        );
      }

      setDashboard(response.data.data || null);
    } catch (err) {
      console.error(
        "Failed to load parent dashboard:",
        err
      );

      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
      setSwitchingChild(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /* =========================================================
     CHILD SWITCH
  ========================================================= */

  const handleChildChange = (event) => {
    const studentId = event.target.value;

    if (!studentId) {
      return;
    }

    loadDashboard(studentId);
  };

  /* =========================================================
     HELPERS
  ========================================================= */

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatExamDate = (value) => {
    if (!value) {
      return {
        day: "--",
        month: "",
      };
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return {
        day: "--",
        month: "",
      };
    }

    return {
      day: date.getDate(),
      month: date.toLocaleDateString("en-IN", {
        month: "short",
      }),
    };
  };

  const getAttendanceStatus = (item) => {
    if (item?.present) {
      return {
        label: "Present",
        className: "present",
      };
    }

    if (item?.late) {
      return {
        label: "Late",
        className: "late",
      };
    }

    if (item?.absent) {
      return {
        label: "Absent",
        className: "absent",
      };
    }

    return {
      label: "Not Marked",
      className: "not-marked",
    };
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="parent-dashboard-page">
        <div className="parent-dashboard-loading">
          <div className="parent-dashboard-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error && !dashboard) {
    return (
      <div className="parent-dashboard-page">
        <div className="parent-dashboard-error">
          <div className="parent-dashboard-error-icon">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>

          <h2>Unable to load dashboard</h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={() => loadDashboard()}
          >
            <i className="fa-solid fa-rotate-right"></i>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     DATA
  ========================================================= */

  const children = dashboard?.children || [];
  const profile = dashboard?.profile || {};
  const stats = dashboard?.stats || {};
  const todaySchedule = dashboard?.todaySchedule || [];
  const attendanceOverview =
    dashboard?.attendanceOverview || [];
  const upcomingExams = dashboard?.upcomingExams || [];
  const recentActivity =
    dashboard?.recentActivity || [];

  const activeStudentId =
    dashboard?.activeStudentId ||
    profile?.id ||
    "";

  const attendancePercentage = Number(
    stats?.attendancePercentage || 0
  );

  const studentName =
    profile?.name ||
    profile?.studentName ||
    "Student";

  const studentInitial = studentName
    .charAt(0)
    .toUpperCase();

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="parent-dashboard-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="parent-dashboard-header">

        <div className="parent-dashboard-title-area">
          <span className="parent-dashboard-eyebrow">
            PARENT PORTAL
          </span>

          <h1>Dashboard</h1>

          <p>
            Monitor your child's academic progress,
            attendance and upcoming activities.
          </p>
        </div>

        {children.length > 0 && (
          <div className="parent-child-selector">
            <label htmlFor="parent-child-select">
              Viewing Child
            </label>

            <select
              id="parent-child-select"
              value={String(activeStudentId)}
              onChange={handleChildChange}
              disabled={switchingChild}
            >
              {children.map((child) => (
                <option
                  key={child.id}
                  value={String(child.id)}
                >
                  {child.name ||
                    child.studentName ||
                    "Student"}
                </option>
              ))}
            </select>

            {switchingChild && (
              <span className="parent-child-switching">
                Updating...
              </span>
            )}
          </div>
        )}
      </div>

      {/* =====================================================
          INLINE ERROR
      ===================================================== */}

      {error && dashboard && (
        <div className="parent-dashboard-inline-error">
          <i className="fa-solid fa-circle-exclamation"></i>
          <span>{error}</span>
        </div>
      )}

      {/* =====================================================
          STUDENT PROFILE
      ===================================================== */}

      <section className="parent-student-card">

        <div className="parent-student-avatar">
          {profile?.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt={studentName}
            />
          ) : (
            studentInitial
          )}
        </div>

        <div className="parent-student-details">
          <span className="parent-section-label">
            STUDENT
          </span>

          <h2>{studentName}</h2>

          <p>
            Admission No:{" "}
            <strong>
              {profile?.admissionNo || "-"}
            </strong>
          </p>
        </div>

        <div className="parent-student-academic">

          <div className="parent-academic-item">
            <span>Class</span>
            <strong>
              {profile?.class || "-"}
            </strong>
          </div>

          <div className="parent-academic-divider"></div>

          <div className="parent-academic-item">
            <span>Section</span>
            <strong>
              {profile?.section || "-"}
            </strong>
          </div>

        </div>
      </section>

      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <section className="parent-stats-grid">

        {/* Attendance */}
        <div className="parent-stat-card">
          <div className="parent-stat-icon attendance">
            <i className="fa-solid fa-user-check"></i>
          </div>

          <div className="parent-stat-content">
            <span>Attendance</span>

            <strong>
              {attendancePercentage.toFixed(1)}%
            </strong>

            <small>
              Overall attendance
            </small>
          </div>
        </div>

        {/* Pending Assignments */}
        <div className="parent-stat-card">
          <div className="parent-stat-icon assignments">
            <i className="fa-solid fa-clipboard-list"></i>
          </div>

          <div className="parent-stat-content">
            <span>Pending Assignments</span>

            <strong>
              {stats?.pendingAssignments ?? 0}
            </strong>

            <small>
              Need attention
            </small>
          </div>
        </div>

        {/* Total Assignments */}
        <div className="parent-stat-card">
          <div className="parent-stat-icon total">
            <i className="fa-solid fa-book-open"></i>
          </div>

          <div className="parent-stat-content">
            <span>Total Assignments</span>

            <strong>
              {stats?.totalAssignments ?? 0}
            </strong>

            <small>
              Current academic data
            </small>
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="parent-stat-card">
          <div className="parent-stat-icon today">
            <i className="fa-solid fa-calendar-day"></i>
          </div>

          <div className="parent-stat-content">
            <span>Today's Status</span>

            <strong className="parent-today-status">
              {stats?.todayStatus || "Not Marked"}
            </strong>

            <small>
              Today's attendance
            </small>
          </div>
        </div>

      </section>

      {/* =====================================================
          CONTENT GRID
      ===================================================== */}

      <section className="parent-dashboard-grid">

        {/* ===================================================
            TODAY'S SCHEDULE
        =================================================== */}

        <div className="parent-dashboard-panel schedule-panel">

          <div className="parent-panel-header">

            <div>
              <span className="parent-panel-label">
                TODAY
              </span>

              <h3>Today's Schedule</h3>
            </div>

            <div className="parent-panel-icon">
              <i className="fa-solid fa-clock"></i>
            </div>

          </div>

          {todaySchedule.length === 0 ? (
            <div className="parent-empty-state">
              <i className="fa-regular fa-calendar-xmark"></i>

              <p>
                No classes scheduled for today.
              </p>
            </div>
          ) : (
            <div className="parent-schedule-list">

              {todaySchedule.map((item, index) => (
                <div
                  className="parent-schedule-item"
                  key={item?.id || index}
                >

                  <div className="parent-schedule-time">
                    <strong>
                      {item?.startTime || "--:--"}
                    </strong>

                    <span>
                      {item?.endTime || "--:--"}
                    </span>
                  </div>

                  <div className="parent-schedule-marker">
                    <span></span>
                  </div>

                  <div className="parent-schedule-info">

                    <strong>
                      {item?.subject || "Subject"}
                    </strong>

                    <span>
                      <i className="fa-solid fa-user-tie"></i>

                      {item?.teacher ||
                        "Teacher not assigned"}
                    </span>

                  </div>

                  <div className="parent-schedule-period">
                    {item?.period ||
                      `Period ${
                        item?.slotNo || index + 1
                      }`}
                  </div>

                </div>
              ))}

            </div>
          )}
        </div>

        {/* ===================================================
            ATTENDANCE
        =================================================== */}

        <div className="parent-dashboard-panel attendance-panel">

          <div className="parent-panel-header">

            <div>
              <span className="parent-panel-label">
                LAST 7 DAYS
              </span>

              <h3>Attendance</h3>
            </div>

            <div className="parent-panel-icon">
              <i className="fa-solid fa-chart-column"></i>
            </div>

          </div>

          {attendanceOverview.length === 0 ? (
            <div className="parent-empty-state">
              <i className="fa-solid fa-chart-simple"></i>

              <p>
                No attendance data available.
              </p>
            </div>
          ) : (
            <div className="parent-attendance-list">

              {attendanceOverview.map(
                (item, index) => {
                  const status =
                    getAttendanceStatus(item);

                  return (
                    <div
                      className="parent-attendance-row"
                      key={item?.date || index}
                    >

                      <div className="parent-attendance-date">
                        <strong>
                          {item?.name ||
                            formatDate(item?.date)}
                        </strong>

                        <span>
                          {formatDate(item?.date)}
                        </span>
                      </div>

                      <span
                        className={`parent-attendance-status ${status.className}`}
                      >
                        <span></span>
                        {status.label}
                      </span>

                    </div>
                  );
                }
              )}

            </div>
          )}
        </div>

        {/* ===================================================
            UPCOMING EXAMS
        =================================================== */}

        <div className="parent-dashboard-panel exams-panel">

          <div className="parent-panel-header">

            <div>
              <span className="parent-panel-label">
                ACADEMICS
              </span>

              <h3>Upcoming Exams</h3>
            </div>

            <div className="parent-panel-icon">
              <i className="fa-solid fa-file-lines"></i>
            </div>

          </div>

          {upcomingExams.length === 0 ? (
            <div className="parent-empty-state">
              <i className="fa-regular fa-calendar"></i>

              <p>
                No upcoming exams.
              </p>
            </div>
          ) : (
            <div className="parent-exam-list">

              {upcomingExams.map(
                (exam, index) => {
                  const examDate =
                    formatExamDate(
                      exam?.date ||
                        exam?.examDate ||
                        exam?.startDate
                    );

                  return (
                    <div
                      className="parent-exam-item"
                      key={exam?.id || index}
                    >

                      <div className="parent-exam-date">
                        <strong>
                          {examDate.day}
                        </strong>

                        <span>
                          {examDate.month}
                        </span>
                      </div>

                      <div className="parent-exam-details">

                        <strong>
                          {exam?.subject ||
                            exam?.examName ||
                            exam?.name ||
                            "Examination"}
                        </strong>

                        <span>
                          {exam?.examName ||
                            exam?.type ||
                            "Upcoming examination"}
                        </span>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}
        </div>

        {/* ===================================================
            RECENT ACTIVITY
        =================================================== */}

        <div className="parent-dashboard-panel activity-panel">

          <div className="parent-panel-header">

            <div>
              <span className="parent-panel-label">
                RECENT
              </span>

              <h3>Recent Activity</h3>
            </div>

            <div className="parent-panel-icon">
              <i className="fa-solid fa-bolt"></i>
            </div>

          </div>

          {recentActivity.length === 0 ? (
            <div className="parent-empty-state">
              <i className="fa-regular fa-bell"></i>

              <p>
                No recent activity.
              </p>
            </div>
          ) : (
            <div className="parent-activity-list">

              {recentActivity.map(
                (activity, index) => (
                  <div
                    className="parent-activity-item"
                    key={
                      activity?.id || index
                    }
                  >

                    <div className="parent-activity-icon">
                      <i className="fa-solid fa-circle-dot"></i>
                    </div>

                    <div className="parent-activity-content">

                      <strong>
                        {activity?.title ||
                          activity?.type ||
                          "Activity"}
                      </strong>

                      <p>
                        {activity?.description ||
                          activity?.message ||
                          activity?.text ||
                          "New activity available."}
                      </p>

                      <span>
                        {formatDate(
                          activity?.date ||
                            activity?.createdAt ||
                            activity?.timestamp
                        )}
                      </span>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>

      </section>

      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

      <section className="parent-quick-actions">

        <div className="parent-quick-actions-header">
          <div>
            <span className="parent-panel-label">
              QUICK ACCESS
            </span>

            <h3>Parent Services</h3>
          </div>
        </div>

        <div className="parent-quick-actions-grid">

          <button
            type="button"
            onClick={() =>
              navigate("/parent/attendance")
            }
          >
            <i className="fa-solid fa-user-check"></i>
            <span>Attendance</span>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/parent/assignments")
            }
          >
            <i className="fa-solid fa-clipboard-list"></i>
            <span>Assignments</span>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/parent/timetable")
            }
          >
            <i className="fa-solid fa-clock"></i>
            <span>Timetable</span>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/parent/exams")
            }
          >
            <i className="fa-solid fa-file-lines"></i>
            <span>Exams</span>
          </button>

        </div>

      </section>

    </div>
  );
}