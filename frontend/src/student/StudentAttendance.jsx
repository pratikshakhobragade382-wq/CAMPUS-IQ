import { useState, useEffect, useCallback } from "react";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Calendar,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";

import { getMyAttendance } from "../api/studentPortal.api";
import "./StudentAttendance.css";

/* ============================================================
   HELPERS
============================================================ */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getYearRange() {
  const now = new Date();
  const years = [];
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) {
    years.push(y);
  }
  return years;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDayName(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", { weekday: "long" });
}

function buildCalendar(year, month, records) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();

  const statusMap = {};
  records.forEach((r) => {
    const d = new Date(r.date);
    statusMap[d.getDate()] = r.status;
  });

  const cells = [];

  // empty leading cells
  for (let i = 0; i < firstDay; i++) {
    cells.push({ type: "empty", key: `e-${i}` });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const isToday =
      today.getFullYear() === year &&
      today.getMonth() + 1 === month &&
      today.getDate() === day;

    cells.push({
      type: "day",
      day,
      status: statusMap[day] || null,
      isToday,
      key: `d-${day}`,
    });
  }

  return cells;
}

/* ============================================================
   COMPONENT
============================================================ */

export default function StudentAttendance() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyAttendance({ month, year });
      setData(res.data);
    } catch (err) {
      setError(
        err?.response?.data?.error || err?.message || "Failed to load attendance."
      );
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* --------------------------------------------------------
     DERIVED
  -------------------------------------------------------- */

  const summary = data?.summary || {};
  const records = data?.records || [];
  const total = summary.total || 0;
  const present = summary.present || 0;
  const absent = summary.absent || 0;
  const late = summary.late || 0;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  const ringClass =
    pct >= 90 ? "excellent" : pct >= 75 ? "good" : pct >= 50 ? "average" : "poor";

  const circumference = 2 * Math.PI * 80;
  const strokeDash = total > 0 ? (present / total) * circumference : 0;

  const calendarCells = buildCalendar(year, month, records);

  /* --------------------------------------------------------
     LOADING STATE
  -------------------------------------------------------- */

  if (loading) {
    return (
      <div className="student-attendance-page">
        <div className="student-att-loading">
          <div className="student-att-spinner" />
          <p>Loading attendance…</p>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------
     ERROR STATE
  -------------------------------------------------------- */

  if (error) {
    return (
      <div className="student-attendance-page">
        <div className="student-att-error">
          <div className="student-att-error-icon">
            <AlertTriangle size={28} />
          </div>
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button className="student-att-retry-btn" onClick={fetchData}>
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------
     MAIN RENDER
  -------------------------------------------------------- */

  return (
    <div className="student-attendance-page">

      {/* ================================================
          HEADER
      ================================================ */}

      <div className="student-att-header">
        <div className="student-att-title-row">
          <div className="student-att-title-icon">
            <ClipboardCheck size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h2>My Attendance</h2>
            <p>Track your attendance records and presence</p>
          </div>
        </div>

        <div className="student-att-header-actions">
          <button
            className="student-att-refresh-btn"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ================================================
          FILTERS
      ================================================ */}

      <div className="student-att-filters">
        <div className="student-att-filter-group">
          <label>Month</label>
          <div className="student-att-filter-select">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <ChevronDown
              className="student-att-filter-arrow"
              size={15}
            />
          </div>
        </div>

        <div className="student-att-filter-group">
          <label>Year</label>
          <div className="student-att-filter-select">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {getYearRange().map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown
              className="student-att-filter-arrow"
              size={15}
            />
          </div>
        </div>
      </div>

      {/* ================================================
          SUMMARY CARDS
      ================================================ */}

      <div className="student-att-summary-grid">
        <div className="student-att-summary-card">
          <div className="student-att-summary-icon total">
            <CalendarDays size={20} />
          </div>
          <div className="student-att-summary-content">
            <span className="student-att-summary-label">Total Days</span>
            <strong className="student-att-summary-value">{total}</strong>
            <span className="student-att-summary-sub">{MONTHS[month - 1]} {year}</span>
          </div>
        </div>

        <div className="student-att-summary-card">
          <div className="student-att-summary-icon present">
            <CheckCircle2 size={20} />
          </div>
          <div className="student-att-summary-content">
            <span className="student-att-summary-label">Present</span>
            <strong className="student-att-summary-value">{present}</strong>
            <span className="student-att-summary-sub">Days attended</span>
          </div>
        </div>

        <div className="student-att-summary-card">
          <div className="student-att-summary-icon absent">
            <XCircle size={20} />
          </div>
          <div className="student-att-summary-content">
            <span className="student-att-summary-label">Absent</span>
            <strong className="student-att-summary-value">{absent}</strong>
            <span className="student-att-summary-sub">Days missed</span>
          </div>
        </div>

        <div className="student-att-summary-card">
          <div className="student-att-summary-icon late">
            <Clock size={20} />
          </div>
          <div className="student-att-summary-content">
            <span className="student-att-summary-label">Late</span>
            <strong className="student-att-summary-value">{late}</strong>
            <span className="student-att-summary-sub">Arrived late</span>
          </div>
        </div>

        <div className="student-att-summary-card">
          <div className="student-att-summary-icon percentage">
            <TrendingUp size={20} />
          </div>
          <div className="student-att-summary-content">
            <span className="student-att-summary-label">Attendance %</span>
            <strong className="student-att-summary-value">{pct}%</strong>
            <span className="student-att-summary-sub">
              {pct >= 90 ? "Excellent" : pct >= 75 ? "Good" : pct >= 50 ? "Needs improvement" : "Critical"}
            </span>
          </div>
        </div>
      </div>

      {/* ================================================
          RING + CALENDAR
      ================================================ */}

      <div className="student-att-main-grid">

        {/* RING */}
        <div className="student-att-ring-card">
          <div className="student-att-ring-heading">
            <h3>Attendance Overview</h3>
          </div>

          <div className="student-att-ring">
            <svg viewBox="0 0 180 180">
              <circle
                className="student-att-ring-track"
                cx="90" cy="90" r="80"
              />
              <circle
                className={`student-att-ring-progress ${ringClass}`}
                cx="90" cy="90" r="80"
                strokeDasharray={`${strokeDash} ${circumference}`}
              />
            </svg>
            <div className="student-att-ring-value">
              <strong>{pct}%</strong>
              <span>Attendance</span>
            </div>
          </div>

          <div className="student-att-ring-legend">
            <div className="student-att-ring-legend-item">
              <div className="student-att-ring-dot" style={{ background: "#16a34a" }} />
              Present ({present})
            </div>
            <div className="student-att-ring-legend-item">
              <div className="student-att-ring-dot" style={{ background: "#dc2626" }} />
              Absent ({absent})
            </div>
            <div className="student-att-ring-legend-item">
              <div className="student-att-ring-dot" style={{ background: "#d97706" }} />
              Late ({late})
            </div>
          </div>
        </div>

        {/* CALENDAR */}
        <div className="student-att-calendar-card">
          <div className="student-att-calendar-heading">
            <h3>
              <Calendar size={16} style={{ marginRight: 6, verticalAlign: "-2px" }} />
              {MONTHS[month - 1]} {year}
            </h3>
          </div>

          <div className="student-att-calendar-grid">
            {DAY_LABELS.map((d) => (
              <div className="student-att-cal-day-header" key={d}>{d}</div>
            ))}

            {calendarCells.map((cell) => {
              if (cell.type === "empty") {
                return <div className="student-att-cal-day empty" key={cell.key} />;
              }

              const cls = [
                "student-att-cal-day",
                cell.status || "",
                cell.isToday ? "today" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div className={cls} key={cell.key}>
                  {cell.day}
                  {cell.status && (
                    <div className="student-att-cal-tooltip">
                      {cell.status.charAt(0).toUpperCase() + cell.status.slice(1)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================================================
          RECORDS TABLE
      ================================================ */}

      <div className="student-att-records-card">
        <div className="student-att-records-heading">
          <h3>Attendance Records</h3>
          <span className="student-att-records-count">{records.length} records</span>
        </div>

        {records.length === 0 ? (
          <div className="student-att-no-records">
            No attendance records found for {MONTHS[month - 1]} {year}.
          </div>
        ) : (
          <table className="student-att-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Status</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.date)}</td>
                  <td>{getDayName(r.date)}</td>
                  <td>
                    <span className={`student-att-status-badge ${r.status}`}>
                      {r.status === "present" && <CheckCircle2 size={12} />}
                      {r.status === "absent" && <XCircle size={12} />}
                      {r.status === "late" && <Clock size={12} />}
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </td>
                  <td>{r.remark || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
