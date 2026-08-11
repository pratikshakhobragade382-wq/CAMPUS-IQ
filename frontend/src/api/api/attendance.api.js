/**
 * Re-export from the canonical attendance API.
 * Prefer importing from `src/api/attendance.api.js`.
 */
export {
  markClassAttendance,
  getClassAttendanceByDate,
  getClassMonthlyAttendanceSummary,
  getStudentAttendanceHistory,
  markStaffAttendance,
  getStaffAttendanceByDate,
  getStaffAttendanceHistory,
} from "../attendance.api";
