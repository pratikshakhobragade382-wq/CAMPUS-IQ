import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  GraduationCap,
  MessageSquareWarning,
  RefreshCw,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import axiosClient from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

import "./StudentDashboard.css";

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "";

  const text = String(value);

  if (/^\d{1,2}:\d{2}/.test(text)) {
    return text.slice(0, 5);
  }

  return text;
};

const statusLabel = (status) => {
  if (!status) return "Not marked";

  return String(status)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const activityIcon = (type) => {
  if (type === "attendance") return <ClipboardCheck size={18} />;
  if (type === "assignment") return <BookOpen size={18} />;
  if (type === "exam") return <FileText size={18} />;

  return <Activity size={18} />;
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await axiosClient.get("/dashboard/student-summary");

      const data = response?.data?.data || response?.data || null;

      setDashboard(data);
    } catch (error) {
      console.error("Student dashboard error:", error);

      toast.error(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Could not load your dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const profile = dashboard?.profile || {};

  const stats = dashboard?.stats || {};

  const todaySchedule = Array.isArray(dashboard?.todaySchedule)
    ? dashboard.todaySchedule
    : [];

  const upcomingExams = Array.isArray(dashboard?.upcomingExams)
    ? dashboard.upcomingExams
    : [];

  const recentActivity = Array.isArray(dashboard?.recentActivity)
    ? dashboard.recentActivity
    : [];

  const attendanceOverview = Array.isArray(dashboard?.attendanceOverview)
    ? dashboard.attendanceOverview
    : [];

  const attendancePercentage = Number(stats.attendancePercentage || 0);

  const greetingName =
    profile.name ||
    user?.student?.studentName ||
    user?.name ||
    user?.fullName ||
    "Student";

  const classText = useMemo(() => {
    if (profile.class && profile.section) {
      return `${profile.class} - ${profile.section}`;
    }

    return profile.class || profile.section || "Class not assigned";
  }, [profile.class, profile.section]);

  if (loading) {
    return (
      <div className="student-dashboard-page">
        <div className="student-dashboard-loading">
          <div className="student-dashboard-spinner">
            <RefreshCw size={28} />
          </div>

          <h3>Loading your dashboard...</h3>
          <p>Fetching your latest academic information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard-page">
      {/* HEADER */}
      <section className="student-dashboard-header">
        <div>
          <span className="student-dashboard-eyebrow">
            <GraduationCap size={16} />
            Student Portal
          </span>

          <h1>
            Welcome back,{" "}
            <span>{greetingName.split(" ")[0]}</span> 👋
          </h1>

          <p>
            Here&apos;s what&apos;s happening with your academics today.
          </p>
        </div>

        <button
          type="button"
          className="student-refresh-btn"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "student-spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      {/* PROFILE CARD */}
      <section className="student-welcome-card">
        <div className="student-welcome-left">
          <div className="student-avatar">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.name || "Student"}
              />
            ) : (
              <UserRound size={34} />
            )}
          </div>

          <div>
            <span className="student-welcome-label">Your Profile</span>

            <h2>{profile.name || greetingName}</h2>

            <p>
              Admission No:{" "}
              <strong>{profile.admissionNo || "—"}</strong>
            </p>
          </div>
        </div>

        <div className="student-profile-meta">
          <div>
            <span>Class</span>
            <strong>{classText}</strong>
          </div>

          <div>
            <span>Today</span>
            <strong>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                day: "2-digit",
                month: "short",
              })}
            </strong>
          </div>
        </div>
      </section>

      {/* STAT CARDS */}
      <section className="student-stat-grid">
        <div className="student-stat-card attendance">
          <div className="student-stat-icon">
            <ClipboardCheck size={22} />
          </div>

          <div className="student-stat-content">
            <span>Attendance</span>
            <strong>{attendancePercentage}%</strong>

            <small>
              {stats.todayStatus
                ? `Today: ${statusLabel(stats.todayStatus)}`
                : "Today not marked"}
            </small>
          </div>

          <div className="student-stat-progress">
            <div
              style={{
                width: `${Math.min(
                  Math.max(attendancePercentage, 0),
                  100
                )}%`,
              }}
            />
          </div>
        </div>

        <div className="student-stat-card assignments">
          <div className="student-stat-icon">
            <BookOpen size={22} />
          </div>

          <div className="student-stat-content">
            <span>Pending Assignments</span>
            <strong>{stats.pendingAssignments || 0}</strong>

            <small>
              {stats.totalAssignments || 0} total assignments
            </small>
          </div>
        </div>

        <div className="student-stat-card exams">
          <div className="student-stat-icon">
            <FileText size={22} />
          </div>

          <div className="student-stat-content">
            <span>Upcoming Exams</span>
            <strong>{upcomingExams.length}</strong>

            <small>Stay prepared</small>
          </div>
        </div>

        <div className="student-stat-card complaints">
          <div className="student-stat-icon">
            <MessageSquareWarning size={22} />
          </div>

          <div className="student-stat-content">
            <span>Need Help?</span>
            <strong>Complaints</strong>

            <small>Raise an issue with school</small>
          </div>

          <button
            type="button"
            onClick={() => navigate("/student/complaints")}
            className="student-stat-link"
          >
            Open <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* MAIN GRID */}
      <section className="student-dashboard-main-grid">
        {/* TODAY'S SCHEDULE */}
        <div className="student-dashboard-card schedule-card">
          <div className="student-card-header">
            <div>
              <span className="student-card-kicker">
                <CalendarDays size={16} />
                Today
              </span>

              <h3>Today&apos;s Schedule</h3>
            </div>

            <button
              type="button"
              onClick={() => navigate("/student/timetable")}
              className="student-view-btn"
            >
              View timetable <ArrowRight size={15} />
            </button>
          </div>

          {todaySchedule.length === 0 ? (
            <div className="student-empty-state">
              <CalendarDays size={30} />
              <h4>No classes scheduled</h4>
              <p>Your timetable has no classes for today.</p>
            </div>
          ) : (
            <div className="student-schedule-list">
              {todaySchedule.map((item, index) => (
                <div
                  className="student-schedule-item"
                  key={item.id || `${item.subject}-${index}`}
                >
                  <div className="student-period-number">
                    {item.slotNo || index + 1}
                  </div>

                  <div className="student-schedule-time">
                    <strong>
                      {formatTime(item.startTime)}
                    </strong>

                    <span>
                      {formatTime(item.endTime)}
                    </span>
                  </div>

                  <div className="student-schedule-subject">
                    <strong>{item.subject || "Subject"}</strong>

                    <span>
                      {item.teacher || "Teacher not assigned"}
                    </span>
                  </div>

                  <div className="student-schedule-status">
                    <Clock3 size={15} />
                    Period {item.period || index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ATTENDANCE */}
        <div className="student-dashboard-card attendance-card">
          <div className="student-card-header">
            <div>
              <span className="student-card-kicker">
                <TrendingUp size={16} />
                Weekly
              </span>

              <h3>Attendance Overview</h3>
            </div>

            <span className="student-percentage-pill">
              {attendancePercentage}%
            </span>
          </div>

          <div className="student-attendance-chart">
            {attendanceOverview.length === 0 ? (
              <div className="student-mini-empty">
                No attendance records available.
              </div>
            ) : (
              attendanceOverview.map((day) => {
                const total =
                  Number(day.present || 0) +
                  Number(day.absent || 0) +
                  Number(day.late || 0);

                const presentHeight =
                  total > 0
                    ? Math.max(
                        10,
                        (Number(day.present || 0) / total) * 100
                      )
                    : 8;

                return (
                  <div
                    className="student-attendance-day"
                    key={`${day.date}-${day.name}`}
                  >
                    <div className="student-attendance-bar">
                      <div
                        className="student-attendance-fill"
                        style={{
                          height: `${presentHeight}%`,
                        }}
                      />
                    </div>

                    <span>{day.name?.slice(0, 3)}</span>

                    <small>{day.present || 0}P</small>
                  </div>
                );
              })
            )}
          </div>

          <div className="student-attendance-legend">
            <span>
              <i className="legend-present" />
              Present
            </span>

            <span>
              <i className="legend-absent" />
              Absent
            </span>

            <span>
              <i className="legend-late" />
              Late
            </span>
          </div>
        </div>

        {/* UPCOMING EXAMS */}
        <div className="student-dashboard-card exams-card">
          <div className="student-card-header">
            <div>
              <span className="student-card-kicker">
                <FileText size={16} />
                Academics
              </span>

              <h3>Upcoming Exams</h3>
            </div>

            <button
              type="button"
              onClick={() => navigate("/student/exams")}
              className="student-view-btn"
            >
              View all <ArrowRight size={15} />
            </button>
          </div>

          {upcomingExams.length === 0 ? (
            <div className="student-empty-state compact">
              <CheckCircle2 size={30} />
              <h4>No upcoming exams</h4>
              <p>You&apos;re all caught up for now.</p>
            </div>
          ) : (
            <div className="student-exam-list">
              {upcomingExams.slice(0, 5).map((exam) => (
                <div
                  className="student-exam-item"
                  key={exam.id}
                >
                  <div className="student-exam-icon">
                    <FileText size={19} />
                  </div>

                  <div className="student-exam-info">
                    <strong>{exam.name || "Exam"}</strong>

                    <span>
                      {exam.examType || "Examination"}
                    </span>
                  </div>

                  <div className="student-exam-date">
                    <strong>
                      {formatDate(exam.startDate)}
                    </strong>

                    <span>
                      {exam.class?.name ||
                        exam.className ||
                        "Your class"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RECENT ACTIVITY */}
        <div className="student-dashboard-card activity-card">
          <div className="student-card-header">
            <div>
              <span className="student-card-kicker">
                <Activity size={16} />
                Updates
              </span>

              <h3>Recent Activity</h3>
            </div>
          </div>

          {recentActivity.length === 0 ? (
            <div className="student-empty-state compact">
              <Activity size={30} />
              <h4>No recent activity</h4>
              <p>Your latest activities will appear here.</p>
            </div>
          ) : (
            <div className="student-activity-list">
              {recentActivity.map((activity) => (
                <div
                  className="student-activity-item"
                  key={activity.id}
                >
                  <div className="student-activity-icon">
                    {activityIcon(activity.type)}
                  </div>

                  <div className="student-activity-content">
                    <strong>{activity.title}</strong>

                    <span>
                      {activity.description}
                    </span>
                  </div>

                  <time>
                    {formatDate(activity.date)}
                  </time>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="student-quick-section">
        <div className="student-section-heading">
          <div>
            <span>Quick Access</span>
            <h3>What would you like to do?</h3>
          </div>
        </div>

        <div className="student-quick-grid">
          <button
            type="button"
            onClick={() => navigate("/student/assignments")}
          >
            <BookOpen size={22} />
            <div>
              <strong>Assignments</strong>
              <span>Check your pending work</span>
            </div>
            <ArrowRight size={18} />
          </button>

          <button
            type="button"
            onClick={() => navigate("/student/exams")}
          >
            <FileText size={22} />
            <div>
              <strong>Exams & Results</strong>
              <span>View exams and results</span>
            </div>
            <ArrowRight size={18} />
          </button>

          <button
            type="button"
            onClick={() => navigate("/student/performance")}
          >
            <TrendingUp size={22} />
            <div>
              <strong>Performance</strong>
              <span>Track your academic progress</span>
            </div>
            <ArrowRight size={18} />
          </button>

          <button
            type="button"
            onClick={() => navigate("/student/complaints")}
          >
            <MessageSquareWarning size={22} />
            <div>
              <strong>Raise Complaint</strong>
              <span>Report an issue to school</span>
            </div>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ERROR / EMPTY DATA NOTE */}
      {!dashboard && (
        <div className="student-dashboard-error">
          <AlertCircle size={20} />
          <div>
            <strong>Dashboard data unavailable</strong>
            <p>
              Please refresh the page or try again in a moment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}