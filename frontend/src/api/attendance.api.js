/**
 * Attendance API — mirrors backend/src/modules/attendance
 *
 * Base: /api/v1/attendance (via axiosClient)
 *
 * Student:
 *   POST /attendance/students/mark-class
 *   GET  /attendance/students/class?classId&sectionId&date
 *   GET  /attendance/students/monthly-summary?classId&sectionId&month&year&academicYearId
 *   GET  /attendance/students/:studentId/history?academicYearId&fromDate&toDate
 *
 * Staff:
 *   POST /attendance/staff/mark
 *   GET  /attendance/staff/by-date?date
 *   GET  /attendance/staff/:staffId/history?academicYearId&fromDate&toDate
 *
 * Do NOT send markedById — backend derives it from the auth token.
 * Do NOT send tenantId — backend uses req.user.tenantId.
 */

import axiosClient from "./axiosClient";

/**
 * Mark / upsert class attendance for multiple students.
 * Body: { academicYearId, classId, sectionId?, date, records: [{ studentId, status, remark? }] }
 * Response: { success, message, data: { message, count } }
 */
export const markClassAttendance = async (data) => {
  const response = await axiosClient.post(
    "/attendance/students/mark-class",
    data
  );
  return response.data;
};

/**
 * Get existing class attendance for a date.
 * Query: classId (required), date (required), sectionId (optional)
 * Response: { success, message, data: StudentAttendance[] }
 */
export const getClassAttendanceByDate = async ({
  classId,
  sectionId,
  date,
}) => {
  const params = {
    classId: Number(classId),
    date,
  };
  if (sectionId != null && sectionId !== "") {
    params.sectionId = Number(sectionId);
  }

  const response = await axiosClient.get("/attendance/students/class", {
    params,
  });
  return response.data;
};

/**
 * Monthly attendance summary for a class/section.
 * Query: classId, month, year required; sectionId, academicYearId optional
 * Response: { success, message, data: { month, year, totalWorkingDays, holidayDates, students } }
 */
export const getClassMonthlyAttendanceSummary = async ({
  classId,
  sectionId,
  month,
  year,
  academicYearId,
}) => {
  const params = {
    classId: Number(classId),
    month: Number(month),
    year: Number(year),
  };
  if (sectionId != null && sectionId !== "") {
    params.sectionId = Number(sectionId);
  }
  if (academicYearId != null && academicYearId !== "") {
    params.academicYearId = Number(academicYearId);
  }

  const response = await axiosClient.get(
    "/attendance/students/monthly-summary",
    { params }
  );
  return response.data;
};

/**
 * Attendance history for one student.
 * Query: academicYearId?, fromDate?, toDate?
 * Response: { success, message, data: { student, summary, records } }
 */
export const getStudentAttendanceHistory = async (
  studentId,
  { academicYearId, fromDate, toDate } = {}
) => {
  const params = {};
  if (academicYearId != null && academicYearId !== "") {
    params.academicYearId = Number(academicYearId);
  }
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;

  const response = await axiosClient.get(
    `/attendance/students/${Number(studentId)}/history`,
    { params }
  );
  return response.data;
};

/**
 * Mark / upsert a single staff attendance record.
 * Body: { academicYearId, staffId, date, status, inTime?, outTime?, remark? }
 * Response: { success, message, data: StaffAttendance }
 */
export const markStaffAttendance = async (data) => {
  const response = await axiosClient.post("/attendance/staff/mark", data);
  return response.data;
};

/**
 * All staff attendance records for a date.
 * Query: date (required)
 * Response: { success, message, data: StaffAttendance[] }
 */
export const getStaffAttendanceByDate = async (date) => {
  const response = await axiosClient.get("/attendance/staff/by-date", {
    params: { date },
  });
  return response.data;
};

/**
 * Attendance history for one staff member.
 * Query: academicYearId?, fromDate?, toDate?
 * Response: { success, message, data: { staff, summary, records } }
 */
export const getStaffAttendanceHistory = async (
  staffId,
  { academicYearId, fromDate, toDate } = {}
) => {
  const params = {};
  if (academicYearId != null && academicYearId !== "") {
    params.academicYearId = Number(academicYearId);
  }
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;

  const response = await axiosClient.get(
    `/attendance/staff/${Number(staffId)}/history`,
    { params }
  );
  return response.data;
};
