import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  Clock,
  FileText,
  GraduationCap,
  Info,
  RefreshCw,
  User,
  Users,
} from "lucide-react";

import { getMyChildren } from "../api/parent.api";
import { getExamsByClass } from "../api/parentExam.api";

import "./ParentExams.css";

/*
============================================================
 CONSTANTS
============================================================
*/

const EXAM_TYPE_LABELS = {
  unit_test_1: "Unit Test 1",
  unit_test_2: "Unit Test 2",
  half_yearly: "Half Yearly",
  annual: "Annual",
  pre_board: "Pre-Board",
  practical: "Practical",
  internal_assessment: "Internal Assessment",
};

const STATUS_META = {
  upcoming: { label: "Upcoming", tone: "upcoming" },
  ongoing: { label: "Ongoing", tone: "ongoing" },
  completed: { label: "Completed", tone: "completed" },
};

/*
============================================================
 HELPERS
============================================================
*/

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  fallback;

/*
 * Same shape MyChildren.jsx uses:
 * id, studentName, class.name, section.name
 */
const normalizeChild = (child) => ({
  id: child?.id ?? null,
  name: child?.studentName || "Student",
  classId: child?.classId ?? child?.class?.id ?? null,
  className: child?.class?.name || "",
  sectionName: child?.section?.name || "",
});

/*
 * Dates come from the API as "2026-07-01T00:00:00.000Z".
 * We only use the "YYYY-MM-DD" part so timezones never
 * shift the day.
 */
const dateKey = (value) => String(value || "").slice(0, 10);

const getTodayKey = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
};

const keyToUtc = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

const daysBetween = (fromKey, toKey) =>
  Math.round((keyToUtc(toKey) - keyToUtc(fromKey)) / 86400000);

const formatDate = (key) => {
  if (!key || key.length !== 10) return "—";

  const [y, m, d] = key.split("-").map(Number);

  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateRange = (startKey, endKey) =>
  startKey === endKey
    ? formatDate(startKey)
    : `${formatDate(startKey)} – ${formatDate(endKey)}`;

const getExamStatus = (startKey, endKey, todayKey) => {
  if (endKey < todayKey) return "completed";
  if (startKey > todayKey) return "upcoming";
  return "ongoing";
};

/*
============================================================
 EXAM CARD
============================================================
*/

function ExamCard({ exam, child }) {
  const statusMeta = STATUS_META[exam.status];

  const classText = exam.class?.name || child.className || "—";
  const classLabel = child.sectionName
    ? `${classText} - ${child.sectionName}`
    : classText;

  let countdown = "";

  if (exam.status === "upcoming") {
    countdown =
      exam.daysToStart === 1
        ? "Starts tomorrow"
        : `Starts in ${exam.daysToStart} days`;
  } else if (exam.status === "ongoing") {
    countdown = "In progress";
  }

  return (
    <div className="parent-exam-card">
      <div className="parent-exam-card-header">
        <div className="parent-exam-card-title">
          <h3>{exam.name}</h3>

          <span className="parent-exam-type-badge">
            {EXAM_TYPE_LABELS[exam.examType] || exam.examType}
          </span>
        </div>

        <span
          className={`parent-exam-status parent-exam-status-${statusMeta.tone}`}
        >
          {statusMeta.label}
        </span>
      </div>

      {countdown && <p className="parent-exam-countdown">{countdown}</p>}

      <div className="parent-exam-details-grid">
        <div className="parent-exam-detail-item">
          <div className="parent-exam-detail-icon">
            <CalendarDays size={16} />
          </div>

          <div className="parent-exam-detail-text">
            <span className="detail-label">Exam Dates</span>
            <span className="detail-value">
              {formatDateRange(exam.startKey, exam.endKey)}
            </span>
          </div>
        </div>

        <div className="parent-exam-detail-item">
          <div className="parent-exam-detail-icon">
            <Clock size={16} />
          </div>

          <div className="parent-exam-detail-text">
            <span className="detail-label">Duration</span>
            <span className="detail-value">
              {exam.durationDays} {exam.durationDays === 1 ? "day" : "days"}
            </span>
          </div>
        </div>

        <div className="parent-exam-detail-item">
          <div className="parent-exam-detail-icon">
            <GraduationCap size={16} />
          </div>

          <div className="parent-exam-detail-text">
            <span className="detail-label">Class</span>
            <span className="detail-value">{classLabel}</span>
          </div>
        </div>

        <div className="parent-exam-detail-item">
          <div className="parent-exam-detail-icon">
            <BookOpen size={16} />
          </div>

          <div className="parent-exam-detail-text">
            <span className="detail-label">Academic Year</span>
            <span className="detail-value">
              {exam.academicYear?.name || "—"}
            </span>
          </div>
        </div>
      </div>

      {exam.status === "completed" && (
        <p className="parent-exam-result-note">
          <Info size={14} />
          Marks and results are not available in the parent portal yet.
        </p>
      )}
    </div>
  );
}

/*
============================================================
 PARENT EXAMS PAGE
============================================================
*/

export default function ParentExams() {
  const [children, setChildren] = useState([]);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [childrenError, setChildrenError] = useState("");
  const [childrenReload, setChildrenReload] = useState(0);
  const [selectedChildId, setSelectedChildId] = useState(null);

  const [exams, setExams] = useState([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const [examsError, setExamsError] = useState("");
  const [examsReload, setExamsReload] = useState(0);

  const [activeTab, setActiveTab] = useState("upcoming");

  /*
   * ----------------------------------------------------------
   * LOAD CHILDREN (same API MyChildren.jsx uses)
   * ----------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    const loadChildren = async () => {
      setChildrenLoading(true);
      setChildrenError("");

      try {
        const res = await getMyChildren();

        const raw = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];

        if (cancelled) return;

        const list = raw.map(normalizeChild);

        setChildren(list);
        setSelectedChildId((previous) => previous ?? list[0]?.id ?? null);
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load children:", error);

        setChildrenError(
          getErrorMessage(error, "Unable to load your children.")
        );
      } finally {
        if (!cancelled) setChildrenLoading(false);
      }
    };

    loadChildren();

    return () => {
      cancelled = true;
    };
  }, [childrenReload]);

  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId) || null,
    [children, selectedChildId]
  );

  const classId = selectedChild?.classId ?? null;

  /*
   * ----------------------------------------------------------
   * LOAD EXAMS FOR SELECTED CHILD'S CLASS
   * ----------------------------------------------------------
   */

  useEffect(() => {
    if (!classId) {
      setExams([]);
      setExamsError("");
      setExamsLoading(false);
      return undefined;
    }

    let cancelled = false;

    const loadExams = async () => {
      setExamsLoading(true);
      setExamsError("");

      try {
        const list = await getExamsByClass(classId);

        if (!cancelled) setExams(list);
      } catch (error) {
        if (cancelled) return;

        setExams([]);
        setExamsError(getErrorMessage(error, "Unable to load exams."));
      } finally {
        if (!cancelled) setExamsLoading(false);
      }
    };

    loadExams();

    return () => {
      cancelled = true;
    };
  }, [classId, examsReload]);

  /*
   * ----------------------------------------------------------
   * SPLIT INTO UPCOMING / COMPLETED
   * ----------------------------------------------------------
   */

  const { upcoming, completed } = useMemo(() => {
    const today = getTodayKey();

    const prepared = exams.map((exam) => {
      const startKey = dateKey(exam.startDate);
      const endKey = dateKey(exam.endDate);

      return {
        ...exam,
        startKey,
        endKey,
        status: getExamStatus(startKey, endKey, today),
        daysToStart: daysBetween(today, startKey),
        durationDays: daysBetween(startKey, endKey) + 1,
      };
    });

    return {
      upcoming: prepared
        .filter((exam) => exam.status !== "completed")
        .sort((a, b) => a.startKey.localeCompare(b.startKey)),

      completed: prepared
        .filter((exam) => exam.status === "completed")
        .sort((a, b) => b.endKey.localeCompare(a.endKey)),
    };
  }, [exams]);

  const visibleExams = activeTab === "upcoming" ? upcoming : completed;

  /*
   * ----------------------------------------------------------
   * RENDER: CHILDREN STATES
   * ----------------------------------------------------------
   */

  if (childrenLoading) {
    return (
      <div className="parent-exams-page">
        <div className="parent-exams-loading">
          <div className="parent-exams-spinner"></div>
          <p>Loading exams…</p>
        </div>
      </div>
    );
  }

  if (childrenError) {
    return (
      <div className="parent-exams-page">
        <div className="parent-exams-error">
          <div className="parent-exams-error-icon">
            <AlertCircle size={28} />
          </div>

          <h3>Unable to Load</h3>
          <p>{childrenError}</p>

          <button
            type="button"
            className="parent-exams-retry-btn"
            onClick={() => setChildrenReload((count) => count + 1)}
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="parent-exams-page">
        <div className="parent-exams-empty">
          <div className="parent-exams-empty-icon">
            <Users size={36} />
          </div>

          <h3>No Children Found</h3>
          <p>
            No children are currently linked to your account. Please contact
            the school administration for assistance.
          </p>
        </div>
      </div>
    );
  }

  /*
   * ----------------------------------------------------------
   * RENDER: MAIN
   * ----------------------------------------------------------
   */

  return (
    <div className="parent-exams-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="parent-exams-topbar">
        <div>
          <h1>Exams</h1>
          <p>
            View upcoming and completed exams scheduled for your child&apos;s
            class.
          </p>
        </div>

        <div className="parent-exams-count-badge">
          <span className="count-number">{upcoming.length}</span>
          <span className="count-label">Upcoming Exams</span>
        </div>
      </div>

      {/* =================================================
          CHILD SELECTOR
      ================================================= */}

      {children.length > 1 && (
        <div className="parent-exams-child-tabs">
          {children.map((child) => (
            <button
              key={child.id}
              type="button"
              className={`parent-exams-child-chip ${
                child.id === selectedChildId ? "active" : ""
              }`}
              onClick={() => setSelectedChildId(child.id)}
            >
              {child.name}
            </button>
          ))}
        </div>
      )}

      {selectedChild && (
        <p className="parent-exams-child-info">
          <User size={15} />
          <strong>{selectedChild.name}</strong>
          {selectedChild.className && (
            <span>
              {selectedChild.className}
              {selectedChild.sectionName
                ? ` - ${selectedChild.sectionName}`
                : ""}
            </span>
          )}
        </p>
      )}

      {/* =================================================
          TABS
      ================================================= */}

      <div className="parent-exams-tabs">
        <button
          type="button"
          className={`parent-exams-tab ${
            activeTab === "upcoming" ? "active" : ""
          }`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming
          <span className="parent-exams-tab-count">{upcoming.length}</span>
        </button>

        <button
          type="button"
          className={`parent-exams-tab ${
            activeTab === "completed" ? "active" : ""
          }`}
          onClick={() => setActiveTab("completed")}
        >
          Completed
          <span className="parent-exams-tab-count">{completed.length}</span>
        </button>
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      {!classId ? (
        <div className="parent-exams-empty">
          <div className="parent-exams-empty-icon">
            <GraduationCap size={36} />
          </div>

          <h3>Class Not Available</h3>
          <p>
            We could not find class information for this student, so exams
            cannot be shown.
          </p>
        </div>
      ) : examsLoading ? (
        <div className="parent-exams-loading">
          <div className="parent-exams-spinner"></div>
          <p>Loading exams…</p>
        </div>
      ) : examsError ? (
        <div className="parent-exams-error">
          <div className="parent-exams-error-icon">
            <AlertCircle size={28} />
          </div>

          <h3>Unable to Load Exams</h3>
          <p>{examsError}</p>

          <button
            type="button"
            className="parent-exams-retry-btn"
            onClick={() => setExamsReload((count) => count + 1)}
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      ) : visibleExams.length === 0 ? (
        <div className="parent-exams-empty">
          <div className="parent-exams-empty-icon">
            <FileText size={36} />
          </div>

          <h3>
            {activeTab === "upcoming"
              ? "No Upcoming Exams"
              : "No Completed Exams"}
          </h3>

          <p>
            {activeTab === "upcoming"
              ? "There are no exams scheduled for this class right now."
              : "Completed exams will appear here."}
          </p>
        </div>
      ) : (
        <div className="parent-exams-grid">
          {visibleExams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} child={selectedChild} />
          ))}
        </div>
      )}
    </div>
  );
}