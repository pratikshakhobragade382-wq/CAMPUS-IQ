import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  MessageSquareWarning,
  Plus,
  RefreshCw,
  Send,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  createComplaint,
  getErrorMessage,
  getMyComplaints,
} from "../../api/complaint.api";

import "./StudentComplaints.css";

const CATEGORIES = [
  { value: "OTHER", label: "General / Other" },
  { value: "ACADEMIC", label: "Academic" },
  { value: "TECHNICAL", label: "Technical / Portal" },
  { value: "INFRASTRUCTURE", label: "Infrastructure" },
  { value: "HOSTEL", label: "Hostel" },
  { value: "SAFETY", label: "Safety" },
];

const statusLabel = (status) => {
  const labels = {
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  };

  return labels[status] || status || "Pending";
};

const statusClass = (status) => {
  if (status === "RESOLVED") return "student-complaint-status resolved";
  if (status === "CLOSED") return "student-complaint-status closed";
  if (status === "IN_PROGRESS") {
    return "student-complaint-status progress";
  }

  return "student-complaint-status pending";
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const labelCategory = (value) => {
  return (
    CATEGORIES.find((item) => item.value === value)?.label ||
    value ||
    "General"
  );
};

export default function StudentComplaints() {
  const [complaints, setComplaints] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [selectedComplaint, setSelectedComplaint] =
    useState(null);

  const [activeTab, setActiveTab] = useState("all");

  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    category: "OTHER",
  });

  const loadComplaints = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getMyComplaints();

      setComplaints(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Student complaints error:", error);

      toast.error(
        getErrorMessage(
          error,
          "Could not load your complaints."
        )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
  loadComplaints();

  const interval = setInterval(() => {
    loadComplaints(true);
  }, 15000);

  return () => {
    clearInterval(interval);
  };
}, [loadComplaints]);

  const openComplaints = useMemo(
    () =>
      complaints.filter((item) =>
        ["PENDING", "IN_PROGRESS"].includes(item.status)
      ),
    [complaints]
  );

  const resolvedComplaints = useMemo(
    () =>
      complaints.filter((item) =>
        ["RESOLVED", "CLOSED"].includes(item.status)
      ),
    [complaints]
  );

  const visibleComplaints = useMemo(() => {
    if (activeTab === "open") return openComplaints;
    if (activeTab === "resolved") return resolvedComplaints;

    return complaints;
  }, [
    activeTab,
    complaints,
    openComplaints,
    resolvedComplaints,
  ]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      subject: "",
      description: "",
      category: "OTHER",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const subject = formData.subject.trim();
    const description = formData.description.trim();

    if (!subject) {
      toast.error("Please enter a subject.");
      return;
    }

    if (description.length < 10) {
      toast.error(
        "Please describe the problem in at least 10 characters."
      );
      return;
    }

    try {
      setSubmitting(true);

      /*
       * Do NOT send studentId from the frontend.
       *
       * The backend should take the authenticated student's
       * studentId from req.user.studentId.
       */
      const created = await createComplaint({
        subject,
        description,
        category: formData.category,
      });

      toast.success(
        created?.ticketNo
          ? `Complaint ${created.ticketNo} submitted successfully.`
          : "Complaint submitted successfully."
      );

      resetForm();
      setShowForm(false);

      await loadComplaints(true);
    } catch (error) {
      console.error("Create student complaint error:", error);

      toast.error(
        getErrorMessage(
          error,
          "Could not submit your complaint."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    total: complaints.length,
    open: openComplaints.length,
    resolved: resolvedComplaints.length,
  };

  return (
    <div className="student-complaints-page">
      {/* HEADER */}
      <section className="student-complaints-header">
        <div>
          <span className="student-complaints-eyebrow">
            <MessageSquareWarning size={16} />
            Student Support
          </span>

          <h1>My Complaints</h1>

          <p>
            Raise an issue and track the response from your
            school.
          </p>
        </div>

        <div className="student-complaints-header-actions">
          <button
            type="button"
            className="student-complaint-refresh"
            onClick={() => loadComplaints(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? "student-complaint-spin" : ""
              }
            />

            Refresh
          </button>

          <button
            type="button"
            className="student-new-complaint-btn"
            onClick={() => setShowForm((previous) => !previous)}
          >
            {showForm ? <X size={17} /> : <Plus size={17} />}

            {showForm ? "Close" : "Raise Complaint"}
          </button>
        </div>
      </section>

      {/* SUMMARY */}
      <section className="student-complaint-stats">
        <div className="student-complaint-stat-card">
          <div className="student-complaint-stat-icon total">
            <FileText size={20} />
          </div>

          <div>
            <span>Total Complaints</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="student-complaint-stat-card">
          <div className="student-complaint-stat-icon open">
            <Clock3 size={20} />
          </div>

          <div>
            <span>Open</span>
            <strong>{stats.open}</strong>
          </div>
        </div>

        <div className="student-complaint-stat-card">
          <div className="student-complaint-stat-icon resolved">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <span>Resolved</span>
            <strong>{stats.resolved}</strong>
          </div>
        </div>
      </section>

      {/* FORM */}
      {showForm && (
        <section className="student-complaint-form-card">
          <div className="student-complaint-form-heading">
            <div className="student-form-icon">
              <MessageSquareWarning size={21} />
            </div>

            <div>
              <h2>Raise a Complaint</h2>
              <p>
                Explain your issue clearly so the school can
                help you faster.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="student-complaint-form-grid">
              <label>
                <span>Category</span>

                <div className="student-select-wrapper">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={submitting}
                  >
                    {CATEGORIES.map((category) => (
                      <option
                        key={category.value}
                        value={category.value}
                      >
                        {category.label}
                      </option>
                    ))}
                  </select>

                  <ChevronDown size={16} />
                </div>
              </label>

              <label>
                <span>Subject</span>

                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Enter complaint subject"
                  maxLength={180}
                  disabled={submitting}
                  required
                />
              </label>
            </div>

            <label className="student-description-field">
              <span>Description</span>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your problem in detail..."
                rows={6}
                maxLength={3000}
                disabled={submitting}
                required
              />

              <small>
                {formData.description.length}/3000
              </small>
            </label>

            <div className="student-complaint-form-footer">
              <p>
                <AlertCircle size={15} />
                Please provide accurate information.
              </p>

              <button
                type="submit"
                className="student-submit-complaint"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="student-complaint-spin"
                    />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Submit Complaint
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* TABS */}
      <section className="student-complaints-list-card">
        <div className="student-complaints-list-header">
          <div>
            <h2>Complaint History</h2>
            <p>
              Track the status and responses of your
              complaints.
            </p>
          </div>

          <div
            className="student-complaint-tabs"
            role="tablist"
          >
            <button
              type="button"
              className={
                activeTab === "all" ? "active" : ""
              }
              onClick={() => setActiveTab("all")}
            >
              All
              <span>{stats.total}</span>
            </button>

            <button
              type="button"
              className={
                activeTab === "open" ? "active" : ""
              }
              onClick={() => setActiveTab("open")}
            >
              Open
              <span>{stats.open}</span>
            </button>

            <button
              type="button"
              className={
                activeTab === "resolved" ? "active" : ""
              }
              onClick={() => setActiveTab("resolved")}
            >
              Resolved
              <span>{stats.resolved}</span>
            </button>
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="student-complaints-loading">
            <RefreshCw
              size={25}
              className="student-complaint-spin"
            />

            <p>Loading your complaints...</p>
          </div>
        ) : visibleComplaints.length === 0 ? (
          <div className="student-complaints-empty">
            <div>
              <MessageSquareWarning size={31} />
            </div>

            <h3>
              {complaints.length === 0
                ? "No complaints yet"
                : "No complaints in this list"}
            </h3>

            <p>
              {complaints.length === 0
                ? "If you have an issue, you can raise a complaint and track it here."
                : "Try another filter to see your complaints."}
            </p>

            {complaints.length === 0 && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
              >
                <Plus size={16} />
                Raise Your First Complaint
              </button>
            )}
          </div>
        ) : (
          <div className="student-complaints-table-wrapper">
            <div className="student-complaints-table">
              <div className="student-complaint-table-head">
                <span>Complaint</span>
                <span>Category</span>
                <span>Status</span>
                <span>Date</span>
              </div>

              {visibleComplaints.map((complaint) => (
                <button
                  type="button"
                  className="student-complaint-row"
                  key={complaint.id}
                  onClick={() =>
                    setSelectedComplaint(complaint)
                  }
                >
                  <div className="student-complaint-main">
                    <strong>
                      {complaint.ticketNo ||
                        `#${complaint.id}`}
                    </strong>

                    <span>{complaint.subject}</span>

                    {complaint.issueTag && (
                      <small>{complaint.issueTag}</small>
                    )}
                  </div>

                  <div>
                    <span className="student-category-badge">
                      {labelCategory(complaint.category)}
                    </span>
                  </div>

                  <div>
                    <span
                      className={statusClass(
                        complaint.status
                      )}
                    >
                      {statusLabel(complaint.status)}
                    </span>
                  </div>

                  <div className="student-complaint-date">
                    {formatDateTime(
                      complaint.createdAt
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* DETAIL MODAL */}
      {selectedComplaint && (
        <div
          className="student-complaint-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedComplaint(null);
            }
          }}
        >
          <div className="student-complaint-modal">
            <div className="student-modal-header">
              <div>
                <span>
                  {selectedComplaint.ticketNo ||
                    `Complaint #${selectedComplaint.id}`}
                </span>

                <h2>{selectedComplaint.subject}</h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedComplaint(null)
                }
                aria-label="Close complaint"
              >
                <X size={19} />
              </button>
            </div>

            <div className="student-modal-badges">
              <span
                className={statusClass(
                  selectedComplaint.status
                )}
              >
                {statusLabel(
                  selectedComplaint.status
                )}
              </span>

              <span className="student-category-badge">
                {labelCategory(
                  selectedComplaint.category
                )}
              </span>

              {selectedComplaint.priority && (
                <span className="student-priority-badge">
                  {selectedComplaint.priority} priority
                </span>
              )}
            </div>

            <div className="student-modal-info-grid">
              <div>
                <span>Submitted</span>
                <strong>
                  {formatDateTime(
                    selectedComplaint.createdAt
                  )}
                </strong>
              </div>

              <div>
                <span>Last Updated</span>
                <strong>
                  {formatDateTime(
                    selectedComplaint.updatedAt
                  )}
                </strong>
              </div>
            </div>

            <div className="student-modal-section">
              <h3>Your Complaint</h3>

              <p className="student-modal-description">
                {selectedComplaint.description}
              </p>
            </div>

            {selectedComplaint.adminReply ? (
              <div className="student-admin-reply">
                <div className="student-admin-reply-heading">
                  <CheckCircle2 size={18} />
                  <div>
                    <strong>School Response</strong>

                    {selectedComplaint.repliedAt && (
                      <small>
                        Replied on{" "}
                        {formatDateTime(
                          selectedComplaint.repliedAt
                        )}
                      </small>
                    )}
                  </div>
                </div>

                <p>
                  {selectedComplaint.adminReply}
                </p>
              </div>
            ) : (
              <div className="student-pending-message">
                <Clock3 size={18} />

                <div>
                  <strong>Waiting for response</strong>

                  <p>
                    The school has received your
                    complaint and will review it soon.
                  </p>
                </div>
              </div>
            )}

            {selectedComplaint.finalResolution && (
              <div className="student-resolution-box">
                <strong>Resolution</strong>

                <p>
                  {selectedComplaint.finalResolution}
                </p>
              </div>
            )}

            <div className="student-modal-footer">
              <button
                type="button"
                onClick={() =>
                  setSelectedComplaint(null)
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}