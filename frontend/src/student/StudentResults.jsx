import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  RefreshCw,
  AlertCircle,
  FileText,
} from "lucide-react";

import axiosClient from "../api/axios";

import "./StudentResults.css";

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

function getErrorMessage(error) {
  if (!error?.response) {
    return "Unable to connect to the CampusIQ server.";
  }

  if (error.response.status === 401) {
    return "Your session has expired. Please login again.";
  }

  if (error.response.status === 403) {
    return "You do not have permission to view your results.";
  }

  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    "Unable to load your results."
  );
}

function calculatePercentage(marks) {
  let obtained = 0;
  let maximum = 0;

  marks.forEach((mark) => {
    if (mark.isAbsent) {
      maximum += Number(mark.maxMarks || 0);
      return;
    }

    if (
      mark.marksObtained !== null &&
      mark.marksObtained !== undefined
    ) {
      obtained += Number(mark.marksObtained);
      maximum += Number(mark.maxMarks || 0);
    }
  });

  if (!maximum) {
    return null;
  }

  return ((obtained / maximum) * 100).toFixed(2);
}

export default function StudentResults() {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadResults = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axiosClient.get(
        "/student-portal/exam-marks"
      );

      const data = response?.data?.data;

      setMarks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load student results:", err);
      setError(getErrorMessage(err));
      setMarks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, []);

  const groupedResults = useMemo(() => {
    const groups = new Map();

    marks.forEach((mark) => {
      const examId = mark.exam?.id || mark.examId;

      if (!examId) {
        return;
      }

      if (!groups.has(examId)) {
        groups.set(examId, {
          id: examId,
          name: mark.exam?.name || "Exam",
          examType: mark.exam?.examType,
          startDate: mark.exam?.startDate,
          subjects: [],
        });
      }

      groups.get(examId).subjects.push(mark);
    });

    return Array.from(groups.values());
  }, [marks]);

  if (loading) {
    return (
      <div className="student-results-page">
        <div className="student-results-status">
          <div className="student-results-spinner" />
          <p>Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-results-page">
        <div className="student-results-status error">
          <div className="student-results-status-icon">
            <AlertCircle size={28} />
          </div>

          <h3>Unable to load results</h3>
          <p>{error}</p>

          <button
            type="button"
            className="student-results-retry"
            onClick={loadResults}
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-results-page">
      <div className="student-results-header">
        <div>
          <span className="student-results-eyebrow">
            Academic Performance
          </span>

          <h1>Results</h1>

          <p>
            View marks published by your school.
          </p>
        </div>

        <div className="student-results-summary">
          <Award size={18} />
          <div>
            <strong>{marks.length}</strong>
            <span>Subject Results</span>
          </div>
        </div>
      </div>

      {groupedResults.length === 0 ? (
        <div className="student-results-empty">
          <div className="student-results-empty-icon">
            <FileText size={28} />
          </div>

          <h3>No results published yet</h3>

          <p>
            Your results will appear here once they are published
            by the school.
          </p>
        </div>
      ) : (
        <div className="student-results-list">
          {groupedResults.map((exam) => {
            const percentage = calculatePercentage(
              exam.subjects
            );

            return (
              <section
                className="student-result-card"
                key={exam.id}
              >
                <div className="student-result-card-header">
                  <div className="student-result-title">
                    <div className="student-result-icon">
                      <BookOpen size={20} />
                    </div>

                    <div>
                      <h2>{exam.name}</h2>

                      <p>
                        {formatExamType(exam.examType)}
                        {exam.startDate
                          ? ` · ${formatDate(exam.startDate)}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  {percentage !== null && (
                    <div className="student-result-percentage">
                      <strong>{percentage}%</strong>
                      <span>Percentage</span>
                    </div>
                  )}
                </div>

                <div className="student-result-table-wrapper">
                  <table className="student-result-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Code</th>
                        <th>Marks</th>
                        <th>Max Marks</th>
                        <th>Grade</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {exam.subjects.map((mark) => (
                        <tr
                          key={
                            mark.id ||
                            `${exam.id}-${mark.subject?.id}`
                          }
                        >
                          <td>
                            <strong>
                              {mark.subject?.name ||
                                "Subject"}
                            </strong>
                          </td>

                          <td>
                            {mark.subject?.code || "—"}
                          </td>

                          <td>
                            {mark.isAbsent
                              ? "Absent"
                              : mark.marksObtained ??
                                "—"}
                          </td>

                          <td>
                            {mark.maxMarks ?? "—"}
                          </td>

                          <td>
                            <span className="student-grade">
                              {mark.grade || "—"}
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                mark.isAbsent
                                  ? "student-mark-status absent"
                                  : "student-mark-status published"
                              }
                            >
                              {mark.isAbsent
                                ? "Absent"
                                : "Published"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}