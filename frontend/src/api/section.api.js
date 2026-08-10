/**
 * Section API endpoints
 */

import axiosClient from "./axiosClient";

/**
 * Get all sections
 * GET /sections
 */
export const getAllSections = async () => {
  const response = await axiosClient.get("/sections");
  return response.data;
};

/**
 * Get sections for a specific class
 * GET /classes/:classId/sections
 */
export const getSections = async (classId) => {
  const response = await axiosClient.get(`/classes/${classId}/sections`);
  return response.data;
};

/**
 * Get sections for a specific class (alias)
 */
export const getSectionsByClass = async (classId) => {
  const response = await axiosClient.get(`/classes/${classId}/sections`);
  return response.data;
};

/**
 * Create a section inside a class
 * POST /classes/:classId/sections
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
 */
export const createSectionRecord = async (data) => {
  const response = await axiosClient.post("/sections", data);
  return response.data;
};

/**
 * Update section
 * PUT /sections/:id
 */
export const updateSection = async (id, data) => {
  const response = await axiosClient.put(`/sections/${id}`, data);
  return response.data;
};

/**
 * Delete section
 * DELETE /sections/:id
 */
export const deleteSection = async (id) => {
  const response = await axiosClient.delete(`/sections/${id}`);
  return response.data;
};
