import axiosClient from "./axiosClient";

/**
 * Get all departments
 */
export const getDepartments = async () => {
  const response = await axiosClient.get("/departments");
  return response.data;
};

/**
 * Get department by ID
 */
export const getDepartmentById = async (id) => {
  const response = await axiosClient.get(`/departments/${id}`);
  return response.data;
};

/**
 * Create department
 */
export const createDepartment = async (data) => {
  const response = await axiosClient.post("/departments", data);
  return response.data;
};

/**
 * Update department
 */
export const updateDepartment = async (id, data) => {
  const response = await axiosClient.put(
    `/departments/${id}`,
    data
  );

  return response.data;
};

/**
 * Delete department
 */
export const deleteDepartment = async (id) => {
  const response = await axiosClient.delete(
    `/departments/${id}`
  );

  return response.data;
};