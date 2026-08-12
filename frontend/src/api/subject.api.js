/**
 * Subject API — mirrors backend/src/modules/master/subject
 *
 * Routes (baseURL = /api/v1 via axiosClient):
 *   GET    /subjects
 *   GET    /subjects/:id
 *   POST   /subjects
 *   PUT    /subjects/:id
 *   DELETE /subjects/:id
 *
 * Auth: all endpoints require JWT.
 * Mutating endpoints require identity: admin | management | principal.
 *
 * Response shape: { success, data } or { success, message } on delete.
 */

import axiosClient from './axiosClient';

/**
 * GET /subjects
 * Response: { success, data: Subject[] }
 */
export const getSubjects = async () => {
  const response = await axiosClient.get('/subjects');
  return response.data;
};

/**
 * GET /subjects/:id
 * Response: { success, data: Subject }
 */
export const getSubjectById = async (id) => {
  const response = await axiosClient.get(`/subjects/${id}`);
  return response.data;
};

/**
 * POST /subjects
 * Body: { name: string, code: string }
 * Response: { success, data: Subject } — 201
 */
export const createSubject = async (data) => {
  const response = await axiosClient.post('/subjects', data);
  return response.data;
};

/**
 * PUT /subjects/:id
 * Body: { name?: string, code?: string } — at least one required
 * Response: { success, data: Subject }
 */
export const updateSubject = async (id, data) => {
  const response = await axiosClient.put(`/subjects/${id}`, data);
  return response.data;
};

/**
 * DELETE /subjects/:id
 * Soft-deletes (isDeleted: true) on the backend.
 * Response: { success, message }
 */
export const deleteSubject = async (id) => {
  const response = await axiosClient.delete(`/subjects/${id}`);
  return response.data;
};
