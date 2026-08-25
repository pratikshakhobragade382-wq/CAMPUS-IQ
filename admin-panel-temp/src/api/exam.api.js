/**
 * Exam API endpoints
 */

import api from './axios';
import { EXAM_DATA } from '../data/exam.json';

export const getExams = async (page = 1, limit = 10) => {
  try {
    return {
      data: EXAM_DATA,
      total: EXAM_DATA.length,
      page,
      limit,
    };
  } catch (error) {
    throw error;
  }
};

export const getExamById = async (id) => {
  try {
    return EXAM_DATA.find(e => e.id === id) || null;
  } catch (error) {
    throw error;
  }
};

export const createExam = async (data) => {
  try {
    const newExam = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    EXAM_DATA.push(newExam);
    return newExam;
  } catch (error) {
    throw error;
  }
};

export const updateExam = async (id, data) => {
  try {
    const index = EXAM_DATA.findIndex(e => e.id === id);
    if (index > -1) {
      EXAM_DATA[index] = { ...EXAM_DATA[index], ...data };
      return EXAM_DATA[index];
    }
    throw new Error('Exam not found');
  } catch (error) {
    throw error;
  }
};

export const deleteExam = async (id) => {
  try {
    const index = EXAM_DATA.findIndex(e => e.id === id);
    if (index > -1) {
      EXAM_DATA.splice(index, 1);
      return { success: true };
    }
    throw new Error('Exam not found');
  } catch (error) {
    throw error;
  }
};

export const getExamResults = async (examId) => {
  try {
    return EXAM_DATA.find(e => e.id === examId)?.results || [];
  } catch (error) {
    throw error;
  }
};
