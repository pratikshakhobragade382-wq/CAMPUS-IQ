/**
 * Staff API — mirrors backend/src/modules/staff
 *
 * Routes (baseURL = /api/v1 via axiosClient):
 *   GET /staff/:id
 *
 * JWT Authorization is attached by axiosClient.
 * Do NOT send tenantId — backend uses req.user.tenantId.
 */

import axiosClient from "./axios";

/**
 * GET /staff/:id
 * Backend response: { success, message, data: staff }
 * staff includes department, subjects, address, otherDetails, spouse, children, user
 */
export const getStaffById = async (id) => {
  const response = await axiosClient.get(`/staff/${id}`);
  return response.data;
};

/**
 * GET /staff
 * Backend response: { success, message, data: staff[], pagination }
 */
export const getAllStaff = async (params = {}) => {
  const response = await axiosClient.get('/staff', { params });
  return response.data;
};
