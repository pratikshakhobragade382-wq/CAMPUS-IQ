import { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen,
  Search,
  RefreshCw,
  Calendar,
  Award,
  Clock,
  CheckCircle2,
  Send,
  FileText,
  AlertTriangle,
  X,
  Star,
  ClipboardList,
  UploadCloud,
} from "lucide-react";

import {
  getMyAssignments,
  submitAssignment,
} from "../api/studentPortal.api";
import { getFileUrl, uploadAssignmentFile } from "../api/assignment.api";

import "./StudentAssignments.css";

/* ============================================================
   HELPERS
============================================================ */

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatus(assignment) {
  const sub = assignment.submission;
  if (sub) return sub.status; // "submitted" | "graded" | "late"
  const now = new Date();
  const due = new Date(assignment.dueDate);
  return now > due ? "overdue" : "pending";
}

function getStatusLabel(status) {
  const map = {
    pending: "Pending",
    submitted: "Submitted",
    graded: "Graded",
    late: "Late",
    overdue: "Overdue",
  };
  return map[status] || status;
}

function getStatusIcon(status) {
  switch (status) {
    case "submitted": return <CheckCircle2 size={12} />;
    case "graded":    return <Star size={12} />;
    case "late":      return <Clock size={12} />;
    case "overdue":   return <AlertTriangle size={12} />;
    default:          return <Clock size={12} />;
  }
}

/* ============================================================
   COMPONENT
============================================================ */

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [submitId, setSubmitId] = useState(null);
  const [submitContent, setSubmitContent] = useState("");
  const [submitUrl, setSubmitUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Student File Upload State
  const fileInputRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileSize, setUploadedFileSize] = useState(null);

  const handleStudentFileUpload = async (file) => {
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      setUploadError("File is too large. Maximum size is 30 MB.");
      return;
    }

    setUploadError("");
    setUploadingFile(true);
    setUploadProgress(0);

    try {
      const res = await uploadAssignmentFile(file, (progress) => {
        setUploadProgress(progress);
      });

      if (res?.data?.url) {
        setSubmitUrl(res.data.url);
        setUploadedFileName(res.data.fileName || file.name);
        setUploadedFileSize(res.data.fileSize || file.size);
      }
    } catch (err) {
      console.error("Student upload error:", err);
      setUploadError(
        err?.response?.data?.message || err?.response?.data?.error || "Failed to upload file. Please try again."
      );
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveStudentFile = () => {
    setSubmitUrl("");
    setUploadedFileName("");
    setUploadedFileSize(null);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (assignmentId) => {
    if (!submitContent.trim() && !submitUrl) {
      setError("Please type an answer or upload a file before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      await submitAssignment(assignmentId, {
        content: submitContent.trim() || null,
        attachmentUrl: submitUrl || null,
      });

      setSuccessMsg("Assignment submitted successfully!");
      setSubmitId(null);
      setSubmitContent("");
      setSubmitUrl("");
      setUploadedFileName("");
      setUploadedFileSize(null);
      setUploadError("");

      fetchData();
    } catch (err) {
      console.error("Submit error:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to submit assignment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyAssignments();
      setAssignments(res.data || []);
    } catch (err) {
      setError(
        err?.response?.data?.error || err?.message || "Failed to load assignments."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* --------------------------------------------------------
     DERIVED
  -------------------------------------------------------- */

  const withStatus = assignments.map((a) => ({
    ...a,
    _status: getStatus(a),
  }));

  const totalCount = withStatus.length;
  const pendingCount = withStatus.filter((a) => a._status === "pending" || a._status === "overdue").length;
  const submittedCount = withStatus.filter((a) => a._status === "submitted" || a._status === "late").length;
  const gradedCount = withStatus.filter((a) => a._status === "graded").length;

  const filtered = withStatus.filter((a) => {
    const matchesSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.description || "").toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      statusFilter === "all" ||
      (statusFilter === "pending" && (a._status === "pending" || a._status === "overdue")) ||
      (statusFilter === "submitted" && (a._status === "submitted" || a._status === "late")) ||
      (statusFilter === "graded" && a._status === "graded");

    return matchesSearch && matchesFilter;
  });


  /* --------------------------------------------------------
     LOADING STATE
  -------------------------------------------------------- */

  if (loading) {
    return (
      <div className="student-assignments-page">
        <div className="student-asgn-loading">
          <div className="student-asgn-spinner" />
          <p>Loading assignments…</p>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------
     ERROR STATE
  -------------------------------------------------------- */

  if (error && assignments.length === 0) {
    return (
      <div className="student-assignments-page">
        <div className="student-asgn-error">
          <div className="student-asgn-error-icon">
            <AlertTriangle size={28} />
          </div>
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button className="student-asgn-retry-btn" onClick={fetchData}>
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
    <div className="student-assignments-page">

      {/* ================================================
          HEADER
      ================================================ */}

      <div className="student-asgn-header">
        <div className="student-asgn-title-row">
          <div className="student-asgn-title-icon">
            <BookOpen size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h2>My Assignments</h2>
            <p>View, track, and submit your assignments</p>
          </div>
        </div>

        <div className="student-asgn-header-actions">
          <button
            className="student-asgn-refresh-btn"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ================================================
          SUCCESS BANNER
      ================================================ */}

      {successMsg && (
        <div className="student-asgn-success-banner">
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {/* ================================================
          STAT CARDS
      ================================================ */}

      <div className="student-asgn-stats">
        <div className="student-asgn-stat">
          <div className="student-asgn-stat-icon total">
            <ClipboardList size={18} />
          </div>
          <div>
            <strong>{totalCount}</strong>
            <small>Total Assignments</small>
          </div>
        </div>

        <div className="student-asgn-stat">
          <div className="student-asgn-stat-icon pending">
            <Clock size={18} />
          </div>
          <div>
            <strong>{pendingCount}</strong>
            <small>Pending</small>
          </div>
        </div>

        <div className="student-asgn-stat">
          <div className="student-asgn-stat-icon done">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <strong>{submittedCount}</strong>
            <small>Submitted</small>
          </div>
        </div>

        <div className="student-asgn-stat">
          <div className="student-asgn-stat-icon graded">
            <Award size={18} />
          </div>
          <div>
            <strong>{gradedCount}</strong>
            <small>Graded</small>
          </div>
        </div>
      </div>

      {/* ================================================
          TOOLBAR
      ================================================ */}

      <div className="student-asgn-toolbar">
        <div className="student-asgn-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search assignments…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="student-asgn-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="submitted">Submitted</option>
          <option value="graded">Graded</option>
        </select>
      </div>

      {/* ================================================
          ASSIGNMENT CARDS
      ================================================ */}

      {filtered.length === 0 ? (
        <div className="student-asgn-empty">
          <div className="student-asgn-empty-icon">
            <BookOpen size={32} />
          </div>
          <h3>No Assignments Found</h3>
          <p>
            {search || statusFilter !== "all"
              ? "Try adjusting your search or filter."
              : "You don't have any assignments yet."}
          </p>
        </div>
      ) : (
        <div className="student-asgn-list">
          {filtered.map((a) => {
            const status = a._status;
            const sub = a.submission;
            const isSubmitOpen = submitId === a.id;

            return (
              <div className="student-asgn-card" key={a.id}>

                {/* TOP ROW */}
                <div className="student-asgn-card-top">
                  <div>
                    <h3 className="student-asgn-card-title">{a.title}</h3>
                    {a.description && (
                      <p className="student-asgn-card-desc">{a.description}</p>
                    )}
                  </div>
                  <span className={`student-asgn-badge ${status}`}>
                    {getStatusIcon(status)} {getStatusLabel(status)}
                  </span>
                </div>

                {/* META */}
                <div className="student-asgn-card-meta">
                  <span className="student-asgn-meta-item">
                    <Calendar size={14} />
                    Due: {formatDate(a.dueDate)}
                  </span>
                  {a.maxMarks && (
                    <span className="student-asgn-meta-item">
                      <Award size={14} />
                      Max Marks: {a.maxMarks}
                    </span>
                  )}
                  {a.attachmentUrl && (
                    <a
                      href={getFileUrl(a.attachmentUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="student-asgn-meta-item"
                      style={{ textDecoration: "none" }}
                    >
                      <FileText size={14} />
                      View Attachment
                    </a>
                  )}

                </div>

                {/* SUBMISSION DETAILS (when graded or submitted) */}
                {sub && (
                  <div className="student-asgn-submission">
                    <div className="student-asgn-submission-header">
                      <strong>Your Submission</strong>
                      {sub.grade != null && (
                        <span className="student-asgn-grade-badge">
                          <Star size={12} /> {sub.grade}/{a.maxMarks || "—"}
                        </span>
                      )}
                    </div>

                    {sub.content && (
                      <>
                        <div className="label">Content</div>
                        <p>{sub.content}</p>
                      </>
                    )}

                    {sub.feedback && (
                      <>
                        <div className="label" style={{ marginTop: 10 }}>Teacher Feedback</div>
                        <p>{sub.feedback}</p>
                      </>
                    )}

                    {sub.submittedAt && (
                      <p style={{ marginTop: 8, fontSize: 11, color: "#9aa8b6" }}>
                        Submitted on {formatDate(sub.submittedAt)}
                      </p>
                    )}
                  </div>
                )}

                {/* SUBMIT BUTTON (for pending assignments) */}
                {!sub && !isSubmitOpen && (
                  <button
                    className="student-asgn-open-submit-btn"
                    onClick={() => {
                      setSubmitId(a.id);
                      setSubmitContent("");
                      setSubmitUrl("");
                      setUploadedFileName("");
                      setUploadedFileSize(null);
                      setUploadError("");
                    }}
                  >
                    <Send size={13} /> Submit Assignment
                  </button>
                )}

                {/* INLINE SUBMIT FORM */}
                {isSubmitOpen && (
                  <div className="student-asgn-submit-form">
                    <h4>Submit Your Work</h4>

                    <div className="student-asgn-submit-field">
                      <label>Your Answer / Content *</label>
                      <textarea
                        placeholder="Type your answer here…"
                        value={submitContent}
                        onChange={(e) => setSubmitContent(e.target.value)}
                      />
                    </div>

                    <div className="student-asgn-submit-field">
                      <label>Upload Work / Attachment (Optional)</label>

                      <input
                        ref={fileInputRef}
                        type="file"
                        style={{ display: "none" }}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.zip,.rar,.txt"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleStudentFileUpload(file);
                          e.target.value = "";
                        }}
                      />

                      {!submitUrl ? (
                        <button
                          type="button"
                          className="student-asgn-upload-btn"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingFile}
                        >
                          {uploadingFile ? (
                            <>
                              <RefreshCw size={15} className="fa-spin" />
                              <span>Uploading... {uploadProgress}%</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud size={16} />
                              <span>Click to upload file from your device (PDF, Word, PPT, Image, ZIP)</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="student-asgn-file-preview">
                          <div className="student-asgn-file-info">
                            <FileText size={16} color="#ff914d" />
                            <span className="file-name" title={uploadedFileName}>
                              {uploadedFileName || "Uploaded File"}
                            </span>
                            {uploadedFileSize && (
                              <span className="file-size">({formatFileSize(uploadedFileSize)})</span>
                            )}
                          </div>
                          <div className="student-asgn-file-actions">
                            <a
                              href={getFileUrl(submitUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-preview-file"
                            >
                              Preview
                            </a>
                            <button
                              type="button"
                              className="btn-remove-file"
                              onClick={handleRemoveStudentFile}
                              title="Remove File"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      )}

                      {uploadError && (
                        <div className="student-asgn-upload-error">
                          <AlertTriangle size={13} /> {uploadError}
                        </div>
                      )}
                    </div>

                    <div className="student-asgn-submit-actions">
                      <button
                        type="button"
                        className="student-asgn-submit-btn"
                        onClick={() => handleSubmit(a.id)}
                        disabled={submitting || (!submitContent.trim() && !submitUrl)}
                      >
                        <Send size={14} />
                        {submitting ? "Submitting…" : "Submit Assignment"}
                      </button>
                      <button
                        type="button"
                        className="student-asgn-cancel-btn"
                        onClick={() => setSubmitId(null)}
                      >
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
