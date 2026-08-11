/**
 * Exam API — mirrors backend/src/modules/exam
 *
 * Routes (baseURL = /api/v1 via axiosClient):
 *   POST   /exams
 *   GET    /exams
 *   GET    /exams/:id
 *   PUT    /exams/:id
 *   DELETE /exams/:id
 *   POST   /exams/:examId/marks
 *   GET    /exams/:examId/marks
 *   GET    /exams/students/:studentId/report
 *
 * JWT Authorization is attached by axiosClient.
 * Do NOT send tenantId — backend uses req.user.tenantId.
 */

import axiosClient from './axiosClient';

/**
 * GET /exams
 * Query: academicYearId, classId, examType, includeInactive
 * Response: { success, message, data: Exam[] }
 */
export const getExams = async (params = {}) => {
  const query = {};
  if (params.academicYearId) query.academicYearId = params.academicYearId;
  if (params.classId) query.classId = params.classId;
  if (params.examType) query.examType = params.examType;
  if (params.includeInactive === true || params.includeInactive === 'true') {
    query.includeInactive = 'true';
  }

  const response = await axiosClient.get('/exams', { params: query });
  return response.data;
};

/**
 * GET /exams/:id
 * Query: includeInactive
 * Response: { success, message, data: { exam, summary } }
 */
export const getExamById = async (id, params = {}) => {
  const query = {};
  if (params.includeInactive === true || params.includeInactive === 'true') {
    query.includeInactive = 'true';
  }

  const response = await axiosClient.get(`/exams/${id}`, { params: query });
  return response.data;
};

/**
 * POST /exams (admin only)
 * Body: { academicYearId, name, examType, classId, startDate, endDate }
 * Response: { success, message, data: Exam }
 */
export const createExam = async (data) => {
  const response = await axiosClient.post('/exams', data);
  return response.data;
};

/**
 * PUT /exams/:id (admin only)
 * Body (all optional): { name, examType, startDate, endDate, isActive }
 * Response: { success, message, data: Exam }
 */
export const updateExam = async (id, data) => {
  const response = await axiosClient.put(`/exams/${id}`, data);
  return response.data;
};

/**
 * DELETE /exams/:id (admin only)
 * Soft-deactivates if marks exist; otherwise hard-deletes.
 * Response: { success, message }
 */
export const deleteExam = async (id) => {
  const response = await axiosClient.delete(`/exams/${id}`);
  return response.data;
};

/**
 * POST /exams/:examId/marks (admin or teacher)
 * Body: { subjectId, maxMarks, records: [{ studentId, marksObtained?, isAbsent?, grade?, remark? }] }
 * Response: { success, message, data: { message, count } }
 */
export const bulkEnterMarks = async (examId, data) => {
  const response = await axiosClient.post(`/exams/${examId}/marks`, data);
  return response.data;
};

/**
 * GET /exams/:examId/marks (admin or teacher)
 * Query: subjectId
 * Response: { success, message, data: ExamMark[] }
 */
export const getExamMarks = async (examId, params = {}) => {
  const query = {};
  if (params.subjectId) query.subjectId = params.subjectId;

  const response = await axiosClient.get(`/exams/${examId}/marks`, { params: query });
  return response.data;
};

/**
 * GET /exams/students/:studentId/report (admin or teacher)
 * Query: academicYearId
 * Response: { success, message, data: { student, academicYearId, exams } }
 */
export const getStudentReportCard = async (studentId, params = {}) => {
  const query = {};
  if (params.academicYearId) query.academicYearId = params.academicYearId;

  const response = await axiosClient.get(`/exams/students/${studentId}/report`, {
    params: query,
  });
  return response.data;
};
