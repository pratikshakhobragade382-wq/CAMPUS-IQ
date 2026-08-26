const express = require('express');
const router = express.Router();
const controller = require('./attendance.controller');
const authenticate = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/authorize');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Student and staff attendance management
 */

router.post(
  '/students/mark-class',
  authorize('admin', 'management', 'principal', 'teacher'),
  controller.markClassAttendance
);

router.get(
  '/students/class',
  authorize('admin', 'management', 'principal', 'teacher'),
  controller.getClassAttendanceByDate
);

router.get(
  '/students/monthly-summary',
  authorize('admin', 'management', 'principal', 'teacher'),
  controller.getClassMonthlyAttendanceSummary
);

router.get(
  '/students/:studentId/history',
  authorize('admin', 'management', 'principal', 'teacher'),
  controller.getStudentAttendanceHistory
);

router.post(
  '/staff/mark',
  authorize('admin', 'management', 'principal'),
  controller.markStaffAttendance
);

router.get(
  '/staff/by-date',
  authorize('admin', 'management', 'principal'),
  controller.getAllStaffAttendanceByDate
);

// A staff member may view their own attendance history; only admin/management/
// principal may look up someone else's by id. Ownership is enforced in the controller.
router.get(
  '/staff/:staffId/history',
  authorize('admin', 'management', 'principal', 'teacher', 'accountant', 'librarian', 'clerk', 'receptionist', 'nurse', 'counselor', 'coordinator', 'lab_assistant', 'peon', 'driver', 'security', 'other'),
  controller.getStaffAttendanceHistory
);

module.exports = router;
