const express = require('express');
const router = express.Router();

const authRoutes         = require('../modules/auth/authRoutes');
const academicYearRoutes = require('../modules/academicYear/academicYearRoutes');
const classRoutes        = require('../modules/class/class.routes');
const sectionRoutes      = require('../modules/section/section.routes');
const departmentRoutes   = require('../modules/department/department.routes');
const subjectRoutes      = require('../modules/master/subject.routes');
const staffRoutes        = require('../modules/staff/staff.routes');
const studentRoutes      = require('../modules/student/student.routes');
const masterDataRoutes   = require('../modules/master-data/master-data.routes');
const customFieldsRoutes = require('../modules/custom-fields/custom-fields.routes');
const timetableRoutes    = require('../modules/timetable/timetable.routes');
const attendanceRoutes   = require('../modules/attendance/attendance.routes');
const holidayRoutes      = require('../modules/holiday/holiday.routes');
const feeRoutes          = require('../modules/fee/fee.routes');
const examRoutes         = require('../modules/exam/exam.routes');
const settingsRoutes     = require('../modules/settings/settings.routes');

router.use('/auth',           authRoutes);
router.use('/academic-years', academicYearRoutes);
router.use('/classes',        classRoutes);
router.use('/sections',       sectionRoutes);
router.use('/departments',    departmentRoutes);
router.use('/subjects',       subjectRoutes);
router.use('/staff',          staffRoutes);
router.use('/students',       studentRoutes);
router.use('/master-data',    masterDataRoutes);
router.use('/custom-fields',  customFieldsRoutes);
router.use('/timetable',      timetableRoutes);
router.use('/attendance',     attendanceRoutes);
router.use('/holidays',       holidayRoutes);
router.use('/fees',           feeRoutes);
router.use('/exams',          examRoutes);
router.use('/settings',       settingsRoutes);

module.exports = router;
