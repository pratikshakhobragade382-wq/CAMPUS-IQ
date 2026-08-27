/**
 * Settings API — mirrors backend/src/modules/settings
 *
 * Teacher-accessible routes (JWT attached by axiosClient):
 *   GET  /settings/profile
 *   PUT  /settings/profile
 *   PUT  /settings/password
 *
 * Admin-only routes (/settings/school, /settings/preferences) are not used here.
 * Do NOT send tenantId — backend uses req.user.tenantId.
 */

import axiosClient from "./axios";

/**
 * GET /settings/profile
 * Backend response: { success: true, data: { id, name, email, phone, avatarUrl, identity } }
 */
export const getSettingsProfile = async () => {
  const response = await axiosClient.get("/settings/profile");
  return response.data;
};

/**
 * PUT /settings/profile
 * Body (optional fields): { name, email, phone, avatarUrl }
 * Backend response: { success: true, data: { id, name, email, phone, avatarUrl, identity } }
 */
export const updateSettingsProfile = async (payload) => {
  const response = await axiosClient.put("/settings/profile", payload);
  return response.data;
};

/**
 * PUT /settings/password
 * Body: { currentPassword, newPassword }
 * Backend response: { success: true, data: { success: true } }
 */
export const changeSettingsPassword = async ({ currentPassword, newPassword }) => {
  const response = await axiosClient.put("/settings/password", {
    currentPassword,
    newPassword,
  });
  return response.data;
};
