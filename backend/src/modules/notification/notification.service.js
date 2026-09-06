const prisma = require("../../prisma/prismaClient");

// =====================================================
// GET NOTIFICATION VISIBILITY
// =====================================================

const getNotificationVisibility = async (user) => {
  const {
    userId,
    tenantId,
    identity,
    studentId,
  } = user;

  const visibility = [];

  // ---------------------------------------------------
  // GENERAL "ALL" NOTIFICATIONS
  // ---------------------------------------------------
  //
  // Keep school-wide notifications visible.
  // The automatic "New Student Added" and
  // "New Teacher Added" notifications are removed
  // from their respective services.
  //
  visibility.push({
    audience: "all",
  });

  // ---------------------------------------------------
  // ROLE-BASED NOTIFICATIONS
  // ---------------------------------------------------

  if (identity !== "student") {
    visibility.push({
      audience: identity,
    });
  }

  // Teachers are commonly stored as "staff".
  if (
    identity === "staff" ||
    identity === "teacher"
  ) {
    visibility.push({
      audience: "teacher",
    });
  }

  // ---------------------------------------------------
  // DIRECT USER NOTIFICATION
  // ---------------------------------------------------

  visibility.push({
    audience: "individual",
    userId,
  });

  // ===================================================
  // STUDENT VISIBILITY
  // ===================================================

  if (identity === "student") {
    let student = null;

    // -------------------------------------------------
    // OPTION 1: studentId already exists in auth user
    // -------------------------------------------------

    const resolvedStudentId =
      studentId ||
      user.studentId ||
      user.student?.id;

    if (resolvedStudentId) {
      const parsedStudentId =
        parseInt(resolvedStudentId, 10);

      if (!Number.isNaN(parsedStudentId)) {
        student =
          await prisma.student.findFirst({
            where: {
              id: parsedStudentId,
              tenantId,
              isDeleted: false,
            },

            select: {
              classId: true,
              sectionId: true,
            },
          });
      }
    }

    // -------------------------------------------------
    // OPTION 2: find student by logged-in user email
    // -------------------------------------------------

    if (!student && userId) {
      const loggedInUser =
        await prisma.user.findUnique({
          where: {
            id: userId,
          },

          select: {
            email: true,
          },
        });

      if (loggedInUser?.email) {
        student =
          await prisma.student.findFirst({
            where: {
              tenantId,
              isDeleted: false,

              OR: [
                {
                  studentEmail: {
                    equals:
                      loggedInUser.email,
                    mode: "insensitive",
                  },
                },

                {
                  communicationEmail: {
                    equals:
                      loggedInUser.email,
                    mode: "insensitive",
                  },
                },
              ],
            },

            select: {
              classId: true,
              sectionId: true,
            },
          });
      }
    }

    // -------------------------------------------------
    // GENERIC STUDENT NOTIFICATION
    // -------------------------------------------------
    //
    // Only notifications without class/section
    // restrictions are visible to every student.
    //
    // Example:
    //
    // audience = student
    // classId = null
    // sectionId = null
    //
    // -------------------------------------------------

    const studentVisibility = [
      {
        audience: "student",
        classId: null,
        sectionId: null,
      },
    ];

    // -------------------------------------------------
    // CLASS TARGETING
    // -------------------------------------------------

    if (student?.classId) {
      studentVisibility.push({
        audience: "student",
        classId: student.classId,
        sectionId: null,
      });
    }

    // -------------------------------------------------
    // CLASS + SECTION TARGETING
    // -------------------------------------------------

    if (
      student?.classId &&
      student?.sectionId
    ) {
      studentVisibility.push({
        audience: "student",
        classId: student.classId,
        sectionId: student.sectionId,
      });
    }

    visibility.push({
      OR: studentVisibility,
    });
  }

  // ===================================================
  // PARENT VISIBILITY
  // ===================================================

  if (identity === "parent") {
    const parentStudents =
      await prisma.student.findMany({
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

    const classIds =
      parentStudents
        .map(
          (student) =>
            student.classId
        )
        .filter(Boolean);

    const sectionIds =
      parentStudents
        .map(
          (student) =>
            student.sectionId
        )
        .filter(Boolean);

    // Parent can receive class notifications.
    if (classIds.length > 0) {
      visibility.push({
        audience: "class",
        classId: {
          in: classIds,
        },
      });
    }

    // Parent can receive section notifications.
    if (sectionIds.length > 0) {
      visibility.push({
        audience: "section",
        sectionId: {
          in: sectionIds,
        },
      });

      // Parent can also receive student-targeted
      // notifications for the student's class/section.
      visibility.push({
        OR: [
          {
            audience: "student",
            classId: null,
            sectionId: null,
          },

          ...classIds.map(
            (classId) => ({
              audience: "student",
              classId,
              sectionId: null,
            })
          ),

          ...parentStudents
            .filter(
              (student) =>
                student.classId &&
                student.sectionId
            )
            .map(
              (student) => ({
                audience: "student",
                classId:
                  student.classId,
                sectionId:
                  student.sectionId,
              })
            ),
        ],
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
        createdAt: "desc",
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

  return notifications.map(
    (notification) => ({
      id: notification.id,

      title:
        notification.title,

      message:
        notification.message,

      type:
        notification.type,

      priority:
        notification.priority,

      audience:
        notification.audience,

      classId:
        notification.classId,

      sectionId:
        notification.sectionId,

      userId:
        notification.userId,

      createdById:
        notification.createdById,

      createdAt:
        notification.createdAt,

      expiresAt:
        notification.expiresAt,

      isRead:
        notification.NotificationRead
          .length > 0,
    })
  );
};

// =====================================================
// GET ALL NOTIFICATIONS
// =====================================================

const getAllNotifications = async (user) => {
  const {
    userId,
    tenantId,
  } = user;

  const fifteenDaysAgo =
    new Date();

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
        createdAt: "desc",
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

  return notifications.map(
    (notification) => ({
      id: notification.id,

      title:
        notification.title,

      message:
        notification.message,

      type:
        notification.type,

      priority:
        notification.priority,

      audience:
        notification.audience,

      classId:
        notification.classId,

      sectionId:
        notification.sectionId,

      userId:
        notification.userId,

      createdById:
        notification.createdById,

      createdAt:
        notification.createdAt,

      expiresAt:
        notification.expiresAt,

      isRead:
        notification.NotificationRead
          .length > 0,
    })
  );
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

  return prisma.notification.count({
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
};

// =====================================================
// MARK ONE AS READ
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
        notificationId:
          notification.id,

        userId,
      },
    },

    update: {
      readAt: new Date(),
    },

    create: {
      tenantId,

      notificationId:
        notification.id,

      userId,

      readAt: new Date(),
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
    data:
      unreadNotifications.map(
        (notification) => ({
          tenantId,

          notificationId:
            notification.id,

          userId,

          readAt: new Date(),
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
      "Notification deleted successfully",
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
      "All notifications deleted successfully",

    deletedCount:
      result.count,
  };
};

// =====================================================
// CREATE NOTIFICATION
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