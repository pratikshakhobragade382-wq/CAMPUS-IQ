import axiosClient from "./axios";

export const getExamsByClass = async (classId) => {
  const response = await axiosClient.get("/exams", {
    params: { classId },
  });

  const list = response?.data?.data;

  return Array.isArray(list) ? list : [];
};