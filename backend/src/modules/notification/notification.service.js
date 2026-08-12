const prisma = require('../../prisma/prismaClient');

// =====================================================
// GET NOTIFICATIONS FOR THE BELL DROPDOWN
// =====================================================

const getNotifications = async (user) => {
  const { userId, tenantId, identity } = user;

  const notifications = await prisma.notification.findMany({
    where: {
      tenantId,
      isActive: true,

      // Don't show expired notifications
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],

      // Show notifications meant for this user
      AND: [
        {
          OR: [
            { audience: 'all' },
            { audience: identity },
            { audience: 'individual', userId },
          ],
        },
      ],
    },

    // Newest notifications first
    orderBy: {
      createdAt: 'desc',
    },

    // Keep the Bell dropdown small
    take: 10,

    // Check whether the logged-in user has read each notification
    include: {
      NotificationRead: {
        where: {
          userId,
        },
        select: {
          readAt: true,
        },
      },
    },
  });

  // Add a simple "isRead" value for the frontend
  return notifications.map((notification) => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    createdAt: notification.createdAt,
    isRead: notification.NotificationRead.length > 0,
  }));
};

// =====================================================
// GET ALL NOTIFICATIONS FROM THE PAST 15 DAYS
// =====================================================

const getAllNotifications = async (user) => {
  const { userId, tenantId, identity } = user;

  // Calculate the date 15 days ago
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  const notifications = await prisma.notification.findMany({
    where: {
      tenantId,
      isActive: true,

      // Only notifications created during the past 15 days
      createdAt: {
        gte: fifteenDaysAgo,
      },

      // Don't show expired notifications
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],

      // Show notifications meant for this user
      AND: [
        {
          OR: [
            { audience: 'all' },
            { audience: identity },
            { audience: 'individual', userId },
          ],
        },
      ],
    },

    // Newest notifications first
    orderBy: {
      createdAt: 'desc',
    },

    // Check whether the logged-in user has read each notification
    include: {
      NotificationRead: {
        where: {
          userId,
        },
        select: {
          readAt: true,
        },
      },
    },
  });

  // Return clean notification data for the frontend
  return notifications.map((notification) => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    createdAt: notification.createdAt,
    isRead: notification.NotificationRead.length > 0,
  }));
};

// =====================================================
// GET UNREAD NOTIFICATION COUNT
// =====================================================

const getUnreadCount = async (user) => {
  const { userId, tenantId, identity } = user;

  const count = await prisma.notification.count({
    where: {
      tenantId,
      isActive: true,

      // Don't count expired notifications
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],

      // Only count notifications meant for this user
      AND: [
        {
          OR: [
            { audience: 'all' },
            { audience: identity },
            { audience: 'individual', userId },
          ],
        },
      ],

      // Notification must NOT have been read by this user
      NotificationRead: {
        none: {
          userId,
        },
      },
    },
  });

  return count;
};

// =====================================================
// MARK ONE NOTIFICATION AS READ
// =====================================================

const markAsRead = async (notificationId, user) => {
  const { userId, tenantId } = user;

  const notification = await prisma.notification.findFirst({
    where: {
      id: parseInt(notificationId, 10),
      tenantId,
      isActive: true,
    },
  });

  if (!notification) {
    return null;
  }

  // Create or update the read record
  return prisma.notificationRead.upsert({
    where: {
      notificationId_userId: {
        notificationId: notification.id,
        userId,
      },
    },

    // Already read -> update the read time
    update: {
      readAt: new Date(),
    },

    // First time reading -> create a read record
    create: {
      tenantId,
      notificationId: notification.id,
      userId,
    },
  });
};

// =====================================================
// MARK ALL NOTIFICATIONS AS READ
// =====================================================

const markAllAsRead = async (user) => {
  const { userId, tenantId, identity } = user;

  // Find every notification visible to this user that
  // does NOT already have a read record for them.
  const unreadNotifications = await prisma.notification.findMany({
    where: {
      tenantId,
      isActive: true,

      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],

      AND: [
        {
          OR: [
            { audience: 'all' },
            { audience: identity },
            { audience: 'individual', userId },
          ],
        },
      ],

      NotificationRead: {
        none: {
          userId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (unreadNotifications.length === 0) {
    return { markedCount: 0 };
  }

  // Create a "read" record for each one, in a single batch insert.
  // skipDuplicates guards against a race condition where a notification
  // was marked read individually at the exact same moment.
  await prisma.notificationRead.createMany({
    data: unreadNotifications.map((n) => ({
      tenantId,
      notificationId: n.id,
      userId,
    })),
    skipDuplicates: true,
  });

  return { markedCount: unreadNotifications.length };
};

// =====================================================
// DELETE ONE NOTIFICATION
// =====================================================

const deleteNotification = async (notificationId, user) => {
  const { userId, tenantId, identity } = user;

  const id = parseInt(notificationId, 10);

  if (Number.isNaN(id)) {
    return null;
  }

  // Make sure this notification belongs to the
  // current tenant and is actually visible to this user.
  const notification = await prisma.notification.findFirst({
    where: {
      id,
      tenantId,
      isActive: true,

      OR: [
        { audience: 'all' },
        { audience: identity },
        {
          audience: 'individual',
          userId,
        },
      ],
    },
  });

  if (!notification) {
    return null;
  }

  // Soft delete the notification.
  // We keep the database record but hide it from users.
  await prisma.notification.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });

  return {
    message: 'Notification deleted successfully',
  };
};

// =====================================================
// DELETE ALL NOTIFICATIONS
// =====================================================

const deleteAllNotifications = async (user) => {
  const { userId, tenantId, identity } = user;

  // Only delete notifications that are visible
  // to the currently logged-in user.
  const result = await prisma.notification.updateMany({
    where: {
      tenantId,
      isActive: true,

      OR: [
        { audience: 'all' },
        { audience: identity },
        {
          audience: 'individual',
          userId,
        },
      ],
    },

    // Soft delete
    data: {
      isActive: false,
    },
  });

  return {
    message: 'All notifications deleted successfully',
    deletedCount: result.count,
  };
};

// =====================================================
// CREATE A NEW NOTIFICATION
// =====================================================

const createNotification = async ({
  tenantId,
  title,
  message,
  type = 'general',
  priority = 'normal',
  audience = 'all',
  userId = null,
  createdById = null,
}) => {
  return prisma.notification.create({
    data: {
      tenantId,
      title,
      message,
      type,
      priority,
      audience,
      userId,
      createdById,
    },
  });
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