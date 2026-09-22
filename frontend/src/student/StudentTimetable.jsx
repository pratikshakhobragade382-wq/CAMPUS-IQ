import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  AlertCircle,
  CalendarDays,
  Coffee,
  Download,
  RefreshCw,
  UserRound,
  Utensils,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  getStudentClassTimetable,
  getPeriodSlots,
  getStudentPortalProfile,
} from "./StudentTimetableApi";

import "./StudentTimetable.css";

/* ============================================================
   CONSTANTS
============================================================ */

const DAYS = [
  { value: 1, name: "Monday", short: "Mon" },
  { value: 2, name: "Tuesday", short: "Tue" },
  { value: 3, name: "Wednesday", short: "Wed" },
  { value: 4, name: "Thursday", short: "Thu" },
  { value: 5, name: "Friday", short: "Fri" },
  { value: 6, name: "Saturday", short: "Sat" },
];

const CLASS_SLOT_TYPES = ["period", "sports"];

/* ============================================================
   HELPERS
============================================================ */

function getTodayName() {
  const jsDay = new Date().getDay();

  return (
    DAYS.find(
      (day) => day.value === jsDay
    )?.name || null
  );
}

function toNumber(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) &&
    number > 0
    ? number
    : null;
}

function extractClassInfo(source) {
  if (!source || typeof source !== "object") {
    return {};
  }

  const student =
    source.student &&
    typeof source.student === "object"
      ? source.student
      : source.profile &&
        typeof source.profile === "object"
      ? source.profile
      : source;

  const classObject =
    student.class &&
    typeof student.class === "object"
      ? student.class
      : null;

  const sectionObject =
    student.section &&
    typeof student.section === "object"
      ? student.section
      : null;

  return {
    classId: toNumber(
      student.classId ??
        classObject?.id
    ),

    sectionId: toNumber(
      student.sectionId ??
        sectionObject?.id
    ),

    className: String(
      student.className ||
        classObject?.name ||
        ""
    ).trim(),

    sectionName: String(
      student.sectionName ||
        sectionObject?.name ||
        ""
    ).trim(),

    classIncharge:
      sectionObject?.classTeacher ||
      student.classIncharge ||
      null,
  };
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    "Failed to load timetable"
  );
}

function formatTime(value) {
  const match =
    /^(\d{1,2}):(\d{2})/.exec(
      String(value || "")
    );

  if (!match) {
    return String(value || "");
  }

  let hours = Number(match[1]);
  const minutes = match[2];
  const suffix =
    hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;

  return `${hours}:${minutes} ${suffix}`;
}

function formatRange(slot) {
  if (
    !slot?.startTime ||
    !slot?.endTime
  ) {
    return "";
  }

  return `${formatTime(
    slot.startTime
  )} – ${formatTime(
    slot.endTime
  )}`;
}

function isBreakSlot(slot) {
  return !CLASS_SLOT_TYPES.includes(
    slot?.slotType
  );
}

function toneClass(subjectId) {
  return `student-timetable-tone-${
    Math.abs(
      Number(subjectId) || 0
    ) % 6
  }`;
}

function selectCurrentYear(grouped) {
  const allEntries =
    Object.values(grouped).flat();

  if (allEntries.length === 0) {
    return {
      grouped: {},
      year: null,
    };
  }

  const years = new Map();

  allEntries.forEach((entry) => {
    if (entry.academicYear) {
      years.set(
        entry.academicYear.id,
        entry.academicYear
      );
    }
  });

  if (years.size === 0) {
    return {
      grouped,
      year: null,
    };
  }

  const list =
    Array.from(years.values());

  const active = list.filter(
    (year) => year.isActive
  );

  const pool =
    active.length > 0
      ? active
      : list;

  const chosen = pool.reduce(
    (best, year) =>
      new Date(
        year.startDate
      ) >
      new Date(
        best.startDate
      )
        ? year
        : best
  );

  const filtered = {};

  Object.entries(grouped).forEach(
    ([dayName, items]) => {
      const kept = items.filter(
        (entry) =>
          entry.academicYearId ===
          chosen.id
      );

      if (kept.length > 0) {
        filtered[dayName] =
          kept;
      }
    }
  );

  return {
    grouped: filtered,
    year: chosen,
  };
}

function buildSlots(
  apiSlots,
  grouped
) {
  const map = new Map();

  (
    Array.isArray(apiSlots)
      ? apiSlots
      : []
  ).forEach((slot) => {
    map.set(slot.id, slot);
  });

  Object.values(grouped)
    .flat()
    .forEach((entry) => {
      if (
        entry.periodSlot &&
        !map.has(
          entry.periodSlot.id
        )
      ) {
        map.set(
          entry.periodSlot.id,
          entry.periodSlot
        );
      }
    });

  return Array.from(
    map.values()
  ).sort(
    (a, b) =>
      a.slotNo - b.slotNo
  );
}

/* ============================================================
   SMALL COMPONENTS
============================================================ */

function BreakLabel({ slot }) {
  const Icon =
    slot.slotType === "lunch"
      ? Utensils
      : Coffee;

  return (
    <div className="student-timetable-break">
      <Icon
        size={15}
        strokeWidth={2.1}
      />

      <span>
        {slot.label}
      </span>
    </div>
  );
}

function EntryCard({
  entry,
  showSection,
}) {
  return (
    <div
      className={`student-timetable-entry ${toneClass(
        entry.subjectId
      )}`}
    >
      <strong>
        {entry.subject?.name ||
          "Subject"}
      </strong>

      <span>
        <UserRound
          size={12}
          strokeWidth={2.2}
        />

        {entry.staff?.name ||
          "Teacher not assigned"}
      </span>

      {showSection &&
        entry.section?.name && (
          <em>
            Section{" "}
            {entry.section.name}
          </em>
        )}
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function StudentTimetable() {
  const { user } = useAuth();

  const [status, setStatus] =
    useState("loading");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [entriesByDay, setEntriesByDay] =
    useState({});

  const [slots, setSlots] =
    useState([]);

  const [academicYear, setAcademicYear] =
    useState(null);

  const [classLabel, setClassLabel] =
    useState("");

  const [classIncharge, setClassIncharge] =
    useState(null);

  const [selectedDay, setSelectedDay] =
    useState(null);

  const known =
    extractClassInfo(user);

  const knownClassId =
    known.classId || null;

  const knownSectionId =
    known.sectionId || null;

  const knownClassName =
    known.className || "";

  const knownSectionName =
    known.sectionName || "";

  /* ============================================================
     LOAD
  ============================================================ */

  const loadTimetable =
    useCallback(async () => {
      setStatus("loading");
      setErrorMessage("");

      try {
        let info = {
          classId:
            knownClassId,
          sectionId:
            knownSectionId,
          className:
            knownClassName,
          sectionName:
            knownSectionName,
          classIncharge:
            null,
        };

        /*
         * Always get the profile so the latest
         * section class incharge is available.
         */
        try {
          const profileBody =
            await getStudentPortalProfile();

          const fromProfile =
            extractClassInfo(
              profileBody?.data
            );

          info = {
            classId:
              info.classId ||
              fromProfile.classId ||
              null,

            sectionId:
              info.sectionId ||
              fromProfile.sectionId ||
              null,

            className:
              info.className ||
              fromProfile.className ||
              "",

            sectionName:
              info.sectionName ||
              fromProfile.sectionName ||
              "",

            classIncharge:
              fromProfile.classIncharge ||
              null,
          };
        } catch (profileError) {
          if (
            !info.classId &&
            !info.className
          ) {
            throw profileError;
          }
        }

        if (
          !info.classId &&
          !info.className
        ) {
          throw new Error(
            "Your class details could not be found. Please contact your school."
          );
        }

        const params =
          info.classId
            ? {
                classId:
                  info.classId,

                ...(info.sectionId
                  ? {
                      sectionId:
                        info.sectionId,
                    }
                  : {}),
              }
            : {
                className:
                  info.className,

                ...(info.sectionName
                  ? {
                      sectionName:
                        info.sectionName,
                    }
                  : {}),
              };

        const [
          timetableBody,
          slotsBody,
        ] = await Promise.all([
          getStudentClassTimetable(
            params
          ),

          getPeriodSlots().catch(
            () => null
          ),
        ]);

        const rawGrouped =
          timetableBody?.data &&
          typeof timetableBody.data ===
            "object"
            ? timetableBody.data
            : {};

        const {
          grouped,
          year,
        } =
          selectCurrentYear(
            rawGrouped
          );

        const firstEntry =
          Object.values(
            grouped
          ).flat()[0];

        /*
         * Also try to get the class teacher
         * from the timetable section relation.
         */
        const timetableIncharge =
          firstEntry?.section
            ?.classTeacher ||
          info.classIncharge ||
          null;

        setEntriesByDay(
          grouped
        );

        setAcademicYear(year);

        setSlots(
          buildSlots(
            slotsBody?.data,
            grouped
          )
        );

        setClassIncharge(
          timetableIncharge
        );

        setClassLabel(
          firstEntry
            ? `${firstEntry.class?.name || info.className || ""}${
                firstEntry.section?.name ||
                info.sectionName
                  ? ` - ${
                      firstEntry.section?.name ||
                      info.sectionName
                    }`
                  : ""
              }`.trim()
            : `${info.className}${
                info.sectionName
                  ? ` - ${info.sectionName}`
                  : ""
              }`
        );

        setStatus(
          Object.keys(grouped)
            .length === 0
            ? "empty"
            : "ready"
        );
      } catch (error) {
        const message =
          getErrorMessage(error);

        setErrorMessage(message);
        setStatus("error");

        toast.error(message, {
          toastId:
            "student-timetable-error",
        });
      }
    }, [
      knownClassId,
      knownSectionId,
      knownClassName,
      knownSectionName,
    ]);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  /* ============================================================
     VIEW
  ============================================================ */

  const view = useMemo(() => {
    const days =
      DAYS.filter(
        (day) =>
          day.value !== 6 ||
          (entriesByDay.Saturday &&
            entriesByDay.Saturday
              .length > 0)
      );

    const cellMap = {};
    let totalClasses = 0;

    Object.entries(
      entriesByDay
    ).forEach(
      ([dayName, items]) => {
        cellMap[dayName] =
          {};

        items.forEach(
          (entry) => {
            const key =
              entry.periodSlotId;

            if (
              !cellMap[dayName][
                key
              ]
            ) {
              cellMap[dayName][
                key
              ] = [];
            }

            cellMap[dayName][
              key
            ].push(entry);

            totalClasses += 1;
          }
        );
      }
    );

    return {
      days,
      cellMap,
      totalClasses,
    };
  }, [entriesByDay]);

  const todayName =
    getTodayName();

  const activeDayName =
    selectedDay ||
    (todayName &&
    view.days.some(
      (day) =>
        day.name === todayName
    )
      ? todayName
      : view.days[0]?.name);

  /* ============================================================
     PDF
  ============================================================ */

  const downloadPDF = () => {
    if (
      view.totalClasses === 0
    ) {
      return;
    }

    const cleanup = () => {
      document.body.classList.remove(
        "student-timetable-printing"
      );
    };

    window.addEventListener(
      "afterprint",
      cleanup,
      { once: true }
    );

    document.body.classList.add(
      "student-timetable-printing"
    );

    window.print();

    setTimeout(
      cleanup,
      1500
    );
  };

  /* ============================================================
     PRINT ROWS
  ============================================================ */

  const printRows = Object.values(
    entriesByDay
  )
    .flat()
    .sort(
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
     RENDER
  ============================================================ */

  return (
    <div className="student-timetable-page">

      <style>{`
        .student-timetable-print-only {
          display: none;
        }

        .student-timetable-download {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 40px;
          padding: 0 16px;
          border: 1px solid #dbe3ef;
          border-radius: 10px;
          background: #ffffff;
          color: #2563eb;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .student-timetable-download:hover {
          background: #eff6ff;
        }

        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          body.student-timetable-printing * {
            visibility: hidden !important;
          }

          body.student-timetable-printing
            .student-timetable-print-only,
          body.student-timetable-printing
            .student-timetable-print-only * {
            visibility: visible !important;
          }

          body.student-timetable-printing
            .student-timetable-print-only {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
          }

          .student-print-header {
            border-bottom: 3px solid #ff914d;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }

          .student-print-brand {
            font-size: 10px;
            font-weight: 800;
            color: #94a3b8;
            letter-spacing: .12em;
          }

          .student-print-title {
            margin-top: 4px;
            font-size: 25px;
            font-weight: 800;
            color: #183b5d;
          }

          .student-print-subtitle {
            margin-top: 3px;
            font-size: 11px;
            color: #687b8d;
          }

          .student-print-info {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 14px;
          }

          .student-print-info-card {
            padding: 9px;
            border: 1px solid #ffe3d2;
            border-radius: 7px;
            background: #fffaf7;
          }

          .student-print-info-card span {
            display: block;
            font-size: 8px;
            font-weight: 800;
            color: #9aa8b6;
            text-transform: uppercase;
          }

          .student-print-info-card strong {
            display: block;
            margin-top: 3px;
            font-size: 12px;
            color: #183b5d;
          }

          .student-print-incharge {
            padding: 10px 12px;
            margin-bottom: 14px;
            border: 1px solid #fed7aa;
            border-radius: 8px;
            background: #fff7f2;
          }

          .student-print-incharge span {
            display: block;
            font-size: 8px;
            font-weight: 800;
            color: #f07f3f;
            text-transform: uppercase;
          }

          .student-print-incharge strong {
            display: block;
            margin-top: 3px;
            font-size: 13px;
            color: #183b5d;
          }

          .student-print-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }

          .student-print-table th {
            padding: 8px;
            text-align: left;
            background: #183b5d;
            color: white;
            border: 1px solid #183b5d;
            font-size: 9px;
            text-transform: uppercase;
          }

          .student-print-table td {
            padding: 7px 8px;
            border: 1px solid #dbe3ef;
            color: #475569;
          }

          .student-print-table tr:nth-child(even) td {
            background: #f8fafc;
          }

          .student-print-table strong {
            color: #183b5d;
          }

          .student-print-footer {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            font-size: 8px;
            color: #94a3b8;
          }
        }
      `}</style>

      {/* HEADER */}

      <div className="student-timetable-header">
        <div className="student-timetable-header-info">
          <span>
            MY CLASS
          </span>

          <h2>
            Timetable
          </h2>

          {status === "ready" && (
            <div className="student-timetable-meta">

              {classLabel && (
                <span>
                  <CalendarDays
                    size={14}
                    strokeWidth={2.1}
                  />

                  {classLabel}
                </span>
              )}

              {academicYear && (
                <span>
                  Academic Year{" "}
                  {academicYear.name}
                </span>
              )}

              <span>
                {view.totalClasses} classes / week
              </span>

            </div>
          )}
        </div>

        <div
          style={{
            display:
              "flex",
            gap: "8px",
            flexWrap:
              "wrap",
          }}
        >
          <button
            type="button"
            className="student-timetable-download"
            onClick={
              downloadPDF
            }
            disabled={
              status !==
              "ready"
            }
          >
            <Download size={15} />
            Download PDF
          </button>

          <button
            type="button"
            className="student-timetable-refresh"
            onClick={
              loadTimetable
            }
            disabled={
              status ===
              "loading"
            }
          >
            <RefreshCw
              size={15}
              strokeWidth={2.2}
              className={
                status ===
                "loading"
                  ? "student-spin"
                  : ""
              }
            />

            <span>
              Refresh
            </span>
          </button>
        </div>
      </div>

      {/* CLASS INCHARGE */}

      {status === "ready" && (
        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            gap: "12px",
            marginBottom:
              "18px",
            padding:
              "14px 18px",
            background:
              "#ffffff",
            border:
              "1px solid #ffe3d2",
            borderRadius:
              "14px",
          }}
        >
          <UserRound
            size={20}
            color="#ff914d"
          />

          <div>
            <div
              style={{
                fontSize:
                  "10px",
                fontWeight:
                  800,
                color:
                  "#9aa8b6",
                textTransform:
                  "uppercase",
                letterSpacing:
                  ".07em",
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
                color:
                  "#183b5d",
              }}
            >
              {classIncharge?.name ||
                "Not Assigned"}
            </strong>
          </div>
        </div>
      )}

      {/* LOADING */}

      {status === "loading" && (
        <div className="student-timetable-card">
          <div className="student-module-status">
            <div className="student-module-spinner" />

            <h3>
              Loading timetable…
            </h3>

            <p>
              Please wait while we fetch
              your weekly schedule.
            </p>
          </div>
        </div>
      )}

      {/* ERROR */}

      {status === "error" && (
        <div className="student-timetable-card">
          <div className="student-module-status error">
            <div className="student-module-status-icon error">
              <AlertCircle
                size={36}
              />
            </div>

            <h3>
              Could not load timetable
            </h3>

            <p>
              {errorMessage}
            </p>

            <button
              type="button"
              className="student-profile-retry-btn"
              onClick={
                loadTimetable
              }
            >
              <RefreshCw
                size={15}
              />
              Try again
            </button>
          </div>
        </div>
      )}

      {/* EMPTY */}

      {status === "empty" && (
        <div className="student-timetable-card">
          <div className="student-module-status">
            <div className="student-module-status-icon">
              <CalendarDays
                size={36}
              />
            </div>

            <h3>
              No timetable yet
            </h3>

            <p>
              Your class timetable has
              not been created. Please
              check back later.
            </p>
          </div>
        </div>
      )}

      {/* READY */}

      {status === "ready" && (
        <div className="student-timetable-card">

          <div className="student-timetable-week">
            <table className="student-timetable-table">
              <thead>
                <tr>
                  <th className="student-timetable-time-head">
                    Time
                  </th>

                  {view.days.map(
                    (day) => (
                      <th
                        key={
                          day.value
                        }
                        className={
                          day.name ===
                          todayName
                            ? "student-timetable-today-head"
                            : ""
                        }
                      >
                        {day.name}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {slots.map(
                  (slot) =>
                    isBreakSlot(
                      slot
                    ) ? (
                      <tr
                        key={
                          slot.id
                        }
                      >
                        <td className="student-timetable-time">
                          <strong>
                            {
                              slot.label
                            }
                          </strong>

                          <span>
                            {formatRange(
                              slot
                            )}
                          </span>
                        </td>

                        <td
                          colSpan={
                            view.days
                              .length
                          }
                          className="student-timetable-break-cell"
                        >
                          <BreakLabel
                            slot={
                              slot
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={
                          slot.id
                        }
                      >
                        <td className="student-timetable-time">
                          <strong>
                            {
                              slot.label
                            }
                          </strong>

                          <span>
                            {formatRange(
                              slot
                            )}
                          </span>
                        </td>

                        {view.days.map(
                          (day) => {
                            const entries =
                              view
                                .cellMap[
                                day.name
                              ]?.[
                                slot.id
                              ] ||
                              [];

                            return (
                              <td
                                key={
                                  day.value
                                }
                                className={`student-timetable-cell ${
                                  day.name ===
                                  todayName
                                    ? "today"
                                    : ""
                                }`}
                              >
                                {entries.length ===
                                0 ? (
                                  <span className="student-timetable-free">
                                    —
                                  </span>
                                ) : (
                                  entries.map(
                                    (
                                      entry
                                    ) => (
                                      <EntryCard
                                        key={
                                          entry.id
                                        }
                                        entry={
                                          entry
                                        }
                                        showSection={
                                          entries.length >
                                          1
                                        }
                                      />
                                    )
                                  )
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

          <div className="student-timetable-day-view">
            <div className="student-timetable-day-tabs">
              {view.days.map(
                (day) => (
                  <button
                    key={
                      day.value
                    }
                    type="button"
                    className={`student-timetable-day-tab ${
                      day.name ===
                      activeDayName
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedDay(
                        day.name
                      )
                    }
                  >
                    {day.short}
                  </button>
                )
              )}
            </div>

            <div className="student-timetable-day-list">
              {slots.map(
                (slot) => {
                  if (
                    isBreakSlot(
                      slot
                    )
                  ) {
                    return (
                      <div
                        key={
                          slot.id
                        }
                        className="student-timetable-day-row break"
                      >
                        <div className="student-timetable-day-time">
                          <strong>
                            {formatTime(
                              slot.startTime
                            )}
                          </strong>

                          <span>
                            {formatTime(
                              slot.endTime
                            )}
                          </span>
                        </div>

                        <div className="student-timetable-day-body">
                          <BreakLabel
                            slot={
                              slot
                            }
                          />
                        </div>
                      </div>
                    );
                  }

                  const entries =
                    view
                      .cellMap[
                      activeDayName
                    ]?.[
                      slot.id
                    ] || [];

                  return (
                    <div
                      key={
                        slot.id
                      }
                      className="student-timetable-day-row"
                    >
                      <div className="student-timetable-day-time">
                        <strong>
                          {formatTime(
                            slot.startTime
                          )}
                        </strong>

                        <span>
                          {formatTime(
                            slot.endTime
                          )}
                        </span>
                      </div>

                      <div className="student-timetable-day-body">
                        {entries.length ===
                        0 ? (
                          <span className="student-timetable-free">
                            Free period
                          </span>
                        ) : (
                          entries.map(
                            (
                              entry
                            ) => (
                              <EntryCard
                                key={
                                  entry.id
                                }
                                entry={
                                  entry
                                }
                                showSection={
                                  entries.length >
                                  1
                                }
                              />
                            )
                          )
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          PRINT VERSION
      ====================================================== */}

      <div className="student-timetable-print-only">

        <div className="student-print-header">
          <div className="student-print-brand">
            CAMPUS-IQ
          </div>

          <div className="student-print-title">
            Class Timetable
          </div>

          <div className="student-print-subtitle">
            Weekly Academic Timetable
          </div>
        </div>

        <div className="student-print-info">

          <div className="student-print-info-card">
            <span>
              Class
            </span>

            <strong>
              {classLabel
                ?.split(" - ")[0] ||
                "—"}
            </strong>
          </div>

          <div className="student-print-info-card">
            <span>
              Section
            </span>

            <strong>
              {classLabel
                ?.split(" - ")[1] ||
                "—"}
            </strong>
          </div>

          <div className="student-print-info-card">
            <span>
              Academic Year
            </span>

            <strong>
              {academicYear?.name ||
                "—"}
            </strong>
          </div>

          <div className="student-print-info-card">
            <span>
              Total Classes
            </span>

            <strong>
              {view.totalClasses}
            </strong>
          </div>
        </div>

        <div className="student-print-incharge">
          <span>
            Class Incharge
          </span>

          <strong>
            {classIncharge?.name ||
              "Not Assigned"}
          </strong>
        </div>

        <table className="student-print-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Time</th>
              <th>Subject</th>
              <th>Teacher</th>
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
                            day.value ===
                            entry.dayOfWeek
                        )?.name ||
                        "—"
                      }
                    </strong>
                  </td>

                  <td>
                    {formatRange(
                      entry.periodSlot
                    )}
                  </td>

                  <td>
                    <strong>
                      {entry.subject?.name ||
                        "Subject"}
                    </strong>
                  </td>

                  <td>
                    {entry.staff?.name ||
                      "Teacher not assigned"}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>

        <div className="student-print-footer">
          <span>
            CAMPUS-IQ • Student Portal
          </span>

          <span>
            Official Timetable
          </span>
        </div>
      </div>
    </div>
  );
}