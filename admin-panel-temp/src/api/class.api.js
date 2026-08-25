/**
 * Class API endpoints
 */

import api from './axios';
import { CLASSES_DATA } from '../data/class.json';

export const getClasses = async (page = 1, limit = 10) => {
  try {
    return {
      data: CLASSES_DATA,
      total: CLASSES_DATA.length,
      page,
      limit,
    };
  } catch (error) {
    throw error;
  }
};

export const getClassById = async (id) => {
  try {
    return CLASSES_DATA.find(c => c.id === id) || null;
  } catch (error) {
    throw error;
  }
};

export const createClass = async (data) => {
  try {
    const newClass = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    CLASSES_DATA.push(newClass);
    return newClass;
  } catch (error) {
    throw error;
  }
};

export const updateClass = async (id, data) => {
  try {
    const index = CLASSES_DATA.findIndex(c => c.id === id);
    if (index > -1) {
      CLASSES_DATA[index] = { ...CLASSES_DATA[index], ...data };
      return CLASSES_DATA[index];
    }
    throw new Error('Class not found');
  } catch (error) {
    throw error;
  }
};

export const deleteClass = async (id) => {
  try {
    const index = CLASSES_DATA.findIndex(c => c.id === id);
    if (index > -1) {
      CLASSES_DATA.splice(index, 1);
      return { success: true };
    }
    throw new Error('Class not found');
  } catch (error) {
    throw error;
  }
};
