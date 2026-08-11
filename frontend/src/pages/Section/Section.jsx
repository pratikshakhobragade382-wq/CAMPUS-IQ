import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { StatusBadge } from "../../components/ui/Badge";
import { DataTable } from "../../components/tables/DataTable";
import { Modal } from "../../components/modal/Modal";

import {
  getAllSections,
  createSectionRecord,
  updateSection,
  deleteSection,
} from "../../api/section.api";
import { getClasses } from "../../api/class.api";

import "./Section.css";

const EMPTY_FORM = {
  name: "",
  classId: "",
};

function getApiError(err, fallback) {
  return (
    err.response?.data?.error ||
    err.response?.data?.message ||
    fallback
  );
}

export default function Section() {
  const [sections, setSections] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  const classNameById = useMemo(() => {
    const map = {};
    classes.forEach((classItem) => {
      map[classItem.id] = classItem.name;
    });
    return map;
  }, [classes]);

  /* =====================================================
     FETCH SECTIONS + CLASSES
  ===================================================== */

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [sectionsRes, classesRes] = await Promise.all([
        getAllSections(),
        getClasses(),
      ]);

      setSections(sectionsRes?.data || []);
      setClasses(classesRes?.data || []);
    } catch (err) {
      console.error("Failed to fetch sections:", err);
      setError(getApiError(err, "Failed to load sections."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* =====================================================
     SEARCH + CLASS FILTER (client-side; backend has none)
  ===================================================== */

  const filteredSections = useMemo(() => {
    const value = search.trim().toLowerCase();

    return sections.filter((section) => {
      const matchesClass =
        !classFilter || String(section.classId) === String(classFilter);

      if (!matchesClass) {
        return false;
      }

      if (!value) {
        return true;
      }

      const className = classNameById[section.classId] || "";

      return (
        section.name?.toLowerCase().includes(value) ||
        className.toLowerCase().includes(value)
      );
    });
  }, [sections, search, classFilter, classNameById]);

  /* =====================================================
     OPEN ADD MODAL
  ===================================================== */

  const openAddModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
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
      classId: row.classId ? String(row.classId) : "",
    });
    setError("");
    setIsModalOpen(true);
  };

  /* =====================================================
     CLOSE MODAL
  ===================================================== */

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setSaving(false);
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
     CREATE / UPDATE SECTION
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const sectionName = form.name.trim();
    const classId = form.classId ? Number(form.classId) : null;

    if (!sectionName) {
      setError("Section name is required.");
      return;
    }

    if (sectionName.length > 20) {
      setError("Section name must not exceed 20 characters.");
      return;
    }

    if (!classId || Number.isNaN(classId) || classId <= 0) {
      setError("Please select a class.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        await updateSection(editingId, {
          name: sectionName,
          classId,
        });
      } else {
        await createSectionRecord({
          name: sectionName,
          classId,
        });
      }

      closeModal();
      await fetchData();
    } catch (err) {
      console.error("Section save failed:", err);
      setError(getApiError(err, "Failed to save section."));
      setSaving(false);
    }
  };

  /* =====================================================
     DELETE SECTION
  ===================================================== */

  const handleDelete = async (row) => {
    const classLabel = classNameById[row.classId] || "class";
    const confirmed = window.confirm(
      `Are you sure you want to delete section "${row.name}" (${classLabel})?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      await deleteSection(row.id);
      await fetchData();
    } catch (err) {
      console.error("Section deletion failed:", err);
      setError(getApiError(err, "Failed to delete section."));
    }
  };

  /* =====================================================
     TABLE COLUMNS
  ===================================================== */

  const columns = [
    {
      header: "Section Name",
      render: (row) => (
        <span className="section-name">{row.name}</span>
      ),
    },
    {
      header: "Class",
      render: (row) => classNameById[row.classId] || `Class #${row.classId}`,
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
        <StatusBadge status={row.isDeleted ? "inactive" : "active"} />
      ),
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="section-row-actions">
          <button
            type="button"
            className="section-action-btn edit"
            onClick={() => openEditModal(row)}
            title="Edit"
            aria-label={`Edit section ${row.name}`}
          >
            <Pencil size={15} />
            Edit
          </button>

          <button
            type="button"
            className="section-action-btn delete"
            onClick={() => handleDelete(row)}
            title="Delete"
            aria-label={`Delete section ${row.name}`}
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
    <div className="section-page">
      <div className="section-header">
        <div className="section-title-section">
          <h1>Section</h1>
          <p>Manage class sections for your school.</p>
        </div>

        <div className="section-actions">
          <div className="section-search">
            <Search className="section-search-icon" />
            <Input
              placeholder="Search section..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="section-filter">
            <select
              className="section-filter-select"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              aria-label="Filter by class"
            >
              <option value="">All classes</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            size="md"
            className="section-add-btn"
            onClick={openAddModal}
          >
            <Plus size={17} />
            Add Section
          </Button>
        </div>
      </div>

      {error && !isModalOpen && (
        <div className="section-alert">{error}</div>
      )}

      <div className="section-table-card">
        <div className="section-table-header">
          <h2>Section List</h2>
        </div>

        <div className="section-table-body">
          {loading ? (
            <div className="section-loading">Loading sections...</div>
          ) : filteredSections.length === 0 ? (
            <div className="section-empty">No sections found.</div>
          ) : (
            <DataTable columns={columns} data={filteredSections} />
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? "Edit Section" : "Add Section"}
        size="md"
      >
        <form className="section-form" onSubmit={handleSubmit}>
          {error && isModalOpen && (
            <div className="section-alert">{error}</div>
          )}

          <div className="section-form-group">
            <label className="section-form-label" htmlFor="section-name">
              Section Name
              <span className="required">*</span>
            </label>

            <input
              id="section-name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. A"
              className="section-form-input"
              maxLength={20}
              autoFocus
              required
            />

            <small>Enter the section name (max 20 characters).</small>
          </div>

          <div className="section-form-group">
            <label className="section-form-label" htmlFor="section-class">
              Class
              <span className="required">*</span>
            </label>

            <select
              id="section-class"
              name="classId"
              value={form.classId}
              onChange={handleChange}
              className="section-form-input section-form-select"
              required
            >
              <option value="">Select class</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>

            <small>
              Select the class this section belongs to.
              {classes.length === 0 &&
                " No classes found — create a class first."}
            </small>
          </div>

          <div className="section-modal-actions">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>

            <Button type="submit" variant="primary" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Section"
                  : "Create Section"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
