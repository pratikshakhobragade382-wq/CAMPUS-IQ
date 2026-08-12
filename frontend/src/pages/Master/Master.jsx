import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { StatusBadge } from "../../components/ui/Badge";
import { DataTable } from "../../components/tables/DataTable";
import { Modal } from "../../components/modal/Modal";
import { useAuth } from "../../context/AuthContext";
import { MASTER_MANAGE_ROLES } from "../../utils/constants";

import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../../api/subject.api";

import "./Master.css";

const EMPTY_FORM = {
  name: "",
  code: "",
};

function getErrorMessage(err, fallback) {
  const data = err?.response?.data;
  if (Array.isArray(data?.details) && data.details.length > 0) {
    return data.details
      .map((d) => d.message)
      .filter(Boolean)
      .join(". ");
  }
  return data?.error || data?.message || err?.message || fallback;
}

export default function Master() {
  const { user } = useAuth();
  const canManage = MASTER_MANAGE_ROLES.includes(user?.identity);

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getSubjects();
      setSubjects(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
      setError(getErrorMessage(err, "Failed to load subjects."));
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const filteredSubjects = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return subjects;

    return subjects.filter(
      (subject) =>
        subject.name?.toLowerCase().includes(value) ||
        subject.code?.toLowerCase().includes(value)
    );
  }, [subjects, search]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const openEditModal = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name || "",
      code: row.code || "",
    });
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "code" ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canManage) {
      setError("You do not have permission to manage subjects.");
      return;
    }

    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();

    if (!name) {
      setError("Name is required.");
      return;
    }

    if (!code) {
      setError("Code is required.");
      return;
    }

    if (code.length < 2) {
      setError("Code must be at least 2 characters.");
      return;
    }

    if (code.length > 20) {
      setError("Code must be at most 20 characters.");
      return;
    }

    if (!/^[A-Za-z0-9_-]+$/.test(code)) {
      setError("Code must contain only letters, numbers, _ or -.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingId) {
        await updateSubject(editingId, { name, code });
        setSuccess("Subject updated successfully.");
      } else {
        await createSubject({ name, code });
        setSuccess("Subject created successfully.");
      }

      closeModal();
      await fetchSubjects();
    } catch (err) {
      console.error("Subject save failed:", err);
      setError(getErrorMessage(err, "Failed to save subject."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!canManage) {
      setError("You do not have permission to delete subjects.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${row.name}" (${row.code})?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(row.id);
      setError("");
      setSuccess("");

      await deleteSubject(row.id);
      setSuccess("Subject deleted successfully.");
      await fetchSubjects();
    } catch (err) {
      console.error("Subject deletion failed:", err);
      setError(getErrorMessage(err, "Failed to delete subject."));
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      header: "Subject Name",
      render: (row) => <span className="master-name">{row.name}</span>,
    },
    {
      header: "Code",
      render: (row) => <span className="master-code">{row.code}</span>,
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
    ...(canManage
      ? [
          {
            header: "Actions",
            render: (row) => (
              <div className="master-row-actions">
                <button
                  type="button"
                  className="master-action-btn edit"
                  onClick={() => openEditModal(row)}
                  title="Edit"
                  disabled={saving || deletingId !== null}
                >
                  <Pencil size={15} />
                  Edit
                </button>
                <button
                  type="button"
                  className="master-action-btn delete"
                  onClick={() => handleDelete(row)}
                  title="Delete"
                  disabled={saving || deletingId === row.id}
                >
                  <Trash2 size={15} />
                  {deletingId === row.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="master-page">
      <div className="master-header">
        <div className="master-title-section">
          <h1>Master</h1>
          <p>Manage academic subjects used across exams, timetable, and staff.</p>
        </div>

        <div className="master-actions">
          <div className="master-search">
            <Search className="master-search-icon" />
            <Input
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {canManage && (
            <Button
              variant="primary"
              size="md"
              className="master-add-btn"
              onClick={openAddModal}
              disabled={saving}
            >
              <Plus size={17} />
              Add Subject
            </Button>
          )}
        </div>
      </div>

      {error && !isModalOpen && <div className="master-alert">{error}</div>}
      {success && !isModalOpen && (
        <div className="master-alert success">{success}</div>
      )}

      <div className="master-table-card">
        <div className="master-table-header">
          <h2>Subject List</h2>
        </div>

        <div className="master-table-body">
          {loading ? (
            <div className="master-loading">Loading subjects...</div>
          ) : filteredSubjects.length === 0 ? (
            <div className="master-empty">No subjects found.</div>
          ) : (
            <DataTable columns={columns} data={filteredSubjects} />
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!saving) closeModal();
        }}
        title={editingId ? "Edit Subject" : "Add Subject"}
        size="md"
      >
        <form className="master-form" onSubmit={handleSubmit}>
          {error && isModalOpen && <div className="master-alert">{error}</div>}

          <div className="master-form-group">
            <label className="master-form-label" htmlFor="master-name">
              Name
              <span className="required">*</span>
            </label>
            <input
              id="master-name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Mathematics"
              className="master-form-input"
              maxLength={100}
              autoFocus
              required
              disabled={saving}
            />
            <small>Subject display name (max 100 characters).</small>
          </div>

          <div className="master-form-group">
            <label className="master-form-label" htmlFor="master-code">
              Code
              <span className="required">*</span>
            </label>
            <input
              id="master-code"
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="e.g. MATH101"
              className="master-form-input"
              maxLength={20}
              required
              disabled={saving}
            />
            <small>
              Unique code per tenant. Letters, numbers, _ or - only (2-20 chars).
              Stored uppercase.
            </small>
          </div>

          <div className="master-modal-actions">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving} disabled={saving}>
              {editingId ? "Update Subject" : "Create Subject"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
