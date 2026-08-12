/**
 * Constants for CampusIQ Application
 * Contains all application-wide constants
 */

// =====================================================
// API Configuration
// =====================================================

export const API_BASE_URL = "http://localhost:8000/api/v1";
export const API_TIMEOUT = 10000;

// =====================================================
// Application Constants
// =====================================================

export const APP_NAME = "CampusIQ";
export const APP_VERSION = "1.0.0";
export const ORGANIZATION_NAME = "School Management System";

// =====================================================
// Pagination
// =====================================================

export const DEFAULT_PAGE_SIZE = 10;

export const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 50, 100];

// =====================================================
// Status Constants
// =====================================================

export const STUDENT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
  GRADUATED: "graduated",
};

export const STAFF_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  LEAVE: "leave",
  RETIRED: "retired",
};

/** Matches Prisma enum AttendanceStatus exactly */
export const ATTENDANCE_STATUS = {
  PRESENT: "present",
  ABSENT: "absent",
  LATE: "late",
  HALF_DAY: "half_day",
  HOLIDAY: "holiday",
  LEAVE: "leave",
};

export const ATTENDANCE_STATUS_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "half_day", label: "Half Day" },
  { value: "holiday", label: "Holiday" },
  { value: "leave", label: "Leave" },
];

export const FEE_STATUS = {
  PAID: "paid",
  PENDING: "pending",
  OVERDUE: "overdue",
  PARTIAL: "partial",
};

export const EXAM_STATUS = {
  SCHEDULED: "scheduled",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const HOLIDAY_TYPE = {
  NATIONAL: "national",
  RELIGIOUS: "religious",
  SCHOOL: "school",
  OPTIONAL: "optional",
};

// =====================================================
// Gender
// =====================================================

export const GENDER = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
};

// =====================================================
// Blood Group
// =====================================================

export const BLOOD_GROUP = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

// =====================================================
// Religion
// =====================================================

export const RELIGIONS = [
  "Christian",
  "Hindu",
  "Islam",
  "Buddhist",
  "Sikh",
  "Jewish",
  "Other",
];

// =====================================================
// Categories
// =====================================================

export const CATEGORIES = [
  "General",
  "OBC",
  "SC",
  "ST",
];

// =====================================================
// Days of Week
// =====================================================

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// =====================================================
// Colors for Charts and UI
// =====================================================

export const CHART_COLORS = {
  primary: "#0ea5e9",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
  purple: "#8b5cf6",
};

// =====================================================
// Routes
// =====================================================

export const ROUTES = {
  DASHBOARD: "/dashboard",
  ACADEMIC_YEAR: "/academic-year",
  MASTER: "/master",
  MASTER_DATA: "/master-data",
  DEPARTMENT: "/department",
  CLASS: "/class",
  SECTION: "/section",
  STUDENT: "/student",
  STAFF: "/staff",
  ATTENDANCE: "/attendance",
  EXAM: "/exam",
  FEE: "/fee",
  HOLIDAY: "/holiday",
  TIMETABLE: "/timetable",
  CUSTOM_FIELDS: "/custom-fields",
  SETTINGS: "/settings",
};

// =====================================================
// Custom Fields — exact backend control values
// (custom-fields.routes.js swagger: TextBox | DropDown)
// =====================================================

export const CUSTOM_FIELD_CONTROLS = {
  TEXT_BOX: "TextBox",
  DROP_DOWN: "DropDown",
};

export const CUSTOM_FIELD_CONTROL_OPTIONS = [
  { value: "TextBox", label: "TextBox" },
  { value: "DropDown", label: "DropDown" },
];

/** Identities allowed to create/update/delete fields & options */
export const CUSTOM_FIELD_MANAGE_ROLES = ["admin", "management", "principal"];

/**
 * Identities allowed to create/update/delete Master subjects
 * Matches authorize('admin', 'management', 'principal') on subject routes
 */
export const MASTER_MANAGE_ROLES = ["admin", "management", "principal"];

/**
 * Identities allowed to create/update/delete/bulk Master Data values
 * Matches authorize('admin', 'management', 'principal') on master-data routes
 */
export const MASTER_DATA_MANAGE_ROLES = ["admin", "management", "principal"];

/**
 * Valid Master Data categories from backend
 * master-data.service.js VALID_CATEGORIES (source of truth)
 */
export const MASTER_DATA_CATEGORIES = [
  "BloodGroup",
  "Religion",
  "Country",
  "SocialCategory",
  "MaritalStatus",
  "MotherTongue",
  "Nationality",
  "Document",
  "BoardingCategory",
  "Qualification",
  "House",
  "Medium",
  "Board",
  "Stream",
  "FeeGroup",
  "Occupation",
  "Designation",
];

/** Identities allowed to save student custom field values */
export const CUSTOM_FIELD_VALUE_SAVE_ROLES = [
  "admin",
  "management",
  "principal",
  "staff",
];

// =====================================================
// Sidebar Menu Items
// =====================================================

export const SIDEBAR_MENU = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "LayoutDashboard",
    path: ROUTES.DASHBOARD,
  },
  {
    id: "academic-year",
    label: "Academic Year",
    icon: "Calendar",
    path: ROUTES.ACADEMIC_YEAR,
  },
  {
    id: "master",
    label: "Master",
    icon: "Database",
    path: ROUTES.MASTER,
  },
  {
    id: "master-data",
    label: "Master Data",
    icon: "Database",
    path: ROUTES.MASTER_DATA,
  },
  {
    id: "department",
    label: "Department",
    icon: "Building2",
    path: ROUTES.DEPARTMENT,
  },
  {
    id: "class",
    label: "Class",
    icon: "BookOpen",
    path: ROUTES.CLASS,
  },
  {
    id: "section",
    label: "Section",
    icon: "Layers",
    path: ROUTES.SECTION,
  },
  {
    id: "student",
    label: "Student",
    icon: "Users",
    path: ROUTES.STUDENT,
  },
  {
    id: "staff",
    label: "Staff",
    icon: "UserCheck",
    path: ROUTES.STAFF,
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: "CheckCircle",
    path: ROUTES.ATTENDANCE,
  },
  {
    id: "exam",
    label: "Exam",
    icon: "FileText",
    path: ROUTES.EXAM,
  },
  {
    id: "fee",
    label: "Fee",
    icon: "CreditCard",
    path: ROUTES.FEE,
  },
  {
    id: "holiday",
    label: "Holiday",
    icon: "Smile",
    path: ROUTES.HOLIDAY,
  },
  {
    id: "timetable",
    label: "Timetable",
    icon: "Clock",
    path: ROUTES.TIMETABLE,
  },
  {
    id: "custom-fields",
    label: "Custom Fields",
    icon: "Layers",
    path: ROUTES.CUSTOM_FIELDS,
  },
  {
    id: "settings",
    label: "Settings",
    icon: "Settings",
    path: ROUTES.SETTINGS,
  },
];

// =====================================================
// Toast Messages
// =====================================================

export const TOAST_MESSAGES = {
  SUCCESS: "Operation completed successfully",
  ERROR: "An error occurred. Please try again.",
  SAVED: "Changes saved successfully",
  DELETED: "Item deleted successfully",
  UPDATED: "Item updated successfully",
  CREATED: "Item created successfully",
  LOADING: "Loading...",
};

// =====================================================
// Date Formats
// =====================================================

export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy",
  DISPLAY_TIME: "MMM dd, yyyy HH:mm",
  API: "yyyy-MM-dd",
  API_TIME: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
};

// =====================================================
// Local Storage Keys
// IMPORTANT:
// The login currently stores the JWT using the key "token".
// Axios must therefore read the same key.
// =====================================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: "token",
  USER_DATA: "user",
  SIDEBAR_STATE: "campusiq_sidebar_state",
  THEME: "campusiq_theme",
  PREFERENCES: "campusiq_preferences",
};