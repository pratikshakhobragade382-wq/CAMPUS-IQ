/**
 * Date formatting utilities for CampusIQ
 * Uses date-fns library for date manipulation
 */

import {
  format,
  parse,
  isValid,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isYesterday,
  isTomorrow,
  differenceInDays,
  addDays,
  startOfWeek,
  endOfWeek,
  eachWeekendOfInterval,
} from 'date-fns';

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @param {string} formatStr - Format string (default: 'MMM dd, yyyy')
 * @returns {string} Formatted date
 */
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, formatStr);
};

/**
 * Format date and time
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (date) => {
  return formatDate(date, 'MMM dd, yyyy HH:mm');
};

/**
 * Format date for API
 * @param {Date|string} date - Date to format
 * @returns {string} API formatted date (YYYY-MM-DD)
 */
export const formatDateForAPI = (date) => {
  return formatDate(date, 'yyyy-MM-dd');
};

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return '';
  
  const now = new Date();
  const diffDays = differenceInDays(now, dateObj);
  
  if (isToday(dateObj)) {
    return 'Today';
  } else if (isYesterday(dateObj)) {
    return 'Yesterday';
  } else if (isTomorrow(dateObj)) {
    return 'Tomorrow';
  } else if (diffDays < 7 && diffDays > 0) {
    return `${diffDays} days ago`;
  } else if (diffDays > -7 && diffDays < 0) {
    return `In ${Math.abs(diffDays)} days`;
  } else {
    return formatDate(dateObj);
  }
};

/**
 * Get calendar data for a month
 * @param {Date} date - Date in the month
 * @returns {object} Calendar data with weeks and days
 */
export const getCalendarData = (date = new Date()) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const weeks = [];
  let currentWeek = [];
  
  const weekStart = startOfWeek(monthStart);
  const weekEnd = endOfWeek(monthEnd);
  
  const allDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  allDays.forEach((day, index) => {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push({
      date: day,
      isCurrentMonth: isSameMonth(day, date),
      isToday: isToday(day),
    });
  });
  
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }
  
  return months;
};

/**
 * Check if date is in past
 * @param {Date|string} date - Date to check
 * @returns {boolean} Whether date is in past
 */
export const isDateInPast = (date) => {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
};

/**
 * Check if date is in future
 * @param {Date|string} date - Date to check
 * @returns {boolean} Whether date is in future
 */
export const isDateInFuture = (date) => {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj > new Date();
};

/**
 * Get date range (start and end of period)
 * @param {string} period - Period type (week, month, year, custom)
 * @param {Date} date - Reference date
 * @param {Date} startDate - Start date for custom range
 * @param {Date} endDate - End date for custom range
 * @returns {object} Start and end dates
 */
export const getDateRange = (period = 'month', date = new Date(), startDate = null, endDate = null) => {
  const today = date;
  
  switch (period) {
    case 'week':
      return {
        start: startOfWeek(today),
        end: endOfWeek(today),
      };
    case 'month':
      return {
        start: startOfMonth(today),
        end: endOfMonth(today),
      };
    case 'year':
      return {
        start: new Date(today.getFullYear(), 0, 1),
        end: new Date(today.getFullYear(), 11, 31),
      };
    case 'custom':
      return {
        start: startDate || today,
        end: endDate || today,
      };
    default:
      return {
        start: today,
        end: today,
      };
  }
};

/**
 * Get time zone string
 * @returns {string} Time zone
 */
export const getTimeZone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Convert date to ISO string
 * @param {Date} date - Date to convert
 * @returns {string} ISO string
 */
export const dateToISO = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString();
};

/**
 * Parse date string
 * @param {string} dateStr - Date string to parse
 * @param {string} formatStr - Format string
 * @returns {Date} Parsed date
 */
export const parseDate = (dateStr, formatStr = 'yyyy-MM-dd') => {
  if (!dateStr) return null;
  return parse(dateStr, formatStr, new Date());
};

/**
 * Add days to date
 * @param {Date} date - Base date
 * @param {number} days - Days to add
 * @returns {Date} New date
 */
export const addDaysToDate = (date, days) => {
  return addDays(date, days);
};

/**
 * Get age from date of birth
 * @param {Date|string} dateOfBirth - Date of birth
 * @returns {number} Age in years
 */
export const getAge = (dateOfBirth) => {
  if (!dateOfBirth) return 0;
  
  const today = new Date();
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Format time (HH:mm)
 * @param {string} time - Time string
 * @returns {string} Formatted time
 */
export const formatTime = (time) => {
  if (!time) return '';
  
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const min = parseInt(minutes, 10);
  
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  
  return `${displayHour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')} ${ampm}`;
};

/**
 * Get month name
 * @param {number} monthIndex - Month index (0-11)
 * @param {string} format - Format type (short, long)
 * @returns {string} Month name
 */
export const getMonthName = (monthIndex, format = 'long') => {
  const monthNames = {
    short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    long: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  };
  
  return monthNames[format][monthIndex] || '';
};
