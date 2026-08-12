const express = require('express');
const router = express.Router();

const authMiddleware = require('../../middleware/authMiddleware');
const notificationController = require('./notification.controller');

// =====================================================
// All notification routes require login
// =====================================================

router.use(authMiddleware);

// =====================================================
// GET LATEST NOTIFICATIONS
// Used by the notification bell
// GET /api/v1/notifications
// =====================================================

router.get(
  '/',
  notificationController.getNotifications
);

// =====================================================
// GET ALL NOTIFICATIONS FROM PAST 15 DAYS
// Used by the Notifications page
// GET /api/v1/notifications/all
// =====================================================

router.get(
  '/all',
  notificationController.getAllNotifications
);

// =====================================================
// GET UNREAD NOTIFICATION COUNT
// GET /api/v1/notifications/unread-count
// =====================================================

router.get(
  '/unread-count',
  notificationController.getUnreadCount
);

// =====================================================
// MARK ONE NOTIFICATION AS READ
// PUT /api/v1/notifications/:id/read
// =====================================================

router.put(
  '/:id/read',
  notificationController.markAsRead
);

// =====================================================
// MARK ALL NOTIFICATIONS AS READ
// PUT /api/v1/notifications/read-all
// =====================================================

router.put(
  '/read-all',
  notificationController.markAllAsRead
);

// =====================================================
// DELETE ONE NOTIFICATION
// DELETE /api/v1/notifications/:id
// =====================================================

router.delete(
  '/:id',
  notificationController.deleteNotification
);

// =====================================================
// DELETE ALL NOTIFICATIONS
// DELETE /api/v1/notifications
// =====================================================

router.delete(
  '/',
  notificationController.deleteAllNotifications
);

module.exports = router;