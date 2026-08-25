import axiosClient from "./axios";

/**
 * Custom Fields API
 * Base: /api/v1/custom-fields
 *
 * Matches backend routes in:
 * backend/src/modules/custom-fields/custom-fields.routes.js
 */

/** Get all form names that have custom fields */
export const getCustomFieldForms = async () => {
  const response = await axiosClient.get("/custom-fields/forms");
  return response.data;
};

/**
 * Get custom fields by form name (includes dropdown options)
 * @param {string} formName
 */
export const getCustomFieldsByForm = async (formName) => {
  const response = await axiosClient.get("/custom-fields", {
    params: { formName },
  });
  return response.data;
};

/**
 * Create a custom field (with optional dropdown options)
 * Body: { formName, name, displayName, control, dataType?, priority?, maxLength?, options? }
 * control: "TextBox" | "DropDown"
 */
export const createCustomField = async (data) => {
  const response = await axiosClient.post("/custom-fields", data);
  return response.data;
};

/**
 * Update a custom field
 * Body: { displayName?, control?, dataType?, priority?, maxLength?, isActive? }
 */
export const updateCustomField = async (id, data) => {
  const response = await axiosClient.put(`/custom-fields/${id}`, data);
  return response.data;
};

/** Delete a custom field and all its options */
export const deleteCustomField = async (id) => {
  const response = await axiosClient.delete(`/custom-fields/${id}`);
  return response.data;
};

/**
 * Add a single dropdown option
 * Body: { label, value, priority? }
 */
export const addCustomFieldOption = async (fieldId, data) => {
  const response = await axiosClient.post(
    `/custom-fields/${fieldId}/options`,
    data
  );
  return response.data;
};

/**
 * Bulk add dropdown options
 * Body: { options: [{ label, value, priority? }] }
 */
export const bulkAddCustomFieldOptions = async (fieldId, options) => {
  const response = await axiosClient.post(
    `/custom-fields/${fieldId}/options/bulk`,
    { options }
  );
  return response.data;
};

/**
 * Update a dropdown option
 * Body: { label?, value?, priority?, isActive? }
 */
export const updateCustomFieldOption = async (fieldId, optionId, data) => {
  const response = await axiosClient.put(
    `/custom-fields/${fieldId}/options/${optionId}`,
    data
  );
  return response.data;
};

/** Delete a dropdown option */
export const deleteCustomFieldOption = async (fieldId, optionId) => {
  const response = await axiosClient.delete(
    `/custom-fields/${fieldId}/options/${optionId}`
  );
  return response.data;
};

/**
 * Save custom field values for a student
 * Body: { studentId, values: [{ customFieldId, value }] }
 */
export const saveCustomFieldValues = async (data) => {
  const response = await axiosClient.post("/custom-fields/values", data);
  return response.data;
};

/** Get all custom field values for a student */
export const getCustomFieldValues = async (studentId) => {
  const response = await axiosClient.get(
    `/custom-fields/values/${studentId}`
  );
  return response.data;
};
