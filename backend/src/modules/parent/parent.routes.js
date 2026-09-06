const express = require("express");
const router = express.Router();

const parentController = require("./parent.controller");
const authenticate = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/authorize");

router.use(authenticate);
router.use(authorize("parent"));

router.get("/children", parentController.getMyChildren);
router.get("/children/:studentId", parentController.getChildProfile);
router.get("/children/:studentId/attendance", parentController.getChildAttendance);
router.get("/children/:studentId/exam-marks", parentController.getChildExamMarks);
router.get("/children/:studentId/timetable", parentController.getChildTimetable);
router.get("/children/:studentId/fees", parentController.getChildFees);
router.get("/children/:studentId/assignments", parentController.getChildAssignments);

module.exports = router;
