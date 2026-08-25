/**
 * Section API endpoints
 */

import api from './axios';
import { SECTIONS_DATA } from '../data/section.json';

export const getSections = async (page = 1, limit = 10, classId = null) => {
  try {
    let data = SECTIONS_DATA;
    if (classId) {
      data = data.filter(s => s.classId === classId);
    }
    return {
      data,
      total: data.length,
      page,
      limit,
    };
  } catch (error) {
    throw error;
  }
};

export const getSectionById = async (id) => {
  try {
    return SECTIONS_DATA.find(s => s.id === id) || null;
  } catch (error) {
    throw error;
  }
};

export const createSection = async (data) => {
  try {
    const newSection = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    SECTIONS_DATA.push(newSection);
    return newSection;
  } catch (error) {
    throw error;
  }
};

export const updateSection = async (id, data) => {
  try {
    const index = SECTIONS_DATA.findIndex(s => s.id === id);
    if (index > -1) {
      SECTIONS_DATA[index] = { ...SECTIONS_DATA[index], ...data };
      return SECTIONS_DATA[index];
    }
    throw new Error('Section not found');
  } catch (error) {
    throw error;
  }
};

export const deleteSection = async (id) => {
  try {
    const index = SECTIONS_DATA.findIndex(s => s.id === id);
    if (index > -1) {
      SECTIONS_DATA.splice(index, 1);
      return { success: true };
    }
    throw new Error('Section not found');
  } catch (error) {
    throw error;
  }
};
