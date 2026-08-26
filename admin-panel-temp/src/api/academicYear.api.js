/**
 * Academic Year API endpoints
 */

import api from './axios';
import { ACADEMIC_YEAR_DATA } from '../data/academicYear.json';

export const getAcademicYears = async (page = 1, limit = 10) => {
  try {
    return {
      data: ACADEMIC_YEAR_DATA,
      total: ACADEMIC_YEAR_DATA.length,
      page,
      limit,
    };
  } catch (error) {
    throw error;
  }
};

export const getAcademicYearById = async (id) => {
  try {
    return ACADEMIC_YEAR_DATA.find(ay => ay.id === id) || null;
  } catch (error) {
    throw error;
  }
};

export const createAcademicYear = async (data) => {
  try {
    const newYear = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    ACADEMIC_YEAR_DATA.push(newYear);
    return newYear;
  } catch (error) {
    throw error;
  }
};

export const updateAcademicYear = async (id, data) => {
  try {
    const index = ACADEMIC_YEAR_DATA.findIndex(ay => ay.id === id);
    if (index > -1) {
      ACADEMIC_YEAR_DATA[index] = { ...ACADEMIC_YEAR_DATA[index], ...data };
      return ACADEMIC_YEAR_DATA[index];
    }
    throw new Error('Academic Year not found');
  } catch (error) {
    throw error;
  }
};

export const deleteAcademicYear = async (id) => {
  try {
    const index = ACADEMIC_YEAR_DATA.findIndex(ay => ay.id === id);
    if (index > -1) {
      ACADEMIC_YEAR_DATA.splice(index, 1);
      return { success: true };
    }
    throw new Error('Academic Year not found');
  } catch (error) {
    throw error;
  }
};

export const setCurrentAcademicYear = async (id) => {
  try {
    ACADEMIC_YEAR_DATA.forEach(ay => {
      ay.isCurrent = ay.id === id;
    });
    return ACADEMIC_YEAR_DATA.find(ay => ay.id === id);
  } catch (error) {
    throw error;
  }
};
