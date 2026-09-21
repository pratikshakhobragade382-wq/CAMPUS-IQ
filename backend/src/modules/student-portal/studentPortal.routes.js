const express = require("express");

const router =
  express.Router();

const studentPortalController =
  require("./studentPortal.controller");

const authenticate =
  require("../../middleware/authMiddleware");

const authorize =
  require("../../middleware/authorize");

/* ============================================================
   STUDENT AUTHENTICATION
============================================================ */

router.use(authenticate);

router.use(
  authorize("student")
);

/* ============================================================
   PROFILE
============================================================ */

router.get(
  "/profile",
  studentPortalController.getMyProfile
);

/* ============================================================
   ATTENDANCE
============================================================ */

router.get(
  "/attendance",
  studentPortalController.getMyAttendance
);

/* ============================================================
   EXAMS
============================================================ */

router.get(
  "/exam-marks",
  studentPortalController.getMyExamMarks
);

/* ============================================================
   TIMETABLE
============================================================ */

router.get(
  "/timetable",
  studentPortalController.getMyTimetable
);

/* ============================================================
   FEES
============================================================ */

router.get(
  "/fees",
  studentPortalController.getMyFees
);

/* ============================================================
   ASSIGNMENTS
============================================================ */

router.get(
  "/assignments",
  studentPortalController.getMyAssignments
);

router.post(
  "/assignments/:assignmentId/submit",
  studentPortalController.submitAssignment
);

/* ============================================================
   CALENDAR
============================================================ */

router.get(
  "/calendar",
  studentPortalController.getMyCalendar
);

/* ============================================================
   PERFORMANCE
============================================================ */

router.get(
  "/performance",
  studentPortalController.getMyPerformance
);

module.exports = router;