import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  Calendar,
  Clock,
  Coffee,
  Download,
  RefreshCw,
  User,
} from "lucide-react";

import axiosClient from "../api/axios";

import "./ParentTimetable.css";

/* ============================================================
   CONSTANTS
============================================================ */

const DAYS = [
  { id: 1, label: "Monday", short: "Mon" },
  { id: 2, label: "Tuesday", short: "Tue" },
  { id: 3, label: "Wednesday", short: "Wed" },
  { id: 4, label: "Thursday", short: "Thu" },
  { id: 5, label: "Friday", short: "Fri" },
  { id: 6, label: "Saturday", short: "Sat" },
];

const CLASS_SLOT_TYPES = [
  "period",
  "sports",
];

const COLOR_COUNT = 8;

/* ============================================================
   HELPERS
============================================================ */

function getErrorMessage(
  err,
  fallback
) {
  if (
    err?.code ===
    "ECONNABORTED"
  ) {
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

  const match =
    String(value).match(
      /^(\d{1,2}):(\d{2})/
    );

  if (!match) {
    return String(value);
  }

  let hours =
    Number(match[1]);

  const minutes =
    match[2];

  const suffix =
    hours >= 12
      ? "PM"
      : "AM";

  hours =
    hours % 12 || 12;

  return `${hours}:${minutes} ${suffix}`;
}

function formatRange(
  start,
  end
) {
  return [
    formatTime(start),
    formatTime(end),
  ]
    .filter(Boolean)
    .join(" – ");
}

function isBreakSlot(slot) {
  return !CLASS_SLOT_TYPES.includes(
    slot.slotType
  );
}

function getInitial(name) {
  return (
    name || "?"
  )
    .trim()
    .charAt(0)
    .toUpperCase();
}

/* ============================================================
   BUILD TIMETABLE
============================================================ */

function buildTimetable(
  entries,
  slots
) {
  const slotMap =
    new Map();

  slots.forEach(
    (slot) => {
      slotMap.set(
        slot.id,
        {
          id: slot.id,
          slotNo:
            slot.slotNo,
          label:
            slot.label,
          slotType:
            slot.slotType,
          startTime:
            slot.startTime,
          endTime:
            slot.endTime,
        }
      );
    }
  );

  const cells = {};

  entries.forEach(
    (entry) => {
      const slotInfo =
        entry.periodSlot ||
        {};

      if (
        !slotMap.has(
          entry.periodSlotId
        )
      ) {
        slotMap.set(
          entry.periodSlotId,
          {
            id:
              entry.periodSlotId,
            slotNo:
              slotInfo.slotNo ??
              0,
            label:
              slotInfo.label ||
              `Period ${
                slotInfo.slotNo ??
                ""
              }`.trim(),
            slotType:
              "period",
            startTime:
              slotInfo.startTime,
            endTime:
              slotInfo.endTime,
          }
        );
      }

      const key = `${entry.dayOfWeek}-${entry.periodSlotId}`;

      if (!cells[key]) {
        cells[key] = [];
      }

      cells[key].push(entry);
    }
  );

  const rows =
    Array.from(
      slotMap.values()
    ).sort(
      (a, b) =>
        a.slotNo - b.slotNo
    );

  const hasSaturday =
    entries.some(
      (entry) =>
        entry.dayOfWeek === 6
    );

  return {
    rows,
    cells,
    days: hasSaturday
      ? DAYS
      : DAYS.slice(0, 5),
  };
}

/* ============================================================
   SMALL COMPONENTS
============================================================ */

function PeriodCard({
  entry,
}) {
  const subjectId =
    entry.subject?.id ??
    entry.subjectId ??
    0;

  return (
    <div
      className={`pt-card pt-color-${
        subjectId %
        COLOR_COUNT
      }`}
    >
      <span className="pt-card-subject">
        {entry.subject?.name ||
          "Subject"}
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

function Loader({
  text,
}) {
  return (
    <div
      className="pt-state"
      role="status"
    >
      <div className="pt-spinner" />

      <p>{text}</p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}) {
  return (
    <div
      className="pt-state pt-state-error"
      role="alert"
    >
      <AlertCircle size={32} />

      <p>
        {message}
      </p>

      <button
        type="button"
        className="pt-btn"
        onClick={
          onRetry
        }
      >
        <RefreshCw
          size={14}
        />

        Try again
      </button>
    </div>
  );
}

function EmptyState({
  title,
  text,
}) {
  return (
    <div className="pt-state">
      <Calendar size={32} />

      <h4>
        {title}
      </h4>

      <p>
        {text}
      </p>
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function ParentTimetable() {
  const [children, setChildren] =
    useState([]);

  const [
    childrenLoading,
    setChildrenLoading,
  ] = useState(true);

  const [
    childrenError,
    setChildrenError,
  ] = useState("");

  const [
    selectedChildId,
    setSelectedChildId,
  ] = useState(null);

  const [slots, setSlots] =
    useState([]);

  const [entries, setEntries] =
    useState([]);

  const [
    ttLoading,
    setTtLoading,
  ] = useState(false);

  const [
    ttError,
    setTtError,
  ] = useState("");

  const [
    reloadKey,
    setReloadKey,
  ] = useState(0);

  const todayId =
    useMemo(() => {
      const day =
        new Date().getDay();

      return day === 0
        ? null
        : day;
    }, []);

  const [
    selectedDay,
    setSelectedDay,
  ] = useState(
    todayId || 1
  );

  /* ============================================================
     CHILDREN
  ============================================================ */

  const loadChildren =
    useCallback(
      async () => {
        setChildrenLoading(
          true
        );

        setChildrenError("");

        try {
          const response =
            await axiosClient.get(
              "/parents/children"
            );

          const list =
            Array.isArray(
              response?.data
                ?.data
            )
              ? response.data.data
              : [];

          setChildren(list);

          setSelectedChildId(
            (previous) =>
              previous &&
              list.some(
                (child) =>
                  child.id ===
                  previous
              )
                ? previous
                : list[0]?.id ??
                  null
          );
        } catch (err) {
          setChildrenError(
            getErrorMessage(
              err,
              "Unable to load your children."
            )
          );
        } finally {
          setChildrenLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    loadChildren();
  }, [
    loadChildren,
  ]);

  /* ============================================================
     TIME SLOTS
  ============================================================ */

  useEffect(() => {
    let ignore = false;

    const loadSlots =
      async () => {
        try {
          const response =
            await axiosClient.get(
              "/timetable/period-slots"
            );

          if (!ignore) {
            setSlots(
              Array.isArray(
                response
                  ?.data
                  ?.data
              )
                ? response.data.data
                : []
            );
          }
        } catch {
          // Non-fatal.
        }
      };

    loadSlots();

    return () => {
      ignore = true;
    };
  }, []);

  /* ============================================================
     SELECTED CHILD TIMETABLE
  ============================================================ */

  useEffect(() => {
    if (!selectedChildId) {
      setEntries([]);
      return undefined;
    }

    let ignore = false;

    const loadTimetable =
      async () => {
        setTtLoading(true);
        setTtError("");

        try {
          const response =
            await axiosClient.get(
              `/parents/children/${selectedChildId}/timetable`
            );

          if (ignore) return;

          setEntries(
            Array.isArray(
              response?.data
                ?.data
            )
              ? response.data.data
              : []
          );
        } catch (err) {
          if (ignore) return;

          setEntries([]);

          setTtError(
            getErrorMessage(
              err,
              "Unable to load the timetable."
            )
          );
        } finally {
          if (!ignore) {
            setTtLoading(
              false
            );
          }
        }
      };

    loadTimetable();

    return () => {
      ignore = true;
    };
  }, [
    selectedChildId,
    reloadKey,
  ]);

  /* ============================================================
     DERIVED
  ============================================================ */

  const selectedChild =
    useMemo(
      () =>
        children.find(
          (child) =>
            child.id ===
            selectedChildId
        ),
      [
        children,
        selectedChildId,
      ]
    );

  const {
    rows,
    cells,
    days,
  } = useMemo(
    () =>
      buildTimetable(
        entries,
        slots
      ),
    [entries, slots]
  );

  const stats =
    useMemo(
      () => ({
        periods:
          entries.length,

        subjects:
          new Set(
            entries.map(
              (e) =>
                e.subject
                  ?.id ??
                e.subjectId
            )
          ).size,

        teachers:
          new Set(
            entries.map(
              (e) =>
                e.staff
                  ?.id ??
                e.staffId
            )
          ).size,
      }),
      [entries]
    );

  const activeDay =
    days.some(
      (day) =>
        day.id ===
        selectedDay
    )
      ? selectedDay
      : days[0]?.id;

  const activeDayHasClasses =
    entries.some(
      (entry) =>
        entry.dayOfWeek ===
        activeDay
    );

  /*
   * Get the class incharge from the child
   * information returned by the backend.
   *
   * We also use timetable.section.classTeacher
   * as a fallback.
   */
  const classIncharge =
    selectedChild?.section
      ?.classTeacher ||
    entries.find(
      (entry) =>
        entry.section
          ?.classTeacher
    )?.section
      ?.classTeacher ||
    null;

  /* ============================================================
     PDF
  ============================================================ */

  const downloadPDF = () => {
    if (
      entries.length === 0
    ) {
      return;
    }

    const cleanup = () => {
      document.body.classList.remove(
        "parent-timetable-printing"
      );
    };

    window.addEventListener(
      "afterprint",
      cleanup,
      { once: true }
    );

    document.body.classList.add(
      "parent-timetable-printing"
    );

    window.print();

    setTimeout(
      cleanup,
      1500
    );
  };

  /* ============================================================
     RENDER WEEKLY
  ============================================================ */

  const renderWeekly =
    () => (
      <div className="pt-week">
        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead>
              <tr>
                <th className="pt-th-time">
                  Time
                </th>

                {days.map(
                  (day) => (
                    <th
                      key={
                        day.id
                      }
                      className={
                        todayId ===
                        day.id
                          ? "pt-today"
                          : ""
                      }
                    >
                      {
                        day.label
                      }

                      {todayId ===
                        day.id && (
                        <span className="pt-today-tag">
                          Today
                        </span>
                      )}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {rows.map(
                (slot) =>
                  isBreakSlot(
                    slot
                  ) ? (
                    <tr
                      key={
                        slot.id
                      }
                      className="pt-break-row"
                    >
                      <td
                        colSpan={
                          days.length +
                          1
                        }
                      >
                        <Coffee
                          size={14}
                        />

                        <strong>
                          {
                            slot.label
                          }
                        </strong>

                        <span>
                          {formatRange(
                            slot.startTime,
                            slot.endTime
                          )}
                        </span>
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={
                        slot.id
                      }
                    >
                      <td className="pt-time-cell">
                        <strong>
                          {
                            slot.label
                          }
                        </strong>

                        <span>
                          {formatRange(
                            slot.startTime,
                            slot.endTime
                          )}
                        </span>
                      </td>

                      {days.map(
                        (day) => {
                          const items =
                            cells[
                              `${day.id}-${slot.id}`
                            ] ||
                            [];

                          return (
                            <td
                              key={
                                day.id
                              }
                              className={
                                todayId ===
                                day.id
                                  ? "pt-cell-today"
                                  : ""
                              }
                            >
                              {items.length >
                              0 ? (
                                items.map(
                                  (
                                    entry
                                  ) => (
                                    <PeriodCard
                                      key={
                                        entry.id
                                      }
                                      entry={
                                        entry
                                      }
                                    />
                                  )
                                )
                              ) : (
                                <span className="pt-free">
                                  —
                                </span>
                              )}
                            </td>
                          );
                        }
                      )}
                    </tr>
                  )
              )}
            </tbody>
          </table>
        </div>
      </div>
    );

  /* ============================================================
     RENDER DAILY
  ============================================================ */

  const renderDaily =
    () => (
      <div className="pt-day">

        <div
          className="pt-day-tabs"
          role="tablist"
        >
          {days.map(
            (day) => (
              <button
                key={
                  day.id
                }
                type="button"
                role="tab"
                aria-selected={
                  activeDay ===
                  day.id
                }
                className={`pt-day-tab ${
                  activeDay ===
                  day.id
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setSelectedDay(
                    day.id
                  )
                }
              >
                {day.short}

                {todayId ===
                  day.id && (
                  <i className="pt-dot" />
                )}
              </button>
            )
          )}
        </div>

        {activeDayHasClasses ? (
          <ul className="pt-day-list">
            {rows.map(
              (slot) => {
                if (
                  isBreakSlot(
                    slot
                  )
                ) {
                  return (
                    <li
                      key={
                        slot.id
                      }
                      className="pt-day-break"
                    >
                      <Coffee
                        size={14}
                      />

                      <strong>
                        {
                          slot.label
                        }
                      </strong>

                      <span>
                        {formatRange(
                          slot.startTime,
                          slot.endTime
                        )}
                      </span>
                    </li>
                  );
                }

                const items =
                  cells[
                    `${activeDay}-${slot.id}`
                  ] || [];

                return (
                  <li
                    key={
                      slot.id
                    }
                    className="pt-day-item"
                  >
                    <div className="pt-day-time">
                      <strong>
                        {
                          slot.label
                        }
                      </strong>

                      <span>
                        <Clock
                          size={
                            11
                          }
                        />

                        {formatRange(
                          slot.startTime,
                          slot.endTime
                        )}
                      </span>
                    </div>

                    <div className="pt-day-body">
                      {items.length >
                      0 ? (
                        items.map(
                          (
                            entry
                          ) => (
                            <PeriodCard
                              key={
                                entry.id
                              }
                              entry={
                                entry
                              }
                            />
                          )
                        )
                      ) : (
                        <span className="pt-free">
                          Free period
                        </span>
                      )}
                    </div>
                  </li>
                );
              }
            )}
          </ul>
        ) : (
          <EmptyState
            title="No classes"
            text="No classes are scheduled for this day."
          />
        )}
      </div>
    );

  /* ============================================================
     TIMETABLE
  ============================================================ */

  const renderTimetable =
    () => {
      if (ttLoading) {
        return (
          <Loader text="Loading timetable..." />
        );
      }

      if (ttError) {
        return (
          <ErrorState
            message={
              ttError
            }
            onRetry={() =>
              setReloadKey(
                (key) =>
                  key + 1
              )
            }
          />
        );
      }

      if (
        entries.length ===
        0
      ) {
        return (
          <EmptyState
            title="No timetable yet"
            text={`The timetable for ${
              selectedChild?.studentName ||
              "your child"
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

  /* ============================================================
     PRINT ROWS
  ============================================================ */

  const printRows =
    [...entries].sort(
      (a, b) => {
        if (
          Number(
            a.dayOfWeek
          ) !==
          Number(
            b.dayOfWeek
          )
        ) {
          return (
            Number(
              a.dayOfWeek
            ) -
            Number(
              b.dayOfWeek
            )
          );
        }

        return (
          Number(
            a.periodSlot
              ?.slotNo || 0
          ) -
          Number(
            b.periodSlot
              ?.slotNo || 0
          )
        );
      }
    );

  /* ============================================================
     PAGE CONTENT
  ============================================================ */

  let content;

  if (childrenLoading) {
    content = (
      <Loader text="Loading..." />
    );
  } else if (
    childrenError
  ) {
    content = (
      <ErrorState
        message={
          childrenError
        }
        onRetry={
          loadChildren
        }
      />
    );
  } else if (
    children.length ===
    0
  ) {
    content = (
      <EmptyState
        title="No children linked"
        text="No students are linked to your account yet."
      />
    );
  } else {
    content = (
      <>
        {children.length >
          1 && (
          <div
            className="pt-children"
            role="tablist"
            aria-label="Select child"
          >
            {children.map(
              (child) => (
                <button
                  key={
                    child.id
                  }
                  type="button"
                  role="tab"
                  aria-selected={
                    selectedChildId ===
                    child.id
                  }
                  className={`pt-child ${
                    selectedChildId ===
                    child.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedChildId(
                      child.id
                    )
                  }
                >
                  <span className="pt-avatar">
                    {getInitial(
                      child.studentName
                    )}
                  </span>

                  <span className="pt-child-text">
                    <strong>
                      {
                        child.studentName
                      }
                    </strong>

                    <small>
                      {[
                        child
                          .class
                          ?.name,
                        child
                          .section
                          ?.name,
                      ]
                        .filter(
                          Boolean
                        )
                        .join(
                          " - "
                        ) ||
                        "—"}
                    </small>
                  </span>
                </button>
              )
            )}
          </div>
        )}

        {selectedChild && (
          <div className="pt-summary">
            <div className="pt-summary-child">
              <span className="pt-avatar pt-avatar-lg">
                {getInitial(
                  selectedChild.studentName
                )}
              </span>

              <div>
                <h3>
                  {
                    selectedChild.studentName
                  }
                </h3>

                <p>
                  {selectedChild
                    .class
                    ?.name
                    ? `Class ${selectedChild.class.name}`
                    : "Class not assigned"}

                  {selectedChild
                    .section
                    ?.name
                    ? ` • Section ${selectedChild.section.name}`
                    : ""}

                  {selectedChild
                    .admissionNo
                    ? ` • Adm. No ${selectedChild.admissionNo}`
                    : ""}
                </p>
              </div>
            </div>

            {entries.length >
              0 &&
              !ttLoading && (
                <div className="pt-stats">
                  <div>
                    <strong>
                      {
                        stats.periods
                      }
                    </strong>

                    <span>
                      Periods / week
                    </span>
                  </div>

                  <div>
                    <strong>
                      {
                        stats.subjects
                      }
                    </strong>

                    <span>
                      Subjects
                    </span>
                  </div>

                  <div>
                    <strong>
                      {
                        stats.teachers
                      }
                    </strong>

                    <span>
                      Teachers
                    </span>
                  </div>
                </div>
              )}
          </div>
        )}

        {selectedChild && (
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: "12px",
              padding:
                "13px 18px",
              marginBottom:
                "16px",
              background:
                "#ffffff",
              border:
                "1px solid #e5e7eb",
              borderRadius:
                "12px",
            }}
          >
            <User
              size={19}
              color="#4f46e5"
            />

            <div>
              <div
                style={{
                  fontSize:
                    "10px",
                  fontWeight:
                    800,
                  color:
                    "#6b7280",
                  textTransform:
                    "uppercase",
                }}
              >
                Class Incharge
              </div>

              <strong
                style={{
                  display:
                    "block",
                  marginTop:
                    "3px",
                }}
              >
                {classIncharge?.name ||
                  "Not Assigned"}
              </strong>
            </div>
          </div>
        )}

        <div className="pt-panel">
          {renderTimetable()}
        </div>
      </>
    );
  }

  /* ============================================================
     RETURN
  ============================================================ */

  return (
    <div className="pt-page">

      <style>{`
        .parent-timetable-print-only {
          display: none;
        }

        .parent-timetable-download {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 9px 14px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
          color: #4f46e5;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .parent-timetable-download:hover {
          background: #eef2ff;
        }

        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          body.parent-timetable-printing * {
            visibility: hidden !important;
          }

          body.parent-timetable-printing
            .parent-timetable-print-only,
          body.parent-timetable-printing
            .parent-timetable-print-only * {
            visibility: visible !important;
          }

          body.parent-timetable-printing
            .parent-timetable-print-only {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
          }

          .parent-print-header {
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }

          .parent-print-brand {
            font-size: 10px;
            font-weight: 800;
            color: #9ca3af;
            letter-spacing: .12em;
          }

          .parent-print-title {
            margin-top: 4px;
            font-size: 25px;
            font-weight: 800;
            color: #1f2937;
          }

          .parent-print-subtitle {
            margin-top: 3px;
            font-size: 11px;
            color: #6b7280;
          }

          .parent-print-info {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 14px;
          }

          .parent-print-info-card {
            padding: 9px;
            border: 1px solid #e5e7eb;
            border-radius: 7px;
            background: #f9fafb;
          }

          .parent-print-info-card span {
            display: block;
            font-size: 8px;
            font-weight: 800;
            color: #6b7280;
            text-transform: uppercase;
          }

          .parent-print-info-card strong {
            display: block;
            margin-top: 3px;
            font-size: 12px;
            color: #1f2937;
          }

          .parent-print-incharge {
            padding: 10px 12px;
            margin-bottom: 14px;
            border: 1px solid #c7d2fe;
            border-radius: 8px;
            background: #eef2ff;
          }

          .parent-print-incharge span {
            display: block;
            font-size: 8px;
            font-weight: 800;
            color: #4f46e5;
            text-transform: uppercase;
          }

          .parent-print-incharge strong {
            display: block;
            margin-top: 3px;
            font-size: 13px;
            color: #1f2937;
          }

          .parent-print-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }

          .parent-print-table th {
            padding: 8px;
            text-align: left;
            background: #1f2937;
            color: #ffffff;
            border: 1px solid #1f2937;
            font-size: 9px;
            text-transform: uppercase;
          }

          .parent-print-table td {
            padding: 7px 8px;
            border: 1px solid #e5e7eb;
            color: #4b5563;
          }

          .parent-print-table tr:nth-child(even) td {
            background: #f9fafb;
          }

          .parent-print-table strong {
            color: #1f2937;
          }

          .parent-print-footer {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            font-size: 8px;
            color: #9ca3af;
          }
        }
      `}</style>

      <div
        className="pt-header"
        style={{
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "space-between",
          gap: "12px",
        }}
      >
        <div>
          <h2>
            Timetable
          </h2>

          <p>
            Weekly class schedule
            for your child
          </p>
        </div>

        <button
          type="button"
          className="parent-timetable-download"
          onClick={
            downloadPDF
          }
          disabled={
            entries.length ===
            0
          }
        >
          <Download size={15} />
          Download PDF
        </button>
      </div>

      {content}

      {/* ======================================================
          PRINT VERSION
      ====================================================== */}

      <div className="parent-timetable-print-only">

        <div className="parent-print-header">
          <div className="parent-print-brand">
            CAMPUS-IQ
          </div>

          <div className="parent-print-title">
            Student Timetable
          </div>

          <div className="parent-print-subtitle">
            Weekly Academic Timetable
          </div>
        </div>

        <div className="parent-print-info">

          <div className="parent-print-info-card">
            <span>
              Student
            </span>

            <strong>
              {
                selectedChild
                  ?.studentName ||
                "—"
              }
            </strong>
          </div>

          <div className="parent-print-info-card">
            <span>
              Class
            </span>

            <strong>
              {
                selectedChild
                  ?.class
                  ?.name ||
                "—"
              }
            </strong>
          </div>

          <div className="parent-print-info-card">
            <span>
              Section
            </span>

            <strong>
              {
                selectedChild
                  ?.section
                  ?.name ||
                "—"
              }
            </strong>
          </div>

          <div className="parent-print-info-card">
            <span>
              Academic Year
            </span>

            <strong>
              {
                entries[0]
                  ?.academicYear
                  ?.name ||
                "—"
              }
            </strong>
          </div>
        </div>

        <div className="parent-print-incharge">
          <span>
            Class Incharge
          </span>

          <strong>
            {classIncharge?.name ||
              "Not Assigned"}
          </strong>
        </div>

        <table className="parent-print-table">
          <thead>
            <tr>
              <th>
                Day
              </th>

              <th>
                Time
              </th>

              <th>
                Subject
              </th>

              <th>
                Teacher
              </th>
            </tr>
          </thead>

          <tbody>
            {printRows.map(
              (entry) => (
                <tr
                  key={
                    entry.id
                  }
                >
                  <td>
                    <strong>
                      {
                        DAYS.find(
                          (day) =>
                            day.id ===
                            entry.dayOfWeek
                        )?.label ||
                        "—"
                      }
                    </strong>
                  </td>

                  <td>
                    {formatRange(
                      entry.periodSlot
                        ?.startTime,
                      entry.periodSlot
                        ?.endTime
                    )}
                  </td>

                  <td>
                    <strong>
                      {
                        entry
                          .subject
                          ?.name ||
                        "Subject"
                      }
                    </strong>
                  </td>

                  <td>
                    {
                      entry
                        .staff
                        ?.name ||
                      "Teacher not assigned"
                    }
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>

        <div className="parent-print-footer">
          <span>
            CAMPUS-IQ • Parent Portal
          </span>

          <span>
            Official Timetable
          </span>
        </div>
      </div>
    </div>
  );
}