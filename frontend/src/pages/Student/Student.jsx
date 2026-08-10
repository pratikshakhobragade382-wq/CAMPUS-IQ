import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { StatusBadge } from "../../components/ui/Badge";
import { DataTable } from "../../components/tables/DataTable";
import { Pagination } from "../../components/ui/Pagination";

import { getStudents, deleteStudent } from "../../api/student.api";
import { getClasses } from "../../api/class.api";
import { getInitials, stringToColor } from "../../utils/helpers";

import "./Student.css";

function getPrimaryParent(student) {
  const parents = student?.parents || [];
  return (
    parents.find((p) => p.relation === "father") ||
    parents.find((p) => p.relation === "mother") ||
    parents.find((p) => p.relation === "guardian") ||
    null
  );
}

export default function Student() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [gender, setGender] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    getClasses()
      .then((res) => {
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
        setClasses(list);
      })
      .catch(() => setClasses([]));
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getStudents({
        page,
        limit,
        search: debouncedSearch,
        classId: classId || undefined,
        gender: gender || undefined,
      });

      const payload = response?.data || {};
      setStudents(payload.students || []);
      setPagination(
        payload.pagination || {
          total: 0,
          page,
          limit,
          totalPages: 0,
        }
      );
    } catch (err) {
      setStudents([]);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to load students."
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, classId, gender]);

  useEffect(() => {
    // Standard list fetch when filters/pagination change
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async API load
    fetchStudents();
  }, [fetchStudents]);

  const handleDelete = async (row) => {
    const confirmed = window.confirm(
      `Deactivate student "${row.studentName}"? This performs a soft delete.`
    );
    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");
      const response = await deleteStudent(row.id);
      setSuccess(
        response?.message ||
          `Student "${row.studentName}" deactivated successfully.`
      );
      await fetchStudents();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to delete student."
      );
    }
  };

  const columns = [
    {
      header: "Student",
      render: (row) => (
        <div className="student-cell">
          {row.photoUrl ? (
            <img
              src={row.photoUrl}
              alt={row.studentName}
              className="student-avatar"
            />
          ) : (
            <span
              className="student-avatar-fallback"
              style={{ background: stringToColor(row.studentName) }}
            >
              {getInitials(row.studentName)}
            </span>
          )}
          <div>
            <p className="student-cell-name">{row.studentName}</p>
            <p className="student-cell-sub">{row.admissionNo}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Class",
      render: (row) => row.class?.name || "—",
    },
    {
      header: "Section",
      render: (row) => row.section?.name || "—",
    },
    {
      header: "Parent Name",
      render: (row) => {
        const parent = getPrimaryParent(row);
        return parent?.name || row.fatherName || row.motherName || "—";
      },
    },
    {
      header: "Phone",
      render: (row) => {
        const parent = getPrimaryParent(row);
        return (
          parent?.mobile ||
          row.communicationMobile ||
          row.emergencyPhoneNo ||
          "—"
        );
      },
    },
    {
      header: "Status",
      render: () => <StatusBadge status="active">Active</StatusBadge>,
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="student-row-actions">
          <button
            type="button"
            className="student-action-btn view"
            onClick={() => navigate(`/student/${row.id}`)}
            title="View"
          >
            <Eye size={15} />
            View
          </button>
          <button
            type="button"
            className="student-action-btn edit"
            onClick={() => navigate(`/student/${row.id}/edit`)}
            title="Edit"
          >
            <Pencil size={15} />
            Edit
          </button>
          <button
            type="button"
            className="student-action-btn delete"
            onClick={() => handleDelete(row)}
            title="Delete"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="student-page">
      <div className="student-header">
        <div className="student-title-section">
          <h1>Student</h1>
          <p>View and manage student enrolments, classes, and status.</p>
        </div>

        <div className="student-actions">
          <div className="student-search">
            <Search className="student-search-icon" />
            <Input
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="student-filter">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="student-filter">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={gender}
              onChange={(e) => {
                setGender(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <Button
            variant="primary"
            size="md"
            className="student-add-btn"
            onClick={() => navigate("/student/new")}
          >
            <Plus size={17} />
            Add Student
          </Button>
        </div>
      </div>

      {error && <div className="student-alert error">{error}</div>}
      {success && <div className="student-alert success">{success}</div>}

      <div className="student-table-card">
        <div className="student-table-header">
          <h2>Student List</h2>
          <span className="student-table-meta">
            {pagination.total} student{pagination.total === 1 ? "" : "s"}
          </span>
        </div>

        <div className="student-table-body">
          {loading ? (
            <div className="student-loading">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="student-empty">
              No students found. Try adjusting search or add a new student.
            </div>
          ) : (
            <DataTable columns={columns} data={students} />
          )}
        </div>

        {!loading && pagination.total > 0 && (
          <div className="student-pagination-wrap">
            <Pagination
              currentPage={pagination.page || page}
              totalPages={Math.max(pagination.totalPages || 1, 1)}
              pageSize={limit}
              totalItems={pagination.total}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setLimit(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
