import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { StatusBadge } from "../../components/ui/Badge";
import { DataTable } from "../../components/tables/DataTable";
import { Modal } from "../../components/modal/Modal";

import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../api/department.api";

import "./Department.css";

export default function Department() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
  });

  /* =====================================================
     FETCH DEPARTMENTS
  ===================================================== */

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getDepartments();

      setDepartments(response?.data || []);
    } catch (err) {
      console.error("Failed to fetch departments:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to load departments."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredDepartments = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return departments;
    }

    return departments.filter((department) =>
      department.name?.toLowerCase().includes(value)
    );
  }, [departments, search]);

  /* =====================================================
     OPEN ADD MODAL
  ===================================================== */

  const openAddModal = () => {
    setEditingId(null);

    setForm({
      name: "",
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
      name: row.name || "",
    });

    setError("");
    setIsModalOpen(true);
  };

  /* =====================================================
     FORM CHANGE
  ===================================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =====================================================
     CREATE / UPDATE DEPARTMENT
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const departmentName = form.name.trim();

    if (!departmentName) {
      setError("Department name is required.");
      return;
    }

    try {
      setError("");

      if (editingId) {
        await updateDepartment(editingId, {
          name: departmentName,
        });
      } else {
        await createDepartment({
          name: departmentName,
        });
      }

      setIsModalOpen(false);
      setEditingId(null);

      setForm({
        name: "",
      });

      await fetchDepartments();
    } catch (err) {
      console.error("Department save failed:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to save department."
      );
    }
  };

  /* =====================================================
     DELETE DEPARTMENT
  ===================================================== */

  const handleDelete = async (row) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${row.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteDepartment(row.id);

      await fetchDepartments();
    } catch (err) {
      console.error("Department deletion failed:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to delete department."
      );
    }
  };

  /* =====================================================
     TABLE COLUMNS
  ===================================================== */

  const columns = [
    {
      header: "Department Name",
      render: (row) => (
        <span className="department-name">
          {row.name}
        </span>
      ),
    },

    {
      header: "Created At",
      render: (row) =>
        row.createdAt
          ? new Date(row.createdAt).toLocaleDateString("en-GB")
          : "—",
    },

    {
      header: "Status",
      render: (row) => (
        <StatusBadge
          status={row.isDeleted ? "inactive" : "active"}
        />
      ),
    },

    {
      header: "Actions",
      render: (row) => (
        <div className="department-row-actions">

          {/* EDIT */}
          <button
            type="button"
            className="department-action-btn edit"
            onClick={() => openEditModal(row)}
            title="Edit"
          >
            <Pencil size={15} />
            Edit
          </button>

          {/* DELETE */}
          <button
            type="button"
            className="department-action-btn delete"
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

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="department-page">

      {/* HEADER */}

      <div className="department-header">

        <div className="department-title-section">
          <h1>Department</h1>

          <p>
            Manage all academic departments.
          </p>
        </div>

        <div className="department-actions">

          {/* SEARCH */}

          <div className="department-search">

            <Search className="department-search-icon" />

            <Input
              placeholder="Search department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>

          {/* ADD */}

          <Button
            variant="primary"
            size="md"
            className="department-add-btn"
            onClick={openAddModal}
          >
            <Plus size={17} />
            Add Department
          </Button>

        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="department-alert">
          {error}
        </div>
      )}

      {/* TABLE */}

      <div className="department-table-card">

        <div className="department-table-header">
          <h2>Department List</h2>
        </div>

        <div className="department-table-body">

          {loading ? (
            <div className="department-loading">
              Loading departments...
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="department-empty">
              No departments found.
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredDepartments}
            />
          )}

        </div>

      </div>

      {/* ADD / EDIT MODAL */}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
          setError("");
        }}
        title={
          editingId
            ? "Edit Department"
            : "Add Department"
        }
        size="md"
      >

        <form
          className="department-form"
          onSubmit={handleSubmit}
        >

          {/* DEPARTMENT NAME */}

          <div className="department-form-group">

            <label className="department-form-label">
              Department Name
              <span className="required">*</span>
            </label>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter department name"
              className="department-form-input"
              maxLength={100}
              autoFocus
              required
            />

            <small>
              Enter the name of the academic department.
            </small>

          </div>

          {/* MODAL ACTIONS */}

          <div className="department-modal-actions">

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingId(null);
                setError("");
              }}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
            >
              {editingId
                ? "Update Department"
                : "Create Department"}
            </Button>

          </div>

        </form>

      </Modal>

    </div>
  );
}