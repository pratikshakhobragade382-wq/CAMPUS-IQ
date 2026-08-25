/**
 * Fee API endpoints (calls backend)
 */

import api from './axios';

export const getCategories = async () => {
  const res = await api.get('/fees/categories');
  return res.data.data;
};

export const createCategory = async (payload) => {
  const res = await api.post('/fees/categories', payload);
  return res.data.data;
};

export const updateCategory = async (id, payload) => {
  const res = await api.put(`/fees/categories/${id}`, payload);
  return res.data.data;
};

export const deleteCategory = async (id) => {
  const res = await api.delete(`/fees/categories/${id}`);
  return res.data;
};

export const getStructures = async (filters = {}) => {
  const res = await api.get('/fees/structures', { params: filters });
  return res.data.data;
};

export const createStructure = async (payload) => {
  const res = await api.post('/fees/structures', payload);
  return res.data.data;
};

export const updateStructure = async (id, payload) => {
  const res = await api.put(`/fees/structures/${id}`, payload);
  return res.data.data;
};

export const collectFee = async (payload) => {
  const res = await api.post('/fees/collect', payload);
  return res.data.data;
};

export const getStudentFeeStatus = async (studentId, academicYearId) => {
  const res = await api.get(`/fees/students/${studentId}/status`, { params: { academicYearId } });
  return res.data.data;
};

export const getStudentPaymentHistory = async (studentId) => {
  const res = await api.get(`/fees/students/${studentId}/history`);
  return res.data.data;
};

export const getCollectionsByDateRange = async (fromDate, toDate) => {
  const res = await api.get('/fees/collections', { params: { fromDate, toDate } });
  return res.data.data;
};
