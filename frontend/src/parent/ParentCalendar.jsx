import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  GraduationCap,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { getHolidays } from "../api/holiday.api";
import { getExams } from "../api/exam.api";

import "./ParentCalendar.css";

/* ============================================================
   CONSTANTS
============================================================ */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = [
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
];

/*
 * Common Indian / Maharashtra-friendly calendar dates.
 *
 * These are only the built-in calendar layer.
 *
 * Admin-added holidays from the database are also loaded
 * and take priority over these entries on the same date.
 *
 * School-specific holidays should still be added by Admin.
 */

const INDIAN_HOLIDAYS = {
  2026: [
    ["2026-01-01", "New Year's Day"],
    ["2026-01-14", "Makar Sankranti"],
    ["2026-01-26", "Republic Day"],
    ["2026-03-03", "Holi"],
    ["2026-03-19", "Gudi Padwa"],
    ["2026-03-21", "Eid-ul-Fitr"],
    ["2026-03-26", "Ram Navami"],
    ["2026-03-31", "Mahavir Jayanti"],
    ["2026-04-03", "Good Friday"],
    ["2026-04-14", "Dr. Babasaheb Ambedkar Jayanti"],
    ["2026-05-01", "Maharashtra Day / Buddha Purnima"],
    ["2026-05-28", "Bakrid"],
    ["2026-06-26", "Muharram"],
    ["2026-08-15", "Independence Day"],
    ["2026-08-26", "Eid-e-Milad"],
    ["2026-08-28", "Raksha Bandhan"],
    ["2026-09-04", "Janmashtami"],
    ["2026-09-14", "Ganesh Chaturthi"],
    ["2026-10-02", "Mahatma Gandhi Jayanti"],
    ["2026-10-20", "Dussehra"],
    ["2026-11-08", "Diwali / Deepavali"],
    ["2026-11-10", "Diwali Padwa"],
    ["2026-11-24", "Guru Nanak Jayanti"],
    ["2026-12-25", "Christmas Day"],
  ],

  2027: [
    ["2027-01-01", "New Year's Day"],
    ["2027-01-15", "Makar Sankranti / Pongal"],
    ["2027-01-26", "Republic Day"],
    ["2027-02-19", "Chhatrapati Shivaji Maharaj Jayanti"],
    ["2027-03-06", "Maha Shivratri"],
    ["2027-03-10", "Ramzan Eid"],
    ["2027-03-22", "Holi"],
    ["2027-03-26", "Good Friday"],
    ["2027-04-07", "Gudi Padwa / Ugadi"],
    ["2027-04-14", "Ambedkar Jayanti"],
    ["2027-04-15", "Ram Navami"],
    ["2027-04-19", "Mahavir Jayanti"],
    ["2027-05-17", "Bakrid"],
    ["2027-05-20", "Buddha Purnima"],
    ["2027-06-16", "Muharram"],
    ["2027-07-05", "Rath Yatra"],
    ["2027-08-15", "Independence Day"],
    ["2027-08-17", "Raksha Bandhan"],
    ["2027-08-25", "Janmashtami"],
    ["2027-09-04", "Ganesh Chaturthi"],
    ["2027-10-02", "Mahatma Gandhi Jayanti"],
    ["2027-10-09", "Dussehra"],
    ["2027-10-29", "Diwali / Deepavali"],
    ["2027-11-04", "Chhat Puja"],
    ["2027-11-14", "Guru Nanak Jayanti"],
    ["2027-12-25", "Christmas Day"],
  ],
};

/* ============================================================
   DATE HELPERS
============================================================ */

const pad = (value) =>
  String(value).padStart(2, "0");

const toDateKey = (value) => {
  if (!value) return "";

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(value)
  ) {
    return value.slice(0, 10);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}`;
};

const parseDateKey = (key) => {
  const [year, month, day] = key
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
};

const isSunday = (key) => {
  return parseDateKey(key).getDay() === 0;
};

const formatLongDate = (key) => {
  if (!key) return "";

  return parseDateKey(key).toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
};

const formatShortDate = (key) => {
  if (!key) return "";

  return parseDateKey(key).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
};

const getDaysInMonth = (year, monthIndex) => {
  return new Date(
    year,
    monthIndex + 1,
    0
  ).getDate();
};

/* ============================================================
   BUILD BUILT-IN HOLIDAYS
============================================================ */

const getBuiltInHolidays = (year) => {
  const records =
    INDIAN_HOLIDAYS[year] || [];

  return records.map(
    ([date, name]) => ({
      id: `indian-${date}`,
      date,
      name,
      holidayType: "indian",
      source: "Indian Calendar",
    })
  );
};

/* ============================================================
   PARENT CALENDAR
============================================================ */

export default function ParentCalendar() {
  const today = new Date();

  const todayKey =
    `${today.getFullYear()}-${pad(
      today.getMonth() + 1
    )}-${pad(today.getDate())}`;

  const [currentMonth, setCurrentMonth] =
    useState(today.getMonth());

  const [currentYear, setCurrentYear] =
    useState(today.getFullYear());

  const [selectedDate, setSelectedDate] =
    useState(todayKey);

  const [holidays, setHolidays] =
    useState([]);

  const [exams, setExams] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ==========================================================
     LOAD CALENDAR DATA
  ========================================================== */

  const loadCalendar = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        /*
         * IMPORTANT:
         *
         * We DO NOT call getMyChildren().
         * Calendar is school-wide and does not require
         * a linked child.
         */

        const [
          holidayResponse,
          examResponse,
        ] = await Promise.all([
          getHolidays(),
          getExams({
            includeInactive: false,
          }),
        ]);

        const adminHolidays =
          holidayResponse?.data || [];

        const examList =
          examResponse?.data || [];

        setHolidays(adminHolidays);
        setExams(examList);
      } catch (err) {
        console.error(
          "Calendar loading error:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load school calendar."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  /* ==========================================================
     MERGE ADMIN HOLIDAYS + INDIAN CALENDAR
  ========================================================== */

  const holidayMap = useMemo(() => {
    const map = new Map();

    /*
     * First add built-in Indian holidays.
     */

    const years = [
      currentYear - 1,
      currentYear,
      currentYear + 1,
    ];

    years.forEach((year) => {
      getBuiltInHolidays(year).forEach(
        (holiday) => {
          if (!map.has(holiday.date)) {
            map.set(
              holiday.date,
              holiday
            );
          }
        }
      );
    });

    /*
     * Admin holidays override built-in holiday
     * on the same date.
     */

    holidays.forEach((holiday) => {
      const key = toDateKey(
        holiday.date
      );

      if (!key) return;

      map.set(key, {
        id:
          holiday.id ||
          `admin-${key}`,

        date: key,

        name:
          holiday.name ||
          "School Holiday",

        holidayType:
          holiday.holidayType ||
          "school",

        source: "Admin Added",
      });
    });

    return map;
  }, [
    holidays,
    currentYear,
  ]);

  /* ==========================================================
     EXAM OCCURRENCES
  ========================================================== */

  const examOccurrences = useMemo(() => {
    const occurrences = [];

    exams.forEach((exam) => {
      const startKey =
        toDateKey(exam.startDate);

      const endKey =
        toDateKey(exam.endDate);

      if (!startKey || !endKey) {
        return;
      }

      let current =
        parseDateKey(startKey);

      const end =
        parseDateKey(endKey);

      while (current <= end) {
        const key =
          `${current.getFullYear()}-${pad(
            current.getMonth() + 1
          )}-${pad(current.getDate())}`;

        /*
         * IMPORTANT:
         *
         * Never display an exam on Sunday.
         */

        const sunday =
          current.getDay() === 0;

        /*
         * Never display an exam on a holiday.
         */

        const holiday =
          holidayMap.get(key);

        if (!sunday && !holiday) {
          occurrences.push({
            id:
              `${exam.id}-${key}`,

            examId: exam.id,

            date: key,

            name:
              exam.name ||
              "Examination",

            examType:
              exam.examType ||
              "exam",

            className:
              exam.class?.name ||
              "School-wide",

            startDate: startKey,

            endDate: endKey,
          });
        }

        current.setDate(
          current.getDate() + 1
        );
      }
    });

    return occurrences;
  }, [
    exams,
    holidayMap,
  ]);

  /* ==========================================================
     EXAM OCCURRENCES BY DATE
  ========================================================== */

  const examsByDate = useMemo(() => {
    const map = new Map();

    examOccurrences.forEach(
      (exam) => {
        if (!map.has(exam.date)) {
          map.set(exam.date, []);
        }

        map
          .get(exam.date)
          .push(exam);
      }
    );

    return map;
  }, [examOccurrences]);

  /* ==========================================================
     CALENDAR CELLS
  ========================================================== */

  const calendarCells = useMemo(() => {
    const cells = [];

    const firstDay =
      new Date(
        currentYear,
        currentMonth,
        1
      ).getDay();

    const days =
      getDaysInMonth(
        currentYear,
        currentMonth
      );

    /*
     * Previous month empty cells
     */

    for (
      let i = 0;
      i < firstDay;
      i++
    ) {
      cells.push({
        empty: true,
        id: `empty-${i}`,
      });
    }

    /*
     * Actual month days
     */

    for (
      let day = 1;
      day <= days;
      day++
    ) {
      const key =
        `${currentYear}-${pad(
          currentMonth + 1
        )}-${pad(day)}`;

      cells.push({
        empty: false,
        key,
        day,
      });
    }

    return cells;
  }, [
    currentMonth,
    currentYear,
  ]);

  /* ==========================================================
     CURRENT MONTH HOLIDAYS
  ========================================================== */

  const monthHolidays = useMemo(() => {
    const prefix =
      `${currentYear}-${pad(
        currentMonth + 1
      )}`;

    return Array.from(
      holidayMap.values()
    )
      .filter((holiday) =>
        holiday.date.startsWith(prefix)
      )
      .sort((a, b) =>
        a.date.localeCompare(b.date)
      );
  }, [
    holidayMap,
    currentMonth,
    currentYear,
  ]);

  /* ==========================================================
     CURRENT MONTH EXAM DAYS
  ========================================================== */

  const monthExamDays = useMemo(() => {
    const prefix =
      `${currentYear}-${pad(
        currentMonth + 1
      )}`;

    return examOccurrences.filter(
      (exam) =>
        exam.date.startsWith(prefix)
    );
  }, [
    examOccurrences,
    currentMonth,
    currentYear,
  ]);

  /* ==========================================================
     UPCOMING HOLIDAY
  ========================================================== */

  const nextHoliday = useMemo(() => {
    return (
      Array.from(
        holidayMap.values()
      )
        .filter(
          (holiday) =>
            holiday.date >= todayKey
        )
        .sort((a, b) =>
          a.date.localeCompare(b.date)
        )[0] || null
    );
  }, [
    holidayMap,
    todayKey,
  ]);

  /* ==========================================================
     UPCOMING EXAMS
  ========================================================== */

  const upcomingExamPeriods =
    useMemo(() => {
      return exams
        .map((exam) => {
          const occurrences =
            examOccurrences.filter(
              (item) =>
                item.examId === exam.id
            );

          if (
            occurrences.length === 0
          ) {
            return null;
          }

          const dates =
            occurrences
              .map(
                (item) => item.date
              )
              .sort();

          const firstDate =
            dates[0];

          const lastDate =
            dates[dates.length - 1];

          return {
            ...exam,

            firstDate,

            lastDate,

            validDays:
              dates.length,

            className:
              exam.class?.name ||
              "School-wide",
          };
        })
        .filter(Boolean)
        .filter(
          (exam) =>
            exam.lastDate >= todayKey
        )
        .sort((a, b) =>
          a.firstDate.localeCompare(
            b.firstDate
          )
        );
    }, [
      exams,
      examOccurrences,
      todayKey,
    ]);

  /* ==========================================================
     SELECTED DATE DATA
  ========================================================== */

  const selectedHoliday =
    holidayMap.get(
      selectedDate
    );

  const selectedExams =
    examsByDate.get(
      selectedDate
    ) || [];

  const selectedIsSunday =
    isSunday(selectedDate);

  /* ==========================================================
     NAVIGATION
  ========================================================== */

  const goPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(
        currentYear - 1
      );
    } else {
      setCurrentMonth(
        currentMonth - 1
      );
    }
  };

  const goNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(
        currentYear + 1
      );
    } else {
      setCurrentMonth(
        currentMonth + 1
      );
    }
  };

  const goToday = () => {
    setCurrentMonth(
      today.getMonth()
    );

    setCurrentYear(
      today.getFullYear()
    );

    setSelectedDate(
      todayKey
    );
  };

  /* ==========================================================
     REFRESH
  ========================================================== */

  const refreshCalendar = () => {
    loadCalendar();
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="parent-calendar-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="parent-calendar-header">

        <div className="parent-calendar-heading">

          <div className="parent-calendar-title-icon">
            <CalendarDays size={28} />
          </div>

          <div>
            <div className="parent-calendar-title-row">

              <h1>
                School Calendar
              </h1>

              <span className="view-only-badge">
                <ShieldCheck size={14} />
                View Only
              </span>

            </div>

            <p>
              Stay informed about school holidays,
              important Indian festivals and examination dates.
            </p>
          </div>

        </div>

        <button
          type="button"
          className="parent-calendar-refresh"
          onClick={refreshCalendar}
          disabled={loading}
        >
          {loading ? (
            <Loader2
              size={17}
              className="spin"
            />
          ) : (
            <RefreshCw size={17} />
          )}

          Refresh
        </button>

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="parent-calendar-error">
          <AlertCircle size={18} />

          <div>
            <strong>
              Calendar could not be fully loaded
            </strong>

            <span>
              {error}
            </span>
          </div>
        </div>
      )}

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading ? (
        <div className="parent-calendar-loading">

          <Loader2
            size={36}
            className="spin"
          />

          <h3>
            Loading school calendar...
          </h3>

          <p>
            Fetching holidays and examination schedules.
          </p>

        </div>
      ) : (
        <>
          {/* ==================================================
              STAT CARDS
          ================================================== */}

          <div className="parent-calendar-stats">

            <div className="calendar-stat-card purple">

              <div className="calendar-stat-icon">
                <CalendarDays size={22} />
              </div>

              <div>
                <span>
                  HOLIDAYS
                </span>

                <strong>
                  {monthHolidays.length}
                </strong>

                <small>
                  This month
                </small>
              </div>

            </div>

            <div className="calendar-stat-card blue">

              <div className="calendar-stat-icon">
                <GraduationCap size={22} />
              </div>

              <div>
                <span>
                  EXAM DAYS
                </span>

                <strong>
                  {monthExamDays.length}
                </strong>

                <small>
                  Valid school days
                </small>
              </div>

            </div>

            <div className="calendar-stat-card green">

              <div className="calendar-stat-icon">
                <Clock3 size={22} />
              </div>

              <div>
                <span>
                  WEEKLY OFFS
                </span>

                <strong>
                  {
                    calendarCells.filter(
                      (cell) =>
                        !cell.empty &&
                        parseDateKey(
                          cell.key
                        ).getDay() === 0
                    ).length
                  }
                </strong>

                <small>
                  Sundays
                </small>
              </div>

            </div>

            <div className="calendar-stat-card orange">

              <div className="calendar-stat-icon">
                <Flag size={22} />
              </div>

              <div className="next-holiday-stat">

                <span>
                  NEXT HOLIDAY
                </span>

                <strong>
                  {nextHoliday
                    ? nextHoliday.name
                    : "No upcoming holiday"}
                </strong>

                <small>
                  {nextHoliday
                    ? formatShortDate(
                        nextHoliday.date
                      )
                    : "School calendar"}
                </small>

              </div>

            </div>

          </div>

          {/* ==================================================
              MAIN CALENDAR AREA
          ================================================== */}

          <div className="parent-calendar-layout">

            {/* =================================================
                CALENDAR
            ================================================= */}

            <section className="calendar-main-card">

              <div className="calendar-month-header">

                <div>
                  <h2>
                    {MONTHS[currentMonth]}{" "}
                    {currentYear}
                  </h2>

                  <p>
                    Monthly holiday and examination overview
                  </p>
                </div>

                <div className="calendar-navigation">

                  <button
                    type="button"
                    onClick={goToday}
                    className="today-button"
                  >
                    Today
                  </button>

                  <button
                    type="button"
                    onClick={goPreviousMonth}
                    className="calendar-nav-button"
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={19} />
                  </button>

                  <button
                    type="button"
                    onClick={goNextMonth}
                    className="calendar-nav-button"
                    aria-label="Next month"
                  >
                    <ChevronRight size={19} />
                  </button>

                </div>

              </div>

              {/* =================================================
                  WEEKDAY HEADER
              ================================================= */}

              <div className="calendar-weekdays">

                {WEEKDAYS.map(
                  (day) => (
                    <div
                      key={day}
                      className={
                        day === "SUN"
                          ? "sunday-header"
                          : ""
                      }
                    >
                      {day}
                    </div>
                  )
                )}

              </div>

              {/* =================================================
                  CALENDAR GRID
              ================================================= */}

              <div className="calendar-grid">

                {calendarCells.map(
                  (cell) => {

                    if (cell.empty) {
                      return (
                        <div
                          key={cell.id}
                          className="calendar-day empty"
                        />
                      );
                    }

                    const holiday =
                      holidayMap.get(
                        cell.key
                      );

                    const dayExams =
                      examsByDate.get(
                        cell.key
                      ) || [];

                    const sunday =
                      isSunday(
                        cell.key
                      );

                    const today =
                      cell.key ===
                      todayKey;

                    const selected =
                      cell.key ===
                      selectedDate;

                    return (
                      <button
                        type="button"
                        key={cell.key}
                        className={[
                          "calendar-day",
                          selected
                            ? "selected"
                            : "",
                          today
                            ? "today"
                            : "",
                          sunday
                            ? "sunday"
                            : "",
                          holiday
                            ? "has-holiday"
                            : "",
                          dayExams.length
                            ? "has-exam"
                            : "",
                        ].join(" ")}
                        onClick={() =>
                          setSelectedDate(
                            cell.key
                          )
                        }
                      >

                        <div className="calendar-day-number">
                          {cell.day}

                          {today && (
                            <span className="today-label">
                              TODAY
                            </span>
                          )}
                        </div>

                        {/* Holiday */}

                        {holiday && (
                          <div className="calendar-event holiday-event">
                            <Flag size={12} />

                            <span>
                              {holiday.name}
                            </span>
                          </div>
                        )}

                        {/* Sunday */}

                        {sunday && (
                          <div className="calendar-weekly-off">
                            Weekly Off
                          </div>
                        )}

                        {/* Exams */}

                        {dayExams
                          .slice(0, 3)
                          .map(
                            (exam) => (
                              <div
                                key={
                                  exam.id
                                }
                                className="calendar-event exam-event"
                              >
                                <GraduationCap
                                  size={12}
                                />

                                <span>
                                  {exam.name}
                                </span>
                              </div>
                            )
                          )}

                        {dayExams.length >
                          3 && (
                          <div className="more-events">
                            +
                            {dayExams.length -
                              3}{" "}
                            more
                          </div>
                        )}

                      </button>
                    );
                  }
                )}

              </div>

              {/* =================================================
                  LEGEND
              ================================================= */}

              <div className="calendar-legend">

                <div>
                  <span className="legend-dot holiday"></span>
                  Holiday
                </div>

                <div>
                  <span className="legend-dot exam"></span>
                  Exam
                </div>

                <div>
                  <span className="legend-dot sunday"></span>
                  Sunday
                </div>

                <div>
                  <span className="legend-dot today"></span>
                  Today
                </div>

              </div>

            </section>

            {/* =================================================
                RIGHT PANEL
            ================================================= */}

            <aside className="calendar-side-panel">

              {/* =================================================
                  SELECTED DATE
              ================================================= */}

              <div className="selected-date-card">

                <div className="side-card-label">
                  SELECTED DATE
                </div>

                <h3>
                  {formatLongDate(
                    selectedDate
                  )}
                </h3>

                <div className="selected-date-content">

                  {selectedHoliday && (
                    <div className="selected-event holiday-selected">

                      <div className="selected-event-icon holiday">
                        <Flag size={20} />
                      </div>

                      <div>
                        <strong>
                          {selectedHoliday.name}
                        </strong>

                        <span>
                          {selectedHoliday.source}
                        </span>
                      </div>

                    </div>
                  )}

                  {selectedExams.map(
                    (exam) => (
                      <div
                        key={exam.id}
                        className="selected-event exam-selected"
                      >

                        <div className="selected-event-icon exam">
                          <GraduationCap
                            size={20}
                          />
                        </div>

                        <div>
                          <strong>
                            {exam.name}
                          </strong>

                          <span>
                            {exam.className}
                          </span>

                          <small>
                            {exam.examType}
                          </small>
                        </div>

                      </div>
                    )
                  )}

                  {selectedIsSunday &&
                    !selectedHoliday &&
                    selectedExams.length ===
                      0 && (
                      <div className="selected-empty">

                        <div className="selected-empty-icon">
                          <Clock3 size={25} />
                        </div>

                        <strong>
                          Weekly Off
                        </strong>

                        <span>
                          Sunday is a regular weekly holiday.
                        </span>

                      </div>
                    )}

                  {!selectedIsSunday &&
                    !selectedHoliday &&
                    selectedExams.length ===
                      0 && (
                      <div className="selected-empty">

                        <div className="selected-empty-icon">
                          <CalendarDays
                            size={25}
                          />
                        </div>

                        <strong>
                          No special event
                        </strong>

                        <span>
                          Regular school day unless otherwise
                          communicated by the school.
                        </span>

                      </div>
                    )}

                </div>

              </div>

              {/* =================================================
                  UPCOMING
              ================================================= */}

              <div className="upcoming-card">

                <div className="upcoming-header">

                  <div>
                    <span>
                      UPCOMING
                    </span>

                    <h3>
                      Holidays & Exams
                    </h3>
                  </div>

                  <Flag size={20} />

                </div>

                <div className="upcoming-list">

                  {monthHolidays
                    .filter(
                      (holiday) =>
                        holiday.date >=
                        todayKey
                    )
                    .slice(0, 5)
                    .map(
                      (holiday) => (
                        <button
                          type="button"
                          key={`holiday-${holiday.id}`}
                          className="upcoming-item"
                          onClick={() => {
                            setSelectedDate(
                              holiday.date
                            );

                            setCurrentMonth(
                              parseDateKey(
                                holiday.date
                              ).getMonth()
                            );

                            setCurrentYear(
                              parseDateKey(
                                holiday.date
                              ).getFullYear()
                            );
                          }}
                        >

                          <div className="upcoming-date holiday">
                            <strong>
                              {parseDateKey(
                                holiday.date
                              ).getDate()}
                            </strong>

                            <span>
                              {MONTHS[
                                parseDateKey(
                                  holiday.date
                                ).getMonth()
                              ].slice(0, 3)}
                            </span>
                          </div>

                          <div className="upcoming-info">

                            <strong>
                              {holiday.name}
                            </strong>

                            <span>
                              {holiday.source}
                            </span>

                          </div>

                          <ChevronRight
                            size={18}
                          />

                        </button>
                      )
                    )}

                  {upcomingExamPeriods
                    .slice(0, 5)
                    .map(
                      (exam) => (
                        <button
                          type="button"
                          key={`exam-${exam.id}`}
                          className="upcoming-item"
                          onClick={() => {
                            setSelectedDate(
                              exam.firstDate
                            );

                            const date =
                              parseDateKey(
                                exam.firstDate
                              );

                            setCurrentMonth(
                              date.getMonth()
                            );

                            setCurrentYear(
                              date.getFullYear()
                            );
                          }}
                        >

                          <div className="upcoming-date exam">
                            <strong>
                              {parseDateKey(
                                exam.firstDate
                              ).getDate()}
                            </strong>

                            <span>
                              {MONTHS[
                                parseDateKey(
                                  exam.firstDate
                                ).getMonth()
                              ].slice(0, 3)}
                            </span>
                          </div>

                          <div className="upcoming-info">

                            <strong>
                              {exam.name}
                            </strong>

                            <span>
                              {exam.className} •{" "}
                              {exam.validDays} valid exam day
                              {exam.validDays !== 1
                                ? "s"
                                : ""}
                            </span>

                            <small>
                              {formatShortDate(
                                exam.firstDate
                              )}{" "}
                              –{" "}
                              {formatShortDate(
                                exam.lastDate
                              )}
                            </small>

                          </div>

                          <ChevronRight
                            size={18}
                          />

                        </button>
                      )
                    )}

                  {monthHolidays.filter(
                    (holiday) =>
                      holiday.date >=
                      todayKey
                  ).length === 0 &&
                    upcomingExamPeriods.length ===
                      0 && (
                      <div className="upcoming-empty">
                        No upcoming holidays or exams.
                      </div>
                    )}

                </div>

              </div>

              {/* =================================================
                  VIEW ONLY NOTE
              ================================================= */}

              <div className="calendar-view-note">

                <ShieldCheck size={17} />

                <div>
                  <strong>
                    Parent view only
                  </strong>

                  <span>
                    Calendar information is maintained
                    by the school administration.
                  </span>
                </div>

              </div>

            </aside>

          </div>
        </>
      )}

    </div>
  );
}