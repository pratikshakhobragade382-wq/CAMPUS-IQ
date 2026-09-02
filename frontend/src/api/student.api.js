/**
 * Student API
 */

import axiosClient from "./axios";

/**
 * GET /students
 *
 * Used for:
 * - All students
 * - Class filter
 * - Search
 */
export const getStudents = async ({
  page = 1,
  limit = 10,
  search = "",
  classId,
} = {}) => {
  const params = {
    page,
    limit,
  };

  if (search?.trim()) {
    params.search = search.trim();
  }

  if (classId) {
    params.classId = classId;
  }

  const response = await axiosClient.get(
    "/students",
    { params }
  );

  return response.data;
};

/**
 * GET /classes/:classId/sections/:sectionId/students
 *
 * Used when a specific section is selected.
 */
export const getStudentsBySection = async (
  classId,
  sectionId
) => {
  const response = await axiosClient.get(
    `/classes/${classId}/sections/${sectionId}/students`
  );

  return response.data;
};

/**
 * GET /students/:id
 */
export const getStudentById = async (id) => {
  const response = await axiosClient.get(
    `/students/${id}`
  );

  return response.data;
};

/**
 * POST /students
 */
export const createStudent = async (data) => {
  const response = await axiosClient.post(
    "/students",
    data
  );

  return response.data;
};

/**
 * PUT /students/:id
 */
export const updateStudent = async (id, data) => {
  const response = await axiosClient.put(
    `/students/${id}`,
    data
  );

  return response.data;
};

/**
 * DELETE /students/:id
 */
export const deleteStudent = async (id) => {
  const response = await axiosClient.delete(
    `/students/${id}`
  );

  return response.data;
};