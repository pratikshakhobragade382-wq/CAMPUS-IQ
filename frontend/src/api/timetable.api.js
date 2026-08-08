/**
 * Timetable API endpoints
 */

import api from './axios';
import { TIMETABLE_DATA } from '../data/timetable.json';

export const getTimetables = async (filters = {}) => {
  try {
    let data = TIMETABLE_DATA;
    
    if (filters.classId) {
      data = data.filter(t => t.classId === filters.classId);
    }
    if (filters.sectionId) {
      data = data.filter(t => t.sectionId === filters.sectionId);
    }
    if (filters.day) {
      data = data.filter(t => t.day === filters.day);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

export const getTimetableById = async (id) => {
  try {
    return TIMETABLE_DATA.find(t => t.id === id) || null;
  } catch (error) {
    throw error;
  }
};

export const createTimetable = async (data) => {
  try {
    const newTimetable = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    TIMETABLE_DATA.push(newTimetable);
    return newTimetable;
  } catch (error) {
    throw error;
  }
};

export const updateTimetable = async (id, data) => {
  try {
    const index = TIMETABLE_DATA.findIndex(t => t.id === id);
    if (index > -1) {
      TIMETABLE_DATA[index] = { ...TIMETABLE_DATA[index], ...data };
      return TIMETABLE_DATA[index];
    }
    throw new Error('Timetable not found');
  } catch (error) {
    throw error;
  }
};

export const deleteTimetable = async (id) => {
  try {
    const index = TIMETABLE_DATA.findIndex(t => t.id === id);
    if (index > -1) {
      TIMETABLE_DATA.splice(index, 1);
      return { success: true };
    }
    throw new Error('Timetable not found');
  } catch (error) {
    throw error;
  }
};

export const bulkAddTimetable = async (entries) => {
  try {
    const newEntries = entries.map(e => ({
      id: Date.now().toString() + Math.random(),
      ...e,
      createdAt: new Date().toISOString(),
    }));
    TIMETABLE_DATA.push(...newEntries);
    return newEntries;
  } catch (error) {
    throw error;
  }
};
