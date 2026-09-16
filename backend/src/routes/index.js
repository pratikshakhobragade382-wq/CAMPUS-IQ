const express = require("express");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| ROUTE IMPORTS
|--------------------------------------------------------------------------
*/

const authRoutes = require("../modules/auth/authRoutes");

const studentRoutes = require("../modules/student/student.routes");
const staffRoutes = require("../modules/staff/staff.routes");
const parentRoutes = require("../modules/parent/parent.routes");

const attendanceRoutes = require("../modules/attendance/attendance.routes");
const assignmentRoutes = require("../modules/assignment/assignment.routes");
const examRoutes = require("../modules/exam/exam.routes");

const classRoutes = require("../modules/class/class.routes");
const departmentRoutes = require("../modules/department/department.routes");
const sectionRoutes = require("../modules/section/section.routes");

const dashboardRoutes = require("../modules/dashboard/dashboard.routes");

const academicYearRoutes = require("../modules/academicYear/academicYearRoutes");

const feeRoutes = require("../modules/fee/fee.routes");
const holidayRoutes = require("../modules/holiday/holiday.routes");

const timetableRoutes = require("../modules/timetable/timetable.routes");

const notificationRoutes = require("../modules/notification/notification.routes");

const customFieldsRoutes = require("../modules/custom-fields/custom-fields.routes");

const settingsRoutes = require("../modules/settings/settings.routes");

const masterDataRoutes = require("../modules/master-data/master-data.routes");

const subjectRoutes = require("../modules/master/subject.routes");

const aiRoutes = require("../modules/ai/ai.routes");

const performanceRoutes = require("../modules/performance/performance.routes");

const chatbotRoutes = require("../modules/chatbot/chatbot.routes");

const studentPortalRoutes = require("../modules/student-portal/studentPortal.routes");


/*
|--------------------------------------------------------------------------
| ROUTE MOUNTS
|--------------------------------------------------------------------------
*/

router.use("/auth", authRoutes);

router.use("/students", studentRoutes);

router.use("/staff", staffRoutes);

router.use("/parents", parentRoutes);

router.use("/parents", performanceRoutes);

router.use("/attendance", attendanceRoutes);

router.use("/assignments", assignmentRoutes);

router.use("/exams", examRoutes);

router.use("/classes", classRoutes);

router.use("/departments", departmentRoutes);

router.use("/sections", sectionRoutes);

router.use("/dashboard", dashboardRoutes);

router.use("/academic-years", academicYearRoutes);

router.use("/fees", feeRoutes);

router.use("/holidays", holidayRoutes);

router.use("/timetable", timetableRoutes);

router.use("/notifications", notificationRoutes);

router.use("/custom-fields", customFieldsRoutes);

router.use("/settings", settingsRoutes);

router.use("/master-data", masterDataRoutes);

router.use("/subjects", subjectRoutes);

router.use("/ai", aiRoutes);

router.use("/chatbot", chatbotRoutes);

router.use("/student-portal", studentPortalRoutes);


/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;