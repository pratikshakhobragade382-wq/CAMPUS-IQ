import axiosClient from "./axios";

/**
 * Get all academic years
 */
export const getAcademicYears = async () => {
  const response = await axiosClient.get("/academic-years");
  return response.data;
};

/**
 * Get currently active academic year
 */
export const getActiveAcademicYear = async () => {
  const response = await axiosClient.get("/academic-years/active");
  return response.data;
};

/**
 * Create academic year
 *
 * Academic year name is NOT entered by the user.
 * Backend should generate it automatically.
 */
export const createAcademicYear = async ({
  startDate,
  endDate,
  isActive = false,
}) => {
  const response = await axiosClient.post("/academic-years", {
    startDate,
    endDate,
    isActive,
  });

  return response.data;
};

/**
 * Update academic year
 */
export const updateAcademicYear = async (id, data) => {
  const response = await axiosClient.put(
    `/academic-years/${id}`,
    data
  );

  return response.data;
};

/**
 * Activate academic year
 */
export const activateAcademicYear = async (id) => {
  const response = await axiosClient.patch(
    `/academic-years/${id}/activate`
  );

  return response.data;
};

/**
 * Delete academic year
 */
export const deleteAcademicYear = async (id) => {
  const response = await axiosClient.delete(
    `/academic-years/${id}`
  );

  return response.data;
};