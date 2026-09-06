const express = require("express");
const router = express.Router();

const studentPortalController = require("./studentPortal.controller");
const authenticate = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/authorize");

router.use(authenticate);
router.use(authorize("student"));

router.get("/profile", studentPortalController.getMyProfile);
router.get("/attendance", studentPortalController.getMyAttendance);
router.get("/exam-marks", studentPortalController.getMyExamMarks);
router.get("/timetable", studentPortalController.getMyTimetable);
router.get("/fees", studentPortalController.getMyFees);
router.get("/assignments", studentPortalController.getMyAssignments);
router.post("/assignments/:assignmentId/submit", studentPortalController.submitAssignment);
router.get("/calendar", studentPortalController.getMyCalendar);

module.exports = router;
