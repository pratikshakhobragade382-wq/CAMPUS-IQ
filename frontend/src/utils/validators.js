/**
 * Validation utilities for CampusIQ
 * Contains validation functions and Zod schemas
 */

import { z } from 'zod';

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone validation regex (10+ digits)
 */
const PHONE_REGEX = /^[0-9]{10,}$/;

/**
 * Pin code validation regex (5-6 digits)
 */
const PINCODE_REGEX = /^[0-9]{5,6}$/;

// ============== Validation Schemas ==============

/**
 * Student form validation schema
 */
export const studentSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters'),
  email: z.string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .regex(PHONE_REGEX, 'Phone number must be at least 10 digits')
    .optional()
    .or(z.literal('')),
  class: z.string().min(1, 'Please select a class'),
  section: z.string().min(1, 'Please select a section'),
  admissionNo: z.string().min(1, 'Admission number is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Please select gender'),
  status: z.string().default('active'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string()
    .regex(PINCODE_REGEX, 'Invalid pin code')
    .optional()
    .or(z.literal('')),
});

/**
 * Staff form validation schema
 */
export const staffSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters'),
  email: z.string()
    .email('Invalid email address'),
  phone: z.string()
    .regex(PHONE_REGEX, 'Phone number must be at least 10 digits'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  department: z.string().min(1, 'Please select department'),
  designation: z.string().min(1, 'Please select designation'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  status: z.string().default('active'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

/**
 * Department form validation schema
 */
export const departmentSchema = z.object({
  name: z.string()
    .min(2, 'Department name must be at least 2 characters')
    .max(50, 'Department name must not exceed 50 characters'),
  hod: z.string().optional(),
  description: z.string().optional(),
  email: z.string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .regex(PHONE_REGEX, 'Phone number must be at least 10 digits')
    .optional()
    .or(z.literal('')),
  status: z.string().default('active'),
});

/**
 * Class form validation schema
 */
export const classSchema = z.object({
  name: z.string()
    .min(1, 'Class name is required')
    .max(20, 'Class name must not exceed 20 characters'),
  classTeacher: z.string().optional(),
  totalCapacity: z.number().min(1, 'Capacity must be at least 1').optional(),
  status: z.string().default('active'),
});

/**
 * Section form validation schema
 */
export const sectionSchema = z.object({
  name: z.string()
    .min(1, 'Section name is required')
    .max(20, 'Section name must not exceed 20 characters'),
  class: z.string().min(1, 'Please select class'),
  classTeacher: z.string().optional(),
  roomNo: z.string().optional(),
  totalCapacity: z.number().min(1, 'Capacity must be at least 1').optional(),
  status: z.string().default('active'),
});

/**
 * Academic year form validation schema
 */
export const academicYearSchema = z.object({
  year: z.string().min(4, 'Year is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isCurrent: z.boolean().default(false),
  status: z.string().default('active'),
}).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
  message: 'Start date must be before end date',
  path: ['endDate'],
});

/**
 * Attendance form validation schema
 */
export const attendanceSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  class: z.string().min(1, 'Please select class'),
  section: z.string().min(1, 'Please select section'),
  attendance: z.array(
    z.object({
      studentId: z.string(),
      status: z.string().min(1, 'Please select status'),
    })
  ),
});

/**
 * Fee form validation schema
 */
export const feeSchema = z.object({
  studentId: z.string().min(1, 'Please select student'),
  amount: z.number().min(0, 'Amount must be positive'),
  type: z.string().min(1, 'Please select fee type'),
  dueDate: z.string().min(1, 'Due date is required'),
  remarks: z.string().optional(),
  status: z.string().default('pending'),
});

/**
 * Exam form validation schema — matches backend Exam create body
 */
export const examSchema = z.object({
  academicYearId: z.number().int().positive('Academic year is required'),
  name: z.string()
    .min(2, 'Exam name must be at least 2 characters')
    .max(100, 'Exam name must not exceed 100 characters'),
  examType: z.enum([
    'unit_test_1',
    'unit_test_2',
    'half_yearly',
    'annual',
    'pre_board',
    'practical',
    'internal_assessment',
  ]),
  classId: z.number().int().positive('Class is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

/**
 * Holiday form validation schema
 */
export const holidaySchema = z.object({
  name: z.string()
    .min(2, 'Holiday name must be at least 2 characters')
    .max(50, 'Holiday name must not exceed 50 characters'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  type: z.string().min(1, 'Please select holiday type'),
  description: z.string().optional(),
});

/**
 * Timetable form validation schema
 */
export const timetableSchema = z.object({
  class: z.string().min(1, 'Please select class'),
  section: z.string().min(1, 'Please select section'),
  day: z.string().min(1, 'Please select day'),
  subject: z.string().min(1, 'Please select subject'),
  teacher: z.string().min(1, 'Please select teacher'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
});

// ============== Custom Validation Functions ==============

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
export const validateEmail = (email) => {
  return EMAIL_REGEX.test(email);
};

/**
 * Validate phone
 * @param {string} phone - Phone to validate
 * @returns {boolean} Whether phone is valid
 */
export const validatePhone = (phone) => {
  return PHONE_REGEX.test(phone.replace(/\D/g, ''));
};

/**
 * Validate pincode
 * @param {string} pincode - Pin code to validate
 * @returns {boolean} Whether pin code is valid
 */
export const validatePincode = (pincode) => {
  return PINCODE_REGEX.test(pincode);
};

/**
 * Validate date range
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {boolean} Whether date range is valid
 */
export const validateDateRange = (startDate, endDate) => {
  return new Date(startDate) < new Date(endDate);
};

/**
 * Validate semester date range
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {boolean} Whether date range does not exceed one year
 */
export const validateSemesterDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= 365;
};

/**
 * Get validation error message
 * @param {error} error - Zod validation error
 * @returns {object} Object with field names as keys and error messages as values
 */
export const getValidationErrors = (error) => {
  const errors = {};
  
  if (error.errors) {
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      errors[path] = err.message;
    });
  }
  
  return errors;
};
