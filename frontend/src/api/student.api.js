/**
 * Student API endpoints
 */

import axiosClient from './axiosClient';
import { STUDENTS_DATA } from '../data/students.js';

/**
 * Get all students with pagination
 */
export const getStudents = async (page = 1, limit = 10, search = '', filters = {}) => {
  try {
    const res = await axiosClient.get('/students', { params: { page, limit, search, ...filters } });
    return res.data;
  } catch (error) {
    return {
      data: STUDENTS_DATA,
      total: STUDENTS_DATA.length,
      page,
      limit,
    };
  }
};

/**
 * Get student by ID
 */
export const getStudentById = async (id) => {
  try {
    // const response = await api.get(`/students/${id}`);
    // return response.data;
    return STUDENTS_DATA.find(s => s.id === id) || null;
  } catch (error) {
    throw error;
  }
};

/**
 * Create new student
 */
export const createStudent = async (data) => {
  try {
    // const response = await api.post('/students', data);
    // return response.data;
    const newStudent = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    STUDENTS_DATA.push(newStudent);
    return newStudent;
  } catch (error) {
    throw error;
  }
};

/**
 * Update student
 */
export const updateStudent = async (id, data) => {
  try {
    // const response = await api.put(`/students/${id}`, data);
    // return response.data;
    const index = STUDENTS_DATA.findIndex(s => s.id === id);
    if (index > -1) {
      STUDENTS_DATA[index] = { ...STUDENTS_DATA[index], ...data };
      return STUDENTS_DATA[index];
    }
    throw new Error('Student not found');
  } catch (error) {
    throw error;
  }
};

/**
 * Delete student
 */
export const deleteStudent = async (id) => {
  try {
    // const response = await api.delete(`/students/${id}`);
    // return response.data;
    const index = STUDENTS_DATA.findIndex(s => s.id === id);
    if (index > -1) {
      STUDENTS_DATA.splice(index, 1);
      return { success: true };
    }
    throw new Error('Student not found');
  } catch (error) {
    throw error;
  }
};

/**
 * Search students
 */
export const searchStudents = async (query) => {
  try {
    const res = await axiosClient.get('/students', { params: { search: query, limit: 20 } });
    return res.data.data || [];
  } catch (error) {
    return STUDENTS_DATA.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.email.toLowerCase().includes(query.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(query.toLowerCase())
    );
  }
};

/**
 * Import students from file
 */
export const importStudents = async (file) => {
  try {
    // const formData = new FormData();
    // formData.append('file', file);
    // const response = await api.post('/students/import', formData);
    // return response.data;
    return { success: true, count: 0 };
  } catch (error) {
    throw error;
  }
};

/**
 * Export students to CSV
 */
export const exportStudents = async (filters = {}) => {
  try {
    // const response = await api.get('/students/export', { params: filters });
    // return response.data;
    return STUDENTS_DATA;
  } catch (error) {
    throw error;
  }
};
