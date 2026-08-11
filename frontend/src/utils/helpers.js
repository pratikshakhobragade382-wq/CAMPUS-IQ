/**
 * Helper utilities for CampusIQ
 * Contains common utility functions used throughout the application
 */

/**
 * Format currency value
 * @param {number} value - The value to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Format number with thousand separators
 * @param {number} value - The value to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (value) => {
  return new Intl.NumberFormat('en-US').format(value);
};

/**
 * Get initials from a name
 * @param {string} name - Full name
 * @returns {string} Initials (two characters)
 */
export const getInitials = (name) => {
  if (!name) return 'UN';
  const parts = name.trim().split(' ');
  return (
    (parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')
  ).toUpperCase();
};

/**
 * Generate a color from a string (for avatars)
 * @param {string} str - String to generate color from
 * @returns {string} Color hex code
 */
export const stringToColor = (str) => {
  let hash = 0;
  if (!str) return '#0ea5e9';
  
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

/**
 * Check if email is valid
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if phone number is valid
 * @param {string} phone - Phone to validate
 * @returns {boolean} Whether phone is valid
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10,}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 50) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

/**
 * Convert file size to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Human readable file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Deep clone an object
 * @param {object} obj - Object to clone
 * @returns {object} Cloned object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 * @param {object} obj - Object to check
 * @returns {boolean} Whether object is empty
 */
export const isEmptyObject = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * Debounce function
 * @param {function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {function} Debounced function
 */
export const debounce = (func, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function
 * @param {function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {function} Throttled function
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Get query parameters from URL
 * @returns {object} Query parameters
 */
export const getQueryParams = () => {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(params);
};

/**
 * Build query string from object
 * @param {object} obj - Object to convert
 * @returns {string} Query string
 */
export const buildQueryString = (obj) => {
  return Object.entries(obj)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
};

/**
 * Get status badge color
 * @param {string} status - Status value
 * @returns {object} Color classes for badge
 */
export const getStatusColor = (status) => {
  const statusColors = {
    active: { bg: 'bg-green-100', text: 'text-green-800' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-800' },
    suspended: { bg: 'bg-red-100', text: 'text-red-800' },
    graduated: { bg: 'bg-blue-100', text: 'text-blue-800' },
    present: { bg: 'bg-green-100', text: 'text-green-800' },
    absent: { bg: 'bg-red-100', text: 'text-red-800' },
    late: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    half_day: { bg: 'bg-orange-100', text: 'text-orange-800' },
    holiday: { bg: 'bg-blue-100', text: 'text-blue-800' },
    leave: { bg: 'bg-purple-100', text: 'text-purple-800' },
    paid: { bg: 'bg-green-100', text: 'text-green-800' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    overdue: { bg: 'bg-red-100', text: 'text-red-800' },
    partial: { bg: 'bg-blue-100', text: 'text-blue-800' },
    scheduled: { bg: 'bg-blue-100', text: 'text-blue-800' },
    ongoing: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    completed: { bg: 'bg-green-100', text: 'text-green-800' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-800' },
  };
  
  return statusColors[status?.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-800' };
};

/**
 * Capitalize first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert camelCase to Title Case
 * @param {string} str - String to convert
 * @returns {string} Title case string
 */
export const camelToTitleCase = (str) => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
};

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Sort array of objects by key
 * @param {array} arr - Array to sort
 * @param {string} key - Key to sort by
 * @param {string} order - Sort order (asc or desc)
 * @returns {array} Sorted array
 */
export const sortByKey = (arr, key, order = 'asc') => {
  return [...arr].sort((a, b) => {
    if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Filter array by search term
 * @param {array} arr - Array to filter
 * @param {string} searchTerm - Term to search for
 * @param {array} keys - Keys to search in
 * @returns {array} Filtered array
 */
export const filterBySearch = (arr, searchTerm, keys = []) => {
  if (!searchTerm) return arr;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return arr.filter((item) =>
    keys.some((key) =>
      String(item[key]).toLowerCase().includes(lowerSearchTerm)
    )
  );
};
