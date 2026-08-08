const attendanceService = require('./attendance.service');

const markClassAttendance = async (req, res, next) => {
  try {
    const data = await attendanceService.markClassAttendance(req.body, req.user.tenantId, req.user);
    return res.status(200).json({ success: true, message: data.message, data });
  } catch (error) {
    return next(error);
  }
};

const getClassAttendanceByDate = async (req, res, next) => {
  try {
    const { classId, sectionId, date } = req.query;
    if (!classId || !date) return res.status(400).json({ success: false, error: 'classId and date are required' });
    const data = await attendanceService.getClassAttendanceByDate(req.user.tenantId, classId, sectionId, date);
    return res.status(200).json({ success: true, message: 'Class attendance fetched', data });
  } catch (error) {
    return next(error);
  }
};

const getStudentAttendanceHistory = async (req, res, next) => {
  try {
    const { academicYearId, fromDate, toDate } = req.query;
    const data = await attendanceService.getStudentAttendanceHistory(
      req.user.tenantId, req.params.studentId, academicYearId, fromDate, toDate
    );
    return res.status(200).json({ success: true, message: 'Attendance history fetched', data });
  } catch (error) {
    return next(error);
  }
};

const getClassMonthlyAttendanceSummary = async (req, res, next) => {
  try {
    const { classId, sectionId, month, year, academicYearId } = req.query;
    if (!classId || !month || !year)
      return res.status(400).json({ success: false, error: 'classId, month and year are required' });
    const data = await attendanceService.getClassMonthlyAttendanceSummary(
      req.user.tenantId, classId, sectionId, parseInt(month), parseInt(year), academicYearId
    );
    return res.status(200).json({ success: true, message: 'Monthly summary fetched', data });
  } catch (error) {
    return next(error);
  }
};

const markStaffAttendance = async (req, res, next) => {
  try {
    const data = await attendanceService.markStaffAttendance(req.body, req.user.tenantId, req.user);
    return res.status(200).json({ success: true, message: 'Staff attendance marked', data });
  } catch (error) {
    return next(error);
  }
};

const getStaffAttendanceHistory = async (req, res, next) => {
  try {
    const { academicYearId, fromDate, toDate } = req.query;
    const data = await attendanceService.getStaffAttendanceHistory(
      req.user.tenantId, req.params.staffId, academicYearId, fromDate, toDate
    );
    return res.status(200).json({ success: true, message: 'Staff attendance history fetched', data });
  } catch (error) {
    return next(error);
  }
};

const getAllStaffAttendanceByDate = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, error: 'date is required' });
    const data = await attendanceService.getAllStaffAttendanceByDate(req.user.tenantId, date);
    return res.status(200).json({ success: true, message: 'Staff attendance fetched', data });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  markClassAttendance, getClassAttendanceByDate,
  getStudentAttendanceHistory, getClassMonthlyAttendanceSummary,
  markStaffAttendance, getStaffAttendanceHistory, getAllStaffAttendanceByDate,
};
