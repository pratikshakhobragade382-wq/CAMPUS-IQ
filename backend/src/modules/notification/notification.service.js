const prisma = require("../../prisma/prismaClient");

// =====================================================
// STUDENT NOTIFICATION RULES
// =====================================================

const STUDENT_BLOCKED_NOTIFICATION_TITLES = [
  "New Student Added",
  "New Staff Added",
  "New Teacher Added",
];

// =====================================================
// STUDENT NOTIFICATION FILTER
// =====================================================

function getStudentNotificationFilter() {
  return {
    NOT: {
      title: {
        in:
          STUDENT_BLOCKED_NOTIFICATION_TITLES,
      },
    },
  };
}

// =====================================================
// GET NOTIFICATION VISIBILITY
// =====================================================

const getNotificationVisibility =
  async (user) => {
    const {
      userId,
      tenantId,
      identity,
      studentId,
    } = user;

    const visibility = [];

    // =================================================
    // ALL
    // =================================================

    if (
      identity !== "student"
    ) {
      visibility.push({
        audience: "all",
      });
    }

    // =================================================
    // ROLE
    // =================================================

    if (
      identity !== "student"
    ) {
      visibility.push({
        audience: identity,
      });
    }

    // =================================================
    // TEACHER
    // =================================================

    if (
      identity === "staff" ||
      identity === "teacher"
    ) {
      visibility.push({
        audience: "teacher",
      });
    }

    // =================================================
    // DIRECT USER
    // =================================================

    if (
      identity !== "student"
    ) {
      visibility.push({
        audience:
          "individual",

        userId,
      });
    }

    // =================================================
    // STUDENT
    // =================================================

    if (
      identity === "student"
    ) {
      let student = null;

      const resolvedStudentId =
        studentId ||
        user.studentId ||
        user.student?.id;

      if (
        resolvedStudentId
      ) {
        const parsedStudentId =
          parseInt(
            resolvedStudentId,
            10
          );

        if (
          !Number.isNaN(
            parsedStudentId
          )
        ) {
          student =
            await prisma.student.findFirst(
              {
                where: {
                  id:
                    parsedStudentId,

                  tenantId,

                  isDeleted: false,
                },

                select: {
                  classId: true,
                  sectionId: true,
                },
              }
            );
        }
      }

      // -------------------------------------------------
      // FIND STUDENT BY EMAIL
      // -------------------------------------------------

      if (
        !student &&
        userId
      ) {
        const loggedInUser =
          await prisma.user.findUnique(
            {
              where: {
                id: userId,
              },

              select: {
                email: true,
              },
            }
          );

        if (
          loggedInUser?.email
        ) {
          student =
            await prisma.student.findFirst(
              {
                where: {
                  tenantId,

                  isDeleted: false,

                  OR: [
                    {
                      studentEmail: {
                        equals:
                          loggedInUser.email,

                        mode:
                          "insensitive",
                      },
                    },

                    {
                      communicationEmail:
                        {
                          equals:
                            loggedInUser.email,

                          mode:
                            "insensitive",
                        },
                    },
                  ],
                },

                select: {
                  classId: true,
                  sectionId: true,
                },
              }
            );
        }
      }

      const studentFilter =
        getStudentNotificationFilter();

      // -------------------------------------------------
      // SCHOOL WIDE
      // -------------------------------------------------

      visibility.push({
        audience: "all",

        ...studentFilter,
      });

      // -------------------------------------------------
      // GENERIC STUDENT
      // -------------------------------------------------

      visibility.push({
        audience: "student",

        classId: null,

        sectionId: null,

        ...studentFilter,
      });

      // -------------------------------------------------
      // CLASS
      // -------------------------------------------------

      if (
        student?.classId
      ) {
        visibility.push({
          audience: "student",

          classId:
            student.classId,

          sectionId: null,

          ...studentFilter,
        });

        visibility.push({
          audience: "class",

          classId:
            student.classId,

          ...studentFilter,
        });
      }

      // -------------------------------------------------
      // SECTION
      // -------------------------------------------------

      if (
        student?.classId &&
        student?.sectionId
      ) {
        visibility.push({
          audience: "student",

          classId:
            student.classId,

          sectionId:
            student.sectionId,

          ...studentFilter,
        });
      }

      // -------------------------------------------------
      // DIRECT STUDENT
      // -------------------------------------------------

      visibility.push({
        audience:
          "individual",

        userId,

        ...studentFilter,
      });
    }

    // =================================================
    // PARENT
    // =================================================

    if (
      identity === "parent"
    ) {
      const parentStudents =
        await prisma.student.findMany(
          {
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
          }
        );

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

      // =================================================
      // IMPORTANT:
      // DIRECT PARENT NOTIFICATIONS
      // =================================================
      //
      // This is what allows a fee payment notification
      // addressed specifically to this parent to appear
      // in the Parent Portal.
      //
      // =================================================

      visibility.push({
        audience:
          "individual",

        userId,
      });

      // =================================================
      // CLASS NOTIFICATIONS
      // =================================================

      if (
        classIds.length > 0
      ) {
        visibility.push({
          audience: "class",

          classId: {
            in: classIds,
          },
        });
      }

      // =================================================
      // STUDENT-TARGETED NOTIFICATIONS
      // =================================================

      if (
        sectionIds.length > 0
      ) {
        const studentVisibility =
          [
            {
              audience:
                "student",

              classId: null,

              sectionId: null,
            },

            ...classIds.map(
              (classId) => ({
                audience:
                  "student",

                classId,

                sectionId:
                  null,
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
                  audience:
                    "student",

                  classId:
                    student.classId,

                  sectionId:
                    student.sectionId,
                })
              ),
          ];

        visibility.push({
          OR:
            studentVisibility,
        });
      }
    }

    return visibility;
  };

// =====================================================
// GET NOTIFICATIONS
// =====================================================

const getNotifications =
  async (user) => {
    const {
      userId,
      tenantId,
    } = user;

    const visibility =
      await getNotificationVisibility(
        user
      );

    const notifications =
      await prisma.notification.findMany(
        {
          where: {
            tenantId,

            isActive: true,

            OR: [
              {
                expiresAt:
                  null,
              },

              {
                expiresAt: {
                  gt: new Date(),
                },
              },
            ],

            AND: [
              {
                OR:
                  visibility,
              },
            ],
          },

          orderBy: {
            createdAt:
              "desc",
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
        }
      );

    return notifications.map(
      (notification) => ({
        id:
          notification.id,

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
          notification
            .NotificationRead
            .length > 0,
      })
    );
  };

// =====================================================
// GET ALL NOTIFICATIONS
// =====================================================

const getAllNotifications =
  async (user) => {
    const {
      userId,
      tenantId,
    } = user;

    const fifteenDaysAgo =
      new Date();

    fifteenDaysAgo.setDate(
      fifteenDaysAgo.getDate() -
        15
    );

    const visibility =
      await getNotificationVisibility(
        user
      );

    const notifications =
      await prisma.notification.findMany(
        {
          where: {
            tenantId,

            isActive: true,

            createdAt: {
              gte:
                fifteenDaysAgo,
            },

            OR: [
              {
                expiresAt:
                  null,
              },

              {
                expiresAt: {
                  gt: new Date(),
                },
              },
            ],

            AND: [
              {
                OR:
                  visibility,
              },
            ],
          },

          orderBy: {
            createdAt:
              "desc",
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
        }
      );

    return notifications.map(
      (notification) => ({
        id:
          notification.id,

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
          notification
            .NotificationRead
            .length > 0,
      })
    );
  };

// =====================================================
// UNREAD COUNT
// =====================================================

const getUnreadCount =
  async (user) => {
    const {
      userId,
      tenantId,
    } = user;

    const visibility =
      await getNotificationVisibility(
        user
      );

    return prisma.notification.count(
      {
        where: {
          tenantId,

          isActive: true,

          OR: [
            {
              expiresAt:
                null,
            },

            {
              expiresAt: {
                gt: new Date(),
              },
            },
          ],

          AND: [
            {
              OR:
                visibility,
            },
          ],

          NotificationRead: {
            none: {
              userId,
            },
          },
        },
      }
    );
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

  const id =
    parseInt(
      notificationId,
      10
    );

  if (
    Number.isNaN(id)
  ) {
    return null;
  }

  const notification =
    await prisma.notification.findFirst(
      {
        where: {
          id,

          tenantId,

          isActive: true,
        },
      }
    );

  if (!notification) {
    return null;
  }

  return prisma.notificationRead.upsert(
    {
      where: {
        notificationId_userId: {
          notificationId:
            notification.id,

          userId,
        },
      },

      update: {
        readAt:
          new Date(),
      },

      create: {
        tenantId,

        notificationId:
          notification.id,

        userId,

        readAt:
          new Date(),
      },
    }
  );
};

// =====================================================
// MARK ALL AS READ
// =====================================================

const markAllAsRead =
  async (user) => {
    const {
      userId,
      tenantId,
    } = user;

    const visibility =
      await getNotificationVisibility(
        user
      );

    const unreadNotifications =
      await prisma.notification.findMany(
        {
          where: {
            tenantId,

            isActive: true,

            OR: [
              {
                expiresAt:
                  null,
              },

              {
                expiresAt: {
                  gt: new Date(),
                },
              },
            ],

            AND: [
              {
                OR:
                  visibility,
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
        }
      );

    if (
      unreadNotifications.length ===
      0
    ) {
      return {
        markedCount: 0,
      };
    }

    await prisma.notificationRead.createMany(
      {
        data:
          unreadNotifications.map(
            (
              notification
            ) => ({
              tenantId,

              notificationId:
                notification.id,

              userId,

              readAt:
                new Date(),
            })
          ),

        skipDuplicates:
          true,
      }
    );

    return {
      markedCount:
        unreadNotifications.length,
    };
  };

// =====================================================
// DELETE ONE
// =====================================================

const deleteNotification =
  async (
    notificationId,
    user
  ) => {
    const {
      tenantId,
    } = user;

    const id =
      parseInt(
        notificationId,
        10
      );

    if (
      Number.isNaN(id)
    ) {
      return null;
    }

    const visibility =
      await getNotificationVisibility(
        user
      );

    const notification =
      await prisma.notification.findFirst(
        {
          where: {
            id,

            tenantId,

            isActive: true,

            OR: visibility,
          },
        }
      );

    if (!notification) {
      return null;
    }

    await prisma.notification.update(
      {
        where: {
          id,
        },

        data: {
          isActive:
            false,
        },
      }
    );

    return {
      message:
        "Notification deleted successfully",
    };
  };

// =====================================================
// DELETE ALL
// =====================================================

const deleteAllNotifications =
  async (user) => {
    const {
      tenantId,
    } = user;

    const visibility =
      await getNotificationVisibility(
        user
      );

    const result =
      await prisma.notification.updateMany(
        {
          where: {
            tenantId,

            isActive: true,

            OR: visibility,
          },

          data: {
            isActive:
              false,
          },
        }
      );

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

const createNotification =
  async ({
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
    return prisma.notification.create(
      {
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
      }
    );
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