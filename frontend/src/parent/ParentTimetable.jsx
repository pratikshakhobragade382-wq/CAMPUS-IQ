import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Clock,
  Coffee,
  RefreshCw,
  User,
} from "lucide-react";

import axiosClient from "../api/axios";
import "./ParentTimetable.css";

/*
============================================================
 CONSTANTS
============================================================
*/

const DAYS = [
  { id: 1, label: "Monday", short: "Mon" },
  { id: 2, label: "Tuesday", short: "Tue" },
  { id: 3, label: "Wednesday", short: "Wed" },
  { id: 4, label: "Thursday", short: "Thu" },
  { id: 5, label: "Friday", short: "Fri" },
  { id: 6, label: "Saturday", short: "Sat" },
];

const CLASS_SLOT_TYPES = ["period", "sports"];

const COLOR_COUNT = 8;

/*
============================================================
 HELPERS
============================================================
*/

function getErrorMessage(err, fallback) {
  if (err?.code === "ECONNABORTED") {
    return "The request timed out. Please try again.";
  }

  return (
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}

function formatTime(value) {
  if (!value) return "";

  const match = String(value).match(/^(\d{1,2}):(\d{2})/);

  if (!match) return String(value);

  let hours = Number(match[1]);
  const minutes = match[2];
  const suffix = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;

  return `${hours}:${minutes} ${suffix}`;
}

function formatRange(start, end) {
  return [formatTime(start), formatTime(end)]
    .filter(Boolean)
    .join(" – ");
}

function isBreakSlot(slot) {
  return !CLASS_SLOT_TYPES.includes(slot.slotType);
}

function getInitial(name) {
  return (name || "?").trim().charAt(0).toUpperCase();
}

/*
 * Turns the flat backend list into rows (time slots),
 * days and a lookup of cells: "dayOfWeek-periodSlotId" -> entries[]
 */
function buildTimetable(entries, slots) {
  const slotMap = new Map();

  slots.forEach((slot) => {
    slotMap.set(slot.id, {
      id: slot.id,
      slotNo: slot.slotNo,
      label: slot.label,
      slotType: slot.slotType,
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
  });

  const cells = {};

  entries.forEach((entry) => {
    const slotInfo = entry.periodSlot || {};

    // Slot missing from the slot list (or the list failed to load)
    if (!slotMap.has(entry.periodSlotId)) {
      slotMap.set(entry.periodSlotId, {
        id: entry.periodSlotId,
        slotNo: slotInfo.slotNo ?? 0,
        label: slotInfo.label || `Period ${slotInfo.slotNo ?? ""}`.trim(),
        slotType: "period",
        startTime: slotInfo.startTime,
        endTime: slotInfo.endTime,
      });
    }

    const key = `${entry.dayOfWeek}-${entry.periodSlotId}`;

    if (!cells[key]) cells[key] = [];

    cells[key].push(entry);
  });

  const rows = Array.from(slotMap.values()).sort(
    (a, b) => a.slotNo - b.slotNo
  );

  const hasSaturday = entries.some((entry) => entry.dayOfWeek === 6);

  return {
    rows,
    cells,
    days: hasSaturday ? DAYS : DAYS.slice(0, 5),
  };
}

/*
============================================================
 SMALL COMPONENTS
============================================================
*/

function PeriodCard({ entry }) {
  const subjectId = entry.subject?.id ?? entry.subjectId ?? 0;

  return (
    <div className={`pt-card pt-color-${subjectId % COLOR_COUNT}`}>
      <span className="pt-card-subject">
        {entry.subject?.name || "Subject"}
      </span>

      {entry.staff?.name && (
        <span className="pt-card-teacher">
          <User size={12} />
          {entry.staff.name}
        </span>
      )}
    </div>
  );
}

function Loader({ text }) {
  return (
    <div className="pt-state" role="status">
      <div className="pt-spinner" />
      <p>{text}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="pt-state pt-state-error" role="alert">
      <AlertCircle size={32} />
      <p>{message}</p>

      <button
        type="button"
        className="pt-btn"
        onClick={onRetry}
      >
        <RefreshCw size={14} />
        Try again
      </button>
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="pt-state">
      <Calendar size={32} />
      <h4>{title}</h4>
      <p>{text}</p>
    </div>
  );
}

/*
============================================================
 PAGE
============================================================
*/

export default function ParentTimetable() {
  const [children, setChildren] = useState([]);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [childrenError, setChildrenError] = useState("");
  const [selectedChildId, setSelectedChildId] = useState(null);

  const [slots, setSlots] = useState([]);

  const [entries, setEntries] = useState([]);
  const [ttLoading, setTtLoading] = useState(false);
  const [ttError, setTtError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const todayId = useMemo(() => {
    const day = new Date().getDay(); // 0 = Sunday
    return day === 0 ? null : day;
  }, []);

  const [selectedDay, setSelectedDay] = useState(todayId || 1);

  /* --------------------------------------------------------
     LOAD CHILDREN
  -------------------------------------------------------- */

  const loadChildren = useCallback(async () => {
    setChildrenLoading(true);
    setChildrenError("");

    try {
      const response = await axiosClient.get("/parents/children");

      const list = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];

      setChildren(list);

      setSelectedChildId((previous) =>
        previous && list.some((child) => child.id === previous)
          ? previous
          : list[0]?.id ?? null
      );
    } catch (err) {
      setChildrenError(
        getErrorMessage(err, "Unable to load your children.")
      );
    } finally {
      setChildrenLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  /* --------------------------------------------------------
     LOAD TIME SLOTS (optional - used for Recess / Lunch rows)
  -------------------------------------------------------- */

  useEffect(() => {
    let ignore = false;

    const loadSlots = async () => {
      try {
        const response = await axiosClient.get(
          "/timetable/period-slots"
        );

        if (!ignore) {
          setSlots(
            Array.isArray(response?.data?.data)
              ? response.data.data
              : []
          );
        }
      } catch {
        // Non-fatal: rows are derived from the timetable entries.
      }
    };

    loadSlots();

    return () => {
      ignore = true;
    };
  }, []);

  /* --------------------------------------------------------
     LOAD SELECTED CHILD TIMETABLE
  -------------------------------------------------------- */

  useEffect(() => {
    if (!selectedChildId) {
      setEntries([]);
      return undefined;
    }

    let ignore = false;

    const loadTimetable = async () => {
      setTtLoading(true);
      setTtError("");

      try {
        const response = await axiosClient.get(
          `/parents/children/${selectedChildId}/timetable`
        );

        if (ignore) return;

        setEntries(
          Array.isArray(response?.data?.data)
            ? response.data.data
            : []
        );
      } catch (err) {
        if (ignore) return;

        setEntries([]);
        setTtError(
          getErrorMessage(err, "Unable to load the timetable.")
        );
      } finally {
        if (!ignore) setTtLoading(false);
      }
    };

    loadTimetable();

    return () => {
      ignore = true;
    };
  }, [selectedChildId, reloadKey]);

  /* --------------------------------------------------------
     DERIVED DATA
  -------------------------------------------------------- */

  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId),
    [children, selectedChildId]
  );

  const { rows, cells, days } = useMemo(
    () => buildTimetable(entries, slots),
    [entries, slots]
  );

  const stats = useMemo(
    () => ({
      periods: entries.length,
      subjects: new Set(
        entries.map((e) => e.subject?.id ?? e.subjectId)
      ).size,
      teachers: new Set(
        entries.map((e) => e.staff?.id ?? e.staffId)
      ).size,
    }),
    [entries]
  );

  const activeDay = days.some((day) => day.id === selectedDay)
    ? selectedDay
    : days[0].id;

  const activeDayHasClasses = entries.some(
    (entry) => entry.dayOfWeek === activeDay
  );

  /* --------------------------------------------------------
     RENDER HELPERS
  -------------------------------------------------------- */

  const renderWeekly = () => (
    <div className="pt-week">
      <div className="pt-table-wrap">
        <table className="pt-table">
          <thead>
            <tr>
              <th className="pt-th-time">Time</th>

              {days.map((day) => (
                <th
                  key={day.id}
                  className={todayId === day.id ? "pt-today" : ""}
                >
                  {day.label}
                  {todayId === day.id && (
                    <span className="pt-today-tag">Today</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((slot) =>
              isBreakSlot(slot) ? (
                <tr key={slot.id} className="pt-break-row">
                  <td colSpan={days.length + 1}>
                    <Coffee size={14} />
                    <strong>{slot.label}</strong>
                    <span>
                      {formatRange(slot.startTime, slot.endTime)}
                    </span>
                  </td>
                </tr>
              ) : (
                <tr key={slot.id}>
                  <td className="pt-time-cell">
                    <strong>{slot.label}</strong>
                    <span>
                      {formatRange(slot.startTime, slot.endTime)}
                    </span>
                  </td>

                  {days.map((day) => {
                    const items = cells[`${day.id}-${slot.id}`] || [];

                    return (
                      <td
                        key={day.id}
                        className={
                          todayId === day.id ? "pt-cell-today" : ""
                        }
                      >
                        {items.length > 0 ? (
                          items.map((entry) => (
                            <PeriodCard key={entry.id} entry={entry} />
                          ))
                        ) : (
                          <span className="pt-free">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDaily = () => (
    <div className="pt-day">
      <div className="pt-day-tabs" role="tablist">
        {days.map((day) => (
          <button
            key={day.id}
            type="button"
            role="tab"
            aria-selected={activeDay === day.id}
            className={`pt-day-tab ${
              activeDay === day.id ? "active" : ""
            }`}
            onClick={() => setSelectedDay(day.id)}
          >
            {day.short}
            {todayId === day.id && <i className="pt-dot" />}
          </button>
        ))}
      </div>

      {activeDayHasClasses ? (
        <ul className="pt-day-list">
          {rows.map((slot) => {
            if (isBreakSlot(slot)) {
              return (
                <li key={slot.id} className="pt-day-break">
                  <Coffee size={14} />
                  <strong>{slot.label}</strong>
                  <span>
                    {formatRange(slot.startTime, slot.endTime)}
                  </span>
                </li>
              );
            }

            const items = cells[`${activeDay}-${slot.id}`] || [];

            return (
              <li key={slot.id} className="pt-day-item">
                <div className="pt-day-time">
                  <strong>{slot.label}</strong>
                  <span>
                    <Clock size={11} />
                    {formatRange(slot.startTime, slot.endTime)}
                  </span>
                </div>

                <div className="pt-day-body">
                  {items.length > 0 ? (
                    items.map((entry) => (
                      <PeriodCard key={entry.id} entry={entry} />
                    ))
                  ) : (
                    <span className="pt-free">Free period</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          title="No classes"
          text="No classes are scheduled for this day."
        />
      )}
    </div>
  );

  const renderTimetable = () => {
    if (ttLoading) return <Loader text="Loading timetable..." />;

    if (ttError) {
      return (
        <ErrorState
          message={ttError}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      );
    }

    if (entries.length === 0) {
      return (
        <EmptyState
          title="No timetable yet"
          text={`The timetable for ${
            selectedChild?.studentName || "your child"
          } has not been published.`}
        />
      );
    }

    return (
      <>
        {renderWeekly()}
        {renderDaily()}
      </>
    );
  };

  /* --------------------------------------------------------
     PAGE STATES
  -------------------------------------------------------- */

  let content;

  if (childrenLoading) {
    content = <Loader text="Loading..." />;
  } else if (childrenError) {
    content = (
      <ErrorState message={childrenError} onRetry={loadChildren} />
    );
  } else if (children.length === 0) {
    content = (
      <EmptyState
        title="No children linked"
        text="No students are linked to your account yet."
      />
    );
  } else {
    content = (
      <>
        {children.length > 1 && (
          <div
            className="pt-children"
            role="tablist"
            aria-label="Select child"
          >
            {children.map((child) => (
              <button
                key={child.id}
                type="button"
                role="tab"
                aria-selected={selectedChildId === child.id}
                className={`pt-child ${
                  selectedChildId === child.id ? "active" : ""
                }`}
                onClick={() => setSelectedChildId(child.id)}
              >
                <span className="pt-avatar">
                  {getInitial(child.studentName)}
                </span>

                <span className="pt-child-text">
                  <strong>{child.studentName}</strong>
                  <small>
                    {[child.class?.name, child.section?.name]
                      .filter(Boolean)
                      .join(" - ") || "—"}
                  </small>
                </span>
              </button>
            ))}
          </div>
        )}

        {selectedChild && (
          <div className="pt-summary">
            <div className="pt-summary-child">
              <span className="pt-avatar pt-avatar-lg">
                {getInitial(selectedChild.studentName)}
              </span>

              <div>
                <h3>{selectedChild.studentName}</h3>
                <p>
                  {selectedChild.class?.name
                    ? `Class ${selectedChild.class.name}`
                    : "Class not assigned"}
                  {selectedChild.section?.name
                    ? ` • Section ${selectedChild.section.name}`
                    : ""}
                  {selectedChild.admissionNo
                    ? ` • Adm. No ${selectedChild.admissionNo}`
                    : ""}
                </p>
              </div>
            </div>

            {entries.length > 0 && !ttLoading && (
              <div className="pt-stats">
                <div>
                  <strong>{stats.periods}</strong>
                  <span>Periods / week</span>
                </div>
                <div>
                  <strong>{stats.subjects}</strong>
                  <span>Subjects</span>
                </div>
                <div>
                  <strong>{stats.teachers}</strong>
                  <span>Teachers</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-panel">{renderTimetable()}</div>
      </>
    );
  }

  return (
    <div className="pt-page">
      <div className="pt-header">
        <div>
          <h2>Timetable</h2>
          <p>Weekly class schedule for your child</p>
        </div>
      </div>

      {content}
    </div>
  );
}