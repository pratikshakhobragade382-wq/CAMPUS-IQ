const notificationService = require('./notification.service');

// =====================================================
// GET NOTIFICATIONS FOR THE BELL DROPDOWN
// =====================================================

const getNotifications = async (req, res, next) => {
  try {
    const notifications =
      await notificationService.getNotifications(req.user);

    return res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// GET ALL NOTIFICATIONS FROM THE PAST 15 DAYS
// =====================================================

const getAllNotifications = async (req, res, next) => {
  try {
    const notifications =
      await notificationService.getAllNotifications(req.user);

    return res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// GET UNREAD NOTIFICATION COUNT
// =====================================================

const getUnreadCount = async (req, res, next) => {
  try {
    const count =
      await notificationService.getUnreadCount(req.user);

    return res.json({
      success: true,
      data: {
        count,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// MARK ONE NOTIFICATION AS READ
// =====================================================

const markAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAsRead(
      req.params.id,
      req.user
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    return res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// MARK ALL NOTIFICATIONS AS READ
// =====================================================

const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user);

    return res.json({
      success: true,
      message: `${result.markedCount} notification(s) marked as read`,
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// DELETE ONE NOTIFICATION
// =====================================================

const deleteNotification = async (req, res, next) => {
  try {
    const result =
      await notificationService.deleteNotification(
        req.params.id,
        req.user
      );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// DELETE ALL NOTIFICATIONS
// =====================================================

const deleteAllNotifications = async (req, res, next) => {
  try {
    const result =
      await notificationService.deleteAllNotifications(
        req.user
      );

    return res.json({
      success: true,
      message: result.message,
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  getNotifications,
  getAllNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
};