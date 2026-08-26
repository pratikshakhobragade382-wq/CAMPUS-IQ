/**
 * Staff API endpoints
 */

import api from './axios';
import { STAFF_DATA } from '../data/staff.json';

/**
 * Get all staff with pagination
 */
export const getStaff = async (page = 1, limit = 10, search = '', filters = {}) => {
  try {
    // Mock API - replace with real endpoint
    return {
      data: STAFF_DATA,
      total: STAFF_DATA.length,
      page,
      limit,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get staff by ID
 */
export const getStaffById = async (id) => {
  try {
    return STAFF_DATA.find(s => s.id === id) || null;
  } catch (error) {
    throw error;
  }
};

/**
 * Create new staff
 */
export const createStaff = async (data) => {
  try {
    const newStaff = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    STAFF_DATA.push(newStaff);
    return newStaff;
  } catch (error) {
    throw error;
  }
};

/**
 * Update staff
 */
export const updateStaff = async (id, data) => {
  try {
    const index = STAFF_DATA.findIndex(s => s.id === id);
    if (index > -1) {
      STAFF_DATA[index] = { ...STAFF_DATA[index], ...data };
      return STAFF_DATA[index];
    }
    throw new Error('Staff not found');
  } catch (error) {
    throw error;
  }
};

/**
 * Delete staff
 */
export const deleteStaff = async (id) => {
  try {
    const index = STAFF_DATA.findIndex(s => s.id === id);
    if (index > -1) {
      STAFF_DATA.splice(index, 1);
      return { success: true };
    }
    throw new Error('Staff not found');
  } catch (error) {
    throw error;
  }
};

/**
 * Search staff
 */
export const searchStaff = async (query) => {
  try {
    return STAFF_DATA.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.email.toLowerCase().includes(query.toLowerCase()) ||
      s.employeeId.toLowerCase().includes(query.toLowerCase())
    );
  } catch (error) {
    throw error;
  }
};

/**
 * Import staff from file
 */
export const importStaff = async (file) => {
  try {
    return { success: true, count: 0 };
  } catch (error) {
    throw error;
  }
};

/**
 * Export staff to CSV
 */
export const exportStaff = async (filters = {}) => {
  try {
    return STAFF_DATA;
  } catch (error) {
    throw error;
  }
};
