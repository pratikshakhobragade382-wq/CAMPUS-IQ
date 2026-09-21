/**
 * Student Portal API — mirrors backend/src/modules/student-portal
 *
 * Authenticated student routes (JWT attached by axiosClient).
 * Do NOT send studentId or tenantId — backend uses req.user.
 */

import axiosClient from "./axios";

/**
 * GET /student-portal/profile
 * Backend response: { success: true, data: Student }
 */
export const getMyStudentProfile = async () => {
  const response = await axiosClient.get("/student-portal/profile");
  return response.data;
};
