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
 * - Search by:
 *   - Student Name
 *   - Admission Number
 *   - GR Number
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

  if (search !== undefined && search !== null) {
    const cleanSearch = String(search).trim();

    if (cleanSearch) {
      params.search = cleanSearch;
    }
  }

  if (classId !== undefined && classId !== null && classId !== "") {
    params.classId = classId;
  }

  if (gender !== undefined && gender !== null && gender !== "") {
    params.gender = gender;
  }

  console.log("GET /students params:", params);

  const response = await axiosClient.get(
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
   Backend controller returns:

   {
     success: true,
     message: "Students fetched successfully",
     data: {
       students: [...],
       pagination: {...}
     }
   }

   Return only `data` so callers receive:

   {
     students: [...],
     pagination: {...}
   }
  */

  return response.data?.data || {
    students: [],
    pagination: {
      total: 0,
      page,
      limit,
      totalPages: 0,
    },
  };
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
export const updateStudent = async (
  id,
  data
) => {
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