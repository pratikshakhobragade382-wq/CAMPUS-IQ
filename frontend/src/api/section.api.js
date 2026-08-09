/**
 * Section API endpoints
 */

import api from "./axios";

/**
 * Get sections for a specific class
 *
 * Backend:
 * GET /classes/:classId/sections
 */
export const getSections = async (classId) => {
  const response = await api.get(`/classes/${classId}/sections`);
  return response.data;
};

/**
 * Get sections for a specific class
 */
export const getSectionsByClass = async (classId) => {
  const response = await api.get(`/classes/${classId}/sections`);
  return response.data;
};

/**
 * Create a section inside a class
 *
 * Backend:
 * POST /classes/:classId/sections
 */
export const createSection = async (classId, data) => {
  const response = await api.post(
    `/classes/${classId}/sections`,
    data
  );

  return response.data;
};