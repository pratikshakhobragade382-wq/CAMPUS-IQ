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

router.get('/students/:studentId/history', controller.getStudentAttendanceHistory);

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

router.get('/staff/:staffId/history', controller.getStaffAttendanceHistory);

module.exports = router;
