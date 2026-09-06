const dashboardService = require('./dashboard.service');

exports.getSummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getSummary(req.user.tenantId);
    res.status(200).json({ success: true, message: 'Dashboard summary fetched successfully', data });
  } catch (err) {
    next(err);
  }
};

exports.getTeacherSummary = async (req, res, next) => {
  try {
    // staffId is ALWAYS taken from the authenticated user's JWT, never from
    // query/body — a teacher can only ever see their own summary this way.
    if (req.user.identity !== 'staff' || req.user.staffRole !== 'teacher' || !req.user.staffId) {
      return res.status(403).json({ success: false, error: 'This endpoint is for teacher accounts only' });
    }
    const data = await dashboardService.getTeacherSummary(req.user.tenantId, req.user.staffId);
    res.status(200).json({ success: true, message: 'Teacher dashboard summary fetched successfully', data });
  } catch (err) {
    next(err);
  }
};
exports.getStudentSummary = async (req, res, next) => {
  try {
    // studentId is ALWAYS taken from the authenticated user's JWT, never
    // from query/body — a student can only ever see their own summary.
    if (req.user.identity !== 'student' || !req.user.studentId) {
      return res.status(403).json({ success: false, error: 'This endpoint is for student accounts only' });
    }
    const data = await dashboardService.getStudentSummary(req.user.tenantId, req.user.studentId);
    res.status(200).json({ success: true, message: 'Student dashboard summary fetched successfully', data });
  } catch (err) {
    if (err.message === 'Student not found') {
      return res.status(404).json({ success: false, error: err.message });
    }
    next(err);
  }
};

exports.getParentSummary = async (req, res, next) => {
  try {
    // userId is ALWAYS taken from the authenticated user's JWT, never from
    // query/body — a parent can only ever see their own linked children.
    if (req.user.identity !== 'parent' || !req.user.userId) {
      return res.status(403).json({ success: false, error: 'This endpoint is for parent accounts only' });
    }
    const data = await dashboardService.getParentSummary(req.user.tenantId, req.user.userId, req.query.studentId);
    res.status(200).json({ success: true, message: 'Parent dashboard summary fetched successfully', data });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'No linked children found') {
      return res.status(404).json({ success: false, error: err.message });
    }
    next(err);
  }
};
