/**
 * CSV Export utilities
 * Provides functions to export data to CSV format
 */

/**
 * Convert data to CSV string
 * @param {array} data - Array of objects to convert
 * @param {array} headers - Array of header names
 * @param {array} keys - Array of keys to extract from objects
 * @returns {string} CSV string
 */
export const convertToCSV = (data, headers, keys) => {
  if (!data || data.length === 0) {
    return '';
  }

  // Create header row
  const headerRow = headers.map((header) => `"${header}"`).join(',');

  // Create data rows
  const dataRows = data.map((row) =>
    keys.map((key) => {
      const value = row[key];
      
      // Handle null and undefined
      if (value === null || value === undefined) {
        return '';
      }
      
      // Escape quotes and wrap in quotes if contains comma or quotes
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
};

/**
 * Download CSV file
 * @param {string} csvContent - CSV content string
 * @param {string} fileName - File name for download
 */
export const downloadCSV = (csvContent, fileName = 'export.csv') => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    // Create a URL for the blob object
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Export data to CSV file
 * @param {array} data - Array of objects to export
 * @param {array} headers - Array of header names
 * @param {array} keys - Array of keys to extract
 * @param {string} fileName - File name for download
 */
export const exportToCSV = (data, headers, keys, fileName = 'export.csv') => {
  const csvContent = convertToCSV(data, headers, keys);
  downloadCSV(csvContent, fileName);
};

/**
 * Export students to CSV
 * @param {array} students - Array of student objects
 * @param {string} fileName - File name for download
 */
export const exportStudentsToCSV = (students, fileName = 'students.csv') => {
  const headers = [
    'Admission No',
    'Name',
    'Email',
    'Phone',
    'Class',
    'Section',
    'Status',
    'Enrollment Date',
  ];
  
  const keys = [
    'admissionNo',
    'name',
    'email',
    'phone',
    'class',
    'section',
    'status',
    'enrollmentDate',
  ];
  
  exportToCSV(students, headers, keys, fileName);
};

/**
 * Export staff to CSV
 * @param {array} staff - Array of staff objects
 * @param {string} fileName - File name for download
 */
export const exportStaffToCSV = (staff, fileName = 'staff.csv') => {
  const headers = [
    'Employee ID',
    'Name',
    'Email',
    'Phone',
    'Department',
    'Designation',
    'Joining Date',
    'Status',
  ];
  
  const keys = [
    'employeeId',
    'name',
    'email',
    'phone',
    'department',
    'designation',
    'joiningDate',
    'status',
  ];
  
  exportToCSV(staff, headers, keys, fileName);
};

/**
 * Export attendance to CSV
 * @param {array} attendance - Array of attendance objects
 * @param {string} fileName - File name for download
 */
export const exportAttendanceToCSV = (attendance, fileName = 'attendance.csv') => {
  const headers = [
    'Student Name',
    'Admission No',
    'Date',
    'Status',
    'Remarks',
  ];
  
  const keys = [
    'studentName',
    'admissionNo',
    'date',
    'status',
    'remarks',
  ];
  
  exportToCSV(attendance, headers, keys, fileName);
};

/**
 * Export fees to CSV
 * @param {array} fees - Array of fee objects
 * @param {string} fileName - File name for download
 */
export const exportFeesToCSV = (fees, fileName = 'fees.csv') => {
  const headers = [
    'Student Name',
    'Admission No',
    'Amount',
    'Status',
    'Due Date',
    'Paid Date',
  ];
  
  const keys = [
    'studentName',
    'admissionNo',
    'amount',
    'status',
    'dueDate',
    'paidDate',
  ];
  
  exportToCSV(fees, headers, keys, fileName);
};

/**
 * Export exam results to CSV
 * @param {array} results - Array of exam result objects
 * @param {string} fileName - File name for download
 */
export const exportExamResultsToCSV = (results, fileName = 'exam-results.csv') => {
  const headers = [
    'Student Name',
    'Admission No',
    'Subject',
    'Marks Obtained',
    'Total Marks',
    'Percentage',
    'Grade',
  ];
  
  const keys = [
    'studentName',
    'admissionNo',
    'subject',
    'marksObtained',
    'totalMarks',
    'percentage',
    'grade',
  ];
  
  exportToCSV(results, headers, keys, fileName);
};

/**
 * Convert JSON to CSV with custom mapping
 * @param {array} data - Array of objects
 * @param {object} mapping - Key-value mapping {csvHeader: jsonKey}
 * @param {string} fileName - File name for download
 */
export const exportWithMapping = (data, mapping, fileName = 'export.csv') => {
  const headers = Object.keys(mapping);
  const keys = Object.values(mapping);
  
  exportToCSV(data, headers, keys, fileName);
};

/**
 * Parse CSV string to array of objects
 * @param {string} csvContent - CSV content
 * @param {array} headers - Headers array
 * @returns {array} Array of objects
 */
export const parseCSV = (csvContent, headers) => {
  const lines = csvContent.split('\n').filter((line) => line.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((val) => val.replace(/^"|"$/g, ''));
    const obj = {};
    
    headers.forEach((header, index) => {
      obj[header] = values[index];
    });
    
    return obj;
  });
};
