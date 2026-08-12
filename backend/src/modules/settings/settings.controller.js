const settingsService = require("./settings.service");

/**
 * ============================================================
 * SCHOOL INFO
 * ============================================================
 */
exports.getSchoolInfo = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const data = await settingsService.getSchoolInfo(tenantId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.updateSchoolInfo = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const data = await settingsService.updateSchoolInfo(tenantId, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * ============================================================
 * APP PREFERENCES
 * ============================================================
 */
exports.getPreferences = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const data = await settingsService.getPreferences(tenantId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.updatePreferences = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const data = await settingsService.updatePreferences(tenantId, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * ============================================================
 * MY PROFILE
 * ============================================================
 */
exports.getProfile = async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    const data = await settingsService.getProfile(userId, tenantId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    const data = await settingsService.updateProfile(userId, tenantId, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * ============================================================
 * CHANGE PASSWORD
 * ============================================================
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    const { currentPassword, newPassword } = req.body;
    const data = await settingsService.changePassword(userId, tenantId, {
      currentPassword,
      newPassword,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
