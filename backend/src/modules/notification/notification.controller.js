const notificationService = require("./notification.service");

// =====================================================
// GET NOTIFICATIONS FOR BELL
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
// GET ALL NOTIFICATIONS
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
// GET UNREAD COUNT
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
// MARK ONE AS READ
// =====================================================

const markAsRead = async (req, res, next) => {
  try {
    const result =
      await notificationService.markAsRead(
        req.params.id,
        req.user
      );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// MARK ALL AS READ
// =====================================================

const markAllAsRead = async (req, res, next) => {
  try {
    const result =
      await notificationService.markAllAsRead(req.user);

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
        message: "Notification not found",
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
// CREATE NOTIFICATION
// =====================================================
// Used by admin / teacher to send announcements.
//
// POST /api/v1/notifications
// =====================================================

const createNotification = async (req, res, next) => {
  try {
    const {
      title,
      message,
      type,
      priority,
      audience,
      userId,
      classId,
      sectionId,
      expiresAt,
    } = req.body;

    // -------------------------------------------------
    // Basic validation
    // -------------------------------------------------

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Notification title is required",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Notification message is required",
      });
    }

    if (!audience) {
      return res.status(400).json({
        success: false,
        message: "Notification audience is required",
      });
    }

    // -------------------------------------------------
    // Allowed notification types
    // -------------------------------------------------

    const allowedTypes = [
      "general",
      "announcement",
      "new_student",
      "student_assigned",
      "activity",
      "homework",
      "attendance",
      "exam",
      "parent_meeting",
      "class",
      "section",
      "important",
    ];

    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification type",
      });
    }

    // -------------------------------------------------
    // Allowed priorities
    // -------------------------------------------------

    const allowedPriorities = [
      "low",
      "normal",
      "high",
      "urgent",
    ];

    if (
      priority &&
      !allowedPriorities.includes(priority)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification priority",
      });
    }

    // -------------------------------------------------
    // Allowed audiences
    // -------------------------------------------------

    const allowedAudiences = [
      "all",
      "admin",
      "staff",
      "teacher",
      "student",
      "parent",
      "class",
      "individual",
    ];

    if (!allowedAudiences.includes(audience)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification audience",
      });
    }

    // -------------------------------------------------
    // Individual notification requires userId
    // -------------------------------------------------

    if (
      audience === "individual" &&
      !userId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "userId is required for individual notifications",
      });
    }

    // -------------------------------------------------
    // Class notification requires classId
    // -------------------------------------------------

    if (
      audience === "class" &&
      !classId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "classId is required for class notifications",
      });
    }

    // -------------------------------------------------
    // Resolve logged-in user
    // -------------------------------------------------

    const tenantId = req.user.tenantId;
    const createdById = req.user.userId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant information is missing",
      });
    }

    // -------------------------------------------------
    // Create notification
    // -------------------------------------------------

    const notification =
      await notificationService.createNotification({
        tenantId,
        title: title.trim(),
        message: message.trim(),
        type: type || "general",
        priority: priority || "normal",
        audience,
        userId: userId || null,
        classId: classId || null,
        sectionId: sectionId || null,
        expiresAt: expiresAt
          ? new Date(expiresAt)
          : null,
        createdById,
      });

    return res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
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
  createNotification,
};