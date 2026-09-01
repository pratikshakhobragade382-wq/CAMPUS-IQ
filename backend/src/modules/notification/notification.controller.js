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
    console.error("GET NOTIFICATIONS ERROR:", error);
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
    console.error("GET ALL NOTIFICATIONS ERROR:", error);
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
    console.error("GET UNREAD COUNT ERROR:", error);
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
    console.error("MARK AS READ ERROR:", error);
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
    console.error("MARK ALL AS READ ERROR:", error);
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
    console.error("DELETE NOTIFICATION ERROR:", error);
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
    console.error("DELETE ALL NOTIFICATIONS ERROR:", error);
    return next(error);
  }
};

// =====================================================
// CREATE NOTIFICATION
// =====================================================
//
// POST /api/v1/notifications
//
// Supported audiences:
//
// admin
// parent
// student
//
// =====================================================

const createNotification = async (req, res, next) => {
  try {
    console.log("==========================================");
    console.log("CREATE NOTIFICATION REQUEST");
    console.log("BODY:", req.body);
    console.log("USER:", req.user);
    console.log("==========================================");

    const {
      title,
      message,
      type,
      priority,

      // New frontend format
      audience,

      // Old frontend format
      recipient,

      userId,
      classId,
      sectionId,
      expiresAt,
    } = req.body;

    // =================================================
    // TITLE VALIDATION
    // =================================================

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Notification title is required",
      });
    }

    // =================================================
    // MESSAGE VALIDATION
    // =================================================

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Notification message is required",
      });
    }

    // =================================================
    // RESOLVE AUDIENCE
    // =================================================
    //
    // Frontend may send:
    //
    // audience: "admin"
    //
    // OR old code may send:
    //
    // recipient: "Admin"
    //
    // We support both.
    // =================================================

    let resolvedAudience = audience;

    if (!resolvedAudience && recipient) {
      const recipientMap = {
        Admin: "admin",
        admin: "admin",

        Parents: "parent",
        Parent: "parent",
        parents: "parent",
        parent: "parent",

        Students: "student",
        Student: "student",
        students: "student",
        student: "student",
      };

      resolvedAudience =
        recipientMap[recipient] || recipient.toLowerCase();
    }

    // =================================================
    // AUDIENCE REQUIRED
    // =================================================

    if (!resolvedAudience) {
      return res.status(400).json({
        success: false,
        message: "Notification audience is required",
      });
    }

    // =================================================
    // NORMALIZE AUDIENCE
    // =================================================

    resolvedAudience =
      String(resolvedAudience)
        .trim()
        .toLowerCase();

    // =================================================
    // ONLY THESE 3 AUDIENCES ARE ALLOWED
    // =================================================

    const allowedAudiences = [
      "admin",
      "parent",
      "student",
    ];

    if (
      !allowedAudiences.includes(
        resolvedAudience
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid notification audience. Only admin, parent and student are allowed.",
      });
    }

    // =================================================
    // ALLOWED TYPES
    // =================================================

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

    const notificationType =
      type || "general";

    if (
      !allowedTypes.includes(
        notificationType
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification type",
      });
    }

    // =================================================
    // ALLOWED PRIORITIES
    // =================================================

    const allowedPriorities = [
      "low",
      "normal",
      "high",
      "urgent",
    ];

    const notificationPriority =
      priority || "normal";

    if (
      !allowedPriorities.includes(
        notificationPriority
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification priority",
      });
    }

    // =================================================
    // USER INFORMATION
    // =================================================

    const tenantId =
      req.user?.tenantId;

    const createdById =
      req.user?.userId ||
      req.user?.id;

    if (!tenantId) {
      console.error(
        "Tenant ID missing from req.user:",
        req.user
      );

      return res.status(400).json({
        success: false,
        message:
          "Tenant information is missing",
      });
    }

    if (!createdById) {
      console.error(
        "User ID missing from req.user:",
        req.user
      );

      return res.status(401).json({
        success: false,
        message:
          "Logged-in user information is missing",
      });
    }

    // =================================================
    // INDIVIDUAL USER VALIDATION
    // =================================================

    if (
      resolvedAudience === "individual" &&
      !userId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "userId is required for individual notifications",
      });
    }

    // =================================================
    // CLASS VALIDATION
    // =================================================

    if (
      resolvedAudience === "class" &&
      !classId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "classId is required for class notifications",
      });
    }

    // =================================================
    // EXPIRY DATE
    // =================================================

    let notificationExpiresAt = null;

    if (expiresAt) {
      const parsedDate =
        new Date(expiresAt);

      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid notification expiry date",
        });
      }

      notificationExpiresAt =
        parsedDate;
    }

    // =================================================
    // CREATE NOTIFICATION
    // =================================================

    const notification =
      await notificationService.createNotification({
        tenantId,

        title: title.trim(),

        message: message.trim(),

        type: notificationType,

        priority: notificationPriority,

        audience: resolvedAudience,

        userId: userId || null,

        classId: classId || null,

        sectionId: sectionId || null,

        expiresAt:
          notificationExpiresAt,

        createdById,
      });

    // =================================================
    // SUCCESS
    // =================================================

    console.log(
      "Notification created successfully:",
      notification
    );

    return res.status(201).json({
      success: true,
      message:
        "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    console.error(
      "CREATE NOTIFICATION ERROR:",
      error
    );

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