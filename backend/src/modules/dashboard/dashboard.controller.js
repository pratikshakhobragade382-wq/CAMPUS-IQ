const dashboardService = require('./dashboard.service');

exports.getSummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getSummary(req.user.tenantId);
    res.status(200).json({ success: true, message: 'Dashboard summary fetched successfully', data });
  } catch (err) {
    next(err);
  }
};