import axiosClient from "./axios";

/*
============================================================
 COMPLAINT API
 Every backend response is { success, data } so each helper
 returns response.data.data directly.
============================================================
*/

const unwrap = (response) => response.data.data;

export const getErrorMessage = (error, fallback = "Something went wrong.") =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  error?.message ||
  fallback;

/* ---------------- Parent ---------------- */

export const getMyChildren = () =>
  axiosClient.get("/parents/children").then(unwrap);

export const createComplaint = (payload) =>
  axiosClient.post("/complaints", payload).then(unwrap);

export const getMyComplaints = (params) =>
  axiosClient.get("/complaints/my", { params }).then(unwrap);

/* ---------------- Admin ---------------- */

export const getComplaintAnalytics = (range = "30") =>
  axiosClient.get("/complaints/analytics", { params: { range } }).then(unwrap);

export const listComplaints = (params) =>
  axiosClient.get("/complaints", { params }).then(unwrap);

export const getComplaint = (id) =>
  axiosClient.get(`/complaints/${id}`).then(unwrap);

export const updateComplaint = (id, payload) =>
  axiosClient.patch(`/complaints/${id}`, payload).then(unwrap);

export const reanalyzeComplaint = (id) =>
  axiosClient.post(`/complaints/${id}/reanalyze`).then(unwrap);

/* decision: "ACCEPT" | "MODIFY" | "REJECT" */
export const decideSuggestion = (id, payload) =>
  axiosClient.post(`/complaints/${id}/suggestion`, payload).then(unwrap);

/* Returns { reply } and does not save anything */
export const generateReplyDraft = (id, payload) =>
  axiosClient.post(`/complaints/${id}/generate-reply`, payload).then(unwrap);

export const sendComplaintReply = (id, payload) =>
  axiosClient.post(`/complaints/${id}/reply`, payload).then(unwrap);
