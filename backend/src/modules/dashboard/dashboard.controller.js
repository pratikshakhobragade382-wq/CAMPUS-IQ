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