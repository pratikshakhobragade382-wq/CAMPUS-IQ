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

/**
 * GET /student-portal/attendance?month=&year=&academicYearId=
 * Backend response: { success: true, data: { records, summary } }
 */
export const getMyAttendance = async (params = {}) => {
  const response = await axiosClient.get("/student-portal/attendance", { params });
  return response.data;
};

/**
 * GET /student-portal/assignments
 * Backend response: { success: true, data: [ { id, title, description, dueDate, maxMarks, attachmentUrl, submission } ] }
 */
export const getMyAssignments = async () => {
  const response = await axiosClient.get("/student-portal/assignments");
  return response.data;
};

/**
 * POST /student-portal/assignments/:assignmentId/submit
 * Backend response: { success: true, data: Submission }
 */
export const submitAssignment = async (assignmentId, body) => {
  const response = await axiosClient.post(
    `/student-portal/assignments/${assignmentId}/submit`,
    body
  );
  return response.data;
};
