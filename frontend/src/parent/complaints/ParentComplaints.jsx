import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Inbox, Loader2, Plus, Send } from "lucide-react";
import { toast } from "react-toastify";
import {
  createComplaint,
  getErrorMessage,
  getMyChildren,
  getMyComplaints,
} from "../../api/complaint.api";
import {
  CATEGORY_OPTIONS,
  PARENT_STATUS_LABEL,
  badgeClass,
  formatDate,
  formatDateTime,
  labelOf,
} from "../../utils/complaintMeta";
import "../../styles/complaint-badges.css";
import "./ParentComplaints.css";

const SUBJECT_MAX = 150;
const DESCRIPTION_MIN = 10;
const DESCRIPTION_MAX = 3000;

const TABS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "done", label: "Resolved" },
];

const matchesTab = (complaint, tab) => {
  if (tab === "open") return ["PENDING", "IN_PROGRESS"].includes(complaint.status);
  if (tab === "done") return ["RESOLVED", "CLOSED"].includes(complaint.status);
  return true;
};

const EMPTY_FORM = { studentId: "", subject: "", description: "" };

export default function ParentComplaints() {
  const [children, setChildren] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [tab, setTab] = useState("all");
  const [openId, setOpenId] = useState(null);

  const loadComplaints = useCallback(async () => {
    try {
      setComplaints(await getMyComplaints());
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not load your complaints."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();

    // The child picker is optional, so a failure here is not shown to the parent
    getMyChildren()
      .then(setChildren)
      .catch(() => setChildren([]));
  }, [loadComplaints]);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();

    const subject = form.subject.trim();
    const description = form.description.trim();

    if (!subject) return toast.error("Please enter a subject.");
    if (description.length < DESCRIPTION_MIN) {
      return toast.error("Please describe the problem in a little more detail.");
    }

    setSubmitting(true);
    try {
      const created = await createComplaint({
        subject,
        description,
        ...(form.studentId ? { studentId: Number(form.studentId) } : {}),
      });

      toast.success(`Complaint ${created.ticketNo} submitted. The school will review it soon.`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setOpenId(created.id);
      setTab("all");
      await loadComplaints();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not submit your complaint."));
    } finally {
      setSubmitting(false);
    }
  };

  const visible = complaints.filter((complaint) => matchesTab(complaint, tab));

  return (
    <div className="pc-page">
      <header className="pc-head">
        <div>
          <h1>My complaints</h1>
          <p>Tell the school about a problem. You will get a notification when the school replies.</p>
        </div>

        {!showForm && (
          <button type="button" className="pc-btn pc-btn--primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> New complaint
          </button>
        )}
      </header>

      {/* ---------- form ---------- */}
      {showForm && (
        <form className="pc-card pc-form" onSubmit={handleSubmit}>
          <h2>Raise a complaint</h2>

          {children.length > 0 && (
            <label className="pc-field">
              <span>Which child is this about?</span>
              <select value={form.studentId} onChange={(event) => updateForm("studentId", event.target.value)}>
                <option value="">Not about a specific child</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.studentName}
                    {child.class?.name ? `, ${child.class.name}` : ""}
                    {child.section?.name ? ` ${child.section.name}` : ""}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="pc-field">
            <span>Subject</span>
            <input
              type="text"
              maxLength={SUBJECT_MAX}
              placeholder="For example, water leaking in the classroom"
              value={form.subject}
              onChange={(event) => updateForm("subject", event.target.value)}
              required
            />
          </label>

          <label className="pc-field">
            <span>What happened?</span>
            <textarea
              rows={6}
              maxLength={DESCRIPTION_MAX}
              placeholder="Share what happened, where and when. The more detail you give, the faster the school can act."
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              required
            />
            <small>
              {form.description.length} / {DESCRIPTION_MAX}
            </small>
          </label>

          <div className="pc-form-actions">
            <button type="submit" className="pc-btn pc-btn--primary" disabled={submitting}>
              {submitting ? <Loader2 className="pc-spin" size={16} /> : <Send size={16} />}
              Submit complaint
            </button>
            <button
              type="button"
              className="pc-btn"
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
              }}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ---------- list ---------- */}
      <div className="pc-tabs" role="tablist" aria-label="Filter complaints">
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            className={`pc-tab ${tab === item.value ? "is-active" : ""}`}
            onClick={() => setTab(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="pc-empty">
          <Loader2 className="pc-spin" size={20} /> Loading your complaints...
        </div>
      ) : visible.length === 0 ? (
        <div className="pc-empty">
          <Inbox size={28} />
          <p>
            {complaints.length === 0
              ? "You have not raised any complaints yet."
              : "No complaints in this list."}
          </p>
          {complaints.length === 0 && !showForm && (
            <button type="button" className="pc-btn pc-btn--primary" onClick={() => setShowForm(true)}>
              Raise your first complaint
            </button>
          )}
        </div>
      ) : (
        <ul className="pc-list">
          {visible.map((complaint) => {
            const expanded = openId === complaint.id;

            return (
              <li key={complaint.id} className={`pc-card pc-item ${expanded ? "is-open" : ""}`}>
                <button
                  type="button"
                  className="pc-item-head"
                  onClick={() => setOpenId(expanded ? null : complaint.id)}
                  aria-expanded={expanded}
                >
                  <div className="pc-item-main">
                    <span className="pc-ticket">{complaint.ticketNo}</span>
                    <strong>{complaint.subject}</strong>
                    <span className="pc-item-sub">
                      Raised on {formatDate(complaint.createdAt)}
                      {complaint.student ? ` for ${complaint.student.name}` : ""}
                    </span>
                  </div>

                  <div className="pc-item-side">
                    <span className={badgeClass(complaint.status)}>{PARENT_STATUS_LABEL[complaint.status]}</span>
                    <ChevronDown size={18} className="pc-chevron" />
                  </div>
                </button>

                {expanded && (
                  <div className="pc-item-body">
                    <div className="pc-chip-row">
                      <span className="cmp-badge cmp-badge--category">{labelOf(CATEGORY_OPTIONS, complaint.category)}</span>
                    </div>

                    <h3>Your complaint</h3>
                    <p className="pc-pre">{complaint.description}</p>

                    <h3>Reply from the school</h3>
                    {complaint.adminReply ? (
                      <div className="pc-reply">
                        <p className="pc-pre">{complaint.adminReply}</p>
                        <small>Replied on {formatDateTime(complaint.repliedAt)}</small>
                      </div>
                    ) : (
                      <p className="pc-muted">
                        The school has received your complaint and has not replied yet. You will get a notification when it does.
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
