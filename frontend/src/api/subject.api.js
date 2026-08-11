/**
 * Subject API — mirrors backend/src/modules/master/subject
 *
 * Routes (baseURL = /api/v1 via axiosClient):
 *   GET /subjects
 *
 * Used by Exam marks entry for subject dropdowns.
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
