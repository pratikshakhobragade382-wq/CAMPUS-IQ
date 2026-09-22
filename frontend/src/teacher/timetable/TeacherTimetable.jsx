import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Download,
  RefreshCw,
  CalendarDays,
  Clock3,
  UserRound,
  GraduationCap,
  Crown,
  Coffee,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import TeacherTopbar from "../components/TeacherTopbar";

import {
  getTeacherTimetable,
  getPeriodSlots,
} from "../../api/timetable.api";

import { getAllSections } from "../../api/section.api";

import "./TeacherTimetable.css";

import SubstitutePickerModal from "./SubstitutePickerModal";

const DAYS = [
  {
    value: 1,
    label: "Monday",
  },
  {
    value: 2,
    label: "Tuesday",
  },
  {
    value: 3,
    label: "Wednesday",
  },
  {
    value: 4,
    label: "Thursday",
  },
  {
    value: 5,
    label: "Friday",
  },
  {
    value: 6,
    label: "Saturday",
  },
];

const SLOT_TYPES = [
  "period",
  "sports",
];

function formatTime(value) {
  if (!value) return "";

  const match =
    String(value).match(
      /^(\d{1,2}):(\d{2})/
    );

  if (!match) return String(value);

  let hours = Number(match[1]);
  const minutes = match[2];

  const suffix =
    hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;

  return `${hours}:${minutes} ${suffix}`;
}

function formatRange(slot) {
  return [
    formatTime(slot?.startTime),
    formatTime(slot?.endTime),
  ]
    .filter(Boolean)
    .join(" – ");
}

function isBreak(slot) {
  return !SLOT_TYPES.includes(
    slot?.slotType
  );
}

function getDateForDay(dayOfWeek) {
  const today = new Date();

  const todayDay =
    today.getDay() === 0
      ? 7
      : today.getDay();

  const target = new Date(today);

  target.setDate(
    today.getDate() +
      (dayOfWeek - todayDay)
  );

  return target
    .toISOString()
    .split("T")[0];
}

export default function TeacherTimetable() {
  const { user } = useAuth();

  const loggedInStaffId =
    user?.staff?.id ||
    user?.staffId ||
    user?.id;

  const loggedInTeacherName =
    user?.staff?.name ||
    user?.name ||
    user?.fullName ||
    "Teacher";

  const [
    timetableData,
    setTimetableData,
  ] = useState([]);

  const [
    periodSlots,
    setPeriodSlots,
  ] = useState([]);

  const [
    assignedSections,
    setAssignedSections,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    sectionsLoading,
    setSectionsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    selectedDay,
    setSelectedDay,
  ] = useState(() => {
    const day =
      new Date().getDay();

    return day >= 1 && day <= 6
      ? day
      : 1;
  });

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    substituteContext,
    setSubstituteContext,
  ] = useState(null);

  /* ==========================================================
     LOAD TEACHER TIMETABLE
  ========================================================== */

  const loadTimetable =
    useCallback(async () => {
      if (!loggedInStaffId) {
        setError(
          "Teacher account information could not be found."
        );

        setLoading(false);

        return;
      }

      setLoading(true);
      setError("");

      try {
        const [
          slotsResponse,
          timetableResponse,
        ] = await Promise.all([
          getPeriodSlots().catch(
            () => ({ data: [] })
          ),

          getTeacherTimetable({
            staffId:
              loggedInStaffId,
          }),
        ]);

        const slots =
          Array.isArray(
            slotsResponse?.data
          )
            ? slotsResponse.data
            : Array.isArray(
                slotsResponse
              )
            ? slotsResponse
            : [];

        const raw =
          timetableResponse?.data ||
          timetableResponse;

        let entries = [];

        if (Array.isArray(raw)) {
          entries = raw;
        } else if (
          raw &&
          typeof raw === "object"
        ) {
          entries =
            Object.values(raw).flat();
        }

        setPeriodSlots(slots);
        setTimetableData(entries);
      } catch (err) {
        console.error(
          "Teacher timetable error:",
          err
        );

        setError(
          err?.response?.data
            ?.message ||
            err?.response?.data
              ?.error ||
            err?.message ||
            "Could not load your timetable."
        );
      } finally {
        setLoading(false);
      }
    }, [loggedInStaffId]);

  /* ==========================================================
     LOAD CLASS INCHARGE SECTIONS
  ========================================================== */

  const loadAssignedSections =
    useCallback(async () => {
      if (!loggedInStaffId) {
        setAssignedSections([]);
        setSectionsLoading(false);
        return;
      }

      setSectionsLoading(true);

      try {
        const response =
          await getAllSections();

        const sections =
          Array.isArray(
            response?.data
          )
            ? response.data
            : Array.isArray(response)
            ? response
            : [];

        const mine =
          sections.filter(
            (section) => {
              const teacherId =
                section
                  ?.classTeacher
                  ?.id ??
                section?.classTeacherId;

              return (
                String(
                  teacherId
                ) ===
                String(
                  loggedInStaffId
                )
              );
            }
          );

        setAssignedSections(
          mine
        );
      } catch (err) {
        console.error(
          "Could not load class incharge sections:",
          err
        );

        setAssignedSections([]);
      } finally {
        setSectionsLoading(false);
      }
    }, [loggedInStaffId]);

  useEffect(() => {
    loadTimetable();
    loadAssignedSections();
  }, [
    loadTimetable,
    loadAssignedSections,
  ]);

  /* ==========================================================
     BUILD WEEK
  ========================================================== */

  const slots = useMemo(() => {
    const map = new Map();

    periodSlots.forEach(
      (slot) => {
        map.set(slot.id, slot);
      }
    );

    timetableData.forEach(
      (entry) => {
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
      }
    );

    return Array.from(
      map.values()
    ).sort(
      (a, b) =>
        (a.slotNo || 0) -
        (b.slotNo || 0)
    );
  }, [
    periodSlots,
    timetableData,
  ]);

  const cellMap = useMemo(() => {
    const map = {};

    timetableData.forEach(
      (entry) => {
        const key = `${entry.dayOfWeek}-${entry.periodSlotId}`;

        if (!map[key]) {
          map[key] = [];
        }

        map[key].push(entry);
      }
    );

    return map;
  }, [timetableData]);

  const filteredEntries =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      if (!query) {
        return timetableData;
      }

      return timetableData.filter(
        (entry) =>
          entry.subject?.name
            ?.toLowerCase()
            .includes(query) ||
          entry.class?.name
            ?.toLowerCase()
            .includes(query) ||
          entry.section?.name
            ?.toLowerCase()
            .includes(query)
      );
    }, [
      timetableData,
      searchQuery,
    ]);

  const filteredCellMap =
    useMemo(() => {
      const map = {};

      filteredEntries.forEach(
        (entry) => {
          const key = `${entry.dayOfWeek}-${entry.periodSlotId}`;

          if (!map[key]) {
            map[key] = [];
          }

          map[key].push(entry);
        }
      );

      return map;
    }, [filteredEntries]);

  const todayLectures =
    timetableData.filter(
      (entry) =>
        Number(entry.dayOfWeek) ===
        Number(selectedDay)
    ).length;

  /* ==========================================================
     DOWNLOAD
  ========================================================== */

  const downloadPdf = () => {
    const oldTitle =
      document.title;

    document.title =
      `CAMPUS-IQ - ${loggedInTeacherName} - Timetable`;

    window.print();

    setTimeout(() => {
      document.title =
        oldTitle;
    }, 700);
  };

  /* ==========================================================
     SUBSTITUTE
  ========================================================== */

  const openSubstitute =
    (entry) => {
      setSubstituteContext({
        timetableId: entry.id,

        date: getDateForDay(
          entry.dayOfWeek
        ),

        subjectName:
          entry.subject?.name ||
          "Subject",

        className:
          entry.class?.name ||
          "Class",
      });
    };

  return (
    <div className="teacher-timetable-page">

      <TeacherTopbar
        searchPlaceholder="Search subject, class or section..."
        searchValue={searchQuery}
        onSearchChange={
          setSearchQuery
        }
      />

      <div className="timetable-content-container">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="timetable-header-section">

          <div className="timetable-title-area">

            <span className="teacher-timetable-eyebrow">
              TEACHER PORTAL
            </span>

            <h1>
              My Weekly Timetable
            </h1>

            <p>
              Welcome,{" "}
              <strong>
                {loggedInTeacherName}
              </strong>
              . View your classes,
              sections and weekly
              schedule.
            </p>

          </div>

          <div className="timetable-header-actions">

            <button
              type="button"
              className="btn-timetable-download"
              onClick={
                downloadPdf
              }
              disabled={
                timetableData.length ===
                0
              }
            >
              <Download size={16} />
              Download PDF
            </button>

            <button
              type="button"
              className="btn-timetable-action"
              onClick={() => {
                loadTimetable();
                loadAssignedSections();
              }}
            >
              <RefreshCw
                size={15}
                className={
                  loading
                    ? "teacher-spin"
                    : ""
                }
              />

              Refresh
            </button>

          </div>
        </div>

        {/* ==================================================
            CLASS INCHARGE
        ================================================== */}

        <section className="class-incharge-panel">

          <div className="class-incharge-heading">

            <div className="class-incharge-icon">
              <Crown size={20} />
            </div>

            <div>
              <h2>
                Class Incharge
              </h2>

              <p>
                Sections assigned to you
                as class teacher
              </p>
            </div>

          </div>

          {sectionsLoading ? (
            <div className="class-incharge-loading">
              Loading your assigned sections...
            </div>
          ) : assignedSections.length >
            0 ? (
            <div className="incharge-section-list">

              {assignedSections.map(
                (section) => (
                  <div
                    className="incharge-section-card"
                    key={section.id}
                  >

                    <div className="incharge-section-icon">
                      <GraduationCap
                        size={20}
                      />
                    </div>

                    <div className="incharge-section-info">

                      <span>
                        CLASS INCHARGE
                      </span>

                      <strong>
                        {section.class
                          ?.name ||
                          section.className ||
                          `Class ${section.classId}`}
                        {" - "}
                        {section.name}
                      </strong>

                    </div>

                    <div className="incharge-badge">
                      <Crown size={13} />
                      Incharge
                    </div>

                  </div>
                )
              )}

            </div>
          ) : (
            <div className="no-incharge-state">
              <UserRound size={19} />

              <span>
                You are not assigned as
                class incharge for any
                section.
              </span>
            </div>
          )}

        </section>

        {/* ==================================================
            STATS
        ================================================== */}

        <div className="timetable-stats-row">

          <div className="timetable-stat-card">

            <div className="stat-icon-wrapper stat-blue">
              <CalendarDays size={20} />
            </div>

            <div className="stat-info">
              <h3>
                {todayLectures}
              </h3>

              <p>
                Lectures on{" "}
                {
                  DAYS.find(
                    (day) =>
                      day.value ===
                      selectedDay
                  )?.label
                }
              </p>
            </div>

          </div>

          <div className="timetable-stat-card">

            <div className="stat-icon-wrapper stat-purple">
              <GraduationCap size={20} />
            </div>

            <div className="stat-info">
              <h3>
                {
                  new Set(
                    timetableData.map(
                      (entry) =>
                        `${entry.classId}-${entry.sectionId}`
                    )
                  ).size
                }
              </h3>

              <p>
                Assigned Classes
              </p>
            </div>

          </div>

          <div className="timetable-stat-card">

            <div className="stat-icon-wrapper stat-green">
              <Clock3 size={20} />
            </div>

            <div className="stat-info">
              <h3>
                {timetableData.length}
              </h3>

              <p>
                Weekly Lectures
              </p>
            </div>

          </div>

        </div>

        {/* ==================================================
            DAY SELECTOR
        ================================================== */}

        <div className="day-selector-card">

          <div className="day-tabs">

            {DAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                className={`day-tab-btn ${
                  selectedDay ===
                  day.value
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setSelectedDay(
                    day.value
                  )
                }
              >
                {day.label}

                {day.value ===
                  (new Date().getDay() ||
                    7) && (
                  <span className="today-indicator-badge">
                    Today
                  </span>
                )}
              </button>
            ))}

          </div>

        </div>

        {/* ==================================================
            WEEKLY TIMETABLE
        ================================================== */}

        <div className="teacher-week-card">

          <div className="teacher-week-header">

            <div>
              <h2>
                Weekly Schedule
              </h2>

              <p>
                Your assigned subjects,
                classes and sections
              </p>
            </div>

            <span>
              {filteredEntries.length}{" "}
              periods
            </span>

          </div>

          {loading ? (
            <div className="teacher-empty-state">
              <RefreshCw
                size={30}
                className="teacher-spin"
              />

              <h3>
                Loading timetable...
              </h3>

              <p>
                Please wait while we
                load your weekly schedule.
              </p>
            </div>
          ) : error ? (
            <div className="teacher-empty-state error">

              <h3>
                Unable to load timetable
              </h3>

              <p>{error}</p>

              <button
                type="button"
                className="btn-timetable-action"
                onClick={
                  loadTimetable
                }
              >
                Try Again
              </button>

            </div>
          ) : (
            <div className="teacher-week-table-wrap">

              <table className="teacher-week-table">

                <thead>
                  <tr>

                    <th className="teacher-time-column">
                      Time
                    </th>

                    {DAYS.map(
                      (day) => (
                        <th
                          key={
                            day.value
                          }
                          className={
                            selectedDay ===
                            day.value
                              ? "selected-day"
                              : ""
                          }
                        >
                          {day.label}

                          {day.value ===
                            (new Date().getDay() ||
                              7) && (
                            <small>
                              Today
                            </small>
                          )}
                        </th>
                      )
                    )}

                  </tr>
                </thead>

                <tbody>

                  {slots.map(
                    (slot) => {

                      if (
                        isBreak(slot)
                      ) {
                        return (
                          <tr
                            key={
                              slot.id
                            }
                            className="teacher-break-row"
                          >

                            <td>
                              {slot.label}
                              <small>
                                {formatRange(
                                  slot
                                )}
                              </small>
                            </td>

                            <td
                              colSpan={
                                DAYS.length
                              }
                            >
                              <Coffee
                                size={
                                  15
                                }
                              />

                              <strong>
                                {
                                  slot.label
                                }
                              </strong>

                              <span>
                                Break / Recess
                              </span>
                            </td>

                          </tr>
                        );
                      }

                      return (
                        <tr
                          key={
                            slot.id
                          }
                        >

                          <td className="teacher-time-cell">

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

                          {DAYS.map(
                            (day) => {

                              const entries =
                                filteredCellMap[
                                  `${day.value}-${slot.id}`
                                ] ||
                                [];

                              return (
                                <td
                                  key={
                                    day.value
                                  }
                                  className={
                                    selectedDay ===
                                    day.value
                                      ? "teacher-selected-cell"
                                      : ""
                                  }
                                >

                                  {entries.length ===
                                  0 ? (
                                    <span className="teacher-free">
                                      —
                                    </span>
                                  ) : (
                                    entries.map(
                                      (
                                        entry
                                      ) => {

                                        const sectionTeacherId =
                                          entry
                                            .section
                                            ?.classTeacher
                                            ?.id ??
                                          entry
                                            .section
                                            ?.classTeacherId;

                                        const isClassIncharge =
                                          String(
                                            sectionTeacherId
                                          ) ===
                                          String(
                                            loggedInStaffId
                                          );

                                        return (
                                          <div
                                            key={
                                              entry.id
                                            }
                                            className="teacher-period-card"
                                          >

                                            <strong className="teacher-subject">
                                              {entry.subject
                                                ?.name ||
                                                "Subject"}
                                            </strong>

                                            <span className="teacher-class">
                                              <GraduationCap
                                                size={
                                                  12
                                                }
                                              />

                                              {entry.class
                                                ?.name ||
                                                `Class ${entry.classId}`}

                                              {entry.section
                                                ?.name
                                                ? ` - ${entry.section.name}`
                                                : ""}
                                            </span>

                                            {isClassIncharge && (
                                              <span className="teacher-incharge-badge">
                                                <Crown
                                                  size={
                                                    11
                                                  }
                                                />

                                                Class Incharge
                                              </span>
                                            )}

                                            <button
                                              type="button"
                                              className="teacher-substitute-button"
                                              onClick={() =>
                                                openSubstitute(
                                                  entry
                                                )
                                              }
                                            >
                                              Find Substitute
                                            </button>

                                          </div>
                                        );
                                      }
                                    )
                                  )}

                                </td>
                              );
                            }
                          )}

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>

      {substituteContext && (
        <SubstitutePickerModal
          timetableId={
            substituteContext.timetableId
          }
          date={
            substituteContext.date
          }
          subjectName={
            substituteContext.subjectName
          }
          className={
            substituteContext.className
          }
          onClose={() =>
            setSubstituteContext(
              null
            )
          }
          onAssigned={() => {
            setSubstituteContext(
              null
            );

            loadTimetable();
          }}
        />
      )}

    </div>
  );
}