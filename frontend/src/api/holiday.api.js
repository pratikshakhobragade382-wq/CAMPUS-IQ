import axiosClient from './axios';

export const getHolidays = async (academicYearId) => {
  const response = await axiosClient.get('/holidays', {
    params: academicYearId ? { academicYearId } : {},
  });
  return response.data;
};

export const createHoliday = async (data) => {
  const response = await axiosClient.post('/holidays', data);
  return response.data;
};

export const updateHoliday = async (id, data) => {
  const response = await axiosClient.put(`/holidays/${id}`, data);
  return response.data;
};

export const deleteHoliday = async (id) => {
  const response = await axiosClient.delete(`/holidays/${id}`);
  return response.data;
};
