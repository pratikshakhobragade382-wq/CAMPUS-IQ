import axiosClient from './axios';

/**
 * Get period slots
 */
export const getPeriodSlots = async () => {
  const response = await axiosClient.get('/timetable/period-slots');
  return response.data;
};

/**
 * Get timetable for a teacher
 */
export const getTeacherTimetable = async (params = {}) => {
  const response = await axiosClient.get('/timetable/teacher', { params });
  return response.data;
};

/**
 * Get timetable for a class
 */
export const getClassTimetable = async (params = {}) => {
  const response = await axiosClient.get('/timetable/class', { params });
  return response.data;
};

/**
 * Create a timetable entry (admin/management)
 */
export const createTimetableEntry = async (data) => {
  const response = await axiosClient.post('/timetable', data);
  return response.data;
};

/**
 * Update a timetable entry
 */
export const updateTimetableEntry = async (id, data) => {
  const response = await axiosClient.put(`/timetable/${id}`, data);
  return response.data;
};

/**
 * Delete a timetable entry
 */
export const deleteTimetableEntry = async (id) => {
  const response = await axiosClient.delete(`/timetable/${id}`);
  return response.data;
};
