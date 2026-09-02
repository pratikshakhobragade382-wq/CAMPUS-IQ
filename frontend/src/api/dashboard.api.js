/**
 * Dashboard API — mirrors backend/src/modules/dashboard
 * GET /dashboard/summary
 * GET /dashboard/teacher-summary
 */
import axiosClient from "./axios";

export const getDashboardSummary = async () => {
  const response = await axiosClient.get("/dashboard/summary");
  return response.data;
};

export const getTeacherDashboardSummary = async () => {
  const response = await axiosClient.get("/dashboard/teacher-summary");
  return response.data;
};