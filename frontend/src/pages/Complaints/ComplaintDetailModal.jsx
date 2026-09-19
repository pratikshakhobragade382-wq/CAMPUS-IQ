import { useEffect, useState } from "react";
import { Ban, Check, Loader2, Pencil, RefreshCw, Send, Sparkles, X } from "lucide-react";
import { toast } from "react-toastify";
import {
  decideSuggestion,
  generateReplyDraft,
  getComplaint,
  getErrorMessage,
  reanalyzeComplaint,
  sendComplaintReply,
  updateComplaint,
} from "../../api/complaint.api";
import {
  CATEGORY_OPTIONS,
  DEPARTMENT_OPTIONS,
  EMOTION_OPTIONS,
  LANGUAGE_OPTIONS,
  PRIORITY_OPTIONS,
  SENTIMENT_OPTIONS,
  STATUS_OPTIONS,
  SUGGESTION_STATUS_LABEL,
  TONE_OPTIONS,
  badgeClass,
  formatDateTime,
  labelOf,
} from "../../utils/complaintMeta";

/*
============================================================
 COMPLAINT DETAIL MODAL
 1. Complaint + who sent it
 2. AI analysis (admin can adjust status / priority / category)
 3. AI suggested resolution: accept / modify / reject
 4. AI reply generator
============================================================
*/

function SelectField({ label, value, options, onChange, disabled }) {
  return (
    <label className="cmp-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function ComplaintDetailModal({ complaintId, onClose, onChanged }) {
  const [complaint, setComplaint] = useState(null);
  const [busy, setBusy] = useState("");

  const [mode, setMode] = useState(null); // "modify" | "reject" | null
  const [resolutionDraft, setResolutionDraft] = useState("");

  const [tone, setTone] = useState("professional");
  const [language, setLanguage] = useState("English");
  const [replyDraft, setReplyDraft] = useState("");
  const [markResolved, setMarkResolved] = useState(true);

  /* ---------- load ---------- */

  useEffect(() => {
    let ignore = false;

    getComplaint(complaintId)
      .then((data) => {
        if (!ignore) setComplaint(data);
      })
      .catch((error) => {
        toast.error(getErrorMessage(error, "Could not open this complaint."));
        onClose();
      });

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaintId]);

  /* ---------- poll while the AI is still analysing ---------- */

  const analysing = complaint?.aiStatus === "PENDING";

  useEffect(() => {
    if (!analysing) return undefined;

    const timer = setInterval(async () => {
      try {
        const fresh = await getComplaint(complaintId);
        setComplaint(fresh);
        if (fresh.aiStatus !== "PENDING") onChanged?.();
      } catch {
        /* keep polling quietly */
      }
    }, 3000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysing, complaintId]);

  /* ---------- close on Escape, lock page scroll ---------- */

  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- actions ---------- */

  // Runs an API call that returns the updated complaint
  const act = async (name, request, successMessage) => {
    setBusy(name);
    try {
      const updated = await request();
      setComplaint(updated);
      if (successMessage) toast.success(successMessage);
      onChanged?.();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setBusy("");
    }
  };

  const changeField = (field, value) =>
    act(`field-${field}`, () => updateComplaint(complaintId, { [field]: value }), "Complaint updated");

  const reanalyze = () =>
    act("reanalyze", () => reanalyzeComplaint(complaintId), "AI analysis refreshed");

  const acceptSuggestion = () =>
    act("accept", () => decideSuggestion(complaintId, { decision: "ACCEPT" }), "Suggestion accepted");

  const openMode = (nextMode) => {
    setResolutionDraft(
      nextMode === "modify" ? complaint.finalResolution || complaint.aiSuggestedResolution || "" : ""
    );
    setMode(nextMode);
  };

  const submitMode = async () => {
    const decision = mode === "modify" ? "MODIFY" : "REJECT";
    const message = mode === "modify" ? "Resolution saved" : "Suggestion rejected";

    const ok = await act(
      "decide",
      () => decideSuggestion(complaintId, { decision, resolution: resolutionDraft }),
      message
    );
    if (ok) setMode(null);
  };

  const generateReply = async () => {
    setBusy("generate");
    try {
      const { reply } = await generateReplyDraft(complaintId, { tone, language });
      setReplyDraft(reply);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not generate a reply."));
    } finally {
      setBusy("");
    }
  };

  const sendReply = async () => {
    const ok = await act(
      "send",
      () => sendComplaintReply(complaintId, { reply: replyDraft, markResolved }),
      "Reply sent to the parent"
    );
    if (ok) setReplyDraft("");
  };

  /* ---------- render ---------- */

  const working = Boolean(busy);

  return (
    <div className="cmp-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="cmp-modal" role="dialog" aria-modal="true" aria-labelledby="cmp-modal-title">
        {!complaint ? (
          <div className="cmp-modal-loading">
            <Loader2 className="cmp-spin" size={22} /> Loading complaint...
          </div>
        ) : (
          <>
            {/* ---------- header ---------- */}
            <header className="cmp-modal-head">
              <div>
                <p className="cmp-ticket">{complaint.ticketNo}</p>
                <h2 id="cmp-modal-title">{complaint.subject}</h2>
                <div className="cmp-chip-row">
                  <span className={badgeClass(complaint.status)}>{labelOf(STATUS_OPTIONS, complaint.status)}</span>
                  <span className={badgeClass(complaint.priority)}>{labelOf(PRIORITY_OPTIONS, complaint.priority)} priority</span>
                  <span className="cmp-badge cmp-badge--category">{labelOf(CATEGORY_OPTIONS, complaint.category)}</span>
                </div>
              </div>
              <button type="button" className="cmp-icon-btn" onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            </header>

            <div className="cmp-modal-body">
              {/* ---------- complaint ---------- */}
              <section className="cmp-block">
                <dl className="cmp-meta">
                  <div>
                    <dt>Parent</dt>
                    <dd>
                      {complaint.parent?.name || "Not available"}
                      {complaint.parent?.relation ? ` (${complaint.parent.relation})` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt>Contact</dt>
                    <dd>{complaint.parent?.mobile || complaint.parent?.email || "-"}</dd>
                  </div>
                  <div>
                    <dt>Student</dt>
                    <dd>
                      {complaint.student
                        ? `${complaint.student.name}, ${complaint.student.className || ""} ${complaint.student.sectionName || ""}`.trim()
                        : "Not about a specific child"}
                    </dd>
                  </div>
                  <div>
                    <dt>Submitted</dt>
                    <dd>{formatDateTime(complaint.createdAt)}</dd>
                  </div>
                </dl>
                <p className="cmp-text">{complaint.description}</p>
              </section>

              {/* ---------- AI analysis ---------- */}
              <section className="cmp-block">
                <div className="cmp-block-head">
                  <h3>AI analysis</h3>
                  <button type="button" className="cmp-btn cmp-btn--ghost" onClick={reanalyze} disabled={working || analysing}>
                    {busy === "reanalyze" ? <Loader2 className="cmp-spin" size={15} /> : <RefreshCw size={15} />}
                    Re-analyze
                  </button>
                </div>

                {analysing && (
                  <p className="cmp-notice">
                    <Loader2 className="cmp-spin" size={15} /> The AI is analysing this complaint. This page updates by itself.
                  </p>
                )}

                {complaint.aiStatus === "FALLBACK" && (
                  <p className="cmp-notice cmp-notice--warn">
                    The AI service was unavailable, so basic keyword rules set the category and priority. Use Re-analyze to try again.
                  </p>
                )}

                {!analysing && (
                  <>
                    <div className="cmp-chip-row">
                      <span className={badgeClass(complaint.sentiment)}>{labelOf(SENTIMENT_OPTIONS, complaint.sentiment)} sentiment</span>
                      <span className="cmp-badge cmp-badge--emotion">{labelOf(EMOTION_OPTIONS, complaint.emotion)}</span>
                      {complaint.issueTag && <span className="cmp-badge">{complaint.issueTag}</span>}
                    </div>

                    {complaint.aiSummary && <p className="cmp-text">{complaint.aiSummary}</p>}
                    {complaint.priorityReason && (
                      <p className="cmp-hint">Why this priority: {complaint.priorityReason}</p>
                    )}
                  </>
                )}

                <div className="cmp-fields">
                  <SelectField label="Status" value={complaint.status} options={STATUS_OPTIONS} onChange={(v) => changeField("status", v)} disabled={working} />
                  <SelectField label="Priority" value={complaint.priority} options={PRIORITY_OPTIONS} onChange={(v) => changeField("priority", v)} disabled={working} />
                  <SelectField label="Category" value={complaint.category} options={CATEGORY_OPTIONS} onChange={(v) => changeField("category", v)} disabled={working} />
                  <SelectField label="Department" value={complaint.department} options={DEPARTMENT_OPTIONS} onChange={(v) => changeField("department", v)} disabled={working} />
                </div>
              </section>

              {/* ---------- suggested resolution ---------- */}
              <section className="cmp-block">
                <div className="cmp-block-head">
                  <h3>Suggested resolution</h3>
                  <span className={badgeClass(complaint.suggestionStatus === "PENDING" ? "pending" : complaint.suggestionStatus)}>
                    {SUGGESTION_STATUS_LABEL[complaint.suggestionStatus]}
                  </span>
                </div>

                {complaint.aiSuggestedResolution ? (
                  <p className="cmp-text cmp-pre">{complaint.aiSuggestedResolution}</p>
                ) : (
                  <p className="cmp-hint">
                    {analysing
                      ? "The suggestion will appear once the analysis finishes."
                      : "There is no AI suggestion for this complaint. You can write your own resolution."}
                  </p>
                )}

                {complaint.suggestionStatus !== "PENDING" && complaint.finalResolution && (
                  <div className="cmp-final">
                    <strong>Resolution you chose</strong>
                    <p className="cmp-pre">{complaint.finalResolution}</p>
                  </div>
                )}

                {mode ? (
                  <div className="cmp-inline-form">
                    <label htmlFor="cmp-resolution">
                      {mode === "modify" ? "Edit the resolution" : "Your own resolution (optional)"}
                    </label>
                    <textarea
                      id="cmp-resolution"
                      rows={5}
                      maxLength={2000}
                      value={resolutionDraft}
                      onChange={(event) => setResolutionDraft(event.target.value)}
                    />
                    <div className="cmp-actions">
                      <button type="button" className="cmp-btn cmp-btn--primary" onClick={submitMode} disabled={working}>
                        {busy === "decide" && <Loader2 className="cmp-spin" size={15} />}
                        {mode === "modify" ? "Save resolution" : "Reject suggestion"}
                      </button>
                      <button type="button" className="cmp-btn" onClick={() => setMode(null)} disabled={working}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="cmp-actions">
                    {complaint.aiSuggestedResolution ? (
                      <>
                        <button type="button" className="cmp-btn cmp-btn--primary" onClick={acceptSuggestion} disabled={working}>
                          {busy === "accept" ? <Loader2 className="cmp-spin" size={15} /> : <Check size={15} />}
                          Accept
                        </button>
                        <button type="button" className="cmp-btn" onClick={() => openMode("modify")} disabled={working}>
                          <Pencil size={15} /> Modify
                        </button>
                        <button type="button" className="cmp-btn cmp-btn--danger" onClick={() => openMode("reject")} disabled={working}>
                          <Ban size={15} /> Reject
                        </button>
                      </>
                    ) : (
                      !analysing && (
                        <button type="button" className="cmp-btn" onClick={() => openMode("modify")} disabled={working}>
                          <Pencil size={15} /> Write resolution
                        </button>
                      )
                    )}
                  </div>
                )}
              </section>

              {/* ---------- reply ---------- */}
              <section className="cmp-block">
                <div className="cmp-block-head">
                  <h3>Reply to parent</h3>
                </div>

                {complaint.adminReply && (
                  <div className="cmp-final">
                    <strong>Last reply sent on {formatDateTime(complaint.repliedAt)}</strong>
                    <p className="cmp-pre">{complaint.adminReply}</p>
                  </div>
                )}

                <div className="cmp-reply-tools">
                  <SelectField label="Tone" value={tone} options={TONE_OPTIONS} onChange={setTone} disabled={working} />
                  <SelectField label="Language" value={language} options={LANGUAGE_OPTIONS} onChange={setLanguage} disabled={working} />
                  <button type="button" className="cmp-btn cmp-btn--accent" onClick={generateReply} disabled={working}>
                    {busy === "generate" ? <Loader2 className="cmp-spin" size={15} /> : <Sparkles size={15} />}
                    Generate response
                  </button>
                </div>

                {!complaint.finalResolution && (
                  <p className="cmp-hint">
                    Accept or modify a resolution first if you want the reply to mention the action taken.
                  </p>
                )}

                <textarea
                  className="cmp-reply-box"
                  rows={7}
                  maxLength={3000}
                  placeholder="Generate a response, or write your own. You can edit it before sending."
                  value={replyDraft}
                  onChange={(event) => setReplyDraft(event.target.value)}
                />

                <div className="cmp-actions cmp-actions--between">
                  <label className="cmp-check">
                    <input type="checkbox" checked={markResolved} onChange={(event) => setMarkResolved(event.target.checked)} />
                    Mark complaint as resolved
                  </label>
                  <button
                    type="button"
                    className="cmp-btn cmp-btn--primary"
                    onClick={sendReply}
                    disabled={working || replyDraft.trim().length < 10}
                  >
                    {busy === "send" ? <Loader2 className="cmp-spin" size={15} /> : <Send size={15} />}
                    Send reply
                  </button>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
