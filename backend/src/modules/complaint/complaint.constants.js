const CATEGORIES = [
  "ACADEMIC",
  "FEES",
  "TRANSPORT",
  "TEACHER",
  "INFRASTRUCTURE",
  "HOSTEL",
  "TECHNICAL",
  "SAFETY",
  "ADMINISTRATION",
  "OTHER",
];

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const SENTIMENTS = ["POSITIVE", "NEUTRAL", "NEGATIVE"];

const EMOTIONS = [
  "ANGRY",
  "SAD",
  "FRUSTRATED",
  "WORRIED",
  "URGENT",
  "NEUTRAL",
];

const STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

const OPEN_STATUSES = ["PENDING", "IN_PROGRESS"];

const SUGGESTION_DECISIONS = [
  "ACCEPT",
  "MODIFY",
  "REJECT",
];

const REPLY_TONES = [
  "professional",
  "empathetic",
  "apologetic",
];

const REPLY_LANGUAGES = [
  "English",
  "Hindi",
  "Gujarati",
];

const CATEGORY_DEPARTMENT = {
  ACADEMIC: "Academic Office",
  FEES: "Accounts & Fees",
  TRANSPORT: "Transport",
  TEACHER: "Academic Office",
  INFRASTRUCTURE: "Maintenance",
  HOSTEL: "Hostel",
  TECHNICAL: "IT Support",
  SAFETY: "Safety & Discipline",
  ADMINISTRATION: "Administration",
  OTHER: "Administration",
};

const DEPARTMENTS = [
  ...new Set(Object.values(CATEGORY_DEPARTMENT)),
];

const LIMITS = {
  subjectMax: 150,
  descriptionMin: 10,
  descriptionMax: 3000,
  resolutionMax: 2000,
  replyMin: 10,
  replyMax: 3000,
  perParentPerHour: 10,
};

const normalizeEnum = (value, allowed, fallback) => {
  const key = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  return allowed.includes(key) ? key : fallback;
};

module.exports = {
  CATEGORIES,
  PRIORITIES,
  SENTIMENTS,
  EMOTIONS,
  STATUSES,
  OPEN_STATUSES,
  SUGGESTION_DECISIONS,
  REPLY_TONES,
  REPLY_LANGUAGES,
  CATEGORY_DEPARTMENT,
  DEPARTMENTS,
  LIMITS,
  normalizeEnum,
};