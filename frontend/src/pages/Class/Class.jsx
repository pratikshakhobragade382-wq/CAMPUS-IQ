import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { DataTable } from "../../components/tables/DataTable";
import { Modal } from "../../components/modal/Modal";

import {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
} from "../../api/class.api";

import { createSection } from "../../api/section.api";

import "./Class.css";

export default function ClassPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  const [form, setForm] = useState({
    name: "",
    section: "",
  });

  /* =====================================================
     FETCH CLASSES
  ===================================================== */

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getClasses();

      setClasses(response?.data || []);
    } catch (err) {
      console.error("Failed to fetch classes:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to load classes."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredClasses = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return classes;
    }

    return classes.filter((classItem) =>
      classItem.name?.toLowerCase().includes(value)
    );
  }, [classes, search]);

  /* =====================================================
     OPEN ADD MODAL
  ===================================================== */

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingClass(null);

    setForm({
      name: "",
      section: "",
    });

    setError("");
    setIsModalOpen(true);
  };

  /* =====================================================
     OPEN EDIT MODAL
  ===================================================== */

  const handleEdit = (row) => {
    setIsEditMode(true);
    setEditingClass(row);

    setForm({
      name: row.name || "",
      section: row.sections?.[0]?.name || "",
    });

    setError("");
    setIsModalOpen(true);
  };

  /* =====================================================
     CLOSE MODAL
  ===================================================== */

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingClass(null);

    setForm({
      name: "",
      section: "",
    });

    setError("");
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
     CREATE / UPDATE CLASS
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const className = form.name.trim();
    const sectionName = form.section.trim();

    /* ---------------------------------------------
       VALIDATION
    --------------------------------------------- */

    if (!className) {
      setError("Class name is required.");
      return;
    }

    if (!sectionName) {
      setError("Section is required.");
      return;
    }

    try {
      setError("");

      /* =============================================
         UPDATE EXISTING CLASS
      ============================================= */

      if (isEditMode && editingClass) {
        await updateClass(editingClass.id, {
          name: className,
          section: sectionName,
        });

        closeModal();

        await fetchClasses();

        return;
      }

      /* =============================================
         CREATE CLASS
      ============================================= */

      const response = await createClass({
        name: className,
      });

      const createdClass = response?.data || response;

      /* =============================================
         CREATE SECTION
      ============================================= */

      if (createdClass?.id) {
        await createSection(createdClass.id, {
          name: sectionName,
        });
      }

      closeModal();

      await fetchClasses();
    } catch (err) {
      console.error("Class save failed:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to save class."
      );
    }
  };

  /* =====================================================
     DELETE CLASS
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

      await deleteClass(row.id);

      setClasses((prev) =>
        prev.filter((classItem) => classItem.id !== row.id)
      );
    } catch (err) {
      console.error("Class deletion failed:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to delete class."
      );
    }
  };

  /* =====================================================
     TABLE COLUMNS
  ===================================================== */

  const columns = [
    {
      header: "Class Name",
      render: (row) => <span>{row.name}</span>,
    },

    {
      header: "Section",
      render: (row) => (
        <span>
          {row.sections?.length
            ? row.sections.map((section) => section.name).join(", ")
            : "—"}
        </span>
      ),
    },

    {
      header: "Status",
      render: (row) => (
        <span
          className={`class-status ${
            row.isDeleted ? "inactive" : "active"
          }`}
        >
          {row.isDeleted ? "Inactive" : "Active"}
        </span>
      ),
    },

    {
      header: "Actions",
      render: (row) => (
        <div className="class-row-actions">

          {/* EDIT ICON */}
          <button
            type="button"
            className="class-action-icon edit"
            onClick={() => handleEdit(row)}
            title="Edit"
            aria-label={`Edit ${row.name}`}
          >
            <Pencil size={17} />
          </button>

          {/* DELETE ICON */}
          <button
            type="button"
            className="class-action-icon delete"
            onClick={() => handleDelete(row)}
            title="Delete"
            aria-label={`Delete ${row.name}`}
          >
            <Trash2 size={17} />
          </button>

        </div>
      ),
    },
  ];

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="class-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="class-header">

        <div className="class-title-section">
          <h1>Class</h1>

          <p>
            Manage all academic classes and their sections.
          </p>
        </div>

        <div className="class-actions">

          {/* SEARCH */}

          <div className="class-search">

            <Search className="class-search-icon" />

            <Input
              placeholder="Search class..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>

          {/* ADD CLASS */}

          <Button
            variant="primary"
            size="md"
            className="class-add-btn"
            onClick={openAddModal}
          >
            <Plus size={17} />
            Add Class
          </Button>

        </div>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="class-alert">
          {error}
        </div>
      )}

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="class-table-card">

        <div className="class-table-header">
          <h2>Class List</h2>
        </div>

        <div className="class-table-body">

          {loading ? (
            <div className="class-loading">
              Loading classes...
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="class-empty">
              No classes found.
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredClasses}
            />
          )}

        </div>

      </div>

      {/* =================================================
          ADD / EDIT CLASS MODAL
      ================================================= */}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditMode ? "Edit Class" : "Add Class"}
        size="md"
      >

        <form
          className="class-form"
          onSubmit={handleSubmit}
        >

          {/* =================================================
              CLASS NAME
          ================================================= */}

          <div className="class-form-group">

            <label className="class-form-label">
              Class Name
              <span className="required">*</span>
            </label>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter class name"
              className="class-form-input"
              maxLength={80}
              autoFocus
              required
            />

            <small>
              Enter the name of the academic class.
            </small>

          </div>

          {/* =================================================
              SECTION
          ================================================= */}

          <div className="class-form-group">

            <label className="class-form-label">
              Section
              <span className="required">*</span>
            </label>

            <input
              type="text"
              name="section"
              value={form.section}
              onChange={handleChange}
              placeholder="Enter section"
              className="class-form-input"
              maxLength={20}
              required
            />

            <small>
              Enter the section assigned to this class.
            </small>

          </div>

          {/* =================================================
              MODAL ACTIONS
          ================================================= */}

          <div className="class-modal-actions">

            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
            >
              {isEditMode ? "Update Class" : "Create Class"}
            </Button>

          </div>

        </form>

      </Modal>

    </div>
  );
}