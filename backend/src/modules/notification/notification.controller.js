const notificationService = require("./notification.service");
const prisma = require("../../prisma/prismaClient");

// =====================================================
// GET NOTIFICATIONS FOR CURRENT USER
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
// GET ALL NOTIFICATIONS FOR CURRENT USER
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
    console.error(
      "DELETE ALL NOTIFICATIONS ERROR:",
      error
    );

    return next(error);
  }
};

// =====================================================
// CREATE NOTIFICATION
// =====================================================
//
// Teacher can manually send to:
//
// 1. Admin
// 2. Parents
// 3. Students
//
// Teacher cannot manually send to another teacher/staff.
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
      audience,
      recipient,
      userId,
      classId,
      sectionId,
      expiresAt,
    } = req.body;

    // ===================================================
    // TITLE
    // ===================================================

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Notification title is required",
      });
    }

    // ===================================================
    // MESSAGE
    // ===================================================

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Notification message is required",
      });
    }

    // ===================================================
    // RESOLVE AUDIENCE
    // ===================================================

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
        recipientMap[recipient] ||
        String(recipient).toLowerCase();
    }

    if (!resolvedAudience) {
      return res.status(400).json({
        success: false,
        message: "Notification audience is required",
      });
    }

    resolvedAudience = String(
      resolvedAudience
    )
      .trim()
      .toLowerCase();

    // ===================================================
    // ONLY ALLOW ADMIN / PARENT / STUDENT
    // ===================================================

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

    // ===================================================
    // NOTIFICATION TYPE
    // ===================================================

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
      "assignment",
      "timetable",
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

    // ===================================================
    // PRIORITY
    // ===================================================

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

    // ===================================================
    // LOGGED-IN USER
    // ===================================================

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

    // ===================================================
    // STUDENT CLASS / SECTION VALIDATION
    // ===================================================

    if (
      resolvedAudience === "student"
    ) {
      if (
        sectionId &&
        !classId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "classId is required when sectionId is provided",
        });
      }

      if (classId) {
        const numericClassId =
          Number(classId);

        if (
          !Number.isInteger(
            numericClassId
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid classId",
          });
        }

        const validClass =
          await prisma.class.findFirst({
            where: {
              id: numericClassId,
              tenantId,
              isDeleted: false,
            },
            select: {
              id: true,
            },
          });

        if (!validClass) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid class for this school",
          });
        }
      }

      if (sectionId) {
        const numericSectionId =
          Number(sectionId);

        const numericClassId =
          Number(classId);

        if (
          !Number.isInteger(
            numericSectionId
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid sectionId",
          });
        }

        const validSection =
          await prisma.section.findFirst({
            where: {
              id: numericSectionId,
              classId: numericClassId,
              tenantId,
              isDeleted: false,
            },
            select: {
              id: true,
            },
          });

        if (!validSection) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid section for the selected class",
          });
        }
      }
    } else if (
      classId ||
      sectionId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Class and section can only be used for student notifications",
      });
    }

    // ===================================================
    // EXPIRY DATE
    // ===================================================

    let notificationExpiresAt =
      null;

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

    // ===================================================
    // CREATE
    // ===================================================

    const notification =
      await notificationService.createNotification({
        tenantId,

        title: title.trim(),

        message: message.trim(),

        type: notificationType,

        priority:
          notificationPriority,

        audience:
          resolvedAudience,

        userId:
          userId
            ? Number(userId)
            : null,

        classId:
          classId
            ? Number(classId)
            : null,

        sectionId:
          sectionId
            ? Number(sectionId)
            : null,

        expiresAt:
          notificationExpiresAt,

        createdById:
          Number(createdById),
      });

    // ===================================================
    // SUCCESS
    // ===================================================

    console.log(
      "NOTIFICATION CREATED SUCCESSFULLY:",
      notification.id
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