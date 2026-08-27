import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Save,
  Search,
  RefreshCw,
  ClipboardCheck,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { StatusBadge } from "../../components/ui/Badge";
import { DataTable } from "../../components/tables/DataTable";

import { useAuth } from "../../context/AuthContext";
import { ATTENDANCE_STATUS_OPTIONS } from "../../utils/constants";

import { getAcademicYears } from "../../api/academicYear.api";
import { getClasses } from "../../api/class.api";
import { getSectionsByClass } from "../../api/section.api";
import { getStudents } from "../../api/student.api";
import axiosClient from "../../api/axios";

import {
  markClassAttendance,
  getClassAttendanceByDate,
  getClassMonthlyAttendanceSummary,
  getStudentAttendanceHistory,
  markStaffAttendance,
  getStaffAttendanceByDate,
  getStaffAttendanceHistory,
} from "../../api/attendance.api";

import "./Attendance.css";

/* =========================================================
   HELPERS
========================================================= */

function getApiError(err, fallback) {
  return (
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}

/* Local date as YYYY-MM-DD */
function todayDateOnly() {
  const d = new Date();

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toDateOnly(value) {
  if (!value) return "";

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(value)
  ) {
    return value.slice(0, 10);
  }

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatIndianDate(date) {
  const dateOnly = toDateOnly(date);

  if (!dateOnly) return "—";

  const dateObj = new Date(`${dateOnly}T00:00:00`);

  if (Number.isNaN(dateObj.getTime())) {
    return "—";
  }

  return dateObj.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(status) {
  return (
    ATTENDANCE_STATUS_OPTIONS.find(
      (option) => option.value === status
    )?.label ||
    status ||
    "—"
  );
}

function academicYearLabel(year) {
  if (!year) return "";

  if (year.name) {
    return year.name;
  }

  if (year.startDate && year.endDate) {
    return `${new Date(year.startDate).getFullYear()}-${new Date(
      year.endDate
    ).getFullYear()}`;
  }

  return String(year.id || "");
}

/* =========================================================
   USER ROLE HELPERS
========================================================= */

function getStaffRole(user) {
  return user?.staffRole || user?.staff?.role || null;
}

function canViewClassAttendance(user) {
  const identity = user?.identity;

  if (
    ["admin", "management", "principal"].includes(identity)
  ) {
    return true;
  }

  return (
    identity === "staff" &&
    getStaffRole(user) === "teacher"
  );
}

function canMarkStudentAttendance(user) {
  if (user?.identity === "admin") {
    return true;
  }

  return (
    user?.identity === "staff" &&
    getStaffRole(user) === "teacher"
  );
}

function canMarkStaffAttendance(user) {
  return user?.identity === "admin";
}

function canViewStaffAttendance(user) {
  return [
    "admin",
    "management",
    "principal",
  ].includes(user?.identity);
}

/* =========================================================
   DATE VALIDATION
========================================================= */

function isSecondSaturday(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);

  if (
    Number.isNaN(d.getTime()) ||
    d.getDay() !== 6
  ) {
    return false;
  }

  const firstDay = new Date(
    d.getFullYear(),
    d.getMonth(),
    1
  );

  const firstSaturday = new Date(firstDay);

  while (firstSaturday.getDay() !== 6) {
    firstSaturday.setDate(
      firstSaturday.getDate() + 1
    );
  }

  const secondSaturday = new Date(firstSaturday);

  secondSaturday.setDate(
    firstSaturday.getDate() + 7
  );

  return (
    d.getDate() ===
    secondSaturday.getDate()
  );
}

function getMarkDateValidationError(dateStr) {
  if (!dateStr) {
    return "Date is required.";
  }

  const d = new Date(`${dateStr}T00:00:00`);

  if (Number.isNaN(d.getTime())) {
    return "Invalid date.";
  }

  if (d.getDay() === 0) {
    return "Cannot mark attendance on Sunday.";
  }

  if (isSecondSaturday(dateStr)) {
    return "Cannot mark attendance on 2nd Saturday.";
  }

  return null;
}

/* =========================================================
   VALID STATUS
========================================================= */

const VALID_ATTENDANCE_STATUSES =
  new Set(
    ATTENDANCE_STATUS_OPTIONS.map(
      (option) => option.value
    )
  );

/* =========================================================
   FETCH ALL STUDENTS
========================================================= */

async function fetchAllStudentsForClass(classId) {
  const allStudents = [];

  let page = 1;
  let totalPages = 1;

  do {
    const response = await getStudents({
      page,
      limit: 100,
      classId,
    });

    const students =
      response?.data?.students || [];

    allStudents.push(...students);

    totalPages =
      response?.data?.pagination?.totalPages || 1;

    page += 1;
  } while (page <= totalPages);

  return allStudents;
}

/* =========================================================
   MAIN ATTENDANCE PAGE
========================================================= */

export default function Attendance() {
  const { user } = useAuth() || {};

  const canMarkStudent =
    canMarkStudentAttendance(user);

  const canViewClass =
    canViewClassAttendance(user);

  const canMarkStaff =
    canMarkStaffAttendance(user);

  const canViewStaff =
    canViewStaffAttendance(user);

  const [activeTab, setActiveTab] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [academicYears, setAcademicYears] =
    useState([]);

  const [classes, setClasses] =
    useState([]);

  const [metaLoading, setMetaLoading] =
    useState(true);

  /* =======================================================
     LOAD ACADEMIC YEARS + CLASSES
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadMeta = async () => {
      try {
        setMetaLoading(true);

        const [
          academicYearResponse,
          classResponse,
        ] = await Promise.all([
          getAcademicYears(),
          getClasses(),
        ]);

        if (!mounted) return;

        setAcademicYears(
          academicYearResponse?.data || []
        );

        setClasses(
          classResponse?.data || []
        );
      } catch (err) {
        console.error(
          "Attendance metadata error:",
          err
        );

        if (mounted) {
          setError(
            getApiError(
              err,
              "Unable to load academic years and classes."
            )
          );
        }
      } finally {
        if (mounted) {
          setMetaLoading(false);
        }
      }
    };

    loadMeta();

    return () => {
      mounted = false;
    };
  }, []);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const tabs = [
    {
      label: "Student Attendance",
      icon: "fa-solid fa-user-check",
    },
    {
      label: "Monthly Summary",
      icon: "fa-solid fa-chart-column",
    },
    {
      label: "Student History",
      icon: "fa-solid fa-clock-rotate-left",
    },
  ];

  if (canViewStaff) {
    tabs.push({
      label: "Staff Attendance",
      icon: "fa-solid fa-users",
    });
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 0:
        return (
          <StudentAttendanceTab
            academicYears={academicYears}
            classes={classes}
            canMark={canMarkStudent}
            canView={canViewClass}
            metaLoading={metaLoading}
            onError={setError}
            onSuccess={setSuccess}
            clearMessages={clearMessages}
          />
        );

      case 1:
        return (
          <MonthlySummaryTab
            academicYears={academicYears}
            classes={classes}
            canView={canViewClass}
            metaLoading={metaLoading}
            onError={setError}
            clearMessages={clearMessages}
          />
        );

      case 2:
        return (
          <StudentHistoryTab
            academicYears={academicYears}
            onError={setError}
            clearMessages={clearMessages}
          />
        );

      case 3:
        if (canViewStaff) {
          return (
            <StaffAttendanceTab
              academicYears={academicYears}
              canMark={canMarkStaff}
              onError={setError}
              onSuccess={setSuccess}
              clearMessages={clearMessages}
            />
          );
        }

        return null;

      default:
        return null;
    }
  };

  return (
    <div className="attendance-page">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="attendance-header">

        <div className="attendance-header-left">

          <div className="attendance-header-icon">
            <ClipboardCheck />
          </div>

          <div>
            <h1 className="attendance-title">
              Attendance
            </h1>

            <p className="attendance-subtitle">
              Manage student attendance, summaries
              and attendance history.
            </p>
          </div>

        </div>

      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div
          className="attendance-alert attendance-alert--error"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* ===================================================
          SUCCESS
      =================================================== */}

      {success && (
        <div
          className="attendance-alert attendance-alert--success"
          role="status"
        >
          {success}
        </div>
      )}

      {/* ===================================================
          TABS
      =================================================== */}

      <div className="attendance-tabs-wrapper">

        <div className="attendance-tabs">

          {tabs.map((tab, index) => (
            <button
              key={tab.label}
              type="button"
              className={`attendance-tab ${
                activeTab === index
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                clearMessages();
                setActiveTab(index);
              }}
            >
              <i
                className={tab.icon}
                aria-hidden="true"
              />

              <span>{tab.label}</span>
            </button>
          ))}

        </div>

        <div className="attendance-tab-content">
          {renderActiveTab()}
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   STUDENT ATTENDANCE TAB
========================================================= */

function StudentAttendanceTab({
  academicYears,
  classes,
  canMark,
  canView,
  metaLoading,
  onError,
  onSuccess,
  clearMessages,
}) {
  const [academicYearId, setAcademicYearId] =
    useState("");

  const [classId, setClassId] =
    useState("");

  const [sectionId, setSectionId] =
    useState("");

  const [date, setDate] =
    useState(todayDateOnly());

  const [sections, setSections] =
    useState([]);

  const [rows, setRows] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [loaded, setLoaded] =
    useState(false);

  const [autoLoaded, setAutoLoaded] =
    useState(false);

  /* =======================================================
     AUTOMATIC ACADEMIC YEAR
  ======================================================= */

  useEffect(() => {
    if (
      !academicYearId &&
      academicYears.length > 0
    ) {
      const active =
        academicYears.find(
          (year) => year.isActive
        );

      setAcademicYearId(
        String(
          active?.id ||
            academicYears[0]?.id ||
            ""
        )
      );
    }
  }, [
    academicYears,
    academicYearId,
  ]);

  /* =======================================================
     LOAD SECTIONS
  ======================================================= */

  useEffect(() => {
    if (!classId) {
      setSections([]);
      setSectionId("");
      return;
    }

    let mounted = true;

    const loadSections = async () => {
      try {
        const response =
          await getSectionsByClass(classId);

        if (!mounted) return;

        setSections(
          response?.data || []
        );

        setSectionId("");
      } catch (err) {
        console.error(
          "Section loading error:",
          err
        );

        if (mounted) {
          setSections([]);
          onError(
            getApiError(
              err,
              "Failed to load sections."
            )
          );
        }
      }
    };

    loadSections();

    return () => {
      mounted = false;
    };
  }, [classId, onError]);

  /* =======================================================
     LOAD ROSTER
  ======================================================= */

  const loadRoster = useCallback(
    async (silent = false) => {
      if (!canView) {
        if (!silent) {
          onError(
            "You do not have permission to view class attendance."
          );
        }

        return;
      }

      if (
        !academicYearId ||
        !classId ||
        !date
      ) {
        return;
      }

      try {
        if (!silent) {
          clearMessages();
        }

        setLoading(true);
        setLoaded(false);

        const [
          students,
          attendanceResponse,
        ] = await Promise.all([
          fetchAllStudentsForClass(
            classId
          ),

          getClassAttendanceByDate({
            classId: Number(classId),

            sectionId: sectionId
              ? Number(sectionId)
              : undefined,

            date,
          }),
        ]);

        const filteredStudents =
          sectionId
            ? students.filter(
                (student) =>
                  String(
                    student.sectionId
                  ) ===
                  String(sectionId)
              )
            : students;

        const existing =
          Array.isArray(
            attendanceResponse?.data
          )
            ? attendanceResponse.data
            : [];

        const byStudentId = {};

        existing.forEach((record) => {
          byStudentId[
            record.studentId
          ] = record;
        });

        const nextRows =
          filteredStudents
            .slice()
            .sort(
              (a, b) =>
                (a.rollNo ?? 0) -
                (b.rollNo ?? 0)
            )
            .map((student) => {
              const existingRecord =
                byStudentId[
                  student.id
                ];

              const existingStatus =
                existingRecord?.status;

              return {
                studentId: student.id,

                studentName:
                  student.studentName ||
                  student.name ||
                  "Unknown Student",

                admissionNo:
                  student.admissionNo ||
                  "—",

                rollNo:
                  student.rollNo,

                status:
                  VALID_ATTENDANCE_STATUSES.has(
                    existingStatus
                  )
                    ? existingStatus
                    : "present",

                remark:
                  existingRecord?.remark ||
                  "",

                markedBy:
                  existingRecord?.markedBy
                    ?.name || "",

                hasExisting:
                  Boolean(
                    existingRecord
                  ),
              };
            });

        setRows(nextRows);
        setLoaded(true);

        if (
          nextRows.length === 0 &&
          !silent
        ) {
          onError(
            "No students found for the selected class/section."
          );
        }
      } catch (err) {
        console.error(
          "Attendance roster error:",
          err
        );

        setRows([]);
        setLoaded(false);

        if (!silent) {
          onError(
            getApiError(
              err,
              "Failed to load attendance roster."
            )
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [
      academicYearId,
      classId,
      sectionId,
      date,
      canView,
      onError,
      clearMessages,
    ]
  );

  /* =======================================================
     AUTOMATIC LOADING
  ======================================================= */

  useEffect(() => {
    if (
      !metaLoading &&
      academicYearId &&
      classId &&
      date &&
      !autoLoaded
    ) {
      setAutoLoaded(true);

      loadRoster(true);
    }
  }, [
    metaLoading,
    academicYearId,
    classId,
    date,
    autoLoaded,
    loadRoster,
  ]);

  /* Reset auto load when class changes */
  useEffect(() => {
    setAutoLoaded(false);
  }, [classId]);

  /* =======================================================
     FILTER SEARCH
  ======================================================= */

  const filteredRows = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) =>
      [
        row.studentName,
        row.admissionNo,
        String(
          row.rollNo ?? ""
        ),
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        )
    );
  }, [rows, search]);

  /* =======================================================
     UPDATE ROW
  ======================================================= */

  const updateRow = (
    studentId,
    field,
    value
  ) => {
    setRows((previous) =>
      previous.map((row) =>
        row.studentId === studentId
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  };

  /* =======================================================
     MARK ALL
  ======================================================= */

  const markAll = (status) => {
    setRows((previous) =>
      previous.map((row) => ({
        ...row,
        status,
      }))
    );
  };

  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave = async () => {
    clearMessages();

    if (!canMark) {
      onError(
        "Only teachers or admins can mark class attendance."
      );
      return;
    }

    if (
      !academicYearId ||
      !classId ||
      !date
    ) {
      onError(
        "Academic year, class, and date are required."
      );
      return;
    }

    const dateError =
      getMarkDateValidationError(date);

    if (dateError) {
      onError(dateError);
      return;
    }

    if (rows.length === 0) {
      onError(
        "Load students before saving attendance."
      );
      return;
    }

    const invalidStatus =
      rows.find(
        (row) =>
          !VALID_ATTENDANCE_STATUSES.has(
            row.status
          )
      );

    if (invalidStatus) {
      onError(
        `Invalid attendance status "${invalidStatus.status}".`
      );
      return;
    }

    const payload = {
      academicYearId:
        Number(academicYearId),

      classId:
        Number(classId),

      date,

      records: rows.map((row) => {
        const record = {
          studentId:
            Number(row.studentId),

          status: row.status,
        };

        if (
          row.remark?.trim()
        ) {
          record.remark =
            row.remark.trim();
        }

        return record;
      }),
    };

    if (sectionId) {
      payload.sectionId =
        Number(sectionId);
    }

    try {
      setSaving(true);

      const response =
        await markClassAttendance(
          payload
        );

      onSuccess(
        response?.message ||
          response?.data?.message ||
          `Attendance marked for ${
            response?.data?.count ??
            rows.length
          } students.`
      );

      await loadRoster(true);
    } catch (err) {
      console.error(
        "Save attendance error:",
        err
      );

      onError(
        getApiError(
          err,
          "Failed to save attendance."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     TABLE
  ======================================================= */

  const columns = [
    {
      header: "Roll No",

      render: (row) =>
        row.rollNo ?? "—",
    },

    {
      header: "Student",

      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">
            {row.studentName}
          </p>

          <p className="text-xs text-gray-500">
            {row.admissionNo}
          </p>
        </div>
      ),
    },

    {
      header: "Status",

      render: (row) =>
        canMark ? (
          <select
            id={`attendance-status-${row.studentId}`}
            name={`attendanceStatus-${row.studentId}`}
            className="attendance-inline-select"
            value={row.status}
            onChange={(event) =>
              updateRow(
                row.studentId,
                "status",
                event.target.value
              )
            }
          >
            {ATTENDANCE_STATUS_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>
        ) : (
          <StatusBadge
            status={row.status}
          >
            {statusLabel(row.status)}
          </StatusBadge>
        ),
    },

    {
      header: "Remark",

      render: (row) =>
        canMark ? (
          <input
            id={`attendance-remark-${row.studentId}`}
            name={`attendanceRemark-${row.studentId}`}
            className="attendance-inline-input"
            value={row.remark}
            placeholder="Optional"
            onChange={(event) =>
              updateRow(
                row.studentId,
                "remark",
                event.target.value
              )
            }
          />
        ) : (
          row.remark || "—"
        ),
    },

    {
      header: "Marked By",

      render: (row) =>
        row.markedBy ||
        (row.hasExisting
          ? "—"
          : "Not marked"),
    },
  ];

  return (
    <div>

      {/* ===================================================
          FILTERS
      =================================================== */}

      <div className="attendance-filter-card">

        <h2 className="attendance-filter-title">
          Attendance Filters
        </h2>

        <div className="attendance-filter-grid">

          <div className="attendance-filter-field">
            <Select
              id="attendance-academic-year"
              name="attendanceAcademicYear"
              label="Academic Year"
              required
              value={academicYearId}
              onChange={(event) =>
                setAcademicYearId(
                  event.target.value
                )
              }
              disabled={metaLoading}
              options={academicYears.map(
                (year) => ({
                  value: String(
                    year.id
                  ),
                  label:
                    academicYearLabel(
                      year
                    ),
                })
              )}
            />
          </div>

          <div className="attendance-filter-field">
            <Select
              id="attendance-class"
              name="attendanceClass"
              label="Class"
              required
              value={classId}
              onChange={(event) => {
                setClassId(
                  event.target.value
                );
                setRows([]);
                setLoaded(false);
              }}
              disabled={metaLoading}
              options={classes.map(
                (item) => ({
                  value: String(
                    item.id
                  ),
                  label: item.name,
                })
              )}
            />
          </div>

          <div className="attendance-filter-field">
            <Select
              id="attendance-section"
              name="attendanceSection"
              label="Section"
              value={sectionId}
              onChange={(event) => {
                setSectionId(
                  event.target.value
                );
                setLoaded(false);
              }}
              disabled={!classId}
              options={sections.map(
                (section) => ({
                  value: String(
                    section.id
                  ),
                  label:
                    section.name,
                })
              )}
            />
          </div>

          <div className="attendance-filter-field">
            <Input
              id="attendance-date"
              name="attendanceDate"
              label="Date"
              required
              type="date"
              value={date}
              onChange={(event) => {
                setDate(
                  event.target.value
                );
                setLoaded(false);
              }}
            />
          </div>

        </div>

        <div
          style={{
            marginTop: "16px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="primary"
            onClick={() =>
              loadRoster(false)
            }
            disabled={
              loading ||
              !classId ||
              !date
            }
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${
                loading
                  ? "animate-spin"
                  : ""
              }`}
            />

            {loading
              ? "Loading..."
              : "Refresh Attendance"}
          </Button>
        </div>

      </div>

      {/* ===================================================
          ROSTER
      =================================================== */}

      <div className="attendance-roster-card">

        <div className="attendance-card-header">

          <h2 className="attendance-card-title">
            Student Roster{" "}
            {loaded && (
              <span>
                ({filteredRows.length})
              </span>
            )}
          </h2>

          <div className="attendance-card-actions">

            <div className="attendance-search">

              <Search
                className="attendance-search-icon"
              />

              <Input
                id="attendance-student-search"
                name="attendanceStudentSearch"
                placeholder="Search student..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

            </div>

            {canMark &&
              loaded && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      markAll("present")
                    }
                  >
                    All Present
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      markAll("absent")
                    }
                  >
                    All Absent
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={
                      saving ||
                      rows.length === 0
                    }
                  >
                    <Save className="w-4 h-4 mr-2" />

                    {saving
                      ? "Saving..."
                      : "Save Attendance"}
                  </Button>
                </>
              )}

          </div>

        </div>

        <div className="attendance-card-body">

          {loading ? (
            <div className="attendance-loading">
              Loading students...
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredRows}
              noDataMessage={
                loaded
                  ? "No students found for this class or section."
                  : "Attendance will load automatically after selecting a class."
              }
            />
          )}

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   MONTHLY SUMMARY TAB
========================================================= */

function MonthlySummaryTab({
  academicYears,
  classes,
  canView,
  metaLoading,
  onError,
  clearMessages,
}) {
  const now = new Date();

  const [academicYearId, setAcademicYearId] =
    useState("");

  const [classId, setClassId] =
    useState("");

  const [sectionId, setSectionId] =
    useState("");

  const [month, setMonth] =
    useState(
      String(now.getMonth() + 1)
    );

  const [year, setYear] =
    useState(
      String(now.getFullYear())
    );

  const [sections, setSections] =
    useState([]);

  const [summary, setSummary] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    if (
      !academicYearId &&
      academicYears.length > 0
    ) {
      const active =
        academicYears.find(
          (item) => item.isActive
        );

      setAcademicYearId(
        String(
          active?.id ||
            academicYears[0]?.id ||
            ""
        )
      );
    }
  }, [
    academicYears,
    academicYearId,
  ]);

  useEffect(() => {
    if (!classId) {
      setSections([]);
      setSectionId("");
      return;
    }

    let mounted = true;

    getSectionsByClass(classId)
      .then((response) => {
        if (!mounted) return;

        setSections(
          response?.data || []
        );

        setSectionId("");
      })
      .catch((err) => {
        if (!mounted) return;

        setSections([]);

        onError(
          getApiError(
            err,
            "Failed to load sections."
          )
        );
      });

    return () => {
      mounted = false;
    };
  }, [classId, onError]);

  const loadSummary = async () => {
    clearMessages();

    if (!canView) {
      onError(
        "You do not have permission to view monthly attendance summary."
      );
      return;
    }

    if (
      !classId ||
      !month ||
      !year
    ) {
      onError(
        "Class, month, and year are required."
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await getClassMonthlyAttendanceSummary(
          {
            classId: Number(classId),

            sectionId: sectionId
              ? Number(sectionId)
              : undefined,

            month: Number(month),

            year: Number(year),

            academicYearId:
              academicYearId
                ? Number(
                    academicYearId
                  )
                : undefined,
          }
        );

      setSummary(
        response?.data || null
      );
    } catch (err) {
      console.error(err);

      setSummary(null);

      onError(
        getApiError(
          err,
          "Failed to load monthly summary."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const monthOptions =
    Array.from(
      { length: 12 },
      (_, index) => ({
        value: String(
          index + 1
        ),
        label: new Date(
          2000,
          index,
          1
        ).toLocaleString(
          "en",
          {
            month: "long",
          }
        ),
      })
    );

  const columns = [
    {
      header: "Roll No",
      render: (row) =>
        row.rollNo ?? "—",
    },

    {
      header: "Student",
      accessor: "studentName",
    },

    {
      header: "Admission No",
      accessor: "admissionNo",
    },

    {
      header: "Working Days",
      accessor: "totalWorkingDays",
    },

    {
      header: "Present",
      accessor: "presentDays",
    },

    {
      header: "Absent",
      accessor: "absentDays",
    },

    {
      header: "Percentage",
      accessor: "percentage",
    },
  ];

  return (
    <div>

      <div className="attendance-filter-card">

        <h2 className="attendance-filter-title">
          Monthly Attendance Summary
        </h2>

        <div className="attendance-filter-grid">

          <Select
            id="monthly-academic-year"
            name="monthlyAcademicYear"
            label="Academic Year"
            value={academicYearId}
            onChange={(event) =>
              setAcademicYearId(
                event.target.value
              )
            }
            disabled={metaLoading}
            options={academicYears.map(
              (item) => ({
                value: String(
                  item.id
                ),
                label:
                  academicYearLabel(
                    item
                  ),
              })
            )}
          />

          <Select
            id="monthly-class"
            name="monthlyClass"
            label="Class"
            required
            value={classId}
            onChange={(event) =>
              setClassId(
                event.target.value
              )
            }
            options={classes.map(
              (item) => ({
                value: String(
                  item.id
                ),
                label: item.name,
              })
            )}
          />

          <Select
            id="monthly-section"
            name="monthlySection"
            label="Section"
            value={sectionId}
            onChange={(event) =>
              setSectionId(
                event.target.value
              )
            }
            disabled={!classId}
            options={sections.map(
              (item) => ({
                value: String(
                  item.id
                ),
                label: item.name,
              })
            )}
          />

          <Select
            id="attendance-month"
            name="attendanceMonth"
            label="Month"
            required
            value={month}
            onChange={(event) =>
              setMonth(
                event.target.value
              )
            }
            options={monthOptions}
          />

          <Input
            id="attendance-year"
            name="attendanceYear"
            label="Year"
            required
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={(event) =>
              setYear(
                event.target.value
              )
            }
          />

        </div>

        <div
          style={{
            marginTop: "16px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="primary"
            onClick={loadSummary}
            disabled={
              loading ||
              !classId
            }
          >
            {loading
              ? "Loading..."
              : "Load Summary"}
          </Button>
        </div>

      </div>

      {summary && (
        <div className="attendance-section-card">

          <div className="attendance-card-header">
            <h2 className="attendance-card-title">
              {monthOptions.find(
                (item) =>
                  item.value ===
                  String(
                    summary.month
                  )
              )?.label}{" "}
              {summary.year}
            </h2>
          </div>

          <div className="attendance-card-body">

            <DataTable
              columns={columns}
              data={
                summary.students ||
                []
              }
              noDataMessage="No students found."
            />

          </div>

        </div>
      )}

      {!summary &&
        !loading && (
          <div className="attendance-empty">
            Select a class and month,
            then load the summary.
          </div>
        )}

    </div>
  );
}

/* =========================================================
   STUDENT HISTORY TAB
========================================================= */

function StudentHistoryTab({
  academicYears,
  onError,
  clearMessages,
}) {
  const [academicYearId, setAcademicYearId] =
    useState("");

  const [studentQuery, setStudentQuery] =
    useState("");

  const [studentOptions, setStudentOptions] =
    useState([]);

  const [studentId, setStudentId] =
    useState("");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [history, setHistory] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [searching, setSearching] =
    useState(false);

  useEffect(() => {
    if (
      !academicYearId &&
      academicYears.length > 0
    ) {
      const active =
        academicYears.find(
          (item) => item.isActive
        );

      setAcademicYearId(
        String(
          active?.id ||
            academicYears[0]?.id ||
            ""
        )
      );
    }
  }, [
    academicYears,
    academicYearId,
  ]);

  const searchStudents = async () => {
    clearMessages();

    try {
      setSearching(true);

      const response =
        await getStudents({
          page: 1,
          limit: 20,
          search:
            studentQuery.trim(),
        });

      const list =
        response?.data?.students ||
        [];

      setStudentOptions(list);

      if (list.length === 1) {
        setStudentId(
          String(list[0].id)
        );
      }

      if (list.length === 0) {
        onError(
          "No students matched your search."
        );
      }
    } catch (err) {
      console.error(err);

      setStudentOptions([]);

      onError(
        getApiError(
          err,
          "Failed to search students."
        )
      );
    } finally {
      setSearching(false);
    }
  };

  const loadHistory = async () => {
    clearMessages();

    if (!studentId) {
      onError(
        "Select a student first."
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await getStudentAttendanceHistory(
          Number(studentId),
          {
            academicYearId:
              academicYearId
                ? Number(
                    academicYearId
                  )
                : undefined,

            fromDate:
              fromDate || undefined,

            toDate:
              toDate || undefined,
          }
        );

      setHistory(
        response?.data || null
      );
    } catch (err) {
      console.error(err);

      setHistory(null);

      onError(
        getApiError(
          err,
          "Failed to load student attendance history."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: "Date",
      render: (row) =>
        formatIndianDate(
          row.date
        ),
    },

    {
      header: "Status",

      render: (row) => (
        <StatusBadge
          status={row.status}
        >
          {statusLabel(
            row.status
          )}
        </StatusBadge>
      ),
    },

    {
      header: "Remark",

      render: (row) =>
        row.remark || "—",
    },
  ];

  return (
    <div>

      <div className="attendance-filter-card">

        <h2 className="attendance-filter-title">
          Student Attendance History
        </h2>

        <div className="attendance-filter-grid">

          <div>
            <Input
              id="student-search"
              name="studentSearch"
              label="Search Student"
              placeholder="Name or admission no..."
              value={studentQuery}
              onChange={(event) =>
                setStudentQuery(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  event.preventDefault();
                  searchStudents();
                }
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <Button
              variant="outline"
              onClick={searchStudents}
              disabled={searching}
            >
              <Search className="w-4 h-4 mr-2" />

              {searching
                ? "Searching..."
                : "Search"}
            </Button>
          </div>

          <Select
            id="history-student"
            name="historyStudent"
            label="Student"
            required
            value={studentId}
            onChange={(event) =>
              setStudentId(
                event.target.value
              )
            }
            options={studentOptions.map(
              (student) => ({
                value: String(
                  student.id
                ),
                label: `${
                  student.studentName
                } (${
                  student.admissionNo
                })`,
              })
            )}
          />

          <Select
            id="history-academic-year"
            name="historyAcademicYear"
            label="Academic Year"
            value={academicYearId}
            onChange={(event) =>
              setAcademicYearId(
                event.target.value
              )
            }
            options={academicYears.map(
              (item) => ({
                value: String(
                  item.id
                ),
                label:
                  academicYearLabel(
                    item
                  ),
              })
            )}
          />

          <Input
            id="history-from-date"
            name="historyFromDate"
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(event) =>
              setFromDate(
                event.target.value
              )
            }
          />

          <Input
            id="history-to-date"
            name="historyToDate"
            label="To Date"
            type="date"
            value={toDate}
            onChange={(event) =>
              setToDate(
                event.target.value
              )
            }
          />

        </div>

        <div
          style={{
            marginTop: "16px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="primary"
            onClick={loadHistory}
            disabled={
              loading ||
              !studentId
            }
          >
            {loading
              ? "Loading..."
              : "Load History"}
          </Button>
        </div>

      </div>

      {history && (
        <>

          <div className="attendance-summary-grid">

            <SummaryStat
              label="Working Days"
              value={
                history.summary
                  ?.totalWorkingDays
              }
            />

            <SummaryStat
              label="Present"
              value={
                history.summary
                  ?.presentDays
              }
            />

            <SummaryStat
              label="Absent"
              value={
                history.summary
                  ?.absentDays
              }
            />

            <SummaryStat
              label="Unmarked"
              value={
                history.summary
                  ?.unmarkedDays
              }
            />

            <SummaryStat
              label="Percentage"
              value={
                history.summary
                  ?.percentage
              }
            />

          </div>

          <div className="attendance-section-card">

            <div className="attendance-card-header">

              <h2 className="attendance-card-title">
                {history.student?.name ||
                  "Student"}{" "}
                —{" "}
                {
                  history.student
                    ?.admissionNo
                }
              </h2>

            </div>

            <div className="attendance-card-body">

              <DataTable
                columns={columns}
                data={
                  history.records ||
                  []
                }
                noDataMessage="No attendance records."
              />

            </div>

          </div>

        </>
      )}

    </div>
  );
}

/* =========================================================
   STAFF ATTENDANCE TAB
========================================================= */

function StaffAttendanceTab({
  academicYears,
  canMark,
  onError,
  onSuccess,
  clearMessages,
}) {
  const [academicYearId, setAcademicYearId] =
    useState("");

  const [date, setDate] =
    useState(todayDateOnly());

  const [staffList, setStaffList] =
    useState([]);

  const [records, setRecords] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [savingId, setSavingId] =
    useState(null);

  const [markForm, setMarkForm] =
    useState({
      staffId: "",
      status: "present",
      inTime: "",
      outTime: "",
      remark: "",
    });

  const [historyStaffId, setHistoryStaffId] =
    useState("");

  const [historyFrom, setHistoryFrom] =
    useState("");

  const [historyTo, setHistoryTo] =
    useState("");

  const [history, setHistory] =
    useState(null);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  /* =======================================================
     ACADEMIC YEAR
  ======================================================= */

  useEffect(() => {
    if (
      !academicYearId &&
      academicYears.length > 0
    ) {
      const active =
        academicYears.find(
          (item) => item.isActive
        );

      setAcademicYearId(
        String(
          active?.id ||
            academicYears[0]?.id ||
            ""
        )
      );
    }
  }, [
    academicYears,
    academicYearId,
  ]);

  /* =======================================================
     LOAD STAFF
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadStaff = async () => {
      try {
        const response =
          await axiosClient.get(
            "/staff",
            {
              params: {
                page: 1,
                limit: 100,
              },
            }
          );

        if (!mounted) return;

        setStaffList(
          response?.data?.data
            ?.staff || []
        );
      } catch (err) {
        console.error(
          "Staff loading error:",
          err
        );

        if (mounted) {
          setStaffList([]);
        }
      }
    };

    loadStaff();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     LOAD STAFF BY DATE
  ======================================================= */

  const loadByDate = async () => {
    clearMessages();

    if (!date) {
      onError(
        "Date is required."
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await getStaffAttendanceByDate(
          date
        );

      setRecords(
        response?.data || []
      );
    } catch (err) {
      console.error(err);

      setRecords([]);

      onError(
        getApiError(
          err,
          "Failed to load staff attendance."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     MARK STAFF
  ======================================================= */

  const handleMark = async (event) => {
    event.preventDefault();

    clearMessages();

    if (!canMark) {
      onError(
        "Only admins can mark staff attendance."
      );
      return;
    }

    if (
      !academicYearId ||
      !markForm.staffId ||
      !date ||
      !markForm.status
    ) {
      onError(
        "Academic year, staff, date, and status are required."
      );
      return;
    }

    const payload = {
      academicYearId:
        Number(academicYearId),

      staffId:
        Number(markForm.staffId),

      date,

      status:
        markForm.status,
    };

    if (
      markForm.inTime.trim()
    ) {
      payload.inTime =
        markForm.inTime.trim();
    }

    if (
      markForm.outTime.trim()
    ) {
      payload.outTime =
        markForm.outTime.trim();
    }

    if (
      markForm.remark.trim()
    ) {
      payload.remark =
        markForm.remark.trim();
    }

    if (
      !VALID_ATTENDANCE_STATUSES.has(
        payload.status
      )
    ) {
      onError(
        `Invalid status "${payload.status}".`
      );
      return;
    }

    try {
      setSavingId(
        markForm.staffId
      );

      await markStaffAttendance(
        payload
      );

      onSuccess(
        "Staff attendance marked successfully."
      );

      setMarkForm({
        staffId: "",
        status: "present",
        inTime: "",
        outTime: "",
        remark: "",
      });

      await loadByDate();
    } catch (err) {
      console.error(err);

      onError(
        getApiError(
          err,
          "Failed to mark staff attendance."
        )
      );
    } finally {
      setSavingId(null);
    }
  };

  /* =======================================================
     STAFF HISTORY
  ======================================================= */

  const loadHistory = async () => {
    clearMessages();

    if (!historyStaffId) {
      onError(
        "Select a staff member for history."
      );
      return;
    }

    try {
      setHistoryLoading(true);

      const response =
        await getStaffAttendanceHistory(
          Number(historyStaffId),
          {
            academicYearId:
              academicYearId
                ? Number(
                    academicYearId
                  )
                : undefined,

            fromDate:
              historyFrom ||
              undefined,

            toDate:
              historyTo ||
              undefined,
          }
        );

      setHistory(
        response?.data || null
      );
    } catch (err) {
      console.error(err);

      setHistory(null);

      onError(
        getApiError(
          err,
          "Failed to load staff attendance history."
        )
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const staffOptions =
    staffList.map((staff) => ({
      value: String(
        staff.id
      ),

      label: `${staff.name} (${
        staff.employeeId ||
        "—"
      })`,
    }));

  const dayColumns = [
    {
      header: "Staff",

      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">
            {row.staff?.name ||
              "—"}
          </p>

          <p className="text-xs text-gray-500">
            {row.staff
              ?.employeeId ||
              "—"}
          </p>
        </div>
      ),
    },

    {
      header: "Role",

      render: (row) =>
        row.staff?.role ||
        "—",
    },

    {
      header: "Status",

      render: (row) => (
        <StatusBadge
          status={row.status}
        >
          {statusLabel(
            row.status
          )}
        </StatusBadge>
      ),
    },

    {
      header: "In",

      render: (row) =>
        row.inTime || "—",
    },

    {
      header: "Out",

      render: (row) =>
        row.outTime || "—",
    },

    {
      header: "Remark",

      render: (row) =>
        row.remark || "—",
    },
  ];

  const historyColumns = [
    {
      header: "Date",

      render: (row) =>
        formatIndianDate(
          row.date
        ),
    },

    {
      header: "Status",

      render: (row) => (
        <StatusBadge
          status={row.status}
        >
          {statusLabel(
            row.status
          )}
        </StatusBadge>
      ),
    },

    {
      header: "In",

      render: (row) =>
        row.inTime || "—",
    },

    {
      header: "Out",

      render: (row) =>
        row.outTime || "—",
    },

    {
      header: "Remark",

      render: (row) =>
        row.remark || "—",
    },
  ];

  return (
    <div>

      {/* =================================================
          MARK STAFF
      ================================================= */}

      {canMark && (
        <div className="attendance-section-card">

          <div className="attendance-card-header">

            <h2 className="attendance-card-title">
              Mark Staff Attendance
            </h2>

          </div>

          <div className="attendance-section-body">

            <form
              className="attendance-form"
              onSubmit={handleMark}
            >

              <Select
                id="staff-attendance-academic-year"
                name="staffAttendanceAcademicYear"
                label="Academic Year"
                required
                value={academicYearId}
                onChange={(event) =>
                  setAcademicYearId(
                    event.target.value
                  )
                }
                options={academicYears.map(
                  (item) => ({
                    value: String(
                      item.id
                    ),
                    label:
                      academicYearLabel(
                        item
                      ),
                  })
                )}
              />

              <Select
                id="staff-attendance-staff"
                name="staffAttendanceStaff"
                label="Staff"
                required
                value={
                  markForm.staffId
                }
                onChange={(event) =>
                  setMarkForm(
                    (previous) => ({
                      ...previous,
                      staffId:
                        event.target
                          .value,
                    })
                  )
                }
                options={staffOptions}
              />

              <Input
                id="staff-attendance-date"
                name="staffAttendanceDate"
                label="Date"
                required
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(
                    event.target
                      .value
                  )
                }
              />

              <Select
                id="staff-attendance-status"
                name="staffAttendanceStatus"
                label="Status"
                required
                value={
                  markForm.status
                }
                onChange={(event) =>
                  setMarkForm(
                    (previous) => ({
                      ...previous,
                      status:
                        event.target
                          .value,
                    })
                  )
                }
                options={
                  ATTENDANCE_STATUS_OPTIONS
                }
              />

              <Input
                id="staff-in-time"
                name="staffInTime"
                label="In Time"
                placeholder="09:00"
                value={
                  markForm.inTime
                }
                onChange={(event) =>
                  setMarkForm(
                    (previous) => ({
                      ...previous,
                      inTime:
                        event.target
                          .value,
                    })
                  )
                }
              />

              <Input
                id="staff-out-time"
                name="staffOutTime"
                label="Out Time"
                placeholder="17:00"
                value={
                  markForm.outTime
                }
                onChange={(event) =>
                  setMarkForm(
                    (previous) => ({
                      ...previous,
                      outTime:
                        event.target
                          .value,
                    })
                  )
                }
              />

              <Input
                id="staff-attendance-remark"
                name="staffAttendanceRemark"
                label="Remark"
                placeholder="Optional"
                value={
                  markForm.remark
                }
                onChange={(event) =>
                  setMarkForm(
                    (previous) => ({
                      ...previous,
                      remark:
                        event.target
                          .value,
                    })
                  )
                }
              />

              <div className="attendance-form-action">

                <Button
                  type="submit"
                  variant="primary"
                  disabled={
                    Boolean(
                      savingId
                    )
                  }
                >
                  {savingId
                    ? "Saving..."
                    : "Save Staff Attendance"}
                </Button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =================================================
          STAFF BY DATE
      ================================================= */}

      <div className="attendance-section-card">

        <div className="attendance-card-header">

          <h2 className="attendance-card-title">
            Staff Attendance
          </h2>

          <div className="attendance-card-actions">

            <Input
              id="staff-date-filter"
              name="staffDateFilter"
              label="Date"
              type="date"
              value={date}
              onChange={(event) =>
                setDate(
                  event.target.value
                )
              }
            />

            <Button
              variant="primary"
              onClick={loadByDate}
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : "Load"}
            </Button>

          </div>

        </div>

        <div className="attendance-card-body">

          <DataTable
            columns={dayColumns}
            data={records}
            noDataMessage="No staff attendance records for this date."
          />

        </div>

      </div>

      {/* =================================================
          STAFF HISTORY
      ================================================= */}

      <div className="attendance-section-card">

        <div className="attendance-card-header">

          <h2 className="attendance-card-title">
            Staff History
          </h2>

        </div>

        <div className="attendance-section-body">

          <div className="attendance-form">

            <Select
              id="history-staff"
              name="historyStaff"
              label="Staff"
              required
              value={
                historyStaffId
              }
              onChange={(event) =>
                setHistoryStaffId(
                  event.target
                    .value
                )
              }
              options={
                staffOptions
              }
            />

            <Select
              id="staff-history-academic-year"
              name="staffHistoryAcademicYear"
              label="Academic Year"
              value={academicYearId}
              onChange={(event) =>
                setAcademicYearId(
                  event.target
                    .value
                )
              }
              options={academicYears.map(
                (item) => ({
                  value: String(
                    item.id
                  ),
                  label:
                    academicYearLabel(
                      item
                    ),
                })
              )}
            />

            <Input
              id="staff-history-from"
              name="staffHistoryFrom"
              label="From"
              type="date"
              value={historyFrom}
              onChange={(event) =>
                setHistoryFrom(
                  event.target
                    .value
                )
              }
            />

            <Input
              id="staff-history-to"
              name="staffHistoryTo"
              label="To"
              type="date"
              value={historyTo}
              onChange={(event) =>
                setHistoryTo(
                  event.target
                    .value
                )
              }
            />

            <div className="attendance-form-action">

              <Button
                variant="primary"
                onClick={loadHistory}
                disabled={
                  historyLoading ||
                  !historyStaffId
                }
              >
                {historyLoading
                  ? "Loading..."
                  : "Load History"}
              </Button>

            </div>

          </div>

          {history && (
            <div
              style={{
                marginTop: "22px",
              }}
            >

              <div className="attendance-summary-grid">

                <SummaryStat
                  label="Working Days"
                  value={
                    history.summary
                      ?.totalWorkingDays
                  }
                />

                <SummaryStat
                  label="Present"
                  value={
                    history.summary
                      ?.presentDays
                  }
                />

                <SummaryStat
                  label="Absent"
                  value={
                    history.summary
                      ?.absentDays
                  }
                />

                <SummaryStat
                  label="Percentage"
                  value={
                    history.summary
                      ?.percentage
                  }
                />

              </div>

              <DataTable
                columns={
                  historyColumns
                }
                data={
                  history.records ||
                  []
                }
                noDataMessage="No attendance records."
              />

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   SUMMARY STAT
========================================================= */

function SummaryStat({
  label,
  value,
}) {
  return (
    <div className="attendance-summary-stat">

      <p className="attendance-summary-label">
        {label}
      </p>

      <p className="attendance-summary-value">
        {value ?? "—"}
      </p>

    </div>
  );
}