/**
 * Dashboard API — mirrors backend/src/modules/dashboard
 * GET /dashboard/summary
 */
import axiosClient from "./axios";

export const getDashboardSummary = async () => {
  const response = await axiosClient.get("/dashboard/summary");
  return response.data;
};