/**
 * Department API endpoints
 */

import api from './axios';
import { DEPARTMENTS_DATA } from '../data/department.json';

export const getDepartments = async (page = 1, limit = 10) => {
  try {
    return {
      data: DEPARTMENTS_DATA,
      total: DEPARTMENTS_DATA.length,
      page,
      limit,
    };
  } catch (error) {
    throw error;
  }
};

export const getDepartmentById = async (id) => {
  try {
    return DEPARTMENTS_DATA.find(d => d.id === id) || null;
  } catch (error) {
    throw error;
  }
};

export const createDepartment = async (data) => {
  try {
    const newDept = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    DEPARTMENTS_DATA.push(newDept);
    return newDept;
  } catch (error) {
    throw error;
  }
};

export const updateDepartment = async (id, data) => {
  try {
    const index = DEPARTMENTS_DATA.findIndex(d => d.id === id);
    if (index > -1) {
      DEPARTMENTS_DATA[index] = { ...DEPARTMENTS_DATA[index], ...data };
      return DEPARTMENTS_DATA[index];
    }
    throw new Error('Department not found');
  } catch (error) {
    throw error;
  }
};

export const deleteDepartment = async (id) => {
  try {
    const index = DEPARTMENTS_DATA.findIndex(d => d.id === id);
    if (index > -1) {
      DEPARTMENTS_DATA.splice(index, 1);
      return { success: true };
    }
    throw new Error('Department not found');
  } catch (error) {
    throw error;
  }
};
