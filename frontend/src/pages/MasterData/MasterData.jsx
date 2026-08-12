import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Layers } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { StatusBadge } from "../../components/ui/Badge";
import { DataTable } from "../../components/tables/DataTable";
import { Modal } from "../../components/modal/Modal";
import { useAuth } from "../../context/AuthContext";
import {
  MASTER_DATA_CATEGORIES,
  MASTER_DATA_MANAGE_ROLES,
} from "../../utils/constants";

import {
  getValidCategories,
  getMasterDataByCategory,
  createMasterData,
  updateMasterData,
  deleteMasterData,
  bulkCreateMasterData,
} from "../../api/masterData.api";

import "./MasterData.css";

const EMPTY_FORM = {
  value: "",
  isActive: true,
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

function formatCategoryLabel(category) {
  if (!category) return "";
  return category.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export default function MasterData() {
  const { user } = useAuth();
  const canManage = MASTER_DATA_MANAGE_ROLES.includes(user?.identity);

  const [validCategories, setValidCategories] = useState(MASTER_DATA_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState(
    MASTER_DATA_CATEGORIES[0] || ""
  );
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [bulkValues, setBulkValues] = useState("");

  /* =====================================================
     FETCH VALID CATEGORIES
  ===================================================== */

  const fetchValidCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const response = await getValidCategories();
      const list = Array.isArray(response?.data) ? response.data : [];

      if (list.length > 0) {
        setValidCategories(list);
        setSelectedCategory((current) =>
          current && list.includes(current) ? current : list[0]
        );
      }
    } catch (err) {
      console.error("Failed to fetch valid categories:", err);
      // Fall back to constants that mirror backend VALID_CATEGORIES
      setValidCategories(MASTER_DATA_CATEGORIES);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  /* =====================================================
     FETCH VALUES BY CATEGORY
  ===================================================== */

  const fetchItems = useCallback(async (category) => {
    if (!category) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getMasterDataByCategory(category);
      setItems(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch master data:", err);
      setError(getErrorMessage(err, "Failed to load master data."));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchValidCategories();
  }, [fetchValidCategories]);

  useEffect(() => {
    if (selectedCategory) {
      fetchItems(selectedCategory);
    }
  }, [selectedCategory, fetchItems]);

  /* =====================================================
     SEARCH (client-side — backend has no search param)
  ===================================================== */

  const filteredItems = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return items;

    return items.filter((item) =>
      item.value?.toLowerCase().includes(value)
    );
  }, [items, search]);

  /* =====================================================
     MODAL HELPERS
  ===================================================== */

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const closeBulkModal = () => {
    setIsBulkModalOpen(false);
    setBulkValues("");
    setError("");
  };

  const openAddModal = () => {
    if (!canManage) return;
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const openBulkModal = () => {
    if (!canManage) return;
    setBulkValues("");
    setError("");
    setSuccess("");
    setIsBulkModalOpen(true);
  };

  const openEditModal = (row) => {
    if (!canManage) return;
    setEditingId(row.id);
    setForm({
      value: row.value || "",
      isActive: row.isActive !== false,
    });
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

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

    if (!canManage) {
      setError("You do not have permission to manage master data.");
      return;
    }

    const value = form.value.trim();

    if (!value) {
      setError("Value is required.");
      return;
    }

    if (!selectedCategory) {
      setError("Please select a category.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingId) {
        await updateMasterData(editingId, {
          value,
          isActive: form.isActive,
        });
        setSuccess("Master data updated successfully.");
      } else {
        await createMasterData({
          category: selectedCategory,
          value,
        });
        setSuccess("Master data created successfully.");
      }

      closeModal();
      await fetchItems(selectedCategory);
    } catch (err) {
      console.error("Master data save failed:", err);
      setError(getErrorMessage(err, "Failed to save master data."));
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     BULK CREATE
  ===================================================== */

  const handleBulkSubmit = async (e) => {
    e.preventDefault();

    if (!canManage) {
      setError("You do not have permission to manage master data.");
      return;
    }

    if (!selectedCategory) {
      setError("Please select a category.");
      return;
    }

    const values = bulkValues
      .split(/[\n,]+/)
      .map((v) => v.trim())
      .filter(Boolean);

    if (values.length === 0) {
      setError("Enter at least one value (one per line or comma-separated).");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await bulkCreateMasterData({
        category: selectedCategory,
        values,
      });

      setSuccess(`Bulk created ${values.length} value(s) for ${selectedCategory}.`);
      closeBulkModal();
      await fetchItems(selectedCategory);
    } catch (err) {
      console.error("Bulk create failed:", err);
      setError(getErrorMessage(err, "Failed to bulk create master data."));
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     DELETE
  ===================================================== */

  const handleDelete = async (row) => {
    if (!canManage) {
      setError("You do not have permission to delete master data.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${row.value}" from ${formatCategoryLabel(row.category || selectedCategory)}?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(row.id);
      setError("");
      setSuccess("");

      await deleteMasterData(row.id);
      setSuccess("Master data deleted successfully.");
      await fetchItems(selectedCategory);
    } catch (err) {
      console.error("Master data deletion failed:", err);
      setError(getErrorMessage(err, "Failed to delete master data."));
    } finally {
      setDeletingId(null);
    }
  };

  /* =====================================================
     TABLE COLUMNS
  ===================================================== */

  const columns = [
    {
      header: "Value",
      render: (row) => <span className="md-value">{row.value}</span>,
    },
    {
      header: "Category",
      render: (row) => (
        <span className="md-category-pill">
          {formatCategoryLabel(row.category || selectedCategory)}
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
        <StatusBadge status={row.isActive === false ? "inactive" : "active"} />
      ),
    },
    ...(canManage
      ? [
          {
            header: "Actions",
            render: (row) => (
              <div className="md-row-actions">
                <button
                  type="button"
                  className="md-action-btn edit"
                  onClick={() => openEditModal(row)}
                  title="Edit"
                  disabled={saving || deletingId !== null}
                >
                  <Pencil size={15} />
                  Edit
                </button>
                <button
                  type="button"
                  className="md-action-btn delete"
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

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="md-page">
      <div className="md-header">
        <div className="md-title-section">
          <h1>Master Data</h1>
          <p>
            Manage lookup values (blood groups, religions, houses, and more)
            used across student and staff forms.
          </p>
        </div>

        <div className="md-actions">
          <div className="md-search">
            <Search className="md-search-icon" />
            <Input
              placeholder="Search values..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {canManage && (
            <>
              <Button
                variant="outline"
                size="md"
                className="md-bulk-btn"
                onClick={openBulkModal}
                disabled={saving || !selectedCategory}
              >
                <Layers size={17} />
                Bulk Add
              </Button>
              <Button
                variant="primary"
                size="md"
                className="md-add-btn"
                onClick={openAddModal}
                disabled={saving || !selectedCategory}
              >
                <Plus size={17} />
                Add Value
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="md-category-bar">
        <label className="md-form-label" htmlFor="md-category-select">
          Category
        </label>
        <select
          id="md-category-select"
          className="md-category-select"
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setSearch("");
            setSuccess("");
            setError("");
          }}
          disabled={categoriesLoading || validCategories.length === 0}
        >
          {validCategories.length === 0 ? (
            <option value="">No categories available</option>
          ) : (
            validCategories.map((category) => (
              <option key={category} value={category}>
                {formatCategoryLabel(category)}
              </option>
            ))
          )}
        </select>
        <span className="md-category-count">
          {loading ? "…" : `${filteredItems.length} value(s)`}
        </span>
      </div>

      {error && !isModalOpen && !isBulkModalOpen && (
        <div className="md-alert">{error}</div>
      )}
      {success && !isModalOpen && !isBulkModalOpen && (
        <div className="md-alert success">{success}</div>
      )}

      <div className="md-table-card">
        <div className="md-table-header">
          <h2>
            {selectedCategory
              ? `${formatCategoryLabel(selectedCategory)} Values`
              : "Values"}
          </h2>
        </div>

        <div className="md-table-body">
          {loading ? (
            <div className="md-loading">Loading master data...</div>
          ) : filteredItems.length === 0 ? (
            <div className="md-empty">
              {search.trim()
                ? "No values match your search."
                : `No values found for ${formatCategoryLabel(selectedCategory)}. Add one to get started.`}
            </div>
          ) : (
            <DataTable columns={columns} data={filteredItems} />
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!saving) closeModal();
        }}
        title={
          editingId
            ? `Edit ${formatCategoryLabel(selectedCategory)}`
            : `Add ${formatCategoryLabel(selectedCategory)}`
        }
        size="md"
      >
        <form className="md-form" onSubmit={handleSubmit}>
          {error && isModalOpen && <div className="md-alert">{error}</div>}

          <div className="md-form-group">
            <label className="md-form-label">Category</label>
            <input
              type="text"
              className="md-form-input"
              value={formatCategoryLabel(selectedCategory)}
              disabled
              readOnly
            />
            <small>Category is set from the selector above.</small>
          </div>

          <div className="md-form-group">
            <label className="md-form-label" htmlFor="md-value">
              Value
              <span className="required">*</span>
            </label>
            <input
              id="md-value"
              type="text"
              name="value"
              value={form.value}
              onChange={handleChange}
              placeholder="e.g. A+"
              className="md-form-input"
              autoFocus
              required
              disabled={saving}
            />
            <small>Exact lookup value stored for this category.</small>
          </div>

          {editingId && (
            <div className="md-form-group md-checkbox-group">
              <label className="md-checkbox-label" htmlFor="md-isActive">
                <input
                  id="md-isActive"
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  disabled={saving}
                />
                Active
              </label>
              <small>
                Inactive values are hidden from category lists by the backend.
              </small>
            </div>
          )}

          <div className="md-modal-actions">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              disabled={saving}
            >
              {editingId ? "Update Value" : "Create Value"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Add Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => {
          if (!saving) closeBulkModal();
        }}
        title={`Bulk Add — ${formatCategoryLabel(selectedCategory)}`}
        size="md"
      >
        <form className="md-form" onSubmit={handleBulkSubmit}>
          {error && isBulkModalOpen && <div className="md-alert">{error}</div>}

          <div className="md-form-group">
            <label className="md-form-label" htmlFor="md-bulk-values">
              Values
              <span className="required">*</span>
            </label>
            <textarea
              id="md-bulk-values"
              className="md-form-textarea"
              value={bulkValues}
              onChange={(e) => setBulkValues(e.target.value)}
              placeholder={"A+\nA-\nB+\nB-\nO+\nO-\nAB+\nAB-"}
              rows={8}
              disabled={saving}
              required
            />
            <small>
              Enter one value per line, or separate with commas. Duplicates are
              skipped by the backend.
            </small>
          </div>

          <div className="md-modal-actions">
            <Button
              type="button"
              variant="outline"
              onClick={closeBulkModal}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              disabled={saving}
            >
              Bulk Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
