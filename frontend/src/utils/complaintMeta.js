/*
============================================================
 COMPLAINT META
 Labels and options shared by the admin and parent pages.
 Values must match the backend enums.
============================================================
*/

export const CATEGORY_OPTIONS = [
  { value: "ACADEMIC", label: "Academic" },
  { value: "FEES", label: "Fees" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "TEACHER", label: "Teacher" },
  { value: "INFRASTRUCTURE", label: "Infrastructure" },
  { value: "HOSTEL", label: "Hostel" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "SAFETY", label: "Safety" },
  { value: "ADMINISTRATION", label: "Administration" },
  { value: "OTHER", label: "Other" },
];

export const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

export const SENTIMENT_OPTIONS = [
  { value: "POSITIVE", label: "Positive" },
  { value: "NEUTRAL", label: "Neutral" },
  { value: "NEGATIVE", label: "Negative" },
];

export const EMOTION_OPTIONS = [
  { value: "ANGRY", label: "Angry" },
  { value: "SAD", label: "Sad" },
  { value: "FRUSTRATED", label: "Frustrated" },
  { value: "WORRIED", label: "Worried" },
  { value: "URGENT", label: "Urgent" },
  { value: "NEUTRAL", label: "Neutral" },
];

export const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

export const SUGGESTION_STATUS_LABEL = {
  PENDING: "Awaiting your decision",
  ACCEPTED: "Accepted",
  MODIFIED: "Modified",
  REJECTED: "Rejected",
};

/* What parents see: friendlier wording for the same statuses */
export const PARENT_STATUS_LABEL = {
  PENDING: "Received",
  IN_PROGRESS: "Under review",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const DEPARTMENT_OPTIONS = [
  "Academic Office",
  "Accounts & Fees",
  "Transport",
  "Maintenance",
  "Hostel",
  "IT Support",
  "Safety & Discipline",
  "Administration",
].map((name) => ({ value: name, label: name }));

export const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "empathetic", label: "Empathetic" },
  { value: "apologetic", label: "Apologetic" },
];

export const LANGUAGE_OPTIONS = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
  { value: "Gujarati", label: "Gujarati" },
];

export const labelOf = (options, value) =>
  options.find((option) => option.value === value)?.label ?? value ?? "-";

/* "IN_PROGRESS" -> "cmp-badge cmp-badge--in-progress" (see complaint-badges.css) */
export const badgeClass = (value) =>
  `cmp-badge cmp-badge--${String(value || "")
    .toLowerCase()
    .replace(/_/g, "-")}`;

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

export const formatHours = (hours) => {
  if (hours === null || hours === undefined) return "-";
  if (hours < 1) return `${Math.max(Math.round(hours * 60), 1)} min`;
  if (hours < 48) return `${hours} hrs`;
  return `${Math.round((hours / 24) * 10) / 10} days`;
};
