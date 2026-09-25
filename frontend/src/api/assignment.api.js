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
  const response = await axiosClient.get(
    `/assignments/${id}/submissions`
  );

  return response.data;
};

/**
 * Grade a student's submission
 */
export const gradeSubmission = async (submissionId, data) => {
  const response = await axiosClient.put(
    `/assignments/submissions/${submissionId}/grade`,
    data
  );

  return response.data;
};

/**
 * Upload assignment document
 *
 * Supported by the backend:
 * - PDF
 * - Word (.doc / .docx)
 * - PowerPoint (.ppt / .pptx)
 *
 * IMPORTANT:
 * Axios sends an upload progress EVENT object to onUploadProgress.
 * The old implementation passed that entire object to the React
 * component, which caused:
 *
 * "Objects are not valid as a React child"
 *
 * We convert the event into a normal percentage number here.
 */
export const uploadAssignmentFile = async (
  file,
  onUploadProgress
) => {
  if (!file) {
    throw new Error('No file selected.');
  }

  const formData = new FormData();

  formData.append('file', file);

  const response = await axiosClient.post(
    '/assignments/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },

      onUploadProgress: (event) => {
        let percentage = 0;

        /*
         * Some Axios versions provide:
         *
         * event.progress
         *
         * as a decimal:
         *
         * 0.25 = 25%
         *
         * Other versions provide loaded/total.
         *
         * We support both.
         */

        if (
          typeof event?.progress === 'number' &&
          Number.isFinite(event.progress)
        ) {
          percentage =
            event.progress <= 1
              ? event.progress * 100
              : event.progress;
        } else if (
          typeof event?.loaded === 'number' &&
          typeof event?.total === 'number' &&
          event.total > 0
        ) {
          percentage =
            (event.loaded / event.total) * 100;
        }

        /*
         * Keep the value between 0 and 100.
         */
        percentage = Math.max(
          0,
          Math.min(100, percentage)
        );

        /*
         * Send ONLY a number to React.
         *
         * This is the important fix.
         */
        if (typeof onUploadProgress === 'function') {
          onUploadProgress(Math.round(percentage));
        }
      },
    }
  );

  return response.data;
};

/**
 * Helper to get absolute downloadable/viewable URL
 * for uploaded files.
 *
 * Backend stores assignment files like:
 *
 * /uploads/assignments/example-123456.pdf
 *
 * The backend server runs on:
 *
 * http://localhost:8000
 *
 * Therefore the final URL becomes:
 *
 * http://localhost:8000/uploads/assignments/example-123456.pdf
 */
export const getFileUrl = (url) => {
  if (
    !url ||
    typeof url !== 'string' ||
    !url.trim()
  ) {
    return '#';
  }

  const cleanUrl = url.trim();

  /*
   * Already an absolute URL.
   */
  if (
    cleanUrl.startsWith('http://') ||
    cleanUrl.startsWith('https://') ||
    cleanUrl.startsWith('blob:') ||
    cleanUrl.startsWith('data:')
  ) {
    return cleanUrl;
  }

  /*
   * VITE_API_URL may contain:
   *
   * http://localhost:8000/api/v1
   *
   * We remove /api/v1 because uploaded files are
   * served from:
   *
   * /uploads/...
   */
  const configuredApiUrl =
    import.meta.env.VITE_API_URL;

  const baseUrl = configuredApiUrl
    ? configuredApiUrl.replace(
        /\/api\/v1\/?$/,
        ''
      )
    : 'http://localhost:8000';

  return `${baseUrl}${
    cleanUrl.startsWith('/') ? '' : '/'
  }${cleanUrl}`;
};