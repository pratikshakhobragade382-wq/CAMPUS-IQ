import { useEffect, useState } from "react";
import {
  CalendarDays,
  BookOpen,
  Clock3,
  FileText,
  RefreshCw,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import axiosClient from "../api/axios";
import { getMyStudentProfile } from "../api/studentPortal.api";

import "./StudentExams.css";

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatExamType(value) {
  if (!value) return "Exam";

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getExamStatus(startDate, endDate) {
  const now = new Date();

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (start && now < start) {
    return "upcoming";
  }

  if (end && now > end) {
    return "completed";
  }

  return "ongoing";
}

function getErrorMessage(error) {
  if (!error?.response) {
    return "Unable to connect to the CampusIQ server.";
  }

  if (error.response.status === 401) {
    return "Your session has expired. Please login again.";
  }

  if (error.response.status === 403) {
    return "You do not have permission to view exams.";
  }

  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    "Unable to load exams."
  );
}

export default function StudentExams() {
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadExams = async () => {
    setLoading(true);
    setError("");

    try {
      // First get the logged-in student's profile.
      // The backend identifies the student from JWT.
      const profileResponse = await getMyStudentProfile();
      const student = profileResponse?.data;

      if (!student?.classId) {
        setExams([]);
        setError("Your class information is not available.");
        return;
      }

      // The exam API supports classId filtering.
      const response = await axiosClient.get("/exams", {
        params: {
          classId: student.classId,
        },
      });

      const data = response?.data?.data;

      setExams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load student exams:", err);
      setError(getErrorMessage(err));
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const upcomingExams = exams.filter(
    (exam) =>
      getExamStatus(exam.startDate, exam.endDate) === "upcoming"
  );

  const ongoingExams = exams.filter(
    (exam) =>
      getExamStatus(exam.startDate, exam.endDate) === "ongoing"
  );

  const completedExams = exams.filter(
    (exam) =>
      getExamStatus(exam.startDate, exam.endDate) === "completed"
  );

  const renderExamCard = (exam) => {
    const status = getExamStatus(
      exam.startDate,
      exam.endDate
    );

    return (
      <article className="student-exam-card" key={exam.id}>
        <div className="student-exam-card-top">
          <div className="student-exam-icon">
            <FileText size={20} />
          </div>

          <span
            className={`student-exam-status ${status}`}
          >
            {status === "upcoming"
              ? "Upcoming"
              : status === "ongoing"
                ? "Ongoing"
                : "Completed"}
          </span>
        </div>

        <div className="student-exam-card-content">
          <h3>{exam.name || "Untitled Exam"}</h3>

          <p className="student-exam-type">
            {formatExamType(exam.examType)}
          </p>

          <div className="student-exam-details">
            <div>
              <CalendarDays size={15} />
              <span>
                {formatDate(exam.startDate)}
                {exam.endDate &&
                  ` - ${formatDate(exam.endDate)}`}
              </span>
            </div>

            {exam.class?.name && (
              <div>
                <BookOpen size={15} />
                <span>{exam.class.name}</span>
              </div>
            )}

            {exam.academicYear?.name && (
              <div>
                <Clock3 size={15} />
                <span>{exam.academicYear.name}</span>
              </div>
            )}
          </div>
        </div>
      </article>
    );
  };

  if (loading) {
    return (
      <div className="student-exams-page">
        <div className="student-exams-status">
          <div className="student-exams-spinner" />
          <p>Loading your exams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-exams-page">
        <div className="student-exams-status error">
          <div className="student-exams-status-icon">
            <AlertCircle size={28} />
          </div>

          <h3>Unable to load exams</h3>
          <p>{error}</p>

          <button
            type="button"
            className="student-exams-retry"
            onClick={loadExams}
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-exams-page">
      <div className="student-exams-header">
        <div>
          <span className="student-exams-eyebrow">
            Academic
          </span>

          <h1>Exams</h1>

          <p>
            View your scheduled and completed examinations.
          </p>
        </div>

        <button
          type="button"
          className="student-results-button"
          onClick={() => navigate("/student/results")}
        >
          View Results
          <ChevronRight size={17} />
        </button>
      </div>

      {exams.length === 0 ? (
        <div className="student-exams-empty">
          <div className="student-exams-empty-icon">
            <FileText size={28} />
          </div>

          <h3>No exams available</h3>

          <p>
            No exams have been scheduled for your class yet.
          </p>
        </div>
      ) : (
        <>
          {upcomingExams.length > 0 && (
            <section className="student-exam-section">
              <div className="student-exam-section-header">
                <div>
                  <h2>Upcoming Exams</h2>
                  <p>
                    Exams scheduled for the coming days.
                  </p>
                </div>

                <span>
                  {upcomingExams.length}
                </span>
              </div>

              <div className="student-exam-grid">
                {upcomingExams.map(renderExamCard)}
              </div>
            </section>
          )}

          {ongoingExams.length > 0 && (
            <section className="student-exam-section">
              <div className="student-exam-section-header">
                <div>
                  <h2>Ongoing Exams</h2>
                  <p>Exams currently in progress.</p>
                </div>

                <span>
                  {ongoingExams.length}
                </span>
              </div>

              <div className="student-exam-grid">
                {ongoingExams.map(renderExamCard)}
              </div>
            </section>
          )}

          {completedExams.length > 0 && (
            <section className="student-exam-section">
              <div className="student-exam-section-header">
                <div>
                  <h2>Completed Exams</h2>
                  <p>Your previously scheduled exams.</p>
                </div>

                <span>
                  {completedExams.length}
                </span>
              </div>

              <div className="student-exam-grid">
                {completedExams.map(renderExamCard)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}