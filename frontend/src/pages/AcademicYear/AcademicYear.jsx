import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Check } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { DataTable } from "../../components/tables/DataTable";
import { Modal } from "../../components/modal/Modal";

import {
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  activateAcademicYear,
  deleteAcademicYear,
} from "../../api/academicYear.api";

import "./AcademicYear.css";

export default function AcademicYear() {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    isActive: false,
  });

  /* =====================================================
     FETCH ACADEMIC YEARS
     ===================================================== */

  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAcademicYears();

      setAcademicYears(response?.data || []);
    } catch (err) {
      console.error("Failed to fetch academic years:", err);

      setError(
        err.response?.data?.error ||
          "Failed to load academic years."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  /* =====================================================
     FORMAT DATA
     ===================================================== */

  const formattedAcademicYears = useMemo(() => {
    return academicYears.map((item) => ({
      ...item,

      year: item.name,

      isCurrent: item.isActive,

      status: item.isActive
        ? "active"
        : new Date(item.endDate) < new Date()
        ? "completed"
        : "pending",
    }));
  }, [academicYears]);

  /* =====================================================
     SEARCH
     ===================================================== */

  const filteredAcademicYears = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return formattedAcademicYears;
    }

    return formattedAcademicYears.filter((item) => {
      return (
        item.year?.toLowerCase().includes(value) ||
        item.startDate?.toLowerCase().includes(value) ||
        item.endDate?.toLowerCase().includes(value)
      );
    });
  }, [formattedAcademicYears, search]);

  /* =====================================================
     STATISTICS
     ===================================================== */

  const totals = useMemo(() => {
    const current = formattedAcademicYears.filter(
      (item) => item.isCurrent
    ).length;

    const completed = formattedAcademicYears.filter(
      (item) => item.status === "completed"
    ).length;

    return {
      current,
      completed,
    };
  }, [formattedAcademicYears]);

  /* =====================================================
     DATE FORMAT
     ===================================================== */

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-GB");
  };

  /* =====================================================
     OPEN ADD MODAL
     ===================================================== */

  const openAddModal = () => {
    setEditingId(null);

    setForm({
      startDate: "",
      endDate: "",
      isActive: false,
    });

    setError("");
    setIsModalOpen(true);
  };

  /* =====================================================
     OPEN EDIT MODAL
     ===================================================== */

  const openEditModal = (row) => {
    setEditingId(row.id);

    setForm({
      startDate: row.startDate
        ? row.startDate.substring(0, 10)
        : "",
      endDate: row.endDate
        ? row.endDate.substring(0, 10)
        : "",
      isActive: row.isActive || false,
    });

    setError("");
    setIsModalOpen(true);
  };

  /* =====================================================
     FORM CHANGE
     ===================================================== */

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* =====================================================
     CREATE / UPDATE
     ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.startDate) {
      setError("Start date is required.");
      return;
    }

    if (!form.endDate) {
      setError("End date is required.");
      return;
    }

    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setError("End date must be after start date.");
      return;
    }

    try {
      setError("");

      if (editingId) {
        await updateAcademicYear(editingId, {
          startDate: form.startDate,
          endDate: form.endDate,
          isActive: form.isActive,
        });
      } else {
        await createAcademicYear({
          startDate: form.startDate,
          endDate: form.endDate,
          isActive: form.isActive,
        });
      }

      setIsModalOpen(false);
      setEditingId(null);

      await fetchAcademicYears();
    } catch (err) {
      console.error("Academic year save failed:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to save academic year."
      );
    }
  };

  /* =====================================================
     ACTIVATE
     ===================================================== */

  const handleActivate = async (id) => {
    try {
      setError("");

      await activateAcademicYear(id);

      await fetchAcademicYears();
    } catch (err) {
      console.error("Activation failed:", err);

      setError(
        err.response?.data?.error ||
          "Failed to activate academic year."
      );
    }
  };

  /* =====================================================
     DELETE
     ===================================================== */

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this academic year?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await deleteAcademicYear(id);

      await fetchAcademicYears();
    } catch (err) {
      console.error("Delete failed:", err);

      setError(
        err.response?.data?.error ||
          "Failed to delete academic year."
      );
    }
  };

  /* =====================================================
     TABLE COLUMNS
     ===================================================== */

  const columns = [
    {
      header: "Year",
      render: (row) => (
        <span className="academic-year-name">
          {row.year}
        </span>
      ),
    },

    {
      header: "Start Date",
      render: (row) => formatDate(row.startDate),
    },

    {
      header: "End Date",
      render: (row) => formatDate(row.endDate),
    },

    {
      header: "Current Year",
      render: (row) => (
        <span
          className={`academic-year-current ${
            row.isCurrent ? "yes" : "no"
          }`}
        >
          {row.isCurrent && <Check size={14} />}
          {row.isCurrent ? "Yes" : "No"}
        </span>
      ),
    },

    {
      header: "Status",
      render: (row) => (
        <span
          className={`academic-year-status ${row.status}`}
        >
          {row.status}
        </span>
      ),
    },

    {
      header: "Actions",
      render: (row) => (
        <div className="academic-year-row-actions">
          <button
            type="button"
            className="academic-year-action-btn edit"
            onClick={() => openEditModal(row)}
            title="Edit"
          >
            <Pencil size={15} />
            Edit
          </button>

          {!row.isCurrent && (
            <button
              type="button"
              className="academic-year-action-btn activate"
              onClick={() => handleActivate(row.id)}
              title="Activate"
            >
              <Check size={15} />
              Activate
            </button>
          )}

          <button
            type="button"
            className="academic-year-action-btn delete"
            onClick={() => handleDelete(row.id)}
            title="Delete"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      ),
    },
  ];

  /* =====================================================
     UI
     ===================================================== */

  return (
    <div className="academic-year-page">

      {/* HEADER */}
      <div className="academic-year-header">

        <div className="academic-year-title-section">
          <h1>Academic Year</h1>

          <p>
            Manage all academic year records and status.
          </p>
        </div>

        <div className="academic-year-actions">

          {/* SEARCH */}
          <div className="academic-year-search">

            <Search className="academic-year-search-icon" />

            <Input
              placeholder="Search academic year..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>

          {/* ADD */}
          <Button
            variant="primary"
            size="md"
            className="academic-year-add-btn"
            onClick={openAddModal}
          >
            <Plus size={17} />
            Add Academic Year
          </Button>

        </div>

      </div>

      {/* ERROR */}
      {error && (
        <div className="academic-year-alert">
          {error}
        </div>
      )}

      {/* STATISTICS */}
      <div className="academic-year-stats">

        <div className="academic-year-stat-card">
          <p className="academic-year-stat-label">
            Total Years
          </p>

          <p className="academic-year-stat-value">
            {loading ? "..." : formattedAcademicYears.length}
          </p>
        </div>

        <div className="academic-year-stat-card">
          <p className="academic-year-stat-label">
            Current Year
          </p>

          <p className="academic-year-stat-value">
            {loading ? "..." : totals.current}
          </p>
        </div>

        <div className="academic-year-stat-card">
          <p className="academic-year-stat-label">
            Completed
          </p>

          <p className="academic-year-stat-value">
            {loading ? "..." : totals.completed}
          </p>
        </div>

      </div>

      {/* TABLE */}
      <div className="academic-year-table-card">

        <div className="academic-year-table-header">
          <h2>Academic Year List</h2>
        </div>

        <div className="academic-year-table-body">

          {loading ? (
            <div className="academic-year-loading">
              Loading academic years...
            </div>
          ) : filteredAcademicYears.length === 0 ? (
            <div className="academic-year-empty">
              No academic years found.
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredAcademicYears}
            />
          )}

        </div>

      </div>

      {/* ADD / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingId
            ? "Edit Academic Year"
            : "Add Academic Year"
        }
        size="md"
      >

        <form
          className="academic-year-form"
          onSubmit={handleSubmit}
        >

          {/* START DATE */}
          <div className="academic-year-form-group">

            <label className="academic-year-form-label">
              Start Date
              <span className="required">*</span>
            </label>

            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              className="academic-year-date-input"
              required
            />

            <small>
              Select the starting date of the academic year.
            </small>

          </div>

          {/* END DATE */}
          <div className="academic-year-form-group">

            <label className="academic-year-form-label">
              End Date
              <span className="required">*</span>
            </label>

            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              className="academic-year-date-input"
              required
            />

            <small>
              Select the ending date of the academic year.
            </small>

          </div>

          {/* ACTIVE */}
          <div className="academic-year-active-row">

            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="academic-year-active-checkbox"
            />

            <label
              htmlFor="isActive"
              className="academic-year-active-label"
            >
              Set as active academic year
            </label>

          </div>

          {/* ACTIONS */}
          <div className="academic-year-modal-actions">

            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
            >
              {editingId
                ? "Update Academic Year"
                : "Create Academic Year"}
            </Button>

          </div>

        </form>

      </Modal>

    </div>
  );
}