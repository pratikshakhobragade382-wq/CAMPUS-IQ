import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

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

export default function StaffList() {
  const [staff, setStaff] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);

  /* =====================================================
     FETCH STAFF
     ===================================================== */

  const loadStaff = async (requestedPage = page) => {
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

      const res = await axiosClient.get("/staff", { params });

      const data = res.data?.data || {};

      setStaff(data.staff || []);
      setPagination(data.pagination || {});
    } catch (err) {
      console.error("Failed to load staff:", err);

      setError(
        err.response?.data?.error ||
          "Failed to load staff."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff(page);
  }, [page, role]);

  /* =====================================================
     SEARCH
     ===================================================== */

  const submitSearch = (e) => {
    e.preventDefault();

    setPage(1);
    loadStaff(1);
  };

  /* =====================================================
     DELETE
     ===================================================== */

  const removeStaff = async (id, name) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${name}?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await axiosClient.delete(`/staff/${id}`);

      await loadStaff(page);
    } catch (err) {
      console.error("Failed to delete staff:", err);

      setError(
        err.response?.data?.error ||
          "Failed to delete staff."
      );
    }
  };

  /* =====================================================
     STATISTICS
     ===================================================== */

  const totals = useMemo(() => {
    const total =
      pagination.total ??
      pagination.totalItems ??
      staff.length;

    const teachers = staff.filter(
      (item) => item.role === "teacher"
    ).length;

    const other = staff.filter(
      (item) => item.role !== "teacher"
    ).length;

    return {
      total,
      teachers,
      other,
    };
  }, [staff, pagination]);

  /* =====================================================
     ROLE LABEL
     ===================================================== */

  const formatRole = (role) => {
    if (!role) return "—";

    return role
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  /* =====================================================
     UI
     ===================================================== */

  return (
    <div className="staff-page">

      {/* HEADER */}
      <div className="staff-header">

        <div className="staff-title-section">
          <h1>Staff Management</h1>

          <p>
            Manage teachers and school staff.
          </p>
        </div>

        <div className="staff-actions">

          {/* SEARCH */}
          <form
            className="staff-search"
            onSubmit={submitSearch}
          >
            <Search className="staff-search-icon" />

            <input
              type="text"
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          {/* ROLE */}
          <select
            className="staff-role-filter"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All roles</option>

            {ROLES.map((item) => (
              <option key={item} value={item}>
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

          {/* ADD STAFF */}
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

      {/* STATISTICS */}
      <div className="staff-stats">

        <div className="staff-stat-card">
          <p className="staff-stat-label">
            Total Staff
          </p>

          <p className="staff-stat-value">
            {loading ? "..." : totals.total}
          </p>
        </div>

        <div className="staff-stat-card">
          <p className="staff-stat-label">
            Teachers
          </p>

          <p className="staff-stat-value">
            {loading ? "..." : totals.teachers}
          </p>
        </div>

        <div className="staff-stat-card">
          <p className="staff-stat-label">
            Other Staff
          </p>

          <p className="staff-stat-value">
            {loading ? "..." : totals.other}
          </p>
        </div>

      </div>

      {/* TABLE CARD */}
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
                    <th>Phone</th>
                    <th>Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {staff.map((item) => (
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
                        {item.department?.name || "—"}
                      </td>

                      <td>
                        {item.phone || "—"}
                      </td>

                      <td>
                        <span
                          className={`staff-login-status ${
                            item.user ? "yes" : "no"
                          }`}
                        >
                          {item.user ? "Yes" : "No"}
                        </span>
                      </td>

                      <td>
                        <div className="staff-row-actions">

                          <Link
                            to={`/staff/${item.id}/edit`}
                            className="staff-action-btn edit"
                            title="Edit"
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
                            title="Delete"
                          >
                            <Trash2 size={15} />
                            Delete
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>

      {/* PAGINATION */}
      {pagination.totalPages > 1 && (
        <div className="staff-pagination">

          <button
            type="button"
            disabled={page <= 1}
            onClick={() =>
              setPage((current) => current - 1)
            }
          >
            Previous
          </button>

          <span>
            Page {page} of {pagination.totalPages}
          </span>

          <button
            type="button"
            disabled={
              page >= pagination.totalPages
            }
            onClick={() =>
              setPage((current) => current + 1)
            }
          >
            Next
          </button>

        </div>
      )}

    </div>
  );
}