/**
 * Fee API endpoints
 */

import api from './axios';
import { FEE_DATA } from '../data/fee.json';

export const getFees = async (page = 1, limit = 10, filters = {}) => {
  try {
    return {
      data: FEE_DATA,
      total: FEE_DATA.length,
      page,
      limit,
    };
  } catch (error) {
    throw error;
  }
};

export const getFeeById = async (id) => {
  try {
    return FEE_DATA.find(f => f.id === id) || null;
  } catch (error) {
    throw error;
  }
};

export const createFee = async (data) => {
  try {
    const newFee = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    FEE_DATA.push(newFee);
    return newFee;
  } catch (error) {
    throw error;
  }
};

export const updateFee = async (id, data) => {
  try {
    const index = FEE_DATA.findIndex(f => f.id === id);
    if (index > -1) {
      FEE_DATA[index] = { ...FEE_DATA[index], ...data };
      return FEE_DATA[index];
    }
    throw new Error('Fee not found');
  } catch (error) {
    throw error;
  }
};

export const deleteFee = async (id) => {
  try {
    const index = FEE_DATA.findIndex(f => f.id === id);
    if (index > -1) {
      FEE_DATA.splice(index, 1);
      return { success: true };
    }
    throw new Error('Fee not found');
  } catch (error) {
    throw error;
  }
};

export const getFeeStats = async (studentId) => {
  try {
    const studentFees = FEE_DATA.filter(f => f.studentId === studentId);
    return {
      total: studentFees.reduce((sum, f) => sum + f.amount, 0),
      paid: studentFees
        .filter(f => f.status === 'paid')
        .reduce((sum, f) => sum + f.amount, 0),
      pending: studentFees
        .filter(f => f.status === 'pending')
        .reduce((sum, f) => sum + f.amount, 0),
    };
  } catch (error) {
    throw error;
  }
};
