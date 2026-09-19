import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  Calendar,
  CalendarCheck,
  CalendarDays,
  CalendarX,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  RefreshCw,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

import {
  getMyChildren,
  getChildAttendance,
} from "../api/parent.api";

import "./ParentAttendance.css";

/* ============================================================
   CONSTANTS
============================================================ */

const MONTHS = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1;
const currentYear = currentDate.getFullYear();

/* ============================================================
   PARENT ATTENDANCE PAGE
============================================================ */

export default function ParentAttendance() {
  /* --------------------------------------------------------
     STATE
  -------------------------------------------------------- */

  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [error, setError] = useState("");

  /* --------------------------------------------------------
     FETCH CHILDREN
  -------------------------------------------------------- */

  useEffect(() => {
    const fetchChildren = async () => {
      setChildrenLoading(true);

      try {
        const res = await getMyChildren();
        const list = res?.data || [];
        setChildren(list);

        if (list.length > 0) {
          setSelectedChild(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load children:", err);
        setError("Failed to load children list.");
      } finally {
        setChildrenLoading(false);
      }
    };

    fetchChildren();
  }, []);

  /* --------------------------------------------------------
     FETCH ATTENDANCE
  -------------------------------------------------------- */

  const fetchAttendance = useCallback(async () => {
    if (!selectedChild) return;

    setLoading(true);
    setError("");

    try {
      const res = await getChildAttendance(selectedChild, {
        month,
        year,
      });

      setAttendanceData(res?.data || null);
    } catch (err) {
      console.error("Failed to load attendance:", err);
      setError(
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load attendance data."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedChild, month, year]);

  useEffect(() => {
    if (selectedChild) {
      fetchAttendance();
    }
  }, [fetchAttendance, selectedChild]);

  /* --------------------------------------------------------
     COMPUTED VALUES
  -------------------------------------------------------- */

  const records = attendanceData?.records || [];
  const summary = attendanceData?.summary || {};

  const totalDays = summary.total || 0;
  const presentDays = summary.Present || summary.present || 0;
  const absentDays = summary.Absent || summary.absent || 0;
  const lateDays = summary.Late || summary.late || 0;

  const attendancePercent = totalDays > 0
    ? Math.round((presentDays / totalDays) * 100)
    : 0;

  const getPercentClass = () => {
    if (attendancePercent >= 90) return "excellent";
    if (attendancePercent >= 75) return "good";
    if (attendancePercent >= 50) return "average";
    return "poor";
  };

  /* --------------------------------------------------------
     CALENDAR DATA
  -------------------------------------------------------- */

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

    const recordMap = {};
    records.forEach((r) => {
      const d = new Date(r.date);
      const dayNum = d.getDate();
      recordMap[dayNum] = r;
    });

    const days = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ empty: true });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const record = recordMap[day];
      const isToday =
        day === currentDate.getDate() &&
        month === currentMonth &&
        year === currentYear;

      days.push({
        day,
        status: record?.status?.toLowerCase() || null,
        remark: record?.remark || null,
        isToday,
      });
    }

    return days;
  }, [records, month, year]);

  /* --------------------------------------------------------
     RING SVG CALCULATIONS
  -------------------------------------------------------- */

  const radius = 82;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${
    (attendancePercent / 100) * circumference
  } ${circumference}`;

  /* --------------------------------------------------------
     FORMAT DATE
  -------------------------------------------------------- */

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  /* --------------------------------------------------------
     YEAR OPTIONS
  -------------------------------------------------------- */

  const yearOptions = [];
  for (let y = currentYear; y >= currentYear - 5; y--) {
    yearOptions.push(y);
  }

  /* --------------------------------------------------------
     SELECTED CHILD NAME
  -------------------------------------------------------- */

  const selectedChildName = useMemo(() => {
    const child = children.find((c) => c.id === selectedChild);
    return child?.studentName || "Student";
  }, [children, selectedChild]);

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="parent-attendance-page">

      {/* ======================================================
          TOP HEADER
      ====================================================== */}

      <div className="attendance-topbar">
        <div>
          <span className="page-eyebrow">
            Parent Portal
          </span>

          <h1>Attendance</h1>

          <p>
            Track your child&apos;s daily attendance records,
            view monthly summaries, and monitor participation consistency.
          </p>
        </div>
      </div>

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="attendance-filters">

        {/* Child Selector */}
        {children.length > 1 && (
          <div className="filter-group">
            <label>Select Child</label>
            <div className="filter-select">
              <select
                value={selectedChild || ""}
                onChange={(e) =>
                  setSelectedChild(Number(e.target.value))
                }
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.studentName} — {child.class?.name || ""}
                    {child.section?.name
                      ? ` (${child.section.name})`
                      : ""}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="filter-select-arrow"
              />
            </div>
          </div>
        )}

        {/* Month */}
        <div className="filter-group">
          <label>Month</label>
          <div className="filter-select">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="filter-select-arrow"
            />
          </div>
        </div>

        {/* Year */}
        <div className="filter-group">
          <label>Year</label>
          <div className="filter-select">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="filter-select-arrow"
            />
          </div>
        </div>

      </div>

      {/* ======================================================
          LOADING
      ====================================================== */}

      {(loading || childrenLoading) && (
        <div className="attendance-loading">
          <div className="loading-spinner" />
          <p>Loading attendance data…</p>
        </div>
      )}

      {/* ======================================================
          ERROR
      ====================================================== */}

      {!loading && !childrenLoading && error && (
        <div className="attendance-error">
          <div className="attendance-error-icon">
            <AlertCircle size={28} />
          </div>
          <h3>Unable to Load</h3>
          <p>{error}</p>
          <button
            type="button"
            className="attendance-retry-btn"
            onClick={fetchAttendance}
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {/* ======================================================
          EMPTY — NO CHILDREN
      ====================================================== */}

      {!loading && !childrenLoading && !error && children.length === 0 && (
        <div className="attendance-empty">
          <div className="attendance-empty-icon">
            <Users size={36} />
          </div>
          <h3>No Children Found</h3>
          <p>
            No children are linked to your account yet.
            Contact the school administration for help.
          </p>
        </div>
      )}

      {/* ======================================================
          CONTENT
      ====================================================== */}

      {!loading && !childrenLoading && !error && selectedChild && (
        <>

          {/* ====================================================
              SUMMARY CARDS
          ==================================================== */}

          <div className="attendance-summary-grid">

            <div className="attendance-summary-card">
              <div className="summary-icon total">
                <CalendarDays size={20} />
              </div>
              <div className="summary-content">
                <span className="summary-label">Total Days</span>
                <span className="summary-value">{totalDays}</span>
                <span className="summary-subtitle">
                  {MONTHS[month - 1]} {year}
                </span>
              </div>
            </div>

            <div className="attendance-summary-card">
              <div className="summary-icon present">
                <CheckCircle2 size={20} />
              </div>
              <div className="summary-content">
                <span className="summary-label">Present</span>
                <span className="summary-value">{presentDays}</span>
                <span className="summary-subtitle">Days attended</span>
              </div>
            </div>

            <div className="attendance-summary-card">
              <div className="summary-icon absent">
                <XCircle size={20} />
              </div>
              <div className="summary-content">
                <span className="summary-label">Absent</span>
                <span className="summary-value">{absentDays}</span>
                <span className="summary-subtitle">Days missed</span>
              </div>
            </div>

            <div className="attendance-summary-card">
              <div className="summary-icon late">
                <Clock size={20} />
              </div>
              <div className="summary-content">
                <span className="summary-label">Late</span>
                <span className="summary-value">{lateDays}</span>
                <span className="summary-subtitle">Late arrivals</span>
              </div>
            </div>

            <div className="attendance-summary-card">
              <div className="summary-icon percentage">
                <UserCheck size={20} />
              </div>
              <div className="summary-content">
                <span className="summary-label">Attendance Rate</span>
                <span className="summary-value">
                  {totalDays > 0 ? `${attendancePercent}%` : "—"}
                </span>
                <span className="summary-subtitle">
                  Participation rate
                </span>
              </div>
            </div>

          </div>

          {/* ====================================================
              MAIN GRID — RING + CALENDAR
          ==================================================== */}

          <div className="attendance-main-grid">

            {/* Attendance Ring */}
            <div className="attendance-ring-card">

              <div className="ring-card-heading">
                <span className="page-eyebrow">
                  Overview
                </span>
                <h3>Attendance Rate</h3>
              </div>

              <div className="attendance-ring">
                <svg viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    className="ring-track"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    className={`ring-progress ${getPercentClass()}`}
                    strokeDasharray={strokeDasharray}
                  />
                </svg>

                <div className="ring-value">
                  <strong>
                    {totalDays > 0 ? `${attendancePercent}%` : "—"}
                  </strong>
                  <span>
                    {presentDays} / {totalDays} days
                  </span>
                </div>
              </div>

              <div className="ring-legend">
                <div className="ring-legend-item">
                  <div
                    className="ring-legend-dot"
                    style={{ background: "#16a34a" }}
                  />
                  Present ({presentDays})
                </div>
                <div className="ring-legend-item">
                  <div
                    className="ring-legend-dot"
                    style={{ background: "#dc2626" }}
                  />
                  Absent ({absentDays})
                </div>
                <div className="ring-legend-item">
                  <div
                    className="ring-legend-dot"
                    style={{ background: "#d97706" }}
                  />
                  Late ({lateDays})
                </div>
              </div>

            </div>

            {/* Calendar View */}
            <div className="attendance-calendar-card">

              <div className="calendar-heading">
                <div>
                  <span className="page-eyebrow">
                    Daily View
                  </span>
                  <h3>
                    {MONTHS[month - 1]} {year}
                  </h3>
                </div>
              </div>

              <div className="calendar-grid">

                {DAY_HEADERS.map((d) => (
                  <div key={d} className="calendar-day-header">
                    {d}
                  </div>
                ))}

                {calendarDays.map((day, i) => {
                  if (day.empty) {
                    return (
                      <div
                        key={`empty-${i}`}
                        className="calendar-day empty"
                      />
                    );
                  }

                  const statusClass = day.status || "";
                  const todayClass = day.isToday ? " today" : "";

                  return (
                    <div
                      key={day.day}
                      className={`calendar-day ${statusClass}${todayClass}`}
                    >
                      {day.day}

                      {day.status && (
                        <div className="calendar-day-tooltip">
                          {day.status.charAt(0).toUpperCase() +
                            day.status.slice(1)}
                          {day.remark ? ` — ${day.remark}` : ""}
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>

            </div>

          </div>

          {/* ====================================================
              RECORDS TABLE
          ==================================================== */}

          <div className="attendance-records-card">

            <div className="records-heading">
              <div>
                <span className="page-eyebrow">
                  Detailed Records
                </span>
                <h3>Attendance Log</h3>
              </div>

              <span className="records-count">
                {records.length} record{records.length !== 1 ? "s" : ""}
              </span>
            </div>

            {records.length > 0 ? (
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Status</th>
                    <th>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => {
                    const d = new Date(record.date);
                    const dayName = d.toLocaleDateString("en-IN", {
                      weekday: "long",
                    });
                    const statusLower =
                      (record.status || "").toLowerCase();

                    return (
                      <tr key={record.id}>
                        <td>{formatDate(record.date)}</td>
                        <td>{dayName}</td>
                        <td>
                          <span
                            className={`status-badge ${statusLower}`}
                          >
                            {statusLower === "present" && (
                              <CheckCircle2 size={12} />
                            )}
                            {statusLower === "absent" && (
                              <XCircle size={12} />
                            )}
                            {statusLower === "late" && (
                              <Clock size={12} />
                            )}
                            {record.status}
                          </span>
                        </td>
                        <td
                          style={{
                            color: record.remark
                              ? "#334155"
                              : "#cbd5e1",
                          }}
                        >
                          {record.remark || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="no-records-message">
                No attendance records found for {MONTHS[month - 1]}{" "}
                {year}.
              </div>
            )}

          </div>

        </>
      )}

    </div>
  );
}
