import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Send,
  Star,
  Users,
  XCircle,
} from "lucide-react";

import {
  getMyChildren,
  getChildAssignments,
} from "../api/parent.api";

import { getFileUrl } from "../api/assignment.api";

import "./ParentAssignments.css";


/* ============================================================
   FILTER TABS
============================================================ */

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "submitted", label: "Submitted" },
  { key: "graded", label: "Graded" },
];

/* ============================================================
   PARENT ASSIGNMENTS PAGE
============================================================ */

export default function ParentAssignments() {
  /* --------------------------------------------------------
     STATE
  -------------------------------------------------------- */

  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const [assignments, setAssignments] = useState([]);
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
     FETCH ASSIGNMENTS
  -------------------------------------------------------- */

  const fetchAssignments = useCallback(async () => {
    if (!selectedChild) return;

    setLoading(true);
    setError("");

    try {
      const res = await getChildAssignments(selectedChild);
      setAssignments(res?.data || []);
    } catch (err) {
      console.error("Failed to load assignments:", err);
      setError(
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load assignments."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedChild]);

  useEffect(() => {
    if (selectedChild) {
      fetchAssignments();
    }
  }, [fetchAssignments, selectedChild]);

  /* --------------------------------------------------------
     CATEGORIZE ASSIGNMENTS
  -------------------------------------------------------- */

  const categorized = useMemo(() => {
    const now = new Date();

    return assignments.map((a) => {
      const dueDate = a.dueDate ? new Date(a.dueDate) : null;
      const isOverdue = dueDate && dueDate < now;
      const submission = a.submission || null;

      let status = "pending";

      if (submission?.status === "graded" || submission?.grade) {
        status = "graded";
      } else if (
        submission?.status === "submitted" ||
        submission?.submittedAt
      ) {
        status = "submitted";
      } else if (isOverdue) {
        status = "overdue";
      }

      return { ...a, computedStatus: status };
    });
  }, [assignments]);

  /* --------------------------------------------------------
     FILTERED LIST
  -------------------------------------------------------- */

  const filteredAssignments = useMemo(() => {
    if (activeTab === "all") return categorized;

    if (activeTab === "pending") {
      return categorized.filter(
        (a) =>
          a.computedStatus === "pending" ||
          a.computedStatus === "overdue"
      );
    }

    return categorized.filter(
      (a) => a.computedStatus === activeTab
    );
  }, [categorized, activeTab]);

  /* --------------------------------------------------------
     STATS
  -------------------------------------------------------- */

  const stats = useMemo(() => {
    const total = categorized.length;

    const submitted = categorized.filter(
      (a) => a.computedStatus === "submitted"
    ).length;

    const graded = categorized.filter(
      (a) => a.computedStatus === "graded"
    ).length;

    const pending = categorized.filter(
      (a) =>
        a.computedStatus === "pending" ||
        a.computedStatus === "overdue"
    ).length;

    return { total, submitted, graded, pending };
  }, [categorized]);

  /* --------------------------------------------------------
     TAB COUNTS
  -------------------------------------------------------- */

  const tabCounts = useMemo(() => ({
    all: categorized.length,
    pending: categorized.filter(
      (a) =>
        a.computedStatus === "pending" ||
        a.computedStatus === "overdue"
    ).length,
    submitted: categorized.filter(
      (a) => a.computedStatus === "submitted"
    ).length,
    graded: categorized.filter(
      (a) => a.computedStatus === "graded"
    ).length,
  }), [categorized]);

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
     STATUS ICON
  -------------------------------------------------------- */

  const getStatusIcon = (status) => {
    switch (status) {
      case "submitted":
        return <CheckCircle2 size={13} />;
      case "graded":
        return <Star size={13} />;
      case "overdue":
        return <XCircle size={13} />;
      default:
        return <Clock size={13} />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "submitted":
        return "Submitted";
      case "graded":
        return "Graded";
      case "overdue":
        return "Overdue";
      default:
        return "Pending";
    }
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="parent-assignments-page">

      {/* ======================================================
          TOP HEADER
      ====================================================== */}

      <div className="assignments-topbar">
        <div>
          <span className="page-eyebrow">
            Parent Portal
          </span>

          <h1>Assignments</h1>

          <p>
            View your child&apos;s homework and assignments,
            track submission status, and review grades and feedback.
          </p>
        </div>
      </div>

      {/* ======================================================
          FILTERS
      ====================================================== */}

      {children.length > 1 && (
        <div className="assignments-filters">
          <div className="assignments-filter-group">
            <label>Select Child</label>
            <div className="assignments-filter-select">
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
                className="assignments-filter-arrow"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          LOADING
      ====================================================== */}

      {(loading || childrenLoading) && (
        <div className="assignments-loading">
          <div className="loading-spinner" />
          <p>Loading assignments…</p>
        </div>
      )}

      {/* ======================================================
          ERROR
      ====================================================== */}

      {!loading && !childrenLoading && error && (
        <div className="assignments-error">
          <div className="assignments-error-icon">
            <AlertCircle size={28} />
          </div>
          <h3>Unable to Load</h3>
          <p>{error}</p>
          <button
            type="button"
            className="assignments-retry-btn"
            onClick={fetchAssignments}
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
        <div className="assignments-empty">
          <div className="assignments-empty-icon">
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
              STATS
          ==================================================== */}

          <div className="assignments-stats-grid">

            <div className="assignments-stat-card">
              <div className="stat-icon total">
                <ClipboardList size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-label">
                  Total Assignments
                </span>
                <span className="stat-value">
                  {stats.total}
                </span>
                <span className="stat-subtitle">
                  All assignments
                </span>
              </div>
            </div>

            <div className="assignments-stat-card">
              <div className="stat-icon submitted">
                <Send size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-label">
                  Submitted
                </span>
                <span className="stat-value">
                  {stats.submitted}
                </span>
                <span className="stat-subtitle">
                  Awaiting review
                </span>
              </div>
            </div>

            <div className="assignments-stat-card">
              <div className="stat-icon pending">
                <Clock size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-label">
                  Pending
                </span>
                <span className="stat-value">
                  {stats.pending}
                </span>
                <span className="stat-subtitle">
                  Yet to submit
                </span>
              </div>
            </div>

            <div className="assignments-stat-card">
              <div className="stat-icon graded">
                <Award size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-label">
                  Graded
                </span>
                <span className="stat-value">
                  {stats.graded}
                </span>
                <span className="stat-subtitle">
                  Reviewed & scored
                </span>
              </div>
            </div>

          </div>

          {/* ====================================================
              TABS
          ==================================================== */}

          <div className="assignments-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`assignments-tab ${
                  activeTab === tab.key ? "active" : ""
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                <span className="tab-count">
                  {tabCounts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          {/* ====================================================
              ASSIGNMENTS LIST
          ==================================================== */}

          {filteredAssignments.length > 0 ? (
            <div className="assignments-list">
              {filteredAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="assignment-card"
                >

                  {/* Top Section */}
                  <div className="assignment-card-top">

                    <div className="assignment-title-area">
                      <h3 className="assignment-title">
                        {assignment.title || "Untitled Assignment"}
                      </h3>
                      {assignment.description && (
                        <p className="assignment-description">
                          {assignment.description}
                        </p>
                      )}
                    </div>

                    <span
                      className={`assignment-status-pill ${assignment.computedStatus}`}
                    >
                      {getStatusIcon(assignment.computedStatus)}
                      {getStatusLabel(assignment.computedStatus)}
                    </span>

                  </div>

                  {/* Meta Row */}
                  <div className="assignment-meta">

                    <div className="assignment-meta-item">
                      <div className="meta-icon">
                        <CalendarDays size={14} />
                      </div>
                      <div>
                        <span className="meta-label">Due Date</span>
                        <span className="meta-value">
                          {formatDate(assignment.dueDate)}
                        </span>
                      </div>
                    </div>

                    {assignment.maxMarks && (
                      <div className="assignment-meta-item">
                        <div className="meta-icon">
                          <Star size={14} />
                        </div>
                        <div>
                          <span className="meta-label">
                            Max Marks
                          </span>
                          <span className="meta-value">
                            {assignment.maxMarks}
                          </span>
                        </div>
                      </div>
                    )}

                    {assignment.attachmentUrl && (
                      <div className="assignment-meta-item">
                        <div className="meta-icon">
                          <FileText size={14} />
                        </div>
                        <div>
                          <span className="meta-label">Document</span>
                          <a
                            href={getFileUrl(assignment.attachmentUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="meta-value"
                            style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}
                          >
                            View Attachment
                          </a>
                        </div>
                      </div>
                    )}


                    {assignment.submission?.submittedAt && (
                      <div className="assignment-meta-item">
                        <div className="meta-icon">
                          <CheckCircle2 size={14} />
                        </div>
                        <div>
                          <span className="meta-label">
                            Submitted On
                          </span>
                          <span className="meta-value">
                            {formatDate(
                              assignment.submission.submittedAt
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Submission Details */}
                  {assignment.submission && (
                    <div className="submission-details">

                      <div className="submission-title">
                        <ClipboardCheck size={14} />
                        Submission Details
                      </div>

                      <div className="submission-grid">

                        <div className="submission-item">
                          <span className="sub-label">Status</span>
                          <span className="sub-value">
                            {assignment.submission.status
                              ? assignment.submission.status
                                  .charAt(0)
                                  .toUpperCase() +
                                assignment.submission.status.slice(1)
                              : "—"}
                          </span>
                        </div>

                        {assignment.submission.grade && (
                          <div className="submission-item">
                            <span className="sub-label">Grade</span>
                            <span
                              className="sub-value"
                              style={{ color: "#2563eb" }}
                            >
                              {assignment.submission.grade}
                              {assignment.maxMarks
                                ? ` / ${assignment.maxMarks}`
                                : ""}
                            </span>
                          </div>
                        )}

                        {assignment.submission.submittedAt && (
                          <div className="submission-item">
                            <span className="sub-label">
                              Submitted At
                            </span>
                            <span className="sub-value">
                              {formatDate(
                                assignment.submission.submittedAt
                              )}
                            </span>
                          </div>
                        )}

                      </div>

                      {assignment.submission.feedback && (
                        <div className="feedback-text">
                          <span className="sub-label">
                            Teacher Feedback
                          </span>
                          <div className="sub-value">
                            {assignment.submission.feedback}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* Attachment */}
                  {assignment.attachmentUrl && (
                    <a
                      href={assignment.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="attachment-link"
                    >
                      <Download size={14} />
                      View Attachment
                    </a>
                  )}

                </div>
              ))}
            </div>
          ) : (
            <div className="assignments-empty">
              <div className="assignments-empty-icon">
                <FileText size={36} />
              </div>
              <h3>No Assignments Found</h3>
              <p>
                {activeTab === "all"
                  ? "There are no assignments for this child yet."
                  : `No ${activeTab} assignments found.`}
              </p>
            </div>
          )}

        </>
      )}

    </div>
  );
}
