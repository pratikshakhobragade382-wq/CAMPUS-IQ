/**
 * Master Data API — mirrors backend/src/modules/master-data
 *
 * Routes (baseURL = /api/v1 via axiosClient):
 *   GET    /master-data/valid-categories
 *   GET    /master-data/categories
 *   GET    /master-data/all
 *   GET    /master-data?category=...
 *   POST   /master-data
 *   POST   /master-data/bulk
 *   PUT    /master-data/:id
 *   DELETE /master-data/:id
 *
 * Auth: all endpoints require JWT.
 * Mutating endpoints require identity: admin | management | principal.
 *
 * Response shape: { success, data } — create/update/bulk also include message.
 * Delete: { success, message }
 * Errors: { success: false, error }
 */

import axiosClient from "./axios";

/**
 * GET /master-data/valid-categories
 * Response: { success, data: string[] }
 */
export const getValidCategories = async () => {
  const response = await axiosClient.get("/master-data/valid-categories");
  return response.data;
};

/**
 * GET /master-data/categories
 * Categories that currently have active data for this tenant.
 * Response: { success, data: string[] }
 */
export const getMasterDataCategories = async () => {
  const response = await axiosClient.get("/master-data/categories");
  return response.data;
};

/**
 * GET /master-data/all
 * All active master data grouped by category.
 * Response: { success, data: { [category]: MasterData[] } }
 */
export const getAllMasterData = async () => {
  const response = await axiosClient.get("/master-data/all");
  return response.data;
};

/**
 * GET /master-data?category=BloodGroup
 * Active values for one category (category query param required).
 * Response: { success, data: MasterData[] }
 */
export const getMasterDataByCategory = async (category) => {
  const response = await axiosClient.get("/master-data", {
    params: { category },
  });
  return response.data;
};

/**
 * POST /master-data
 * Body: { category: string, value: string }
 * Response: { success, message, data } — 201
 * Conflict: 409 when value already exists in category
 */
export const createMasterData = async (data) => {
  const response = await axiosClient.post("/master-data", data);
  return response.data;
};

/**
 * POST /master-data/bulk
 * Body: { category: string, values: string[] }
 * Response: { success, message, data: MasterData[] } — 201
 */
export const bulkCreateMasterData = async (data) => {
  const response = await axiosClient.post("/master-data/bulk", data);
  return response.data;
};

/**
 * PUT /master-data/:id
 * Body: { value?: string, isActive?: boolean }
 * Response: { success, message, data }
 */
export const updateMasterData = async (id, data) => {
  const response = await axiosClient.put(`/master-data/${id}`, data);
  return response.data;
};

/**
 * DELETE /master-data/:id
 * Hard-deletes the record.
 * Response: { success, message }
 */
export const deleteMasterData = async (id) => {
  const response = await axiosClient.delete(`/master-data/${id}`);
  return response.data;
};
