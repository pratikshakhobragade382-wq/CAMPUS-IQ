const express = require("express");

const router = express.Router();

const authMiddleware = require("../../middleware/authMiddleware");

const notificationController = require("./notification.controller");

// =====================================================
// ALL NOTIFICATION ROUTES REQUIRE LOGIN
// =====================================================

router.use(authMiddleware);

// =====================================================
// CREATE NOTIFICATION
// =====================================================
//
// POST /api/v1/notifications
//
// Example:
//
// {
//   "title": "Parent Meeting",
//   "message": "Parent meeting will be held on Monday.",
//   "type": "parent_meeting",
//   "priority": "high",
//   "audience": "parent"
// }
//
// =====================================================

router.post(
  "/",
  notificationController.createNotification
);

// =====================================================
// GET LATEST NOTIFICATIONS
// =====================================================
//
// GET /api/v1/notifications
//
// Used by notification bell.
// =====================================================

router.get(
  "/",
  notificationController.getNotifications
);

// =====================================================
// GET ALL NOTIFICATIONS
// =====================================================
//
// GET /api/v1/notifications/all
// =====================================================

router.get(
  "/all",
  notificationController.getAllNotifications
);

// =====================================================
// GET UNREAD COUNT
// =====================================================
//
// GET /api/v1/notifications/unread-count
// =====================================================

router.get(
  "/unread-count",
  notificationController.getUnreadCount
);

// =====================================================
// MARK ONE AS READ
// =====================================================
//
// PUT /api/v1/notifications/:id/read
// =====================================================

router.put(
  "/:id/read",
  notificationController.markAsRead
);

// =====================================================
// MARK ALL AS READ
// =====================================================
//
// PUT /api/v1/notifications/read-all
// =====================================================

router.put(
  "/read-all",
  notificationController.markAllAsRead
);

// =====================================================
// DELETE ONE
// =====================================================
//
// DELETE /api/v1/notifications/:id
// =====================================================

router.delete(
  "/:id",
  notificationController.deleteNotification
);

// =====================================================
// DELETE ALL
// =====================================================
//
// DELETE /api/v1/notifications
// =====================================================

router.delete(
  "/",
  notificationController.deleteAllNotifications
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;