
const express = require('express');

const router = express.Router();

// =========================================================
// IMPORT ROUTES
// =========================================================

const authRoutes = require('../modules/auth/authRoutes');
const academicYearRoutes = require('../modules/academicYear/academicYearRoutes');
const classRoutes = require('../modules/class/class.routes');
const sectionRoutes = require('../modules/section/section.routes');
const departmentRoutes = require('../modules/department/department.routes');
const subjectRoutes = require('../modules/master/subject.routes');
const staffRoutes = require('../modules/staff/staff.routes');
const studentRoutes = require('../modules/student/student.routes');
const masterDataRoutes = require('../modules/master-data/master-data.routes');
const customFieldsRoutes = require('../modules/custom-fields/custom-fields.routes');
const timetableRoutes = require('../modules/timetable/timetable.routes');
const attendanceRoutes = require('../modules/attendance/attendance.routes');
const holidayRoutes = require('../modules/holiday/holiday.routes');
const feeRoutes = require('../modules/fee/fee.routes');
const examRoutes = require('../modules/exam/exam.routes');
const assignmentRoutes = require('../modules/assignment/assignment.routes');
const settingsRoutes = require('../modules/settings/settings.routes');
const notificationRoutes = require('../modules/notification/notification.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');
const aiRoutes = require('../modules/ai/ai.routes');
const chatbotRoutes = require("../modules/chatbot/chatbot.routes");
// =========================================================
// ROUTE CHECKER
// =========================================================

function registerRoute(path, route, routeName) {
  console.log(
    `[ROUTE CHECK] ${routeName}: ${typeof route}`
  );

  if (typeof route !== 'function') {
    console.error('');
    console.error('==============================================');
    console.error('ERROR: INVALID ROUTE');
    console.error('==============================================');
    console.error(`Route name : ${routeName}`);
    console.error(`Route path : ${path}`);
    console.error(`Type       : ${typeof route}`);
    console.error('');
    console.error(
      'This route file is not exporting an Express router.'
    );
    console.error(
      'It should normally end with: module.exports = router;'
    );
    console.error('==============================================');
    console.error('');

    throw new TypeError(
      `Invalid route "${routeName}". Expected an Express router/function but received ${typeof route}.`
    );
  }

  router.use(path, route);
}

// =========================================================
// REGISTER ROUTES
// =========================================================

registerRoute(
  '/dashboard',
  dashboardRoutes,
  'dashboard'
);

registerRoute(
  '/auth',
  authRoutes,
  'auth'
);

registerRoute(
  '/academic-years',
  academicYearRoutes,
  'academicYears'
);

registerRoute(
  '/classes',
  classRoutes,
  'classes'
);

registerRoute(
  '/sections',
  sectionRoutes,
  'sections'
);

registerRoute(
  '/departments',
  departmentRoutes,
  'departments'
);

registerRoute(
  '/subjects',
  subjectRoutes,
  'subjects'
);

registerRoute(
  '/staff',
  staffRoutes,
  'staff'
);

registerRoute(
  '/students',
  studentRoutes,
  'students'
);

registerRoute(
  '/master-data',
  masterDataRoutes,
  'masterData'
);

registerRoute(
  '/custom-fields',
  customFieldsRoutes,
  'customFields'
);

registerRoute(
  '/timetable',
  timetableRoutes,
  'timetable'
);

registerRoute(
  '/attendance',
  attendanceRoutes,
  'attendance'
);

registerRoute(
  '/holidays',
  holidayRoutes,
  'holidays'
);

registerRoute(
  '/fees',
  feeRoutes,
  'fees'
);

registerRoute(
  '/exams',
  examRoutes,
  'exams'
);

registerRoute(
  '/assignments',
  assignmentRoutes,
  'assignments'
);

registerRoute(
  '/settings',
  settingsRoutes,
  'settings'
);

registerRoute(
  '/notifications',
  notificationRoutes,
  'notifications'
);

registerRoute(
  '/ai',
  aiRoutes,
  'ai'
);
registerRoute(
  "/chatbot",
  chatbotRoutes,
  "chatbot"
);
// =========================================================
// EXPORT ROUTER
// =========================================================

module.exports = router;

