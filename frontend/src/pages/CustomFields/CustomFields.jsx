import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  List,
  X,
} from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { StatusBadge } from "../../components/ui/Badge";
import { DataTable } from "../../components/tables/DataTable";
import { Modal } from "../../components/modal/Modal";
import { useAuth } from "../../context/AuthContext";
import {
  CUSTOM_FIELD_CONTROLS,
  CUSTOM_FIELD_CONTROL_OPTIONS,
  CUSTOM_FIELD_MANAGE_ROLES,
} from "../../utils/constants";

import {
  getCustomFieldForms,
  getCustomFieldsByForm,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  addCustomFieldOption,
  updateCustomFieldOption,
  deleteCustomFieldOption,
} from "../../api/customFields.api";

import "./CustomFields.css";

const EMPTY_FIELD_FORM = {
  formName: "",
  name: "",
  displayName: "",
  control: CUSTOM_FIELD_CONTROLS.TEXT_BOX,
  dataType: "text",
  priority: 1,
  maxLength: "",
  isActive: true,
};

const EMPTY_OPTION_FORM = {
  label: "",
  value: "",
  priority: 1,
};

function getErrorMessage(err, fallback) {
  return (
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}

export default function CustomFields() {
  const { user } = useAuth();
  const canManage = CUSTOM_FIELD_MANAGE_ROLES.includes(user?.identity);

  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState("");
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formsLoading, setFormsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [fieldForm, setFieldForm] = useState(EMPTY_FIELD_FORM);
  const [createOptions, setCreateOptions] = useState([
    { label: "", value: "", priority: 1 },
  ]);

  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [optionsField, setOptionsField] = useState(null);
  const [optionForm, setOptionForm] = useState(EMPTY_OPTION_FORM);
  const [editingOption, setEditingOption] = useState(null);
  const [optionsError, setOptionsError] = useState("");
  const [optionsSaving, setOptionsSaving] = useState(false);

  /* =====================================================
     FETCH FORMS
  ===================================================== */

  const fetchForms = useCallback(async (preferForm) => {
    try {
      setFormsLoading(true);
      setError("");

      const response = await getCustomFieldForms();
      const list = Array.isArray(response?.data) ? response.data : [];
      setForms(list);

      setSelectedForm((current) => {
        if (preferForm && list.includes(preferForm)) return preferForm;
        if (current && list.includes(current)) return current;
        return list[0] || "";
      });
    } catch (err) {
      console.error("Failed to fetch custom field forms:", err);
      setError(getErrorMessage(err, "Failed to load forms."));
      setForms([]);
    } finally {
      setFormsLoading(false);
    }
  }, []);

  /* =====================================================
     FETCH FIELDS BY FORM
  ===================================================== */

  const fetchFields = useCallback(async (formName) => {
    if (!formName) {
      setFields([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getCustomFieldsByForm(formName);
      setFields(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch custom fields:", err);
      setError(getErrorMessage(err, "Failed to load custom fields."));
      setFields([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  useEffect(() => {
    if (selectedForm) {
      fetchFields(selectedForm);
    } else {
      setFields([]);
    }
  }, [selectedForm, fetchFields]);

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredFields = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return fields;

    return fields.filter((field) => {
      const haystack = [
        field.name,
        field.displayName,
        field.control,
        field.dataType,
        field.formName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(value);
    });
  }, [fields, search]);

  /* =====================================================
     FIELD MODAL HELPERS
  ===================================================== */

  const openAddModal = () => {
    if (!canManage) return;
    setEditingField(null);
    setFieldForm({
      ...EMPTY_FIELD_FORM,
      formName: selectedForm || "",
      priority: fields.length + 1,
    });
    setCreateOptions([{ label: "", value: "", priority: 1 }]);
    setError("");
    setSuccess("");
    setIsFieldModalOpen(true);
  };

  const openEditModal = (row) => {
    if (!canManage) return;
    setEditingField(row);
    setFieldForm({
      formName: row.formName || selectedForm || "",
      name: row.name || "",
      displayName: row.displayName || "",
      control: row.control || CUSTOM_FIELD_CONTROLS.TEXT_BOX,
      dataType: row.dataType || "text",
      priority: row.priority ?? 1,
      maxLength: row.maxLength ?? "",
      isActive: row.isActive !== false,
    });
    setCreateOptions([]);
    setError("");
    setSuccess("");
    setIsFieldModalOpen(true);
  };

  const closeFieldModal = () => {
    setIsFieldModalOpen(false);
    setEditingField(null);
    setFieldForm(EMPTY_FIELD_FORM);
    setCreateOptions([{ label: "", value: "", priority: 1 }]);
  };

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFieldForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateOptionChange = (index, key, value) => {
    setCreateOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, [key]: value } : opt))
    );
  };

  const addCreateOptionRow = () => {
    setCreateOptions((prev) => [
      ...prev,
      { label: "", value: "", priority: prev.length + 1 },
    ]);
  };

  const removeCreateOptionRow = (index) => {
    setCreateOptions((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index)
    );
  };

  /* =====================================================
     CREATE / UPDATE FIELD
  ===================================================== */

  const handleFieldSubmit = async (e) => {
    e.preventDefault();

    const formName = fieldForm.formName.trim();
    const name = fieldForm.name.trim();
    const displayName = fieldForm.displayName.trim();
    const control = fieldForm.control;
    const dataType = fieldForm.dataType.trim() || "text";
    const priority = Number(fieldForm.priority) || 1;
    const maxLength =
      fieldForm.maxLength === "" || fieldForm.maxLength === null
        ? undefined
        : Number(fieldForm.maxLength);

    if (!editingField) {
      if (!formName || !name || !displayName || !control) {
        setError("Form name, field name, display name, and control are required.");
        return;
      }
    } else if (!displayName) {
      setError("Display name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingField) {
        await updateCustomField(editingField.id, {
          displayName,
          control,
          dataType,
          priority,
          ...(maxLength !== undefined && !Number.isNaN(maxLength)
            ? { maxLength }
            : {}),
          isActive: Boolean(fieldForm.isActive),
        });
      } else {
        const options =
          control === CUSTOM_FIELD_CONTROLS.DROP_DOWN
            ? createOptions
                .filter((opt) => opt.label.trim() && opt.value.trim())
                .map((opt, i) => ({
                  label: opt.label.trim(),
                  value: opt.value.trim(),
                  priority: Number(opt.priority) || i + 1,
                }))
            : undefined;

        await createCustomField({
          formName,
          name,
          displayName,
          control,
          dataType,
          priority,
          ...(maxLength !== undefined && !Number.isNaN(maxLength)
            ? { maxLength }
            : {}),
          ...(options?.length ? { options } : {}),
        });
      }

      const targetForm = editingField
        ? selectedForm
        : formName;

      closeFieldModal();
      setSuccess(
        editingField
          ? "Custom field updated successfully."
          : "Custom field created successfully."
      );
      await fetchForms(targetForm);
      if (targetForm === selectedForm) {
        await fetchFields(targetForm);
      } else {
        setSelectedForm(targetForm);
      }
    } catch (err) {
      console.error("Custom field save failed:", err);
      setError(getErrorMessage(err, "Failed to save custom field."));
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     DELETE FIELD
  ===================================================== */

  const handleDeleteField = async (row) => {
    if (!canManage) return;

    const confirmed = window.confirm(
      `Delete custom field "${row.displayName || row.name}"? This also removes its options and values.`
    );
    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");
      await deleteCustomField(row.id);
      setSuccess("Custom field deleted successfully.");
      await fetchFields(selectedForm);
      await fetchForms(selectedForm);
    } catch (err) {
      console.error("Custom field deletion failed:", err);
      setError(getErrorMessage(err, "Failed to delete custom field."));
    }
  };

  /* =====================================================
     OPTIONS MODAL
  ===================================================== */

  const openOptionsModal = (row) => {
    if (row.control !== CUSTOM_FIELD_CONTROLS.DROP_DOWN) return;
    setOptionsField(row);
    setOptionForm(EMPTY_OPTION_FORM);
    setEditingOption(null);
    setOptionsError("");
    setIsOptionsModalOpen(true);
  };

  const closeOptionsModal = async () => {
    setIsOptionsModalOpen(false);
    setOptionsField(null);
    setOptionForm(EMPTY_OPTION_FORM);
    setEditingOption(null);
    setOptionsError("");
    if (selectedForm) {
      await fetchFields(selectedForm);
    }
  };

  const refreshOptionsField = async () => {
    if (!optionsField?.formName && !selectedForm) return;

    const formName = optionsField?.formName || selectedForm;
    const response = await getCustomFieldsByForm(formName);
    const list = Array.isArray(response?.data) ? response.data : [];
    setFields(list);

    const updated = list.find((f) => f.id === optionsField.id);
    if (updated) {
      setOptionsField(updated);
    }
  };

  const handleOptionFormChange = (e) => {
    const { name, value } = e.target;
    setOptionForm((prev) => ({ ...prev, [name]: value }));
  };

  const startEditOption = (option) => {
    setEditingOption(option);
    setOptionForm({
      label: option.label || "",
      value: option.value || "",
      priority: option.priority ?? 1,
    });
    setOptionsError("");
  };

  const cancelEditOption = () => {
    setEditingOption(null);
    setOptionForm(EMPTY_OPTION_FORM);
    setOptionsError("");
  };

  const handleOptionSubmit = async (e) => {
    e.preventDefault();
    if (!canManage) return;

    const label = optionForm.label.trim();
    const value = optionForm.value.trim();
    const priority = Number(optionForm.priority) || 1;

    if (!label || !value) {
      setOptionsError("Label and value are required.");
      return;
    }

    if (!optionsField?.id) return;

    try {
      setOptionsSaving(true);
      setOptionsError("");

      if (editingOption) {
        await updateCustomFieldOption(optionsField.id, editingOption.id, {
          label,
          value,
          priority,
        });
      } else {
        await addCustomFieldOption(optionsField.id, {
          label,
          value,
          priority,
        });
      }

      setOptionForm(EMPTY_OPTION_FORM);
      setEditingOption(null);
      await refreshOptionsField();
    } catch (err) {
      console.error("Option save failed:", err);
      setOptionsError(getErrorMessage(err, "Failed to save option."));
    } finally {
      setOptionsSaving(false);
    }
  };

  const handleDeleteOption = async (option) => {
    if (!canManage) return;

    const confirmed = window.confirm(
      `Delete option "${option.label}"?`
    );
    if (!confirmed || !optionsField?.id) return;

    try {
      setOptionsError("");
      await deleteCustomFieldOption(optionsField.id, option.id);
      await refreshOptionsField();
    } catch (err) {
      console.error("Option deletion failed:", err);
      setOptionsError(getErrorMessage(err, "Failed to delete option."));
    }
  };

  /* =====================================================
     TABLE COLUMNS
  ===================================================== */

  const columns = [
    {
      header: "Display Name",
      render: (row) => (
        <div className="cf-field-cell">
          <span className="cf-field-name">{row.displayName}</span>
          <span className="cf-field-key">{row.name}</span>
        </div>
      ),
    },
    {
      header: "Control",
      render: (row) => (
        <span className="cf-control-pill">{row.control}</span>
      ),
    },
    {
      header: "Data Type",
      accessor: "dataType",
    },
    {
      header: "Priority",
      accessor: "priority",
    },
    {
      header: "Options",
      render: (row) =>
        row.control === CUSTOM_FIELD_CONTROLS.DROP_DOWN
          ? `${row.options?.length || 0} option(s)`
          : "—",
    },
    {
      header: "Status",
      render: (row) => (
        <StatusBadge status={row.isActive === false ? "inactive" : "active"} />
      ),
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="cf-row-actions">
          {row.control === CUSTOM_FIELD_CONTROLS.DROP_DOWN && (
            <button
              type="button"
              className="cf-action-btn options"
              onClick={() => openOptionsModal(row)}
              title="Manage options"
            >
              <List size={15} />
              Options
            </button>
          )}

          {canManage && (
            <>
              <button
                type="button"
                className="cf-action-btn edit"
                onClick={() => openEditModal(row)}
                title="Edit"
              >
                <Pencil size={15} />
                Edit
              </button>

              <button
                type="button"
                className="cf-action-btn delete"
                onClick={() => handleDeleteField(row)}
                title="Delete"
              >
                <Trash2 size={15} />
                Delete
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="cf-page">
      <div className="cf-header">
        <div className="cf-title-section">
          <h1>Custom Fields</h1>
          <p>
            Build dynamic form fields (TextBox / DropDown) and manage dropdown
            options per form.
          </p>
        </div>

        <div className="cf-actions">
          <div className="cf-search">
            <Search className="cf-search-icon" />
            <Input
              placeholder="Search fields..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button
            variant="primary"
            size="md"
            className="cf-add-btn"
            onClick={openAddModal}
            disabled={!canManage}
            title={
              canManage
                ? "Add Field"
                : "Only admin, management, or principal can manage custom fields"
            }
          >
            <Plus size={17} />
            Add Field
          </Button>
        </div>
      </div>

      <div className="cf-form-bar">
        <label className="cf-form-label" htmlFor="cf-form-select">
          Form
        </label>

        <select
          id="cf-form-select"
          className="cf-form-select"
          value={selectedForm}
          onChange={(e) => setSelectedForm(e.target.value)}
          disabled={formsLoading || forms.length === 0}
        >
          {forms.length === 0 ? (
            <option value="">No forms yet — add a field to create one</option>
          ) : (
            forms.map((formName) => (
              <option key={formName} value={formName}>
                {formName}
              </option>
            ))
          )}
        </select>
      </div>

      {error && !isFieldModalOpen && !isOptionsModalOpen && (
        <div className="cf-alert">{error}</div>
      )}

      {success && !isFieldModalOpen && !isOptionsModalOpen && (
        <div className="cf-alert success">{success}</div>
      )}

      <div className="cf-table-card">
        <div className="cf-table-header">
          <h2>
            {selectedForm
              ? `Fields — ${selectedForm}`
              : "Custom Fields"}
          </h2>
        </div>

        <div className="cf-table-body">
          {formsLoading || loading ? (
            <div className="cf-loading">Loading custom fields...</div>
          ) : !selectedForm ? (
            <div className="cf-empty">
              No custom fields yet. Click &quot;Add Field&quot; to create one.
            </div>
          ) : filteredFields.length === 0 ? (
            <div className="cf-empty">No fields found for this form.</div>
          ) : (
            <DataTable columns={columns} data={filteredFields} />
          )}
        </div>
      </div>

      {/* ADD / EDIT FIELD MODAL */}
      <Modal
        isOpen={isFieldModalOpen}
        onClose={closeFieldModal}
        title={editingField ? "Edit Custom Field" : "Add Custom Field"}
        size="lg"
      >
        <form className="cf-form" onSubmit={handleFieldSubmit}>
          {error && <div className="cf-alert">{error}</div>}

          {!editingField && (
            <>
              <div className="cf-form-group">
                <label className="cf-form-label">
                  Form Name
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="formName"
                  list="cf-form-name-suggestions"
                  value={fieldForm.formName}
                  onChange={handleFieldChange}
                  placeholder='e.g. "More Information"'
                  className="cf-form-input"
                  required
                />
                <datalist id="cf-form-name-suggestions">
                  {forms.map((formName) => (
                    <option key={formName} value={formName} />
                  ))}
                </datalist>
                <small>Groups fields under a named form.</small>
              </div>

              <div className="cf-form-group">
                <label className="cf-form-label">
                  Field Name (key)
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={fieldForm.name}
                  onChange={handleFieldChange}
                  placeholder='e.g. "Category"'
                  className="cf-form-input"
                  required
                />
                <small>Internal unique key within the form.</small>
              </div>
            </>
          )}

          <div className="cf-form-group">
            <label className="cf-form-label">
              Display Name
              <span className="required">*</span>
            </label>
            <input
              type="text"
              name="displayName"
              value={fieldForm.displayName}
              onChange={handleFieldChange}
              placeholder='e.g. "Student Category"'
              className="cf-form-input"
              required
            />
          </div>

          <div className="cf-form-row">
            <div className="cf-form-group">
              <label className="cf-form-label">
                Control
                <span className="required">*</span>
              </label>
              <select
                name="control"
                value={fieldForm.control}
                onChange={handleFieldChange}
                className="cf-form-input"
                required
              >
                {CUSTOM_FIELD_CONTROL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="cf-form-group">
              <label className="cf-form-label">Data Type</label>
              <input
                type="text"
                name="dataType"
                value={fieldForm.dataType}
                onChange={handleFieldChange}
                placeholder="text"
                className="cf-form-input"
              />
            </div>
          </div>

          <div className="cf-form-row">
            <div className="cf-form-group">
              <label className="cf-form-label">Priority</label>
              <input
                type="number"
                name="priority"
                min={1}
                value={fieldForm.priority}
                onChange={handleFieldChange}
                className="cf-form-input"
              />
            </div>

            <div className="cf-form-group">
              <label className="cf-form-label">Max Length</label>
              <input
                type="number"
                name="maxLength"
                min={1}
                value={fieldForm.maxLength}
                onChange={handleFieldChange}
                placeholder="Optional"
                className="cf-form-input"
              />
            </div>
          </div>

          {editingField && (
            <label className="cf-checkbox">
              <input
                type="checkbox"
                name="isActive"
                checked={Boolean(fieldForm.isActive)}
                onChange={handleFieldChange}
              />
              Active
            </label>
          )}

          {!editingField && fieldForm.control === CUSTOM_FIELD_CONTROLS.DROP_DOWN && (
            <div className="cf-options-builder">
              <div className="cf-options-builder-header">
                <h3>Dropdown Options</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCreateOptionRow}
                >
                  <Plus size={14} />
                  Add Option
                </Button>
              </div>

              {createOptions.map((opt, index) => (
                <div key={index} className="cf-option-row">
                  <input
                    type="text"
                    placeholder="Label"
                    value={opt.label}
                    onChange={(e) =>
                      handleCreateOptionChange(index, "label", e.target.value)
                    }
                    className="cf-form-input"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={opt.value}
                    onChange={(e) =>
                      handleCreateOptionChange(index, "value", e.target.value)
                    }
                    className="cf-form-input"
                  />
                  <input
                    type="number"
                    placeholder="#"
                    min={1}
                    value={opt.priority}
                    onChange={(e) =>
                      handleCreateOptionChange(
                        index,
                        "priority",
                        e.target.value
                      )
                    }
                    className="cf-form-input cf-priority-input"
                  />
                  <button
                    type="button"
                    className="cf-option-remove"
                    onClick={() => removeCreateOptionRow(index)}
                    title="Remove"
                    disabled={createOptions.length === 1}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <small>Optional on create — you can also manage options later.</small>
            </div>
          )}

          <div className="cf-modal-actions">
            <Button type="button" variant="outline" onClick={closeFieldModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {editingField ? "Update Field" : "Create Field"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MANAGE OPTIONS MODAL */}
      <Modal
        isOpen={isOptionsModalOpen}
        onClose={closeOptionsModal}
        title={`Options — ${optionsField?.displayName || optionsField?.name || ""}`}
        size="lg"
      >
        <div className="cf-options-modal">
          {optionsError && <div className="cf-alert">{optionsError}</div>}

          {canManage && (
            <form className="cf-form" onSubmit={handleOptionSubmit}>
              <div className="cf-option-row">
                <input
                  type="text"
                  name="label"
                  value={optionForm.label}
                  onChange={handleOptionFormChange}
                  placeholder="Label"
                  className="cf-form-input"
                  required
                />
                <input
                  type="text"
                  name="value"
                  value={optionForm.value}
                  onChange={handleOptionFormChange}
                  placeholder="Value"
                  className="cf-form-input"
                  required
                />
                <input
                  type="number"
                  name="priority"
                  min={1}
                  value={optionForm.priority}
                  onChange={handleOptionFormChange}
                  className="cf-form-input cf-priority-input"
                />
              </div>

              <div className="cf-modal-actions">
                {editingOption && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelEditOption}
                  >
                    Cancel Edit
                  </Button>
                )}
                <Button type="submit" variant="primary" loading={optionsSaving}>
                  {editingOption ? "Update Option" : "Add Option"}
                </Button>
              </div>
            </form>
          )}

          <div className="cf-options-list">
            {(optionsField?.options || []).length === 0 ? (
              <div className="cf-empty">No options yet.</div>
            ) : (
              <table className="cf-options-table">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Value</th>
                    <th>Priority</th>
                    {canManage && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {optionsField.options.map((option) => (
                    <tr key={option.id}>
                      <td>{option.label}</td>
                      <td>{option.value}</td>
                      <td>{option.priority}</td>
                      {canManage && (
                        <td>
                          <div className="cf-row-actions">
                            <button
                              type="button"
                              className="cf-action-btn edit"
                              onClick={() => startEditOption(option)}
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              className="cf-action-btn delete"
                              onClick={() => handleDeleteOption(option)}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
