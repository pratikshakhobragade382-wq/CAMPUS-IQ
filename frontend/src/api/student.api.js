/**
 * Student API
 */

import axiosClient from "./axios";

/**
 * GET /students
 *
 * Used for:
 * - Admin student list
 * - Teacher student list
 * - Class filter
 * - Search by:
 *   - Student Name
 *   - Admission Number
 *   - GR Number
 *
 * IMPORTANT:
 * The Student.jsx and TeacherStudents.jsx pages expect
 * an Axios-style response where:
 *
 * response.data.students
 * response.data.pagination
 *
 * Therefore this function returns:
 *
 * {
 *   data: {
 *     students: [...],
 *     pagination: {...}
 *   }
 * }
 *
 * instead of returning response.data.data directly.
 */
export const getStudents = async ({
  page = 1,
  limit = 10,
  search = "",
  classId,
  gender,
} = {}) => {
  const params = {
    page,
    limit,
  };

  // ---------------------------------------------------
  // SEARCH
  // ---------------------------------------------------

  if (
    search !== undefined &&
    search !== null
  ) {
    const cleanSearch =
      String(search).trim();

    if (cleanSearch) {
      params.search = cleanSearch;
    }
  }

  // ---------------------------------------------------
  // CLASS FILTER
  // ---------------------------------------------------

  if (
    classId !== undefined &&
    classId !== null &&
    classId !== ""
  ) {
    params.classId = classId;
  }

  // ---------------------------------------------------
  // GENDER FILTER
  // ---------------------------------------------------

  if (
    gender !== undefined &&
    gender !== null &&
    gender !== ""
  ) {
    params.gender = gender;
  }

  console.log(
    "GET /students params:",
    params
  );

  try {
    const response =
      await axiosClient.get(
        "/students",
        {
          params,
        }
      );

    console.log(
      "GET /students response:",
      response.data
    );

    /*
     * Backend response:
     *
     * {
     *   success: true,
     *   message: "Students fetched successfully",
     *   data: {
     *     students: [...],
     *     pagination: {...}
     *   }
     * }
     *
     * The Admin Student page and Teacher Student
     * page expect:
     *
     * response.data.students
     *
     * So we replace the Axios response's `data`
     * with the backend's nested `data`.
     */

    return {
      ...response,

      data:
        response.data?.data || {
          students: [],

          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        },
    };
  } catch (error) {
    console.error(
      "GET /students failed:",
      error
    );

    throw error;
  }
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
  const response =
    await axiosClient.get(
      `/classes/${classId}/sections/${sectionId}/students`
    );

  return response.data;
};

/**
 * GET /students/:id
 */
export const getStudentById = async (
  id
) => {
  const response =
    await axiosClient.get(
      `/students/${id}`
    );

  return response.data;
};

/**
 * POST /students
 */
export const createStudent = async (
  data
) => {
  const response =
    await axiosClient.post(
      "/students",
      data
    );

  return response.data;
};

/**
 * PUT /students/:id
 */
export const updateStudent = async (
  id,
  data
) => {
  const response =
    await axiosClient.put(
      `/students/${id}`,
      data
    );

  return response.data;
};

/**
 * DELETE /students/:id
 */
export const deleteStudent = async (
  id
) => {
  const response =
    await axiosClient.delete(
      `/students/${id}`
    );

  return response.data;
};