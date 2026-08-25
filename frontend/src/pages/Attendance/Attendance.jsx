import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Save, Search, RefreshCw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { StatusBadge } from "../../components/ui/Badge";
import { DataTable } from "../../components/tables/DataTable";
import { Tabs } from "../../components/ui/Tabs";

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

/* =====================================================
   HELPERS
===================================================== */

function getApiError(err, fallback) {
  return (
    err.response?.data?.error ||
    err.response?.data?.message ||
    err.message ||
    fallback
  );
}

/** Local calendar date as YYYY-MM-DD (avoids UTC shift from toISOString). */
function todayDateOnly() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toDateOnly(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatIndianDate(date) {
  const dateOnly = toDateOnly(date);
  if (!dateOnly) return "—";
  const dateObj = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(dateObj.getTime())) return "—";
  return dateObj.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(status) {
  return (
    ATTENDANCE_STATUS_OPTIONS.find((o) => o.value === status)?.label ||
    status ||
    "—"
  );
}

function academicYearLabel(year) {
  if (!year) return "";
  if (year.name) return year.name;
  return `${new Date(year.startDate).getFullYear()}-${new Date(year.endDate).getFullYear()}`;
}

/**
 * Login stores nested staff: { id, role }.
 * JWT has staffRole/staffId — localStorage user may only have nested staff.
 */
function getStaffRole(user) {
  return user?.staffRole || user?.staff?.role || null;
}

/** Matches authorize() on GET class/monthly routes */
function canViewClassAttendance(user) {
  const identity = user?.identity;
  if (["admin", "management", "principal"].includes(identity)) return true;
  return identity === "staff" && getStaffRole(user) === "teacher";
}

/**
 * Matches attendance.service assertCanMarkClassAttendance:
 * only admin identity OR staff teacher (route also lists management/principal,
 * but service rejects them).
 */
function canMarkStudentAttendance(user) {
  if (user?.identity === "admin") return true;
  return user?.identity === "staff" && getStaffRole(user) === "teacher";
}

/** Matches attendance.service markStaffAttendance: admin only */
function canMarkStaffAttendance(user) {
  return user?.identity === "admin";
}

/** Matches authorize() on staff by-date / mark routes */
function canViewStaffAttendance(user) {
  return ["admin", "management", "principal"].includes(user?.identity);
}

/** Same rules as backend attendance.service isSecondSaturday */
function isSecondSaturday(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime()) || d.getDay() !== 6) return false;
  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
  const firstSaturday = new Date(firstDay);
  while (firstSaturday.getDay() !== 6) {
    firstSaturday.setDate(firstSaturday.getDate() + 1);
  }
  const secondSaturday = new Date(firstSaturday);
  secondSaturday.setDate(firstSaturday.getDate() + 7);
  return d.getDate() === secondSaturday.getDate();
}

/** Client-side checks mirroring backend markClassAttendance date rules */
function getMarkDateValidationError(dateStr) {
  if (!dateStr) return "Date is required.";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "Invalid date.";
  if (d.getDay() === 0) return "Cannot mark attendance on Sunday";
  if (isSecondSaturday(dateStr)) {
    return "Cannot mark attendance on 2nd Saturday (half day holiday)";
  }
  return null;
}

const VALID_ATTENDANCE_STATUSES = new Set(
  ATTENDANCE_STATUS_OPTIONS.map((o) => o.value)
);

async function fetchAllStudentsForClass(classId) {
  const all = [];
  let page = 1;
  let totalPages = 1;

  do {
    const res = await getStudents({ page, limit: 100, classId });
    const chunk = res?.data?.students || [];
    all.push(...chunk);
    totalPages = res?.data?.pagination?.totalPages || 1;
    page += 1;
  } while (page <= totalPages);

  return all;
}

/* =====================================================
   PAGE
===================================================== */

export default function Attendance() {
  const { user } = useAuth() || {};

  const canMarkStudent = canMarkStudentAttendance(user);
  const canViewClass = canViewClassAttendance(user);
  const canMarkStaff = canMarkStaffAttendance(user);
  const canViewStaff = canViewStaffAttendance(user);

  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [metaLoading, setMetaLoading] = useState(true);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        setMetaLoading(true);
        const [yearsRes, classesRes] = await Promise.all([
          getAcademicYears(),
          getClasses(),
        ]);
        const years = yearsRes?.data || [];
        setAcademicYears(years);
        setClasses(classesRes?.data || []);
      } catch (err) {
        console.error(err);
        setError(getApiError(err, "Failed to load academic years or classes."));
      } finally {
        setMetaLoading(false);
      }
    };
    loadMeta();
  }, []);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const tabs = [
    {
      label: "Student Attendance",
      content: (
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
      ),
    },
    {
      label: "Monthly Summary",
      content: (
        <MonthlySummaryTab
          academicYears={academicYears}
          classes={classes}
          canView={canViewClass}
          metaLoading={metaLoading}
          onError={setError}
          clearMessages={clearMessages}
        />
      ),
    },
    {
      label: "Student History",
      content: (
        <StudentHistoryTab
          academicYears={academicYears}
          onError={setError}
          clearMessages={clearMessages}
        />
      ),
    },
  ];

  if (canViewStaff) {
    tabs.push({
      label: "Staff Attendance",
      content: (
        <StaffAttendanceTab
          academicYears={academicYears}
          canMark={canMarkStaff}
          onError={setError}
          onSuccess={setSuccess}
          clearMessages={clearMessages}
        />
      ),
    });
  }

  return (
    <div className="attendance-page space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-1">
            Mark and review student and staff attendance using class, section, and date filters.
          </p>
        </div>
      </div>

      {error && (
        <div className="attendance-alert attendance-alert--error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="attendance-alert attendance-alert--success" role="status">
          {success}
        </div>
      )}

      <Tabs
        tabs={tabs}
        defaultTab={activeTab}
        onChange={(index) => {
          clearMessages();
          setActiveTab(index);
        }}
      />
    </div>
  );
}

/* =====================================================
   STUDENT ATTENDANCE TAB
===================================================== */

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
  const [academicYearId, setAcademicYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(todayDateOnly());
  const [sections, setSections] = useState([]);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!academicYearId && academicYears.length > 0) {
      const active = academicYears.find((y) => y.isActive);
      setAcademicYearId(String(active?.id || academicYears[0].id));
    }
  }, [academicYears, academicYearId]);

  useEffect(() => {
    if (!classId) {
      setSections([]);
      setSectionId("");
      return;
    }

    const loadSections = async () => {
      try {
        const res = await getSectionsByClass(classId);
        setSections(res?.data || []);
        setSectionId("");
      } catch (err) {
        console.error(err);
        setSections([]);
        onError(getApiError(err, "Failed to load sections."));
      }
    };

    loadSections();
  }, [classId, onError]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.studentName, row.admissionNo, String(row.rollNo ?? "")]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rows, search]);

  const loadRoster = useCallback(async () => {
    clearMessages();

    if (!canView) {
      onError(
        "You do not have permission to view class attendance. Allowed: admin, management, principal, or teacher."
      );
      return;
    }

    if (!academicYearId || !classId || !date) {
      onError("Academic year, class, and date are required.");
      return;
    }

    try {
      setLoading(true);
      setLoaded(false);

      const [students, attendanceRes] = await Promise.all([
        fetchAllStudentsForClass(classId),
        getClassAttendanceByDate({
          classId: Number(classId),
          sectionId: sectionId ? Number(sectionId) : undefined,
          date,
        }),
      ]);

      const filteredStudents = sectionId
        ? students.filter((s) => String(s.sectionId) === String(sectionId))
        : students;

      const existing = Array.isArray(attendanceRes?.data)
        ? attendanceRes.data
        : [];
      const byStudentId = {};
      existing.forEach((rec) => {
        byStudentId[rec.studentId] = rec;
      });

      const nextRows = filteredStudents
        .slice()
        .sort((a, b) => (a.rollNo ?? 0) - (b.rollNo ?? 0))
        .map((student) => {
          const existingRec = byStudentId[student.id];
          const status = existingRec?.status;
          return {
            studentId: student.id,
            studentName: student.studentName,
            admissionNo: student.admissionNo,
            rollNo: student.rollNo,
            status: VALID_ATTENDANCE_STATUSES.has(status) ? status : "present",
            remark: existingRec?.remark || "",
            markedBy: existingRec?.markedBy?.name || "",
            hasExisting: Boolean(existingRec),
          };
        });

      setRows(nextRows);
      setLoaded(true);

      if (nextRows.length === 0) {
        onError("No students found for the selected class/section.");
      }
    } catch (err) {
      console.error(err);
      setRows([]);
      setLoaded(false);
      onError(getApiError(err, "Failed to load attendance roster."));
    } finally {
      setLoading(false);
    }
  }, [
    academicYearId,
    classId,
    sectionId,
    date,
    canView,
    clearMessages,
    onError,
  ]);

  const updateRow = (studentId, field, value) => {
    setRows((prev) =>
      prev.map((row) =>
        row.studentId === studentId ? { ...row, [field]: value } : row
      )
    );
  };

  const markAll = (status) => {
    setRows((prev) => prev.map((row) => ({ ...row, status })));
  };

  const handleSave = async () => {
    clearMessages();

    if (!canMark) {
      onError(
        "Only teachers or admins can mark class attendance."
      );
      return;
    }

    if (!academicYearId || !classId || !date) {
      onError("Academic year, class, and date are required.");
      return;
    }

    const dateError = getMarkDateValidationError(date);
    if (dateError) {
      onError(dateError);
      return;
    }

    if (rows.length === 0) {
      onError("Load students before saving attendance.");
      return;
    }

    const invalidStatus = rows.find(
      (row) => !VALID_ATTENDANCE_STATUSES.has(row.status)
    );
    if (invalidStatus) {
      onError(
        `Invalid attendance status "${invalidStatus.status}". Allowed: ${[
          ...VALID_ATTENDANCE_STATUSES,
        ].join(", ")}`
      );
      return;
    }

    // Exact body shape expected by attendance.service.markClassAttendance
    const payload = {
      academicYearId: Number(academicYearId),
      classId: Number(classId),
      date,
      records: rows.map((row) => {
        const record = {
          studentId: Number(row.studentId),
          status: row.status,
        };
        if (row.remark?.trim()) {
          record.remark = row.remark.trim();
        }
        return record;
      }),
    };

    if (sectionId) {
      payload.sectionId = Number(sectionId);
    }

    try {
      setSaving(true);
      const res = await markClassAttendance(payload);
      onSuccess(
        res?.message ||
          res?.data?.message ||
          `Attendance marked for ${res?.data?.count ?? rows.length} students.`
      );
      await loadRoster();
    } catch (err) {
      console.error(err);
      onError(getApiError(err, "Failed to save attendance."));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      header: "Roll No",
      render: (row) => row.rollNo ?? "—",
    },
    {
      header: "Student",
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.studentName}</p>
          <p className="text-xs text-gray-500">{row.admissionNo}</p>
        </div>
      ),
    },
    {
      header: "Status",
      render: (row) =>
        canMark ? (
          <select
            className="attendance-inline-select"
            value={row.status}
            onChange={(e) => updateRow(row.studentId, "status", e.target.value)}
          >
            {ATTENDANCE_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <StatusBadge status={row.status}>{statusLabel(row.status)}</StatusBadge>
        ),
    },
    {
      header: "Remark",
      render: (row) =>
        canMark ? (
          <input
            className="attendance-inline-input"
            value={row.remark}
            placeholder="Optional"
            onChange={(e) => updateRow(row.studentId, "remark", e.target.value)}
          />
        ) : (
          row.remark || "—"
        ),
    },
    {
      header: "Marked By",
      render: (row) => row.markedBy || (row.hasExisting ? "—" : "Not marked"),
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Select
            label="Academic Year"
            required
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
            disabled={metaLoading}
            options={academicYears.map((year) => ({
              value: String(year.id),
              label: academicYearLabel(year),
            }))}
          />
          <Select
            label="Class"
            required
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            disabled={metaLoading}
            options={classes.map((c) => ({
              value: String(c.id),
              label: c.name,
            }))}
          />
          <Select
            label="Section"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            disabled={!classId}
            options={sections.map((s) => ({
              value: String(s.id),
              label: s.name,
            }))}
          />
          <Input
            label="Date"
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="flex items-end gap-2">
            <Button
              variant="primary"
              onClick={loadRoster}
              disabled={loading || !classId || !date}
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Loading..." : "Load"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between w-full">
            <CardTitle>
              Class Roster {loaded ? `(${filteredRows.length})` : ""}
            </CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="attendance-search-icon" />
                <Input
                  placeholder="Search students..."
                  className="pl-9 min-w-[220px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {canMark && loaded && (
                <>
                  <Button variant="outline" size="sm" onClick={() => markAll("present")}>
                    All Present
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => markAll("absent")}>
                    All Absent
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving || rows.length === 0}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Attendance"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500 py-8 text-center">Loading students...</p>
          ) : (
            <DataTable
              columns={columns}
              data={filteredRows}
              noDataMessage={
                loaded
                  ? "No students found for this class/section."
                  : "Select filters and click Load to view the roster."
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* =====================================================
   MONTHLY SUMMARY TAB
===================================================== */

function MonthlySummaryTab({
  academicYears,
  classes,
  canView,
  metaLoading,
  onError,
  clearMessages,
}) {
  const now = new Date();
  const [academicYearId, setAcademicYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [sections, setSections] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!academicYearId && academicYears.length > 0) {
      const active = academicYears.find((y) => y.isActive);
      setAcademicYearId(String(active?.id || academicYears[0].id));
    }
  }, [academicYears, academicYearId]);

  useEffect(() => {
    if (!classId) {
      setSections([]);
      setSectionId("");
      return;
    }
    getSectionsByClass(classId)
      .then((res) => {
        setSections(res?.data || []);
        setSectionId("");
      })
      .catch((err) => {
        setSections([]);
        onError(getApiError(err, "Failed to load sections."));
      });
  }, [classId, onError]);

  const loadSummary = async () => {
    clearMessages();

    if (!canView) {
      onError(
        "You do not have permission to view monthly attendance summary."
      );
      return;
    }

    if (!classId || !month || !year) {
      onError("Class, month, and year are required.");
      return;
    }

    try {
      setLoading(true);
      const res = await getClassMonthlyAttendanceSummary({
        classId: Number(classId),
        sectionId: sectionId ? Number(sectionId) : undefined,
        month: Number(month),
        year: Number(year),
        academicYearId: academicYearId ? Number(academicYearId) : undefined,
      });
      setSummary(res?.data || null);
    } catch (err) {
      console.error(err);
      setSummary(null);
      onError(getApiError(err, "Failed to load monthly summary."));
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: "Roll No", render: (row) => row.rollNo ?? "—" },
    { header: "Student", accessor: "studentName" },
    { header: "Admission No", accessor: "admissionNo" },
    { header: "Working Days", accessor: "totalWorkingDays" },
    { header: "Present", accessor: "presentDays" },
    { header: "Absent", accessor: "absentDays" },
    { header: "Percentage", accessor: "percentage" },
  ];

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(2000, i, 1).toLocaleString("en", { month: "long" }),
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Select
            label="Academic Year"
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
            disabled={metaLoading}
            options={academicYears.map((y) => ({
              value: String(y.id),
              label: academicYearLabel(y),
            }))}
          />
          <Select
            label="Class"
            required
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            options={classes.map((c) => ({
              value: String(c.id),
              label: c.name,
            }))}
          />
          <Select
            label="Section"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            disabled={!classId}
            options={sections.map((s) => ({
              value: String(s.id),
              label: s.name,
            }))}
          />
          <Select
            label="Month"
            required
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            options={monthOptions}
          />
          <Input
            label="Year"
            required
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
          <div className="flex items-end">
            <Button
              variant="primary"
              className="w-full"
              onClick={loadSummary}
              disabled={loading || !classId}
            >
              {loading ? "Loading..." : "Load Summary"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>
              Summary — {monthOptions.find((m) => m.value === String(summary.month))?.label}{" "}
              {summary.year} ({summary.totalWorkingDays} working days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={summary.students || []}
              noDataMessage="No students in this class/section."
            />
          </CardContent>
        </Card>
      )}

      {!summary && !loading && (
        <p className="text-sm text-gray-500 text-center py-6">
          Select a class and month, then load the summary.
        </p>
      )}
    </div>
  );
}

/* =====================================================
   STUDENT HISTORY TAB
===================================================== */

function StudentHistoryTab({ academicYears, onError, clearMessages }) {
  const [academicYearId, setAcademicYearId] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [studentOptions, setStudentOptions] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!academicYearId && academicYears.length > 0) {
      const active = academicYears.find((y) => y.isActive);
      setAcademicYearId(String(active?.id || academicYears[0].id));
    }
  }, [academicYears, academicYearId]);

  const searchStudents = async () => {
    clearMessages();
    try {
      setSearching(true);
      const res = await getStudents({
        page: 1,
        limit: 20,
        search: studentQuery.trim(),
      });
      const list = res?.data?.students || [];
      setStudentOptions(list);
      if (list.length === 1) {
        setStudentId(String(list[0].id));
      }
      if (list.length === 0) {
        onError("No students matched your search.");
      }
    } catch (err) {
      console.error(err);
      setStudentOptions([]);
      onError(getApiError(err, "Failed to search students."));
    } finally {
      setSearching(false);
    }
  };

  const loadHistory = async () => {
    clearMessages();
    if (!studentId) {
      onError("Select a student first.");
      return;
    }

    try {
      setLoading(true);
      const res = await getStudentAttendanceHistory(Number(studentId), {
        academicYearId: academicYearId ? Number(academicYearId) : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setHistory(res?.data || null);
    } catch (err) {
      console.error(err);
      setHistory(null);
      onError(getApiError(err, "Failed to load student attendance history."));
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: "Date",
      render: (row) => formatIndianDate(row.date),
    },
    {
      header: "Status",
      render: (row) => (
        <StatusBadge status={row.status}>{statusLabel(row.status)}</StatusBadge>
      ),
    },
    { header: "Remark", render: (row) => row.remark || "—" },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Student Lookup</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2 flex gap-2 items-end">
            <div className="flex-1">
              <Input
                label="Search Student"
                placeholder="Name or admission no..."
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    searchStudents();
                  }
                }}
              />
            </div>
            <Button variant="outline" onClick={searchStudents} disabled={searching}>
              {searching ? "Searching..." : "Search"}
            </Button>
          </div>
          <Select
            label="Student"
            required
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            options={studentOptions.map((s) => ({
              value: String(s.id),
              label: `${s.studentName} (${s.admissionNo})`,
            }))}
          />
          <Select
            label="Academic Year"
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
            options={academicYears.map((y) => ({
              value: String(y.id),
              label: academicYearLabel(y),
            }))}
          />
          <Input
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <Input
            label="To Date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <div className="flex items-end">
            <Button
              variant="primary"
              className="w-full"
              onClick={loadHistory}
              disabled={loading || !studentId}
            >
              {loading ? "Loading..." : "Load History"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {history && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                {history.student?.name} — {history.student?.admissionNo}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <SummaryStat label="Working Days" value={history.summary?.totalWorkingDays} />
              <SummaryStat label="Present" value={history.summary?.presentDays} />
              <SummaryStat label="Absent" value={history.summary?.absentDays} />
              <SummaryStat label="Unmarked" value={history.summary?.unmarkedDays} />
              <SummaryStat label="Percentage" value={history.summary?.percentage} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Records</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={history.records || []}
                noDataMessage="No attendance records in this date range."
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

/* =====================================================
   STAFF ATTENDANCE TAB
===================================================== */

function StaffAttendanceTab({
  academicYears,
  canMark,
  onError,
  onSuccess,
  clearMessages,
}) {
  const [academicYearId, setAcademicYearId] = useState("");
  const [date, setDate] = useState(todayDateOnly());
  const [staffList, setStaffList] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const [markForm, setMarkForm] = useState({
    staffId: "",
    status: "present",
    inTime: "",
    outTime: "",
    remark: "",
  });

  const [historyStaffId, setHistoryStaffId] = useState("");
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!academicYearId && academicYears.length > 0) {
      const active = academicYears.find((y) => y.isActive);
      setAcademicYearId(String(active?.id || academicYears[0].id));
    }
  }, [academicYears, academicYearId]);

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const res = await axiosClient.get("/staff", {
          params: { page: 1, limit: 100 },
        });
        setStaffList(res.data?.data?.staff || []);
      } catch (err) {
        console.error(err);
        setStaffList([]);
      }
    };
    loadStaff();
  }, []);

  const loadByDate = async () => {
    clearMessages();
    if (!date) {
      onError("Date is required.");
      return;
    }

    try {
      setLoading(true);
      const res = await getStaffAttendanceByDate(date);
      setRecords(res?.data || []);
    } catch (err) {
      console.error(err);
      setRecords([]);
      onError(getApiError(err, "Failed to load staff attendance."));
    } finally {
      setLoading(false);
    }
  };

  const handleMark = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!canMark) {
      onError("Only admins can mark staff attendance.");
      return;
    }

    if (!academicYearId || !markForm.staffId || !date || !markForm.status) {
      onError("Academic year, staff, date, and status are required.");
      return;
    }

    const payload = {
      academicYearId: Number(academicYearId),
      staffId: Number(markForm.staffId),
      date,
      status: markForm.status,
    };

    if (markForm.inTime.trim()) payload.inTime = markForm.inTime.trim();
    if (markForm.outTime.trim()) payload.outTime = markForm.outTime.trim();
    if (markForm.remark.trim()) payload.remark = markForm.remark.trim();

    if (!VALID_ATTENDANCE_STATUSES.has(payload.status)) {
      onError(
        `Invalid status. Allowed: ${[...VALID_ATTENDANCE_STATUSES].join(", ")}`
      );
      return;
    }

    try {
      setSavingId(markForm.staffId);
      await markStaffAttendance(payload);
      onSuccess("Staff attendance marked successfully.");
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
      onError(getApiError(err, "Failed to mark staff attendance."));
    } finally {
      setSavingId(null);
    }
  };

  const loadHistory = async () => {
    clearMessages();
    if (!historyStaffId) {
      onError("Select a staff member for history.");
      return;
    }

    try {
      setHistoryLoading(true);
      const res = await getStaffAttendanceHistory(Number(historyStaffId), {
        academicYearId: academicYearId ? Number(academicYearId) : undefined,
        fromDate: historyFrom || undefined,
        toDate: historyTo || undefined,
      });
      setHistory(res?.data || null);
    } catch (err) {
      console.error(err);
      setHistory(null);
      onError(getApiError(err, "Failed to load staff attendance history."));
    } finally {
      setHistoryLoading(false);
    }
  };

  const dayColumns = [
    {
      header: "Staff",
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.staff?.name}</p>
          <p className="text-xs text-gray-500">{row.staff?.employeeId}</p>
        </div>
      ),
    },
    {
      header: "Role",
      render: (row) => row.staff?.role || "—",
    },
    {
      header: "Status",
      render: (row) => (
        <StatusBadge status={row.status}>{statusLabel(row.status)}</StatusBadge>
      ),
    },
    { header: "In", render: (row) => row.inTime || "—" },
    { header: "Out", render: (row) => row.outTime || "—" },
    { header: "Remark", render: (row) => row.remark || "—" },
  ];

  const historyColumns = [
    { header: "Date", render: (row) => formatIndianDate(row.date) },
    {
      header: "Status",
      render: (row) => (
        <StatusBadge status={row.status}>{statusLabel(row.status)}</StatusBadge>
      ),
    },
    { header: "In", render: (row) => row.inTime || "—" },
    { header: "Out", render: (row) => row.outTime || "—" },
    { header: "Remark", render: (row) => row.remark || "—" },
  ];

  const staffOptions = staffList.map((s) => ({
    value: String(s.id),
    label: `${s.name} (${s.employeeId})`,
  }));

  return (
    <div className="space-y-4">
      {canMark && (
        <Card>
          <CardHeader>
            <CardTitle>Mark Staff Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" onSubmit={handleMark}>
              <Select
                label="Academic Year"
                required
                value={academicYearId}
                onChange={(e) => setAcademicYearId(e.target.value)}
                options={academicYears.map((y) => ({
                  value: String(y.id),
                  label: academicYearLabel(y),
                }))}
              />
              <Select
                label="Staff"
                required
                value={markForm.staffId}
                onChange={(e) =>
                  setMarkForm((prev) => ({ ...prev, staffId: e.target.value }))
                }
                options={staffOptions}
              />
              <Input
                label="Date"
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <Select
                label="Status"
                required
                value={markForm.status}
                onChange={(e) =>
                  setMarkForm((prev) => ({ ...prev, status: e.target.value }))
                }
                options={ATTENDANCE_STATUS_OPTIONS}
              />
              <Input
                label="In Time"
                placeholder="09:00"
                value={markForm.inTime}
                onChange={(e) =>
                  setMarkForm((prev) => ({ ...prev, inTime: e.target.value }))
                }
              />
              <Input
                label="Out Time"
                placeholder="17:00"
                value={markForm.outTime}
                onChange={(e) =>
                  setMarkForm((prev) => ({ ...prev, outTime: e.target.value }))
                }
              />
              <Input
                label="Remark"
                value={markForm.remark}
                onChange={(e) =>
                  setMarkForm((prev) => ({ ...prev, remark: e.target.value }))
                }
                placeholder="Optional"
              />
              <div className="flex items-end">
                <Button type="submit" variant="primary" disabled={Boolean(savingId)}>
                  {savingId ? "Saving..." : "Save Staff Attendance"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between w-full">
            <CardTitle>Staff Attendance by Date</CardTitle>
            <div className="flex gap-2 items-end">
              <Input
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <Button variant="primary" onClick={loadByDate} disabled={loading}>
                {loading ? "Loading..." : "Load"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={dayColumns}
            data={records}
            noDataMessage="No staff attendance records for this date."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Staff History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Select
              label="Staff"
              required
              value={historyStaffId}
              onChange={(e) => setHistoryStaffId(e.target.value)}
              options={staffOptions}
            />
            <Select
              label="Academic Year"
              value={academicYearId}
              onChange={(e) => setAcademicYearId(e.target.value)}
              options={academicYears.map((y) => ({
                value: String(y.id),
                label: academicYearLabel(y),
              }))}
            />
            <Input
              label="From"
              type="date"
              value={historyFrom}
              onChange={(e) => setHistoryFrom(e.target.value)}
            />
            <Input
              label="To"
              type="date"
              value={historyTo}
              onChange={(e) => setHistoryTo(e.target.value)}
            />
            <div className="flex items-end">
              <Button
                variant="primary"
                className="w-full"
                onClick={loadHistory}
                disabled={historyLoading || !historyStaffId}
              >
                {historyLoading ? "Loading..." : "Load History"}
              </Button>
            </div>
          </div>

          {history && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryStat label="Working Days" value={history.summary?.totalWorkingDays} />
                <SummaryStat label="Present" value={history.summary?.presentDays} />
                <SummaryStat label="Absent" value={history.summary?.absentDays} />
                <SummaryStat label="Percentage" value={history.summary?.percentage} />
              </div>
              <DataTable
                columns={historyColumns}
                data={history.records || []}
                noDataMessage="No attendance records."
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryStat({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-gray-900">{value ?? "—"}</p>
    </div>
  );
}
