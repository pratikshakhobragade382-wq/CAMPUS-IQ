/**
 * Class API endpoints
 */

import api from "./axios";

/**
 * Get all classes
 */
export const getClasses = async () => {
  const response = await api.get("/classes");
  return response.data;
};

/**
 * Get a single class by ID
 */
export const getClassById = async (id) => {
  const response = await api.get(`/classes/${id}`);
  return response.data;
};

/**
 * Create a new class
 */
export const createClass = async (data) => {
  const response = await api.post("/classes", data);
  return response.data;
};

/**
 * Update class
 */
export const updateClass = async (id, data) => {
  const response = await api.put(`/classes/${id}`, data);
  return response.data;
};

/**
 * Delete class
 */
export const deleteClass = async (id) => {
  const response = await api.delete(`/classes/${id}`);
  return response.data;
};
