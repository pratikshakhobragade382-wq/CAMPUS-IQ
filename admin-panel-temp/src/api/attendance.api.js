/**
 * Attendance API endpoints
 */

import api from './axios';
import { ATTENDANCE_DATA } from '../data/attendance.json';

export const getAttendance = async (page = 1, limit = 10, filters = {}) => {
  try {
    return {
      data: ATTENDANCE_DATA,
      total: ATTENDANCE_DATA.length,
      page,
      limit,
    };
  } catch (error) {
    throw error;
  }
};

export const getAttendanceById = async (id) => {
  try {
    return ATTENDANCE_DATA.find(a => a.id === id) || null;
  } catch (error) {
    throw error;
  }
};

export const markAttendance = async (data) => {
  try {
    const newAttendance = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    ATTENDANCE_DATA.push(newAttendance);
    return newAttendance;
  } catch (error) {
    throw error;
  }
};

export const updateAttendance = async (id, data) => {
  try {
    const index = ATTENDANCE_DATA.findIndex(a => a.id === id);
    if (index > -1) {
      ATTENDANCE_DATA[index] = { ...ATTENDANCE_DATA[index], ...data };
      return ATTENDANCE_DATA[index];
    }
    throw new Error('Attendance record not found');
  } catch (error) {
    throw error;
  }
};

export const deleteAttendance = async (id) => {
  try {
    const index = ATTENDANCE_DATA.findIndex(a => a.id === id);
    if (index > -1) {
      ATTENDANCE_DATA.splice(index, 1);
      return { success: true };
    }
    throw new Error('Attendance record not found');
  } catch (error) {
    throw error;
  }
};

export const getMonthlyAttendance = async (studentId, month, year) => {
  try {
    return ATTENDANCE_DATA.filter(a =>
      a.studentId === studentId &&
      new Date(a.date).getMonth() === month &&
      new Date(a.date).getFullYear() === year
    );
  } catch (error) {
    throw error;
  }
};
