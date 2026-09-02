import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
} from "lucide-react";

import axiosClient from "../../api/axios";
import "./staff.css";

const ROLES = [
  "teacher",
  "accountant",
  "librarian",
  "clerk",
  "receptionist",
  "nurse",
  "counselor",
  "coordinator",
  "lab_assistant",
  "peon",
  "driver",
  "security",
  "other",
];

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    fallback
  );
}

function getStaffSubjects(staffMember) {
  if (!staffMember) return [];

  if (!Array.isArray(staffMember.subjects)) {
    return [];
  }

  return staffMember.subjects
    .map((item) => item?.subject || item)
    .filter(
      (subject) =>
        subject &&
        (subject.id ||
          subject.name ||
          subject.code)
    );
}

export default function StaffList() {
  const [staff, setStaff] = useState([]);
  const [pagination, setPagination] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);

  /* =========================================================
     LOAD STAFF
  ========================================================= */

  const loadStaff = async (
    requestedPage = page
  ) => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page: requestedPage,
        limit: 10,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (role) {
        params.role = role;
      }

      const response = await axiosClient.get(
        "/staff",
        { params }
      );

      const data =
        response?.data?.data || {};

      setStaff(data.staff || []);
      setPagination(data.pagination || {});

    } catch (err) {
      console.error(
        "Failed to load staff:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Failed to load staff."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff(page);
  }, [page, role]);

  /* =========================================================
     SEARCH
  ========================================================= */

  const submitSearch = (event) => {
    event.preventDefault();

    setPage(1);
    loadStaff(1);
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const removeStaff = async (
    id,
    name
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${name}?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await axiosClient.delete(
        `/staff/${id}`
      );

      await loadStaff(page);

    } catch (err) {
      console.error(
        "Failed to delete staff:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Failed to delete staff."
        )
      );
    }
  };

  /* =========================================================
     STATISTICS
  ========================================================= */

  const totals = useMemo(() => {
    const total =
      pagination.total ??
      pagination.totalItems ??
      staff.length;

    const teachers = staff.filter(
      (item) =>
        item.role === "teacher"
    ).length;

    const other = staff.filter(
      (item) =>
        item.role !== "teacher"
    ).length;

    return {
      total,
      teachers,
      other,
    };
  }, [staff, pagination]);

  /* =========================================================
     ROLE
  ========================================================= */

  const formatRole = (value) => {
    if (!value) return "—";

    return String(value)
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (char) =>
          char.toUpperCase()
      );
  };

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages =
    pagination.totalPages || 1;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="staff-page">

      {/* HEADER */}
      <div className="staff-header">

        <div className="staff-title-section">
          <h1>Staff Management</h1>

          <p>
            Manage teachers, school staff and their subjects.
          </p>
        </div>

        <div className="staff-actions">

          {/* SEARCH */}
          <form
            className="staff-search"
            onSubmit={submitSearch}
          >
            <Search
              className="staff-search-icon"
              size={18}
            />

            <input
              type="text"
              placeholder="Search staff..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </form>

          {/* ROLE */}
          <select
            className="staff-role-filter"
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPage(1);
            }}
          >
            <option value="">
              All roles
            </option>

            {ROLES.map((item) => (
              <option
                key={item}
                value={item}
              >
                {formatRole(item)}
              </option>
            ))}
          </select>

          {/* SEARCH BUTTON */}
          <button
            type="button"
            className="staff-search-btn"
            onClick={() => {
              setPage(1);
              loadStaff(1);
            }}
          >
            Search
          </button>

          {/* ADD */}
          <Link
            to="/staff/new"
            className="staff-add-btn"
          >
            <Plus size={17} />
            Add Staff
          </Link>

        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="staff-alert">
          {error}
        </div>
      )}

      {/* STATS */}
      <div className="staff-stats">

        <div className="staff-stat-card">
          <p className="staff-stat-label">
            Total Staff
          </p>

          <p className="staff-stat-value">
            {loading
              ? "..."
              : totals.total}
          </p>
        </div>

        <div className="staff-stat-card">
          <p className="staff-stat-label">
            Teachers
          </p>

          <p className="staff-stat-value">
            {loading
              ? "..."
              : totals.teachers}
          </p>
        </div>

        <div className="staff-stat-card">
          <p className="staff-stat-label">
            Other Staff
          </p>

          <p className="staff-stat-value">
            {loading
              ? "..."
              : totals.other}
          </p>
        </div>

      </div>

      {/* TABLE */}
      <div className="staff-table-card">

        <div className="staff-table-header">
          <h2>Staff List</h2>
        </div>

        <div className="staff-table-body">

          {loading ? (
            <div className="staff-loading">
              Loading staff...
            </div>
          ) : staff.length === 0 ? (
            <div className="staff-empty">
              No staff found.
            </div>
          ) : (
            <div className="staff-table-wrapper">

              <table className="staff-table">

                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Subjects</th>
                    <th>Phone</th>
                    <th>Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {staff.map((item) => {

                    const itemSubjects =
                      getStaffSubjects(item);

                    return (
                      <tr key={item.id}>

                        <td>
                          <span className="staff-name">
                            {item.employeeId}
                          </span>
                        </td>

                        <td>
                          <span className="staff-person-name">
                            {item.name}
                          </span>
                        </td>

                        <td>
                          {item.email || "—"}
                        </td>

                        <td>
                          <span className="staff-role-badge">
                            {formatRole(item.role)}
                          </span>
                        </td>

                        <td>
                          {item.department?.name ||
                            "—"}
                        </td>

                        {/* SUBJECTS */}
                        <td>
                          {itemSubjects.length === 0 ? (
                            <span className="staff-subject-empty">
                              —
                            </span>
                          ) : (
                            <div className="staff-subject-list">

                              {itemSubjects.map(
                                (subject) => (
                                  <span
                                    className="staff-subject-badge"
                                    key={
                                      subject.id ||
                                      `${subject.name}-${subject.code}`
                                    }
                                  >
                                    <span className="staff-subject-badge-name">
                                      {subject.name}
                                    </span>

                                    {subject.code && (
                                      <span className="staff-subject-badge-code">
                                        {subject.code}
                                      </span>
                                    )}
                                  </span>
                                )
                              )}

                            </div>
                          )}
                        </td>

                        <td>
                          {item.phone || "—"}
                        </td>

                        <td>
                          <span
                            className={`staff-login-status ${
                              item.user
                                ? "yes"
                                : "no"
                            }`}
                          >
                            {item.user
                              ? "Yes"
                              : "No"}
                          </span>
                        </td>

                        <td>
                          <div className="staff-row-actions">

                            <Link
                              to={`/staff/${item.id}/edit`}
                              className="staff-action-btn edit"
                            >
                              <Pencil size={15} />
                              Edit
                            </Link>

                            <button
                              type="button"
                              className="staff-action-btn delete"
                              onClick={() =>
                                removeStaff(
                                  item.id,
                                  item.name
                                )
                              }
                            >
                              <Trash2 size={15} />
                              Delete
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

        </div>
      </div>

      {/* PAGINATION */}
      {!loading &&
        staff.length > 0 &&
        totalPages > 1 && (
          <div className="staff-pagination">

            <button
              type="button"
              disabled={page <= 1}
              onClick={() =>
                setPage((previous) =>
                  Math.max(
                    1,
                    previous - 1
                  )
                )
              }
            >
              Previous
            </button>

            <span>
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={
                page >= totalPages
              }
              onClick={() =>
                setPage((previous) =>
                  Math.min(
                    totalPages,
                    previous + 1
                  )
                )
              }
            >
              Next
            </button>

          </div>
        )}

    </div>
  );
}