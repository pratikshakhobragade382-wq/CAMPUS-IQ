const prisma = require('../../prisma/prismaClient');

// =====================================================
// GET NOTIFICATION VISIBILITY
// =====================================================
// Determines which notifications the logged-in user
// should be able to see.
//
// Supports:
// - all
// - admin
// - staff
// - teacher
// - student
// - parent
// - class
// - section
// - individual
// =====================================================

const getNotificationVisibility = async (user) => {
  const {
    userId,
    tenantId,
    identity,
  } = user;

  const visibility = [
    // Notifications for everyone
    {
      audience: 'all',
    },

    // Notifications for the user's identity
    {
      audience: identity,
    },

    // Teachers are normally stored as "staff"
    // inside User.identity.
    ...(identity === 'staff'
      ? [
          {
            audience: 'teacher',
          },
        ]
      : []),

    // Direct notification for this user
    {
      audience: 'individual',
      userId,
    },
  ];

  // ===================================================
  // FIND PARENT'S STUDENTS
  // ===================================================

  if (identity === 'parent') {
    const parentStudents = await prisma.student.findMany({
      where: {
        tenantId,
        isDeleted: false,

        parents: {
          some: {
            user: {
              id: userId,
            },
          },
        },
      },

      select: {
        classId: true,
        sectionId: true,
      },
    });

    const classIds = parentStudents
      .map((student) => student.classId)
      .filter(Boolean);

    const sectionIds = parentStudents
      .map((student) => student.sectionId)
      .filter(Boolean);

    // Parent receives class notifications
    if (classIds.length > 0) {
      visibility.push({
        audience: 'class',
        classId: {
          in: classIds,
        },
      });
    }

    // Parent receives section notifications
    if (sectionIds.length > 0) {
      visibility.push({
        audience: 'section',
        sectionId: {
          in: sectionIds,
        },
      });
    }
  }

  return visibility;
};

// =====================================================
// GET LATEST NOTIFICATIONS
// =====================================================

const getNotifications = async (user) => {
  const {
    userId,
    tenantId,
  } = user;

  const visibility =
    await getNotificationVisibility(user);

  const notifications =
    await prisma.notification.findMany({
      where: {
        tenantId,
        isActive: true,

        OR: [
          {
            expiresAt: null,
          },
          {
            expiresAt: {
              gt: new Date(),
            },
          },
        ],

        AND: [
          {
            OR: visibility,
          },
        ],
      },

      orderBy: {
        createdAt: 'desc',
      },

      take: 10,

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

  return notifications.map((notification) => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    audience: notification.audience,
    classId: notification.classId,
    sectionId: notification.sectionId,
    userId: notification.userId,
    createdById: notification.createdById,
    createdAt: notification.createdAt,
    expiresAt: notification.expiresAt,

    isRead:
      notification.NotificationRead.length > 0,
  }));
};

// =====================================================
// GET ALL NOTIFICATIONS
// LAST 15 DAYS
// =====================================================

const getAllNotifications = async (user) => {
  const {
    userId,
    tenantId,
  } = user;

  const fifteenDaysAgo = new Date();

  fifteenDaysAgo.setDate(
    fifteenDaysAgo.getDate() - 15
  );

  const visibility =
    await getNotificationVisibility(user);

  const notifications =
    await prisma.notification.findMany({
      where: {
        tenantId,
        isActive: true,

        createdAt: {
          gte: fifteenDaysAgo,
        },

        OR: [
          {
            expiresAt: null,
          },
          {
            expiresAt: {
              gt: new Date(),
            },
          },
        ],

        AND: [
          {
            OR: visibility,
          },
        ],
      },

      orderBy: {
        createdAt: 'desc',
      },

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

  return notifications.map((notification) => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    audience: notification.audience,
    classId: notification.classId,
    sectionId: notification.sectionId,
    userId: notification.userId,
    createdById: notification.createdById,
    createdAt: notification.createdAt,
    expiresAt: notification.expiresAt,

    isRead:
      notification.NotificationRead.length > 0,
  }));
};

// =====================================================
// GET UNREAD COUNT
// =====================================================

const getUnreadCount = async (user) => {
  const {
    userId,
    tenantId,
  } = user;

  const visibility =
    await getNotificationVisibility(user);

  const count =
    await prisma.notification.count({
      where: {
        tenantId,
        isActive: true,

        OR: [
          {
            expiresAt: null,
          },
          {
            expiresAt: {
              gt: new Date(),
            },
          },
        ],

        AND: [
          {
            OR: visibility,
          },
        ],

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

const markAsRead = async (
  notificationId,
  user
) => {
  const {
    userId,
    tenantId,
  } = user;

  const id = parseInt(
    notificationId,
    10
  );

  if (Number.isNaN(id)) {
    return null;
  }

  const notification =
    await prisma.notification.findFirst({
      where: {
        id,
        tenantId,
        isActive: true,
      },
    });

  if (!notification) {
    return null;
  }

  return prisma.notificationRead.upsert({
    where: {
      notificationId_userId: {
        notificationId: notification.id,
        userId,
      },
    },

    update: {
      readAt: new Date(),
    },

    create: {
      tenantId,
      notificationId: notification.id,
      userId,
    },
  });
};

// =====================================================
// MARK ALL AS READ
// =====================================================

const markAllAsRead = async (user) => {
  const {
    userId,
    tenantId,
  } = user;

  const visibility =
    await getNotificationVisibility(user);

  const unreadNotifications =
    await prisma.notification.findMany({
      where: {
        tenantId,
        isActive: true,

        OR: [
          {
            expiresAt: null,
          },
          {
            expiresAt: {
              gt: new Date(),
            },
          },
        ],

        AND: [
          {
            OR: visibility,
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

  if (
    unreadNotifications.length === 0
  ) {
    return {
      markedCount: 0,
    };
  }

  await prisma.notificationRead.createMany({
    data: unreadNotifications.map(
      (notification) => ({
        tenantId,
        notificationId:
          notification.id,
        userId,
      })
    ),

    skipDuplicates: true,
  });

  return {
    markedCount:
      unreadNotifications.length,
  };
};

// =====================================================
// DELETE ONE NOTIFICATION
// =====================================================

const deleteNotification = async (
  notificationId,
  user
) => {
  const {
    userId,
    tenantId,
  } = user;

  const id = parseInt(
    notificationId,
    10
  );

  if (Number.isNaN(id)) {
    return null;
  }

  const visibility =
    await getNotificationVisibility(user);

  const notification =
    await prisma.notification.findFirst({
      where: {
        id,
        tenantId,
        isActive: true,

        OR: visibility,
      },
    });

  if (!notification) {
    return null;
  }

  await prisma.notification.update({
    where: {
      id,
    },

    data: {
      isActive: false,
    },
  });

  return {
    message:
      'Notification deleted successfully',
  };
};

// =====================================================
// DELETE ALL NOTIFICATIONS
// =====================================================

const deleteAllNotifications = async (
  user
) => {
  const {
    tenantId,
  } = user;

  const visibility =
    await getNotificationVisibility(user);

  const result =
    await prisma.notification.updateMany({
      where: {
        tenantId,
        isActive: true,

        OR: visibility,
      },

      data: {
        isActive: false,
      },
    });

  return {
    message:
      'All notifications deleted successfully',

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
  type = "general",
  priority = "normal",
  audience = "all",
  classId = null,
  sectionId = null,
  userId = null,
  createdById = null,
  expiresAt = null,
}) => {
  return prisma.notification.create({
    data: {
      tenantId,
      title,
      message,
      type,
      priority,
      audience,
      classId,
      sectionId,
      userId,
      createdById,
      expiresAt,
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