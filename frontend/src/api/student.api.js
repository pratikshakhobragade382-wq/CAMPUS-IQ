/**
 * Student API — mirrors backend/src/modules/student
 *
 * Routes (baseURL = /api/v1 via axiosClient):
 *   GET    /students
 *   GET    /students/:id
 *   POST   /students
 *   PUT    /students/:id
 *   DELETE /students/:id
 *
 * JWT Authorization is attached by axiosClient.
 * Do NOT send tenantId — backend uses req.user.tenantId.
 */

import axiosClient from "./axios";

/**
 * GET /students
 * Query: page, limit, search, classId, gender
 *
 * Backend response:
 * {
 *   success, message,
 *   data: { students: [], pagination: { total, page, limit, totalPages } }
 * }
 */
export const getStudents = async ({
  page = 1,
  limit = 10,
  search = "",
  classId,
  gender,
} = {}) => {
  const params = { page, limit };

  if (search?.trim()) params.search = search.trim();
  if (classId) params.classId = classId;
  if (gender) params.gender = gender;

  const response = await axiosClient.get("/students", { params });
  return response.data;
};

/**
 * GET /students/:id
 * Backend response: { success, message, data: student }
 * student includes class, section, parents
 */
export const getStudentById = async (id) => {
  const response = await axiosClient.get(`/students/${id}`);
  return response.data;
};

/**
 * POST /students
 * Backend response: { success, message, data: { ...student, parentCredentials } }
 */
export const createStudent = async (data) => {
  const response = await axiosClient.post("/students", data);
  return response.data;
};

/**
 * PUT /students/:id
 * Backend response: { success, message, data: { ...student, parentCredentials } }
 */
export const updateStudent = async (id, data) => {
  const response = await axiosClient.put(`/students/${id}`, data);
  return response.data;
};

/**
 * DELETE /students/:id
 * Soft delete (isDeleted = true)
 * Backend response: { success, message }
 */
export const deleteStudent = async (id) => {
  const response = await axiosClient.delete(`/students/${id}`);
  return response.data;
};
