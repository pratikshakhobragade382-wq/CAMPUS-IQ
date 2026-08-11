/**
 * Section API endpoints
 * Matches backend:
 *   /api/v1/sections
 *   /api/v1/classes/:classId/sections
 */

import axiosClient from "./axiosClient";

/**
 * Get all sections
 * GET /sections
 * Response: { success: true, data: Section[] }
 */
export const getAllSections = async () => {
  const response = await axiosClient.get("/sections");
  return response.data;
};

/**
 * Get section by ID
 * GET /sections/:id
 * Response: { success: true, data: Section }
 */
export const getSectionById = async (id) => {
  const response = await axiosClient.get(`/sections/${id}`);
  return response.data;
};

/**
 * Get sections for a specific class
 * GET /classes/:classId/sections
 * Response: { success: true, data: Section[] }
 */
export const getSections = async (classId) => {
  const response = await axiosClient.get(`/classes/${classId}/sections`);
  return response.data;
};

/**
 * Get sections for a specific class (alias)
 * GET /classes/:classId/sections
 */
export const getSectionsByClass = async (classId) => {
  const response = await axiosClient.get(`/classes/${classId}/sections`);
  return response.data;
};

/**
 * Create a section under a class (used by Class module)
 * POST /classes/:classId/sections
 * Body: { name }
 */
export const createSection = async (classId, data) => {
  const response = await axiosClient.post(
    `/classes/${classId}/sections`,
    data
  );
  return response.data;
};

/**
 * Create a section via top-level endpoint
 * POST /sections
 * Body: { name, classId }
 * Response: { success: true, data: Section }
 */
export const createSectionRecord = async (data) => {
  const response = await axiosClient.post("/sections", data);
  return response.data;
};

/**
 * Update section
 * PUT /sections/:id
 * Body: { name?, classId? } (at least one required)
 * Response: { success: true, data: Section }
 */
export const updateSection = async (id, data) => {
  const response = await axiosClient.put(`/sections/${id}`, data);
  return response.data;
};

/**
 * Delete section (soft delete)
 * DELETE /sections/:id
 * Response: { success: true, message: "Deleted successfully" }
 */
export const deleteSection = async (id) => {
  const response = await axiosClient.delete(`/sections/${id}`);
  return response.data;
};
