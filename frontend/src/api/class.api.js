/**
 * Class API endpoints
 */

import axiosClient from "./axios";

/**
 * Get all classes
 * GET /classes
 */
export const getClasses = async () => {
  const response = await axiosClient.get("/classes");
  return response.data;
};

/**
 * Get a single class by ID
 * GET /classes/:id
 */
export const getClassById = async (id) => {
  const response = await axiosClient.get(`/classes/${id}`);
  return response.data;
};

/**
 * Create a new class
 * POST /classes
 */
export const createClass = async (data) => {
  const response = await axiosClient.post("/classes", data);
  return response.data;
};

/**
 * Update class
 * PUT /classes/:id
 */
export const updateClass = async (id, data) => {
  const response = await axiosClient.put(`/classes/${id}`, data);
  return response.data;
};

/**
 * Delete class
 * DELETE /classes/:id
 */
export const deleteClass = async (id) => {
  const response = await axiosClient.delete(`/classes/${id}`);
  return response.data;
};
