import axiosClient from "./axios";

/**
 * Get all linked children for the logged-in parent
 */
export const getMyChildren = async () => {
  const response = await axiosClient.get("/parents/children");
  return response.data;
};

/**
 * Get full profile of a specific child
 */
export const getChildProfile = async (studentId) => {
  const response = await axiosClient.get(
    `/parents/children/${studentId}`
  );
  return response.data;
};

/**
 * Get attendance records for a child
 *
 * @param {number} studentId
 * @param {object} filters — { month, year, academicYearId }
 */
export const getChildAttendance = async (studentId, filters = {}) => {
  const params = {};

  if (filters.month) params.month = filters.month;
  if (filters.year) params.year = filters.year;
  if (filters.academicYearId) params.academicYearId = filters.academicYearId;

  const response = await axiosClient.get(
    `/parents/children/${studentId}/attendance`,
    { params }
  );

  return response.data;
};

/**
 * Get assignments for a child
 */
export const getChildAssignments = async (studentId) => {
  const response = await axiosClient.get(
    `/parents/children/${studentId}/assignments`
  );
  return response.data;
};
