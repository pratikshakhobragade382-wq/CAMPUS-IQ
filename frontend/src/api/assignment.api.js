import axiosClient from './axios';

/**
 * Get all assignments (optional filters: classId, subjectId, teacherId)
 */
export const getAssignments = async (params = {}) => {
  const response = await axiosClient.get('/assignments', { params });
  return response.data;
};

/**
 * Get single assignment details
 */
export const getAssignmentById = async (id) => {
  const response = await axiosClient.get(`/assignments/${id}`);
  return response.data;
};

/**
 * Create a new assignment
 */
export const createAssignment = async (data) => {
  const response = await axiosClient.post('/assignments', data);
  return response.data;
};

/**
 * Update an existing assignment
 */
export const updateAssignment = async (id, data) => {
  const response = await axiosClient.put(`/assignments/${id}`, data);
  return response.data;
};

/**
 * Delete an assignment
 */
export const deleteAssignment = async (id) => {
  const response = await axiosClient.delete(`/assignments/${id}`);
  return response.data;
};

/**
 * Get submissions for an assignment
 */
export const getAssignmentSubmissions = async (id) => {
  const response = await axiosClient.get(`/assignments/${id}/submissions`);
  return response.data;
};

/**
 * Grade a student's submission
 */
export const gradeSubmission = async (submissionId, data) => {
  const response = await axiosClient.put(`/assignments/submissions/${submissionId}/grade`, data);
  return response.data;
};

/**
 * Upload assignment document (PDF, Word, PPT)
 */
export const uploadAssignmentFile = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosClient.post('/assignments/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data;
};

/**
 * Helper to get absolute downloadable/viewable URL for uploaded files
 */
export const getFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '')
    : 'http://localhost:8000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

