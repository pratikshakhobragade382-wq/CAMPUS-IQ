/**
 * Holiday API endpoints
 */

import api from './axios';
import { HOLIDAY_DATA } from '../data/holiday.json';

export const getHolidays = async (page = 1, limit = 10) => {
  try {
    return {
      data: HOLIDAY_DATA,
      total: HOLIDAY_DATA.length,
      page,
      limit,
    };
  } catch (error) {
    throw error;
  }
};

export const getHolidayById = async (id) => {
  try {
    return HOLIDAY_DATA.find(h => h.id === id) || null;
  } catch (error) {
    throw error;
  }
};

export const createHoliday = async (data) => {
  try {
    const newHoliday = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    HOLIDAY_DATA.push(newHoliday);
    return newHoliday;
  } catch (error) {
    throw error;
  }
};

export const updateHoliday = async (id, data) => {
  try {
    const index = HOLIDAY_DATA.findIndex(h => h.id === id);
    if (index > -1) {
      HOLIDAY_DATA[index] = { ...HOLIDAY_DATA[index], ...data };
      return HOLIDAY_DATA[index];
    }
    throw new Error('Holiday not found');
  } catch (error) {
    throw error;
  }
};

export const deleteHoliday = async (id) => {
  try {
    const index = HOLIDAY_DATA.findIndex(h => h.id === id);
    if (index > -1) {
      HOLIDAY_DATA.splice(index, 1);
      return { success: true };
    }
    throw new Error('Holiday not found');
  } catch (error) {
    throw error;
  }
};
